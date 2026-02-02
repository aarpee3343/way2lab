'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'IT Dept', healthScore: 85, color: '#3b82f6' },
  { name: 'Operations', healthScore: 62, color: '#f59e0b' },
  { name: 'HR', healthScore: 78, color: '#10b981' },
  { name: 'Sales', healthScore: 54, color: '#ef4444' },
];

export default function HealthTrends() {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-[400px]">
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Departmental Wellness Score (%)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
          />
          <Bar dataKey="healthScore" radius={[10, 10, 10, 10]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}