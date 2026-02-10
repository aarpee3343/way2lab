'use client';

import { useEffect, useMemo, useState } from 'react';
import { Megaphone, MailCheck, Send, Users } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getEmailMarketingDashboardAction,
  processPendingCampaignsAction,
  sendPromotionalCampaignAction,
} from '@/app/actions/newsletterActions';

const TEMPLATE_PRESETS: Record<string, string> = {
  promo_basic: `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
  <h2 style="margin:0 0 12px;">Hello {{firstName}},</h2>
  <p>We have a special diagnostic offer for you this week.</p>
  <p>Use code <strong>WELLNESS10</strong> at checkout and save on selected health packages.</p>
  <p>Book now: <a href="https://waytolab.com/search">https://waytolab.com/search</a></p>
</div>`.trim(),
  promo_health_tips: `
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
  custom_blank: '',
};

type DashboardData = Awaited<ReturnType<typeof getEmailMarketingDashboardAction>>;

export default function EmailMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);

  const [subject, setSubject] = useState('');
  const [templateName, setTemplateName] = useState('promo_basic');
  const [audienceType, setAudienceType] = useState<'SUBSCRIBERS' | 'CUSTOMERS' | 'CUSTOM_LIST'>('SUBSCRIBERS');
  const [personalize, setPersonalize] = useState(false);
  const [customEmails, setCustomEmails] = useState('');
  const [htmlContent, setHtmlContent] = useState(TEMPLATE_PRESETS.promo_basic);
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

  const loadData = async (searchText?: string) => {
    const res = await getEmailMarketingDashboardAction(searchText);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSendCampaign = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!htmlContent.trim()) {
      toast.error('HTML content is required');
      return;
    }
    if (audienceType === 'CUSTOM_LIST' && !customEmails.trim()) {
      toast.error('Enter at least one email for custom list');
      return;
    }

    setSending(true);
    try {
      const res = await sendPromotionalCampaignAction({
        subject,
        htmlContent,
        templateName,
        audienceType,
        personalize,
        customEmails,
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
          Manage subscriptions, unsubscribe status, and promotional campaigns.
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

      <div className="admin-card p-6">
        <h2 className="admin-form-title mb-4">
          <Send size={16} /> Send Promotional Email
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="admin-form-label">Subject</label>
            <input
              className="admin-form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter campaign subject"
            />
          </div>

          <div>
            <label className="admin-form-label">Audience</label>
            <select
              className="admin-form-select"
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as 'SUBSCRIBERS' | 'CUSTOMERS' | 'CUSTOM_LIST')}
            >
              <option value="SUBSCRIBERS">All Subscribed Emails</option>
              <option value="CUSTOMERS">All Existing Customers</option>
              <option value="CUSTOM_LIST">Custom Email List</option>
            </select>
          </div>

          <div>
            <label className="admin-form-label">Template Preset</label>
            <select
              className="admin-form-select"
              value={templateName}
              onChange={(e) => {
                const next = e.target.value;
                setTemplateName(next);
                setHtmlContent(TEMPLATE_PRESETS[next] ?? '');
              }}
            >
              <option value="promo_basic">Promotional Offer</option>
              <option value="promo_health_tips">Health Tips</option>
              <option value="custom_blank">Blank Template</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={personalize}
                onChange={(e) => setPersonalize(e.target.checked)}
              />
              <span>Personalize using {'{{name}}'}, {'{{firstName}}'}, {'{{email}}'}</span>
            </label>
          </div>
        </div>

        {audienceType === 'CUSTOM_LIST' && (
          <div className="mt-4">
            <label className="admin-form-label">Custom Emails</label>
            <textarea
              className="admin-form-textarea"
              rows={4}
              placeholder="Add emails separated by comma or new line"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
            />
          </div>
        )}

        <div className="mt-4">
          <label className="admin-form-label">HTML Content</label>
          <textarea
            className="admin-form-textarea font-mono text-xs"
            rows={14}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="HTML supported. Unsubscribe link is auto-injected."
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
                    <td>#{row.campaign.id} - {row.campaign.subject}</td>
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
