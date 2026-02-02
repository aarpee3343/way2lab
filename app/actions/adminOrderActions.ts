'use server';

import { prisma } from '@/lib/db';
import { sendSMS } from '@/lib/sms';
import {
  generateOrderNumber,
  generateCustomerUHID
} from '@/lib/utils/generators';

/* ---------------------------------------------------
   1. Check Customer & Fetch Addresses
--------------------------------------------------- */
export async function checkCustomerAction(phone: string) {
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
   2. Search Tests (Pincode + Optional Lab Lock)
--------------------------------------------------- */
export async function searchAdminTestsAction(
  query: string,
  pincode: string,
  lockedLabId?: number
) {
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

  return tests.map(t => ({
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
}

/* ---------------------------------------------------
   3. Place Admin Order (Transaction Safe)
--------------------------------------------------- */
export async function placeAdminOrderAction(data: any) {
  try {
    return await prisma.$transaction(async (tx) => {
      let customerId = data.customerId;

      /* ---------- A. Customer ---------- */
      if (!customerId) {
        const uhid = await generateCustomerUHID();

        const customer = await tx.customer.create({
          data: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            gender: data.gender,
            dateOfBirth: new Date(data.dob),
            uhid,
            password: 'hashed_default_password', // replace with real hashing
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

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: customerId,
          labId: data.labId,
          addressId,

          // Financials
          totalAmount: data.subtotal,
          discountAmount: 0,
          homeCollectionCharges: data.homeCharges,
          finalAmount: data.finalTotal,

          // Payment / status
          paymentMode: data.paymentMode,
          status: 'PENDING',
          bookingSource: 'Admin',

          // Schedule
          collectionType: data.collectionType,
          preferredDate: new Date(data.date),
          preferredTimeSlot: data.time,

          // Associate
          associateId: data.associateId ? parseInt(data.associateId) : null,

          // Instructions
          collectionInstructions: data.instructions || '',

          // Patient
          patientName: data.name,
          patientAge: data.age ? parseInt(data.age) : null,
          patientGender: data.gender,
          patientPhone: data.phone,
        },
      });

      /* ---------- D. Order Items ---------- */
      for (const item of data.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemType: item.type,
            testId: item.type === 'test' ? item.id : null,
            itemName: item.name,
            basePrice: item.mrp,
            price: item.price,
          },
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