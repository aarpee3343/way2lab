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

  if (!data) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><Building2 size={24}/></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase">Total Corporates</p>
              <h3 className="text-3xl font-black">{data.total}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-lg text-slate-800">
          Recently Added Corporates
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Employees</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.recent.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">{c.companyName}</td>
                <td className="px-6 py-4 text-slate-600">{c.contactPerson}<br/><span className="text-xs text-slate-400">{c.phone}</span></td>
                <td className="px-6 py-4 text-slate-600">{c.city || '-'}</td>
                <td className="px-6 py-4 text-slate-600">{c._count.employees}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/corporates/${c.id}`} className="text-blue-600 font-bold hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}