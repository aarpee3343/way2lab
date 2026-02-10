'use client';

import { useEffect, useMemo, useState } from 'react';
import { DollarSign, RefreshCw, Wallet, ReceiptText, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getFinanceDashboardDataAction,
  initiateRefundAction,
  recordManualPaymentAction,
  updateOrderPaymentStatusManualAction,
} from '@/app/actions/adminFinanceActions';

type FinanceData = Awaited<ReturnType<typeof getFinanceDashboardDataAction>>;

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );
}

export default function AdminFinancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    method: 'Cash',
    transactionId: '',
    notes: '',
  });
  const [refundForm, setRefundForm] = useState({
    orderId: '',
    paymentId: '',
    amount: '',
    reason: '',
    mode: 'Manual',
    transactionId: '',
    notes: '',
  });
  const [statusForm, setStatusForm] = useState({
    orderId: '',
    targetStatus: 'PARTIAL',
    reason: '',
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
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickStats = useMemo(() => {
    if (!data) return null;
    return [
      { label: 'Net Revenue', value: formatINR(data.summary.netRevenue), icon: DollarSign, tone: 'text-emerald-700' },
      { label: 'Collected', value: formatINR(data.summary.totalCollected), icon: Wallet, tone: 'text-sky-700' },
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
      toast.success('Manual payment recorded');
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
        transactionId: refundForm.transactionId || undefined,
        notes: refundForm.notes || undefined,
      });
      if (!res.success) {
        toast.error(res.error || 'Failed to process refund');
        return;
      }
      toast.success('Refund processed');
      setRefundForm((prev) => ({ ...prev, amount: '', transactionId: '', notes: '', reason: '' }));
      await loadData();
    } finally {
      setProcessingRefund(false);
    }
  };

  const onUpdatePaymentStatus = async () => {
    const orderId = Number(statusForm.orderId);
    if (!orderId || !statusForm.reason.trim()) {
      toast.error('Enter order id and reason');
      return;
    }
    setUpdatingPaymentStatus(true);
    try {
      const res = await updateOrderPaymentStatusManualAction({
        orderId,
        targetStatus: statusForm.targetStatus as any,
        reason: statusForm.reason,
      });
      if (!res.success) {
        toast.error(res.error || 'Failed to update payment status');
        return;
      }
      toast.success('Payment status updated');
      setStatusForm((prev) => ({ ...prev, reason: '' }));
      await loadData();
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Finance</h1>
        <p className="admin-page-subtitle">Revenue, billing, manual payments, and refunds across general and corporate orders.</p>
        <div className="flex gap-2 mt-2">
          <a
            className="admin-btn-secondary"
            href={`/api/admin/finance/export?format=csv&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&query=${encodeURIComponent(query)}`}
          >
            Export CSV
          </a>
          <a
            className="admin-btn-secondary"
            href={`/api/admin/finance/export?format=pdf&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&query=${encodeURIComponent(query)}`}
          >
            Export PDF
          </a>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
              placeholder="Order no / txn / patient"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="admin-btn-primary" onClick={() => loadData({ from, to, query })}>
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
            {quickStats?.map((item) => (
              <div key={item.label} className="admin-stat-card">
                <div className={`admin-stat-icon-container bg-slate-900`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="admin-stat-label">{item.label}</p>
                  <h3 className={`admin-stat-value ${item.tone}`}>{item.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-4">Record Manual Payment</h2>
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
                  placeholder="Method (Cash/UPI/Bank)"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Transaction ID (optional)"
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
              <button className="admin-btn-primary mt-3" onClick={onRecordPayment} disabled={recordingPayment}>
                {recordingPayment ? 'Saving...' : 'Record Payment'}
              </button>
            </div>

            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-4">Initiate / Process Refund</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="admin-form-input"
                  placeholder="Order ID"
                  value={refundForm.orderId}
                  onChange={(e) => setRefundForm((p) => ({ ...p, orderId: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Payment ID (optional)"
                  value={refundForm.paymentId}
                  onChange={(e) => setRefundForm((p) => ({ ...p, paymentId: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Refund Amount"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Mode"
                  value={refundForm.mode}
                  onChange={(e) => setRefundForm((p) => ({ ...p, mode: e.target.value }))}
                />
                <input
                  className="admin-form-input md:col-span-2"
                  placeholder="Reason"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
                />
                <input
                  className="admin-form-input"
                  placeholder="Refund Transaction ID (optional)"
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
              <button className="admin-btn-primary mt-3" onClick={onProcessRefund} disabled={processingRefund}>
                {processingRefund ? 'Processing...' : 'Process Refund'}
              </button>
            </div>

            <div className="admin-card p-5">
              <h2 className="admin-form-title mb-4">Manual Payment Status Update</h2>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="admin-form-input"
                  placeholder="Order ID"
                  value={statusForm.orderId}
                  onChange={(e) => setStatusForm((p) => ({ ...p, orderId: e.target.value }))}
                />
                <select
                  className="admin-form-select"
                  value={statusForm.targetStatus}
                  onChange={(e) => setStatusForm((p) => ({ ...p, targetStatus: e.target.value }))}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="CORPORATE_BILLING">CORPORATE_BILLING</option>
                </select>
                <textarea
                  className="admin-form-textarea"
                  rows={3}
                  placeholder="Reason (required for audit)"
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>
              <button className="admin-btn-primary mt-3" onClick={onUpdatePaymentStatus} disabled={updatingPaymentStatus}>
                {updatingPaymentStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          <div className="admin-card p-5">
            <h2 className="admin-form-title mb-3">Revenue Split</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-slate-500">Corporate Billing</p>
                <p className="font-black text-slate-900">{formatINR(data.summary.corporateBilling)}</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-slate-500">General Billing</p>
                <p className="font-black text-slate-900">{formatINR(data.summary.generalBilling)}</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-slate-500">Corporate Collected</p>
                <p className="font-black text-slate-900">{formatINR(data.summary.corporateCollected)}</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-slate-500">General Collected</p>
                <p className="font-black text-slate-900">{formatINR(data.summary.generalCollected)}</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5">
            <h2 className="admin-form-title mb-3">Corporate Finance Snapshot</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Corporate</th>
                    <th>Employees</th>
                    <th>Billed</th>
                    <th>Collected</th>
                    <th>Refunded</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.corporateSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No corporate records</td>
                    </tr>
                  ) : (
                    data.corporateSummaries.map((row) => (
                      <tr key={row.corporateId}>
                        <td>{row.companyName}</td>
                        <td>{row.employees}</td>
                        <td>{formatINR(row.billed)}</td>
                        <td>{formatINR(row.collected)}</td>
                        <td>{formatINR(row.refunded)}</td>
                        <td className="text-rose-700 font-semibold">{formatINR(row.outstanding)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card p-5">
            <h2 className="admin-form-title mb-3">Payments</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Txn</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">No payment records</td>
                    </tr>
                  ) : (
                    data.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.paymentDate).toLocaleString()}</td>
                        <td>#{p.orderNumber || p.orderId}</td>
                        <td>{p.patientName || '-'}</td>
                        <td>{p.isCorporate ? `Corporate${p.corporateName ? ` (${p.corporateName})` : ''}` : 'General'}</td>
                        <td>{p.method}</td>
                        <td>{p.status}</td>
                        <td>{p.transactionId || '-'}</td>
                        <td className="font-semibold text-emerald-700">{formatINR(p.amount)}</td>
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
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Txn</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">No refund records</td>
                    </tr>
                  ) : (
                    data.refunds.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                        <td>#{r.orderNumber || r.orderId}</td>
                        <td>{r.patientName || '-'}</td>
                        <td>{r.isCorporate ? `Corporate${r.corporateName ? ` (${r.corporateName})` : ''}` : 'General'}</td>
                        <td>{r.reason}</td>
                        <td>{r.status}</td>
                        <td>{r.transactionId || '-'}</td>
                        <td className="font-semibold text-amber-700">{formatINR(r.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
