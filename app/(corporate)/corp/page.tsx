'use client';

import { useState } from 'react';
import CorpStatsGrid from '@/components/corporate/CorpStatsGrid';
import { 
  BarChart3, Filter, Download, 
  ChevronRight, ArrowUpRight, ShieldCheck 
} from 'lucide-react';

// NOTE: I removed the unused action imports. 
// If you plan to add a "Quick Create User" button here later, add them back.

export default function CorporateDashboardPage() {
  const [filters, setFilters] = useState({
    location: 'All Locations',
    department: 'All Departments',
    service: 'All Services'
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* 1. Header with Advanced Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Health Analytics</h1>
          <p className="text-slate-500 font-medium">Overview for Acme Industries Global</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Filter size={14} className="text-slate-400" />
            <select 
              className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            >
              <option>All Locations</option>
              <option>Delhi Hub</option>
              <option>Mumbai Center</option>
              <option>Bangalore Tech Park</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <select 
              className="bg-transparent text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
            >
              <option>All Departments</option>
              <option>Human Resources</option>
              <option>Operations</option>
              <option>Engineering</option>
            </select>
          </div>

          <button className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-black transition-colors shadow-lg">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* 2. Stats Grid Component */}
      <CorpStatsGrid filters={filters} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Service Engagement List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                <BarChart3 size={18} className="text-blue-600" /> Active Service Tracking
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">
                  <tr>
                    <th className="px-8 py-4">Assigned Service</th>
                    <th className="px-4 py-4 text-center">Eligibility</th>
                    <th className="px-4 py-4 text-center">Availed</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { name: 'Annual Health Checkup 2026', total: 850, done: 420, status: 'Active', color: 'bg-emerald-500' },
                    { name: 'Pre-Employment (IT Dept)', total: 45, done: 38, status: 'Ongoing', color: 'bg-blue-500' },
                    { name: 'Executive Cardiac Screening', total: 120, done: 15, status: 'Newly Added', color: 'bg-purple-500' },
                  ].map((service, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{service.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Assigned Jan 12, 2026</p>
                      </td>
                      <td className="px-4 py-5 text-center font-bold text-slate-600">{service.total}</td>
                      <td className="px-4 py-5 text-center font-black text-emerald-600">{service.done}</td>
                      <td className="px-4 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${service.color} animate-pulse`} />
                          <span className="text-[10px] font-black uppercase text-slate-500">{service.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                          <ChevronRight size={18} className="text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Side Info Card: Pre-Employment Privacy */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <ShieldCheck size={40} className="mb-6 opacity-80" />
            <h3 className="text-xl font-black mb-3">Privacy Controls</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
              You are currently viewing data as <span className="text-white font-bold">Super Admin</span>. 
              Employee PII is visible based on your global settings. 
            </p>
            <button className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all">
              Security Settings
            </button>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-6">Recent Reports</h4>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Report_#{i*234}</p>
                      <p className="text-[10px] font-bold text-slate-400">Uploaded 2h ago</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}