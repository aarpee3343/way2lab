'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getAdminSettings } from '@/app/actions/adminSettingsActions';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { writeAdminAuditLog } from '@/lib/audit';

type AudienceType = 'SUBSCRIBERS' | 'CUSTOMERS' | 'CUSTOM_LIST';
type SendMode = 'GENERAL' | 'CORPORATE' | 'CUSTOM_LIST';
type GeneralAudienceSegment =
  | 'ALL_SUBSCRIBERS'
  | 'ALL_CUSTOMERS'
  | 'NO_ORDERS'
  | 'ONE_TIME_CUSTOMERS'
  | 'INACTIVE_90_DAYS';
type CorporateAudienceSegment = 'ALL_CORPORATE_USERS' | 'AVAILED_PACKAGE' | 'NOT_AVAILED_PACKAGE';

type CampaignInput = {
  subject: string;
  htmlContent: string;
  templateName?: string;
  audienceType: AudienceType;
  sendMode?: SendMode;
  personalize?: boolean;
  customEmails?: string;
  generalSegment?: GeneralAudienceSegment;
  corporateId?: number | null;
  corporatePackageId?: number | null;
  corporateSegment?: CorporateAudienceSegment;
};

type RecipientCandidate = {
  email: string;
  name?: string | null;
  customerId?: number | null;
  subscriberId?: number | null;
  unsubscribeToken: string;
  isUnsubscribed: boolean;
};

type CampaignProcessSummary = {
  processed: number;
  sent: number;
  failed: number;
  completed: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email: string) {
  return emailRegex.test(normalizeEmail(email));
}

function getAppBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyPersonalization(html: string, vars: ExtendedPersonalizationVars) {
  return html
    .replace(/\{\{\s*name\s*\}\}/gi, escapeHtml(vars.name || 'Valued Customer'))
    .replace(/\{\{\s*firstName\s*\}\}/gi, escapeHtml(vars.firstName || vars.name || 'Customer'))
    .replace(/\{\{\s*email\s*\}\}/gi, escapeHtml(vars.email))
    .replace(/\{\{\s*corporateName\s*\}\}/gi, escapeHtml(vars.corporateName || 'WayToLab Partner'))
    .replace(
      /\{\{\s*assignedPackages\s*\}\}/gi,
      escapeHtml(vars.assignedPackages || 'Health packages curated for you')
    )
    .replace(/\{\{\s*packageName\s*\}\}/gi, escapeHtml(vars.packageName || 'your wellness package'))
    .replace(/\{\{\s*packageCount\s*\}\}/gi, escapeHtml(String(vars.packageCount || '0')));
}

type ExtendedPersonalizationVars = {
  name?: string;
  email: string;
  firstName?: string;
  corporateName?: string;
  assignedPackages?: string;
  packageName?: string;
  packageCount?: string;
};

function parseCustomEmails(input: string) {
  const unique = new Set<string>();
  const parsed: string[] = [];
  for (const raw of input.split(/[\n,;]+/)) {
    const email = normalizeEmail(raw);
    if (!email || !isValidEmail(email) || unique.has(email)) continue;
    unique.add(email);
    parsed.push(email);
  }
  return parsed;
}

function attachUnsubscribe(html: string, unsubscribeUrl: string) {
  const replaced = html.replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, unsubscribeUrl);
  if (replaced !== html) return replaced;

  return `${replaced}
    <hr style="margin-top:32px;border:none;border-top:1px solid #e2e8f0;" />
    <p style="margin-top:12px;color:#64748b;font-size:12px;line-height:1.6;">
      You are receiving this email from WayToLab. 
      <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">Unsubscribe</a>.
    </p>`;
}

async function ensureSubscriber(email: string, name?: string | null, source?: string) {
  const normalized = normalizeEmail(email);
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });

  if (existing) {
    const updated = await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name || undefined,
        source: source || existing.source || undefined,
      },
    });
    return updated;
  }

  return prisma.newsletterSubscriber.create({
    data: {
      email: normalized,
      name: name || undefined,
      source: source || 'system',
      unsubscribeToken: crypto.randomBytes(24).toString('hex'),
      status: 'SUBSCRIBED',
    },
  });
}

