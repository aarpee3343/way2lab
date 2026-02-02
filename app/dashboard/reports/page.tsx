'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Download, Eye, Calendar, 
  Filter, Search, AlertCircle, RefreshCw,
  Shield, Clock, CheckCircle2,
  ChevronDown, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/safe-toast';
import type { Order, OrderReport } from '@/lib/types/dashboard';

interface ReportWithOrder extends OrderReport {
  order?: Order;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithOrder[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, dateFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // This would be your actual API call
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.order?.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.order?.lab?.labName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(report => report.order?.status === statusFilter);
    }

    // Date filter (simplified for example)
    if (dateFilter === 'LAST_WEEK') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filtered = filtered.filter(report => 
        new Date(report.createdAt) > lastWeek
      );
    } else if (dateFilter === 'LAST_MONTH') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      filtered = filtered.filter(report => 
        new Date(report.createdAt) > lastMonth
      );
    }

    setFilteredReports(filtered);
  };

  const downloadReport = async (reportId: number) => {
    try {
      toast.info('Preparing your report for download...');
      // Your download logic here
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const viewReport = (reportId: number) => {
    // Your view report logic here
    window.open(`/api/reports/${reportId}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
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

        {/* Reports Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-100 rounded-xl" />
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

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Diagnostic Reports</h1>
          <p className="text-slate-500 mt-1">
            {filteredReports.length > 0 
              ? `${filteredReports.length} reports available` 
              : 'No reports found'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export All
          </button>
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
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-10"
              >
                <div className="p-4 space-y-4">
                  {/* Status Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Report Status</h4>
                    <div className="space-y-2">
                      {['ALL', 'COMPLETED', 'PARTIAL_COMPLETED'].map(status => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            statusFilter === status
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'COMPLETED' ? 'bg-emerald-500' :
                            status === 'PARTIAL_COMPLETED' ? 'bg-amber-500' :
                            'bg-slate-300'
                          }`} />
                          {status === 'ALL' ? 'All Status' : status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Date Range</h4>
                    <div className="space-y-2">
                      {['ALL', 'LAST_WEEK', 'LAST_MONTH'].map(date => (
                        <button
                          key={date}
                          onClick={() => {
                            setDateFilter(date);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            dateFilter === date
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {date === 'ALL' ? 'All Time' : 
                           date === 'LAST_WEEK' ? 'Last 7 Days' : 'Last 30 Days'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ACTIVE FILTERS */}
      {(statusFilter !== 'ALL' || dateFilter !== 'ALL' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600">Active filters:</span>
          {statusFilter !== 'ALL' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {statusFilter.replace('_', ' ')}
            </span>
          )}
          {dateFilter !== 'ALL' && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              {dateFilter === 'LAST_WEEK' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          )}
          {searchQuery && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              Search: "{searchQuery}"
            </span>
          )}
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setDateFilter('ALL');
              setSearchQuery('');
            }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* REPORTS GRID */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* REPORT HEADER */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3">
                  <div className={`p-3 rounded-xl ${
                    report.order?.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}>
                    <FileText size={24} className={
                      report.order?.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'
                    } />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Order #{report.order?.orderNumber}</h4>
                    <p className="text-sm text-slate-500">{report.order?.lab?.labName}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  report.order?.status === 'COMPLETED' 
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {report.order?.status || 'PENDING'}
                </span>
              </div>

              {/* REPORT INFO */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} />
                  {formatDate(report.createdAt)}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Shield size={14} />
                  <span className="font-medium">Secure & Encrypted</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Patient</span>
                    <span className="text-xs text-slate-500">{report.order?.patientRelation || 'Self'}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{report.order?.patientName}</p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3">
                <button
                  onClick={() => viewReport(report.id)}
                  className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Eye size={16} />
                  View Report
                </button>

                <button
                  onClick={() => downloadReport(report.id)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors group-hover:border-blue-300"
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8 text-center">
          <div className="relative">
            <FileText size={80} className="text-slate-200" />
            <AlertCircle className="absolute -top-2 -right-2 text-amber-500" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No reports found</h3>
            <p className="text-slate-500 max-w-md">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No reports match your search criteria. Try adjusting your filters.'
                : 'Your diagnostic reports will appear here once they are ready.'}
            </p>
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setDateFilter('ALL');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* HEALTH INSIGHTS BANNER */}
      {filteredReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold">AI Health Insights Available</h3>
              </div>
              <p className="text-slate-300 text-sm mb-4 max-w-2xl">
                View AI-powered analysis of your reports, including personalized diet plans, 
                lifestyle recommendations, and health score tracking.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="bg-white/10 px-3 py-1 rounded-full">Personalized Diet</span>
                <span className="bg-white/10 px-3 py-1 rounded-full">Health Score</span>
                <span className="bg-white/10 px-3 py-1 rounded-full">Lifestyle Tips</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2">
              Explore AI Insights
              <ExternalLink size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}