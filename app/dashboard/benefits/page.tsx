'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useCartStore } from '@/store/useCartStore';
import { 
  Gift, ArrowLeft, Loader2, Calendar, 
  ChevronRight, ShieldCheck, Zap 
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function EmployeeBenefits() {
  const router = useRouter();
  const { setLabCart, clearCart } = useCartStore();
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        // ✅ No headers needed
        const res = await axios.get('/api/user/benefits');
        setBenefits(res.data);
      } catch (err) {
        toast.error("Failed to load corporate benefits");
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  const handleClaim = (benefit: any) => {
    if (!benefit.defaultLab) {
      toast.error("No lab assigned to this package. Contact Support.");
      return;
    }

    clearCart();

    // Fill cart with Corporate Logic
    setLabCart(
      { 
        labId: benefit.defaultLab.id, 
        labName: benefit.defaultLab.labName, 
        servicePincode: benefit.defaultLab.pincode 
      },
      [{ 
        id: benefit.id, 
        name: benefit.packageName, 
        type: 'package', 
        price: benefit.paymentType === 'CORPORATE_PAYS' ? 0 : benefit.originalPrice, 
        basePrice: benefit.originalPrice,
        labId: benefit.defaultLab.id,
        labName: benefit.defaultLab.labName
      }]
    );

    toast.success(`${benefit.packageName} added to cart!`);
    router.push('/checkout/details');
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p className="font-medium text-sm uppercase tracking-widest">Checking Eligibility...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-all text-xs font-bold uppercase tracking-widest mb-2">
            <ArrowLeft size={14}/> Back
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Gift className="text-blue-600" /> Exclusive Benefits
          </h1>
        </div>
      </header>

      {benefits.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No active corporate services</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">It looks like your organization hasn't assigned any active health packages to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {benefits.map((b) => (
            <div key={b.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">{b.category}</span>
                  <h3 className="text-lg font-black text-slate-800 mt-1">{b.packageName}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                    <p className="flex items-center gap-1"><Calendar size={12}/> Valid till {new Date(b.validTill).toLocaleDateString()}</p>
                    <p className="text-emerald-600 uppercase">Covered by Corporate</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleClaim(b)}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                Claim Now <ChevronRight size={18}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 blur-3xl -mr-16 -mt-16" />
        <h4 className="text-lg font-black mb-2">How it works?</h4>
        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">
          These benefits are sponsored by your organization. Once you claim a package, 
          you can book your appointment immediately. If "CORPORATE PAYS" is active, 
          your final payable amount will be ₹0.
        </p>
      </div>
    </div>
  );
}