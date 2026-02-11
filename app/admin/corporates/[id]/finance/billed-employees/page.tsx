import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getCorporateBillableOrders } from '@/lib/corporate-finance';
import prisma from '@/lib/db';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Table from '@/components/admin/corporate/Table';

function toRange(from?: string, to?: string) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default async function CorporateBilledEmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    await requireAdmin({ roles: ['SUPER_ADMIN', 'ADMIN'] });
  } catch {
    redirect('/admin/login');
  }

  const { id } = await params;
  const sp = await searchParams;
  const corporateId = Number(id);
  const from = String(Array.isArray(sp.from) ? sp.from[0] : sp.from || '');
  const to = String(Array.isArray(sp.to) ? sp.to[0] : sp.to || '');
  const { start, end } = toRange(from, to);

  const [corporate, rows] = await Promise.all([
    prisma.corporate.findUnique({
      where: { id: corporateId },
      select: { id: true, companyName: true },
    }),
    getCorporateBillableOrders({ corporateId, start, end }),
  ]);

  if (!corporate) redirect('/admin/corporates');

  const tableRows = rows.map((row, idx) => [
    idx + 1,
    row.employeeName,
    <div key={idx}>
      <div>{row.employeeEmail || '-'}</div>
      <div className="text-xs text-muted">{row.employeePhone || '-'}</div>
    </div>,
    row.packageName,
    <Link key={`order-${row.orderId}`} href={`/admin/orders/${row.orderId}`} className="text-blue-600 hover:underline">
      #{row.orderNumber}
    </Link>,
    new Date(row.completedAt).toLocaleString('en-IN'),
    `₹${Number(row.unitPrice || 0).toFixed(2)}`,
  ]);

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Billed Employees</h1>
          <p className="admin-page-subtitle">{corporate.companyName}</p>
        </div>
        <Button href={`/admin/corporates/${corporateId}/finance`} variant="secondary" size="sm">
          Back to Finance
        </Button>
      </div>

      <Card>
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="admin-form-label">From</label>
            <input type="date" name="from" defaultValue={from} className="admin-form-input" />
          </div>
          <div>
            <label className="admin-form-label">To</label>
            <input type="date" name="to" defaultValue={to} className="admin-form-input" />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Apply
          </Button>
          <Button
            href={`/admin/corporates/${corporateId}/finance/billed-employees`}
            variant="secondary"
            size="sm"
          >
            Reset
          </Button>
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <div className="p-6 text-center text-muted">No billed employees in selected range.</div>
        ) : (
          <Table
            headers={[
              'Sr. No.',
              'Employee Name',
              'Email / Phone',
              'Package',
              'Order',
              'Service Completed Date',
              'Unit Price',
            ]}
            rows={tableRows}
          />
        )}
      </Card>
    </div>
  );
}

