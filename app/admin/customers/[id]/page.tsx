'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Building2, Mail, Phone, UserRound } from 'lucide-react';
import { getAdminCustomerDetails, setCustomerActiveStatus } from '@/app/actions/adminCustomerActions';
import { toast } from '@/lib/safe-toast';

type CustomerDetails = Awaited<ReturnType<typeof getAdminCustomerDetails>>;

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

const prettify = (value: string | null | undefined) => {
  if (!value) return '-';
  return value
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function AdminCustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customerId = Number(id);

  const [customer, setCustomer] = useState<CustomerDetails>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminCustomerDetails(customerId);
      setCustomer(data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId || Number.isNaN(customerId)) {
      setLoading(false);
      return;
    }
    load();
  }, [customerId, load]);

  const handleStatusToggle = async () => {
    if (!customer) return;
    const nextStatus = !customer.isActive;
    const actionLabel = nextStatus ? 'activate' : 'deactivate';
    if (!confirm(`Do you want to ${actionLabel} this customer account?`)) return;

    setStatusUpdating(true);
    const res = await setCustomerActiveStatus(customerId, nextStatus);
    setStatusUpdating(false);

    if (!res.success) {
      toast.error(res.error || 'Failed to update status');
      return;
    }

    toast.success(nextStatus ? 'Customer account activated' : 'Customer account deactivated');
    await load();
  };

  if (loading) {
    return <div className="admin-loading">Loading customer details...</div>;
  }

  if (!customer) {
    return (
      <div className="admin-space-y">
        <Link href="/admin/customers" className="admin-btn-secondary text-xs w-fit">
          <ArrowLeft size={14} /> Back to Customers
        </Link>
        <div className="admin-card">
          <div className="admin-card-body text-slate-500">Customer not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-space-y">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/admin/customers" className="admin-btn-secondary text-xs w-fit mb-4">
            <ArrowLeft size={14} /> Back to Customers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="admin-page-title">{customer.name || 'Unnamed Customer'}</h1>
            <span className={`admin-badge ${customer.isActive ? 'admin-badge-success' : 'admin-badge-default'}`}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={customer.corporate ? 'admin-badge admin-badge-info' : 'admin-badge admin-badge-default'}>
              {customer.corporate ? 'Corporate User' : 'General User'}
            </span>
          </div>
          <p className="admin-page-subtitle">
            ID #{customer.id} {customer.uhid ? `• UHID ${customer.uhid}` : ''}
          </p>
        </div>
        <button
          className={customer.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}
          disabled={statusUpdating}
          onClick={handleStatusToggle}
        >
          {statusUpdating ? 'Updating...' : customer.isActive ? 'Deactivate Account' : 'Activate Account'}
        </button>
      </div>

      <div className="admin-stat-grid">
        <InfoCard label="Total Orders" value={String(customer.counts.orders)} />
        <InfoCard label="Completed Orders" value={String(customer.spendSummary.completedOrders)} />
        <InfoCard label="Pending Orders" value={String(customer.spendSummary.pendingOrders)} />
        <InfoCard label="Total Spend" value={formatCurrency(customer.spendSummary.totalSpent)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <UserRound size={18} /> Profile Details
            </h3>
          </div>
          <div className="admin-card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Name" value={customer.name || '-'} />
              <DetailField label="Phone" value={customer.phone || '-'} />
              <DetailField label="Email" value={customer.email || '-'} />
              <DetailField label="Date of Birth" value={formatDate(customer.dateOfBirth)} />
              <DetailField label="Gender" value={prettify(customer.gender)} />
              <DetailField label="Role" value={prettify(customer.role)} />
              <DetailField label="Login Method" value={prettify(customer.loginMethod)} />
              <DetailField label="Joined At" value={formatDateTime(customer.createdAt)} />
              <DetailField label="Employee ID" value={customer.employeeId || '-'} />
              <DetailField label="Department" value={customer.department || '-'} />
              <DetailField label="Location" value={customer.location || '-'} />
              <DetailField label="Last Order" value={formatDateTime(customer.spendSummary.lastOrderAt)} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Building2 size={18} /> Corporate
            </h3>
          </div>
          <div className="admin-card-body">
            {customer.corporate ? (
              <div className="space-y-3">
                <div className="admin-table-row-primary">{customer.corporate.companyName}</div>
                <div className="text-sm text-slate-600">{customer.corporate.contactPerson || '-'}</div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Mail size={14} /> {customer.corporate.email || '-'}
                </div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Phone size={14} /> {customer.corporate.phone || '-'}
                </div>
                <div>
                  <span
                    className={`admin-badge ${
                      customer.corporate.isActive ? 'admin-badge-success' : 'admin-badge-default'
                    }`}
                  >
                    {customer.corporate.isActive ? 'Corporate Active' : 'Corporate Archived'}
                  </span>
                </div>
                <Link href={`/admin/corporates/${customer.corporate.id}`} className="admin-btn-secondary text-xs">
                  Open Corporate
                </Link>
              </div>
            ) : (
              <div className="text-sm text-slate-500">This customer is a general user.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Addresses ({customer.counts.addresses})</h3>
          </div>
          <div className="admin-card-body">
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-slate-500">No addresses available.</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="admin-badge admin-badge-default">{address.type || 'Address'}</span>
                      <span className="text-xs text-slate-500">#{address.id}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {[address.addressLine1, address.addressLine2].filter(Boolean).join(', ') || '-'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {[address.city, address.state, address.pincode].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Family Members ({customer.counts.familyMembers})</h3>
          </div>
          <div className="admin-card-body">
            {customer.familyMembers.length === 0 ? (
              <p className="text-sm text-slate-500">No family members added.</p>
            ) : (
              <div className="space-y-3">
                {customer.familyMembers.map((member) => (
                  <div key={member.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="admin-table-row-primary">{member.name}</div>
                    <div className="text-xs text-slate-500">
                      {member.relationship} • {prettify(member.gender)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      DOB: {formatDate(member.dateOfBirth)} • UHID: {member.uhid || '-'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {member.phone || '-'} • {member.email || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Assigned Corporate Packages ({customer.counts.assignedPackages})</h3>
        </div>
        <div className="admin-card-body">
          {customer.assignedPackages.length === 0 ? (
            <p className="text-sm text-slate-500">No assigned package records.</p>
          ) : (
            <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Paid By</th>
                  <th>Assigned At</th>
                  <th>Availed At</th>
                </tr>
              </thead>
              <tbody>
                {customer.assignedPackages.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="admin-table-row-primary">{entry.package.packageName}</div>
                      <div className="admin-table-row-secondary">
                        {formatCurrency(entry.package.price)}{' '}
                        {entry.package.isPreEmployment ? '• Pre-Employment' : ''}
                      </div>
                    </td>
                    <td>{prettify(entry.status)}</td>
                    <td>{prettify(entry.paidBy)}</td>
                    <td>{formatDateTime(entry.assignedAt)}</td>
                    <td>{formatDateTime(entry.availedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Order History ({customer.orders.length})</h3>
        </div>
        <div className="admin-card-body">
          {customer.orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders found for this customer.</p>
          ) : (
            <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Patient / Lab</th>
                  <th>Collection</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Booked On</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="admin-table-row-primary">{order.orderNumber || `#${order.id}`}</div>
                      <div className="admin-table-row-secondary">{formatCurrency(order.finalAmount)}</div>
                    </td>
                    <td>
                      <div className="admin-table-row-primary">{order.patientName}</div>
                      <div className="admin-table-row-secondary">
                        {order.lab?.labName || '-'} {order.lab?.city ? `(${order.lab.city})` : ''}
                      </div>
                    </td>
                    <td>{prettify(order.collectionType)}</td>
                    <td>
                      <div className="admin-table-row-primary">{prettify(order.paymentStatus)}</div>
                      <div className="admin-table-row-secondary">{prettify(order.paymentMode)}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-default">{prettify(order.status)}</span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td className="text-right">
                      <Link href={`/admin/orders/${order.id}`} className="admin-btn-secondary text-xs">
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-stat-card">
      <div>
        <p className="admin-stat-label">{label}</p>
        <h3 className="admin-stat-value">{value}</h3>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="admin-table-row-primary mt-1 break-words">{value}</div>
    </div>
  );
}
