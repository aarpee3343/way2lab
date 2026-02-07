'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Mail, Lock, KeyRound } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function CorporateForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/corp/password-reset', {
        action: 'SEND',
        email
      });
      if (res.data.success) {
        toast.success('OTP sent to your corporate email');
        setStep('RESET');
      } else {
        toast.error(res.data?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/corp/password-reset', {
        action: 'RESET',
        email,
        code: otp,
        newPassword
      });

      if (res.data.success) {
        toast.success('Password reset successful. Please login.');
        router.push('/corp-login');
      } else {
        toast.error(res.data?.message || 'Password reset failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT: Branding */}
      <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <Image
              src="/logo.png"
              alt="WayToLab Healthcare"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="text-2xl font-black tracking-tighter">
              WayToLab <span className="text-blue-500">Healthcare</span>
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Reset Corporate <br />
            <span className="text-blue-500">Access.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Securely regain access to your corporate portal using a verification code.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>Secure AES-256 Encryption</span>
          <span>HIPAA Compliant</span>
        </div>
      </div>

      {/* RIGHT: Reset Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="text-blue-600" size={24} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Reset Password
              </h2>
            </div>
            <p className="text-slate-500 mt-2 font-medium">
              Verify your corporate email to continue.
            </p>
          </div>

          <form onSubmit={step === 'REQUEST' ? handleSendOtp : handleReset} className="space-y-6">
            {step === 'REQUEST' && (
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">
                    Corporate Email
                  </label>
                  <div className="relative mt-1">
                    <Mail
                      className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500"
                      size={18}
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'RESET' && (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-blue-800">
                    Enter the OTP sent to {email}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This code is valid for 10 minutes.
                  </p>
                </div>

                <div className="group">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">
                    Email OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium tracking-[0.35em] text-center"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="group">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <Lock
                      className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500"
                      size={18}
                    />
                    <input
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <Lock
                      className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500"
                      size={18}
                    />
                    <input
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                  <button type="button" onClick={() => setStep('REQUEST')} className="hover:underline">
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/corp/password-reset', {
                          action: 'SEND',
                          email
                        });
                        if (res.data.success) toast.success('OTP resent');
                        else toast.error(res.data?.message || 'Failed to resend OTP');
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to resend OTP');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {step === 'REQUEST' ? 'Send OTP' : 'Reset Password'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2">
            <Link
              href="/corp-login"
              className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Back to Corporate Login
            </Link>
          </div>

          <div className="pt-6 flex items-center gap-3">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Secure Terminal
            </span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
