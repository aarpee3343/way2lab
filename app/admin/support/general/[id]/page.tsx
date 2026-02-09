'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, User, Clock } from 'lucide-react';
import { getAdminContactRequest } from '@/app/actions/adminContactActions';
import { formatISTDateTime } from '@/lib/date-time';

export default function GeneralRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const requestId = Number(id);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminContactRequest(requestId).then((data) => {
      setRequest(data);
      setLoading(false);
    });
  }, [requestId]);

  if (loading) {
    return <div className="p-10 text-center text-slate-400 animate-pulse">Loading request...</div>;
  }

  if (!request) {
    return (
      <div className="p-10 text-center text-slate-500">
        Request not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-150px)] flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/support" className="p-2 bg-white border rounded-xl hover:bg-slate-50">
          <ArrowLeft size={20}/>
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">General Contact Request</h2>
          <p className="text-xs text-slate-500">{request.subject || 'General enquiry'}</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User size={16} className="text-slate-400" /> {request.name || 'Unknown'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail size={16} className="text-slate-400" /> {request.email || 'No email'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={16} className="text-slate-400" /> {formatISTDateTime(request.createdAt)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm">
              {request.message}
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2 px-1 uppercase tracking-widest">
              {request.name || 'Visitor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
