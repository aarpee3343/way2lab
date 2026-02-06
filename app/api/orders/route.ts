export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';
import { OrderStatus } from '@prisma/client';

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
  const limit = parseInt(searchParams.get('limit') || '10');
  const page = parseInt(searchParams.get('page') || '1');
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
    const { labId, items, patientDetails, addressId, schedule, paymentMode, paymentStatus, totals, couponCode } = body;

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

    // Coupon Lookup
    let couponId: number | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon) couponId = coupon.id;
    }

    // Generate Order Number
    const prefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const count = await prisma.order.count();
    const orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;

    // Transaction
    const primaryPackageId =
      packageItems.length === 1 ? Number(packageItems[0].id) : null;

    let resolvedHomeCollection = Number(totals.homeCollection || 0);
    let resolvedFinalAmount = Number(totals.final || 0);
    let resolvedPaymentMode = paymentMode;
    let resolvedPaymentStatus = paymentStatus || null;

    if (isCorporateBenefitOnlyOrder) {
      resolvedFinalAmount = Math.max(0, resolvedFinalAmount - resolvedHomeCollection);
      resolvedHomeCollection = 0;
    }

    if (corporatePaysForBenefit) {
      resolvedFinalAmount = 0;
      resolvedHomeCollection = 0;
      resolvedPaymentMode = 'Corporate Credit';
      resolvedPaymentStatus = 'CORPORATE_BILLING';
    }

    const order = await prisma.$transaction(async (tx) => {
      // Backfill Self Data
      let { dob: patientDob, gender: patientGender, uhid: patientUHID } = patientDetails;
      
      if (patientDetails.type === 'self') {
        const customer = await tx.customer.findUnique({ where: { id: user.id } });
        patientDob = patientDob || customer?.dateOfBirth;
        patientGender = patientGender || customer?.gender;
        patientUHID = patientUHID || customer?.uhid;
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

          totalAmount: Number(totals.subtotal),
          discountAmount: Number(totals.discount),
          homeCollectionCharges: resolvedHomeCollection,
          finalAmount: resolvedFinalAmount,
          
          couponId,
          paymentMode: resolvedPaymentMode,
          paymentStatus: resolvedPaymentStatus,
          status: 'PENDING',

          items: {
            create: items.map((item: any) => ({
              itemType: item.type,
              itemName: item.name,
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

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      data: order
    }, { status: 201 });

  } catch (error: any) {
    console.error("Order Create Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
