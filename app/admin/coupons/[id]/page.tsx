'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Pencil,
  Save,
  Settings2,
  Ticket
} from 'lucide-react';

import {
  getCouponById,
  getCouponFormData,
  updateCouponAction
} from '@/app/actions/adminCouponActions';
import MultiSelect from '@/components/ui/MultiSelect';
import { getISTDateTimeLocalValue } from '@/lib/date-time';
import { toast } from '@/lib/safe-toast';

type CouponFormData = {
  labs: Array<{ id: number; labName: string; city?: string | null }>;
  tests: Array<{ id: number; testName: string }>;
  packages: Array<{ id: number; packageName: string }>;
};

type CouponDetails = {
  id: number;
  code: string;
  description: string;
  couponScope: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: string;
  usageLimit: string;
  userLimit: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  usedCount: number;
  ordersCount: number;
  labIds: string[];
  testIds: string[];
  packageIds: string[];
};

const getScopeSelectedIds = (coupon: CouponDetails) => {
  if (coupon.couponScope === 'LAB') return coupon.labIds;
  if (coupon.couponScope === 'TEST') return coupon.testIds;
  if (coupon.couponScope === 'PACKAGE') return coupon.packageIds;
  return [];
};

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const couponId = Number.parseInt(id, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({ labs: [], tests: [], packages: [] });
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);

  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('GLOBAL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [userLimit, setUserLimit] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [couponData, options] = await Promise.all([
          getCouponById(couponId),
          getCouponFormData()
        ]);

        if (!couponData) {
          toast.error('Coupon not found');
          router.push('/admin/coupons');
          return;
        }

        setCoupon(couponData);
        setFormData(options);
        setDescription(couponData.description);
        setScope(couponData.couponScope);
        setSelectedIds(getScopeSelectedIds(couponData));
        setMinOrderValue(String(couponData.minOrderValue ?? 0));
        setMaxDiscountAmount(couponData.maxDiscountAmount);
        setUsageLimit(couponData.usageLimit);
        setUserLimit(couponData.userLimit);
        setStartDate(getISTDateTimeLocalValue(new Date(couponData.startDate)));
        setExpiryDate(
          couponData.expiryDate ? getISTDateTimeLocalValue(new Date(couponData.expiryDate)) : ''
        );
      } catch (error) {
        toast.error('Failed to load coupon details');
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isInteger(couponId)) {
      toast.error('Invalid coupon id');
      router.push('/admin/coupons');
      return;
    }

    init();
  }, [couponId, router]);

  const handleScopeChange = (value: string) => {
    setScope(value);
    setSelectedIds([]);
  };

  const getScopeOptions = () => {
    if (scope === 'LAB') return formData.labs;
    if (scope === 'TEST') return formData.tests;
    if (scope === 'PACKAGE') return formData.packages;
    return [];
  };

  const getScopePlaceholder = () => {
    if (scope === 'LAB') return 'Select labs...';
    if (scope === 'TEST') return 'Select tests...';
    if (scope === 'PACKAGE') return 'Select packages...';
    return 'Select targets...';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;

    setSaving(true);
    const payload = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      description,
      couponScope: scope,
      startDate,
      expiryDate,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      userLimit,
      labIds: scope === 'LAB' ? selectedIds : [],
      testIds: scope === 'TEST' ? selectedIds : [],
      packageIds: scope === 'PACKAGE' ? selectedIds : []
    };

    const res = await updateCouponAction(coupon.id, payload);
    setSaving(false);

    if (res.success) {
      toast.success('Coupon updated successfully');
      router.push('/admin/coupons');
    } else {
      toast.error(res.error || 'Failed to update coupon');
    }
  };

  if (loading || !coupon) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="admin-page-title">Edit Coupon</h1>
          <p className="admin-page-subtitle">Update description, limits, timing and targeting.</p>
        </div>
        <Link href="/admin/coupons" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="admin-space-y lg:col-span-2">
          <div className="admin-form-section">
            <h3 className="admin-form-title">
              <Pencil size={16} /> Campaign Details
            </h3>
            <div className="admin-form-grid">
              <div>
                <label className="admin-form-label">Coupon Code</label>
                <input value={coupon.code} disabled className="admin-form-input font-mono font-bold" />
              </div>
              <div>
                <label className="admin-form-label">Discount</label>
                <input
                  value={
                    coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : `Rs ${coupon.discountValue}`
                  }
                  disabled
                  className="admin-form-input"
                />
              </div>
              <div className="col-span-2">
                <label className="admin-form-label">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="admin-form-textarea"
                  placeholder="Campaign description"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-title">
              <Settings2 size={16} /> Targeting & Rules
            </h3>
            <div className="admin-form-grid">
              <div className="col-span-2">
                <label className="admin-form-label">Applicable Scope</label>
                <select
                  className="admin-form-select mb-3"
                  value={scope}
                  onChange={(e) => handleScopeChange(e.target.value)}
                >
                  <option value="GLOBAL">Global (All Orders)</option>
                  <option value="LAB">Specific Lab(s)</option>
                  <option value="TEST">Specific Test(s)</option>
                  <option value="PACKAGE">Specific Package(s)</option>
                </select>

                {scope !== 'GLOBAL' && (
                  <MultiSelect
                    options={getScopeOptions()}
                    selected={selectedIds}
                    onChange={setSelectedIds}
                    placeholder={getScopePlaceholder()}
                  />
                )}
              </div>

              <div>
                <label className="admin-form-label">Min Order Value</label>
                <input
                  type="number"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Max Discount Cap</label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  className="admin-form-input"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="admin-form-label">Total Usage Limit</label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="admin-form-input"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="admin-form-label">Limit Per User</label>
                <input
                  type="number"
                  value={userLimit}
                  onChange={(e) => setUserLimit(e.target.value)}
                  className="admin-form-input"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-title">
              <Calendar size={16} /> Validity Window
            </h3>
            <div className="admin-form-grid">
              <div>
                <label className="admin-form-label">Start Date</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Expiry Date</label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="admin-form-input"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Save Coupon Changes
          </button>
        </form>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{coupon.code}</h3>
                  <p className="text-sm text-slate-500">
                    {coupon.isActive ? 'Coupon is available' : 'Coupon is currently paused'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Discount Type</span>
                  <span className="font-semibold text-slate-800">{coupon.discountType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Discount Value</span>
                  <span className="font-semibold text-slate-800">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : `Rs ${coupon.discountValue}`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Used Count</span>
                  <span className="font-semibold text-slate-800">{coupon.usedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Uses</span>
                  <span className="font-semibold text-slate-800">{coupon.ordersCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
