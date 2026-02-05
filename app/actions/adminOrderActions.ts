'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { prisma } from '@/lib/db';
import { sendSMS } from '@/lib/sms';
import bcrypt from 'bcryptjs';
import {
  generateOrderNumber,
  generateCustomerUHID
} from '@/lib/utils/generators';

/* ---------------------------------------------------
   1. Check Customer & Fetch Addresses
--------------------------------------------------- */
export async function checkCustomerAction(phone: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const customer = await prisma.customer.findFirst({
    where: { phone },
    include: { addresses: true }
  });

  if (!customer) return { found: false };

  // Calculate Age from DOB
  let age = 0;
  if (customer.dateOfBirth) {
    const diff = Date.now() - new Date(customer.dateOfBirth).getTime();
    age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  return {
    found: true,
    data: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      gender: customer.gender,
      dob: customer.dateOfBirth?.toISOString().split('T')[0],
      age,
      addresses: customer.addresses
    }
  };
}

/* ---------------------------------------------------
   1b. Corporate Helpers (Admin Booking)
--------------------------------------------------- */
export async function getActiveCorporatesForOrder() {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const corporates = await prisma.corporate.findMany({
    where: { isActive: true },
    orderBy: { companyName: 'asc' },
    select: {
      id: true,
      companyName: true,
      contactPerson: true
    }
  });

  return corporates;
}

export async function getCorporateEmployeesForOrder(
  corporateId: number,
  search?: string
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!corporateId) return [];

  const where: any = { corporateId, isActive: true };
  const trimmed = search?.trim();
  if (trimmed) {
    where.OR = [
      { name: { contains: trimmed, mode: 'insensitive' } },
      { email: { contains: trimmed, mode: 'insensitive' } },
      { phone: { contains: trimmed, mode: 'insensitive' } },
      { employeeId: { contains: trimmed, mode: 'insensitive' } }
    ];
  }

  const employees = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeId: true,
      department: true,
      location: true,
      isActive: true
    }
  });

  return employees;
}

export async function getCorporateEmployeeDetailsForOrder(
  customerId: number,
  corporateId?: number
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (!customerId) return { found: false };

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      ...(corporateId ? { corporateId } : {})
    },
    include: { addresses: true }
  });

  if (!customer) return { found: false };

  let age = 0;
  if (customer.dateOfBirth) {
    const diff = Date.now() - new Date(customer.dateOfBirth).getTime();
    age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  return {
    found: true,
    data: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gender: customer.gender,
      dob: customer.dateOfBirth?.toISOString().split('T')[0],
      age,
      addresses: customer.addresses,
      employeeId: customer.employeeId,
      department: customer.department,
      location: customer.location
    }
  };
}

/* ---------------------------------------------------
   2. Search Tests (Pincode + Optional Lab Lock)
--------------------------------------------------- */
export async function searchAdminTestsAction(
  query: string,
  pincode: string,
  lockedLabId?: number,
  corporateId?: number
) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  if (query.length < 2) return [];

  // Find labs servicing this pincode
  const serviceableLabs = await prisma.labPincode.findMany({
    where: { pincode },
    select: { labId: true }
  });

  // Extract IDs
  const validLabIds = serviceableLabs.map(l => l.labId);
  
  if (validLabIds.length === 0) return []; // No labs in this area

  // If cart is locked to a specific lab, check if it's still valid
  let targetLabIds = validLabIds;
  if (lockedLabId) {
    if (validLabIds.includes(lockedLabId)) {
      targetLabIds = [lockedLabId];
    } else {
      return []; // Locked lab doesn't service this new pincode
    }
  }

  // Search Tests with additional filters from code-2
  const tests = await prisma.labTest.findMany({
    where: {
      labId: { in: targetLabIds },
      available: true,
      test: {
        testName: { contains: query, mode: 'insensitive' },
        isActive: true // ✅ Added from code-2: Ensure global test is active
      },
      lab: { activeStatus: true } // ✅ Added from code-2: Ensure lab is active
    },
    include: {
      test: true,
      lab: true
    },
    take: 10
  });

  const now = new Date();
  const packageWhere: any = {
    labId: { in: targetLabIds },
    available: true,
    package: {
      packageName: { contains: query, mode: 'insensitive' },
      isActive: true
    },
    lab: { activeStatus: true }
  };

  if (corporateId) {
    packageWhere.package = {
      ...packageWhere.package,
      isCorporate: true,
      corporateId,
      corporateServices: {
        some: {
          corporateId,
          isActive: true,
          validFrom: { lte: now },
          validTill: { gte: now }
        }
      }
    };
  }

  const packages = await prisma.labPackage.findMany({
    where: packageWhere,
    include: {
      package: corporateId
        ? {
            include: {
              corporateServices: {
                where: {
                  corporateId,
                  isActive: true,
                  validFrom: { lte: now },
                  validTill: { gte: now }
                },
                take: 1
              }
            }
          }
        : true,
      lab: true
    },
    take: 10
  });

  const mappedTests = tests.map(t => ({
    id: t.testId,
    name: t.test.testName,
    type: 'test',
    labId: t.labId,
    labName: t.lab.labName,
    mrp: Number(t.price),
    discount: Number(t.discount),
    price: Number(t.price) - (Number(t.price) * (Number(t.discount) / 100)),
    homeCollectionCharges: Number(t.lab.homeCollectionCharges || 0)
  }));

  const mappedPackages = packages.map(p => {
    const mrp = Number(p.price);
    const discount = Number(p.discount || 0);
    const sellingPrice = mrp - (mrp * (discount / 100));
    const pkg: any = p.package as any;
    const service = corporateId ? pkg?.corporateServices?.[0] : null;
    const paymentType = service?.selfPaymentType || null;
    const corporateCovered = paymentType === 'CORPORATE_PAYS';

    return {
      id: p.packageId,
      name: pkg?.packageName,
      type: 'package',
      labId: p.labId,
      labName: p.lab.labName,
      mrp,
      discount,
      price: corporateCovered ? 0 : sellingPrice,
      sellingPrice,
      paymentType,
      corporateCovered,
      homeCollectionCharges: Number(p.lab.homeCollectionCharges || 0)
    };
  });

  return [...mappedTests, ...mappedPackages];
}

