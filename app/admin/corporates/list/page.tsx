'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Archive, RotateCcw } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { getCorporatesList, setCorporateActiveStatus } from '@/app/actions/adminCorporateActions';

type StatusFilter = 'all' | 'active' | 'archived';

export default function CorporateListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const load = async (nextStatus: StatusFilter, nextSearch: string) => {
    setLoading(true);
    const res = await getCorporatesList({ status: nextStatus, search: nextSearch });
    setItems(res || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(status, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this corporate? Employees will become regular users.')) return;
    const res = await setCorporateActiveStatus(id, false);
    if (res.success) {
      toast.success('Corporate archived');
      load(status, search);
    } else {
      toast.error(res.error || 'Archive failed');
    }
  };

  const handleRestore = async (id: number) => {
    const res = await setCorporateActiveStatus(id, true);
    if (res.success) {
      toast.success('Corporate restored');
      load(status, search);
    } else {
      toast.error(res.error || 'Restore failed');
    }
  };

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-5">
        <div>
          <h1 className="admin-page-title">All Corporates</h1>
          <p className="text-sm text-slate-600">Search, archive, restore, and open corporate workspaces.</p>
        </div>
        <Link href="/admin/corporates/create" className="admin-btn-primary text-xs">Create Corporate</Link>
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
            placeholder="Search corporates..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-card-header font-bold">Corporates</div>
        {loading ? (
          <div className="admin-loading">Loading corporates...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No corporates found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>City</th>
                <th>Employees</th>
                <th>Services</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="admin-table-row-primary">{c.companyName}</td>
                  <td>
                    <div className="admin-table-row-primary">{c.contactPerson}</div>
                    <div className="admin-table-row-secondary">{c.email}</div>
                  </td>
                  <td className="admin-table-row-secondary">{c.city || '-'}</td>
                  <td className="admin-table-row-primary">{c._count.employees}</td>
                  <td className="admin-table-row-primary">{c._count.services}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    <Link href={`/admin/corporates/${c.id}`} className="admin-btn-secondary text-xs">
                      Manage
                    </Link>
                    {c.isActive ? (
                      <button onClick={() => handleArchive(c.id)} className="text-xs text-rose-600 font-bold">
                        <Archive size={14} className="inline-block mr-1" /> Archive
                      </button>
                    ) : (
                      <button onClick={() => handleRestore(c.id)} className="text-xs text-emerald-600 font-bold">
                        <RotateCcw size={14} className="inline-block mr-1" /> Restore
                      </button>
                    )}
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
