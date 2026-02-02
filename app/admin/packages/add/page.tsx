'use client';

import { useState, useEffect } from 'react';
import { getPackageFormData, createPackageAction } from '@/app/actions/adminPackageActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calculator,
  Check,
  Search,
  Box,
  FileText,
  Building,
} from 'lucide-react';
import Link from 'next/link';

export default function AddPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- NEW STATES ---
  const [isCorporate, setIsCorporate] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    getPackageFormData().then(setTests);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Logic: General is active by default (true), Corporate is inactive (false)
    const defaultStatus = isCorporate ? 'off' : 'on';
    formData.append('is_active', defaultStatus);

    const res = await createPackageAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success('Package Created Successfully');
      router.push('/admin/packages');
    } else {
      toast.error(res.error);
    }
  };

  const filteredTests = tests.filter(t =>
    t.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const finalPrice = basePrice - (basePrice * discount) / 100;

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">
              New Bundle
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Create Health Package
          </h1>
          <p className="text-slate-500 mt-1">
            Bundle multiple tests together for better value.
          </p>
        </div>

        <Link
          href="/admin/packages"
          className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Box size={18} />
              </span>
              Package Details
            </h3>

            <div className="space-y-5">
              <div>
                <label className="label">Package Name *</label>
                <input name="package_name" required className="input-field text-lg font-semibold" />
              </div>

              {/* --- STEP 1: THE TOGGLE CHECKBOX --- */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <input 
                  type="checkbox" 
                  name="isCorporate" 
                  id="corpToggle"
                  className="w-5 h-5 rounded accent-purple-600"
                  checked={isCorporate}
                  onChange={(e) => setIsCorporate(e.target.checked)}
                />
                <label htmlFor="corpToggle" className="text-sm font-bold text-purple-900 cursor-pointer">
                  Is this a Corporate Specific Package?
                </label>
              </div>

              {/* --- STEP 2: CONDITIONAL CORPORATE SETTINGS --- */}
              {isCorporate && (
                <div className="grid grid-cols-2 gap-5 py-6 border-y border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-3">
                    <label className="label flex items-center gap-2">
                      <Building size={14} /> Corporate Settings
                    </label>
                    <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isPreEmployment" className="w-4 h-4" />
                        <span className="text-sm font-bold text-slate-700">Pre-Employment</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="label">Package Category</label>
                    <select name="category" className="input-field">
                      <option value="ANNUAL">Annual Health Checkup</option>
                      <option value="PRE_EMPLOYMENT">Pre-Employment Checkup</option>
                      <option value="EXECUTIVE">Executive Health Check</option>
                      <option value="BLUE_COLLAR">Blue-Collar Package</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Summary of benefits..."
                  />
                </div>

                <div>
                  <label className="label">Preparation</label>
                  <textarea
                    name="preparation"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Fasting instructions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tests Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} />
                Included Tests
              </h3>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  placeholder="Search tests..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-56"
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-2">
              {filteredTests.map(test => (
                <label
                  key={test.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 cursor-pointer mb-1"
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="test_ids" value={test.id} />
                    <span className="font-bold">{test.testName}</span>
                  </div>
                  <span className="text-sm font-bold">₹{test.price}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – PRICING */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calculator size={18} /> Pricing
            </h3>

            <input
              type="number"
              name="price"
              className="input-field mb-3"
              placeholder="Base Price"
              onChange={e => setBasePrice(+e.target.value || 0)}
            />

            <input
              type="number"
              name="discount"
              className="input-field"
              placeholder="Discount %"
              onChange={e => setDiscount(+e.target.value || 0)}
            />

            <div className="mt-4 font-bold">
              Final Price: ₹{Math.round(finalPrice)}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save />}
            Save & Publish
          </button>
        </div>
      </form>

      <style jsx>{`
        .label {
          @apply block text-xs font-bold text-slate-500 uppercase mb-1;
        }
        .input-field {
          @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm;
        }
      `}</style>
    </div>
  );
}
