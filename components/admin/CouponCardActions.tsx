'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Loader2, Pause, Play } from 'lucide-react';

import {
  extendCouponValidityAction,
  toggleCouponActiveStatusAction
} from '@/app/actions/adminCouponActions';
import { getISTDateTimeLocalValue } from '@/lib/date-time';
import { toast } from '@/lib/safe-toast';

const DEFAULT_EXTENSION_DAYS = 7;

const getDefaultExpiryInput = (expiryDate?: string | Date | null) => {
  if (expiryDate) {
    return getISTDateTimeLocalValue(new Date(expiryDate));
  }

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + DEFAULT_EXTENSION_DAYS);
  return getISTDateTimeLocalValue(nextWeek);
};

interface CouponCardActionsProps {
  couponId: number;
  isActive: boolean;
  expiryDate?: string | Date | null;
}

export default function CouponCardActions({
  couponId,
  isActive,
  expiryDate
}: CouponCardActionsProps) {
  const router = useRouter();
  const [expiryInput, setExpiryInput] = useState(() => getDefaultExpiryInput(expiryDate));
  const [pending, startTransition] = useTransition();

  const handleToggleStatus = () => {
    startTransition(async () => {
      const res = await toggleCouponActiveStatusAction(couponId, !isActive);
      if (res.success) {
        toast.success(res.message || `Coupon ${isActive ? 'paused' : 'resumed'} successfully`);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update coupon status');
      }
    });
  };

  const handleExtendValidity = () => {
    if (!expiryInput) {
      toast.error('Select a new expiry date');
      return;
    }

    startTransition(async () => {
      const res = await extendCouponValidityAction(couponId, expiryInput);
      if (res.success) {
        toast.success(res.message || 'Coupon validity extended successfully');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to extend coupon validity');
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={pending}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isActive ? (
          <Pause size={14} />
        ) : (
          <Play size={14} />
        )}
        {isActive ? 'Pause' : 'Resume'}
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <CalendarClock className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="datetime-local"
            value={expiryInput}
            onChange={(e) => setExpiryInput(e.target.value)}
            className="admin-form-input min-w-[220px] pl-9 text-xs"
            disabled={pending}
          />
        </div>
        <button
          type="button"
          onClick={handleExtendValidity}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
          Extend
        </button>
      </div>
    </div>
  );
}
