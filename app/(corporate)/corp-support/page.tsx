'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Plus, Paperclip } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import {
  getCorporateTickets,
  getCorporateTicketMessages,
  createCorporateTicket,
  replyCorporateTicket,
  closeCorporateTicket,
  uploadCorporateTicketAttachment
} from '@/app/actions/corporatePortalActions';

const ATTACHMENT_PREFIX = '__ATTACHMENT__::';

type AttachmentPayload = {
  name: string;
  mime: string;
  size: number;
  path: string;
  iv: string;
  tag: string;
};

const parseAttachment = (message: string): AttachmentPayload | null => {
  if (!message.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(message.slice(ATTACHMENT_PREFIX.length));
  } catch {
    return null;
  }
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function CorporateSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const list = await getCorporateTickets();
    setTickets(list || []);
    if (!activeTicketId && list && list.length > 0) {
      setActiveTicketId(list[0].id);
    }
    setLoading(false);
  }, [activeTicketId]);

  const loadMessages = useCallback(async (ticketId: number) => {
    const msgs = await getCorporateTicketMessages(ticketId);
    setMessages(msgs || []);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (activeTicketId) {
      loadMessages(activeTicketId);
    }
    setSelectedFile(null);
  }, [activeTicketId, loadMessages]);

  const handleSend = async () => {
    if (!activeTicketId) return;
    if (!input.trim() && !selectedFile) return;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await uploadCorporateTicketAttachment(activeTicketId, formData);
      setUploading(false);

      if (uploadRes.success) {
        toast.success('Attachment uploaded');
        setSelectedFile(null);
        loadMessages(activeTicketId);
        loadTickets();
      } else {
        toast.error(uploadRes.error || 'Attachment upload failed');
        return;
      }
    }

    if (input.trim()) {
      const res = await replyCorporateTicket(activeTicketId, input.trim());
      if (res.success) {
        setInput('');
        loadMessages(activeTicketId);
        loadTickets();
      } else {
        toast.error(res.error || 'Failed to send message');
      }
    }
  };

  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('Enter subject and message');
      return;
    }
    const res = await createCorporateTicket(newSubject.trim(), newMessage.trim());
    if (res.success) {
      toast.success('Ticket created');
      setShowCreate(false);
      setNewSubject('');
      setNewMessage('');
      setActiveTicketId(res.ticketId);
      loadTickets();
      if (res.ticketId) loadMessages(res.ticketId);
    } else {
      toast.error(res.error || 'Failed to create ticket');
    }
  };

  const handleClose = async () => {
    if (!activeTicketId) return;
    const res = await closeCorporateTicket(activeTicketId);
    if (res.success) {
      toast.success('Ticket closed');
      loadTickets();
    } else {
      toast.error(res.error || 'Failed to close ticket');
    }
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6 max-w-[1600px] mx-auto">
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">New Support Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3"
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-32"
              placeholder="Describe your issue"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              onClick={handleCreate}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-2xl font-black"
            >
              Create Ticket
            </button>
          </div>
        </div>
      )}

      {/* Ticket List (Left) */}
      <div className="w-80 flex flex-col gap-4">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus size={18}/> New Support Ticket
        </button>

        <div className="flex-1 bg-white border border-slate-200 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400">Open Tickets</div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-5 text-slate-400 text-xs">Loading tickets...</div>
            )}
            {!loading && tickets.length === 0 && (
              <div className="p-5 text-slate-400 text-xs">No tickets yet.</div>
            )}
            {tickets.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`p-5 cursor-pointer border-b border-slate-50 transition-all ${activeTicketId === t.id ? 'bg-blue-50/50 border-r-4 border-r-blue-600' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-black text-slate-800 truncate">{t.subject}</h4>
                  <span className="text-[9px] font-bold text-slate-400">{t.status}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 italic">Priority: {t.priority}</p>
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
              <h3 className="font-black text-slate-800 text-sm">Ticket: {activeTicket?.subject || 'Select a ticket'}</h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Status: {activeTicket?.status || '-'}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[10px] font-black uppercase text-rose-500 border border-rose-200 px-3 py-1 rounded-lg hover:bg-rose-50 transition-all"
          >
            Close Ticket
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-xs text-slate-400">No messages yet.</div>
          )}
          {messages.map((msg) => {
            const attachment = parseAttachment(msg.message);
            const isCorp = msg.senderType === 'CORPORATE';
            return (
              <div key={msg.id} className={`flex flex-col ${isCorp ? 'items-end' : 'items-start'} max-w-[70%] ${isCorp ? 'ml-auto' : ''}`}>
                <div className={`${isCorp ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'} p-4 rounded-2xl text-sm font-medium shadow-sm`}>
                  {attachment ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Paperclip size={14} />
                        <span className="text-sm font-black break-all">{attachment.name}</span>
                      </div>
                      <div className={`text-[10px] ${isCorp ? 'text-blue-100' : 'text-slate-500'}`}>
                        {formatBytes(attachment.size)} - {attachment.mime}
                      </div>
                      <a
                        className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isCorp ? 'text-white' : 'text-blue-600'}`}
                        href={`/api/support/attachments/${msg.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    msg.message
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-widest">
                  {msg.senderName} - {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-100">
          <div className="flex gap-4 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) setSelectedFile(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-blue-600"
              disabled={uploading}
            >
              <Paperclip size={20}/>
            </button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
              disabled={uploading || (!input.trim() && !selectedFile)}
            >
              <Send size={18} />
            </button>
          </div>
          {selectedFile && (
            <div className="mt-3 flex items-center justify-between text-xs bg-white border border-slate-200 rounded-xl px-3 py-2">
              <span className="font-bold text-slate-700 truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

