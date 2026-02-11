import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export type OrderNumberCategory = 'GENERAL' | 'CORPORATE' | 'ADMIN' | 'ONSITE';

type OrderNumberParams = {
  category: OrderNumberCategory;
  tx?: Prisma.TransactionClient;
  date?: Date;
};

const ORDER_PREFIX: Record<OrderNumberCategory, string> = {
  GENERAL: '1',
  CORPORATE: '2',
  ADMIN: '3',
  ONSITE: '4',
};

export async function generateOrderNumber(params: OrderNumberParams): Promise<string> {
  const date = params.date ?? new Date();
  const prefix = ORDER_PREFIX[params.category];
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const bucket = `${prefix}${year}${month}`;
  const sequenceStartIndex = bucket.length + 1;
  const lockKey = `order-number:${bucket}`;
  const bucketPattern = `^${bucket}[0-9]+$`;

  const run = async (db: Prisma.TransactionClient) => {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    const rows = await db.$queryRaw<{ maxSerial: bigint | number | null }[]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM CAST(${sequenceStartIndex} AS INT)) AS BIGINT)), 0) AS "maxSerial"
      FROM orders
      WHERE order_number LIKE ${`${bucket}%`}
        AND order_number ~ ${bucketPattern}
    `;
    const maxSerial = Number(rows[0]?.maxSerial ?? 0);
    const nextSerial = maxSerial + 1;
    return `${bucket}${String(nextSerial).padStart(2, '0')}`;
  };

  if (params.tx) return run(params.tx);
  return prisma.$transaction((tx) => run(tx), { isolationLevel: 'Serializable' });
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
