// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { adminLoginAction } from '@/app/actions/authActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await adminLoginAction(form.username, form.password);
    
    if (res.success) {
      toast.success("Welcome back, Admin");
      // ✅ FIX: Force hard reload to ensure cookies are recognized
      window.location.href = '/admin'; 
    } else {
      toast.error(res.error || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 text-sm">Secure access for WayToLab staff</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-space-y">
          <div>
            <label className="admin-form-label text-slate-400">Username</label>
            <input 
              type="text" 
              className="admin-form-input bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-400"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="admin-form-label text-slate-400">Password</label>
            <div className="relative">
              <input 
                type="password" 
                className="admin-form-input bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-400"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
              <Lock className="absolute right-4 top-3.5 text-slate-600" size={18} />
            </div>
          </div>

          <button 
            disabled={loading}
            className="admin-btn-primary w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}