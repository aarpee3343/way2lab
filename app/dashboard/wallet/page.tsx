import { Clock3, Gift, History, Wallet } from 'lucide-react';
import { redirect } from 'next/navigation';

import { getCurrentUserWalletOverview } from '@/app/actions/adminWalletActions';

export const dynamic = 'force-dynamic';

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

export default async function DashboardWalletPage() {
  let data;
  try {
    data = await getCurrentUserWalletOverview();
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') {
      redirect('/login');
    }
    throw error;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Wallet</h1>
        <p className="mt-1 text-slate-500">
          Admin-managed wallet credits, expiry schedule, and usage history for your account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Available Balance" value={formatMoney(data.wallet.balance)} icon={<Wallet size={18} className="text-emerald-700" />} />
        <StatCard label="Total Credited" value={formatMoney(data.wallet.totalCredited)} icon={<Gift size={18} className="text-blue-700" />} />
        <StatCard label="Used" value={formatMoney(data.wallet.totalDebited)} icon={<History size={18} className="text-slate-700" />} />
        <StatCard label="Expired" value={formatMoney(data.wallet.totalExpired)} icon={<Clock3 size={18} className="text-amber-700" />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Wallet Identity</h2>
            <p className="text-sm text-slate-500">
              Wallet credits are non-transferable, non-withdrawable, and can only be granted by admin or approved campaigns.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            UHID: <span className="font-semibold text-slate-800">{data.customer.uhid || 'Not assigned yet'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-800">Active Credit Lots</h2>
          <p className="mt-1 text-sm text-slate-500">Credits with remaining usable balance and expiry.</p>
          <div className="mt-5 space-y-3">
            {data.credits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                No active wallet credits available.
              </div>
            ) : (
              data.credits.map((credit) => (
                <div key={credit.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">{formatMoney(credit.remainingAmount)} remaining</div>
                      <div className="text-xs text-slate-500">Original {formatMoney(credit.originalAmount)}</div>
                    </div>
                    <div className="text-xs text-amber-700">Expires {formatDateTime(credit.expiresAt)}</div>
                  </div>
                  {credit.description ? <div className="mt-2 text-sm text-slate-600">{credit.description}</div> : null}
                  {credit.campaignName ? <div className="mt-1 text-xs text-blue-600">Campaign: {credit.campaignName}</div> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-800">Wallet History</h2>
          <p className="mt-1 text-sm text-slate-500">Credits, debits, expiry events, and campaign grants on your account.</p>
          <div className="mt-5 space-y-3">
            {data.transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                No wallet history yet.
              </div>
            ) : (
              data.transactions.map((row) => (
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
                  <div className="mt-2 text-xs text-slate-500">Balance after: {formatMoney(row.balanceAfter)}</div>
                  {row.campaignName ? <div className="mt-1 text-xs text-blue-600">Campaign: {row.campaignName}</div> : null}
                  {row.orderNumber ? <div className="mt-1 text-xs text-slate-600">Order: {row.orderNumber}</div> : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
