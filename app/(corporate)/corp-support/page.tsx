'use client';
import { useState } from 'react';
import { Send, Plus, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react';

export default function CorporateSupportPage() {
  const [activeTicket, setActiveTicket] = useState(1);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6 max-w-[1600px] mx-auto">
      {/* Ticket List (Left) */}
      <div className="w-80 flex flex-col gap-4">
        <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
          <Plus size={18}/> New Support Ticket
        </button>

        <div className="flex-1 bg-white border border-slate-200 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400">Open Tickets</div>
          <div className="flex-1 overflow-y-auto">
            {[1, 2].map(i => (
              <div 
                key={i} 
                onClick={() => setActiveTicket(i)}
                className={`p-5 cursor-pointer border-b border-slate-50 transition-all ${activeTicket === i ? 'bg-blue-50/50 border-r-4 border-r-blue-600' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-black text-slate-800 truncate">New Package Request</h4>
                  <span className="text-[9px] font-bold text-slate-400">2h</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 italic">Need Master Health Checkup for Mumbai branch...</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area (Right) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[32px] flex flex-col shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">#</div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">Ticket: New Package Request</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Assigned to: Support Agent</p>
            </div>
          </div>
          <button className="text-[10px] font-black uppercase text-rose-500 border border-rose-200 px-3 py-1 rounded-lg hover:bg-rose-50 transition-all">
            Close Ticket
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex flex-col items-start max-w-[70%]">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none text-sm text-slate-700 font-medium">
              Hello Acme Admin, we have received your request. Our medical team is curating the Master Health Checkup list for you.
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-2 ml-1">Support Agent • 10:45 AM</span>
          </div>

          <div className="flex flex-col items-end max-w-[70%] ml-auto">
            <div className="bg-blue-600 p-4 rounded-2xl rounded-br-none text-sm text-white font-medium shadow-lg shadow-blue-100">
              Thanks! Please ensure Vit D and B12 are included. Also, can we get a discount for 50+ bookings?
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-2 mr-1">You • 10:50 AM</span>
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-100">
          <div className="flex gap-4 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
            <button className="p-2 text-slate-400 hover:text-blue-600"><Paperclip size={20}/></button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
            />
            <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}