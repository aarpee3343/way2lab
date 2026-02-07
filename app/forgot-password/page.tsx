'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Phone, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/password-reset', {
        action: 'SEND',
        phone
      });
      if (res.data.success) {
        toast.success('OTP sent to your mobile');
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
      const res = await axios.post('/api/auth/password-reset', {
        action: 'RESET',
        phone,
        code: otp,
        newPassword
      });

      if (res.data.success) {
        toast.success('Password reset successful. Please login.');
        router.push('/login');
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
    <div className="flex min-h-screen w-full bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10 overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 text-white space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="WayToLab" width={200} height={56} className="h-14 w-auto" priority />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">WayToLab</h1>
              <p className="text-xs text-teal-200 font-medium">Diagnostic Healthcare</p>
            </div>
          </div>

          <h2 className="text-4xl font-black leading-tight">
            Reset Your <br />
            <span className="text-teal-200">Secure Access.</span>
          </h2>
          <p className="text-lg text-teal-100">
            Verify your mobile number to safely reset your password.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-teal-200/20 border border-teal-100">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={24} className="text-teal-600" />
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
            </div>
            <p className="text-slate-500 text-sm">
              Enter your registered mobile number to receive an OTP.
            </p>
          </div>

          <form
            onSubmit={step === 'REQUEST' ? handleSendOtp : handleReset}
            className="space-y-5"
          >
            {step === 'REQUEST' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                    <Phone size={20} />
                  </div>
                </div>
              </div>
            )}

            {step === 'RESET' && (
              <>
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-teal-800">
                    Enter the OTP sent to +91 {phone}
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    This code is valid for 10 minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="XXXXXX"
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 outline-none text-center tracking-[0.5em] font-bold text-xl"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-teal-700">
                  <button type="button" onClick={() => setStep('REQUEST')} className="hover:underline">
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/auth/password-reset', {
                          action: 'SEND',
                          phone
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
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {step === 'REQUEST' ? 'Send OTP' : 'Reset Password'}
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
            >
              Back to Login
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-teal-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-teal-600" />
                <span>Secure & Encrypted</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-teal-200"></div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-teal-600" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
