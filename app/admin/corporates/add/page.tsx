'use client';

import { useState } from 'react';
import { createCorporateAction } from '@/app/actions/adminCorporateActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AddCorporatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const res = await createCorporateAction(data);
    
    if (res.success) {
      toast.success("Corporate Added Successfully");
      router.push('/admin/corporates');
    } else {
      toast.error("Failed to add corporate");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/corporates" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft/></Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">New Corporate</h1>
          <p className="text-slate-500">Onboard a new company</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
          <input name="companyName" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Acme Corp" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
            <input name="contactPerson" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
            <input name="phone" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="+91..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Corporate Email (Login ID)</label>
          <input name="email" type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="admin@acme.com" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Set Password</label>
          <input name="password" type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="••••••••" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
          <textarea name="address" rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Registered Office Address" />
        </div>

        <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Create Account
        </button>
      </form>
    </div>
  );
}