'use client';

import { useState } from 'react';
import { createTestAction } from '@/app/actions/adminInventoryActions';
import { Save, ArrowLeft, Loader2, FlaskConical, Clock, FileText, Banknote } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AddTestPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createTestAction(formData);

    setLoading(false);

    if (result?.success) {
      toast.success("Test Created Successfully!");
      router.push('/admin/tests'); 
    } else {
      toast.error(result?.error || "Failed to create test");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">New Entry</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add Diagnostic Test</h1>
          <p className="text-slate-500 mt-1">Configure details, pricing, and report settings</p>
        </div>
        <Link href="/admin/tests" className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: Core Identity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1">
              <div className="sticky top-24">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FlaskConical size={18}/></span>
                    Core Identity
                 </h3>
                 <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Set the fundamental details of the test. The slug will be auto-generated from the name if left blank.
                 </p>
              </div>
           </div>
           
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Test Name <span className="text-rose-500">*</span></label>
                  <input name="test_name" required className="input-field" placeholder="e.g. Complete Blood Count" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Slug (Optional)</label>
                  <div className="relative">
                     <span className="absolute left-3 top-3 text-slate-400 text-sm font-mono">/test/</span>
                     <input name="slug" className="input-field pl-14 font-mono text-sm" placeholder="auto-generated" />
                  </div>
                </div>
                <div>
                  <label className="label">Category <span className="text-rose-500">*</span></label>
                  <select name="category" required className="input-field appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NDc0OGIiIGNsYXNzPSJ3LTYgaC02Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xOSA5bDctNyA3LTdNMTE5IDlsNyA3IDctNyIvPjwvc3ZnPg==')] bg-no-repeat bg-[right_1rem_center] bg-[length:1em]">
                    <option value="" disabled selected>Select Category</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>
                <div>
                  <label className="label">Specialty <span className="text-rose-500">*</span></label>
                  <select name="specialty" required className="input-field appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NDc0OGIiIGNsYXNzPSJ3LTYgaC02Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xOSA5bDctNyA3LTdNMTE5IDlsNyA3IDctNyIvPjwvc3ZnPg==')] bg-no-repeat bg-[right_1rem_center] bg-[length:1em]">
                    <option value="" disabled selected>Select Specialty</option>
                    <option value="General">General Physician</option>
                    <option value="Heart">Cardiologist</option>
                    <option value="Diabetes">Diabetologist</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Short Description <span className="text-rose-500">*</span></label>
                  <textarea name="description" rows={3} required className="input-field resize-none" placeholder="Brief overview of the test..." />
                </div>
              </div>
           </div>
        </div>

        {/* SECTION 2: Clinical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1">
              <div className="sticky top-24">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><FileText size={18}/></span>
                    Clinical Details
                 </h3>
                 <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Important instructions for the patient and technician to ensure accurate results.
                 </p>
              </div>
           </div>
           
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-2 gap-5">
                 <div className="col-span-2">
                  <label className="label">Preparation Instructions</label>
                  <textarea name="preparation" rows={2} className="input-field resize-none" placeholder="e.g. 12 hours fasting required, drink water only..." />
                </div>
                <div className="col-span-2">
                  <label className="label">Technician Notes</label>
                  <textarea name="special_instruction" rows={2} className="input-field resize-none" placeholder="Specific sampling instructions (e.g. use green vial)..." />
                </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: Pricing & Config */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1">
              <div className="sticky top-24">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Banknote size={18}/></span>
                    Pricing & Config
                 </h3>
                 <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Set the base price (can be overridden per lab) and display settings.
                 </p>
              </div>
           </div>
           
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="label">Base Price (₹) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input type="number" name="price" required step="0.01" className="input-field pl-8 font-bold text-slate-700" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="label">Discount (%)</label>
                  <div className="relative">
                    <input type="number" name="discount" step="0.01" className="input-field pr-8" placeholder="0" />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="label">Report Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3 text-slate-400"/>
                    <input name="schedule_reporting" className="input-field pl-9" placeholder="e.g. 24 Hours" />
                  </div>
                </div>
                
                <div className="col-span-3 pt-4 border-t border-slate-100 flex gap-6">
                   <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <input type="checkbox" name="is_active" defaultChecked className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all" />
                      <div>
                         <span className="block text-sm font-bold text-slate-700">Active Test</span>
                         <span className="block text-xs text-slate-400">Visible for booking</span>
                      </div>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <input type="checkbox" name="show_on_homepage" className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all" />
                      <div>
                         <span className="block text-sm font-bold text-slate-700">Featured</span>
                         <span className="block text-xs text-slate-400">Show on homepage</span>
                      </div>
                   </label>
                </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 lg:pl-72 flex justify-end gap-4">
           <Link href="/admin/tests" className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
             Cancel
           </Link>
           <button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {loading ? 'Saving Test...' : 'Save & Publish'}
          </button>
        </div>

      </form>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400; }
      `}</style>
    </div>
  );
}