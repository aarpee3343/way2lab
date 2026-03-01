import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export type OrderNumberCategory = 'GENERAL' | 'CORPORATE' | 'ADMIN' | 'ONSITE';
export type CustomerUhidScheme = 'SELF' | 'ONSITE_CORPORATE' | 'ADMIN_ORDER';
export type UhidScheme = CustomerUhidScheme | 'FAMILY';

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

const UHID_SEQUENCE_START = 100001;

const UHID_CONFIG: Record<
  UhidScheme,
  { prefix: string; counterKey: string; tableName: 'customers' | 'family_members' }
> = {
  SELF: {
    prefix: 'WTLS',
    counterKey: 'uhid_counter:self',
    tableName: 'customers',
  },
  FAMILY: {
    prefix: 'WTLF',
    counterKey: 'uhid_counter:family',
    tableName: 'family_members',
  },
  ONSITE_CORPORATE: {
    prefix: 'WTLOS',
    counterKey: 'uhid_counter:onsite_corporate',
    tableName: 'customers',
  },
  ADMIN_ORDER: {
    prefix: 'WTLAO',
    counterKey: 'uhid_counter:admin_order',
    tableName: 'customers',
  },
};

type UhidGenerationParams = {
  scheme: UhidScheme;
  count?: number;
  tx?: Prisma.TransactionClient;
};

type GenerateCustomerUhidParams = {
  scheme?: CustomerUhidScheme;
  tx?: Prisma.TransactionClient;
};

type GenerateFamilyUhidParams = {
  tx?: Prisma.TransactionClient;
};

const readCounterValue = (value: Prisma.JsonValue | null | undefined): number | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const nextNumber = (value as { nextNumber?: unknown }).nextNumber;
  return typeof nextNumber === 'number' && Number.isFinite(nextNumber) ? nextNumber : null;
};

const formatUhid = (scheme: UhidScheme, serial: number) => `${UHID_CONFIG[scheme].prefix}${serial}`;

const getExistingMaxSerial = async (tx: Prisma.TransactionClient, scheme: UhidScheme): Promise<number> => {
  const { prefix, tableName } = UHID_CONFIG[scheme];
  const sequenceStartIndex = prefix.length + 1;
  const prefixPattern = `^${prefix}[0-9]+$`;
  const rows = await tx.$queryRaw<{ maxSerial: bigint | number | null }[]>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(uhid FROM CAST(${sequenceStartIndex} AS INT)) AS BIGINT)), 0) AS "maxSerial"
    FROM ${Prisma.raw(tableName)}
    WHERE uhid LIKE ${`${prefix}%`}
      AND uhid ~ ${prefixPattern}
  `;

  return Number(rows[0]?.maxSerial ?? 0);
};

export async function generateUHIDBatch(params: UhidGenerationParams): Promise<string[]> {
  const count = Math.max(1, Math.trunc(params.count ?? 1));
  const { scheme } = params;
  const run = async (tx: Prisma.TransactionClient) => {
    const { counterKey } = UHID_CONFIG[scheme];
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${counterKey}))`;

    const existingCounter = await tx.appSetting.findUnique({
      where: { key: counterKey },
      select: { value: true },
    });

    let nextNumber = readCounterValue(existingCounter?.value);
    if (nextNumber === null) {
      const maxSerial = await getExistingMaxSerial(tx, scheme);
      nextNumber = maxSerial > 0 ? maxSerial + 1 : UHID_SEQUENCE_START;
    }

    const startNumber = nextNumber;
    const allocated = Array.from({ length: count }, (_, index) => formatUhid(scheme, startNumber + index));
    const updatedValue = { nextNumber: startNumber + count };

    await tx.appSetting.upsert({
      where: { key: counterKey },
      update: { value: updatedValue },
      create: {
        key: counterKey,
        value: updatedValue,
      },
    });

    return allocated;
  };

  if (params.tx) return run(params.tx);
  return prisma.$transaction((tx) => run(tx), { isolationLevel: 'Serializable' });
}

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

export async function generateCustomerUHID(params?: GenerateCustomerUhidParams): Promise<string> {
  const [uhid] = await generateUHIDBatch({
    scheme: params?.scheme ?? 'SELF',
    count: 1,
    tx: params?.tx,
  });
  return uhid;
}

export async function generateFamilyUHID(params?: GenerateFamilyUhidParams): Promise<string> {
  const [uhid] = await generateUHIDBatch({ scheme: 'FAMILY', count: 1, tx: params?.tx });
  return uhid;
}

export async function ensureCustomerUHID(
  customerId: number,
  scheme: CustomerUhidScheme = 'SELF',
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const run = async (db: Prisma.TransactionClient) => {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { uhid: true },
    });

    if (customer?.uhid) return customer.uhid;

    const uhid = await generateCustomerUHID({ scheme, tx: db });
    await db.customer.update({
      where: { id: customerId },
      data: { uhid },
    });

    return uhid;
  };

  if (tx) return run(tx);
  return prisma.$transaction((db) => run(db), { isolationLevel: 'Serializable' });
}
