// app/admin/coupons/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createCouponAction, getCouponFormData } from '@/app/actions/adminCouponActions';
import MultiSelect from '@/components/ui/MultiSelect';
import { Ticket, Save, ArrowLeft, Calendar, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/safe-toast';
import { useRouter } from 'next/navigation';
import { getISTDateTimeLocalValue } from '@/lib/date-time';

export default function CreateCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({ labs: [], tests: [], packages: [] });
  
  // Form State
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState('GLOBAL');
  const [startDate, setStartDate] = useState(getISTDateTimeLocalValue());
  const [expiryDate, setExpiryDate] = useState('');
  
  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getCouponFormData().then(setFormData);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      code, description: desc, discountType: type, discountValue: value,
      couponScope: scope, startDate, expiryDate,
      // Dynamic fields based on form inputs (simplified for brevity)
      minOrderValue: (e.target as any).minOrderValue.value,
      maxDiscountAmount: (e.target as any).maxDiscountAmount?.value,
      usageLimit: (e.target as any).usageLimit.value,
      userLimit: (e.target as any).userLimit.value,
      // Mapping selected IDs to correct field
      labIds: scope === 'LAB' ? selectedIds : [],
      testIds: scope === 'TEST' ? selectedIds : [],
      packageIds: scope === 'PACKAGE' ? selectedIds : [],
    };

    const res = await createCouponAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success("Coupon Created Successfully!");
      router.push('/admin/coupons');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="admin-page-title">Create Offer</h1>
          <p className="admin-page-subtitle">Design a new discount campaign</p>
        </div>
        <Link href="/admin/coupons" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form id="coupon-form" onSubmit={handleSubmit} className="admin-space-y">
            
            {/* 1. Basic Details */}
            <div className="admin-form-section">
              <h3 className="admin-form-title">
                Campaign Basics
              </h3>
              <div className="admin-form-grid">
                <div className="col-span-2 sm:col-span-1">
                  <label className="admin-form-label">Coupon Code *</label>
                  <div className="relative">
                    <input 
                      required 
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="admin-form-input pl-10 font-mono tracking-wider font-bold text-slate-700" 
                      placeholder="SUMMER2026" 
                      maxLength={15}
                    />
                    <Ticket className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="admin-form-label">Description</label>
                  <input className="admin-form-input" placeholder="e.g. Summer Sale 20% Off" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 2. Discount Rules */}
            <div className="admin-form-section">
               <h3 className="admin-form-title">
                Value & Rules
              </h3>
              <div className="admin-form-grid">
                <div>
                   <label className="admin-form-label">Discount Type</label>
                   <div className="flex p-1 bg-slate-100 rounded-lg">
                      <button type="button" onClick={() => setType('PERCENTAGE')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${type === 'PERCENTAGE' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>% Percentage</button>
                      <button type="button" onClick={() => setType('FIXED')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${type === 'FIXED' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>₹ Fixed Amount</button>
                   </div>
                </div>
                <div>
                  <label className="admin-form-label">Discount Value *</label>
                  <input required type="number" className="admin-form-input" placeholder={type === 'PERCENTAGE' ? '20' : '500'} value={value} onChange={e => setValue(e.target.value)} />
                </div>
                
                {type === 'PERCENTAGE' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="admin-form-label">Max Discount Cap (₹)</label>
                    <input name="maxDiscountAmount" type="number" className="admin-form-input" placeholder="e.g. 500 (Optional)" />
                  </div>
                )}
                <div>
                    <label className="admin-form-label">Min Order Value (₹)</label>
                    <input name="minOrderValue" type="number" className="admin-form-input" placeholder="0" defaultValue="0" />
                </div>
              </div>
            </div>

            {/* 3. Scope & Validity */}
            <div className="admin-form-section">
               <h3 className="admin-form-title">
                Targeting & Limits
              </h3>
              
              <div>
                <label className="admin-form-label">Applicable Scope</label>
                <select className="admin-form-select mb-3" value={scope} onChange={e => { setScope(e.target.value); setSelectedIds([]); }}>
                  <option value="GLOBAL">Global (All Orders)</option>
                  <option value="LAB">Specific Lab(s)</option>
                  <option value="TEST">Specific Test(s)</option>
                  <option value="PACKAGE">Specific Package(s)</option>
                </select>

                {/* DYNAMIC MULTI-SELECT */}
                {scope === 'LAB' && <MultiSelect options={formData.labs} selected={selectedIds} onChange={setSelectedIds} placeholder="Select Labs..." />}
                {scope === 'TEST' && <MultiSelect options={formData.tests} selected={selectedIds} onChange={setSelectedIds} placeholder="Select Tests..." />}
                {scope === 'PACKAGE' && <MultiSelect options={formData.packages} selected={selectedIds} onChange={setSelectedIds} placeholder="Select Packages..." />}
              </div>

              <div className="admin-form-grid">
                 <div>
                    <label className="admin-form-label">Start Date</label>
                    <input name="startDate" type="datetime-local" className="admin-form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                 </div>
                 <div>
                    <label className="admin-form-label">Expiry Date</label>
                    <input name="expiryDate" type="datetime-local" className="admin-form-input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                 </div>
                 <div>
                    <label className="admin-form-label">Total Usage Limit</label>
                    <input name="usageLimit" type="number" className="admin-form-input" placeholder="Unlimited" />
                 </div>
                 <div>
                    <label className="admin-form-label">Limit Per User</label>
                    <input name="userLimit" type="number" className="admin-form-input" defaultValue="1" />
                 </div>
              </div>
            </div>

          </form>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="admin-form-label text-center">Live Preview</h3>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group mb-6">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10" />

              <div className="relative z-10 flex flex-col h-full min-h-[200px] justify-between">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      <Sparkles size={18} className="text-yellow-400" />
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase">Discount</p>
                      <p className="text-2xl font-black text-white">
                        {type === 'PERCENTAGE' ? `${value || 0}%` : `₹${value || 0}`}
                      </p>
                   </div>
                </div>

                <div className="my-6 border-t border-dashed border-white/20 relative">
                   <div className="absolute -left-8 -top-3 w-6 h-6 bg-slate-50 rounded-full" />
                   <div className="absolute -right-8 -top-3 w-6 h-6 bg-slate-50 rounded-full" />
                </div>

                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase mb-1">Coupon Code</p>
                   <div className="bg-white/10 border border-white/10 rounded-lg p-3 text-center backdrop-blur-md">
                      <span className="font-mono text-xl font-bold tracking-widest text-white">{code || 'CODE'}</span>
                   </div>
                   {desc && <p className="text-center text-xs text-slate-400 mt-3">{desc}</p>}
                </div>
              </div>
            </div>

            <button 
              form="coupon-form"
              disabled={loading}
              className="admin-btn-primary w-full py-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Create Coupon
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              This coupon will be immediately available for use upon creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
