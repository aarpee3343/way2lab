'use client';

import { useState, useEffect } from 'react';
import { getTechnicianFormData, createTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, User, Key, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AddTechnicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    getTechnicianFormData().then(setLabs);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTechnicianAction(formData);
    
    setLoading(false);
    if (res.success) {
      toast.success("Technician Added Successfully");
      router.push('/admin/technicians');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Add Technician</h1>
          <p className="text-slate-500">Create a new account for lab staff</p>
        </div>
        <Link href="/admin/technicians" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} /> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <User size={18} className="text-blue-600"/> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name <span className="text-rose-500">*</span></label>
              <input name="name" required className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Phone Number <span className="text-rose-500">*</span></label>
              <input name="phone" required className="input-field" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="john@example.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea name="address" rows={2} className="input-field resize-none" placeholder="Residential Address" />
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Building2 size={18} className="text-emerald-600"/> Lab Assignment
          </h3>
          <div>
            <label className="label mb-3">Assign Labs <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {labs.map(lab => (
                <label key={lab.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                   <input type="checkbox" name="lab_ids" value={lab.id} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" />
                   <div>
                     <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">{lab.labName}</span>
                     <span className="block text-xs text-slate-400">{lab.city}</span>
                   </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Key size={18} className="text-purple-600"/> Security
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Username <span className="text-rose-500">*</span></label>
              <input name="username" required className="input-field" placeholder="username" />
            </div>
            <div>
              <label className="label">Password <span className="text-rose-500">*</span></label>
              <input name="password" type="password" required className="input-field" placeholder="••••••••" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Save Technician
        </button>

      </form>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wide; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400; }
      `}</style>
    </div>
  );
}