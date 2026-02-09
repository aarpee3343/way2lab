'use client';
import { useState, useEffect } from 'react';
import { getAdminTickets } from '@/app/actions/adminTicketActions';
import { getAdminContactRequests } from '@/app/actions/adminContactActions';
import { ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { formatISTDateTime } from '@/lib/date-time';

export default function AdminSupportCenter() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'corporate' | 'general'>('corporate');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminTickets(), getAdminContactRequests()]).then(([ticketData, requestData]) => {
      setTickets(ticketData || []);
      setContactRequests(requestData || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading Tickets...</div>;

  return (
    <div className="admin-space-y">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="admin-page-title text-3xl font-black">Support Inbox</h1>
          <p className="admin-page-subtitle">Corporate chats and general contact requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('corporate')}
          className={`admin-btn-secondary ${activeTab === 'corporate' ? 'bg-slate-900 text-white' : ''}`}
        >
          Corporate Chats
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`admin-btn-secondary ${activeTab === 'general' ? 'bg-slate-900 text-white' : ''}`}
        >
          General Requests
        </button>
      </div>

      <div className="admin-table-container">
        {activeTab === 'corporate' ? (
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
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No corporate tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
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
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {contactRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No contact requests found.
                  </td>
                </tr>
              ) : (
                contactRequests.map((req) => (
                  <tr key={req.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {String(req.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{req.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {req.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{req.subject || 'General enquiry'}</td>
                    <td className="px-6 py-4">
                      <span className="admin-status-indicator bg-slate-50 text-slate-600 border-slate-200">
                        {req.status || 'NEW'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatISTDateTime(req.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/support/general/${req.id}`}
                        className="admin-btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 ml-auto w-fit"
                      >
                        View Chat <ChevronRight size={14}/>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
