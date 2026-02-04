// app/admin/orders/[id]/page.tsx
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  updateOrderStatusAction,
  assignTechnicianAction
} from '@/app/actions/adminOrderManagement';

import { OrderStatus } from '@prisma/client';
import UploadReportForm from '../_components/UploadReportForm';

import {
  ArrowLeft,
  Printer,
  User,
  Phone,
  MapPin,
  FlaskConical,
  Calendar,
  CreditCard,
  UploadCloud,
  Edit,
  UserCog,
  FileText,
  Activity,
  Download
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ================= STATUS / PAYMENT HELPERS ================= */

const getStatusColor = (status: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-sky-100 text-sky-700 border-sky-200',
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    PARTIAL_COMPLETED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-200 text-slate-700 border-slate-300'
  };
  return map[status];
};

const getPaymentColor = (status?: string | null) =>
  status === 'Paid'
    ? 'admin-badge-success'
    : 'admin-badge-warning';

/* ================= PAGE ================= */

export default async function OrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId || Number.isNaN(orderId)) return notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      technician: true,
      customer: true,
      lab: true,
      items: true,
      address: true,
      reports: true,
      payments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!order) return notFound();

  const technicians = await prisma.technician.findMany({
    where: {
      isActive: true,
      labs: { some: { labId: order.labId! } }
    }
  });
  
  const assignedTechnician = order.technician;

  /* ================= BUSINESS LOGIC (UNCHANGED) ================= */

  const subtotal = Number(order.totalAmount) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const finalAmount =
    Number(order.finalAmount) || Math.max(subtotal - discountAmount, 0);

  const discountPercentage =
    subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;

  const bookingDate = new Date(order.bookingDate);
  const preferredDate = order.preferredDate
    ? new Date(order.preferredDate)
    : null;
  const isUpcoming = preferredDate && preferredDate >= new Date();

  const patientAge = order.patientDob
    ? Math.floor(
        (Date.now() - new Date(order.patientDob).getTime()) / 31557600000
      )
    : 'N/A';

  const isCompleted = order.status === OrderStatus.COMPLETED;
  const terminalStatuses: OrderStatus[] = [
    OrderStatus.COMPLETED,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED
  ];
  const isTerminal = terminalStatuses.includes(order.status);

  return (
    <div className="max-w-7xl mx-auto pb-20 bg-slate-50 min-h-screen p-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="admin-page-title">
              Order #{order.orderNumber || order.id}
            </h1>
            <span
              className={`admin-badge ${getStatusColor(order.status)}`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Customer:{' '}
            <span className="font-medium text-slate-700">
              {order.customer?.name}
            </span>{' '}
            • {order.customer?.email}
          </p>
        </div>

        <div className="admin-space-x">
          <Link
            href="/admin/orders"
            className="admin-btn-secondary"
          >
            <ArrowLeft size={18} /> Back
          </Link>
          <a
            href={`/api/order/${order.id}/pdf`}
            target="_blank"
            className="admin-btn-primary"
          >
            <Printer size={18} /> Print PDF
          </a>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="admin-stat-grid mb-8">
        <StatCard label="Final Amount" value={`₹${finalAmount}`} highlight />
        <StatCard
          label="Order Status"
          value={order.status.replace('_', ' ')}
          badge
          color={getStatusColor(order.status)}
        />
        <StatCard
          label="Payment"
          value={order.paymentStatus || 'Pending'}
          badge
          color={getPaymentColor(order.paymentStatus)}
        />
        <StatCard label="Items" value={order.items.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        

        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-2 space-y-8">

          {/* ORDER DETAILS */}
          <Card title="Order Details" icon={FileText}>
            <InfoItem label="Order ID" value={`#${order.orderNumber || order.id}`} />
            <InfoItem label="Booking Date" value={bookingDate.toLocaleString()} />
            <InfoItem
              label="Collection Type"
              value={order.collectionType?.replace('_', ' ') || 'N/A'}
              capitalize
            />

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 mt-4">
              <Row label="Subtotal" value={`₹${subtotal}`} />
              {discountAmount > 0 && (
                <Row
                  label={`Discount (${discountPercentage}%)`}
                  value={`-₹${discountAmount}`}
                  danger
                />
              )}
              <Row label="Final Amount" value={`₹${finalAmount}`} strong />
            </div>
          </Card>

          {/* ITEMS */}
          <Card title={`Order Items (${order.items.length})`} icon={FlaskConical}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="text-left">Item Name</th>
                  <th className="text-center">Type</th>
                  <th className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="admin-table-row-primary">{item.itemName}</td>
                    <td className="text-center">
                      <span
                        className={`admin-badge ${item.itemType === 'package' ? 'admin-badge-info' : 'admin-badge-default'}`}
                      >
                        {item.itemType}
                      </span>
                    </td>
                    <td className="text-right admin-table-row-primary">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* PAYMENTS */}
          <Card title="Payment Transactions" icon={CreditCard}>
            {order.payments.length ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map(p => (
                    <tr key={p.id}>
                      <td className="admin-table-row-secondary">{p.createdAt.toLocaleString()}</td>
                      <td>{p.method}</td>
                      <td>
                        <span className={`admin-badge ${p.status === 'Paid' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-right admin-table-row-primary">
                        ₹{p.amount.toString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-400">No payments recorded.</p>
            )}
          </Card>

          {/* REPORTS */}
          <Card title="Report Management" icon={UploadCloud}>
            {order.reports.length ? (
              order.reports.map(rep => (
                <div
                  key={rep.id}
                  className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl mb-3"
                >
                  <div>
                    <p className="admin-table-row-primary">
                      {rep.reportType === 'COMPLETED'
                        ? 'Final Diagnostic Report'
                        : `Partial Report • ${new Date(rep.createdAt).toLocaleDateString()}`}
                    </p>
                    <span className="admin-badge-default text-[10px] uppercase px-1.5 rounded">
                      {rep.reportType}
                    </span>
                  </div>
                  <a href={`/api/reports/${rep.id}`} target="_blank">
                    <Download size={16} />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No reports uploaded yet.</p>
            )}
            <UploadReportForm orderId={order.id} />
          </Card>

          {/* STATUS */}
          <Card title="Update Status" icon={Edit}>
            <form
              action={async (formData) => {
                await updateOrderStatusAction(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                disabled={isCompleted}
                className="admin-form-select"
              >
                {Object.values(OrderStatus)
                  .filter(s => s !== OrderStatus.CANCELLED)
                  .map(s => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
              </select>
              <button
                disabled={isCompleted}
                className={`admin-btn-primary w-full ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Update Status
              </button>
            </form>
          </Card>

          {/* TECHNICIAN */}
          
          <Card title="Technician Assignment" icon={UserCog}>
            <form
              action={async (formData) => {
                await assignTechnicianAction(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="orderId" value={order.id} />

              {/* CURRENT ASSIGNMENT */}
              {assignedTechnician && (
                <div className="admin-alert admin-alert-info">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-1">
                    Currently Assigned
                  </p>
                  <p className="admin-table-row-primary">
                    {assignedTechnician.name}
                  </p>
                  <p className="admin-table-row-secondary">
                    {assignedTechnician.phone}
                  </p>
                </div>
              )}

              {/* SELECT */}
              <select
                name="technicianId"
                defaultValue={assignedTechnician?.id ?? ''}
                disabled={isTerminal}
                className="admin-form-select"
                required
              >
                <option value="">-- Choose Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.phone})
                  </option>
                ))}
              </select>

              {/* BUTTON */}
              <button
                disabled={isTerminal}
                className={`admin-btn-primary w-full ${isTerminal ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {assignedTechnician ? 'Change Technician' : 'Assign Technician'}
              </button>
            </form>
          </Card>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="space-y-6">

          {/* CUSTOMER */}
          <Card title="Customer" icon={User}>
            <div className="space-y-2 text-sm">
              <div className="admin-table-row-primary">{order.customer?.name}</div>
              <div className="flex items-center gap-2 admin-table-row-secondary">
                <Phone size={14} /> {order.customer?.phone}
              </div>
              <div className="flex items-start gap-2 admin-table-row-secondary">
                <MapPin size={14} className="mt-1" />
                <span>
                  {order.address?.addressLine1}, {order.address?.city}
                  <br />
                  {order.address?.pincode}
                </span>
              </div>
            </div>
          </Card>

          {/* PATIENT */}
          <Card title="Patient" icon={Activity}>
            <div className="text-sm space-y-2">
              <Row label="Name" value={order.patientName} />
              <Row
                label="Age / Gender"
                value={`${patientAge} / ${order.patientGender || 'N/A'}`}
              />
              <Row label="Phone" value={order.patientPhone || 'N/A'} />
            </div>
          </Card>

          {/* SCHEDULE */}
          <Card title="Schedule" icon={Calendar}>
            {preferredDate ? (
              <div
                className={`p-3 rounded-lg border-l-4 ${
                  isUpcoming
                    ? 'bg-sky-50 border-sky-500'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <p className="admin-table-row-primary">{preferredDate.toDateString()}</p>
                <p className="admin-table-row-secondary">
                  {order.preferredTimeSlot || 'Anytime'}
                </p>
                {order.collectionInstructions && (
                  <p className="text-xs mt-2 text-amber-700">
                    {order.collectionInstructions}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No appointment scheduled
              </p>
            )}
          </Card>

          {/* LAB */}
          <Card title="Lab Information" icon={FlaskConical}>
            <Row label="Lab Name" value={order.lab?.labName || 'N/A'} />
            <Row label="Phone" value={order.lab?.contactNo || 'N/A'} />
            <Row label="Address" value={order.lab?.address || 'N/A'} />
          </Card>

          {/* ACTIVITY LOG */}
          <Card title="Activity Log" icon={Activity}>
            <ol className="border-l ml-2">
              {order.activities.map(a => (
                <li key={a.id} className="ml-4 mb-4">
                  <p className="admin-table-row-primary">
                    {a.action.replace('_', ' ')}
                  </p>
                  <p className="admin-table-row-secondary">
                    {a.oldValue && `${a.oldValue} → `}{a.newValue}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {a.createdAt.toLocaleString()} • {a.performedBy}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function StatCard({ label, value, highlight = false, badge = false, color = '' }: any) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-value ${highlight ? 'text-slate-900' : ''}`}>
        {badge ? <span className={`admin-badge ${color}`}>{value}</span> : value}
      </div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: any) {
  return (
    <div className="admin-card">
      <div className="admin-card-header flex items-center gap-2 font-bold">
        {Icon && <Icon size={18} />} {title}
      </div>
      <div className="admin-card-body">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, capitalize = false }: any) {
  return (
    <div>
      <div className="admin-form-label">{label}</div>
      <div className={`admin-table-row-primary ${capitalize ? 'capitalize' : ''}`}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

function Row({ label, value, strong = false, danger = false }: any) {
  return (
    <div
      className={`flex justify-between text-sm ${
        strong ? 'font-bold text-lg' : ''
      } ${danger ? 'text-rose-600' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
