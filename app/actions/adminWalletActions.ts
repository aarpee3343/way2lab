'use server';

import {
  Prisma,
  WalletCampaignStatus,
  WalletCampaignTriggerType,
  WalletSourceType
} from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/admin-auth';
import { getAuthUser } from '@/lib/auth';
import { writeAdminAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/db';
import {
  creditWallet,
  ensureWalletForCustomer,
  expireWalletCredits,
  grantCampaignWalletCredit,
  toMoney
} from '@/lib/wallet';

const WALLET_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
const ZERO = new Prisma.Decimal(0);
const WALLET_CAMPAIGN_BATCH_SIZE = 50;
const WALLET_CAMPAIGN_MAX_CANDIDATES = 500;

const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

type WalletCampaignRules = {
  corporateId?: number | null;
  phoneList?: string[];
  customerIds?: number[];
  rewardPerOrder?: boolean;
};

type WalletCampaignCandidate = {
  customerId: number;
  orderId: number | null;
  awardKey: string;
  description: string;
};

function normalizePhoneList(value: string | undefined) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((row) => row.replace(/\D/g, ''))
        .filter((row) => row.length === 10)
    )
  );
}

function toRules(input: {
  corporateId?: number | string | null;
  phoneList?: string;
  customerIds?: number[];
  rewardPerOrder?: boolean;
}) {
  const corporateId = input.corporateId ? Number(input.corporateId) : null;
  return {
    corporateId: corporateId && corporateId > 0 ? corporateId : null,
    phoneList: normalizePhoneList(input.phoneList),
    customerIds: Array.isArray(input.customerIds)
      ? input.customerIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [],
    rewardPerOrder: Boolean(input.rewardPerOrder)
  } satisfies WalletCampaignRules;
}

