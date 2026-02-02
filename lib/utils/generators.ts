// lib/utils/generators.ts - UPDATED VERSION
import { prisma } from '@/lib/db';

export async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format: YYMMDD (e.g., 260123 for 2026-01-23)
  const datePrefix = `${year}${month}${day}`;
  
  // Use transaction to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // Find the last order number for today
    const lastOrder = await tx.order.findFirst({
      where: {
        orderNumber: {
          startsWith: datePrefix
        }
      },
      orderBy: {
        id: 'desc'
      },
      select: {
        orderNumber: true
      }
    });

    let sequence = 1;
    if (lastOrder?.orderNumber) {
      // Extract sequence number (last 4 digits)
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-4)) || 0;
      sequence = lastSeq + 1;
      
      // Safety check: if sequence exceeds 9999, add a day
      if (sequence > 9999) {
        throw new Error('Daily order limit exceeded');
      }
    }

    // Format: YYMMDD + 4-digit sequence (e.g., 2601230001)
    return `${datePrefix}${String(sequence).padStart(4, '0')}`;
  });
}

export async function generateCustomerUHID(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const lastCustomer = await tx.customer.findFirst({
      orderBy: { id: 'desc' },
      select: { uhid: true }
    });

    let nextId = 100001; // Starting point
    if (lastCustomer?.uhid) {
      // Extract numeric part from UHID like WTL-100001
      const match = lastCustomer.uhid.match(/\d+/);
      if (match) {
        nextId = parseInt(match[0]) + 1;
      }
    }

    return `WTL-${nextId}`;
  });
}

export async function generateFamilyUHID(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const lastFamily = await tx.familyMember.findFirst({
      orderBy: { id: 'desc' },
      select: { uhid: true }
    });

    let nextId = 200001; // Starting point for family members
    if (lastFamily?.uhid) {
      // Extract numeric part from UHID like WTLF200001
      const match = lastFamily.uhid.match(/\d+/);
      if (match) {
        nextId = parseInt(match[0]) + 1;
      }
    }

    return `WTLF${nextId}`;
  });
}