export async function subscribeNewsletterAction(payload: { email: string; name?: string }) {
  try {
    const email = normalizeEmail(payload.email);
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          name: payload.name?.trim() || existing.name || undefined,
          status: 'SUBSCRIBED',
          source: 'footer',
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });
      return { success: true, message: 'You are subscribed to health updates.' };
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        name: payload.name?.trim() || undefined,
        status: 'SUBSCRIBED',
        source: 'footer',
        unsubscribeToken: crypto.randomBytes(24).toString('hex'),
      },
    });

    return { success: true, message: 'Subscription successful.' };
  } catch (error) {
    console.error('subscribeNewsletterAction:', error);
    return { success: false, error: 'Unable to subscribe right now.' };
  }
}

export async function unsubscribeNewsletterAction(payload: { token?: string; email?: string }) {
  try {
    const token = String(payload.token || '').trim();
    const email = normalizeEmail(payload.email || '');

    if (!token && !email) {
      return { success: false, error: 'Invalid unsubscribe link.' };
    }

    const where = token ? { unsubscribeToken: token } : { email };
    const existing = await prisma.newsletterSubscriber.findUnique({ where });
    if (!existing) {
      return { success: false, error: 'Subscription record not found.' };
    }

    if (existing.status === 'UNSUBSCRIBED') {
      return { success: true, message: 'You are already unsubscribed.' };
    }

    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    return { success: true, message: 'You have been unsubscribed.' };
  } catch (error) {
    console.error('unsubscribeNewsletterAction:', error);
    return { success: false, error: 'Unable to process unsubscribe request.' };
  }
}

async function buildCustomerRecipientRows(
  customers: Array<{
    id: number;
    email: string | null;
    name: string | null;
  }>
) {
  const recipientMap = new Map<string, RecipientCandidate>();
  const BATCH_SIZE = 100;

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const rows = await Promise.all(
      batch.map(async (customer) => {
        const email = normalizeEmail(customer.email || '');
        if (!isValidEmail(email)) return null;
        const subscriber = await ensureSubscriber(email, customer.name || undefined, 'customer');
        return {
          email,
          name: customer.name,
          customerId: customer.id,
          subscriberId: subscriber.id,
          unsubscribeToken: subscriber.unsubscribeToken,
          isUnsubscribed: subscriber.status === 'UNSUBSCRIBED',
        } satisfies RecipientCandidate;
      })
    );

    for (const row of rows) {
      if (!row) continue;
      recipientMap.set(row.email, row);
    }
  }

  return Array.from(recipientMap.values());
}

async function buildSubscriberRecipients() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return subscribers.map((sub) => ({
    email: sub.email,
    name: sub.name,
    subscriberId: sub.id,
    unsubscribeToken: sub.unsubscribeToken,
    isUnsubscribed: sub.status === 'UNSUBSCRIBED',
  })) satisfies RecipientCandidate[];
}

