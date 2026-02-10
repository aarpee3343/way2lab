// lib/utils/generators.ts - UPDATED VERSION
import { prisma } from '@/lib/db';
import crypto from 'node:crypto';

export async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  const random = String(crypto.randomInt(0, 1000)).padStart(3, '0');
  // Format: YYMMDDHHMMSSmmmRRR
  return `${year}${month}${day}${hh}${mm}${ss}${ms}${random}`;
}

export async function generateCustomerUHID(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const lastCustomer = await tx.customer.findFirst({
      where: { uhid: { not: null } },
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
      where: { uhid: { not: null } },
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
