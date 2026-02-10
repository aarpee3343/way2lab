'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { writeAdminAuditLog } from '@/lib/audit';

type AudienceType = 'SUBSCRIBERS' | 'CUSTOMERS' | 'CUSTOM_LIST';

type CampaignInput = {
  subject: string;
  htmlContent: string;
  templateName?: string;
  audienceType: AudienceType;
  personalize?: boolean;
  customEmails?: string;
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

function applyPersonalization(html: string, vars: { name?: string; email: string; firstName?: string }) {
  return html
    .replace(/\{\{\s*name\s*\}\}/gi, escapeHtml(vars.name || 'Valued Customer'))
    .replace(/\{\{\s*firstName\s*\}\}/gi, escapeHtml(vars.firstName || vars.name || 'Customer'))
    .replace(/\{\{\s*email\s*\}\}/gi, escapeHtml(vars.email));
}

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

async function buildRecipients(audienceType: AudienceType, customEmails?: string) {
  const recipientMap = new Map<string, RecipientCandidate>();

  if (audienceType === 'SUBSCRIBERS') {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    for (const sub of subscribers) {
      recipientMap.set(sub.email, {
        email: sub.email,
        name: sub.name,
        subscriberId: sub.id,
        unsubscribeToken: sub.unsubscribeToken,
        isUnsubscribed: sub.status === 'UNSUBSCRIBED',
      });
    }
  }

  if (audienceType === 'CUSTOMERS') {
    const customers = await prisma.customer.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
  }

  if (audienceType === 'CUSTOM_LIST') {
    const emails = parseCustomEmails(customEmails || '');

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
    subscriber: { unsubscribeToken: string } | null;
  },
  campaign: {
    subject: string;
    contentHtml: string;
    personalize: boolean;
  }
) {
  const firstName = (recipient.name || '').trim().split(/\s+/)[0] || 'Customer';
  const personalizedHtml = campaign.personalize
    ? applyPersonalization(campaign.contentHtml, {
        name: recipient.name || undefined,
        email: recipient.email,
        firstName,
      })
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

  try {
    const recipients = await buildRecipients(input.audienceType, input.customEmails);
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
        audienceType: input.audienceType,
        personalize: Boolean(input.personalize),
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

  const [subscribers, campaigns, recentRecipients, recentAuditLogs, total, active, unsubscribed] = await Promise.all([
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
  };
}
