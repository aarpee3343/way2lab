import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getCorporateBillableOrders } from '@/lib/corporate-finance';
import prisma from '@/lib/db';

function toRange(from?: string, to?: string) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default async function CorporateBilledEmployeesPage({
  params,
  searchParams
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
      select: { id: true, companyName: true }
    }),
    getCorporateBillableOrders({ corporateId, start, end })
  ]);

  if (!corporate) redirect('/admin/corporates');

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Billed Employees</h1>
          <p className="admin-page-subtitle">{corporate.companyName}</p>
        </div>
        <Link href={`/admin/corporates/${corporateId}/finance`} className="admin-btn-secondary">
          Back to Finance
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          <form className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="admin-form-label">From</label>
              <input type="date" name="from" defaultValue={from} className="admin-form-input" />
            </div>
            <div>
              <label className="admin-form-label">To</label>
              <input type="date" name="to" defaultValue={to} className="admin-form-input" />
            </div>
            <button type="submit" className="admin-btn-primary">Apply</button>
            <Link href={`/admin/corporates/${corporateId}/finance/billed-employees`} className="admin-btn-secondary">
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
                  <th>Employee Name</th>
                  <th>Email / Phone</th>
                  <th>Package</th>
                  <th>Order</th>
                  <th>Service Completed Date</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No billed employees in selected range.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={`${row.orderId}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{row.employeeName}</td>
                      <td>
                        <div>{row.employeeEmail || '-'}</div>
                        <div className="text-xs text-slate-500">{row.employeePhone || '-'}</div>
                      </td>
                      <td>{row.packageName}</td>
                      <td>
                        <Link href={`/admin/orders/${row.orderId}`} className="text-blue-600 hover:underline">
                          #{row.orderNumber}
                        </Link>
                      </td>
                      <td>{new Date(row.completedAt).toLocaleString('en-IN')}</td>
                      <td>₹{Number(row.unitPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
