'use client';

import { use, useEffect, useState } from 'react';
import { RefreshCw, Wallet, RotateCcw, AlertCircle, HandCoins } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getCorporateFinanceOverviewAction,
  initiateRefundAction,
  recordManualPaymentAction,
} from '@/app/actions/adminFinanceActions';

type CorpFinanceData = Awaited<ReturnType<typeof getCorporateFinanceOverviewAction>>;

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );
}

export default function CorporateFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corporateId = Number(id);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CorpFinanceData>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingRefund, setSavingRefund] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    method: 'Bank Transfer',
    transactionId: '',
    notes: '',
  });

  const [refundForm, setRefundForm] = useState({
    orderId: '',
    amount: '',
    reason: '',
    transactionId: '',
    notes: '',
  });

  const load = async (nextFrom?: string, nextTo?: string) => {
    setLoading(true);
    try {
      const res = await getCorporateFinanceOverviewAction(corporateId, {
        from: nextFrom || from || undefined,
        to: nextTo || to || undefined,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corporateId]);

  const onRecordPayment = async () => {
    const orderId = Number(paymentForm.orderId);
    const amount = Number(paymentForm.amount);
    if (!orderId || !amount || amount <= 0) {
      toast.error('Enter valid order id and amount');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await recordManualPaymentAction({
        orderId,
        amount,
        method: paymentForm.method,
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined,
      });
      if (!res.success) {
        toast.error(res.error || 'Failed to record payment');
        return;
      }
      toast.success('Payment recorded');
      setPaymentForm((prev) => ({ ...prev, amount: '', transactionId: '', notes: '' }));
      await load();
    } finally {
      setSavingPayment(false);
    }
  };

  const onRefund = async () => {
    const orderId = Number(refundForm.orderId);
    const amount = Number(refundForm.amount);
    if (!orderId || !amount || amount <= 0 || !refundForm.reason.trim()) {
      toast.error('Enter valid refund details');
      return;
    }

    setSavingRefund(true);
    try {
      const res = await initiateRefundAction({
        orderId,
        amount,
        reason: refundForm.reason,
        mode: 'Corporate Manual',
        transactionId: refundForm.transactionId || undefined,
        notes: refundForm.notes || undefined,
      });
      if (!res.success) {
        toast.error(res.error || 'Refund failed');
        return;
      }
      toast.success('Refund processed');
      setRefundForm((prev) => ({ ...prev, amount: '', reason: '', transactionId: '', notes: '' }));
      await load();
    } finally {
      setSavingRefund(false);
    }
  };

  if (loading || !data) return <div className="p-10 text-center text-slate-400">Loading finance data...</div>;

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{data.corporate.companyName} Finance</h1>
        <p className="admin-page-subtitle">Billing, collections, and refunds for this corporate account.</p>
        <div className="flex gap-2 mt-2">
          <a
            className="admin-btn-secondary"
            href={`/admin/corporates/${corporateId}/finance/billed-employees?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          >
            Billed Employees
          </a>
          <a
            className="admin-btn-secondary"
            href={`/api/admin/corporates/${corporateId}/finance/invoice?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          >
            Download Invoice (PDF)
          </a>
          <a
            className="admin-btn-secondary"
            href={`/api/admin/corporates/${corporateId}/finance/statement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          >
            Download Statement (CSV)
          </a>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="admin-form-label">From</label>
            <input type="date" className="admin-form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">To</label>
            <input type="date" className="admin-form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="admin-btn-primary" onClick={() => load(from, to)}>
              <RefreshCw size={16} /> Apply
            </button>
            <button
              className="admin-btn-secondary"
              onClick={() => {
                setFrom('');
                setTo('');
                void load('', '');
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="admin-stat-grid">
        <StatCard icon={Wallet} label="Billed" value={formatINR(data.summary.billed)} tone="text-slate-900" />
        <StatCard icon={HandCoins} label="Collected" value={formatINR(data.summary.paid)} tone="text-emerald-700" />
        <StatCard icon={RotateCcw} label="Refunded" value={formatINR(data.summary.refunded)} tone="text-amber-700" />
        <StatCard icon={AlertCircle} label="Outstanding" value={formatINR(data.summary.outstanding)} tone="text-rose-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card p-5">
          <h2 className="admin-form-title mb-4">Record Corporate Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="admin-form-input"
              placeholder="Order ID"
              value={paymentForm.orderId}
              onChange={(e) => setPaymentForm((p) => ({ ...p, orderId: e.target.value }))}
            />
            <input
              className="admin-form-input"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <input
              className="admin-form-input"
              placeholder="Method"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
            />
            <input
              className="admin-form-input"
              placeholder="Transaction ID"
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
            <textarea
              className="admin-form-textarea md:col-span-2"
              rows={3}
              placeholder="Notes"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <button className="admin-btn-primary mt-3" onClick={onRecordPayment} disabled={savingPayment}>
            {savingPayment ? 'Saving...' : 'Record Payment'}
          </button>
        </div>

        <div className="admin-card p-5">
          <h2 className="admin-form-title mb-4">Process Refund</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="admin-form-input"
              placeholder="Order ID"
              value={refundForm.orderId}
              onChange={(e) => setRefundForm((p) => ({ ...p, orderId: e.target.value }))}
            />
            <input
              className="admin-form-input"
              placeholder="Amount"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <input
              className="admin-form-input md:col-span-2"
              placeholder="Reason"
              value={refundForm.reason}
              onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
            />
            <input
              className="admin-form-input"
              placeholder="Refund Transaction ID"
              value={refundForm.transactionId}
              onChange={(e) => setRefundForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
            <textarea
              className="admin-form-textarea"
              rows={3}
              placeholder="Notes"
              value={refundForm.notes}
              onChange={(e) => setRefundForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <button className="admin-btn-primary mt-3" onClick={onRefund} disabled={savingRefund}>
            {savingRefund ? 'Processing...' : 'Process Refund'}
          </button>
        </div>
      </div>

      <div className="admin-card p-5">
        <h2 className="admin-form-title mb-3">Corporate Billable Orders</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Employee</th>
                <th>Package</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Bill Amount</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No orders in selected range</td>
                </tr>
              ) : (
                data.orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.orderNumber || o.id}</td>
                    <td>{o.patientName || '-'}</td>
                    <td>{(o as any).packageName || '-'}</td>
                    <td>{o.status}</td>
                    <td>{o.paymentStatus || 'Pending'}</td>
                    <td>{formatINR(o.finalAmount)}</td>
                    <td>{(o as any).completedAt ? new Date((o as any).completedAt).toLocaleString('en-IN') : '-'}</td>
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon-container bg-slate-900">
        <Icon size={20} />
      </div>
      <div>
        <p className="admin-stat-label">{label}</p>
        <h3 className={`admin-stat-value ${tone}`}>{value}</h3>
      </div>
    </div>
  );
}
