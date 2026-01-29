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
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';

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
  const isTerminal = [
    OrderStatus.COMPLETED,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED
  ].includes(order.status);

  return (
    <div className="max-w-7xl mx-auto pb-20 bg-slate-50 min-h-screen p-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-800">
              Order #{order.orderNumber || order.id}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                order.status
              )}`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            Customer:{' '}
            <span className="font-medium text-slate-700">
              {order.customer?.name}
            </span>{' '}
            • {order.customer?.email}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-white border rounded-xl flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Back
          </Link>
          <a
            href={`/api/order/${order.id}/pdf`}
            target="_blank"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl flex items-center gap-2"
          >
            <Printer size={18} /> Print PDF
          </a>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Final Amount" value={`₹${finalAmount}`} highlight />
        <SummaryCard
          label="Order Status"
          value={order.status.replace('_', ' ')}
          badge
          color={getStatusColor(order.status)}
        />
        <SummaryCard
          label="Payment"
          value={order.paymentStatus || 'Pending'}
          badge
          color={getPaymentColor(order.paymentStatus)}
        />
        <SummaryCard label="Items" value={order.items.length.toString()} />
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
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Item Name</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                          item.itemType === 'package'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.itemType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
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
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400">
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
                      <td>{p.createdAt.toLocaleString()}</td>
                      <td>{p.method}</td>
                      <td>{p.status}</td>
                      <td className="text-right font-bold">
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
                    <p className="text-sm font-medium">
                      {rep.reportType === 'COMPLETED'
                        ? 'Final Diagnostic Report'
                        : `Partial Report • ${new Date(rep.createdAt).toLocaleDateString()}`}
                    </p>
                    <span className="text-[10px] uppercase border px-1.5 rounded">
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
            <form action={updateOrderStatusAction} className="space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                disabled={isCompleted}
                className="w-full p-2 border rounded-lg"
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
                className={`w-full py-2 rounded-lg font-bold ${
                  isCompleted
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white'
                }`}
              >
                Update Status
              </button>
            </form>
          </Card>

          {/* TECHNICIAN */}
          
          <Card title="Technician Assignment" icon={UserCog}>
            <form action={assignTechnicianAction} className="space-y-4">
              <input type="hidden" name="orderId" value={order.id} />

              {/* CURRENT ASSIGNMENT */}
              {assignedTechnician && (
                <div className="p-3 rounded-lg bg-slate-50 border text-sm">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-1">
                    Currently Assigned
                  </p>
                  <p className="font-medium text-slate-800">
                    {assignedTechnician.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignedTechnician.phone}
                  </p>
                </div>
              )}

              {/* SELECT */}
              <select
                name="technicianId"
                defaultValue={assignedTechnician?.id ?? ''}
                disabled={isTerminal}
                className="w-full p-2 border rounded-lg bg-white disabled:bg-slate-100"
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
                className={`w-full py-2 rounded-lg font-bold transition ${
                  isTerminal
                    ? 'bg-slate-300 cursor-not-allowed'
                    : assignedTechnician
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
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
              <div className="font-medium">{order.customer?.name}</div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {order.customer?.phone}
              </div>
              <div className="flex items-start gap-2">
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
                <p className="font-bold">{preferredDate.toDateString()}</p>
                <p className="text-sm text-slate-500">
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
                  <p className="font-semibold text-sm">
                    {a.action.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500">
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

function SummaryCard({ label, value, highlight = false, badge = false, color = '' }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm">
      <div className={`text-2xl font-bold ${highlight ? 'text-slate-900' : ''}`}>
        {badge ? <span className={`text-sm px-3 py-1 rounded-full ${color}`}>{value}</span> : value}
      </div>
      <div className="text-xs text-slate-400 uppercase font-bold">{label}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="px-6 py-4 border-b flex items-center gap-2 font-bold">
        {Icon && <Icon size={18} />} {title}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, capitalize = false }: any) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className={`font-medium ${capitalize ? 'capitalize' : ''}`}>
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
