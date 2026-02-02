'use client';
import { useState, useEffect } from 'react';
import { getAdminTickets } from '@/app/actions/adminTicketActions';
import { MessageSquare, Clock, Building2, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminSupportCenter() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminTickets().then(data => {
      setTickets(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading Tickets...</div>;

  return (
    <div className="admin-space-y">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="admin-page-title text-3xl font-black">Corporate Support</h1>
          <p className="admin-page-subtitle">Manage queries and requests from corporate partners</p>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Corporate</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Messages</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {t.corporate.companyName.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800">{t.corporate.companyName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">{t.subject}</td>
                <td className="px-6 py-4">
                  <span className={`admin-status-indicator ${
                    t.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs font-bold">
                  {t._count.messages} messages
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/support/${t.id}`} className="admin-btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 ml-auto w-fit">
                    View Chat <ChevronRight size={14}/>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}