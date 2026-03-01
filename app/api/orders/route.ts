export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';
import { OrderStatus } from '@prisma/client';
import { generateOrderNumber } from '@/lib/utils/generators';
import { applyCouponDiscount, toMoney } from '@/lib/pricing';
import { getIdempotentResponse, storeIdempotentResponse } from '@/lib/idempotency';
import { debitWallet } from '@/lib/wallet';

const normalizeGender = (input?: string | null): string => {
  if (!input) return 'Other';
  const upper = input.toUpperCase();
  if (upper.startsWith('M')) return 'Male';
  if (upper.startsWith('F')) return 'Female';
  return 'Other';
};


// 1. GET ORDERS (List)
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const skip = (page - 1) * limit;

  try {
    const where: any = { userId: user.id };
    if (status && status !== 'ALL') where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { take: 3 },
          lab: { select: { labName: true, address: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching orders' }, { status: 500 });
  }
}

// 2. CREATE ORDER
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const idempotencyKeyHeader = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || '';
    const idempotencyKeyBody = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '';
    const idempotencyKey = String(idempotencyKeyHeader || idempotencyKeyBody || '').trim();
    const idempotencyRoute = '/api/orders';
    const idempotencyMethod = 'POST';

    if (idempotencyKey) {
      const existing = await getIdempotentResponse(idempotencyKey, idempotencyRoute, idempotencyMethod, user.id);
      if (existing) {
        return NextResponse.json(existing.responseBody, { status: existing.responseCode });
      }
    }

    const { labId, items, patientDetails, addressId, schedule, paymentMode, paymentStatus, couponCode } = body;
    const walletAmountToUse = Math.max(0, Number(body?.walletAmountToUse || 0));

    // Basic Validation
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No items' }, { status: 400 });
    }
    if (!patientDetails?.name) return NextResponse.json({ success: false, message: 'Invalid patient' }, { status: 400 });

    // Fetch corporate context (if any)
    const dbUser = await prisma.customer.findUnique({
      where: { id: user.id },
      select: { corporateId: true }
    });
    const corporateId = dbUser?.corporateId ?? null;

    const patientTypeKey = patientDetails?.type === 'family' ? 'family' : 'self';
    let hasCorporatePackageBenefit = false;
    let hasNonCorporatePackageItem = false;
    let hasCorporatePaymentDecision = false;
    let corporatePaysForAll = true;

    // Corporate usage/eligibility checks for package benefits
    const packageItems = (items || []).filter((i: any) => i.type === 'package');
    if (corporateId && packageItems.length > 0) {
      const packageIds = packageItems.map((i: any) => Number(i.id)).filter((id: number) => Number.isFinite(id));
      const packages = await prisma.package.findMany({
        where: { id: { in: packageIds } },
        select: { id: true, isCorporate: true, corporateId: true }
      });
      const packageMap = new Map(packages.map(p => [p.id, p]));
      const now = new Date();

      for (const item of packageItems) {
        const packageId = Number(item.id);
        const pkg = packageMap.get(packageId);
        if (!pkg || !pkg.isCorporate || pkg.corporateId !== corporateId) {
          hasNonCorporatePackageItem = true;
          continue;
        }
        hasCorporatePackageBenefit = true;

        const service = await prisma.corporateService.findFirst({
          where: {
            corporateId,
            packageId,
            isActive: true,
            validFrom: { lte: now },
            validTill: { gte: now }
          },
          select: {
            selfUsageLimit: true,
            familyUsageLimit: true,
            selfPaymentType: true,
            familyPaymentType: true
          }
        });

        if (!service) {
          return NextResponse.json(
            { success: false, message: 'This package is not active for your corporate plan.' },
            { status: 403 }
          );
        }

        // If specific assignments exist, ensure this employee is assigned
        const assignmentCount = await prisma.employeePackage.count({
          where: { packageId, customer: { corporateId } }
        });
        if (assignmentCount > 0) {
          const assigned = await prisma.employeePackage.findFirst({
            where: { packageId, customerId: user.id }
          });
          if (!assigned) {
            return NextResponse.json(
              { success: false, message: 'This package is not assigned to your profile.' },
              { status: 403 }
            );
          }
        }

        const limit =
          patientTypeKey === 'self'
            ? Number(service.selfUsageLimit || 0)
            : Number(service.familyUsageLimit || 0);

        const paymentTypeForItem =
          patientTypeKey === 'self'
            ? service.selfPaymentType
            : service.familyPaymentType;
        hasCorporatePaymentDecision = true;
        if (paymentTypeForItem !== 'CORPORATE_PAYS') {
          corporatePaysForAll = false;
        }

        if (limit <= 0) {
          return NextResponse.json(
            { success: false, message: 'This benefit is not available for the selected patient type.' },
            { status: 403 }
          );
        }

        const usedCount = await prisma.order.count({
          where: {
            userId: user.id,
            packageId,
            patientType: patientTypeKey,
            status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
          }
        });

        if (usedCount >= limit) {
          return NextResponse.json(
            { success: false, message: 'Usage limit reached for this benefit.' },
            { status: 403 }
          );
        }
      }
    }

    const isCorporateBenefitOnlyOrder =
      items.every((i: any) => i.type === 'package') &&
      packageItems.length === items.length &&
      hasCorporatePackageBenefit &&
      !hasNonCorporatePackageItem;

    const corporatePaysForBenefit =
      isCorporateBenefitOnlyOrder && hasCorporatePaymentDecision && corporatePaysForAll;

    const normalizedItems = (items || [])
      .map((item: any) => ({
        id: Number(item.id),
        type: item.type === 'package' ? 'package' : 'test',
        name: String(item.name || ''),
      }))
      .filter((item: any) => Number.isFinite(item.id));

    const selectedLabId = labId ? Number(labId) : null;
    const testIds = Array.from(new Set(normalizedItems.filter((i: any) => i.type === 'test').map((i: any) => i.id)));
    const packageIds = Array.from(new Set(normalizedItems.filter((i: any) => i.type === 'package').map((i: any) => i.id)));

    const [labTests, labPackages, baseTests, basePackages, selectedLab] = await Promise.all([
      selectedLabId && testIds.length
        ? prisma.labTest.findMany({
            where: { labId: selectedLabId, testId: { in: testIds }, available: true },
            select: { id: true, testId: true, price: true, discount: true },
          })
        : Promise.resolve([]),
      selectedLabId && packageIds.length
        ? prisma.labPackage.findMany({
            where: { labId: selectedLabId, packageId: { in: packageIds }, available: true, package: { isActive: true } },
            select: { id: true, packageId: true, price: true, discount: true },
          })
        : Promise.resolve([]),
      testIds.length
        ? prisma.test.findMany({
            where: { id: { in: testIds }, isActive: true },
            select: { id: true, price: true, discount: true, testName: true },
          })
        : Promise.resolve([]),
      packageIds.length
        ? prisma.package.findMany({
            where: { id: { in: packageIds }, isActive: true },
            select: { id: true, price: true, discount: true, packageName: true },
          })
        : Promise.resolve([]),
      selectedLabId ? prisma.lab.findUnique({ where: { id: selectedLabId }, select: { homeCollectionCharges: true } }) : Promise.resolve(null),
    ]);

    const labTestMap = new Map(labTests.map((t) => [t.testId, t]));
    const labPackageMap = new Map(labPackages.map((p) => [p.packageId, p]));
    const testMap = new Map(baseTests.map((t) => [t.id, t]));
    const packageMap = new Map(basePackages.map((p) => [p.id, p]));

    const pricedItems = normalizedItems.map((item: any) => {
      let basePrice = 0;
      let discount = 0;
      let itemName = item.name;

      if (item.type === 'test') {
        const labMatch = labTestMap.get(item.id);
        const base = testMap.get(item.id);
        if (labMatch) {
          basePrice = Number(labMatch.price || 0);
          discount = Number(labMatch.discount || 0);
        } else if (base) {
          basePrice = Number(base.price || 0);
          discount = Number(base.discount || 0);
          itemName = base.testName || itemName;
        }
      } else {
        const labMatch = labPackageMap.get(item.id);
        const base = packageMap.get(item.id);
        if (labMatch) {
          basePrice = Number(labMatch.price || 0);
          discount = Number(labMatch.discount || 0);
        } else if (base) {
          basePrice = Number(base.price || 0);
          discount = Number(base.discount || 0);
          itemName = base.packageName || itemName;
        }
      }

      const price = toMoney(basePrice * (1 - discount / 100));

      return {
        ...item,
        itemName,
        basePrice: toMoney(basePrice),
        discount: toMoney(discount),
        price: price < 0 ? 0 : price,
      };
    });

    const invalidPricedItem = pricedItems.find((item: any) => item.basePrice <= 0);
    if (invalidPricedItem) {
      return NextResponse.json(
        { success: false, message: `Unable to resolve pricing for ${invalidPricedItem.type} ${invalidPricedItem.id}` },
        { status: 400 }
      );
    }

    const computedBaseTotal = toMoney(pricedItems.reduce((sum, item) => sum + item.basePrice, 0));
    const computedNetTotal = toMoney(pricedItems.reduce((sum, item) => sum + item.price, 0));
    const computedItemDiscount = toMoney(computedBaseTotal - computedNetTotal);

    // Coupon Lookup and validation
    let couponId: number | null = null;
    let couponDiscountAmount = 0;
    if (couponCode) {
      const now = new Date();
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && new Date(coupon.startDate) <= now && (!coupon.expiryDate || new Date(coupon.expiryDate) >= now)) {
        couponId = coupon.id;
        couponDiscountAmount = applyCouponDiscount(computedNetTotal, {
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue || 0),
          minOrderValue: Number(coupon.minOrderValue || 0),
          maxDiscountAmount: Number(coupon.maxDiscountAmount || 0),
        });
      }
    }

    const orderCategory =
      schedule?.type === 'onsite'
        ? 'ONSITE'
        : corporateId
          ? 'CORPORATE'
          : 'GENERAL';

    // Transaction
    const primaryPackageId =
      packageItems.length === 1 ? Number(packageItems[0].id) : null;

    let resolvedHomeCollection =
      schedule?.type === 'home_collection'
        ? Number(selectedLab?.homeCollectionCharges || 0)
        : 0;
    let resolvedDiscountAmount = toMoney(computedItemDiscount + couponDiscountAmount);
    let resolvedFinalAmount = toMoney(computedBaseTotal - resolvedDiscountAmount + resolvedHomeCollection);
    let resolvedPaymentMode = paymentMode;
    let resolvedPaymentStatus = paymentStatus || null;

    if (isCorporateBenefitOnlyOrder) {
      resolvedFinalAmount = Math.max(0, resolvedFinalAmount - resolvedHomeCollection);
      resolvedHomeCollection = 0;
    }

    if (corporatePaysForBenefit) {
      resolvedFinalAmount = 0;
      resolvedHomeCollection = 0;
      resolvedDiscountAmount = computedBaseTotal;
      resolvedPaymentMode = 'Corporate Credit';
      resolvedPaymentStatus = 'CORPORATE_BILLING';
    }

    const requestedWalletAmount = corporatePaysForBenefit || resolvedFinalAmount <= 0
      ? 0
      : Math.min(walletAmountToUse, resolvedFinalAmount);

    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber({ category: orderCategory, tx });

      // Backfill Self Data
      let { dob: patientDob, gender: patientGender, uhid: patientUHID } = patientDetails;
      
      if (patientDetails.type === 'self') {
        const customer = await tx.customer.findUnique({ where: { id: user.id } });
        patientDob = patientDob || customer?.dateOfBirth;
        patientGender = patientGender || customer?.gender;
        patientUHID = patientUHID || customer?.uhid;
      }

      const walletAmountUsed = requestedWalletAmount > 0
        ? toMoney(requestedWalletAmount)
        : 0;

      if (!corporatePaysForBenefit) {
        if (resolvedFinalAmount <= 0) {
          resolvedPaymentMode = 'No Payment Required';
          resolvedPaymentStatus = 'Paid';
        } else if (walletAmountUsed >= resolvedFinalAmount) {
          resolvedPaymentMode = 'Wallet';
          resolvedPaymentStatus = 'Paid';
        } else if (walletAmountUsed > 0) {
          resolvedPaymentMode = 'Wallet + Pay Upon Service';
          resolvedPaymentStatus = 'Partial';
        } else {
          resolvedPaymentStatus = resolvedPaymentStatus || 'Pending';
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          labId: labId ? Number(labId) : null,
          addressId: addressId ? Number(addressId) : null,
          packageId: Number.isFinite(primaryPackageId) ? primaryPackageId : null,
          
          patientName: patientDetails.name,
          patientDob: patientDob ? new Date(patientDob) : null,
          patientGender: normalizeGender(patientGender),
          patientPhone: patientDetails.phone || null,
          patientUHID: patientUHID || null,
          patientType: patientDetails.type === 'family' ? 'family' : 'self',
          patientRelation: patientDetails.relation || null,

          collectionType: schedule.type,
          preferredDate: new Date(schedule.date),
          preferredTimeSlot: schedule.time,

          totalAmount: computedBaseTotal,
          discountAmount: resolvedDiscountAmount,
          homeCollectionCharges: resolvedHomeCollection,
          finalAmount: resolvedFinalAmount,
          walletAmountUsed,
          
          couponId,
          paymentMode: resolvedPaymentMode,
          paymentStatus: resolvedPaymentStatus,
          status: 'PENDING',

          items: {
            create: pricedItems.map((item: any) => ({
              itemType: item.type,
              itemName: item.itemName,
              basePrice: Number(item.basePrice),
              price: Number(item.price),
              discount: Number(item.discount || 0),
              testId: item.type === 'test' ? Number(item.id) : null,
              packageId: item.type === 'package' ? Number(item.id) : null
            }))
          }
        },
        include: { items: true }
      });

      if (walletAmountUsed > 0) {
        await debitWallet(tx, {
          customerId: user.id,
          amount: walletAmountUsed,
          sourceType: 'ORDER_PAYMENT',
          description: `Wallet used for order ${orderNumber}`,
          orderId: newOrder.id,
          metadata: {
            orderNumber
          }
        });

        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            amount: walletAmountUsed,
            method: 'Wallet',
            status: 'verified',
            paymentType: 'WALLET_PAYMENT',
            notes: `Wallet payment applied during checkout for ${orderNumber}`
          }
        });
      }

      // Update Coupon Usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: { increment: 1 },
            couponUsage: {
              create: { customerId: user.id, usedAt: new Date() }
            }
          }
        });
      }

      return newOrder;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    try {
      // Priority: 1. Patient Phone (from form), 2. User Registered Phone
      const mobileToSend = patientDetails.phone || (await prisma.customer.findUnique({ 
          where: { id: user.id },
          select: { phone: true } 
      }))?.phone;
      
      if (mobileToSend) {
        const orderRef = order.orderNumber || String(order.id);
        // Run without awaiting to keep response fast
        sendSMS(mobileToSend, 'ORDER_PLACED', [orderRef]).catch(e => console.error(e));
      }
    } catch (smsError) {
      console.error("Failed to send Order SMS:", smsError);
    }

    const responsePayload = {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      data: order
    };

    if (idempotencyKey) {
      await storeIdempotentResponse({
        key: idempotencyKey,
        route: idempotencyRoute,
        method: idempotencyMethod,
        userId: user.id,
        responseCode: 201,
        responseBody: responsePayload,
      });
    }

    return NextResponse.json(responsePayload, { status: 201 });

  } catch (error: any) {
    console.error("Order Create Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
