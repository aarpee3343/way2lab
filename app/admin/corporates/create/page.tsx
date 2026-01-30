'use client';
import { useState } from 'react';
import { createCorporateAction } from '@/app/actions/adminCorporateActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function CreateCorporate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const res = await createCorporateAction(data);
    if(res.success) {
      toast.success("Corporate Created!");
      router.push(`/admin/corporates/${res.corporateId}`);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-6">Onboard New Corporate</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="label">Corporate Name</label>
            <input name="companyName" required className="input-field text-lg font-bold" placeholder="Acme Industries Ltd." />
          </div>
          <div>
            <label className="label">Contact Person</label>
            <input name="contactPerson" required className="input-field" placeholder="HR Manager Name" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input name="phone" required className="input-field" placeholder="+91..." />
          </div>
          <div>
            <label className="label">Official Email (Login ID)</label>
            <input name="email" type="email" required className="input-field" placeholder="admin@company.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required className="input-field" placeholder="••••••••" />
          </div>
        </div>

        <hr />

        {/* Address & Legal */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-3">
            <label className="label">Address</label>
            <input name="address" className="input-field" placeholder="Street / Building" />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" className="input-field" />
          </div>
          <div>
            <label className="label">State</label>
            <input name="state" className="input-field" />
          </div>
          <div>
            <label className="label">Pincode</label>
            <input name="pincode" className="input-field" />
          </div>
          <div>
            <label className="label">PAN Number</label>
            <input name="panNumber" className="input-field uppercase" />
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input name="gstin" className="input-field uppercase" />
          </div>
          <div>
            <label className="label">Est. Employee Count</label>
            <input name="employeeCount" type="number" className="input-field" />
          </div>
        </div>

        <div className="pt-4">
          <button disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Save size={18} />} Create Corporate
          </button>
        </div>
      </form>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all; }
        .btn-primary { @apply bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-70; }
      `}</style>
    </div>
  );
}