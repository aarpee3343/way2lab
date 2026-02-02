'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Beaker, Heart, Plus } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/lib/safe-toast';

export default function TestCard({ test }: { test: any }) {
  const router = useRouter();
  const { setLabCart, items, clearCart, lab } = useCartStore();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Logic to add single item to cart (Simplified for home page)
    // For full cart logic, we usually need a Lab selection.
    // Here we redirect to search with this test pre-filled.
    router.push(`/search?q=${encodeURIComponent(test.testName)}`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success('Added to wishlist');
  };

  return (
    <motion.div 
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-white p-6 rounded-2xl border border-teal-100 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden"
      onClick={() => router.push(`/search?q=${encodeURIComponent(test.testName)}`)}
    >
      {/* Healthcare gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500" />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%230ea5e9' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Beaker size={16} className="text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
              Pathology Test
            </span>
          </div>
          <button 
            onClick={handleWishlist}
            className="p-2 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all duration-300 shadow-sm hover:shadow-md border border-slate-100 hover:border-rose-200"
          >
            <Heart size={18} strokeWidth={2} />
          </button>
        </div>
        
        <div className="flex-1 mb-5">
          <h3 className="font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors duration-300 text-lg leading-tight line-clamp-2">
            {test.testName}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {test.description || 'Comprehensive diagnostic test for accurate health assessment and monitoring.'}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">Starting from</p>
              <div className="flex items-baseline gap-1">
                <p className="font-bold text-2xl text-teal-700">₹{test.price}</p>
                <span className="text-xs text-slate-400 line-through">₹{Math.round(test.price * 1.2)}</span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ml-1">
                  Save 20%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Reports in 24-48 hours</p>
            </div>
            <button 
              onClick={handleAdd}
              className="relative w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-110 group/btn hover:from-teal-600 hover:to-teal-700"
            >
              <Plus size={22} strokeWidth={2.5} />
              {/* Ripple effect on hover */}
              <div className="absolute inset-0 rounded-full bg-teal-500 opacity-0 group-hover/btn:opacity-30 group-hover/btn:animate-ping" />
            </button>
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
            Fasting Required
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
            Home Collection
          </span>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-100/20 via-blue-100/10 to-teal-100/20 blur-xl" />
      </div>
    </motion.div>
  );
}