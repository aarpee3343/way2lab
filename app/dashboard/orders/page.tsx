'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Download,
  Calendar,
  FlaskConical,
  IndianRupee,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '@/hooks/useDashboard';
import type { Order } from '@/lib/types/dashboard';

const statusFilters = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const formatDate = (dateValue: string | Date | null | undefined) => {
  if (!dateValue) return '-';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const monthLabel = (dateValue: string | Date) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ACCEPTED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
};

const TimelineStep = ({ label, done, isError }: { label: string; done: boolean; isError?: boolean }) => {
  return (
    <div className="flex flex-col items-center text-xs">
      {/* Icon Container */}
      <div className="flex items-center justify-center">
        {isError ? (
          // Soft Red Style using Lucide + Tailwind
          <div className="bg-red-50 p-1 rounded-full border border-red-100">
            <AlertCircle size={16} className="text-red-500" />
          </div>
        ) : done ? (
          <CheckCircle size={18} className="text-emerald-600" />
        ) : (
          <Clock size={18} className="text-slate-300" />
        )}
      </div>

      {/* Label */}
      <span 
        className={`mt-1.5 text-center font-medium transition-colors ${
          isError ? 'text-red-600' : done ? 'text-emerald-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    orders,
    loading,
    error,
    pagination,
    hasMore,
    loadMore,
    refresh
  } = useOrders({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    enabled: true
  });

  // Group orders by month
  const grouped: Record<string, Order[]> = {};
  orders.forEach(order => {
    const key = monthLabel(order.createdAt);
    grouped[key] = grouped[key] || [];
    grouped[key].push(order);
  });

  // Filter orders by search query
  const filteredGroups = Object.keys(grouped).reduce((acc, month) => {
    const filteredOrders = grouped[month].filter(order =>
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.lab?.labName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredOrders.length > 0) {
      acc[month] = filteredOrders;
    }
    return acc;
  }, {} as Record<string, Order[]>);

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-12 flex-1 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-12 w-40 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Orders Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="flex justify-between">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 bg-slate-200 rounded-full" />
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="h-11 flex-1 bg-slate-200 rounded-xl" />
                <div className="h-11 w-11 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Failed to load orders</h3>
        <p className="text-slate-600 text-center">{error}</p>
        <button
          onClick={refresh}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Orders</h1>
          <p className="text-slate-500 mt-1">
            {pagination.total > 0 
              ? `${pagination.total} orders found` 
              : 'No orders yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/search"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Book New Test
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by order number, patient name, or lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Filter size={20} />
            <span>Filter</span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10"
              >
                <div className="p-2">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setStatusFilter(filter.value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ACTIVE FILTER BADGE */}
      {statusFilter !== 'ALL' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Filtered by:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {statusFilters.find(f => f.value === statusFilter)?.label}
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* ORDERS GRID */}
      {Object.keys(filteredGroups).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(filteredGroups).map(month => (
            <div key={month} className="space-y-4">
              {/* MONTH HEADER */}
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                {month}
              </h2>

              {/* ORDERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups[month].map(order => {
                  const statusStyle = statusStyles[order.status] || { bg: 'bg-slate-100', text: 'text-slate-700' };

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* TOP SECTION */}
                      <div className="flex justify-between mb-4">
                        <div>
                          <p className="font-bold text-slate-800">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* LAB INFO */}
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <FlaskConical size={16} className="text-blue-500" />
                        <span className="font-medium">{order.lab?.labName || '-'}</span>
                      </div>

                      {/* PATIENT INFO */}
                      <div className="mb-4">
                        <p className="text-sm text-slate-800 font-medium">{order.patientName}</p>
                        <p className="text-xs text-slate-500">{order.patientRelation || 'Self'}</p>
                      </div>

                      {/* TIMELINE */}
                      <div className="flex items-center justify-between mb-4">
                        {/* First Icon: Show "Booked" unless Rejected, Cancelled, or Pending */}
                        <TimelineStep 
                          label={
                            !['REJECTED', 'CANCELLED', 'PENDING'].includes(order.status) 
                              ? "Booked" 
                              : order.status
                          } 
                          done={true} 
                        />

                        {/* Second Icon: Show actual status with green tick */}
                        <TimelineStep
                          label={order.status}
                          done={true}
                        />

                        {/* Third Icon: Show Reports icon green/tick only if COMPLETED */}
                        <TimelineStep
                          label="Report"
                          done={order.status === 'COMPLETED'}
                        />
                      </div>

                      {/* AMOUNT */}
                      <div className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                        <IndianRupee size={18} />
                        {order.finalAmount?.toLocaleString() || '0'}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={16} />
                          View Details
                        </Link>

                        {order.status === 'COMPLETED' && (
                          <a
                            href={`/api/order/${order.id}/receipt`}
                            target="_blank"
                            className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center">
          <FlaskConical size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No orders found</h3>
          <p className="text-slate-500">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No orders match your search criteria'
              : 'Once you book a test, it will appear here.'}
          </p>
          {searchQuery || statusFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/search"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Book Your First Test
            </Link>
          )}
        </div>
      )}

      {/* LOAD MORE */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Orders'}
          </button>
        </div>
      )}

      {/* PAGINATION INFO */}
      {pagination.total > 0 && (
        <div className="text-center text-sm text-slate-500">
          Showing {orders.length} of {pagination.total} orders
        </div>
      )}
    </div>
  );
}
