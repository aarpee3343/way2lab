'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { ShieldCheck, Loader2, ArrowLeft, Mail, Phone, Lock } from 'lucide-react';
import Link from 'next/link';

const ADMIN_OTP_PHONE = '+919457590000';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    otp: ''
  });

  const handleSendOtp = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/admin/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to send OTP');
        return;
      }
      toast.success('OTP sent to the registered admin number');
      setOtpSent(true);
    } catch (error) {
      toast.error('Unable to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      toast.error('Send OTP before registering');
      return;
    }

    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (!form.otp || form.otp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          otp: form.otp
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Registration failed');
        return;
      }

      toast.success('Admin account created');
      router.push('/admin');
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/login" className="flex items-center gap-2 text-xs text-slate-300 hover:text-white">
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck size={14} />
            Super Admin Setup
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Admin</h1>
          <p className="text-slate-400 text-sm">
            OTP verification is required.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleSendOtp}
            disabled={sending}
            className="admin-btn-primary w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" /> : <Phone size={16} />}
            {otpSent ? 'Resend OTP' : 'Send OTP'}
          </button>
        </div>

        <form onSubmit={handleRegister} className="admin-space-y">
          <div>
            <label className="admin-form-label text-slate-400">Full Name</label>
            <input
              type="text"
              className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Admin Name"
            />
          </div>

          <div>
            <label className="admin-form-label text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400 pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@company.com"
              />
              <Mail className="absolute left-3 top-3.5 text-slate-600" size={16} />
            </div>
          </div>

          <div>
            <label className="admin-form-label text-slate-400">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400 pl-10"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
              <Phone className="absolute left-3 top-3.5 text-slate-600" size={16} />
            </div>
          </div>

          <div>
            <label className="admin-form-label text-slate-400">Password</label>
            <div className="relative">
              <input
                type="password"
                className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400 pl-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
              <Lock className="absolute left-3 top-3.5 text-slate-600" size={16} />
            </div>
          </div>

          <div>
            <label className="admin-form-label text-slate-400">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400 pl-10"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Repeat password"
              />
              <Lock className="absolute left-3 top-3.5 text-slate-600" size={16} />
            </div>
          </div>

          <div>
            <label className="admin-form-label text-slate-400">OTP Code</label>
            <input
              type="text"
              maxLength={6}
              className="admin-form-input bg-slate-900/50 border border-slate-700 !text-slate-100 placeholder:text-slate-400"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              placeholder="6-digit OTP"
            />
          </div>

          <button
            type="submit"
            disabled={registering}
            className="admin-btn-primary w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
          >
            {registering ? <Loader2 className="animate-spin" /> : 'Create Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
