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
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 p-5">
        <h1 className="text-2xl font-black text-slate-900">Corporate Dashboard</h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Overview of corporate accounts, workforce activation and enterprise onboarding.
        </p>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><Building2 size={24}/></div>
            <div>
              <p className="admin-stat-label text-white/70">Total Corporates</p>
              <h3 className="admin-stat-value text-white">{data.total}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl"><Users size={24} className="text-emerald-600"/></div>
            <div>
              <p className="admin-stat-label text-emerald-700">Active</p>
              <h3 className="admin-stat-value text-slate-900">{data.active}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl"><Building2 size={24} className="text-slate-500"/></div>
            <div>
              <p className="admin-stat-label text-slate-500">Archived</p>
              <h3 className="admin-stat-value text-slate-900">{data.archived}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent List */}
      <div className="admin-table-container">
        <div className="admin-card-header font-bold bg-gradient-to-r from-white to-sky-50">
          Recently Added Corporates
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>City</th>
              <th>Employees</th>
              <th>Status</th>
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
                <td>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                    c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
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
