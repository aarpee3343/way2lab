'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';

export default function PackageCard({ pkg }: { pkg: any }) {
  const router = useRouter();

  const isActive = pkg?.isActive ?? pkg?.isactive;
  const isCorporate = pkg?.isCorporate ?? pkg?.iscorporate;
  if (!pkg || isActive === false || isCorporate === true) return null;

  // --- PRICING LOGIC ---
  const mrp = Number(pkg?.price ?? 0);
  const discount = Number(pkg?.discount ?? 0);
  const finalPrice = mrp - (mrp * discount) / 100;

  const openPackage = () => {
    if (pkg?.id) router.push(`/packages/${pkg.id}`);
    else router.push(`/search?q=${encodeURIComponent(pkg.packageName)}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={openPackage}
      className="relative bg-white p-6 rounded-2xl
                 border border-teal-100 shadow-lg hover:shadow-2xl
                 transition-all duration-300 cursor-pointer
                 group flex flex-col h-full overflow-hidden"
    >
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header pill */}
        <div
          className="flex items-center justify-between gap-2 mb-3
                     bg-white/90 backdrop-blur
                     border border-teal-100
                     rounded-full px-3 py-2
                     shadow-[0_6px_20px_-10px_rgba(13,116,144,0.35)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Package size={14} className="text-teal-600 shrink-0" />
            <span className="text-xs font-semibold text-teal-700 truncate">
              Health Package
            </span>
          </div>

          {discount > 0 && (
            <span className="text-[11px] font-bold text-rose-700
                             bg-rose-100 border border-rose-200
                             px-2.5 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 mb-5">
          <h3
            className="font-bold text-slate-800 mb-3
                       group-hover:text-teal-700 transition-colors
                       text-lg leading-tight line-clamp-2"
          >
            {pkg?.packageName}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {pkg?.description || 'Comprehensive diagnostic health package.'}
          </p>
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">
                Package Price
              </p>

              <div className="flex items-baseline gap-2">
                <p className="font-bold text-2xl text-teal-700">
                  ₹{Math.round(finalPrice)}
                </p>

                {discount > 0 && (
                  <span className="text-xs text-slate-500 line-through">
                    ₹{mrp}
                  </span>
                )}
              </div>
            </div>

            {/* Add / View button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPackage();
              }}
              aria-label={`Open package ${pkg?.packageName || ''}`}
              className="relative w-12 h-12 rounded-full
                         bg-gradient-to-r from-teal-500 to-teal-600
                         flex items-center justify-center text-white
                         transition-all shadow-md
                         hover:shadow-xl hover:scale-110"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Extra info */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(pkg?.testCount || pkg?._count?.tests) && (
            <span className="text-[10px] px-2 py-1 rounded-full
                             bg-blue-50 text-blue-700
                             border border-blue-100 font-medium">
              {pkg?.testCount || pkg?._count?.tests} Tests Included
            </span>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0
                      group-hover:opacity-100 transition-opacity
                      pointer-events-none">
        <div className="absolute inset-0 rounded-2xl
                        bg-gradient-to-br
                        from-teal-100/20 via-blue-100/10 to-teal-100/20
                        blur-xl" />
      </div>
    </motion.div>
  );
}
