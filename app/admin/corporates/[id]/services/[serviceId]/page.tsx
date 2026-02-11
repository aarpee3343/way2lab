import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { formatISTDateTime } from '@/lib/date-time';
import {
  deactivateCorporateServiceAction
} from '@/app/actions/adminCorporateActions';
import { getCorporateServiceEmployeeReport } from '@/lib/corporate-service-report';

function normalizeStatus(raw?: string | string[]) {
  const value = String(Array.isArray(raw) ? raw[0] : raw || 'ALL').toUpperCase();
  return ['ALL', 'PENDING', 'IN_PROCESS', 'AVAILED'].includes(value) ? value : 'ALL';
}

function dateOnly(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

async function handleDeactivateService(formData: FormData) {
  'use server';
  const serviceId = Number(formData.get('serviceId'));
  await deactivateCorporateServiceAction(serviceId);
}

export default async function CorporateServiceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; serviceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    redirect('/admin/login');
  }

  const { id, serviceId } = await params;
  const sp = await searchParams;
  const corporateId = Number(id);
  const serviceIdNum = Number(serviceId);
  if (!corporateId || !serviceIdNum) return notFound();

  const status = normalizeStatus(sp.status);
  const from = String(Array.isArray(sp.from) ? sp.from[0] : sp.from || '');
  const to = String(Array.isArray(sp.to) ? sp.to[0] : sp.to || '');

  const report = await getCorporateServiceEmployeeReport({
    corporateId,
    serviceId: serviceIdNum,
    status: status as any,
    from,
    to
  });

  if (!report?.service) return notFound();

  const service = report.service as any;
  const serviceName = service.package?.packageName || `Coupon: ${service.coupon?.code || 'N/A'}`;
  const csvHref = `/api/admin/corporates/${corporateId}/services/${serviceIdNum}/employees-csv?status=${encodeURIComponent(status)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">{serviceName}</h1>
          <p className="admin-page-subtitle">
            Corporate: {service.corporate?.companyName} | Service ID: #{service.id}
          </p>
        </div>
        <div className="admin-space-x">
          <Link href={`/admin/corporates/${corporateId}`} className="admin-btn-secondary">
            Back
          </Link>
          <a href={csvHref} className="admin-btn-secondary">Download CSV</a>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Service Status</div>
          <div className="admin-stat-value">{service.isActive ? 'Active' : 'Inactive'}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Validity</div>
          <div className="admin-stat-value text-sm">{dateOnly(service.validFrom)} - {dateOnly(service.validTill)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Usage (Availed / In Process / Pending)</div>
          <div className="admin-stat-value text-sm">{report.counts.availed} / {report.counts.inProcess} / {report.counts.pending}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          <form className="flex flex-col md:flex-row gap-3 items-end">
            <div>
              <label className="admin-form-label">Status</label>
              <select name="status" defaultValue={status} className="admin-form-select">
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="AVAILED">Availed</option>
              </select>
            </div>
            <div>
              <label className="admin-form-label">From</label>
              <input type="date" name="from" defaultValue={from} className="admin-form-input" />
            </div>
            <div>
              <label className="admin-form-label">To</label>
              <input type="date" name="to" defaultValue={to} className="admin-form-input" />
            </div>
            <button type="submit" className="admin-btn-primary">Apply Filters</button>
            <Link href={`/admin/corporates/${corporateId}/services/${serviceIdNum}`} className="admin-btn-secondary">
              Reset
            </Link>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body p-0">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name</th>
                  <th>Contact Details</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Availed Date</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No employees found for selected filters.
                    </td>
                  </tr>
                ) : (
                  report.rows.map((row, idx) => (
                    <tr key={row.employeeId}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="admin-table-row-primary">{row.name}</div>
                        <div className="admin-table-row-secondary">{row.employeeCode || '-'}</div>
                      </td>
                      <td>
                        <div className="admin-table-row-primary">{row.phone || '-'}</div>
                        <div className="admin-table-row-secondary">{row.email || '-'}</div>
                      </td>
                      <td>
                        <span className={`admin-badge ${
                          row.status === 'AVAILED'
                            ? 'admin-badge-success'
                            : row.status === 'IN_PROCESS'
                              ? 'admin-badge-warning'
                              : 'admin-badge-default'
                        }`}>
                          {row.status === 'IN_PROCESS' ? 'In Process' : row.status === 'AVAILED' ? 'Availed' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {row.orderId ? (
                          <Link href={`/admin/orders/${row.orderId}`} className="text-blue-600 hover:underline">
                            #{row.orderNumber || row.orderId}
                          </Link>
                        ) : '-'}
                      </td>
                      <td>
                        {row.status === 'AVAILED'
                          ? formatISTDateTime(row.completedAt)
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {service.isActive && (
        <div className="admin-card border-rose-100">
          <div className="admin-card-body flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-bold text-rose-700">Deactivate Service</p>
              <p className="text-sm text-slate-500">
                This will deactivate this service for future bookings and keep history intact.
              </p>
            </div>
            <form action={handleDeactivateService}>
              <input type="hidden" name="serviceId" value={service.id} />
              <button
                type="submit"
                className="admin-btn-secondary border border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Deactivate Service
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
