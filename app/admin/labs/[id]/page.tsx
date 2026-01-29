'use client';

import { useState, useEffect, use } from 'react'; // ✅ Import 'use'
import { getLabFormData, getLabById, updateLabAction } from '@/app/actions/adminLabActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Package, FlaskConical, CheckCircle2, ArrowRight, ArrowLeft 
} from 'lucide-react';

// ✅ Fix Type Definition: params is a Promise
export default function EditLabPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // ✅ Fix: Unwrap params using React.use()
  const { id } = use(params);
  const labId = Number(id);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [form, setForm] = useState({
    labName: '', contactNo: '', email: '', 
    address: '', city: '', pincode: '', homeCollectionCharges: 0,
    pincodesStr: '', 
    packages: [] as any[],
    tests: [] as any[]
  });

  useEffect(() => {
    async function init() {
      // 1. Fetch available items (Tests/Packages)
      const available = await getLabFormData();
      
      // 2. Fetch current Lab data
      if (!labId) return; // Guard against invalid ID
      const labData = await getLabById(labId);
      
      if (!labData) {
        toast.error("Lab not found");
        router.push('/admin/labs');
        return;
      }

      // 3. Merge: Map available items and mark 'selected' if lab has them
      const mergedPackages = available.packages.map(p => {
        const existing = labData.packages.find((lp: any) => lp.id === p.id);
        return existing 
          ? { ...p, ...existing, selected: true } 
          : { ...p, selected: false, price: 0, discount: 0 };
      });

      const mergedTests = available.tests.map(t => {
        const existing = labData.tests.find((lt: any) => lt.id === t.id);
        return existing 
          ? { ...t, ...existing, selected: true } 
          : { ...t, selected: false, price: 0, discount: 0 };
      });

      setForm({
        ...labData,
        // @ts-ignore
        homeCollectionCharges: Number(labData.homeCollectionCharges),
        packages: mergedPackages,
        tests: mergedTests
      });
      setLoading(false);
    }
    init();
  }, [labId, router]);

  const handleNext = () => setStep(prev => prev + 1);

  const handleSubmit = async () => {
    const pincodes = form.pincodesStr.split(',').map(s => s.trim()).filter(Boolean);
    const payload = { ...form, pincodes };
    
    const res = await updateLabAction(labId, payload);
    
    if (res.success) {
      toast.success("Lab Updated Successfully!");
      router.push('/admin/labs');
    } else {
      toast.error("Failed to update lab");
    }
  };

  const toggleItem = (type: 'packages' | 'tests', id: number, field: string, val: any) => {
    setForm(prev => ({
      ...prev,
      [type]: prev[type].map((item: any) => 
        item.id === id ? { ...item, [field]: val } : item
      )
    }));
  };

  if(loading) return <div className="p-10 text-center">Loading Lab Data...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 px-10">
        {[
          { id: 1, label: "Lab Info", icon: Building2 },
          { id: 2, label: "Service Area", icon: MapPin },
          { id: 3, label: "Packages", icon: Package },
          { id: 4, label: "Tests", icon: FlaskConical },
        ].map((s) => (
          <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>
              <s.icon size={18} />
            </div>
            <span className="text-xs font-bold uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Edit Lab Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="label">Lab Name</label>
                <input className="input-field" value={form.labName} onChange={e => setForm({...form, labName: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="label">Contact Number</label>
                <input className="input-field" value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="label">Full Address</label>
                <input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input-field" maxLength={6} value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
              </div>
              <div>
                <label className="label">Home Collection Charges (₹)</label>
                <input type="number" className="input-field" value={form.homeCollectionCharges} onChange={e => setForm({...form, homeCollectionCharges: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Service Area */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Serviceable Pincodes</h3>
            <textarea 
              className="input-field h-40 font-mono text-sm" 
              placeholder="110001, 110002..."
              value={form.pincodesStr}
              onChange={e => setForm({...form, pincodesStr: e.target.value})}
            />
          </div>
        )}

        {/* STEP 3 & 4: Inventory */}
        {(step === 3 || step === 4) && (
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Manage {step === 3 ? 'Packages' : 'Tests'}</h3>
            <div className="h-96 overflow-y-auto border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" /></th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 w-32">Price (₹)</th>
                    <th className="px-4 py-3 w-32">Discount (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form[step === 3 ? 'packages' : 'tests'].map((item: any) => (
                    <tr key={item.id} className={item.selected ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={item.selected} 
                          onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'selected', e.target.checked)} 
                        />
                      </td>
                      <td className="px-4 py-2 font-medium">{step === 3 ? item.packageName : item.testName}</td>
                      <td className="px-4 py-2">
                        <input type="number" className="input-field py-1 h-8" value={item.price} disabled={!item.selected}
                          onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'price', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="input-field py-1 h-8" value={item.discount} disabled={!item.selected}
                          onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'discount', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between">
          <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-6 py-2.5 rounded-xl border border-slate-300 font-bold disabled:opacity-50 hover:bg-white transition-colors">Back</button>
          {step < 4 ? (
            <button onClick={handleNext} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Next</button>
          ) : (
            <button onClick={handleSubmit} className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg transition-colors">Update Lab</button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1; }
        .input-field { @apply w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all; }
      `}</style>
    </div>
  );
}