async function buildGeneralRecipients(segment: GeneralAudienceSegment) {
  if (segment === 'ALL_SUBSCRIBERS') {
    return buildSubscriberRecipients();
  }

  if (segment === 'ALL_CUSTOMERS') {
    const customers = await prisma.customer.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return buildCustomerRecipientRows(customers);
  }

  if (segment === 'NO_ORDERS') {
    const customers = await prisma.customer.findMany({
      where: {
        email: { not: null },
        orders: { none: {} },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return buildCustomerRecipientRows(customers);
  }

  if (segment === 'INACTIVE_90_DAYS') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const customers = await prisma.customer.findMany({
      where: {
        email: { not: null },
        AND: [
          { orders: { some: {} } },
          { orders: { none: { createdAt: { gte: cutoff } } } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return buildCustomerRecipientRows(customers);
  }

  const customers = await prisma.customer.findMany({
    where: {
      email: { not: null },
      orders: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return buildCustomerRecipientRows(
    customers
      .filter((customer) => customer._count.orders === 1)
      .map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
      }))
  );
}

async function buildCorporateRecipients(input: CampaignInput) {
  const corporateId = Number(input.corporateId || 0);
  if (!corporateId) return [];

  const where: Prisma.CustomerWhereInput = {
    corporateId,
    email: { not: null },
  };

  if (input.corporatePackageId && input.corporateSegment === 'AVAILED_PACKAGE') {
    where.assignedPackages = {
      some: {
        packageId: input.corporatePackageId,
        availedAt: { not: null },
      },
    };
  }

  if (input.corporatePackageId && input.corporateSegment === 'NOT_AVAILED_PACKAGE') {
    where.assignedPackages = {
      some: {
        packageId: input.corporatePackageId,
        availedAt: null,
      },
    };
  }

  const customers = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return buildCustomerRecipientRows(customers);
}

async function buildRecipients(input: CampaignInput) {
  const recipientMap = new Map<string, RecipientCandidate>();

  const sendMode = input.sendMode || (input.audienceType === 'CUSTOM_LIST' ? 'CUSTOM_LIST' : 'GENERAL');
  const generalSegment = input.generalSegment || (input.audienceType === 'SUBSCRIBERS' ? 'ALL_SUBSCRIBERS' : 'ALL_CUSTOMERS');

  if (sendMode === 'GENERAL') {
    const recipients = await buildGeneralRecipients(generalSegment);
    for (const row of recipients) {
      recipientMap.set(row.email, row);
    }
  }

  if (sendMode === 'CORPORATE') {
    const recipients = await buildCorporateRecipients(input);
    for (const row of recipients) {
      recipientMap.set(row.email, row);
    }
  }

  if (sendMode === 'CUSTOM_LIST' || input.audienceType === 'CUSTOM_LIST') {
    const emails = parseCustomEmails(input.customEmails || '');

    const rows = await Promise.all(
      emails.map(async (email) => {
        const subscriber = await ensureSubscriber(email, undefined, 'custom_list');
        return {
          email,
          name: null,
          subscriberId: subscriber.id,
          unsubscribeToken: subscriber.unsubscribeToken,
          isUnsubscribed: subscriber.status === 'UNSUBSCRIBED',
        } satisfies RecipientCandidate;
      })
    );

    for (const row of rows) {
      recipientMap.set(row.email, row);
    }
  }

  return Array.from(recipientMap.values());
}

async function enqueueCampaignRecipients(campaignId: number, recipients: RecipientCandidate[]) {
  if (!recipients.length) {
    return { pending: 0, skipped: 0 };
  }

  let skipped = 0;
  const rows = recipients.map((recipient) => {
    const isSkipped = recipient.isUnsubscribed;
    if (isSkipped) skipped += 1;
    return {
      campaignId,
      subscriberId: recipient.subscriberId || null,
      customerId: recipient.customerId || null,
      email: recipient.email,
      name: recipient.name || null,
      status: isSkipped ? 'SKIPPED_UNSUBSCRIBED' : 'PENDING',
      errorMessage: isSkipped ? 'Recipient is unsubscribed' : null,
    } as const;
  });

  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.emailCampaignRecipient.createMany({
      data: rows.slice(i, i + CHUNK),
    });
  }

  return { pending: rows.length - skipped, skipped };
}

async function processSingleRecipient(
  recipient: {
    id: number;
    email: string;
    name: string | null;
    campaignId: number;
    subscriberId: number | null;
    customerId: number | null;
    subscriber: { unsubscribeToken: string } | null;
  },
  campaign: {
    subject: string;
    contentHtml: string;
    personalize: boolean;
  }
) {
  let personalizationVars: ExtendedPersonalizationVars = {
    name: recipient.name || undefined,
    email: recipient.email,
    firstName: (recipient.name || '').trim().split(/\s+/)[0] || 'Customer',
    corporateName: '',
    assignedPackages: '',
    packageName: '',
    packageCount: '0',
  };

  if (campaign.personalize && recipient.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: recipient.customerId },
      select: {
        name: true,
        corporate: {
          select: {
            companyName: true,
          },
        },
        assignedPackages: {
          select: {
            availedAt: true,
            package: {
              select: {
                packageName: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (customer) {
      const packageNames = customer.assignedPackages
        .map((entry) => entry.package.packageName?.trim())
        .filter(Boolean) as string[];
      const uniquePackageNames = [...new Set(packageNames)];
      const highlightedPackage =
        customer.assignedPackages.find((entry) => entry.availedAt)?.package.packageName ||
        uniquePackageNames[0] ||
        '';

      personalizationVars = {
        name: customer.name || personalizationVars.name,
        email: recipient.email,
        firstName: (customer.name || personalizationVars.name || '').trim().split(/\s+/)[0] || 'Customer',
        corporateName: customer.corporate?.companyName || '',
        assignedPackages: uniquePackageNames.join(', '),
        packageName: highlightedPackage,
        packageCount: String(uniquePackageNames.length),
      };
    }
  }

  const personalizedHtml = campaign.personalize
    ? applyPersonalization(campaign.contentHtml, personalizationVars)
    : campaign.contentHtml;

  const unsubscribeToken = recipient.subscriber?.unsubscribeToken || '';
  const unsubscribeUrl = unsubscribeToken
    ? `${getAppBaseUrl()}/unsubscribe?token=${unsubscribeToken}`
    : `${getAppBaseUrl()}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
  const htmlWithUnsubscribe = attachUnsubscribe(personalizedHtml, unsubscribeUrl);

  const mailRes = await sendEmail({
    to: recipient.email,
    subject: campaign.subject,
    html: htmlWithUnsubscribe,
  });

  if (mailRes.success) {
    await prisma.emailCampaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: 'SENT',
        providerMessage: 'Accepted by provider',
        sentAt: new Date(),
      },
    });

    if (recipient.subscriberId) {
      await prisma.newsletterSubscriber.update({
        where: { id: recipient.subscriberId },
        data: { lastEmailSentAt: new Date() },
      });
    }

    return 'SENT' as const;
  }

  await prisma.emailCampaignRecipient.update({
    where: { id: recipient.id },
    data: {
      status: 'FAILED',
      errorMessage: mailRes.error || 'Provider failed',
    },
  });
  return 'FAILED' as const;
}

export async function processCampaignBatchAction(campaignId: number, batchSize = 50): Promise<CampaignProcessSummary> {
  const admin = await requireAdmin({ roles: ['SUPER_ADMIN'] });
  await writeAdminAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'campaign.process_batch',
    entityType: 'email_campaign',
    entityId: campaignId,
    metadata: { batchSize },
  });
  return processCampaignBatchInternal(campaignId, batchSize);
}

async function processCampaignBatchInternal(campaignId: number, batchSize = 50): Promise<CampaignProcessSummary> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      subject: true,
      contentHtml: true,
      personalize: true,
      status: true,
      sentCount: true,
      failedCount: true,
      totalRecipients: true,
    },
  });

  if (!campaign || campaign.status !== 'PROCESSING') {
    return { processed: 0, sent: 0, failed: 0, completed: true };
  }

  const pending = await prisma.emailCampaignRecipient.findMany({
    where: { campaignId, status: 'PENDING' },
    include: {
      subscriber: {
        select: { unsubscribeToken: true },
      },
    },
    take: Math.min(200, Math.max(1, batchSize)),
    orderBy: { id: 'asc' },
  });

  if (!pending.length) {
    const failedOnly = campaign.sentCount === 0 && campaign.failedCount > 0;
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedOnly ? 'FAILED' : 'COMPLETED',
        completedAt: new Date(),
      },
    });
    return { processed: 0, sent: 0, failed: 0, completed: true };
  }

  let sent = 0;
  let failed = 0;

  const workerBatch = 10;
  for (let i = 0; i < pending.length; i += workerBatch) {
    const chunk = pending.slice(i, i + workerBatch);
    const settled = await Promise.allSettled(
      chunk.map((row) =>
        processSingleRecipient(
          {
            id: row.id,
            email: row.email,
            name: row.name,
            campaignId: row.campaignId,
            subscriberId: row.subscriberId,
            customerId: row.customerId,
            subscriber: row.subscriber,
          },
          {
            subject: campaign.subject,
            contentHtml: campaign.contentHtml,
            personalize: campaign.personalize,
          }
        )
      )
    );

    for (const item of settled) {
      if (item.status === 'fulfilled') {
        if (item.value === 'SENT') sent += 1;
        if (item.value === 'FAILED') failed += 1;
      } else {
        failed += 1;
      }
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: { increment: sent },
      failedCount: { increment: failed },
    },
  });

  const pendingLeft = await prisma.emailCampaignRecipient.count({
    where: { campaignId, status: 'PENDING' },
  });

  if (pendingLeft === 0) {
    const finalCampaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      select: { sentCount: true, failedCount: true },
    });
    const failedOnly = (finalCampaign?.sentCount || 0) === 0 && (finalCampaign?.failedCount || 0) > 0;
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedOnly ? 'FAILED' : 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  return {
    processed: pending.length,
    sent,
    failed,
    completed: pendingLeft === 0,
  };
}

export async function processPendingCampaignsAction(maxCampaigns = 1, batchSize = 50) {
  const admin = await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const campaigns = await prisma.emailCampaign.findMany({
    where: { status: 'PROCESSING' },
    orderBy: { createdAt: 'asc' },
    take: Math.min(10, Math.max(1, maxCampaigns)),
    select: { id: true },
  });

  const results = [];
  for (const campaign of campaigns) {
    const summary = await processCampaignBatchInternal(campaign.id, batchSize);
    results.push({ campaignId: campaign.id, ...summary });
  }

  await writeAdminAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'campaign.process_pending',
    entityType: 'email_campaign',
    metadata: { maxCampaigns, batchSize, processedCampaigns: results.length },
  });

  revalidatePath('/admin/email-marketing');
  return { success: true, processedCampaigns: results.length, results };
}

export async function processPendingCampaignsSystemAction(maxCampaigns = 3, batchSize = 75) {
  const campaigns = await prisma.emailCampaign.findMany({
    where: { status: 'PROCESSING' },
    orderBy: { createdAt: 'asc' },
    take: Math.min(10, Math.max(1, maxCampaigns)),
    select: { id: true },
  });

  const results = [];
  for (const campaign of campaigns) {
    const summary = await processCampaignBatchInternal(campaign.id, batchSize);
    results.push({ campaignId: campaign.id, ...summary });
  }

  if (results.length > 0) {
    await writeAdminAuditLog({
      actorType: 'SYSTEM',
      action: 'campaign.process_pending.cron',
      entityType: 'email_campaign',
      metadata: { maxCampaigns, batchSize, processedCampaigns: results.length },
    });
  }

  revalidatePath('/admin/email-marketing');
  return { success: true, processedCampaigns: results.length, results };
}

export async function sendPromotionalCampaignAction(input: CampaignInput) {
  const admin = await requireAdmin({ roles: ['SUPER_ADMIN'] });

  const subject = String(input.subject || '').trim();
  const htmlContent = String(input.htmlContent || '').trim();

  if (!subject) {
    return { success: false, error: 'Subject is required.' };
  }
  if (!htmlContent) {
    return { success: false, error: 'Email HTML content is required.' };
  }
  if ((input.sendMode || 'GENERAL') === 'CORPORATE' && !Number(input.corporateId || 0)) {
    return { success: false, error: 'Please select a corporate to continue.' };
  }
  if (
    (input.sendMode || 'GENERAL') === 'CORPORATE' &&
    !Number(input.corporatePackageId || 0) &&
    ['AVAILED_PACKAGE', 'NOT_AVAILED_PACKAGE'].includes(String(input.corporateSegment || ''))
  ) {
    return { success: false, error: 'Please select a package for the chosen corporate filter.' };
  }

  try {
    const recipients = await buildRecipients(input);
    if (!recipients.length) {
      return { success: false, error: 'No recipients found for selected audience.' };
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        templateName: input.templateName || null,
        contentHtml: htmlContent,
        audienceType: input.audienceType,
        personalize: Boolean(input.personalize),
        totalRecipients: recipients.length,
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    const queued = await enqueueCampaignRecipients(campaign.id, recipients);

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        unsubscribedSkipped: queued.skipped,
      },
    });

    // Process first batch immediately for fast feedback. Remaining can be processed by queue runner/cron.
    const immediate = await processCampaignBatchInternal(campaign.id, 50);

    revalidatePath('/admin/email-marketing');

    return {
      success: true,
      campaignId: campaign.id,
      summary: {
        total: recipients.length,
        sent: immediate.sent,
        failed: immediate.failed,
        skipped: queued.skipped,
        queued: Math.max(0, queued.pending - immediate.processed),
      },
      queued: true,
    };
  } catch (error) {
    console.error('sendPromotionalCampaignAction:', error);
    return { success: false, error: 'Failed to send campaign.' };
  }
  finally {
    await writeAdminAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'campaign.send.requested',
      entityType: 'email_campaign',
      metadata: {
        sendMode: input.sendMode || 'GENERAL',
        audienceType: input.audienceType,
        personalize: Boolean(input.personalize),
        generalSegment: input.generalSegment || null,
        corporateId: input.corporateId || null,
        corporatePackageId: input.corporatePackageId || null,
        corporateSegment: input.corporateSegment || null,
      },
    });
  }
}

export async function getEmailMarketingDashboardAction(search?: string) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  const q = String(search || '').trim().toLowerCase();

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [subscribers, campaigns, recentRecipients, recentAuditLogs, total, active, unsubscribed, corporates, settings] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.emailCampaignRecipient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            subject: true,
          },
        },
      },
      take: 200,
    }),
    prisma.adminAuditLog.findMany({
      where: {
        action: {
          startsWith: 'campaign.',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        adminEmail: true,
        actorType: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
    prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
    prisma.corporate.findMany({
      where: { isActive: true },
      orderBy: { companyName: 'asc' },
      select: {
        id: true,
        companyName: true,
        _count: {
          select: {
            employees: true,
          },
        },
        services: {
          where: {
            isActive: true,
            packageId: { not: null },
          },
          select: {
            packageId: true,
            package: {
              select: {
                id: true,
                packageName: true,
              },
            },
          },
        },
        packages: {
          where: { isActive: true },
          select: {
            id: true,
            packageName: true,
          },
        },
      },
    }),
    getAdminSettings(),
  ]);

  return {
    summary: {
      totalSubscribers: total,
      activeSubscribers: active,
      unsubscribedCount: unsubscribed,
    },
    subscribers: subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      source: s.source,
      status: s.status,
      subscribedAt: s.subscribedAt.toISOString(),
      unsubscribedAt: s.unsubscribedAt ? s.unsubscribedAt.toISOString() : null,
      lastEmailSentAt: s.lastEmailSentAt ? s.lastEmailSentAt.toISOString() : null,
    })),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      subject: c.subject,
      templateName: c.templateName,
      audienceType: c.audienceType,
      personalize: c.personalize,
      status: c.status,
      totalRecipients: c.totalRecipients,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      unsubscribedSkipped: c.unsubscribedSkipped,
      startedAt: c.startedAt ? c.startedAt.toISOString() : null,
      completedAt: c.completedAt ? c.completedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
    recentRecipients: recentRecipients.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      status: r.status,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      campaign: r.campaign,
    })),
    recentAuditLogs: recentAuditLogs.map((row) => ({
      id: row.id,
      action: row.action,
      adminEmail: row.adminEmail,
      actorType: row.actorType,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    })),
    companyIdentity: {
      logoUrl: `${getAppBaseUrl()}/logo.png`,
      brandName: settings.companyProfile.brandName,
      legalName: settings.companyProfile.legalName,
      website: settings.companyProfile.website,
      supportEmail: settings.companyProfile.supportEmail,
      customerCareNumber: settings.companyProfile.customerCareNumber,
      alternateContactNumber: settings.companyProfile.alternateContactNumber,
      addressLine1: settings.companyProfile.addressLine1,
      addressLine2: settings.companyProfile.addressLine2,
      city: settings.companyProfile.city,
      state: settings.companyProfile.state,
      pincode: settings.companyProfile.pincode,
      country: settings.companyProfile.country,
      pan: settings.companyProfile.pan,
      gstin: settings.companyProfile.gstin,
      cin: settings.companyProfile.cin,
    },
    corporates: corporates.map((corporate) => {
      const packageMap = new Map<number, { id: number; packageName: string }>();

      for (const service of corporate.services) {
        if (service.package?.id) {
          packageMap.set(service.package.id, {
            id: service.package.id,
            packageName: service.package.packageName,
          });
        }
      }

      for (const pkg of corporate.packages) {
        packageMap.set(pkg.id, {
          id: pkg.id,
          packageName: pkg.packageName,
        });
      }

      return {
        id: corporate.id,
        companyName: corporate.companyName,
        employeeCount: corporate._count.employees,
        packages: Array.from(packageMap.values()).sort((a, b) => a.packageName.localeCompare(b.packageName)),
      };
    }),
  };
}
