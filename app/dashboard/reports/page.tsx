// app/dashboard/reports/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Download, Eye, Calendar, 
  Search, AlertCircle, RefreshCw,
  Shield, CheckCircle2, FlaskConical,
  User, ChevronDown, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/safe-toast';
import axios from 'axios';

// ✅ Interface matches the specific API response
interface ReportItem {
  id: number;
  orderNumber: string;
  status: string; // 'COMPLETED' | 'PARTIAL_COMPLETED' etc.
  createdAt: string;
  patientName: string;
  patientGender: string;
  patientDob: string | null;
  patientRelation: string;
  patientUHID: string | null;
  lab: {
    labName: string;
    address: string;
  } | null;
  items: {
    itemName: string;
    itemType: string;
  }[];
  reports: {
    id: number;
    createdAt: string;
  }[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredReports(reports);
      return;
    }
    const lower = searchQuery.toLowerCase();
    const filtered = reports.filter(r => 
      r.orderNumber?.toLowerCase().includes(lower) ||
      r.patientName?.toLowerCase().includes(lower) ||
      r.lab?.labName?.toLowerCase().includes(lower) ||
      r.items.some(i => i.itemName.toLowerCase().includes(lower))
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/user/reports');
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number, orderNo: string) => {
    setDownloadingId(reportId);
    try {
      const response = await axios.get(`/api/reports/${reportId}`, {
        responseType: 'blob', // Important for files
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${orderNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getAge = (dob: string | null) => {
    if (!dob) return '';
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (31557600000));
    return `${age} Yrs`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            Access and download your digital lab reports securely.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search reports..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* GRID */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((order) => {
            
            // Logic for Status Badge
            const isPartial = order.status === 'PARTIAL_COMPLETED' || order.status === 'PARTIAL_REPORT';
            const isCompleted = order.status === 'COMPLETED';
            
            // Default to latest report for the main button
            const latestReportId = order.reports[0]?.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* CARD HEADER: Order # & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-lg">#{order.orderNumber}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                  </div>

                  {/* STATUS BADGE */}
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' :
                    isPartial ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={12} /> : <Loader2 size={12} className={!isCompleted ? "animate-spin-slow" : ""} />}
                    {isCompleted ? 'Completed' : 'Partial Report'}
                  </div>
                </div>

                {/* PATIENT INFO */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{order.patientName}</p>
                    <p className="text-xs text-slate-500">
                      {order.patientGender} • {getAge(order.patientDob)} • {order.patientRelation}
                    </p>
                  </div>
                </div>

                {/* LAB & TESTS */}
                <div className="flex-1 space-y-3 mb-6">
                   {/* Lab Name */}
                   <div className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <FlaskConical size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      {order.lab?.labName}
                   </div>

                   {/* Test List (Scrollable if many) */}
                   <div className="pl-6">
                      <ul className="list-disc text-xs text-slate-600 space-y-1 max-h-24 overflow-y-auto pr-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="line-clamp-1">{item.itemName}</li>
                        ))}
                      </ul>
                   </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  {latestReportId ? (
                    <button
                      onClick={() => handleDownload(latestReportId, order.orderNumber)}
                      disabled={downloadingId === latestReportId}
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {downloadingId === latestReportId ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      {downloadingId === latestReportId ? 'Downloading...' : 'Download Report'}
                    </button>
                  ) : (
                    <div className="w-full h-11 bg-slate-100 text-slate-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      <AlertCircle size={16} /> Processing
                    </div>
                  )}

                  <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Shield size={10} /> End-to-end Encrypted
                  </p>
                </div>

              </motion.div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <FileText size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">No reports found</h3>
          <p className="text-slate-500 text-sm">Once your tests are completed, reports will appear here.</p>
        </div>
      )}
    </div>
  );
}