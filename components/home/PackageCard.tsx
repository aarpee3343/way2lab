'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';

export default function PackageCard({ pkg }: { pkg: any }) {
  const router = useRouter();

  // Define healthcare-themed colors based on tag
  const tagColors: any = {
    'Best Seller': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Popular': 'bg-teal-100 text-teal-800 border border-teal-200',
    'Recommended': 'bg-blue-100 text-blue-800 border border-blue-200',
    'For Her': 'bg-rose-100 text-rose-800 border border-rose-200',
    'For Him': 'bg-sky-100 text-sky-800 border border-sky-200',
    'Senior': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Comprehensive': 'bg-violet-100 text-violet-800 border border-violet-200',
    'Basic': 'bg-slate-100 text-slate-800 border border-slate-200'
  };

  // Get test count for badge
  const testCount = pkg.tests ? pkg.tests.length : Math.floor(Math.random() * 30) + 10;

  return (
    <motion.div 
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-white rounded-3xl p-7 border border-teal-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full group"
    >
      {/* Premium healthcare gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500" />
      
      {/* Subtle medical pattern overlay */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }} />
      </div>

      {/* Tag badge with healthcare styling */}
      <div className={`absolute top-5 right-5 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide shadow-sm ${tagColors[pkg.tag] || 'bg-teal-100 text-teal-800 border border-teal-200'}`}>
        {pkg.tag}
      </div>

      {/* Test count badge */}
      <div className="absolute top-5 left-5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
        {testCount}+ Tests
      </div>

      <div className="relative z-10 flex flex-col h-full pt-10">
        {/* Icon with healthcare gradient */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
          <Package size={28} strokeWidth={2} />
        </div>

        {/* Package title */}
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors duration-300 leading-tight">
          {pkg.packageName}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
          {pkg.description || 'Comprehensive health screening package covering essential diagnostic parameters for complete wellness assessment.'}
        </p>

        {/* Healthcare benefits */}
        <div className="space-y-3 mb-7 flex-1">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-slate-700">Includes Smart Health Report</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-slate-700">Free Home Sample Collection</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-slate-700">Doctor Consultation Included</span>
          </div>
        </div>

        {/* Price and CTA section */}
        <div className="mt-auto pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-teal-700">₹{pkg.price}</span>
                {pkg.discount > 0 && (
                  <>
                    <span className="text-lg text-slate-400 line-through">₹{Number(pkg.price) + Number(pkg.discount)}</span>
                    <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      Save ₹{pkg.discount}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">+ Free Doctor Consultation</p>
            </div>
            
            <button 
              onClick={() => router.push(`/search?q=${encodeURIComponent(pkg.packageName)}`)}
              className="relative bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-xl hover:shadow-teal-200 transition-all duration-300 group/btn hover:from-teal-700 hover:to-teal-800"
            >
              Book Now
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
              {/* Button glow effect */}
              <div className="absolute inset-0 rounded-xl bg-teal-500 opacity-0 group-hover/btn:opacity-30 group-hover/btn:animate-ping" />
            </button>
          </div>

          {/* Quick info tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              Fasting Required
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
              Reports in 48h
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
              Advanced Tests
            </span>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-100/20 via-blue-100/10 to-teal-100/20 blur-xl" />
      </div>
    </motion.div>
  );
}