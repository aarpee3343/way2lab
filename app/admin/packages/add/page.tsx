'use client';

import { useState, useEffect } from 'react';
import { getPackageFormData, createPackageAction } from '@/app/actions/adminPackageActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Calculator, Check, Search, Box, FileText } from 'lucide-react';
import Link from 'next/link';

export default function AddPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    getPackageFormData().then(setTests);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createPackageAction(formData);
    
    setLoading(false);
    if (res.success) {
      toast.success("Package Created Successfully");
      router.push('/admin/packages');
    } else {
      toast.error(res.error);
    }
  };

  const filteredTests = tests.filter(t => t.testName.toLowerCase().includes(searchQuery.toLowerCase()));
  const finalPrice = basePrice - (basePrice * discount / 100);

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">New Bundle</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Health Package</h1>
          <p className="text-slate-500 mt-1">Bundle multiple tests together for better value.</p>
        </div>
        <Link href="/admin/packages" className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Box size={18}/></span>
               Package Details
            </h3>
            <div className="space-y-5">
              <div>
                <label className="label">Package Name <span className="text-rose-500">*</span></label>
                <input name="package_name" required className="input-field text-lg font-semibold" placeholder="e.g. Master Health Checkup" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="label">Description</label>
                    <textarea name="description" rows={3} className="input-field resize-none" placeholder="Summary of benefits..." />
                 </div>
                 <div>
                    <label className="label">Preparation</label>
                    <textarea name="preparation" rows={3} className="input-field resize-none" placeholder="Fasting instructions..." />
                 </div>
              </div>
            </div>
          </div>

          {/* Card 2: Tests Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><FileText size={18}/></span>
                 Included Tests
              </h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tests..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-56 transition-all"
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl pr-1 custom-scrollbar bg-slate-50/50">
              <div className="space-y-1 p-2">
                {filteredTests.map(test => (
                  <label key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                         <input type="checkbox" name="test_ids" value={test.id} className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all" />
                         <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={4} />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{test.testName}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">₹{test.price}</span>
                  </label>
                ))}
                {filteredTests.length === 0 && <div className="text-center text-slate-400 py-12 text-sm">No tests found matching "{searchQuery}"</div>}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-right">Select all tests included in this bundle</p>
          </div>

        </div>

        {/* RIGHT COLUMN: Pricing */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calculator size={18} className="text-blue-600" /> Pricing Calculator
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="label">Base Price (₹) <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold group-focus-within:text-blue-500 transition-colors">₹</span>
                  <input 
                    type="number" name="price" required step="0.01" 
                    className="input-field pl-8 font-bold text-slate-700 text-lg" 
                    placeholder="0.00"
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Discount (%)</label>
                <div className="relative group">
                  <input 
                    type="number" name="discount" step="0.01" max="100"
                    className="input-field pr-8" 
                    placeholder="0"
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-3 text-slate-400 font-bold group-focus-within:text-blue-500 transition-colors">%</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4 space-y-3">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Savings</span>
                  <span className="text-emerald-600 font-bold">- ₹{Math.round(basePrice - finalPrice)}</span>
                </div>
                <div className="h-px bg-slate-200 w-full" />
                <div className="flex justify-between text-xl font-black text-slate-900 items-baseline">
                  <span>Final</span>
                  <span>₹{Math.round(finalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="relative flex items-center">
               <input type="checkbox" name="is_active" defaultChecked className="peer sr-only" id="active_toggle" />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </div>
            <label htmlFor="active_toggle" className="cursor-pointer select-none">
               <span className="block font-bold text-slate-700 text-sm">Active Package</span>
               <span className="block text-xs text-slate-400">Visible to customers</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Save & Publish
          </button>

        </div>

      </form>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wide; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}