function parseRules(value: Prisma.JsonValue | null | undefined): WalletCampaignRules {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    corporateId: row.corporateId ? Number(row.corporateId) : null,
    phoneList: Array.isArray(row.phoneList) ? row.phoneList.map((item) => String(item)) : [],
    customerIds: Array.isArray(row.customerIds) ? row.customerIds.map((item) => Number(item)) : [],
    rewardPerOrder: Boolean(row.rewardPerOrder)
  };
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getCampaignCandidates(
  db: Prisma.TransactionClient | typeof prisma,
  campaign: {
    id: number;
    name: string;
    triggerType: WalletCampaignTriggerType;
    startDate: Date;
    endDate: Date | null;
    rules: Prisma.JsonValue | null;
  },
  maxCandidates = WALLET_CAMPAIGN_MAX_CANDIDATES
) {
  const now = new Date();
  const rangeEnd = campaign.endDate && campaign.endDate < now ? campaign.endDate : now;
  const rules = parseRules(campaign.rules);

  if (campaign.triggerType === 'CORPORATE_BENEFIT_ORDER') {
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: campaign.startDate, lte: rangeEnd },
        status: { not: 'CANCELLED' },
        customer: rules.corporateId
          ? { corporateId: rules.corporateId }
          : { corporateId: { not: null } }
      },
      select: {
        id: true,
        userId: true,
        patientName: true,
        customer: {
          select: {
            name: true,
            corporate: { select: { companyName: true } }
          }
        }
      },
      orderBy: { id: 'asc' },
      take: rules.rewardPerOrder ? maxCandidates : Math.max(maxCandidates * 4, maxCandidates)
    });

    if (rules.rewardPerOrder) {
      return orders.slice(0, maxCandidates).map((order) => ({
        customerId: order.userId,
        orderId: order.id,
        awardKey: `wallet-campaign:${campaign.id}:order:${order.id}`,
        description: `Wallet reward from campaign ${campaign.name} for corporate benefit order`
      }));
    }

    const seen = new Set<number>();
    return orders.flatMap((order) => {
      if (seen.has(order.userId)) return [];
      seen.add(order.userId);
      return [{
        customerId: order.userId,
        orderId: order.id,
        awardKey: `wallet-campaign:${campaign.id}:customer:${order.userId}`,
        description: `Wallet reward from campaign ${campaign.name} for corporate benefit usage`
      }];
    }).slice(0, maxCandidates);
  }

  if (campaign.triggerType === 'NEW_USER_FIRST_ORDER') {
    const customers = await db.customer.findMany({
      where: {
        createdAt: { gte: campaign.startDate, lte: rangeEnd }
      },
      select: {
        id: true,
        name: true,
        orders: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, createdAt: true }
        }
      },
      orderBy: { id: 'asc' },
      take: maxCandidates
    });

    return customers.flatMap((customer) => {
      const firstOrder = customer.orders[0];
      if (!firstOrder) return [];
      if (firstOrder.createdAt < campaign.startDate || firstOrder.createdAt > rangeEnd) return [];
      return [{
        customerId: customer.id,
        orderId: firstOrder.id,
        awardKey: `wallet-campaign:${campaign.id}:customer:${customer.id}`,
        description: `Wallet reward from campaign ${campaign.name} for first order after registration`
      }];
    }).slice(0, maxCandidates);
  }

  if (campaign.triggerType === 'MANUAL_SEGMENT') {
    const where: Prisma.CustomerWhereInput[] = [];

    if (rules.customerIds?.length) {
      where.push({ id: { in: rules.customerIds } });
    }
    if (rules.phoneList?.length) {
      where.push({ phone: { in: rules.phoneList } });
    }
    if (rules.corporateId) {
      where.push({ corporateId: rules.corporateId });
    }
    if (!where.length) return [];

    const customers = await db.customer.findMany({
      where: { OR: where },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: maxCandidates
    });

    return customers.slice(0, maxCandidates).map((customer) => ({
      customerId: customer.id,
      orderId: null,
      awardKey: `wallet-campaign:${campaign.id}:customer:${customer.id}`,
      description: `Wallet reward from manual campaign ${campaign.name}`
    }));
  }

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: campaign.startDate, lte: rangeEnd },
      status: { not: 'CANCELLED' }
    },
    select: {
      id: true,
      userId: true
    },
    orderBy: { id: 'asc' },
    take: rules.rewardPerOrder ? maxCandidates : Math.max(maxCandidates * 4, maxCandidates)
  });

  if (rules.rewardPerOrder) {
    return orders.slice(0, maxCandidates).map((order) => ({
      customerId: order.userId,
      orderId: order.id,
      awardKey: `wallet-campaign:${campaign.id}:order:${order.id}`,
      description: `Wallet reward from campaign ${campaign.name} for eligible order`
    }));
  }

  const seen = new Set<number>();
  return orders.flatMap((order) => {
    if (seen.has(order.userId)) return [];
    seen.add(order.userId);
    return [{
      customerId: order.userId,
      orderId: order.id,
      awardKey: `wallet-campaign:${campaign.id}:customer:${order.userId}`,
      description: `Wallet reward from campaign ${campaign.name} for eligible order activity`
    }];
  }).slice(0, maxCandidates);
}

async function executeWalletCampaignRun(
  campaign: {
    id: number;
    name: string;
    triggerType: WalletCampaignTriggerType;
    status?: WalletCampaignStatus;
    rewardAmount: Prisma.Decimal;
    rewardValidityDays: number;
    startDate: Date;
    endDate: Date | null;
    rules: Prisma.JsonValue | null;
  }
) {
  const candidates = await getCampaignCandidates(
    prisma,
    campaign,
    WALLET_CAMPAIGN_MAX_CANDIDATES
  ) as WalletCampaignCandidate[];
  const batches = chunkArray<WalletCampaignCandidate>(candidates, WALLET_CAMPAIGN_BATCH_SIZE);
  let granted = 0;

  for (const batch of batches) {
    const batchGranted = await prisma.$transaction(async (tx) => {
      let localGranted = 0;
      for (const candidate of batch) {
        const row = await grantCampaignWalletCredit(tx, campaign, candidate);
        if (row.granted) localGranted += 1;
      }
      return localGranted;
    }, {
      isolationLevel: 'Serializable',
      maxWait: 10000,
      timeout: 20000
    });

    granted += batchGranted;
  }

  await prisma.walletCampaign.update({
    where: { id: campaign.id },
    data: {
      lastRunAt: new Date(),
      lastRunNote: granted > 0
        ? `Granted ${granted} wallet awards across ${batches.length} batch(es)`
        : `No new eligible users found${candidates.length >= WALLET_CAMPAIGN_MAX_CANDIDATES ? ' in current scan window' : ''}`
    }
  });

  return {
    candidates: candidates.length,
    granted,
    batches: batches.length
  };
}

