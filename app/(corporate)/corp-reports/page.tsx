'use client';
import { useState } from 'react';
import { FileText, Download, Zip, Search, Eye, CheckCircle } from 'lucide-react';

export default function CorporateReportsPage() {
  const [reportType, setReportType] = useState('PRE_EMPLOYMENT');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Health Records</h1>
          <p className="text-sm text-slate-500 font-medium">Access candidate and employee medical reports</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">
          <Download size={18} /> Bulk Download (.zip)
        </button>
      </div>

      {/* Report Filters */}
      <div className="flex gap-4 p-1 bg-slate-200/50 w-fit rounded-2xl">
        {['PRE_EMPLOYMENT', 'ANNUAL_CHECKUP', 'SHARED_BY_EMPLOYEE'].map(t => (
          <button 
            key={t}
            onClick={() => setReportType(t)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${reportType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Candidate/Employee</th>
              <th className="px-4 py-5">ID</th>
              <th className="px-4 py-5 text-center">Date</th>
              <th className="px-4 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[1, 2, 3].map(i => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-black text-slate-800">Candidate Name {i}</td>
                <td className="px-4 py-5 font-mono text-xs text-slate-400">#PRE-2026-0{i}</td>
                <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">Feb 01, 2026</td>
                <td className="px-4 py-5 text-center">
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Report Ready</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600"><Eye size={18}/></button>
                    <button className="p-2 text-slate-400 hover:text-blue-600"><Download size={18}/></button>
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