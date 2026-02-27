'use client';

import Link from 'next/link';
import { type ComponentType, useEffect, useState } from 'react';
import { Building2, Search, UserRound, Users } from 'lucide-react';
import {
  CustomerStatusFilter,
  CustomerTypeFilter,
  getAdminCustomersList,
  getAdminCustomersStats,
  setCustomerActiveStatus,
} from '@/app/actions/adminCustomerActions';
import { toast } from '@/lib/safe-toast';

const PAGE_SIZE = 100;

type CustomerListResponse = Awaited<ReturnType<typeof getAdminCustomersList>>;
type CustomerListItem = CustomerListResponse['items'][number];

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function AdminCustomersPage() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    corporate: 0,
    general: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<CustomerTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });

  const loadStats = async () => {
    try {
      const statsData = await getAdminCustomersStats();
      setStats(statsData);
    } catch {
      toast.error('Failed to load customer stats');
    }
  };

  const load = async (
    status: CustomerStatusFilter,
    type: CustomerTypeFilter,
    query: string,
    currentPage: number
  ) => {
    setLoading(true);

    try {
      const rows = await getAdminCustomersList({
        status,
        type,
        search: query,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      setItems(rows.items);
      setPagination({
        total: rows.total,
        page: rows.page,
        pageSize: rows.pageSize,
        totalPages: rows.totalPages,
      });

      if (rows.total > 0 && currentPage > rows.totalPages) {
        setPage(rows.totalPages);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(statusFilter, typeFilter, search, page);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, search, page]);

  const handleStatusToggle = async (customerId: number, nextStatus: boolean) => {
    const actionLabel = nextStatus ? 'activate' : 'deactivate';
    if (!confirm(`Do you want to ${actionLabel} this customer account?`)) return;

    setUpdatingId(customerId);
    const res = await setCustomerActiveStatus(customerId, nextStatus);
    setUpdatingId(null);

    if (!res.success) {
      toast.error(res.error || 'Failed to update account status');
      return;
    }

    toast.success(nextStatus ? 'Customer account activated' : 'Customer account deactivated');
    await Promise.all([load(statusFilter, typeFilter, search, page), loadStats()]);
  };

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="admin-space-y">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Customers</h1>
        <p className="admin-page-subtitle">
          View all customers, account type, status, and open full profile details.
        </p>
      </div>

      <div className="admin-stat-grid">
        <StatCard title="Total Customers" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Active" value={stats.active} icon={UserRound} color="bg-emerald-500" />
        <StatCard title="Inactive" value={stats.inactive} icon={UserRound} color="bg-amber-500" />
        <StatCard title="Corporate Users" value={stats.corporate} icon={Building2} color="bg-indigo-500" />
      </div>

      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <div className="flex flex-col md:flex-row gap-3 w-full md:items-center md:justify-between">
            <div className="admin-search-container">
              <Search className="admin-search-icon" size={18} />
              <input
                className="admin-search-input w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email, UHID, employee ID, company..."
              />
            </div>

            <div className="flex gap-2">
              <select
                className="admin-form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CustomerStatusFilter)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="admin-form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as CustomerTypeFilter)}
              >
                <option value="all">All Types</option>
                <option value="corporate">Corporate</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Number</th>
                <th>Type</th>
                <th>Orders</th>
                <th>Account Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                items.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="admin-table-row-primary">{customer.name || 'Unnamed Customer'}</div>
                      <div className="admin-table-row-secondary">{customer.email || '-'}</div>
                      {customer.uhid ? (
                        <div className="admin-table-row-secondary">UHID: {customer.uhid}</div>
                      ) : null}
                    </td>
                    <td className="admin-table-row-primary">{customer.phone || '-'}</td>
                    <td>
                      {customer.corporate ? (
                        <div className="flex flex-col gap-1">
                          <span className="admin-badge admin-badge-info">Corporate User</span>
                          <span className="admin-table-row-secondary">{customer.corporate.companyName}</span>
                        </div>
                      ) : (
                        <span className="admin-badge admin-badge-default">General User</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-table-row-primary">{customer.orderCount}</div>
                      <div className="admin-table-row-secondary">Last: {formatDate(customer.lastOrderAt)}</div>
                    </td>
                    <td>
                      <div
                        className={`admin-status-indicator ${
                          customer.isActive ? 'admin-badge-success' : 'admin-badge-default'
                        }`}
                      >
                        <div
                          className={`admin-status-dot ${
                            customer.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/customers/${customer.id}`} className="admin-btn-secondary text-xs">
                          View
                        </Link>
                        <button
                          className={customer.isActive ? 'admin-btn-danger text-xs' : 'admin-btn-primary text-xs'}
                          disabled={updatingId === customer.id}
                          onClick={() => handleStatusToggle(customer.id, !customer.isActive)}
                        >
                          {updatingId === customer.id
                            ? 'Updating...'
                            : customer.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-50">
          <div className="text-sm text-slate-600">
            Showing {startItem}-{endItem} of {pagination.total} customers (100 per page)
          </div>
          <div className="flex items-center gap-2">
            <button
              className="admin-btn-secondary text-xs"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="admin-btn-secondary text-xs"
              disabled={loading || page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ size?: number }>;
  color: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon-container ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="admin-stat-label">{title}</p>
        <h3 className="admin-stat-value">{value}</h3>
      </div>
    </div>
  );
}