export async function getAdminWalletDashboard(search = '') {
  await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  const query = search.trim();
  const customerWhere = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { uhid: { contains: query, mode: 'insensitive' as const } }
        ]
      }
    : undefined;

  const now = new Date();
  const expiringSoon = new Date(now);
  expiringSoon.setDate(expiringSoon.getDate() + 7);

  const [wallets, totals, activeCampaigns, campaigns, corporates] = await Promise.all([
    prisma.customer.findMany({
      where: customerWhere,
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        uhid: true,
        corporate: { select: { companyName: true } },
        walletAccount: true
      }
    }),
    Promise.all([
      prisma.walletAccount.aggregate({
        _sum: {
          balance: true,
          totalCredited: true,
          totalDebited: true,
          totalExpired: true
        },
        _count: { id: true }
      }),
      prisma.walletCreditLot.aggregate({
        where: {
          status: 'ACTIVE',
          remainingAmount: { gt: ZERO },
          expiresAt: { gte: now, lte: expiringSoon }
        },
        _sum: { remainingAmount: true }
      })
    ]),
    prisma.walletCampaign.count({ where: { status: 'ACTIVE' } }),
    prisma.walletCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        triggerType: true,
        status: true,
        rewardAmount: true,
        rewardValidityDays: true,
        startDate: true,
        endDate: true,
        totalAwards: true,
        totalAwardAmount: true,
        lastRunAt: true,
        lastRunNote: true
      }
    }),
    prisma.corporate.findMany({
      where: { isActive: true },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyName: true }
    })
  ]);

  return {
    stats: {
      wallets: totals[0]._count.id,
      totalBalance: toNumber(totals[0]._sum.balance),
      totalCredited: toNumber(totals[0]._sum.totalCredited),
      totalDebited: toNumber(totals[0]._sum.totalDebited),
      totalExpired: toNumber(totals[0]._sum.totalExpired),
      expiringSoon: toNumber(totals[1]._sum.remainingAmount),
      activeCampaigns
    },
    wallets: wallets.map((customer) => ({
      id: customer.id,
      name: customer.name || 'Unnamed Customer',
      phone: customer.phone || '',
      email: customer.email || '',
      uhid: customer.uhid || '',
      corporateName: customer.corporate?.companyName || '',
      balance: toNumber(customer.walletAccount?.balance),
      totalCredited: toNumber(customer.walletAccount?.totalCredited),
      totalDebited: toNumber(customer.walletAccount?.totalDebited),
      totalExpired: toNumber(customer.walletAccount?.totalExpired),
      updatedAt: toIso(customer.walletAccount?.updatedAt || null)
    })),
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      code: campaign.code,
      triggerType: campaign.triggerType,
      status: campaign.status,
      rewardAmount: toNumber(campaign.rewardAmount),
      rewardValidityDays: campaign.rewardValidityDays,
      startDate: campaign.startDate.toISOString(),
      endDate: toIso(campaign.endDate),
      totalAwards: campaign.totalAwards,
      totalAwardAmount: toNumber(campaign.totalAwardAmount),
      lastRunAt: toIso(campaign.lastRunAt),
      lastRunNote: campaign.lastRunNote
    })),
    corporates
  };
}

