'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Clock3,
  Gift,
  Loader2,
  Pause,
  Play,
  Search,
  Send,
  Wallet,
  Eye
} from 'lucide-react';

import {
  addManualWalletCreditAction,
  createWalletCampaignAction,
  getAdminWalletDashboard,
  getWalletCustomerLookup,
  runWalletCampaignAction,
  updateWalletCampaignStatusAction
} from '@/app/actions/adminWalletActions';
import { getISTDateTimeLocalValue } from '@/lib/date-time';
import { toast } from '@/lib/safe-toast';

type WalletDashboardData = Awaited<ReturnType<typeof getAdminWalletDashboard>>;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value || 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminWalletPage() {
  const [data, setData] = useState<WalletDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerLookup, setCustomerLookup] = useState<any>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [creditForm, setCreditForm] = useState({
    phone: '',
    amount: '',
    validityDays: '30',
    reason: ''
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    code: '',
    description: '',
    triggerType: 'NEW_USER_FIRST_ORDER',
    rewardAmount: '',
    rewardValidityDays: '30',
    startDate: getISTDateTimeLocalValue(),
    endDate: '',
    corporateId: '',
    phoneList: '',
    rewardPerOrder: false
  });
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [runningCampaignId, setRunningCampaignId] = useState<number | null>(null);
  const [statusCampaignId, setStatusCampaignId] = useState<number | null>(null);

  const load = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const response = await getAdminWalletDashboard(query);
      setData(response);
    } catch (error) {
      toast.error('Failed to load wallet dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [load, search]);

  const lookupCustomer = async () => {
    const response = await getWalletCustomerLookup(lookupPhone);
    if (!response.success) {
      setCustomerLookup(null);
      toast.error(response.error || 'Customer not found');
      return;
    }
    const customer = response.customer;
    if (!customer) {
      setCustomerLookup(null);
      toast.error('Customer not found');
      return;
    }
    setCustomerLookup(customer);
    setCreditForm((prev) => ({ ...prev, phone: customer.phone }));
  };

  const submitCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCredit(true);
    const response = await addManualWalletCreditAction({
      phone: creditForm.phone,
      amount: Number(creditForm.amount),
      validityDays: creditForm.validityDays ? Number(creditForm.validityDays) : null,
      reason: creditForm.reason
    });
    setSubmittingCredit(false);

    if (!response.success) {
      toast.error(response.error || 'Failed to add wallet credit');
      return;
    }

    toast.success('Wallet credited successfully');
    setCreditForm({ phone: '', amount: '', validityDays: '30', reason: '' });
    setLookupPhone('');
    setCustomerLookup(null);
    load(search);
  };

  const submitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCampaign(true);
    const response = await createWalletCampaignAction({
      name: campaignForm.name,
      code: campaignForm.code || undefined,
      description: campaignForm.description || undefined,
      triggerType: campaignForm.triggerType as any,
      rewardAmount: Number(campaignForm.rewardAmount),
      rewardValidityDays: Number(campaignForm.rewardValidityDays),
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate || undefined,
      corporateId: campaignForm.corporateId || undefined,
      phoneList: campaignForm.phoneList || undefined,
      rewardPerOrder: campaignForm.rewardPerOrder
    });
    setSubmittingCampaign(false);

    if (!response.success) {
      toast.error(response.error || 'Failed to create wallet campaign');
      return;
    }

    toast.success('Wallet campaign created');
    setCampaignForm({
      name: '',
      code: '',
      description: '',
      triggerType: 'NEW_USER_FIRST_ORDER',
      rewardAmount: '',
      rewardValidityDays: '30',
      startDate: getISTDateTimeLocalValue(),
      endDate: '',
      corporateId: '',
      phoneList: '',
      rewardPerOrder: false
    });
    load(search);
  };

  const updateCampaignStatus = async (campaignId: number, nextStatus: 'ACTIVE' | 'PAUSED') => {
    setStatusCampaignId(campaignId);
    const response = await updateWalletCampaignStatusAction(campaignId, nextStatus);
    setStatusCampaignId(null);

    if (!response.success) {
      toast.error(response.error || 'Failed to update campaign status');
      return;
    }

    toast.success(nextStatus === 'ACTIVE' ? 'Campaign started' : 'Campaign paused');
    load(search);
  };

  const runCampaign = async (campaignId: number) => {
    setRunningCampaignId(campaignId);
    const response = await runWalletCampaignAction(campaignId);
    setRunningCampaignId(null);

    if (!response.success) {
      toast.error(response.error || 'Failed to run campaign');
      return;
    }

    const granted = 'granted' in response ? response.granted : 0;
    toast.success(`Campaign processed. ${granted} reward(s) granted.`);
    load(search);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Wallet Control Center</h1>
        <p className="admin-page-subtitle">
          Manage wallet balances, expiry-led credits, and reward campaigns without changing existing payment flows.
        </p>
      </div>

      <div className="admin-stat-grid">
        <StatCard title="Wallet Balance" value={formatMoney(data?.stats.totalBalance || 0)} icon={Wallet} color="bg-emerald-500" />
        <StatCard title="Total Credited" value={formatMoney(data?.stats.totalCredited || 0)} icon={Gift} color="bg-blue-500" />
        <StatCard title="Expiring in 7 Days" value={formatMoney(data?.stats.expiringSoon || 0)} icon={Clock3} color="bg-amber-500" />
        <StatCard title="Active Campaigns" value={String(data?.stats.activeCampaigns || 0)} icon={Activity} color="bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="admin-card xl:col-span-1">
          <div className="admin-card-header">
            <div className="admin-card-title">Manual Wallet Credit</div>
          </div>
          <div className="admin-card-body admin-space-y">
            <div className="space-y-3">
              <label className="admin-form-label">Find Customer by Registered Number</label>
              <div className="flex gap-2">
                <input
                  className="admin-form-input"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="10-digit phone number"
                />
                <button type="button" className="admin-btn-secondary" onClick={lookupCustomer}>
                  <Search size={16} /> Find
                </button>
              </div>
            </div>

            {customerLookup ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="font-bold text-slate-800">{customerLookup.name}</div>
                <div className="text-slate-500">{customerLookup.phone} {customerLookup.uhid ? `• ${customerLookup.uhid}` : ''}</div>
                <div className="mt-1 text-emerald-700 font-semibold">Current balance: {formatMoney(customerLookup.balance || 0)}</div>
              </div>
            ) : null}

            <form onSubmit={submitCredit} className="admin-space-y">
              <div>
                <label className="admin-form-label">Registered Phone</label>
                <input
                  className="admin-form-input"
                  value={creditForm.phone}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Customer phone"
                  required
                />
              </div>
              <div>
                <label className="admin-form-label">Credit Amount</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  required
                />
              </div>
              <div>
                <label className="admin-form-label">Validity (Days)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={creditForm.validityDays}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, validityDays: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="admin-form-label">Reason</label>
                <textarea
                  className="admin-form-textarea"
                  rows={3}
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Campaign grant, retention credit, service recovery..."
                  required
                />
              </div>
              <button disabled={submittingCredit} className="admin-btn-primary w-full">
                {submittingCredit ? <Loader2 className="animate-spin" /> : <Wallet size={16} />}
                Add Wallet Balance
              </button>
            </form>
          </div>
        </div>

        <div className="admin-card xl:col-span-2">
          <div className="admin-card-header">
            <div className="admin-card-title">Customer Wallets</div>
          </div>
          <div className="admin-card-body admin-space-y">
            <div className="admin-search-container">
              <Search className="admin-search-icon" size={18} />
              <input
                className="admin-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer name, phone, email, or UHID"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Balance</th>
                    <th>Lifetime Credit</th>
                    <th>Used / Expired</th>
                    <th>Updated</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.wallets || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">No wallet records found.</td>
                    </tr>
                  ) : (
                    data?.wallets.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="admin-table-row-primary">{row.name}</div>
                          <div className="admin-table-row-secondary">{row.phone || row.email || '-'}</div>
                          {row.uhid ? <div className="admin-table-row-secondary">UHID: {row.uhid}</div> : null}
                        </td>
                        <td className="font-semibold text-emerald-700">{formatMoney(row.balance)}</td>
                        <td>{formatMoney(row.totalCredited)}</td>
                        <td>
                          <div>Used: {formatMoney(row.totalDebited)}</div>
                          <div className="text-xs text-amber-700">Expired: {formatMoney(row.totalExpired)}</div>
                        </td>
                        <td>{formatDateTime(row.updatedAt)}</td>
                        <td className="text-right">
                          <Link href={`/admin/wallet/${row.id}`} className="admin-btn-secondary text-xs">
                            <Eye size={14} /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="admin-card xl:col-span-1">
          <div className="admin-card-header">
            <div className="admin-card-title">Create Wallet Campaign</div>
          </div>
          <div className="admin-card-body">
            <form onSubmit={submitCampaign} className="admin-space-y">
              <div>
                <label className="admin-form-label">Campaign Name</label>
                <input className="admin-form-input" value={campaignForm.name} onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label className="admin-form-label">Campaign Code</label>
                <input className="admin-form-input" value={campaignForm.code} onChange={(e) => setCampaignForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="Optional" />
              </div>
              <div>
                <label className="admin-form-label">Trigger Type</label>
                <select className="admin-form-select" value={campaignForm.triggerType} onChange={(e) => setCampaignForm((prev) => ({ ...prev, triggerType: e.target.value, corporateId: '', phoneList: '' }))}>
                  <option value="NEW_USER_FIRST_ORDER">New user registration + first order</option>
                  <option value="CORPORATE_BENEFIT_ORDER">Corporate benefit order</option>
                  <option value="DATE_RANGE_ORDER">Any order in date range</option>
                  <option value="MANUAL_SEGMENT">Manual customer segment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-form-label">Reward Amount</label>
                  <input type="number" className="admin-form-input" value={campaignForm.rewardAmount} onChange={(e) => setCampaignForm((prev) => ({ ...prev, rewardAmount: e.target.value }))} required />
                </div>
                <div>
                  <label className="admin-form-label">Validity Days</label>
                  <input type="number" className="admin-form-input" value={campaignForm.rewardValidityDays} onChange={(e) => setCampaignForm((prev) => ({ ...prev, rewardValidityDays: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="admin-form-label">Start Date</label>
                <input type="datetime-local" className="admin-form-input" value={campaignForm.startDate} onChange={(e) => setCampaignForm((prev) => ({ ...prev, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="admin-form-label">End Date</label>
                <input type="datetime-local" className="admin-form-input" value={campaignForm.endDate} onChange={(e) => setCampaignForm((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
              {(campaignForm.triggerType === 'CORPORATE_BENEFIT_ORDER' || campaignForm.triggerType === 'MANUAL_SEGMENT') ? (
                <div>
                  <label className="admin-form-label">Corporate</label>
                  <select className="admin-form-select" value={campaignForm.corporateId} onChange={(e) => setCampaignForm((prev) => ({ ...prev, corporateId: e.target.value }))}>
                    <option value="">Select corporate</option>
                    {(data?.corporates || []).map((corp) => (
                      <option key={corp.id} value={corp.id}>{corp.companyName}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {campaignForm.triggerType === 'MANUAL_SEGMENT' ? (
                <div>
                  <label className="admin-form-label">Customer Phone List</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    value={campaignForm.phoneList}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, phoneList: e.target.value }))}
                    placeholder="Enter one phone per line or comma separated"
                  />
                </div>
              ) : null}
              {(campaignForm.triggerType === 'CORPORATE_BENEFIT_ORDER' || campaignForm.triggerType === 'DATE_RANGE_ORDER') ? (
                <label className="admin-form-checkbox">
                  <input
                    type="checkbox"
                    checked={campaignForm.rewardPerOrder}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, rewardPerOrder: e.target.checked }))}
                  />
                  <span>Reward each qualifying order instead of only once per user</span>
                </label>
              ) : null}
              <div>
                <label className="admin-form-label">Description</label>
                <textarea className="admin-form-textarea" rows={3} value={campaignForm.description} onChange={(e) => setCampaignForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <button disabled={submittingCampaign} className="admin-btn-primary w-full">
                {submittingCampaign ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                Save Campaign
              </button>
            </form>
          </div>
        </div>

        <div className="admin-card xl:col-span-2">
          <div className="admin-card-header">
            <div className="admin-card-title">Wallet Campaigns</div>
          </div>
          <div className="admin-card-body grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(data?.campaigns || []).length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                No wallet campaigns created yet.
              </div>
            ) : (
              data?.campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{campaign.name}</div>
                      <div className="text-xs text-slate-500">{campaign.triggerType.replaceAll('_', ' ')}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      campaign.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : campaign.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400">Reward</div>
                      <div className="font-semibold text-slate-800">{formatMoney(campaign.rewardAmount)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Validity</div>
                      <div className="font-semibold text-slate-800">{campaign.rewardValidityDays} days</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Awards</div>
                      <div className="font-semibold text-slate-800">{campaign.totalAwards}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Awarded Amount</div>
                      <div className="font-semibold text-slate-800">{formatMoney(campaign.totalAwardAmount)}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Start: {formatDateTime(campaign.startDate)}</div>
                    <div>End: {formatDateTime(campaign.endDate)}</div>
                    <div>Last Run: {formatDateTime(campaign.lastRunAt)}</div>
                    {campaign.lastRunNote ? <div>{campaign.lastRunNote}</div> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {campaign.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        className="admin-btn-secondary text-xs"
                        disabled={statusCampaignId === campaign.id}
                        onClick={() => updateCampaignStatus(campaign.id, 'PAUSED')}
                      >
                        {statusCampaignId === campaign.id ? <Loader2 className="animate-spin" size={14} /> : <Pause size={14} />}
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn-primary text-xs"
                        disabled={statusCampaignId === campaign.id}
                        onClick={() => updateCampaignStatus(campaign.id, 'ACTIVE')}
                      >
                        {statusCampaignId === campaign.id ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                        Start
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn-secondary text-xs"
                      disabled={runningCampaignId === campaign.id}
                      onClick={() => runCampaign(campaign.id)}
                    >
                      {runningCampaignId === campaign.id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      Run Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon-container ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="admin-stat-value text-xl">{value}</div>
        <div className="admin-stat-label">{title}</div>
      </div>
    </div>
  );
}
