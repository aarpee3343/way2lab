'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  Home,
  Users,
  ArrowRight,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';

import { MotionCard } from '@/components/ui/MotionCard';
import LatestHealthWidget from '@/components/dashboard/LatestHealthWidget';
import { useDashboard } from '@/hooks/useDashboard';
import type { Order, DashboardStats } from '@/lib/types/dashboard';

/* ===================== SKELETON LOADER ===================== */
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-3">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="h-10 w-32 bg-slate-200 rounded-lg" />
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-slate-200 rounded-xl" />
            <div className="h-6 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-10 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ===================== ERROR STATE ===================== */
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
      <AlertCircle className="text-red-600" size={32} />
    </div>
    <h3 className="text-lg font-semibold text-slate-800">Something went wrong</h3>
    <p className="text-slate-600 text-center">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Try Again
      </button>
    )}
  </div>
);

/* ===================== STATS CONFIG ===================== */
const getStatsConfig = (stats: DashboardStats | undefined) => [
  {
    label: 'Total Orders',
    value: stats?.totalOrders || 0,
    icon: ClipboardList,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    trend: '+2'
  },
  {
    label: 'Pending',
    value: stats?.pendingOrders || 0,
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100'
  },
  {
    label: 'Home Visits',
    value: stats?.homeCollection || 0,
    icon: Home,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100'
  },
  {
    label: 'Family',
    value: stats?.familyMembers || 0,
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100'
  }
];

/* ===================== PAGE ===================== */
export default function DashboardHome() {
  const { data, loading, error, refresh, refreshing } = useDashboard();

  const [quickActions] = useState([
    { label: 'Book Test', description: '500+ tests available', icon: Activity, color: 'from-blue-600 to-indigo-600', href: '/search' },
    { label: 'View Reports', description: 'Digital test results', icon: TrendingUp, color: 'from-emerald-500 to-green-600', href: '/dashboard/reports' },
  ]);

  const handleRefresh = async () => {
    await refresh();
    toast.success('Dashboard refreshed');
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;

  const statsConfig = getStatsConfig(data?.stats);
  const recentOrders = data?.recentOrders || [];
  const user = data?.user;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Welcome back</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {user?.name ? `Hello, ${user.name.split(' ')[0]}!` : 'Dashboard'}
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening with your health today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            System Operational
          </div>
        </div>
      </div>

      {/* ================= STATS GRID ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsConfig.map((stat, idx) => (
          <MotionCard
            key={idx}
            delay={idx * 0.1}
            className={`p-6 border ${stat.border} bg-white rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {stat.trend} this month
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </MotionCard>
        ))}
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <MotionCard
              key={idx}
              delay={0.2 + idx * 0.1}
              className={`bg-gradient-to-br ${action.color} text-white p-6 rounded-2xl`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Icon size={24} />
                </div>
                <ExternalLink size={20} className="opacity-60" />
              </div>
              <h3 className="text-xl font-bold mb-2">{action.label}</h3>
              <p className="text-white/80 text-sm mb-6">{action.description}</p>
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-slate-100"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </MotionCard>
          );
        })}
      </div>

      {/* ================= AI HEALTH WIDGET ================= */}
      {data?.latestCompletedOrder && (
        <MotionCard delay={0.4} className="border-0 p-0 bg-transparent">
          <LatestHealthWidget order={data.latestCompletedOrder} />
        </MotionCard>
      )}

      {/* ================= RECENT ACTIVITY (UPDATED) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MotionCard
          delay={0.5}
          className="lg:col-span-2 overflow-hidden flex flex-col border border-slate-200 rounded-2xl"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Activity</h3>
            <Link href="/dashboard/orders" className="text-sm text-blue-600 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.slice(0, 5).map(order => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block p-5 hover:bg-slate-50 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      {order.lab?.labName}
                    </div>
                    <div className="text-xs text-slate-500">
                      #{order.orderNumber} - {order.patientName}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-slate-800">
                        INR {order.finalAmount?.toLocaleString()}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
                        {order.status}
                      </span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </MotionCard>

                {/* ================= UPCOMING TESTS ================= */}
        <MotionCard delay={0.6} className="border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-600" />
            Upcoming Tests
          </h3>
          
          <div className="space-y-4">
            {recentOrders
              .filter((order: Order) => order.status === 'PENDING')
              .slice(0, 2)
              .map((order: Order) => (
                <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800">{order.patientName}</h4>
                      <p className="text-xs text-slate-500">{order.lab?.labName}</p>
                    </div>
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Scheduled
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock size={12} />
                    {order.preferredDate ? new Date(order.preferredDate).toLocaleDateString() : 'Date not set'}
                  </div>
                </div>
              ))}
            
            {recentOrders.filter((order: Order) => order.status === 'PENDING').length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No upcoming tests</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <Link
              href="/search"
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Activity size={16} />
              Book New Test
            </Link>
          </div>
        </MotionCard>
      </div>

      {/* ================= HEALTH TIPS ================= */}
      <MotionCard delay={0.7} className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3">Stay Healthy with Regular Checkups</h3>
            <p className="text-slate-300 text-sm mb-4">
              Regular health screenings can detect potential health issues early, 
              when they're easier to treat. Consider scheduling your next checkup.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="bg-white/10 px-3 py-1 rounded-full">Preventive Care</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Early Detection</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Peace of Mind</span>
            </div>
          </div>
          <Link
            href="/search?category=health-checkup"
            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
          >
            Explore Health Packages
          </Link>
        </div>
      </MotionCard>
      </div>
  );
}