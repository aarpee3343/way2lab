// app/admin/coupons/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getCoupons, getCouponStats, deleteCouponAction } from '@/app/actions/adminCouponActions';
import { Ticket, Plus, Calendar, Activity } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function CouponsPage() {
  const coupons = await getCoupons();
  const stats = await getCouponStats();

  return (
    <div className="admin-space-y">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-page-title">Coupons & Offers</h1>
          <p className="admin-page-subtitle">Manage discounts and promotional codes</p>
        </div>
        <Link href="/admin/coupons/add" className="admin-btn-primary">
          <Plus size={20} /> Create New Coupon
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="admin-stat-grid">
        {[
          { label: 'Total Coupons', val: stats.total, icon: Ticket, color: 'bg-blue-500' },
          { label: 'Active', val: stats.active, icon: Activity, color: 'bg-emerald-500' },
          { label: 'Expired', val: stats.expired, icon: Calendar, color: 'bg-rose-500' },
          { label: 'Inactive', val: stats.inactive, icon: Ticket, color: 'bg-slate-500' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className={`admin-stat-icon-container ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <h3 className="admin-stat-value">{s.val}</h3>
              <p className="admin-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="admin-card relative overflow-hidden group flex flex-col h-full">
            
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold z-10 ${coupon.isActive ? 'admin-badge-success' : 'admin-badge-default'}`}>
              {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>

            <div className="p-6 flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                  %
                </div>
                <div>
                  <h3 className="admin-table-row-primary font-mono">{coupon.code}</h3>
                  <div className="admin-badge-info text-xs px-2 py-0.5 rounded-md inline-block mt-1">
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
                    <span className="admin-badge-default text-xs py-0.5">{coupon.couponScope}</span>
                 </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
               <div className="admin-table-row-secondary text-xs">
                  Expires: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
               </div>
               <div className="flex gap-2">
                  <DeleteRowButton id={coupon.id} deleteAction={deleteCouponAction} />
               </div>
            </div>
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