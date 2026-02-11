'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCorporateAction } from '@/app/actions/adminCorporateActions';
import { toast } from '@/lib/safe-toast';
import { Save, Loader2 } from 'lucide-react';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Input from '@/components/admin/corporate/Input';

export default function CreateCorporate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const res = await createCorporateAction(data);
    if (res.success) {
      toast.success("Corporate Created!");
      router.push(`/admin/corporates/${res.corporateId}`);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto admin-space-y">
      <h1 className="admin-page-title mb-6">Onboard New Corporate</h1>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Corporate Name" name="companyName" required className="col-span-2 text-lg font-bold" placeholder="Acme Industries Ltd." />
          <Input label="Contact Person" name="contactPerson" required placeholder="HR Manager Name" />
          <Input label="Phone Number" name="phone" required placeholder="+91..." />
          <Input label="Official Email (Login ID)" name="email" type="email" required placeholder="admin@company.com" />
          <Input label="Password" name="password" type="password" required placeholder="••••••••" />

          <hr className="col-span-2 my-2" />

          <Input label="Address" name="address" className="col-span-2" placeholder="Street / Building" />
          <Input label="City" name="city" />
          <Input label="State" name="state" />
          <Input label="Pincode" name="pincode" />
          <Input label="PAN Number" name="panNumber" className="uppercase" />
          <Input label="GSTIN" name="gstin" className="uppercase" />
          <Input label="Est. Employee Count" name="employeeCount" type="number" />

          <div className="col-span-2 pt-4">
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Create Corporate
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

