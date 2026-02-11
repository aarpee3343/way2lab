import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { formatISTDateTime } from '@/lib/date-time';
import { deactivateCorporateServiceAction } from '@/app/actions/adminCorporateActions';
import { getCorporateServiceEmployeeReport } from '@/lib/corporate-service-report';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Table from '@/components/admin/corporate/Table';
import Badge from '@/components/admin/corporate/Badge';

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
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

async function handleDeactivateService(formData: FormData) {
  'use server';
  const serviceId = Number(formData.get('serviceId'));
  await deactivateCorporateServiceAction(serviceId);
}

export default async function CorporateServiceDetailPage({
  params,
  searchParams,
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
    to,
  });

  if (!report?.service) return notFound();

  const service = report.service as any;
  const serviceName = service.package?.packageName || `Coupon: ${service.coupon?.code || 'N/A'}`;
  const csvHref = `/api/admin/corporates/${corporateId}/services/${serviceIdNum}/employees-csv?status=${encodeURIComponent(
    status
  )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const rows = report.rows.map((row, idx) => [
    idx + 1,
    <div key={row.employeeId}>
      <div className="admin-table-row-primary">{row.name}</div>
      <div className="admin-table-row-secondary">{row.employeeCode || '-'}</div>
    </div>,
    <div key={row.employeeId}>
      <div className="admin-table-row-primary">{row.phone || '-'}</div>
      <div className="admin-table-row-secondary">{row.email || '-'}</div>
    </div>,
    <Badge
      key={row.employeeId}
      variant={
        row.status === 'AVAILED'
          ? 'success'
          : row.status === 'IN_PROCESS'
          ? 'warning'
          : 'default'
      }
    >
      {row.status === 'IN_PROCESS'
        ? 'In Process'
        : row.status === 'AVAILED'
        ? 'Availed'
        : 'Pending'}
    </Badge>,
    row.orderId ? (
      <Link key={row.orderId} href={`/admin/orders/${row.orderId}`} className="text-blue-600 hover:underline">
        #{row.orderNumber || row.orderId}
      </Link>
    ) : (
      '-'
    ),
    row.status === 'AVAILED' ? formatISTDateTime(row.completedAt) : '-',
  ]);

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">{serviceName}</h1>
          <p className="admin-page-subtitle">
            Corporate: {service.corporate?.companyName} | Service ID: #{service.id}
          </p>
        </div>
        <div className="space-x-2">
          <Button href={`/admin/corporates/${corporateId}`} variant="secondary" size="sm">
            Back
          </Button>
          <Button href={csvHref} variant="secondary" size="sm">
            Download CSV
          </Button>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Card>
          <div className="admin-stat-label">Service Status</div>
          <div className="admin-stat-value">{service.isActive ? 'Active' : 'Inactive'}</div>
        </Card>
        <Card>
          <div className="admin-stat-label">Validity</div>
          <div className="admin-stat-value text-sm">
            {dateOnly(service.validFrom)} - {dateOnly(service.validTill)}
          </div>
        </Card>
        <Card>
          <div className="admin-stat-label">Usage (Availed / In Process / Pending)</div>
          <div className="admin-stat-value text-sm">
            {report.counts.availed} / {report.counts.inProcess} / {report.counts.pending}
          </div>
        </Card>
      </div>

      <Card>
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
          <Button type="submit" variant="primary" size="sm">
            Apply Filters
          </Button>
          <Button
            href={`/admin/corporates/${corporateId}/services/${serviceIdNum}`}
            variant="secondary"
            size="sm"
          >
            Reset
          </Button>
        </form>
      </Card>

      <Card>
        {report.rows.length === 0 ? (
          <div className="p-6 text-center text-muted">
            No employees found for selected filters.
          </div>
        ) : (
          <Table
            headers={[
              'Sr. No.',
              'Name',
              'Contact Details',
              'Status',
              'Order',
              'Availed Date',
            ]}
            rows={rows}
          />
        )}
      </Card>

      {service.isActive && (
        <Card className="border-destructive-light">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-bold text-destructive">Deactivate Service</p>
              <p className="text-sm text-muted">
                This will deactivate this service for future bookings and keep history intact.
              </p>
            </div>
            <form action={handleDeactivateService}>
              <input type="hidden" name="serviceId" value={service.id} />
              <Button type="submit" variant="destructive" size="sm">
                Deactivate Service
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}

