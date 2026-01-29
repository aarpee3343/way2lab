'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FileText, Download, Eye, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const token = Cookies.get('token');
      try {
        // Fetch COMPLETED orders (which imply reports exist)
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Diagnostic Reports</h1>
        <p className="text-gray-500">View and download your digital test reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report: any) => (
          <div key={report.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="bg-green-50 p-2.5 rounded-lg text-green-600 h-fit">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Order #{report.orderNumber}</h4>
                  <p className="text-sm text-gray-500">{report.lab.labName}</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Ready</span>
            </div>

            <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              <Calendar size={14} /> 
              {new Date(report.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>

            <div className="flex gap-2">
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL}/orders/${report.id}/receipt?token=${Cookies.get('token')}`} 
                target="_blank" 
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                <Eye size={16} /> Receipt
              </a>
              
              {/* Note: This button assumes you have a report download endpoint. 
                  If not, we can point it to a placeholder or the receipt for now. */}
              <button disabled className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <Download size={16} /> Report (Soon)
              </button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <FileText size={48} className="mx-auto mb-3 text-gray-200" />
          <h3 className="text-lg font-bold text-gray-400">No Reports Available</h3>
          <p className="text-gray-400 text-sm">Reports appear here once the lab completes your order.</p>
        </div>
      )}
    </div>
  );
}