import { Prisma, WalletCampaignTriggerType, WalletSourceType, WalletTransactionType } from '@prisma/client';

import { prisma } from '@/lib/db';

type WalletDb = typeof prisma | Prisma.TransactionClient;

type CreditWalletInput = {
  customerId: number;
  amount: number | string | Prisma.Decimal;
  sourceType: WalletSourceType;
  type?: WalletTransactionType;
  description?: string | null;
  expiresAt?: Date | null;
  orderId?: number | null;
  campaignId?: number | null;
  createdByAdminId?: number | null;
  metadata?: Prisma.JsonValue;
};

type DebitWalletInput = {
  customerId: number;
  amount: number | string | Prisma.Decimal;
  sourceType: WalletSourceType;
  description?: string | null;
  orderId?: number | null;
  campaignId?: number | null;
  createdByAdminId?: number | null;
  metadata?: Prisma.JsonValue;
};

type AwardContext = {
  customerId: number;
  orderId?: number | null;
  awardKey: string;
  description: string;
};

const ZERO = new Prisma.Decimal(0);
const WALLET_TX_OPTIONS = {
  isolationLevel: 'Serializable' as const,
  maxWait: 10000,
  timeout: 20000
};

export function toMoney(value: number | string | Prisma.Decimal | null | undefined) {
  if (value instanceof Prisma.Decimal) return value;
  if (value === null || value === undefined || value === '') return ZERO;
  return new Prisma.Decimal(value);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isRootWalletDb(db: WalletDb): db is typeof prisma {
  return '$transaction' in db;
}

async function withWalletTransaction<T>(db: WalletDb, customerId: number, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  if (isRootWalletDb(db)) {
    return db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${customerId}`}))`;
      return work(tx);
    }, WALLET_TX_OPTIONS);
  }

  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${customerId}`}))`;
  return work(db);
}

async function ensureWalletAccount(tx: Prisma.TransactionClient, customerId: number) {
  return tx.walletAccount.upsert({
    where: { customerId },
    update: {},
    create: {
      customerId,
      balance: ZERO,
      totalCredited: ZERO,
      totalDebited: ZERO,
      totalExpired: ZERO
    }
  });
}

async function expireWalletCreditsInternal(
  tx: Prisma.TransactionClient,
  customerId: number,
  now = new Date(),
  currentWallet?: Awaited<ReturnType<typeof ensureWalletAccount>>
) {
  const wallet = currentWallet || await ensureWalletAccount(tx, customerId);
  const expiredLots = await tx.walletCreditLot.findMany({
    where: {
      walletId: wallet.id,
      status: 'ACTIVE',
      remainingAmount: { gt: ZERO },
      expiresAt: { lt: now }
    },
    orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }]
  });

  if (!expiredLots.length) {
    return wallet;
  }

  const expiredAmount = expiredLots.reduce(
    (sum, lot) => sum.plus(lot.remainingAmount),
    ZERO
  );

  await tx.walletCreditLot.updateMany({
    where: {
      id: { in: expiredLots.map((lot) => lot.id) }
    },
    data: {
      remainingAmount: ZERO,
      status: 'EXPIRED'
    }
  });

  const updatedWallet = await tx.walletAccount.update({
    where: { id: wallet.id },
    data: {
      balance: { decrement: expiredAmount },
      totalExpired: { increment: expiredAmount }
    }
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      customerId,
      type: 'EXPIRE',
      sourceType: 'SYSTEM_EXPIRY',
      amount: expiredAmount.negated(),
      balanceAfter: updatedWallet.balance,
      description: 'Wallet credits expired',
      metadata: {
        expiredLotIds: expiredLots.map((lot) => lot.id)
      }
    }
  });

  return updatedWallet;
}

export async function expireWalletCredits(db: WalletDb, customerId: number, now = new Date()) {
  return withWalletTransaction(db, customerId, async (tx) => expireWalletCreditsInternal(tx, customerId, now));
}

export async function creditWallet(db: WalletDb, input: CreditWalletInput) {
  const amount = toMoney(input.amount);
  if (amount.lte(ZERO)) {
    throw new Error('Wallet credit amount must be greater than zero');
  }

  if (input.expiresAt && input.expiresAt <= new Date()) {
    throw new Error('Wallet validity must be in the future');
  }

  return withWalletTransaction(db, input.customerId, async (tx) => {
    let wallet = await ensureWalletAccount(tx, input.customerId);
    wallet = await expireWalletCreditsInternal(tx, input.customerId, new Date(), wallet);
    wallet = await tx.walletAccount.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        totalCredited: { increment: amount }
      }
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        customerId: input.customerId,
        type: input.type || 'CREDIT',
        sourceType: input.sourceType,
        amount,
        balanceAfter: wallet.balance,
        description: input.description || null,
        expiresAt: input.expiresAt || null,
        orderId: input.orderId || null,
        campaignId: input.campaignId || null,
        createdByAdminId: input.createdByAdminId || null,
        metadata: input.metadata === null ? Prisma.JsonNull : input.metadata
      }
    });

    await tx.walletCreditLot.create({
      data: {
        walletId: wallet.id,
        customerId: input.customerId,
        transactionId: transaction.id,
        campaignId: input.campaignId || null,
        createdByAdminId: input.createdByAdminId || null,
        originalAmount: amount,
        remainingAmount: amount,
        expiresAt: input.expiresAt || null,
        description: input.description || null
      }
    });

    return { wallet, transaction };
  });
}

