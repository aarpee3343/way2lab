export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';

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
    if (!items?.length) return NextResponse.json({ success: false, message: 'No items' }, { status: 400 });
    if (!patientDetails?.name) return NextResponse.json({ success: false, message: 'Invalid patient' }, { status: 400 });

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
          homeCollectionCharges: Number(totals.homeCollection),
          finalAmount: Number(totals.final),
          
          couponId,
          paymentMode,
          paymentStatus: paymentStatus || null,
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
