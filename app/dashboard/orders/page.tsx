'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import {
  Eye,
  Download,
  Calendar,
  FlaskConical,
  IndianRupee,
  CheckCircle,
  Clock
} from 'lucide-react';

/* ---------------- HELPERS ---------------- */

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const monthLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700'
};

/* ---------------- PAGE ---------------- */

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = Cookies.get('token');
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/orders?limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const sorted = (res.data.data || []).sort(
          (a: any, b: any) =>
            +new Date(b.createdAt) - +new Date(a.createdAt)
        );

        setOrders(sorted);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        Loading orders…
      </div>
    );
  }

   if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <FlaskConical size={48} className="mb-4 text-indigo-300" />
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm text-slate-400 mt-1">
          Once you book a test, it will appear here.
        </p>
      </div>
    );
  }

  /* -------- GROUP BY MONTH -------- */

  const grouped: Record<string, any[]> = {};
  orders.forEach(order => {
    const key = monthLabel(order.createdAt);
    grouped[key] = grouped[key] || [];
    grouped[key].push(order);
  });

  return (
    <div className="space-y-8">

      <h1 className="text-xl md:text-2xl font-extrabold text-slate-800">
        My Orders
      </h1>

      {Object.keys(grouped).map(month => (
        <div key={month} className="space-y-4">

          {/* MONTH HEADER */}
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            {month}
          </h2>

          {/* ORDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grouped[month].map(order => {
              const labName =
                order.labName || order.lab?.labName || '—';

              const hasReport = order.reports?.length > 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-slate-100"
                >
                  {/* TOP */}
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="font-extrabold text-slate-800">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        statusStyles[order.status] || 'bg-slate-100'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* LAB */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <FlaskConical size={16} className="text-indigo-500" />
                    <span className="font-medium">{labName}</span>
                  </div>

                  {/* TIMELINE */}
                  <div className="flex items-center justify-between mb-4">
                    <TimelineStep label="Booked" done />
                    <TimelineStep
                      label="Collected"
                      done={order.status !== 'PENDING'}
                    />
                    <TimelineStep
                      label="Report"
                      done={hasReport}
                    />
                  </div>

                  {/* AMOUNT */}
                  <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900 mb-4">
                    <IndianRupee size={18} />
                    {order.finalAmount}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
                    >
                      <Eye size={16} />
                      View
                    </Link>

                    {order.status === 'COMPLETED' && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/order/${order.id}/receipt?token=${Cookies.get(
                          'token'
                        )}`}
                        target="_blank"
                        className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50"
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

const TimelineStep = ({ label, done }: { label: string; done: boolean }) => (
  <div className="flex flex-col items-center text-xs">
    {done ? (
      <CheckCircle size={18} className="text-green-600" />
    ) : (
      <Clock size={18} className="text-slate-300" />
    )}
    <span className={`mt-1 ${done ? 'text-green-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);
