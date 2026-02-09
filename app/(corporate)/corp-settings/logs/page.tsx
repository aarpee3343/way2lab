'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getCorporateActivities } from '@/app/actions/corporatePortalActions';
import { formatISTDateTime } from '@/lib/date-time';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await getCorporateActivities();
      setLogs(res || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Security Audit Logs</h1>
          <p className="text-sm text-slate-500">History of all administrative actions performed on this portal.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="p-5 text-slate-400 text-sm">Loading activity...</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="p-5 text-slate-400 text-sm">No activity yet.</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-black text-slate-800">{log.performedBy}</p>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                    <Clock size={12}/> {formatISTDateTime(log.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                <span className="inline-block mt-2 text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                  {log.action.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

