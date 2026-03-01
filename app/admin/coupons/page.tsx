// app/admin/coupons/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Activity, Calendar, Pencil, Plus, Ticket } from 'lucide-react';

import {
  deleteCouponAction,
  getCoupons,
  getCouponStats
} from '@/app/actions/adminCouponActions';
import CouponCardActions from '@/components/admin/CouponCardActions';
import DeleteRowButton from '@/components/admin/DeleteRowButton';
import { formatISTDateTime } from '@/lib/date-time';

function getCouponStatus(coupon: {
  isActive: boolean;
  startDate: Date;
  expiryDate: Date | null;
}) {
  const now = new Date();

  if (!coupon.isActive) {
    return { label: 'PAUSED', className: 'admin-badge-default' };
  }

  if (coupon.expiryDate && coupon.expiryDate <= now) {
    return { label: 'EXPIRED', className: 'bg-rose-100 text-rose-700' };
  }

  if (coupon.startDate > now) {
    return { label: 'SCHEDULED', className: 'bg-amber-100 text-amber-700' };
  }

  return { label: 'ACTIVE', className: 'admin-badge-success' };
}

export default async function CouponsPage() {
  const coupons = await getCoupons();
  const stats = await getCouponStats();

  return (
    <div className="admin-space-y">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="admin-page-title">Coupons & Offers</h1>
          <p className="admin-page-subtitle">Manage discounts and promotional codes</p>
        </div>
        <Link href="/admin/coupons/add" className="admin-btn-primary">
          <Plus size={20} /> Create New Coupon
        </Link>
      </div>

      <div className="admin-stat-grid">
        {[
          { label: 'Total Coupons', val: stats.total, icon: Ticket, color: 'bg-blue-500' },
          { label: 'Active', val: stats.active, icon: Activity, color: 'bg-emerald-500' },
          { label: 'Expired', val: stats.expired, icon: Calendar, color: 'bg-rose-500' },
          { label: 'Inactive', val: stats.inactive, icon: Ticket, color: 'bg-slate-500' }
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((coupon) => {
          const status = getCouponStatus(coupon);

          return (
            <div key={coupon.id} className="admin-card relative flex h-full flex-col overflow-hidden group">
              <div
                className={`absolute right-0 top-0 z-10 rounded-bl-2xl px-4 py-1.5 text-xs font-bold ${status.className}`}
              >
                {status.label}
              </div>

              <div className="flex-1 p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-black text-indigo-600">
                    %
                  </div>
                  <div>
                    <h3 className="admin-table-row-primary font-mono">{coupon.code}</h3>
                    <div className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs admin-badge-info">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${Number(coupon.discountValue)}% OFF`
                        : `Rs ${Number(coupon.discountValue)} OFF`}
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Starts</span>
                    <span className="text-right font-bold text-slate-800">{formatISTDateTime(coupon.startDate)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Times Used</span>
                    <span className="font-bold text-slate-800">{coupon._count.orders}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Min Order</span>
                    <span className="font-bold text-slate-800">Rs {Number(coupon.minOrderValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scope</span>
                    <span className="admin-badge-default py-0.5 text-xs">{coupon.couponScope}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="admin-table-row-secondary text-xs">
                    Expires: {coupon.expiryDate ? formatISTDateTime(coupon.expiryDate) : 'Never'}
                  </div>
                  <CouponCardActions
                    couponId={coupon.id}
                    isActive={coupon.isActive}
                    expiryDate={coupon.expiryDate}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/coupons/${coupon.id}`}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </Link>
                  <DeleteRowButton id={coupon.id} deleteAction={deleteCouponAction} />
                </div>
              </div>
            </div>
          );
        })}

        <Link
          href="/admin/coupons/add"
          className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-slate-400 transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 group"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 transition-colors group-hover:bg-white">
            <Plus size={32} />
          </div>
          <span className="font-bold">Add New Coupon</span>
        </Link>
      </div>
    </div>
  );
}