/* ---------------------------------------------------
   3. Place Admin Order (Transaction Safe)
--------------------------------------------------- */
export async function placeAdminOrderAction(data: any) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    return await prisma.$transaction(async (tx) => {
      let customerId = data.customerId;
      const subtotal = Number(data.subtotal) || 0;
      const homeCharges = Number(data.homeCharges) || 0;
      const couponCode = typeof data.couponCode === 'string' ? data.couponCode.trim() : '';

      /* ---------- A. Customer ---------- */
      if (!customerId) {
        const uhid = await generateCustomerUHID();
        const passwordSeed = Math.random().toString(36).slice(-10) + Date.now();
        const hashedPassword = await bcrypt.hash(passwordSeed, 10);
        const email = typeof data.email === 'string' && data.email.trim() ? data.email.trim() : null;

        const customer = await tx.customer.create({
          data: {
            name: data.name,
            phone: data.phone,
            email,
            gender: data.gender,
            dateOfBirth: data.dob ? new Date(data.dob) : null,
            uhid,
            password: hashedPassword,
          },
        });

        customerId = customer.id;
      }

      /* ---------- B. Address ---------- */
      let addressId = data.existingAddressId;

      if (!addressId) {
        const address = await tx.customerAddress.create({
          data: {
            customerId,
            addressLine1: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            type: 'Other',
          },
        });

        addressId = address.id;
      }

      /* ---------- C. Order ---------- */
      const orderNumber = await generateOrderNumber();

      let couponId: number | null = null;
      let discountAmount = 0;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !coupon.isActive) {
          throw new Error('Invalid or inactive coupon');
        }

        const now = new Date();
        if ((coupon.expiryDate && new Date(coupon.expiryDate) < now) || (new Date(coupon.startDate) > now)) {
          throw new Error('Coupon is not valid at this time');
        }

        const minOrderVal = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
        if (subtotal < minOrderVal) {
          throw new Error(`Minimum order value of ₹${minOrderVal} required`);
        }

        const discountVal = Number(coupon.discountValue);
        const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : 0;

        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * discountVal) / 100;
          if (maxDiscount > 0 && discountAmount > maxDiscount) discountAmount = maxDiscount;
        } else {
          discountAmount = discountVal;
        }

        if (discountAmount > subtotal) discountAmount = subtotal;
        couponId = coupon.id;
      }

      const finalAmount = subtotal + homeCharges - discountAmount;
      const associateId = data.associateId ? Number(data.associateId) : null;

      const parsedPackageId = Number(data.packageId);
      const safePackageId =
        Number.isInteger(parsedPackageId) && parsedPackageId > 0
          ? parsedPackageId
          : null;

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: customerId,
          labId: data.labId,
          addressId,
          packageId: safePackageId,

          // Financials
          totalAmount: subtotal,
          discountAmount,
          homeCollectionCharges: homeCharges,
          finalAmount,
          couponId,

          // Payment / status
          paymentMode: data.paymentMode,
          status: 'PENDING',
          bookingSource: 'Admin',

          // Schedule
          collectionType: data.collectionType,
          preferredDate: new Date(data.date),
          preferredTimeSlot: data.time,

          // Associate
          associateId: Number.isFinite(associateId) ? associateId : null,

          // Instructions
          collectionInstructions: data.instructions || '',

          // Patient
          patientName: data.name,
          patientDob: data.dob ? new Date(data.dob) : null,
          patientGender: data.gender,
          patientPhone: data.phone,
        },
      });

      /* ---------- D. Order Items ---------- */
      for (const item of data.items) {
        const itemType = item.type === 'package' ? 'package' : 'test';
        const basePrice = Number(item.mrp ?? item.basePrice ?? item.price ?? 0);
        const price = Number(item.price ?? basePrice);
        const discount = Number(item.discount ?? 0);
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemType,
            testId: itemType === 'test' ? item.id : null,
            packageId: itemType === 'package' ? item.id : null,
            isPackage: itemType === 'package',
            itemName: item.name,
            basePrice,
            price,
            discount
          },
        });
      }

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: { increment: 1 },
            couponUsage: {
              create: { customerId }
            }
          }
        });
      }

      /* ---------- E. SMS Notification (UPDATED) ---------- */
      try {
        await sendSMS(
          data.phone,
          'ORDER_PLACED',
          [orderNumber] // template variables
        );
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Do NOT rollback transaction for SMS failure
      }

      return {
        success: true,
        orderId: order.id,
        orderNumber,
      };
    });
  } catch (error: any) {
    console.error('Order Creation Error:', error);
    return {
      success: false,
      error: error.message || 'Order creation failed',
    };
  }
}
