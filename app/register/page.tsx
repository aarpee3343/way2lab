'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Mail, HeartPulse, Stethoscope, Users, Phone } from 'lucide-react';
import { toast } from 'sonner';

// SVG Google Logo Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Data State
  const [isGoogleReg, setIsGoogleReg] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'Male',
    dob: '',
    googleId: ''
  });

  // Check for Google Data in URL
  useEffect(() => {
    const gName = searchParams.get('name');
    const gEmail = searchParams.get('email');
    const gId = searchParams.get('googleId');

    if (gEmail && gId) {
      setFormData(prev => ({
        ...prev,
        name: gName || '',
        email: gEmail,
        googleId: gId
      }));
      setIsGoogleReg(true);
      toast.info(`Welcome ${gName || ''}! Please complete your profile.`);
    }
  }, [searchParams]);

  // Handle Google Login Click
  const handleGoogleClick = () => {
    toast.info("Google Auth endpoint needs to be configured in backend.");
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/otp', { action: 'SEND', phone: formData.phone });
      
      if (res.data.success) {
        toast.success("Verification code sent to your mobile");
        setStep(2);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP
      const verifyRes = await axios.post('/api/auth/otp', { action: 'VERIFY', phone: formData.phone, code: otp });
      if (!verifyRes.data.success) throw new Error("Invalid OTP");

      // Register Customer
      const payload = {
        ...formData,
        loginMethod: isGoogleReg ? 'google' : 'email'
      };

      const res = await axios.post('/api/auth/register', payload);
      
      if (res.data.success) {
        toast.success("Healthcare account created successfully!");
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP or Server Error");
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
            Join India's Trusted <br/>
            <span className="text-teal-200">Healthcare Family</span>
          </h2>
          <p className="text-lg text-teal-100">Create your account to access comprehensive diagnostic services, track health history, and manage family healthcare.</p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <HeartPulse size={20} className="text-teal-200" />
              </div>
              <div>
                <p className="font-semibold">Health Records Access</p>
                <p className="text-sm text-teal-200">All your reports in one place</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ShieldCheck size={20} className="text-blue-200" />
              </div>
              <div>
                <p className="font-semibold">Data Security</p>
                <p className="text-sm text-teal-200">HIPAA compliant medical data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Stethoscope size={20} className="text-emerald-200" />
              </div>
              <div>
                <p className="font-semibold">Expert Support</p>
                <p className="text-sm text-teal-200">24/7 medical consultation</p>
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
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Users size={24} className="text-teal-600" />
              <h2 className="text-2xl font-bold text-slate-900">Create Healthcare Account</h2>
            </div>
            <div className="flex gap-2 mt-3">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-teal-500 to-teal-600' : 'bg-slate-100'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-teal-500 to-teal-600' : 'bg-slate-100'}`} />
            </div>
          </div>

          <form onSubmit={step === 1 ? handleDetailsSubmit : handleFinalRegister} className="space-y-4">
            
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                
                {/* Google Button */}
                {!isGoogleReg && (
                  <div className="mb-6">
                    <button 
                      type="button"
                      onClick={handleGoogleClick}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-teal-200 hover:bg-teal-50 text-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                      <GoogleIcon /> Sign up with Google
                    </button>
                    <div className="relative flex py-4 items-center">
                      <div className="flex-grow border-t border-teal-100"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or continue with details</span>
                      <div className="flex-grow border-t border-teal-100"></div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-500"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="John Doe" 
                      disabled={isGoogleReg}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <Users size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        required 
                        maxLength={10} 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none font-medium"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                        placeholder="98765xxxxx" 
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                        <Phone size={18} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-500"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="john@example.com" 
                        disabled={isGoogleReg}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                        <Mail size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 outline-none font-medium bg-white"
                        value={formData.gender} 
                        onChange={e => setFormData({...formData, gender: e.target.value})}
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
                        value={formData.dob} 
                        onChange={e => setFormData({...formData, dob: e.target.value})}
                      />
                   </div>
                </div>

                {/* Hide password field if registering via Google */}
                {!isGoogleReg && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        required 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none font-medium"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="••••••••" 
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600">
                        <ShieldCheck size={18} />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 text-center">
                <div className="bg-gradient-to-br from-teal-100 to-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-teal-600 mb-2">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Verify Mobile Number</h3>
                <p className="text-sm text-slate-500">
                  Enter the 6-digit code sent to <br/> 
                  <span className="font-bold text-slate-800">+91 {formData.phone}</span>
                </p>

                <input 
                  type="text" 
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl border border-teal-200 focus:border-teal-500 outline-none text-center tracking-[0.5em] font-bold text-xl mt-4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXXXX"
                />
                
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-sm text-teal-600 font-bold hover:text-teal-800 transition-colors hover:underline"
                >
                  Change Number
                </button>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-2 group/btn mt-6 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {step === 1 ? 'Sending OTP...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {step === 1 ? 'Verify & Continue' : 'Create Healthcare Account'}
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          {step === 1 && (
            <div className="mt-8 pt-6 border-t border-teal-100 text-center">
              <p className="text-sm text-slate-500">Already have a healthcare account?</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-1 text-teal-700 font-bold hover:text-teal-800 transition-colors mt-1"
              >
                Sign in to your account
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Healthcare Terms */}
          <div className="mt-8 pt-6 border-t border-teal-100">
            <p className="text-xs text-slate-400 text-center">
              By creating an account, you agree to our 
              <Link href="/privacy" className="text-teal-600 font-medium hover:underline mx-1">Privacy Policy</Link>
              and
              <Link href="/terms" className="text-teal-600 font-medium hover:underline mx-1">Terms of Service</Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/20 via-white to-blue-50/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading registration...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}