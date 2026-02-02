'use client';
import { ShieldCheck, UserMinus, FileDown, LogIn, Clock, MessageSquare } from 'lucide-react'; 

export default function ActivityLogsPage() {
  const logs = [
    { id: 1, user: 'Sanya Iyer', action: 'DEACTIVATED_USER', details: 'Deactivated Amit Kumar (IT)', time: '2 mins ago', icon: UserMinus, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 2, user: 'Rahul Sharma', action: 'REPORT_DOWNLOAD', details: 'Downloaded Pre-Employment Batch #2', time: '45 mins ago', icon: FileDown, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, user: 'Sanya Iyer', action: 'LOGIN', details: 'Logged in from 192.168.1.1', time: '2 hours ago', icon: LogIn, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    // If you plan to use MessageSquare later, add an entry like this:
    // { id: 4, user: 'Support', action: 'TICKET_REPLY', details: 'Replied to ticket #123', time: '5 hours ago', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

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
          {logs.map((log) => (
            <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className={`${log.bg} ${log.color} p-3 rounded-2xl shrink-0`}>
                <log.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-black text-slate-800">{log.user}</p>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                    <Clock size={12}/> {log.time}
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
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">
            Load Older Activities
          </button>
        </div>
      </div>
    </div>
  );
}