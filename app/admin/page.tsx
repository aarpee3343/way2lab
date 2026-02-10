// app/admin/page.tsx (updated)
'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboardStats } from '@/app/actions/adminDashboard';
import { 
  Package, Calendar, Clock, CheckCircle2, TrendingUp, Wallet, RotateCcw, HandCoins, AlertCircle
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

  if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

  // Format Chart Data
  const chartData = stats.chartData.map((d: any) => ({
    date: new Date(d.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: Number(d.c)
  }));

  const statCards = [
    { 
      label: 'Total Orders', 
      val: stats.totalOrders, 
      icon: Package, 
      color: 'bg-blue-500' 
    },
    { 
      label: "Today's Orders", 
      val: stats.todayOrders, 
      icon: Calendar, 
      color: 'bg-emerald-500' 
    },
    { 
      label: 'Pending', 
      val: stats.pendingOrders, 
      icon: Clock, 
      color: 'bg-amber-500' 
    },
    { 
      label: 'Completed', 
      val: stats.completedOrders, 
      icon: CheckCircle2, 
      color: 'bg-indigo-500' 
    },
    { 
      label: 'Collected', 
      val: `₹${Number(stats.totalCollected || 0).toFixed(0)}`, 
      icon: Wallet, 
      color: 'bg-emerald-600' 
    },
    { 
      label: 'Refunded', 
      val: `₹${Number(stats.totalRefunded || 0).toFixed(0)}`, 
      icon: RotateCcw, 
      color: 'bg-amber-500' 
    },
    { 
      label: 'Net Revenue', 
      val: `₹${Number(stats.netRevenue || 0).toFixed(0)}`, 
      icon: HandCoins, 
      color: 'bg-sky-600' 
    },
    { 
      label: 'Outstanding', 
      val: `₹${Number(stats.outstanding || 0).toFixed(0)}`, 
      icon: AlertCircle, 
      color: 'bg-rose-500' 
    },
  ];

  return (
    <div className="admin-space-y">
      
      {/* Welcome Banner */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        <p className="admin-page-subtitle">
          Welcome back, Admin. Here is what is happening today.
        </p>
      </div>

      {/* Stat Grid */}
      <div className="admin-stat-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="admin-stat-card">
            <div className={`admin-stat-icon-container ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <h3 className="admin-stat-value">{stat.val}</h3>
              <p className="admin-stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <TrendingUp size={20} className="text-blue-600" />
            Order Volume (Last 7 Days)
          </h3>
        </div>
        
        <div className="admin-card-body" style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8' }} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '0.5rem', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={40} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