export async function getAdminWalletCustomerDetail(customerId: number) {
  await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  const numericId = Number(customerId);
  if (!numericId) return null;

  return prisma.$transaction(async (tx) => {
    await expireWalletCredits(tx, numericId);

    const customer = await tx.customer.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        uhid: true,
        corporate: { select: { id: true, companyName: true } },
        walletAccount: true,
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            createdByAdmin: { select: { id: true, name: true } },
            campaign: { select: { id: true, name: true } },
            order: { select: { id: true, orderNumber: true } }
          }
        },
        walletCreditLots: {
          where: { remainingAmount: { gt: ZERO } },
          orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
          include: {
            campaign: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!customer) return null;

    return {
      customer: {
        id: customer.id,
        name: customer.name || 'Unnamed Customer',
        phone: customer.phone || '',
        email: customer.email || '',
        uhid: customer.uhid || '',
        corporateName: customer.corporate?.companyName || ''
      },
      wallet: {
        balance: toNumber(customer.walletAccount?.balance),
        totalCredited: toNumber(customer.walletAccount?.totalCredited),
        totalDebited: toNumber(customer.walletAccount?.totalDebited),
        totalExpired: toNumber(customer.walletAccount?.totalExpired),
        updatedAt: toIso(customer.walletAccount?.updatedAt || null)
      },
      credits: customer.walletCreditLots.map((lot) => ({
        id: lot.id,
        originalAmount: toNumber(lot.originalAmount),
        remainingAmount: toNumber(lot.remainingAmount),
        expiresAt: toIso(lot.expiresAt),
        status: lot.status,
        description: lot.description,
        campaignName: lot.campaign?.name || null,
        createdAt: lot.createdAt.toISOString()
      })),
      transactions: customer.walletTransactions.map((row) => ({
        id: row.id,
        type: row.type,
        sourceType: row.sourceType,
        amount: toNumber(row.amount),
        balanceAfter: toNumber(row.balanceAfter),
        description: row.description,
        expiresAt: toIso(row.expiresAt),
        createdAt: row.createdAt.toISOString(),
        adminName: row.createdByAdmin?.name || null,
        campaignName: row.campaign?.name || null,
        orderNumber: row.order?.orderNumber || null
      }))
    };
  });
}

export async function addManualWalletCreditAction(input: {
  phone: string;
  amount: number;
  validityDays?: number | null;
  reason: string;
}) {
  const admin = await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  try {
    const phone = String(input.phone || '').replace(/\D/g, '');
    const amount = Number(input.amount);
    const reason = String(input.reason || '').trim();
    const validityDays = input.validityDays ? Number(input.validityDays) : null;

    if (phone.length !== 10) {
      return { success: false, error: 'Enter a valid 10-digit phone number' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }
    if (!reason) {
      return { success: false, error: 'Reason is required' };
    }
    if (validityDays !== null && (!Number.isFinite(validityDays) || validityDays <= 0)) {
      return { success: false, error: 'Validity days must be greater than zero' };
    }

    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true }
    });

    if (!customer) {
      return { success: false, error: 'Customer not found for that phone number' };
    }

    const expiresAt = validityDays ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000) : null;

    const result = await prisma.$transaction(async (tx) => {
      const credit = await creditWallet(tx, {
        customerId: customer.id,
        amount,
        sourceType: WalletSourceType.ADMIN_MANUAL,
        description: reason,
        expiresAt,
        createdByAdminId: admin.id,
        metadata: {
          grantedBy: admin.email,
          reason
        }
      });

      return {
        walletBalance: toNumber(credit.wallet.balance)
      };
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'wallet.credit.manual',
      entityType: 'customer',
      entityId: String(customer.id),
      metadata: {
        phone,
        amount,
        reason,
        validityDays
      }
    });

    revalidatePath('/admin/wallet');
    revalidatePath(`/admin/wallet/${customer.id}`);
    revalidatePath('/dashboard/wallet');

    return {
      success: true,
      customerId: customer.id,
      walletBalance: result.walletBalance
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to add wallet credit' };
  }
}

