'use client';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getTicketMessages, adminReplyToTicket, uploadAdminTicketAttachment } from '@/app/actions/adminTicketActions';
import { Send, ArrowLeft, Paperclip } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { formatISTTime } from '@/lib/date-time';

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

export default function TicketDetailAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ticketId = parseInt(id);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    return getTicketMessages(ticketId).then(setMessages);
  }, [ticketId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await uploadAdminTicketAttachment(ticketId, formData, 'System Admin');
      setUploading(false);

      if (uploadRes.success) {
        toast.success('Attachment uploaded');
        setSelectedFile(null);
        refresh();
      } else {
        toast.error(uploadRes.error || 'Attachment upload failed');
        return;
      }
    }

    if (input.trim()) {
      const res = await adminReplyToTicket(ticketId, input, "System Admin");
      if (res.success) {
        setInput('');
        refresh();
        toast.success("Reply sent");
      }
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
          {messages.map((msg) => {
            const attachment = parseAttachment(msg.message);
            const isAdmin = msg.senderType === 'ADMIN';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] p-4 rounded-2xl font-medium text-sm ${
                  isAdmin
                    ? 'bg-slate-900 text-white rounded-br-none shadow-lg'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {attachment ? (
                    <div className="space-y-2">
                      <div className="text-sm font-black break-all">{attachment.name}</div>
                      <div className={`text-[10px] ${isAdmin ? 'text-slate-300' : 'text-slate-500'}`}>
                        {formatBytes(attachment.size)} - {attachment.mime}
                      </div>
                      <a
                        className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-white' : 'text-blue-600'}`}
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
                <span className="text-[9px] font-black text-slate-400 mt-2 px-1 uppercase tracking-widest">
                  {msg.senderName} - {formatISTTime(msg.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-3">
          <div className="flex gap-4">
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
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900"
              disabled={uploading}
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response to the corporate admin..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button 
              onClick={handleSend}
              className="bg-slate-900 text-white px-8 rounded-2xl font-black hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-60"
              disabled={uploading || (!input.trim() && !selectedFile)}
            >
              Send Reply <Send size={18} />
            </button>
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
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