export async function debitWallet(db: WalletDb, input: DebitWalletInput) {
  const amount = toMoney(input.amount);
  if (amount.lte(ZERO)) {
    throw new Error('Wallet debit amount must be greater than zero');
  }

  return withWalletTransaction(db, input.customerId, async (tx) => {
    let wallet = await ensureWalletAccount(tx, input.customerId);
    wallet = await expireWalletCreditsInternal(tx, input.customerId, new Date(), wallet);
    if (wallet.balance.lt(amount)) {
      throw new Error('Insufficient wallet balance');
    }

    const creditLots = await tx.walletCreditLot.findMany({
      where: {
        walletId: wallet.id,
        status: 'ACTIVE',
        remainingAmount: { gt: ZERO }
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    });

    let remaining = amount;
    for (const lot of creditLots) {
      if (remaining.lte(ZERO)) break;

      const consume = Prisma.Decimal.min(lot.remainingAmount, remaining);
      const nextRemaining = lot.remainingAmount.minus(consume);

      await tx.walletCreditLot.update({
        where: { id: lot.id },
        data: {
          remainingAmount: nextRemaining,
          status: nextRemaining.lte(ZERO) ? 'CONSUMED' : 'ACTIVE'
        }
      });

      remaining = remaining.minus(consume);
    }

    if (remaining.gt(ZERO)) {
      throw new Error('Unable to consume wallet balance safely');
    }

    const walletUpdate = await tx.walletAccount.updateMany({
      where: {
        id: wallet.id,
        balance: { gte: amount }
      },
      data: {
        balance: { decrement: amount },
        totalDebited: { increment: amount }
      }
    });

    if (walletUpdate.count !== 1) {
      throw new Error('Insufficient wallet balance');
    }

    wallet = await tx.walletAccount.findUniqueOrThrow({
      where: { id: wallet.id }
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        customerId: input.customerId,
        type: 'DEBIT',
        sourceType: input.sourceType,
        amount: amount.negated(),
        balanceAfter: wallet.balance,
        description: input.description || null,
        orderId: input.orderId || null,
        campaignId: input.campaignId || null,
        createdByAdminId: input.createdByAdminId || null,
        metadata: input.metadata === null ? Prisma.JsonNull : input.metadata
      }
    });

    return { wallet, transaction };
  });
}

export async function grantCampaignWalletCredit(
  db: WalletDb,
  campaign: {
    id: number;
    rewardAmount: Prisma.Decimal;
    rewardValidityDays: number;
    triggerType: WalletCampaignTriggerType;
  },
  context: AwardContext
) {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${context.awardKey}))`;
  const existing = await db.walletCampaignAward.findUnique({
    where: { awardKey: context.awardKey },
    select: { id: true }
  });

  if (existing) {
    return { granted: false };
  }

  const expiresAt = campaign.rewardValidityDays > 0
    ? addDays(new Date(), campaign.rewardValidityDays)
    : null;

  const { transaction } = await creditWallet(db, {
    customerId: context.customerId,
    amount: campaign.rewardAmount,
    sourceType: 'CAMPAIGN',
    description: context.description,
    expiresAt,
    orderId: context.orderId || null,
    campaignId: campaign.id,
    metadata: {
      awardKey: context.awardKey,
      triggerType: campaign.triggerType
    }
  });

  await db.walletCampaignAward.create({
    data: {
      campaignId: campaign.id,
      customerId: context.customerId,
      orderId: context.orderId || null,
      walletTransactionId: transaction.id,
      awardKey: context.awardKey
    }
  });

  await db.walletCampaign.update({
    where: { id: campaign.id },
    data: {
      totalAwards: { increment: 1 },
      totalAwardAmount: { increment: campaign.rewardAmount }
    }
  });

  return { granted: true, transactionId: transaction.id };
}

export async function ensureWalletForCustomer(customerId: number) {
  return prisma.$transaction(async (tx) => {
    await expireWalletCredits(tx, customerId);
    return tx.walletAccount.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uhid: true
          }
        }
      }
    });
  });
}
