'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HeartPulse, CheckCircle2, Clock, FlaskConical, ArrowRight, ShieldCheck, Users, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/packages')
      .then(res => setPackages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isPublicPackage = (pkg: any) => {
    const isActive = pkg?.isActive ?? pkg?.isactive;
    const isCorporate = pkg?.isCorporate ?? pkg?.iscorporate;
    return isActive !== false && isCorporate !== true;
  };

  const visiblePackages = packages.filter(isPublicPackage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50 pb-20">
      
      {/* Healthcare Hero */}
      <section className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full mb-6 border border-white/30">
            <HeartPulse size={18} className="text-teal-200" />
            <span className="text-sm font-bold text-white">Preventive Healthcare</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Comprehensive <span className="text-teal-200">Health Packages</span>
          </h1>
          <p className="text-teal-100 max-w-2xl mx-auto text-lg">
            Curated full-body checkups designed to keep you and your family healthy. Save up to 70% on diagnostic costs.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        <Breadcrumbs />

        {/* Healthcare Packages Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-teal-100 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : visiblePackages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-teal-100 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
              <HeartPulse size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Health Packages Available</h3>
            <p className="text-slate-500 mt-2">Check back soon for our comprehensive health checkup bundles.</p>
            <button 
              onClick={() => router.push('/tests')}
              className="mt-6 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
            >
              Browse Individual Tests
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visiblePackages.map((pkg) => {
              const mrp = Number(pkg?.price ?? 0);
              const discountPercent = Number(pkg?.discount ?? 0);
              const sellingPrice = discountPercent > 0
                ? Math.round(mrp - (mrp * discountPercent) / 100)
                : mrp;
              const savingsPercent = discountPercent > 0 ? Math.round(discountPercent) : 0;
              const discount = discountPercent > 0 ? Math.max(mrp - sellingPrice, 0) : 0;

              return (
                <motion.div 
                  key={pkg.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-3xl p-6 border border-teal-100 shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                  onClick={() => router.push(`/packages/${pkg.id}`)}
                >
                  {savingsPercent > 0 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl z-10 shadow-lg">
                      SAVE {savingsPercent}%
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md">
                      <HeartPulse size={26} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-teal-700 transition-colors">
                      {pkg.packageName}
                    </h3>
                    <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><FlaskConical size={14} className="text-teal-600"/> {pkg.testCount} Tests</span>
                      <span className="flex items-center gap-1"><Clock size={14} className="text-blue-600"/> 24h Report</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                    {pkg.description || 'Comprehensive health assessment package for preventive healthcare.'}
                  </p>

                  <div className="bg-gradient-to-r from-teal-50/50 to-blue-50/50 rounded-xl p-5 mb-6 space-y-3 border border-teal-100">
                    {[
                      { text: 'Free Home Sample Collection', icon: CheckCircle2, color: 'text-emerald-600' },
                      { text: 'NABL Certified Laboratories', icon: ShieldCheck, color: 'text-teal-600' },
                      { text: 'Doctor Consultation Included', icon: Users, color: 'text-blue-600' },
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <feat.icon size={16} className={`shrink-0 ${feat.color}`} />
                        {feat.text}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Package Price</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-teal-700">₹{sellingPrice}</span>
                        {discount > 0 && (
                          <span className="text-sm text-slate-400 line-through">₹{mrp}</span>
                        )}
                      </div>
                      {discount > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">Save ₹{discount}</p>
                      )}
                    </div>
                    <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-3 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center gap-2 group/btn">
                      View Details
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Healthcare CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-teal-50 to-white rounded-3xl p-8 border border-teal-100 max-w-2xl mx-auto">
            <Award size={40} className="mx-auto mb-4 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Looking for Custom Health Package?</h3>
            <p className="text-slate-600 mb-6">Our healthcare experts can create a personalized health checkup package for you.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/contact')}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-teal-200 transition-all"
              >
                Get Custom Package
              </button>
              <button 
                onClick={() => router.push('/tests')}
                className="bg-white border border-teal-200 text-teal-700 px-8 py-3 rounded-xl font-bold hover:bg-teal-50 transition-all"
              >
                Browse All Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
