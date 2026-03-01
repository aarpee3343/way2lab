'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Briefcase, DollarSign, ReceiptText, RefreshCw, RotateCcw, Wallet } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getFinanceDashboardDataAction,
  initiateRefundAction,
  recordManualPaymentAction,
} from '@/app/actions/adminFinanceActions';

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboardDataAction>>;

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function CorporateFinanceOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    method: 'Bank Transfer',
    transactionId: '',
    notes: '',
  });
  const [refundForm, setRefundForm] = useState({
    orderId: '',
    paymentId: '',
    amount: '',
    reason: '',
    mode: 'Corporate Manual',
    destination: 'WALLET',
    transactionId: '',
    notes: '',
  });

  const loadData = async (params?: { from?: string; to?: string; query?: string }) => {
    setLoading(true);
    try {
      const res = await getFinanceDashboardDataAction({
        from: params?.from || from || undefined,
        to: params?.to || to || undefined,
        query: params?.query || query || undefined,
        page: 1,
        limit: 25,
        segment: 'corporate',
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickStats = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Corporate Billing', value: formatINR(data.summary.totalBilling), icon: Briefcase, tone: 'text-slate-900' },
      { label: 'Collected', value: formatINR(data.summary.totalCollected), icon: DollarSign, tone: 'text-sky-700' },
      { label: 'Wallet Used', value: formatINR(data.summary.walletCollected), icon: Wallet, tone: 'text-violet-700' },
      { label: 'Refunded', value: formatINR(data.summary.totalRefunded), icon: RotateCcw, tone: 'text-amber-700' },
      { label: 'Outstanding', value: formatINR(data.summary.outstanding), icon: ReceiptText, tone: 'text-rose-700' },
    ];
  }, [data]);

  const onRecordPayment = async () => {
    const orderId = Number(paymentForm.orderId);
    const amount = Number(paymentForm.amount);
    if (!orderId || !amount || amount <= 0) {
      toast.error('Enter valid order id and amount');
      return;
    }

    setRecordingPayment(true);
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
      toast.success('Corporate payment recorded');
      setPaymentForm((prev) => ({ ...prev, amount: '', transactionId: '', notes: '' }));
      await loadData();
    } finally {
      setRecordingPayment(false);
    }
  };

  const onProcessRefund = async () => {
    const orderId = Number(refundForm.orderId);
    const amount = Number(refundForm.amount);
    const paymentId = refundForm.paymentId ? Number(refundForm.paymentId) : undefined;

    if (!orderId || !amount || amount <= 0 || !refundForm.reason.trim()) {
      toast.error('Enter order id, amount and reason');
      return;
    }

    setProcessingRefund(true);
    try {
      const res = await initiateRefundAction({
        orderId,
        paymentId,
        amount,
        reason: refundForm.reason,
        mode: refundForm.mode,
        destination: refundForm.destination as 'SOURCE' | 'WALLET',
        transactionId: refundForm.transactionId || undefined,
        notes: refundForm.notes || undefined,
      });
      if (!res.success) {
        toast.error(res.error || 'Failed to process refund');
        return;
      }
      toast.success('Corporate refund processed');
      setRefundForm((prev) => ({
        ...prev,
        paymentId: '',
        amount: '',
        reason: '',
        transactionId: '',
        notes: '',
      }));
      await loadData();
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Corporate Finance</h1>
        <p className="admin-page-subtitle">
          Billing and settlement visibility for corporate orders, including wallet offsets and refund routing.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link className="admin-btn-secondary" href="/admin/finance">
            General User Finance
          </Link>
          <a
            className="admin-btn-secondary"
            href={`/api/admin/finance/export?format=csv&segment=corporate&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&query=${encodeURIComponent(query)}`}
          >
            Export CSV
          </a>
          <a
            className="admin-btn-secondary"
            href={`/api/admin/finance/export?format=pdf&segment=corporate&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&query=${encodeURIComponent(query)}`}
          >
            Export PDF
          </a>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <div>
            <label className="admin-form-label">From</label>
            <input type="date" className="admin-form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">To</label>
            <input type="date" className="admin-form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Search</label>
            <input
              className="admin-form-input"
              placeholder="Order no / company / patient"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="admin-btn-primary" onClick={() => void loadData({ from, to, query })}>
              <RefreshCw size={16} /> Apply
            </button>
            <button
              className="admin-btn-secondary"
              onClick={() => {
                setFrom('');
                setTo('');
                setQuery('');
                void loadData({ from: '', to: '', query: '' });
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="admin-card p-8 text-center text-slate-400">Loading finance data...</div>
      ) : (
        <>
          <div className="admin-stat-grid">
            {quickStats.map((item) => (
              <div key={item.label} className="admin-stat-card">
                <div className="admin-stat-icon-container bg-slate-900">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="admin-stat-label">{item.label}</p>
                  <h3 className={`admin-stat-value ${item.tone}`}>{item.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-4">Record Corporate Payment</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="admin-form-input"
                  placeholder="Order ID"
                  value={paymentForm.orderId}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, orderId: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Method"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Transaction ID"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                />
                <textarea
                  className="admin-form-textarea md:col-span-2"
                  rows={3}
                  placeholder="Notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button className="admin-btn-primary mt-3" onClick={onRecordPayment} disabled={recordingPayment}>
                {recordingPayment ? 'Saving...' : 'Record Payment'}
              </button>
            </div>

            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-4">Process Corporate Refund</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="admin-form-input"
                  placeholder="Order ID"
                  value={refundForm.orderId}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, orderId: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Payment ID (optional)"
                  value={refundForm.paymentId}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, paymentId: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Refund Amount"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                <select
                  className="admin-form-select"
                  value={refundForm.destination}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, destination: e.target.value }))}
                >
                  <option value="WALLET">Wallet Refund</option>
                  <option value="SOURCE">Source Refund</option>
                </select>
                <input
                  className="admin-form-input md:col-span-2"
                  placeholder="Reason"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Refund Transaction ID"
                  value={refundForm.transactionId}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                />
                <textarea
                  className="admin-form-textarea"
                  rows={3}
                  placeholder="Notes"
                  value={refundForm.notes}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button className="admin-btn-primary mt-3" onClick={onProcessRefund} disabled={processingRefund}>
                {processingRefund ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="admin-form-title">Corporate Accounts Snapshot</h2>
              <p className="text-xs text-slate-500">Open a company to settle detailed employee billing.</p>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Corporate</th>
                    <th>Employees</th>
                    <th>Billed</th>
                    <th>Collected</th>
                    <th>Wallet Used</th>
                    <th>Refunded</th>
                    <th>Outstanding</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.corporateSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        No corporate records
                      </td>
                    </tr>
                  ) : (
                    data.corporateSummaries.map((row) => (
                      <tr key={row.corporateId}>
                        <td>{row.companyName}</td>
                        <td>{row.employees}</td>
                        <td>{formatINR(row.billed)}</td>
                        <td>{formatINR(row.collected)}</td>
                        <td>{formatINR((row as any).walletCollected || 0)}</td>
                        <td>{formatINR(row.refunded)}</td>
                        <td className="font-semibold text-rose-700">{formatINR(row.outstanding)}</td>
                        <td>
                          <Link href={`/admin/corporates/${row.corporateId}/finance`} className="admin-btn-secondary">
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-3">Payments</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order</th>
                      <th>Patient</th>
                      <th>Corporate</th>
                      <th>Method</th>
                      <th>Payment Type</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          No payment records
                        </td>
                      </tr>
                    ) : (
                      data.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.paymentDate).toLocaleString()}</td>
                          <td>#{payment.orderNumber || payment.orderId}</td>
                          <td>{payment.patientName || '-'}</td>
                          <td>{payment.corporateName || '-'}</td>
                          <td>{payment.method}</td>
                          <td>{payment.paymentType}</td>
                          <td className="text-right font-semibold text-emerald-700">{formatINR(payment.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-3">Refunds</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order</th>
                      <th>Patient</th>
                      <th>Corporate</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.refunds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          No refund records
                        </td>
                      </tr>
                    ) : (
                      data.refunds.map((refund) => (
                        <tr key={refund.id}>
                          <td>{new Date(refund.createdAt).toLocaleString()}</td>
                          <td>#{refund.orderNumber || refund.orderId}</td>
                          <td>{refund.patientName || '-'}</td>
                          <td>{refund.corporateName || '-'}</td>
                          <td>{refund.destination}</td>
                          <td>{refund.status}</td>
                          <td className="text-right font-semibold text-amber-700">{formatINR(refund.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
