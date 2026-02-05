'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, ShieldCheck, FileText, Info, CheckCircle2,
  ShoppingCart, Phone, Share2, FlaskConical, LayoutList, HeartPulse,
  Users, Award, Stethoscope, Calendar, LayoutDashboard 
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/packages/${id}`)
      .then(res => setPkg(res.data))
      .catch(() => toast.error("Failed to load package details"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    router.push(`/search?q=${encodeURIComponent(pkg.packageName)}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-3/4" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!pkg) return <div className="text-center py-32 text-slate-500 font-bold">Health Package Not Found</div>;

  // Pricing
  const mrp = Number(pkg.price ?? 0);
  const discountPercent = Number(pkg.discount || 0);
  const sellingPrice = discountPercent > 0 ? Math.round(mrp - (mrp * discountPercent) / 100) : mrp;
  const savingsPercent = discountPercent > 0 ? Math.round(discountPercent) : 0;
  const savingsAmount = discountPercent > 0 ? Math.max(mrp - sellingPrice, 0) : 0;

  // Group tests by category
  const testsByCategory: Record<string, any[]> = {};
  pkg.tests?.forEach((t: any) => {
    const cat = t.test?.category || 'General Tests';
    if (!testsByCategory[cat]) testsByCategory[cat] = [];
    testsByCategory[cat].push(t.test?.testName);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 pb-20">

      {/* Healthcare Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-white">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-teal-100 hover:text-white mb-6 font-medium text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Health Packages
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wide">
                Comprehensive Health Package
              </span>
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{pkg.packageName}</h1>

              <div className="flex flex-wrap gap-6 text-sm font-medium text-teal-100">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} className="text-teal-200" />
                  <span><strong>{pkg.tests?.length || 0}</strong> Diagnostic Tests Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-teal-200" />
                  <span>Report in <strong>24 Hours</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-teal-200" />
                  <span>NABL Certified Diagnostic Labs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Overview */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100 relative overflow-hidden"
            >
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Info size={20} className="text-teal-600" />
                </div>
                Package Overview
              </h3>
              <p className="text-slate-700 leading-relaxed">
                {pkg.description || 'This comprehensive health package is designed for preventive healthcare screening and monitoring overall wellness.'}
              </p>
            </motion.div>

            {/* Included Tests List */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100"
            >
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <LayoutList size={20} className="text-purple-600" />
                </div>
                Included Diagnostic Tests ({pkg.tests?.length || 0})
              </h3>

              <div className="space-y-8">
                {Object.entries(testsByCategory).map(([category, tests]) => (
                  <div key={category}>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      {category}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {tests.map((testName, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                          {testName}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Healthcare Benefits */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 border border-teal-200">
              <h3 className="font-bold text-xl mb-6 text-slate-900">Why Choose This Package?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: <LayoutDashboard  className="text-teal-600" />, title: 'Dedicated Dashboard', desc: 'Dedicated user dashboard for online reporting' },
                  { icon: <Users className="text-blue-600" />, title: 'Trained Professionals', desc: 'Skilled phlebotomists for sample collection' },
                  { icon: <Calendar className="text-emerald-600" />, title: 'Flexible Scheduling', desc: 'Choose your preferred time slot' },
                  { icon: <Award className="text-purple-600" />, title: 'Quality Assured', desc: 'NABL certified labs with accurate results' },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">{benefit.title}</h4>
                      <p className="text-sm text-slate-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR (Sticky Pricing) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-6 shadow-xl shadow-teal-200/50 border border-teal-100 relative overflow-hidden"
              >

                {savingsPercent > 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-bl-2xl shadow-lg">
                    SAVE {savingsPercent}%
                  </div>
                )}

                <div className="mb-8 mt-2">
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Package Price</p>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-4xl font-black text-teal-700">INR {sellingPrice}</span>
                    {discountPercent > 0 && (
                      <span className="text-slate-400 line-through text-lg font-medium">INR {mrp}</span>
                    )}
                  </div>
                  {savingsAmount > 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Total Savings: INR {savingsAmount}</span>
                    </div>
                  )}

                  {/* Per test calculation */}
                  {pkg.tests?.length > 0 && (
                    <div className="mt-4 text-sm text-slate-500">
                      <span className="font-medium">INR {Math.round(sellingPrice / pkg.tests.length)} per test</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBook}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-3 mb-3 group/btn"
                >
                  <HeartPulse size={22} />
                  Book Health Package
                  <div className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                    <ArrowLeft className="rotate-180" size={16} />
                  </div>
                </button>

                <a
                  href="tel:+919311213388"
                  className="w-full bg-white border-2 border-teal-100 text-teal-700 h-12 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-teal-300 hover:bg-teal-50 transition-all"
                >
                  <Phone size={18} />
                  Call WayToLab Helpline
                </a>

                {/* Healthcare guarantee */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <ShieldCheck size={16} className="text-teal-600" />
                    <span>NABL Certified Labs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock size={16} className="text-teal-600" />
                    <span>Reports in 24 Hours</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-teal-600" />
                    <span>Home Collection Available*</span>
                  </div>
                </div>
              </motion.div>

              {/* Health Consultation Card */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Need Diagnostic Advice?</p>
                    <p className="text-sm text-slate-600">Our Diagnostic experts can help</p>
                  </div>
                </div>
                <a
                  href="mailto:care@waytolab.com"
                  className="block text-center bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all"
                >
                  Consult Healthcare Expert
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
