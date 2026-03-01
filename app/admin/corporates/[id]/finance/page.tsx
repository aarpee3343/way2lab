'use client';

import { use, useEffect, useState } from 'react';
import { RefreshCw, Wallet, RotateCcw, AlertCircle, HandCoins } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getCorporateFinanceOverviewAction,
  initiateRefundAction,
  recordManualPaymentAction,
} from '@/app/actions/adminFinanceActions';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Input from '@/components/admin/corporate/Input';
import Textarea from '@/components/admin/corporate/Textarea';
import Select from '@/components/admin/corporate/Select';
import Table from '@/components/admin/corporate/Table';
import StatCard from '@/components/admin/corporate/StatCard';
import LoadingSpinner from '@/components/admin/corporate/LoadingSpinner';

type CorpFinanceData = Awaited<ReturnType<typeof getCorporateFinanceOverviewAction>>;

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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
    destination: 'WALLET',
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
      setPaymentForm((prev) => ({
        ...prev,
        amount: '',
        transactionId: '',
        notes: '',
      }));
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
        destination: refundForm.destination as 'SOURCE' | 'WALLET',
        transactionId: refundForm.transactionId || undefined,
        notes: refundForm.notes || undefined,
      });
      if (!res.success) {
        toast.error(res.error || 'Refund failed');
        return;
      }
      toast.success('Refund processed');
      setRefundForm((prev) => ({
        ...prev,
        amount: '',
        reason: '',
        destination: 'WALLET',
        transactionId: '',
        notes: '',
      }));
      await load();
    } finally {
      setSavingRefund(false);
    }
  };

  if (loading || !data) return <LoadingSpinner text="Loading finance data..." />;

  const ordersRows = data.orders.map((o) => [
    `#${o.orderNumber || o.id}`,
    o.patientName || '-',
    (o as any).packageName || '-',
    o.status,
    o.paymentStatus || 'Pending',
    formatINR(o.finalAmount),
    (o as any).completedAt ? new Date((o as any).completedAt).toLocaleString('en-IN') : '-',
  ]);

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">{data.corporate.companyName} Finance</h1>
          <p className="admin-page-subtitle">
            Billing, collections, and refunds for this corporate account.
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              href={`/admin/corporates/${corporateId}/finance/billed-employees?from=${encodeURIComponent(
                from
              )}&to=${encodeURIComponent(to)}`}
              variant="secondary"
              size="sm"
            >
              Billed Employees
            </Button>
            <Button
              href={`/api/admin/corporates/${corporateId}/finance/invoice?from=${encodeURIComponent(
                from
              )}&to=${encodeURIComponent(to)}`}
              variant="secondary"
              size="sm"
            >
              Download Invoice (PDF)
            </Button>
            <Button
              href={`/api/admin/corporates/${corporateId}/finance/statement?from=${encodeURIComponent(
                from
              )}&to=${encodeURIComponent(to)}`}
              variant="secondary"
              size="sm"
            >
              Download Statement (CSV)
            </Button>
          </div>
        </div>
        <Button href={`/admin/corporates/${corporateId}`} variant="secondary" size="sm">
          Back
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Input
            type="date"
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => load(from, to)}>
              <RefreshCw size={16} /> Apply
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFrom('');
                setTo('');
                void load('', '');
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <div className="admin-stat-grid">
        <StatCard icon={<Wallet size={20} />} label="Billed" value={formatINR(data.summary.billed)} />
        <StatCard
          icon={<HandCoins size={20} />}
          label="Collected"
          value={formatINR(data.summary.paid)}
          iconBgWhite
        />
        <StatCard
          icon={<RotateCcw size={20} />}
          label="Refunded"
          value={formatINR(data.summary.refunded)}
          iconBgWhite
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Outstanding"
          value={formatINR(data.summary.outstanding)}
          iconBgWhite
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card header="Record Corporate Payment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Order ID"
              value={paymentForm.orderId}
              onChange={(e) => setPaymentForm((p) => ({ ...p, orderId: e.target.value }))}
            />
            <Input
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <Input
              placeholder="Method"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
            />
            <Input
              placeholder="Transaction ID"
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
            <Textarea
              rows={3}
              placeholder="Notes"
              className="md:col-span-2"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <Button
            variant="primary"
            className="mt-3"
            onClick={onRecordPayment}
            disabled={savingPayment}
          >
            {savingPayment ? 'Saving...' : 'Record Payment'}
          </Button>
        </Card>

        <Card header="Process Refund">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Order ID"
              value={refundForm.orderId}
              onChange={(e) => setRefundForm((p) => ({ ...p, orderId: e.target.value }))}
            />
            <Input
              placeholder="Amount"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <Input
              placeholder="Reason"
              className="md:col-span-2"
              value={refundForm.reason}
              onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
            />
            <Select
              value={refundForm.destination}
              onChange={(e) => setRefundForm((p) => ({ ...p, destination: e.target.value }))}
            >
              <option value="WALLET">Wallet Refund</option>
              <option value="SOURCE">Source Refund</option>
            </Select>
            <Input
              placeholder="Refund Transaction ID"
              value={refundForm.transactionId}
              onChange={(e) => setRefundForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
            <Textarea
              rows={3}
              placeholder="Notes"
              value={refundForm.notes}
              onChange={(e) => setRefundForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <Button variant="primary" className="mt-3" onClick={onRefund} disabled={savingRefund}>
            {savingRefund ? 'Processing...' : 'Process Refund'}
          </Button>
        </Card>
      </div>

      <Card header="Corporate Billable Orders">
        {data.orders.length === 0 ? (
          <div className="p-6 text-center text-muted">No orders in selected range</div>
        ) : (
          <Table
            headers={[
              'Order',
              'Employee',
              'Package',
              'Status',
              'Payment',
              'Bill Amount',
              'Completed',
            ]}
            rows={ordersRows}
          />
        )}
      </Card>
    </div>
  );
}

