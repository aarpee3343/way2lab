'use client';

import { useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Phone, Mail, HeartPulse, Stethoscope, Users } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // State
  const [step, setStep] = useState<'INPUT' | 'PASSWORD' | 'OTP' | 'REGISTER'>('INPUT');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration State (For Auto-Register Flow)
  const [regData, setRegData] = useState({ name: '', email: '', dob: '', gender: 'Male' });

  // 1. Handle Initial Input (Email or Phone?)
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEmail = identifier.includes('@');
    const isPhone = /^[0-9]{10}$/.test(identifier);

    if (!isEmail && !isPhone) {
      toast.error("Please enter a valid Email or 10-digit Phone");
      setLoading(false);
      return;
    }

    if (isEmail) {
      // If Email -> Go to Password
      setStep('PASSWORD');
      setLoading(false);
    } else {
      // If Phone -> Send OTP and Check User Existence
      try {
        const res = await axios.post('/api/auth/otp', { action: 'SEND', phone: identifier });
        if (res.data.success) {
          toast.success(`OTP Sent to ${identifier}`);
          setStep('OTP');
        }
      } catch (err) {
        toast.error("Failed to send OTP");
      } finally {
        setLoading(false);
      }
    }
  };

  // 2. Handle Login (Password or OTP)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload: any = {};

      if (step === 'PASSWORD') {
        payload = { identifier, password, isOtpLogin: false };
      } 
      else if (step === 'OTP') {
        // First Verify OTP
        const verifyRes = await axios.post('/api/auth/otp', { action: 'VERIFY', phone: identifier, code: otp });
        if (!verifyRes.data.success) throw new Error('Invalid OTP');
        
        // Then Try to Login
        payload = { phone: identifier, isOtpLogin: true };
      }

      const res = await axios.post('/api/auth/login', payload);
      
      if (res.data.success) {
        Cookies.set('token', res.data.token, { expires: 7 });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success("Welcome back!");
        router.push(redirectUrl);
      }

    } catch (err: any) {
      // If Login fails with OTP, it means User Not Found -> Go to Auto-Register
      if (step === 'OTP' && err.response?.status === 401) {
        toast.info("New number detected. Let's setup your profile!");
        setStep('REGISTER');
      } else {
        toast.error(err.response?.data?.message || err.message || "Login Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Auto Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register (OTP already verified in previous step)
      const res = await axios.post('/api/auth/register', {
        ...regData,
        phone: identifier, // The verified phone
        password: 'otp-login-account',
        loginMethod: 'phone'
      });

      if (res.data.success) {
        // Auto Login immediately after register
        const loginRes = await axios.post('/api/auth/login', { phone: identifier, isOtpLogin: true });
        Cookies.set('token', loginRes.data.token, { expires: 7 });
        router.push(redirectUrl);
      }
    } catch (err: any) {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10 overflow-hidden">
      
      {/* LEFT SIDE - HEALTHCARE BRANDING */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        {/* Medical pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="relative z-10 text-white space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-14 w-auto" alt="WayToLab" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">WayToLab</h1>
              <p className="text-xs text-teal-200 font-medium">Diagnostic Healthcare</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-black leading-tight">
            Your Health, <br/>
            <span className="text-teal-200">Our Priority.</span>
          </h2>
          <p className="text-lg text-teal-100">Access your diagnostic reports, manage health history, and book tests with India's trusted diagnostic partner.</p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <ShieldCheck className="text-emerald-300" size={20} />
              <div>
                <p className="font-semibold">NABL Certified Labs</p>
                <p className="text-sm text-teal-200">Accurate diagnostic results</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <HeartPulse className="text-rose-300" size={20} />
              <div>
                <p className="font-semibold">Health Records</p>
                <p className="text-sm text-teal-200">Track your medical history</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <Stethoscope className="text-blue-300" size={20} />
              <div>
                <p className="font-semibold">Expert Consultation</p>
                <p className="text-sm text-teal-200">Free doctor consultations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-teal-200/20 border border-teal-100"
        >
          
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Users size={24} className="text-teal-600" />
              <h2 className="text-2xl font-bold text-slate-900">Welcome to WayToLab</h2>
            </div>
            <p className="text-slate-500 text-sm">Sign in to access your diagnostic dashboard</p>
          </div>

          <form onSubmit={step === 'INPUT' ? handleNext : step === 'REGISTER' ? handleRegister : handleLogin} className="space-y-5">
            
            {/* STEP 1: INPUT */}
            {step === 'INPUT' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number or Email</label>
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="e.g. 9876543210 or john@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-medium"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                    <Phone size={20} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: PASSWORD (Email) */}
            {step === 'PASSWORD' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button type="button" onClick={() => setStep('INPUT')} className="text-xs text-teal-600 font-bold hover:text-teal-800 transition-colors">
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    autoFocus
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                    <ShieldCheck size={20} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OTP (Phone) */}
            {step === 'OTP' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Enter OTP</label>
                  <button type="button" onClick={() => setStep('INPUT')} className="text-xs text-teal-600 font-bold hover:text-teal-800 transition-colors">
                    Change Number
                  </button>
                </div>
                <input 
                  type="text" 
                  maxLength={6}
                  autoFocus
                  placeholder="XXXXXX"
                  className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 outline-none text-center tracking-[0.5em] font-bold text-xl"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-slate-400 mt-2 text-center">OTP sent to +91 {identifier}</p>
              </motion.div>
            )}

            {/* STEP 4: AUTO REGISTER */}
            {step === 'REGISTER' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-xl text-teal-700 text-sm mb-4 border border-teal-100">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={18} className="text-teal-600" />
                    <span>Welcome! Complete your healthcare profile to continue.</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium"
                    value={regData.name} 
                    onChange={e => setRegData({...regData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Optional)</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium"
                    value={regData.email} 
                    onChange={e => setRegData({...regData, email: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium bg-white"
                        value={regData.gender} 
                        onChange={e => setRegData({...regData, gender: e.target.value})}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        required 
                        className="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium"
                        value={regData.dob} 
                        onChange={e => setRegData({...regData, dob: e.target.value})}
                      />
                   </div>
                </div>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {step === 'INPUT' ? 'Checking...' : 
                   step === 'OTP' ? 'Verifying...' : 
                   step === 'REGISTER' ? 'Setting up...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {step === 'INPUT' ? 'Continue' : 
                   step === 'OTP' ? 'Verify & Login' : 
                   step === 'REGISTER' ? 'Complete Healthcare Setup' : 'Sign In'}
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          {step === 'INPUT' && (
            <div className="mt-8 pt-6 border-t border-teal-100 text-center">
              <p className="text-sm text-slate-500">New to WayToLab?</p>
              <Link 
                href="/register" 
                className="inline-flex items-center gap-1 text-teal-700 font-bold hover:text-teal-800 transition-colors mt-1"
              >
                Create Healthcare Account
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Healthcare Assurance */}
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

        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading healthcare portal...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}