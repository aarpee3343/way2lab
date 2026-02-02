'use client';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function CorpStatsGrid({ filters }: any) {
  // Logic: In a real app, you'd fetch data based on filters.location and filters.department
  const stats = [
    { label: 'Headcount', value: '1,240', sub: 'Total mapped', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Utilized', value: '458', sub: '37% of eligibility', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Pending', value: '782', sub: 'Requires follow-up', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Urgent Findings', value: '12', sub: 'Critical results', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
           <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-110`} />
           <div className={`${s.bg} ${s.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
             <s.icon size={24} />
           </div>
           <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{s.label}</p>
           <h3 className="text-3xl font-black text-slate-900 mt-1">{s.value}</h3>
           <p className="text-[10px] font-bold text-slate-400 mt-2">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}