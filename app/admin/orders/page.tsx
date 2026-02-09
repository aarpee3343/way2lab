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

export const dynamic = 'force-dynamic';

const VALID_STATUS_FILTERS = new Set([
  'ALL',
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'PARTIAL_COMPLETED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
]);

function normalizeStatusFilter(input?: string | string[]) {
  const raw = Array.isArray(input) ? input[0] : input;
  const normalized = String(raw || 'ALL').trim().toUpperCase();
  return VALID_STATUS_FILTERS.has(normalized) ? normalized : 'ALL';
}

function normalizeStringFilter(input?: string | string[]) {
  const raw = Array.isArray(input) ? input[0] : input;
  return String(raw || '');
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

function statusLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const status = normalizeStatusFilter(params.status);
  const search = normalizeStringFilter(params.search);
  const page = Number(params.page) || 1;
  const corp = normalizeStringFilter(params.corp) || 'all';

  const buildPageHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (status !== 'ALL') sp.set('status', status);
    if (search) sp.set('search', search);
    if (corp !== 'all') sp.set('corp', corp);
    sp.set('page', String(nextPage));
    return `?${sp.toString()}`;
  };

  const {
  orders,
  total,
  totalPages,
  stats
} = await getAdminOrders({
  status,
  search,
  page,
  corporate: corp
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
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PROCESSING">Processing</option>
              <option value="PARTIAL_COMPLETED">Partial Completed</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              name="corp"
              defaultValue={corp}
              className="admin-form-select"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="corporate">Corporate</option>
              <option value="corporate_admin">Admin / Corporate</option>
              <option value="corporate_employee">Employee / Corporate</option>
              <option value="admin_general">Admin / General</option>
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
      <table className="admin-table admin-table-container">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer / Patient</th>
              <th>Lab & Type</th>
              <th>Type</th>
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
                      {formatDateTime(order.createdAt)}
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
                      {order.lab?.labName || order.onsiteLabName || 'Onsite Lab'}
                    </div>
                    <span className="admin-badge-default text-[10px] uppercase tracking-wide mt-1">
                      {order.collectionType?.replace('_', ' ') || 'onsite'}
                    </span>
                    <div className="admin-table-row-secondary mt-1">
                      Schedule: {formatDate(order.preferredDate)}
                      {order.preferredTimeSlot ? ` | ${order.preferredTimeSlot}` : ''}
                    </div>
                  </td>

                  {/* TYPE */}
                  <td>
                    <OrderTypeBadge
                      isCorporate={Boolean(order.customer?.corporateId)}
                      bookingSource={order.bookingSource}
                    />
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
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                      title="View Order"
                    >
                      <Eye size={16} />
                      <span className="text-xs font-bold">View</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
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
        <div className="admin-table-container flex justify-between items-center px-6 py-4 border-t bg-slate-50">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>

          <div className="admin-space-x">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1)}
                className="admin-btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1)}
                className="admin-btn-secondary"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
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
  if (status === 'COMPLETED')
    return (
      <Badge color="emerald" icon={<CheckCircle size={14} />}>
        Completed
      </Badge>
    );
  if (status === 'PENDING')
    return (
      <Badge color="amber" icon={<Clock size={14} />}>
        Pending
      </Badge>
    );
  if (status === 'CANCELLED' || status === 'REJECTED')
    return (
      <Badge color="rose" icon={<XCircle size={14} />}>
        {statusLabel(status)}
      </Badge>
    );
  return <Badge>{statusLabel(status)}</Badge>;
}

function PaymentBadge({ status }: { status?: string | null }) {
  if (status === 'Paid')
    return (
      <Badge color="emerald" icon={<CheckCircle size={14} />}>
        Paid
      </Badge>
    );
  return (
    <Badge color="rose" icon={<Clock size={14} />}>
      {status || 'Pending'}
    </Badge>
  );
}

function OrderTypeBadge({
  isCorporate,
  bookingSource
}: {
  isCorporate: boolean;
  bookingSource?: string | null;
}) {
  const isAdmin = bookingSource === 'Admin';
  let label = 'General';
  let color = 'default';

  if (isAdmin && isCorporate) {
    label = 'Admin / Corporate';
    color = 'info';
  } else if (isAdmin) {
    label = 'Admin / General';
    color = 'warning';
  } else if (isCorporate) {
    label = 'Corporate';
    color = 'success';
  }

  return (
    <span
      className={`admin-status-indicator admin-badge-${
        color === 'success'
          ? 'success'
          : color === 'warning'
            ? 'warning'
            : color === 'info'
              ? 'info'
              : 'default'
      }`}
    >
      {label}
    </span>
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
