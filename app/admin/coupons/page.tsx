export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getCoupons, getCouponStats, deleteCouponAction } from '@/app/actions/adminCouponActions';
import { Ticket, Plus, Calendar, Activity } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function CouponsPage() {
  const coupons = await getCoupons();
  const stats = await getCouponStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Coupons & Offers</h1>
          <p className="text-slate-500 mt-1">Manage discounts and promotional codes</p>
        </div>
        <Link href="/admin/coupons/add" className="group relative overflow-hidden bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:scale-105 hover:shadow-2xl">
          <span className="relative z-10 flex items-center gap-2"><Plus size={20} /> Create New Coupon</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', val: stats.total, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', val: stats.active, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Expired', val: stats.expired, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Inactive', val: stats.inactive, icon: Ticket, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{s.val}</h3>
            <p className="text-sm font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative flex flex-col">
            
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold z-10 ${coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>

            <div className="p-6 flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                  %
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight font-mono">{coupon.code}</h3>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}% OFF` : `₹${Number(coupon.discountValue)} OFF`}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600 mb-6">
                 <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Times Used</span>
                    <span className="font-bold text-slate-800">{coupon._count.orders}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Min Order</span>
                    <span className="font-bold text-slate-800">₹{Number(coupon.minOrderValue)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-slate-400">Scope</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 rounded text-xs py-0.5">{coupon.couponScope}</span>
                 </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
               <div className="text-xs text-slate-400">
                  Expires: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
               </div>
               <div className="flex gap-2">
                  <DeleteRowButton id={coupon.id} deleteAction={deleteCouponAction} />
               </div>
            </div>

            {/* Ticket Cutouts */}
            <div className="absolute -left-3 top-2/3 w-6 h-6 bg-slate-50 rounded-full" />
            <div className="absolute -right-3 top-2/3 w-6 h-6 bg-slate-50 rounded-full" />
          </div>
        ))}
        
        {/* Create Card */}
        <Link href="/admin/coupons/add" className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 transition-all cursor-pointer group min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-bold">Add New Coupon</span>
        </Link>
      </div>
    </div>
  );
}