// app/admin/corporates/create/page.tsx
'use client';
import { useState } from 'react';
import { createCorporateAction } from '@/app/actions/adminCorporateActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
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
      <h1 className="admin-page-title mb-6">Onboard New Corporate</h1>
      
      <form onSubmit={handleSubmit} className="admin-form-section space-y-6">
        {/* Basic Info */}
        <div className="admin-form-grid">
          <div className="col-span-2">
            <label className="admin-form-label">Corporate Name</label>
            <input name="companyName" required className="admin-form-input text-lg font-bold" placeholder="Acme Industries Ltd." />
          </div>
          <div>
            <label className="admin-form-label">Contact Person</label>
            <input name="contactPerson" required className="admin-form-input" placeholder="HR Manager Name" />
          </div>
          <div>
            <label className="admin-form-label">Phone Number</label>
            <input name="phone" required className="admin-form-input" placeholder="+91..." />
          </div>
          <div>
            <label className="admin-form-label">Official Email (Login ID)</label>
            <input name="email" type="email" required className="admin-form-input" placeholder="admin@company.com" />
          </div>
          <div>
            <label className="admin-form-label">Password</label>
            <input name="password" type="password" required className="admin-form-input" placeholder="••••••••" />
          </div>
        </div>

        <hr />

        {/* Address & Legal */}
        <div className="admin-form-grid">
          <div className="col-span-3">
            <label className="admin-form-label">Address</label>
            <input name="address" className="admin-form-input" placeholder="Street / Building" />
          </div>
          <div>
            <label className="admin-form-label">City</label>
            <input name="city" className="admin-form-input" />
          </div>
          <div>
            <label className="admin-form-label">State</label>
            <input name="state" className="admin-form-input" />
          </div>
          <div>
            <label className="admin-form-label">Pincode</label>
            <input name="pincode" className="admin-form-input" />
          </div>
          <div>
            <label className="admin-form-label">PAN Number</label>
            <input name="panNumber" className="admin-form-input uppercase" />
          </div>
          <div>
            <label className="admin-form-label">GSTIN</label>
            <input name="gstin" className="admin-form-input uppercase" />
          </div>
          <div>
            <label className="admin-form-label">Est. Employee Count</label>
            <input name="employeeCount" type="number" className="admin-form-input" />
          </div>
        </div>

        <div className="pt-4">
          <button disabled={loading} className="admin-btn-primary w-full flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Save size={18} />} Create Corporate
          </button>
        </div>
      </form>
    </div>
  );
}