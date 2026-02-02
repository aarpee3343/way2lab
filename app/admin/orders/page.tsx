// app/admin/orders/page.tsx
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
    <div className="admin-space-y">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="admin-page-title">
            Orders
            <span className="ml-2 text-slate-400 text-sm font-bold">
              ({total})
            </span>
          </h1>
          <p className="admin-page-subtitle">
            Manage and track diagnostic bookings
          </p>
        </div>

        <div className="admin-space-x">
          <Link
            href="/admin/orders"
            className="admin-btn-secondary"
          >
            <RefreshCw size={16} />
            Refresh
          </Link>

          <Link
            href="/admin/orders/create"
            className="admin-btn-primary"
          >
            <FilePlus size={16} />
            Create Order
          </Link>
        </div>
      </div>

      {/* ================= QUICK STATS ================= */}
      <div className="admin-stat-grid">
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Pending Orders" value={stats.pending} color="bg-amber-500" />
        <StatCard label="Paid Orders" value={stats.paid} color="bg-emerald-500" />
        <StatCard
          label="Revenue"
          value={`₹${Number(stats.revenue).toFixed(0)}`}
          color="bg-blue-500"
        />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="admin-card">
        <div className="admin-card-body">
          <form className="flex flex-col lg:flex-row gap-3">
            <div className="admin-search-container flex-1">
              <Search className="admin-search-icon" size={18} />
              <input
                name="search"
                placeholder="Search Order ID, Patient, Phone..."
                defaultValue={search}
                className="admin-search-input"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="admin-form-select"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              type="submit"
              className="admin-btn-primary"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* ================= ORDERS TABLE ================= */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer / Patient</th>
              <th>Lab & Type</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="text-right">Total</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length > 0 ? (
              orders.map(order => (
                <tr
                  key={order.id}
                  className="group"
                >
                  {/* ORDER META */}
                  <td>
                    <div className="admin-table-row-primary">
                      #{order.orderNumber}
                    </div>
                    <div className="admin-table-row-secondary">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                        {order.customer?.name?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="admin-table-row-primary">
                          {order.customer?.name}
                        </div>
                        <div className="admin-table-row-secondary">
                          {order.patientName &&
                          order.patientName !== order.customer?.name
                            ? `Patient: ${order.patientName}`
                            : order.customer?.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* LAB */}
                  <td>
                    <div className="admin-table-row-primary">
                      {order.lab?.labName}
                    </div>
                    <span className="admin-badge-default text-[10px] uppercase tracking-wide mt-1">
                      {order.collectionType?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    <StatusBadge status={order.status} />
                  </td>

                  {/* PAYMENT */}
                  <td>
                    <PaymentBadge status={order.paymentStatus} />
                  </td>

                  {/* TOTAL */}
                  <td className="text-right admin-table-row-primary">
                    ₹{Number(order.finalAmount).toFixed(2)}
                  </td>

                  {/* ACTIONS */}
                  <td className="text-right">
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
                  className="text-center py-12 text-slate-400"
                >
                  No orders found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>

            <div className="admin-space-x">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="admin-btn-secondary"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="admin-btn-secondary"
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
  color = 'bg-slate-500',
}: {
  label: string;
  value: any;
  color?: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon-container ${color}`} />
      <div>
        <p className="admin-stat-label">{label}</p>
        <h3 className="admin-stat-value">{value}</h3>
      </div>
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
      className={`admin-status-indicator admin-badge-${color === 'emerald' ? 'success' : color === 'amber' ? 'warning' : color === 'rose' ? 'danger' : 'default'}`}
    >
      {icon}
      {children}
    </span>
  );
}