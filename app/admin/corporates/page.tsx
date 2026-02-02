// app/admin/corporates/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { getCorporateDashboardStats } from '@/app/actions/adminCorporateActions';
import { Building2, Users } from 'lucide-react';
import Link from 'next/link';

export default function CorporateDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCorporateDashboardStats().then(setData);
  }, []);

  if (!data) return <div className="admin-loading">Loading Dashboard...</div>;

  return (
    <div className="admin-space-y">
      {/* Stats */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card bg-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><Building2 size={24}/></div>
            <div>
              <p className="admin-stat-label text-white/70">Total Corporates</p>
              <h3 className="admin-stat-value text-white">{data.total}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent List */}
      <div className="admin-table-container">
        <div className="admin-card-header font-bold">
          Recently Added Corporates
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>City</th>
              <th>Employees</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((c: any) => (
              <tr key={c.id}>
                <td className="admin-table-row-primary">{c.companyName}</td>
                <td>
                  <div className="admin-table-row-primary">{c.contactPerson}</div>
                  <div className="admin-table-row-secondary">{c.phone}</div>
                </td>
                <td className="admin-table-row-secondary">{c.city || '-'}</td>
                <td className="admin-table-row-primary">{c._count.employees}</td>
                <td className="text-right">
                  <Link href={`/admin/corporates/${c.id}`} className="admin-btn-secondary text-xs">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}