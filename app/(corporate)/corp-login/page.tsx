'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/safe-toast';
import Image from "next/image";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Loader2
} from 'lucide-react';

import { corporateLoginAction } from '@/app/actions/corporateAuthActions';

export default function CorporateLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await corporateLoginAction(formData);

    if (res.success) {
      toast.success('Login Successful');
      router.push('/corp');
      router.refresh(); // 
    } else {
      toast.error(res.error || 'Login Failed');
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
            Enterprise Health <br />
            <span className="text-blue-500">Management.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Dedicated portal for corporate partners to manage employee wellness,
            track pre-employment checks, and analyze workforce health trends.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>Secure AES-256 Encryption</span>
          <span>HIPAA Compliant</span>
        </div>
      </div>

      {/* RIGHT: Login */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Partner Login
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Please enter your corporate credentials
            </p>
          </div>

          {/* ✅ REAL AUTH FORM */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">
                  Official Email
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
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock
                    className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500"
                    size={18}
                  />
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <Link
              href="/corp-forgot-password"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600"
            >
              Forgot Password
            </Link>
          </form>

          <div className="pt-8 flex items-center gap-3">
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
