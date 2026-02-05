'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Beaker, Heart, Plus, Clock, FileText } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function TestCard({ test }: { test: any }) {
  const router = useRouter();
  
  // --- 1. PRICING LOGIC (Strictly based on LabTest Table) ---
  const labTests = test.labTests || [];

  // Default values (if no labs are linked yet)
  let maxMRP = 0;
  let maxDiscount = 0;
  let finalPrice = 0;

  if (labTests.length > 0) {
    // A. Find Maximum MRP (Highest price offered by any lab)
    maxMRP = Math.max(...labTests.map((lt: any) => Number(lt.price)));

    // B. Find Maximum Discount (Highest discount offered by any lab)
    maxDiscount = Math.max(...labTests.map((lt: any) => Number(lt.discount)));

    // C. Calculate Final Price based on THAT Max MRP and Max Discount
    // Formula: MRP - (MRP * Discount / 100)
    finalPrice = maxMRP - (maxMRP * maxDiscount / 100);
  } else {
    // Fallback if no labs are linked (Optional: hide price or show 0)
    maxMRP = Number(test.price || 0);
    maxDiscount = Number(test.discount || 0);
    finalPrice = maxMRP - (maxMRP * maxDiscount / 100);
  }

  // --- 2. HANDLERS ---
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Redirect to search/details page
    router.push(`/search?q=${encodeURIComponent(test.testName)}`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success('Added to wishlist');
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-white p-6 rounded-2xl border border-teal-100 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden"
      onClick={() => router.push(`/search?q=${encodeURIComponent(test.testName)}`)}
    >
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%230ea5e9' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Category & Wishlist */}
  <div
  className="flex items-center justify-between gap-2
             mb-3
             bg-white/90 backdrop-blur
             border border-teal-100
             rounded-full px-3 py-2
             shadow-[0_6px_20px_-10px_rgba(13,116,144,0.35)]
             hover:shadow-[0_10px_28px_-12px_rgba(13,116,144,0.45)]
             transition-shadow">
  
              {/* Left: Category */}
              <div className="flex items-center gap-2 min-w-0">
                <Beaker size={14} className="text-teal-600 shrink-0" />
                <span className="text-xs font-semibold text-teal-700 truncate">
                  {test.category || test.specialty || 'Diagnostic Test'}
                </span>
              </div>

              {/* Right: Discount */}
              {maxDiscount > 0 && (
                <span
                  className="text-[11px] font-bold text-rose-600
                            bg-rose-50 border border-rose-100
                            px-2.5 py-1 rounded-full shrink-0"
                >
                  {Math.round(maxDiscount)}% OFF
                </span>
              )}
            </div>
        
        {/* Main Content */}
        <div className="flex-1 mb-5">
          <h3 className="font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors text-lg leading-tight line-clamp-2" title={test.testName}>
            {test.testName}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {test.description || 'No description available.'}
          </p>
        </div>

        {/* Pricing Section */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {/* Only show "Starting from" if there are labs */}
              {labTests.length > 0 && <p className="text-xs text-slate-500 font-medium">Best Price</p>}
              
              <div className="flex items-baseline gap-2">
                {/* 1. Final Calculated Price */}
                <p className="font-bold text-2xl text-teal-700">
                  ₹{Math.round(finalPrice)}
                </p>
                
                {/* 2. Max MRP (Crossed Out) */}
                {maxMRP > finalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{Math.round(maxMRP)}
                  </span>
                )}
                
                {test.specialty && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                      {test.specialty}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleAdd}
              className="relative w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white transition-all shadow-md hover:shadow-xl hover:scale-110 group/btn"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Info Badges (From Test Table) */}
        <div className="flex flex-wrap gap-2 mt-4">
          {test.preparation && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium truncate max-w-[1000px]">
              {test.preparation}
            </span>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-100/20 via-blue-100/10 to-teal-100/20 blur-xl" />
      </div>
    </motion.div>
  );
}