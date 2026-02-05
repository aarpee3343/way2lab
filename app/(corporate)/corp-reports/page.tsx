'use client';
import { useEffect, useState } from 'react';
import { FileText, Download, Search, Eye } from 'lucide-react';
import { getCorporateReports } from '@/app/actions/corporatePortalActions';
import { toast } from '@/lib/safe-toast';

export default function CorporateReportsPage() {
  const [reportType, setReportType] = useState<'ALL' | 'PRE_EMPLOYMENT' | 'ANNUAL_CHECKUP' | 'SHARED_BY_EMPLOYEE'>('ALL');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await getCorporateReports({ type: reportType, search });
      setReports(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [reportType, search]);

  const handleDownload = (reportId: number) => {
    window.open(`/api/corp/reports/${reportId}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Health Records</h1>
          <p className="text-sm text-slate-500 font-medium">Access candidate and employee medical reports</p>
        </div>
        <button
          onClick={() => {
            if (reports.length === 0) {
              toast.error('No reports to download');
              return;
            }
            const csv = [
              ['orderNumber', 'patientName', 'employeeId', 'reportType', 'date'].join(','),
              ...reports.map(r => [
                r.orderNumber,
                r.patientName,
                r.employeeId || '',
                r.reportType || '',
                new Date(r.createdAt).toLocaleDateString()
              ].join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'corporate_reports.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-4 p-1 bg-slate-200/50 w-fit rounded-2xl">
          {(['ALL', 'PRE_EMPLOYMENT', 'ANNUAL_CHECKUP', 'SHARED_BY_EMPLOYEE'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setReportType(t)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${reportType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'ALL' ? 'ALL' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            placeholder="Search by name or order"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Candidate/Employee</th>
              <th className="px-4 py-5">Order</th>
              <th className="px-4 py-5 text-center">Date</th>
              <th className="px-4 py-5 text-center">Type</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr><td colSpan={5} className="px-8 py-6 text-slate-500">Loading reports...</td></tr>
            )}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-6 text-slate-500">No reports found.</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-black text-slate-800">{r.patientName}</td>
                <td className="px-4 py-5 font-mono text-xs text-slate-400">{r.orderNumber}</td>
                <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-5 text-center">
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{r.category.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDownload(r.id)} className="p-2 text-slate-400 hover:text-blue-600"><Eye size={18}/></button>
                    <button onClick={() => handleDownload(r.id)} className="p-2 text-slate-400 hover:text-blue-600"><Download size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

