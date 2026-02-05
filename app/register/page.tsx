'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from '@/lib/safe-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Loader2, ArrowRight, UserPlus, Mail, Phone, Lock, 
  Calendar, Users, ShieldCheck, CheckCircle2, HeartPulse, Stethoscope 
} from 'lucide-react';

// 1️⃣ Create the Inner Component that uses searchParams
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Capture redirect URL
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'FORM' | 'PHONE_OTP' | 'EMAIL_OTP'>('FORM');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'Male',
    dob: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const otpRes = await axios.post('/api/auth/otp', { action: 'SEND', phone: form.phone });
      if (otpRes.data.success) {
        toast.success(`OTP sent to ${form.phone}`);
        setStep('PHONE_OTP');
      } else {
        toast.error(otpRes.data?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (emailOtpValue?: string) => {
    const res = await axios.post('/api/auth/register', {
      ...form,
      phoneOtp,
      emailOtp: emailOtpValue
    });

    if (res.data.success) {
      await axios.post('/api/auth/login', {
        identifier: form.email,
        password: form.password,
        isOtpLogin: false
      });

      toast.success("Account created successfully!");
      window.location.href = redirectUrl;
      return;
    }

    throw new Error(res.data?.message || 'Registration failed');
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const verifyRes = await axios.post('/api/auth/otp', {
        action: 'VERIFY',
        phone: form.phone,
        code: phoneOtp
      });

      if (!verifyRes.data.success) {
        toast.error(verifyRes.data?.message || 'Invalid OTP');
        return;
      }

      const emailOtpRes = await axios.post('/api/auth/email-otp', {
        action: 'SEND',
        email: form.email
      });

      if (emailOtpRes.data?.requiresVerification) {
        toast.success('Email verification code sent');
        setStep('EMAIL_OTP');
      } else {
        await completeRegistration();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const verifyRes = await axios.post('/api/auth/email-otp', {
        action: 'VERIFY',
        email: form.email,
        code: emailOtp
      });

      if (!verifyRes.data.success) {
        toast.error(verifyRes.data?.message || 'Invalid email OTP');
        return;
      }

      await completeRegistration(emailOtp);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10 overflow-hidden">
      
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="relative z-10 text-white space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
               <HeartPulse size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">WayToLab</h1>
              <p className="text-xs text-teal-200 font-medium">Join 10,000+ Healthy Families</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-black leading-tight">
            Start Your Health <br/>
            <span className="text-teal-200">Journey Today.</span>
          </h2>
          <p className="text-lg text-teal-100">Create an account to track reports, manage family health, and get exclusive discounts on diagnostics.</p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <ShieldCheck className="text-emerald-300" size={20} />
              <div>
                <p className="font-semibold">Secure Health Data</p>
                <p className="text-sm text-teal-200">Encrypted records & reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <Stethoscope className="text-blue-300" size={20} />
              <div>
                <p className="font-semibold">Smart Reports</p>
                <p className="text-sm text-teal-200">AI-powered health insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-teal-200/20 border border-teal-100 my-auto"
        >
          
          <div className="mb-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            </div>
            <p className="text-slate-500 text-sm">Fill in your details to get started</p>
          </div>

          <form
            onSubmit={
              step === 'FORM'
                ? handleRegister
                : step === 'PHONE_OTP'
                  ? handleVerifyPhoneOtp
                  : handleVerifyEmailOtp
            }
            className="space-y-5"
          >
            {step === 'FORM' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <input
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                    <Users size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500/60" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Phone</label>
                    <div className="relative">
                      <input
                        required
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                      />
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500/60" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email</label>
                    <div className="relative">
                      <input
                        required
                        type="email"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                        placeholder="john@mail.com"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                      />
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500/60" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date of Birth</label>
                    <div className="relative">
                      <input
                        required
                        type="date"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium text-slate-600"
                        value={form.dob}
                        onChange={e => setForm({...form, dob: e.target.value})}
                      />
                      <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500/60" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Gender</label>
                    <div className="relative">
                      <select
                        className="w-full pl-3 pr-8 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium text-slate-600 bg-white appearance-none"
                        value={form.gender}
                        onChange={e => setForm({...form, gender: e.target.value})}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-teal-500/60">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                      placeholder="********"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                    />
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500/60" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70 mt-6"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'PHONE_OTP' && (
              <>
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-teal-800">
                    Enter the OTP sent to {form.phone}
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    This is required to verify your mobile number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Mobile OTP</label>
                  <input
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium tracking-[0.3em] text-center"
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={e => setPhoneOtp(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Mobile OTP'}
                </button>

                <div className="flex items-center justify-between text-xs font-bold text-teal-700">
                  <button
                    type="button"
                    onClick={() => setStep('FORM')}
                    className="hover:underline"
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/auth/otp', { action: 'SEND', phone: form.phone });
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

            {step === 'EMAIL_OTP' && (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-blue-800">
                    Enter the verification code sent to {form.email}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This is needed to activate corporate access.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email OTP</label>
                  <input
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium tracking-[0.3em] text-center"
                    placeholder="123456"
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email OTP'}
                </button>

                <div className="flex items-center justify-between text-xs font-bold text-teal-700">
                  <button
                    type="button"
                    onClick={() => setStep('FORM')}
                    className="hover:underline"
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/auth/email-otp', { action: 'SEND', email: form.email });
                        if (res.data?.requiresVerification) toast.success('Email OTP resent');
                        else toast.error('Email verification not required');
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to resend email OTP');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="hover:underline"
                  >
                    Resend Email OTP
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-teal-100 text-center">
            <p className="text-sm text-slate-500">Already have an account?</p>
            <Link 
              href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} 
              className="inline-flex items-center gap-1 text-teal-700 font-bold hover:text-teal-800 transition-colors mt-1"
            >
              Log in here <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 flex justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><ShieldCheck size={12}/> Secure</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Encrypted</span>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

// 2️⃣ Wrap with Suspense for Build Safety
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
