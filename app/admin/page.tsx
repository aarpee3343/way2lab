'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboardStats } from '@/app/actions/adminDashboard';
import { 
  Package, Calendar, Clock, CheckCircle2, TrendingUp 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getAdminDashboardStats();
      setStats(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Dashboard...</div>;

  // Format Chart Data
  const chartData = stats.chartData.map((d: any) => ({
    date: new Date(d.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: Number(d.c)
  }));

  const statCards = [
    { label: 'Total Orders', val: stats.totalOrders, icon: Package, color: 'bg-blue-500' },
    { label: "Today's Orders", val: stats.todayOrders, icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Pending', val: stats.pendingOrders, icon: Clock, color: 'bg-amber-500' },
    { label: 'Completed', val: stats.completedOrders, icon: CheckCircle2, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin. Here is what is happening today.</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stat.val}</h3>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Order Volume (Last 7 Days)
          </h3>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}