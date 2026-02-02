'use client';
import { useState, useEffect, use } from 'react';
import { getTicketMessages, adminReplyToTicket } from '@/app/actions/adminTicketActions';
import { Send, ArrowLeft, Building2, User, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function TicketDetailAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ticketId = parseInt(id);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const refresh = () => getTicketMessages(ticketId).then(setMessages);

  useEffect(() => { refresh(); }, [ticketId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const res = await adminReplyToTicket(ticketId, input, "System Admin");
    if (res.success) {
      setInput('');
      refresh();
      toast.success("Reply sent");
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-150px)] flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/support" className="p-2 bg-white border rounded-xl hover:bg-slate-50"><ArrowLeft size={20}/></Link>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Conversation Detail</h2>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderType === 'ADMIN' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl font-medium text-sm ${
                msg.senderType === 'ADMIN' 
                  ? 'bg-slate-900 text-white rounded-br-none shadow-lg' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {msg.message}
              </div>
              <span className="text-[9px] font-black text-slate-400 mt-2 px-1 uppercase tracking-widest">
                {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your response to the corporate admin..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button 
            onClick={handleSend}
            className="bg-slate-900 text-white px-8 rounded-2xl font-black hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            Send Reply <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}