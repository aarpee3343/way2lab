'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, ShieldCheck, FileText, Info, CheckCircle2, 
  ShoppingCart, Phone, Share2, Activity, Microscope, AlertCircle,
  Heart, Stethoscope, Users, Calendar, LayoutDashboard 
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TestDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    axios.get(`/api/tests/${slug}`)
      .then(res => {
        setTest(res.data);
        setIsBookmarked(false);
      })
      .catch(() => toast.error("Failed to load test details"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBook = () => {
    router.push(`/search?q=${encodeURIComponent(test.testName)}`);
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from saved tests' : 'Added to saved tests');
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

  if (!test) return <div className="text-center py-32 text-slate-500 font-bold">Test Not Found</div>;

  // Price calculations
  const mrp = Number(test.price);
  const discount = Number(test.discount || 0);
  const sellingPrice = discount > 0 ? Math.round(mrp - (mrp * discount / 100)) : mrp;
  const savings = mrp - sellingPrice;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50 pb-20">
      
      {/* Header with healthcare gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 pt-8 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-teal-100 hover:text-white mb-6 font-medium text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Diagnostic Tests
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="text-white">
              {test.category && (
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                  {test.category}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{test.testName}</h1>
              
              <div className="flex flex-wrap gap-6 text-sm font-medium text-teal-100">
                {test.scheduleReporting && (
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-teal-200" />
                    <span>Report in <strong className="text-white">{test.scheduleReporting}</strong></span>
                  </div>
                )}
                {test.specialty && (
                  <div className="flex items-center gap-2">
                    <Microscope size={18} className="text-teal-200" />
                    <span>Specialty: <strong className="text-white">{test.specialty}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-teal-200" />
                  <span>NABL Certified Laboratory</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={toggleBookmark}
                className={`p-3 rounded-full border ${isBookmarked ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} transition-colors`}
              >
                <Heart size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className="p-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description */}
            {test.description && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100 relative overflow-hidden"
              >
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Info size={20} className="text-teal-600" />
                  </div>
                  About This Diagnostic Test
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {test.description}
                </p>
              </motion.div>
            )}

            {/* Preparation */}
            {test.preparation && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100"
              >
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-amber-600" />
                  </div>
                  Test Preparation Guidelines
                </h3>
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 text-amber-800 text-sm flex gap-4 items-start">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-2">Important Instructions:</p>
                    <p>{test.preparation}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Test Parameters (Sample) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100"
            >
              <h3 className="font-bold text-xl mb-6 text-slate-900">What's Included</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Sample Collection',
                  'Lab Processing',
                  'AI Analysis',
                  'Digital Report',
                  'User Dashboard',
                  'Follow-up Guidance'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Healthcare Benefits */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-8 border border-teal-200">
              <h3 className="font-bold text-xl mb-6 text-slate-900">Why Choose WayToLab?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: <LayoutDashboard  className="text-teal-600" />, title: 'User Dashboard', desc: 'Free User Dashboard for onlinereporting' },
                  { icon: <Users className="text-blue-600" />, title: 'Trained Phlebotomists', desc: 'Skilled professionals for sample collection' },
                  { icon: <Activity className="text-emerald-600" />, title: 'Smart Health Reports', desc: 'AI-powered insights and trends' },
                  { icon: <Calendar className="text-purple-600" />, title: 'Flexible Scheduling', desc: 'Choose your preferred time slot' },
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
                
                {/* Discount Ribbon */}
                {discount > 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-bl-xl shadow-lg">
                    SAVE {discount}%
                  </div>
                )}

                <div className="mb-8 mt-2">
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Diagnostic Test Price</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl font-black text-teal-700">₹{sellingPrice}</span>
                    {discount > 0 && (
                      <span className="text-slate-400 line-through text-lg font-medium">₹{mrp}</span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Total Savings: ₹{savings}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleBook}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-3 mb-3 group/btn"
                >
                  <ShoppingCart size={22} />
                  Book Test Now
                  <div className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                    <ArrowLeft className="rotate-180" size={16} />
                  </div>
                </button>
                
                <a 
                  href="tel:+919311213388"
                  className="w-full bg-white border-2 border-teal-100 text-teal-700 h-12 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-teal-300 hover:bg-teal-50 transition-all"
                >
                  <Phone size={18} />
                  Call WayToLab Expert
                </a>

                {/* Healthcare guarantee */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <ShieldCheck size={16} className="text-teal-600" />
                    <span>100% Quality Guarantee • NABL Certified</span>
                  </div>
                </div>
              </motion.div>

              {/* Medical Support Card */}
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
                  Consult Now
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