export async function createWalletCampaignAction(input: {
  name: string;
  code?: string;
  description?: string;
  triggerType: WalletCampaignTriggerType;
  rewardAmount: number;
  rewardValidityDays: number;
  startDate: string;
  endDate?: string;
  corporateId?: number | string | null;
  phoneList?: string;
  rewardPerOrder?: boolean;
}) {
  const admin = await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  try {
    const name = String(input.name || '').trim();
    const code = input.code ? String(input.code).trim().toUpperCase() : null;
    const description = input.description ? String(input.description).trim() : null;
    const rewardAmount = Number(input.rewardAmount);
    const rewardValidityDays = Number(input.rewardValidityDays);
    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (!name) return { success: false, error: 'Campaign name is required' };
    if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
      return { success: false, error: 'Reward amount must be greater than zero' };
    }
    if (!Number.isFinite(rewardValidityDays) || rewardValidityDays <= 0) {
      return { success: false, error: 'Reward validity must be greater than zero' };
    }
    if (Number.isNaN(startDate.getTime())) {
      return { success: false, error: 'Enter a valid start date' };
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      return { success: false, error: 'Enter a valid end date' };
    }
    if (endDate && endDate <= startDate) {
      return { success: false, error: 'End date must be later than start date' };
    }

    const rules = toRules({
      corporateId: input.corporateId,
      phoneList: input.phoneList,
      rewardPerOrder: input.rewardPerOrder
    });

    if (input.triggerType === 'MANUAL_SEGMENT' && !rules.phoneList?.length && !rules.corporateId) {
      return { success: false, error: 'Manual segment campaign needs customer phone list or corporate' };
    }
    if (input.triggerType === 'CORPORATE_BENEFIT_ORDER' && !rules.corporateId) {
      return { success: false, error: 'Corporate campaign requires a corporate selection' };
    }

    const campaign = await prisma.walletCampaign.create({
      data: {
        name,
        code,
        description,
        triggerType: input.triggerType,
        rewardAmount: toMoney(rewardAmount),
        rewardValidityDays,
        startDate,
        endDate,
        rules,
        createdByAdminId: admin.id
      }
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'wallet.campaign.created',
      entityType: 'wallet_campaign',
      entityId: String(campaign.id),
      metadata: {
        triggerType: campaign.triggerType,
        rewardAmount,
        rewardValidityDays,
        rules
      }
    });

    revalidatePath('/admin/wallet');
    return { success: true, campaignId: campaign.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create wallet campaign' };
  }
}

export async function updateWalletCampaignStatusAction(
  campaignId: number,
  status: WalletCampaignStatus
) {
  const admin = await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  try {
    const campaign = await prisma.walletCampaign.findUnique({
      where: { id: Number(campaignId) },
      select: { id: true, name: true }
    });

    if (!campaign) return { success: false, error: 'Campaign not found' };

    await prisma.walletCampaign.update({
      where: { id: campaign.id },
      data: { status }
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'wallet.campaign.status_updated',
      entityType: 'wallet_campaign',
      entityId: String(campaign.id),
      metadata: { status }
    });

    revalidatePath('/admin/wallet');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update campaign status' };
  }
}

export async function runWalletCampaignAction(campaignId: number) {
  const admin = await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  try {
    const campaign = await prisma.walletCampaign.findUnique({
      where: { id: Number(campaignId) },
      select: {
        id: true,
        name: true,
        triggerType: true,
        status: true,
        rewardAmount: true,
        rewardValidityDays: true,
        startDate: true,
        endDate: true,
        rules: true
      }
    });

    if (!campaign) return { success: false, error: 'Campaign not found' };
    if (campaign.status === 'PAUSED') return { success: false, error: 'Resume the campaign before running it' };

    const result = await executeWalletCampaignRun(campaign);

    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'wallet.campaign.run',
      entityType: 'wallet_campaign',
      entityId: String(campaign.id),
      metadata: result
    });

    revalidatePath('/admin/wallet');
    revalidatePath('/dashboard/wallet');
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to run wallet campaign' };
  }
}

