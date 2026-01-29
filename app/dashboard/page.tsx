'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  ClipboardList,
  Clock,
  Home,
  Users,
  ArrowRight,
  Activity,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { MotionCard } from '@/components/ui/MotionCard';
import LatestHealthWidget from '@/components/dashboard/LatestHealthWidget';

/* ===================== SKELETON ===================== */

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="h-8 w-48 bg-slate-200 rounded-lg" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 rounded-2xl" />
  </div>
);

/* ===================== PAGE ===================== */

export default function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get('token');

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/user/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = [
    {
      label: 'Total Orders',
      value: data?.stats.totalOrders,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Pending',
      value: data?.stats.pendingOrders,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100'
    },
    {
      label: 'Home Visits',
      value: data?.stats.homeCollection,
      icon: Home,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      label: 'Family',
      value: data?.stats.familyMembers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    }
  ];

  return (
    <div>
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Here is what&apos;s happening with your health.
          </p>
        </div>
        <div className="hidden md:block">
          <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <Activity size={14} /> System Operational
          </span>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <MotionCard
            key={idx}
            delay={idx * 0.1}
            className={`p-5 border ${stat.border}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              {idx === 0 && (
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                  +2 this month
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {stat.value}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </MotionCard>
        ))}
      </div>

      {/* ================= AI HEALTH WIDGET ================= */}

      <LatestHealthWidget order={data?.latestCompletedOrder} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* ================= RECENT ORDERS ================= */}
        <MotionCard
          delay={0.4}
          className="lg:col-span-2 overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Recent Activity
            </h3>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {data?.recentOrders?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <ClipboardList size={48} className="mb-3 opacity-20" />
                <p>No recent activity found.</p>
              </div>
            ) : (
              data?.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                      {order.labName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {order.labName}
                      </div>
                      <div className="text-xs text-slate-500">
                        #{order.orderNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">
                      ₹{order.finalAmount}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        order.status === 'COMPLETED'
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </MotionCard>

        {/* ================= ACTIONS ================= */}
        <div className="space-y-6">
          <MotionCard
            delay={0.5}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none p-6"
          >
            <h3 className="font-bold text-xl mb-2">Book a Test</h3>
            <p className="text-blue-100 text-sm mb-6">
              Choose from 500+ tests. Home collection or center visit.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition"
            >
              Book Now <ArrowRight size={16} />
            </Link>
          </MotionCard>

          <MotionCard className="p-6 border-dashed border-2 border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 mb-2">Need Help?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Our support team is available 24/7.
            </p>
            <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold">
              Contact Support
            </button>
          </MotionCard>
        </div>
      </div>
    </div>
  );
}
