'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Trash2 } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { deleteCorporateServiceAction, getCorporateServices } from '@/app/actions/adminCorporateActions';

type StatusFilter = 'all' | 'active' | 'archived';

export default function CorporateServicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const load = async (nextStatus: StatusFilter, nextSearch: string) => {
    setLoading(true);
    const res = await getCorporateServices({ status: nextStatus, search: nextSearch });
    setItems(res || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(status, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleRemove = async (serviceId: number) => {
    if (!confirm('Remove this service from the corporate?')) return;
    const res = await deleteCorporateServiceAction(serviceId);
    if (res.success) {
      toast.success('Service removed');
      load(status, search);
    } else {
      toast.error(res.error || 'Remove failed');
    }
  };

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 p-5">
        <div>
          <h1 className="admin-page-title">Corporate Services</h1>
          <p className="text-sm text-slate-600">Manage service assignments and quickly jump to corporate detail workspaces.</p>
        </div>
        <Link href="/admin/corporates" className="admin-btn-secondary text-xs">Back</Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'active', 'archived'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase ${
                status === s ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-card-header font-bold">Service Assignments</div>
        {loading ? (
          <div className="admin-loading">Loading services...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No services found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Corporate</th>
                <th>Service</th>
                <th>Validity</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td className="admin-table-row-primary">
                    <Link href={`/admin/corporates/${s.corporate.id}`} className="hover:underline">
                      {s.corporate.companyName}
                    </Link>
                    {!s.corporate.isActive && (
                      <div className="text-[10px] text-slate-400 uppercase">Archived</div>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-row-primary">
                      {s.package?.packageName || `Coupon: ${s.coupon?.code}`}
                    </div>
                    <div className="admin-table-row-secondary text-xs">
                      {s.package ? 'Package' : 'Coupon'}
                    </div>
                  </td>
                  <td className="admin-table-row-secondary">
                    {new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTill).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleRemove(s.id)} className="text-xs text-rose-600 font-bold">
                      <Trash2 size={14} className="inline-block mr-1" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
