import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CreditCard, History, Wallet } from 'lucide-react';

import { getAdminWalletCustomerDetail } from '@/app/actions/adminWalletActions';

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

export default async function AdminWalletCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminWalletCustomerDetail(Number(id));

  if (!detail) notFound();

  return (
    <div className="admin-space-y">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Customer Wallet</h1>
          <p className="admin-page-subtitle">
            {detail.customer.name} {detail.customer.phone ? `• ${detail.customer.phone}` : ''}
            {detail.customer.uhid ? ` • ${detail.customer.uhid}` : ''}
          </p>
        </div>
        <Link href="/admin/wallet" className="admin-btn-secondary">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="admin-stat-grid">
        <StatCard icon={<Wallet size={18} />} label="Available" value={formatMoney(detail.wallet.balance)} />
        <StatCard icon={<CreditCard size={18} />} label="Credited" value={formatMoney(detail.wallet.totalCredited)} />
        <StatCard icon={<History size={18} />} label="Used" value={formatMoney(detail.wallet.totalDebited)} />
        <StatCard icon={<History size={18} />} label="Expired" value={formatMoney(detail.wallet.totalExpired)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Active Credit Lots</div>
          </div>
          <div className="admin-card-body">
            {detail.credits.length === 0 ? (
              <div className="text-sm text-slate-400">No active wallet credits.</div>
            ) : (
              <div className="space-y-3">
                {detail.credits.map((credit) => (
                  <div key={credit.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-800">{formatMoney(credit.remainingAmount)} remaining</div>
                      <div className="text-xs text-slate-500">Expires {formatDateTime(credit.expiresAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Original: {formatMoney(credit.originalAmount)}
                    </div>
                    {credit.description ? <div className="mt-1 text-sm text-slate-600">{credit.description}</div> : null}
                    {credit.campaignName ? <div className="mt-1 text-xs text-blue-600">Campaign: {credit.campaignName}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Wallet Ledger</div>
          </div>
          <div className="admin-card-body">
            {detail.transactions.length === 0 ? (
              <div className="text-sm text-slate-400">No wallet transactions yet.</div>
            ) : (
              <div className="space-y-3">
                {detail.transactions.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-800">{row.description || row.sourceType.replaceAll('_', ' ')}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</div>
                      </div>
                      <div className={`font-bold ${row.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {row.amount >= 0 ? '+' : ''}{formatMoney(row.amount)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Balance after: {formatMoney(row.balanceAfter)}
                    </div>
                    {row.campaignName ? <div className="mt-1 text-xs text-blue-600">Campaign: {row.campaignName}</div> : null}
                    {row.orderNumber ? <div className="mt-1 text-xs text-slate-600">Order: {row.orderNumber}</div> : null}
                    {row.adminName ? <div className="mt-1 text-xs text-slate-600">Admin: {row.adminName}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon-container bg-slate-900">{icon}</div>
      <div>
        <div className="admin-stat-value text-xl">{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
