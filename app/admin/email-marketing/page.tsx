'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, MailCheck, Megaphone, Send, Sparkles, Target, Users, WandSparkles } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getEmailMarketingDashboardAction,
  processPendingCampaignsAction,
  sendPromotionalCampaignAction,
} from '@/app/actions/newsletterActions';

function buildCorporateWowTemplate(company: {
  logoUrl: string;
  brandName: string;
  legalName: string;
  website: string;
  supportEmail: string;
  customerCareNumber: string;
  alternateContactNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  pan: string;
  gstin: string;
  cin: string;
}) {
  const contactParts = [company.customerCareNumber, company.alternateContactNumber].filter(Boolean).join(' | ');
  const addressParts = [
    company.addressLine1,
    company.addressLine2,
    company.city,
    company.state,
    company.pincode,
    company.country,
  ]
    .filter(Boolean)
    .join(', ');
  const identityParts = [
    company.legalName && `Legal Name: ${company.legalName}`,
    company.gstin && `GSTIN: ${company.gstin}`,
    company.pan && `PAN: ${company.pan}`,
    company.cin && `CIN: ${company.cin}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return `
<div style="margin:0;padding:0;background-color:#eef4ff;font-family:Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef4ff;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:18px 10px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:24px 22px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 70%,#38bdf8 100%);">
              <img src="${company.logoUrl}" alt="${company.brandName}" width="118" style="display:block;width:118px;max-width:100%;height:auto;border:0;" />
              <p style="margin:18px 0 8px;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#bfdbfe;">Corporate Wellness Access</p>
              <h1 style="margin:0 0 10px;font-size:26px;line-height:32px;font-weight:700;color:#ffffff;">{{firstName}}, your {{corporateName}} health benefits are ready.</h1>
              <p style="margin:0;font-size:14px;line-height:22px;color:#dbeafe;">
                You now have access to your mapped wellness benefits on ${company.brandName}. Review your assigned packages and book in a few taps.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 22px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:0 0 12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fbff;border:1px solid #dbeafe;border-radius:18px;">
                      <tr>
                        <td style="padding:16px 16px 10px;">
                          <p style="margin:0 0 6px;font-size:11px;line-height:16px;letter-spacing:1.8px;text-transform:uppercase;color:#2563eb;">Corporate</p>
                          <p style="margin:0;font-size:20px;line-height:26px;font-weight:700;color:#0f172a;">{{corporateName}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 16px 16px;">
                          <p style="margin:0;font-size:13px;line-height:20px;color:#475569;">Assigned packages: <strong>{{packageCount}}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;">
                      <tr>
                        <td style="padding:16px 16px 8px;">
                          <p style="margin:0 0 6px;font-size:11px;line-height:16px;letter-spacing:1.8px;text-transform:uppercase;color:#4338ca;">Mapped For You</p>
                          <p style="margin:0;font-size:14px;line-height:22px;color:#334155;">{{assignedPackages}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 18px;">
                    <p style="margin:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#0f172a;">Use your corporate benefits with a faster booking flow.</p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">Choose your preferred package, pick a convenient slot, and complete the order in minutes.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 22px;">
                    <a href="https://waytolab.com/dashboard/benefits" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;line-height:20px;font-weight:700;padding:12px 20px;border-radius:999px;">Open my benefits</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 22px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;font-size:12px;line-height:18px;font-weight:700;color:#0f172a;">${company.brandName}</p>
              ${
                addressParts
                  ? `<p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#475569;">${addressParts}</p>`
                  : ''
              }
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#475569;">
                ${company.website ? `<a href="${company.website}" style="color:#1d4ed8;text-decoration:none;">${company.website}</a>` : ''}
                ${company.website && (company.supportEmail || contactParts) ? ' | ' : ''}
                ${company.supportEmail ? `<a href="mailto:${company.supportEmail}" style="color:#1d4ed8;text-decoration:none;">${company.supportEmail}</a>` : ''}
                ${(company.website || company.supportEmail) && contactParts ? ' | ' : ''}
                ${contactParts}
              </p>
              ${identityParts ? `<p style="margin:0 0 10px;font-size:11px;line-height:17px;color:#64748b;">${identityParts}</p>` : ''}
              <p style="margin:0 0 8px;font-size:11px;line-height:17px;color:#64748b;">This email was sent by your authorized Wellness Partner, authorized by your corporate entity.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`.trim();
}

const TEMPLATE_PRESETS = {
  promo_basic: {
    label: 'Flash Offer',
    blurb: 'Short campaign for subscribers and broad customer blasts.',
    html: `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
  <h2 style="margin:0 0 12px;">Hello {{firstName}},</h2>
  <p>We have a special diagnostic offer for you this week.</p>
  <p>Use code <strong>WELLNESS10</strong> at checkout and save on selected health packages.</p>
  <p>Book now: <a href="https://waytolab.com/search">https://waytolab.com/search</a></p>
</div>`.trim(),
  },
  growth_reactivation: {
    label: 'Order Reactivation',
    blurb: 'Best for inactive or no-order audiences to increase conversions.',
    html: `
<div style="font-family:Arial,sans-serif;line-height:1.7;color:#172554;background:#eff6ff;padding:28px;border-radius:24px;">
  <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1d4ed8;">Way2Lab Priority Access</p>
  <h2 style="margin:0 0 12px;font-size:28px;color:#0f172a;">{{firstName}}, it is a smart week to book your next health check.</h2>
  <p style="margin:0 0 18px;color:#334155;">Get faster booking slots, trusted lab partners, and curated preventive packages built for busy schedules.</p>
  <div style="background:#ffffff;border-radius:18px;padding:18px 20px;margin:0 0 18px;border:1px solid #bfdbfe;">
    <p style="margin:0 0 8px;font-weight:700;color:#0f172a;">Why customers are booking now</p>
    <ul style="margin:0;padding-left:18px;color:#475569;">
      <li>Better preventive screening bundles</li>
      <li>Flexible home collection and faster slot discovery</li>
      <li>One place to compare labs and complete checkout</li>
    </ul>
  </div>
  <a href="https://waytolab.com/search" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;">Explore packages</a>
</div>`.trim(),
  },
  promo_health_tips: {
    label: 'Health Tips',
    blurb: 'Educational message with a softer marketing tone.',
    html: `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
  <h2 style="margin:0 0 12px;">Health Update for {{name}}</h2>
  <p>Stay proactive with routine diagnostics and preventive screening.</p>
  <ul>
    <li>Annual full body checkup</li>
    <li>Blood sugar and thyroid monitoring</li>
    <li>Cardiac risk profile review</li>
  </ul>
  <p>Need help booking? Reply to this email.</p>
</div>`.trim(),
  },
  corporate_wow: {
    label: 'Corporate WOW',
    blurb: 'Stylish corporate mail with company and assigned-package personalization.',
    html: '',
  },
  custom_blank: {
    label: 'Blank Template',
    blurb: 'Start from scratch with full HTML control.',
    html: '',
  },
} satisfies Record<string, { label: string; blurb: string; html: string }>;

const SEND_MODES = [
  { value: 'GENERAL', label: 'General Marketing', description: 'Growth campaigns for subscribers and customers.', icon: Target },
  { value: 'CORPORATE', label: 'Corporate Campaign', description: 'Target one corporate with package-aware messaging.', icon: Building2 },
  { value: 'CUSTOM_LIST', label: 'Custom Email List', description: 'Send to pasted addresses only.', icon: Send },
] as const;

const GENERAL_SEGMENTS = [
  { value: 'ALL_SUBSCRIBERS', label: 'All subscribed emails', hint: 'Broadest reach for awareness campaigns.' },
  { value: 'ALL_CUSTOMERS', label: 'All existing customers', hint: 'Reach every customer with a valid email.' },
  { value: 'NO_ORDERS', label: 'Customers with no orders', hint: 'Best for first-order conversion pushes.' },
  { value: 'ONE_TIME_CUSTOMERS', label: 'One-time customers', hint: 'Good for repeat-purchase nudges.' },
  { value: 'INACTIVE_90_DAYS', label: 'Inactive 90+ days', hint: 'Useful for win-back campaigns.' },
] as const;

const CORPORATE_SEGMENTS = [
  { value: 'ALL_CORPORATE_USERS', label: 'All corporate users', hint: 'Send to every employee mapped to that corporate.' },
  { value: 'AVAILED_PACKAGE', label: 'Who availed package', hint: 'Only users who already used the selected package.' },
  { value: 'NOT_AVAILED_PACKAGE', label: 'Did not avail package', hint: 'Users assigned the selected package but not used yet.' },
] as const;

const PERSONALIZATION_TOKENS = ['{{name}}', '{{firstName}}', '{{email}}', '{{corporateName}}', '{{assignedPackages}}', '{{packageCount}}'];

type DashboardData = Awaited<ReturnType<typeof getEmailMarketingDashboardAction>>;
type SendMode = (typeof SEND_MODES)[number]['value'];
type GeneralSegment = (typeof GENERAL_SEGMENTS)[number]['value'];
type CorporateSegment = (typeof CORPORATE_SEGMENTS)[number]['value'];
type TemplateName = keyof typeof TEMPLATE_PRESETS;

function getTemplateHtml(templateName: TemplateName, data: DashboardData | null) {
  if (templateName === 'corporate_wow') {
    return buildCorporateWowTemplate(
      data?.companyIdentity || {
        logoUrl: '/logo.png',
        brandName: 'WayToLab',
        legalName: 'WayToLab Healthcare Private Limited',
        website: 'https://way2lab.com',
        supportEmail: '',
        customerCareNumber: '',
        alternateContactNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        pan: '',
        gstin: '',
        cin: '',
      }
    );
  }

  return TEMPLATE_PRESETS[templateName].html;
}

function getAudienceType(sendMode: SendMode, generalSegment: GeneralSegment) {
  if (sendMode === 'CUSTOM_LIST') return 'CUSTOM_LIST' as const;
  if (sendMode === 'CORPORATE') return 'CUSTOMERS' as const;
  return generalSegment === 'ALL_SUBSCRIBERS' ? ('SUBSCRIBERS' as const) : ('CUSTOMERS' as const);
}

export default function EmailMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [subject, setSubject] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('GENERAL');
  const [templateName, setTemplateName] = useState<TemplateName>('promo_basic');
  const [generalSegment, setGeneralSegment] = useState<GeneralSegment>('ALL_SUBSCRIBERS');
  const [corporateId, setCorporateId] = useState('');
  const [corporatePackageId, setCorporatePackageId] = useState('');
  const [corporateSegment, setCorporateSegment] = useState<CorporateSegment>('ALL_CORPORATE_USERS');
  const [personalize, setPersonalize] = useState(true);
  const [customEmails, setCustomEmails] = useState('');
  const [htmlContent, setHtmlContent] = useState(TEMPLATE_PRESETS.promo_basic.html);
  const [sending, setSending] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);

  const filteredSubscribers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.subscribers;
    return data.subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.source || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const selectedCorporate = useMemo(() => {
    if (!data) return null;
    return data.corporates.find((corporate) => String(corporate.id) === corporateId) || null;
  }, [corporateId, data]);

  const corporatePackages = useMemo(() => selectedCorporate?.packages || [], [selectedCorporate]);
  const selectedTemplate = TEMPLATE_PRESETS[templateName];
  const selectedGeneralSegment = GENERAL_SEGMENTS.find((segment) => segment.value === generalSegment);
  const selectedCorporateSegment = CORPORATE_SEGMENTS.find((segment) => segment.value === corporateSegment);
  const resolvedAudienceType = getAudienceType(sendMode, generalSegment);

  const loadData = async (searchText?: string) => {
    const res = await getEmailMarketingDashboardAction(searchText);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedCorporate) {
      setCorporatePackageId('');
      setCorporateSegment('ALL_CORPORATE_USERS');
      return;
    }

    if (corporatePackageId && !selectedCorporate.packages.some((pkg) => String(pkg.id) === corporatePackageId)) {
      setCorporatePackageId('');
      setCorporateSegment('ALL_CORPORATE_USERS');
    }
  }, [corporatePackageId, selectedCorporate]);

  useEffect(() => {
    if (!corporatePackageId && corporateSegment !== 'ALL_CORPORATE_USERS') {
      setCorporateSegment('ALL_CORPORATE_USERS');
    }
  }, [corporatePackageId, corporateSegment]);

  const applyTemplate = (next: TemplateName) => {
    setTemplateName(next);
    setHtmlContent(getTemplateHtml(next, data));
    if (next === 'corporate_wow') {
      setPersonalize(true);
    }
  };

  const onSendCampaign = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!htmlContent.trim()) {
      toast.error('HTML content is required');
      return;
    }
    if (sendMode === 'CUSTOM_LIST' && !customEmails.trim()) {
      toast.error('Enter at least one email for custom list');
      return;
    }
    if (sendMode === 'CORPORATE' && !corporateId) {
      toast.error('Select a corporate first');
      return;
    }
    if (sendMode === 'CORPORATE' && !corporatePackageId && corporateSegment !== 'ALL_CORPORATE_USERS') {
      toast.error('Choose a package for availed or not-availed targeting');
      return;
    }

    setSending(true);
    try {
      const res = await sendPromotionalCampaignAction({
        subject,
        htmlContent,
        templateName,
        audienceType: resolvedAudienceType,
        sendMode,
        personalize,
        customEmails,
        generalSegment,
        corporateId: corporateId ? Number(corporateId) : null,
        corporatePackageId: corporatePackageId ? Number(corporatePackageId) : null,
        corporateSegment,
      });

      if (!res.success) {
        toast.error(res.error || 'Campaign failed');
        return;
      }

      toast.success(
        `Campaign queued. Immediate sent: ${res.summary?.sent ?? 0}, failed: ${res.summary?.failed ?? 0}, queued: ${res.summary?.queued ?? 0}`
      );
      await loadData(search);
    } finally {
      setSending(false);
    }
  };

  const onProcessQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await processPendingCampaignsAction(3, 75);
      if (!res.success) {
        toast.error('Failed to process queue');
        return;
      }
      toast.success(`Processed ${res.processedCampaigns} campaign queue batch(es).`);
      await loadData(search);
    } finally {
      setProcessingQueue(false);
    }
  };

  if (loading || !data) {
    return <div className="p-10 text-center text-slate-400">Loading email marketing...</div>;
  }

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title flex items-center gap-2">
          <Megaphone size={22} /> Email Marketing
        </h1>
        <p className="admin-page-subtitle">
          Manage subscriptions, targeted campaigns, and corporate outreach from one workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <p className="text-xs text-slate-500 font-semibold">Total Subscribers</p>
          <p className="text-2xl font-black text-slate-900">{data.summary.totalSubscribers}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs text-slate-500 font-semibold">Active</p>
          <p className="text-2xl font-black text-emerald-600">{data.summary.activeSubscribers}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs text-slate-500 font-semibold">Unsubscribed</p>
          <p className="text-2xl font-black text-amber-600">{data.summary.unsubscribedCount}</p>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="p-6">
            <div className="mb-6 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_45%,#f8fafc_100%)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700">
                    <Sparkles size={12} /> Campaign Studio
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">Choose how this email should be sent</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Use corporate mode for company-specific mail with package targeting. Use general marketing when the goal is to increase overall order count.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-950 px-4 py-3 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Recommended</p>
                  <p className="mt-1 text-sm font-semibold">
                    {sendMode === 'CORPORATE' ? 'Corporate WOW + personalization ON' : 'Inactive 90+ days for win-back'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SEND_MODES.map((mode) => {
                const Icon = mode.icon;
                const active = sendMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setSendMode(mode.value);
                      if (mode.value === 'CORPORATE' && templateName === 'promo_basic') {
                        applyTemplate('corporate_wow');
                      }
                    }}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_24px_50px_rgba(15,23,42,0.22)]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                          active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="font-bold">{mode.label}</p>
                        <p className={`text-xs ${active ? 'text-slate-200' : 'text-slate-500'}`}>{mode.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="admin-form-label">Subject</label>
                <input
                  className="admin-form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    sendMode === 'CORPORATE'
                      ? 'Example: Your corporate wellness access is now live'
                      : 'Enter campaign subject'
                  }
                />
              </div>

              <div>
                <label className="admin-form-label">Template Preset</label>
                <select
                  className="admin-form-select"
                  value={templateName}
                  onChange={(e) => applyTemplate(e.target.value as TemplateName)}
                >
                  {Object.entries(TEMPLATE_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">{selectedTemplate.blurb}</p>
              </div>
            </div>

            {sendMode === 'GENERAL' && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-slate-900">
                  <Target size={16} />
                  <h3 className="font-bold">General marketing audience</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-form-label">Audience segment</label>
                    <select
                      className="admin-form-select"
                      value={generalSegment}
                      onChange={(e) => setGeneralSegment(e.target.value as GeneralSegment)}
                    >
                      {GENERAL_SEGMENTS.map((segment) => (
                        <option key={segment.value} value={segment.value}>
                          {segment.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Order Growth Tip</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedGeneralSegment?.hint || 'Choose a segment based on the conversion goal.'}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      For increasing orders, start with `Customers with no orders` or `Inactive 90+ days`.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sendMode === 'CORPORATE' && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-slate-900">
                  <Building2 size={16} />
                  <h3 className="font-bold">Corporate targeting</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="admin-form-label">Select corporate</label>
                    <select
                      className="admin-form-select"
                      value={corporateId}
                      onChange={(e) => setCorporateId(e.target.value)}
                    >
                      <option value="">Choose corporate</option>
                      {data.corporates.map((corporate) => (
                        <option key={corporate.id} value={corporate.id}>
                          {corporate.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-form-label">Select package (optional)</label>
                    <select
                      className="admin-form-select"
                      value={corporatePackageId}
                      onChange={(e) => setCorporatePackageId(e.target.value)}
                      disabled={!selectedCorporate}
                    >
                      <option value="">Not package specific</option>
                      {corporatePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.packageName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-form-label">Send to</label>
                    <select
                      className="admin-form-select"
                      value={corporateSegment}
                      onChange={(e) => setCorporateSegment(e.target.value as CorporateSegment)}
                      disabled={!corporatePackageId}
                    >
                      {CORPORATE_SEGMENTS.map((segment) => (
                        <option
                          key={segment.value}
                          value={segment.value}
                          disabled={!corporatePackageId && segment.value !== 'ALL_CORPORATE_USERS'}
                        >
                          {segment.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Corporate snapshot</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{selectedCorporate?.companyName || 'No corporate selected'}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedCorporate
                        ? `${selectedCorporate.employeeCount} mapped users and ${selectedCorporate.packages.length} available packages`
                        : 'Choose a corporate to unlock package-aware targeting.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Targeting rule</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedCorporateSegment?.hint || 'All corporate users will receive this email.'}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      `Who availed package` and `Did not avail package` work only when a package is selected.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sendMode === 'CUSTOM_LIST' && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <label className="admin-form-label">Custom Emails</label>
                <textarea
                  className="admin-form-textarea"
                  rows={5}
                  placeholder="Add emails separated by comma or new line"
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                />
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="admin-form-label mb-0">HTML Content</label>
                  <p className="text-xs text-slate-500">HTML is supported. Unsubscribe link is auto-injected.</p>
                </div>
                <label className="admin-form-checkbox">
                  <input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} />
                  <span>Use personalization tokens</span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {PERSONALIZATION_TOKENS.map((token) => (
                  <span
                    key={token}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {token}
                  </span>
                ))}
              </div>

              <textarea
                className="admin-form-textarea mt-4 font-mono text-xs"
                rows={18}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Build the campaign HTML here"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="admin-btn-primary" onClick={onSendCampaign} disabled={sending}>
                <MailCheck size={16} /> {sending ? 'Sending...' : 'Send Campaign'}
              </button>
              <button className="admin-btn-secondary" onClick={onProcessQueue} disabled={processingQueue}>
                <Send size={16} /> {processingQueue ? 'Processing Queue...' : 'Process Queue Now'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 p-6 xl:border-l xl:border-t-0">
            <div className="rounded-[30px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_48%,#0f766e_100%)] p-5 text-white shadow-[0_30px_70px_rgba(15,23,42,0.22)]">
              <div className="flex items-center gap-2 text-sky-200">
                <WandSparkles size={16} />
                <p className="text-xs font-bold uppercase tracking-[0.22em]">Live Strategy</p>
              </div>
              <h3 className="mt-3 text-2xl font-black">
                {sendMode === 'CORPORATE' ? 'Corporate messages can be fully personalized' : 'Use segmented campaigns to lift order count'}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                {sendMode === 'CORPORATE'
                  ? 'This flow injects employee name, corporate name, and assigned package summary when personalization is enabled.'
                  : 'General campaigns now let you target no-order, one-time, and inactive users instead of only blasting everyone.'}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current delivery setup</p>
                <div className="mt-3 space-y-3 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Send mode</span>
                    <span className="font-semibold text-slate-900">
                      {SEND_MODES.find((mode) => mode.value === sendMode)?.label}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Audience type</span>
                    <span className="font-semibold text-slate-900">{resolvedAudienceType}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Template</span>
                    <span className="font-semibold text-slate-900">{selectedTemplate.label}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Personalization</span>
                    <span className="font-semibold text-slate-900">{personalize ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Use this when</p>
                <div className="mt-3 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">General:</span> acquisition, reactivation, and order-growth promotions.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Corporate:</span> company-specific benefit activation, package reminders, and utilization campaigns.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Custom list:</span> one-off outreach to manually prepared recipients.
                  </p>
                </div>
              </div>

              {sendMode === 'CORPORATE' && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Corporate tokens preview</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">{'{{corporateName}}'}</span> inserts the selected user&apos;s company.
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">{'{{assignedPackages}}'}</span> inserts that user&apos;s assigned packages.
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">{'{{packageCount}}'}</span> inserts the number of assigned packages.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="admin-form-title">
            <Users size={16} /> Subscribers ({filteredSubscribers.length})
          </h2>
          <input
            className="admin-form-input w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email/name/source"
          />
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Source</th>
                <th>Subscribed</th>
                <th>Unsubscribed</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No subscriber records found.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-700">{row.email}</td>
                    <td>{row.name || '-'}</td>
                    <td>
                      <span
                        className={`admin-status-indicator ${
                          row.status === 'SUBSCRIBED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.source || '-'}</td>
                    <td>{new Date(row.subscribedAt).toLocaleString()}</td>
                    <td>{row.unsubscribedAt ? new Date(row.unsubscribedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card p-6">
        <h2 className="admin-form-title mb-4">Campaign History</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Total</th>
                <th>Sent</th>
                <th>Failed</th>
                <th>Skipped</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    No campaigns yet.
                  </td>
                </tr>
              ) : (
                data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">#{c.id}</td>
                    <td>{c.subject}</td>
                    <td>{c.audienceType}</td>
                    <td>{c.status}</td>
                    <td>{c.totalRecipients}</td>
                    <td className="text-emerald-700">{c.sentCount}</td>
                    <td className="text-rose-700">{c.failedCount}</td>
                    <td className="text-amber-700">{c.unsubscribedSkipped}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card p-6">
        <h2 className="admin-form-title mb-4">Recent Delivery Status</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Email</th>
                <th>Status</th>
                <th>Error</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecipients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No delivery records available.
                  </td>
                </tr>
              ) : (
                data.recentRecipients.map((row) => (
                  <tr key={row.id}>
                    <td>
                      #{row.campaign.id} - {row.campaign.subject}
                    </td>
                    <td>{row.email}</td>
                    <td>{row.status}</td>
                    <td>{row.errorMessage || '-'}</td>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card p-6">
        <h2 className="admin-form-title mb-4">Audit Trail</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No audit events available.
                  </td>
                </tr>
              ) : (
                data.recentAuditLogs.map((row) => (
                  <tr key={row.id}>
                    <td>{row.action}</td>
                    <td>{row.adminEmail || row.actorType}</td>
                    <td>{row.entityType ? `${row.entityType}${row.entityId ? `:${row.entityId}` : ''}` : '-'}</td>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