export async function processActiveWalletCampaignsSystemAction(maxCampaigns = 10) {
  const now = new Date();
  const campaigns = await prisma.walletCampaign.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }]
    },
    orderBy: { startDate: 'asc' },
    take: Math.min(20, Math.max(1, Number(maxCampaigns) || 10)),
    select: {
      id: true,
      name: true,
      triggerType: true,
      status: true,
      rewardAmount: true,
      rewardValidityDays: true,
      startDate: true,
      endDate: true,
      rules: true
    }
  });

  const results = [];
  for (const campaign of campaigns) {
    const result = await executeWalletCampaignRun(campaign);

    results.push({
      campaignId: campaign.id,
      granted: result.granted,
      scanned: result.candidates,
      batches: result.batches
    });
  }

  revalidatePath('/admin/wallet');
  revalidatePath('/dashboard/wallet');

  return {
    success: true,
    processedCampaigns: campaigns.length,
    results
  };
}

export async function getCurrentUserWalletOverview() {
  const user = await getAuthUser();
  if (!user?.id) throw new Error('UNAUTHORIZED');

  return prisma.$transaction(async (tx) => {
    await expireWalletCredits(tx, user.id);

    const customer = await tx.customer.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        uhid: true,
        walletAccount: true,
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            campaign: { select: { id: true, name: true } },
            order: { select: { id: true, orderNumber: true } }
          }
        },
        walletCreditLots: {
          where: { remainingAmount: { gt: ZERO } },
          orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
          include: {
            campaign: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

    return {
      customer: {
        id: customer.id,
        name: customer.name || 'Customer',
        phone: customer.phone || '',
        email: customer.email || '',
        uhid: customer.uhid || ''
      },
      wallet: {
        balance: toNumber(customer.walletAccount?.balance),
        totalCredited: toNumber(customer.walletAccount?.totalCredited),
        totalDebited: toNumber(customer.walletAccount?.totalDebited),
        totalExpired: toNumber(customer.walletAccount?.totalExpired),
        updatedAt: toIso(customer.walletAccount?.updatedAt || null)
      },
      credits: customer.walletCreditLots.map((lot) => ({
        id: lot.id,
        originalAmount: toNumber(lot.originalAmount),
        remainingAmount: toNumber(lot.remainingAmount),
        expiresAt: toIso(lot.expiresAt),
        status: lot.status,
        description: lot.description,
        campaignName: lot.campaign?.name || null,
        createdAt: lot.createdAt.toISOString()
      })),
      transactions: customer.walletTransactions.map((row) => ({
        id: row.id,
        type: row.type,
        sourceType: row.sourceType,
        amount: toNumber(row.amount),
        balanceAfter: toNumber(row.balanceAfter),
        description: row.description,
        expiresAt: toIso(row.expiresAt),
        createdAt: row.createdAt.toISOString(),
        campaignName: row.campaign?.name || null,
        orderNumber: row.order?.orderNumber || null
      }))
    };
  });
}

export async function getWalletCustomerLookup(phone: string) {
  await requireAdmin({ roles: [...WALLET_ADMIN_ROLES] });

  const normalized = String(phone || '').replace(/\D/g, '');
  if (normalized.length !== 10) {
    return { success: false, error: 'Enter a valid 10-digit phone number' };
  }

  const customer = await prisma.customer.findUnique({
    where: { phone: normalized },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      uhid: true,
      walletAccount: true
    }
  });

  if (!customer) return { success: false, error: 'Customer not found' };

  return {
    success: true,
    customer: {
      id: customer.id,
      name: customer.name || 'Unnamed Customer',
      phone: customer.phone || '',
      email: customer.email || '',
      uhid: customer.uhid || '',
      balance: toNumber(customer.walletAccount?.balance)
    }
  };
}
