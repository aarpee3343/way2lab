import Link from 'next/link';
import { getAdminOrders } from '@/app/actions/adminOrderManagement';
import {
  Search,
  Eye,
  RefreshCw,
  FilePlus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const status = (params.status as string) || 'all';
  const search = (params.search as string) || '';
  const page = Number(params.page) || 1;

  const {
  orders,
  total,
  totalPages,
  stats
} = await getAdminOrders({
  status,
  search,
  page
});


  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Orders
            <span className="ml-2 text-slate-400 text-sm font-bold">
              ({total})
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and track diagnostic bookings
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/orders"
            className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Link>

          <Link
            href="/admin/orders/create"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black flex items-center gap-2 shadow-sm"
          >
            <FilePlus size={16} />
            Create Order
          </Link>
        </div>
      </div>

      {/* ================= QUICK STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Pending Orders" value={stats.pending} color="amber" />
        <StatCard label="Paid Orders" value={stats.paid} color="emerald" />
        <StatCard
          label="Revenue"
          value={`₹${Number(stats.revenue).toFixed(0)}`}
          color="blue"
        />

      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-[64px] z-30">
        <form className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
            <input
              name="search"
              placeholder="Search Order ID, Patient, Phone..."
              defaultValue={search}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ================= ORDERS TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer / Patient</th>
                <th className="px-6 py-4">Lab & Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {orders.length > 0 ? (
                orders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* ORDER META */}
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-800">
                        #{order.orderNumber}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {order.customer?.name?.[0] || 'C'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {order.customer?.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {order.patientName &&
                            order.patientName !== order.customer?.name
                              ? `Patient: ${order.patientName}`
                              : order.customer?.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LAB */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">
                        {order.lab?.labName}
                      </div>
                      <span className="inline-block mt-1 text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded font-bold tracking-wide">
                        {order.collectionType?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* PAYMENT */}
                    <td className="px-6 py-4">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>

                    {/* TOTAL */}
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      ₹{Number(order.finalAmount).toFixed(2)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="View Order"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function StatCard({
  label,
  value,
  color = 'slate',
}: {
  label: string;
  value: any;
  color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs uppercase text-slate-500 font-bold">{label}</p>
      <p className={`text-2xl font-black text-${color}-600 mt-1`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Completed')
    return (
      <Badge color="emerald" icon={<CheckCircle size={14} />}>
        Completed
      </Badge>
    );
  if (status === 'Pending')
    return (
      <Badge color="amber" icon={<Clock size={14} />}>
        Pending
      </Badge>
    );
  if (status === 'Cancelled')
    return (
      <Badge color="rose" icon={<XCircle size={14} />}>
        Cancelled
      </Badge>
    );
  return <Badge>{status}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'Paid')
    return (
      <Badge color="emerald" icon={<CheckCircle size={14} />}>
        Paid
      </Badge>
    );
  return (
    <Badge color="rose" icon={<Clock size={14} />}>
      {status}
    </Badge>
  );
}

function Badge({
  children,
  color = 'slate',
  icon,
}: {
  children: React.ReactNode;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-${color}-50 text-${color}-700 border-${color}-100`}
    >
      {icon}
      {children}
    </span>
  );
}
