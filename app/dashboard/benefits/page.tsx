'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useCartStore } from '@/store/useCartStore';
import {
  Gift,
  ArrowLeft,
  Loader2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap,
  MapPin
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';

type BenefitItem = {
  id: number;
  packageName: string;
  category: string;
  validTill: string;
  serviceId?: number;
  selfPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
  familyPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
  selfUsageLimit: number;
  familyUsageLimit: number;
  selfRemaining: number;
  familyRemaining: number;
  eligibleSelf: boolean;
  eligibleFamily: boolean;
  originalPrice?: number;
};

export default function EmployeeBenefits() {
  const router = useRouter();
  const { setLabCart, clearCart } = useCartStore();
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [pincode, setPincode] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [expandedBenefitId, setExpandedBenefitId] = useState<number | null>(null);
  const [loadingBenefitId, setLoadingBenefitId] = useState<number | null>(null);
  const [labResults, setLabResults] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const res = await axios.get('/api/user/benefits', { withCredentials: true });
        setBenefits(res.data);
      } catch (err) {
        toast.error('Failed to load corporate benefits');
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  const handleSetPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    setPincode(pin);
    setLabResults({});
    setExpandedBenefitId(null);
    toast.success(`Pincode set to ${pin}`);
  };

  const fetchLabsForBenefit = async (benefit: BenefitItem) => {
    if (!pincode) {
      toast.error('Set a pincode first to check lab availability');
      return;
    }

    setLoadingBenefitId(benefit.id);
    try {
    const payload = {
      items: [{ id: benefit.id, name: benefit.packageName, type: 'package' }],
      pincode
    };
      const res = await axios.post('/api/search/labs/search', payload, { withCredentials: true });
      setLabResults(prev => ({ ...prev, [benefit.id]: res.data || [] }));
      setExpandedBenefitId(benefit.id);
    } catch (err) {
      toast.error('Failed to load labs for this pincode');
    } finally {
      setLoadingBenefitId(null);
    }
  };

  const toggleLabs = (benefit: BenefitItem) => {
    if (expandedBenefitId === benefit.id) {
      setExpandedBenefitId(null);
      return;
    }

    if (labResults[benefit.id]) {
      setExpandedBenefitId(benefit.id);
      return;
    }

    fetchLabsForBenefit(benefit);
  };

  const handleBook = (benefit: BenefitItem, labData: any) => {
    const item = labData?.foundItems?.[0];
    if (!item || !labData?.lab) {
      toast.error('Selected lab is missing required data');
      return;
    }

    const basePrice = Number(item.labItemMRP || benefit.originalPrice || 0);
    const sellingPrice = Number(item.labItemPrice || basePrice);

    clearCart();
    setLabCart(
      {
        labId: labData.lab.id,
        labName: labData.lab.labName,
        servicePincode: pincode,
        homeCollectionCharges: Number(labData.lab.homeCollectionCharges || 0)
      },
      [
        {
          id: benefit.id,
          name: benefit.packageName,
          type: 'package',
          price: sellingPrice,
          basePrice,
          isCorporate: true,
          corporatePaymentSelf: benefit.selfPaymentType,
          corporatePaymentFamily: benefit.familyPaymentType,
          corporateServiceId: benefit.serviceId,
          labId: labData.lab.id,
          labName: labData.lab.labName
        }
      ]
    );

    toast.success(`${benefit.packageName} added to cart`);
    router.push('/checkout/details');
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="font-medium text-sm uppercase tracking-widest">Checking eligibility...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-all text-xs font-bold uppercase tracking-widest mb-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Gift className="text-blue-600" /> Exclusive Benefits
          </h1>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Service Pincode</h3>
            <p className="text-xs text-slate-500">Enter a 6-digit pincode to see labs for your benefits.</p>
          </div>
        </div>
        <form onSubmit={handleSetPincode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            maxLength={6}
            placeholder="e.g. 122001"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-mono text-lg"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-black"
          >
            Set Pincode
          </button>
        </form>
        {pincode ? (
          <p className="text-xs text-emerald-600 font-semibold mt-2">Using pincode: {pincode}</p>
        ) : null}
      </div>

      {benefits.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No active corporate services</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">
            It looks like your organization has not assigned any active health packages to you yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {benefits.map((b) => {
            const labs = labResults[b.id] || [];
            const isExpanded = expandedBenefitId === b.id;
            const canUse = b.eligibleSelf || b.eligibleFamily;
            const selfPayLabel = b.selfPaymentType === 'CORPORATE_PAYS' ? 'Covered' : 'Self Pay';
            const familyPayLabel = b.familyPaymentType === 'CORPORATE_PAYS' ? 'Covered' : 'Self Pay';
            return (
              <div key={b.id} className="space-y-3">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Zap size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                        {b.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-800 mt-1">{b.packageName}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                        <p className="flex items-center gap-1">
                          <Calendar size={12} /> Valid till {new Date(b.validTill).toLocaleDateString()}
                        </p>
                        <p className="text-emerald-600 uppercase">
                          Self: {selfPayLabel} â€¢ Family: {familyPayLabel}
                        </p>
                        <p className="text-slate-400 uppercase">
                          Self Remaining: {b.selfRemaining} â€¢ Family Remaining: {b.familyRemaining}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!canUse) {
                        toast.error('Usage limit reached for both self and family.');
                        return;
                      }
                      toggleLabs(b);
                    }}
                    disabled={!canUse}
                    className={`w-full md:w-auto px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      canUse
                        ? 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingBenefitId === b.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Checking
                      </>
                    ) : (
                      <>
                        {isExpanded ? 'Hide Labs' : 'Choose Lab'} <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    {labs.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No labs found for this benefit in pincode {pincode}.
                      </p>
                    ) : (
                      labs.map((labData: any) => {
                        const item = labData.foundItems?.[0];
                        const basePrice = Number(item?.labItemMRP || 0);
                        const sellingPrice = Number(item?.labItemPrice || 0);
                        const payableSelf =
                          b.selfPaymentType === 'CORPORATE_PAYS' ? 0 : sellingPrice;
                        const payableFamily =
                          b.familyPaymentType === 'CORPORATE_PAYS' ? 0 : sellingPrice;

                        return (
                          <div
                            key={labData.lab.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div>
                              <h4 className="font-bold text-slate-800">{labData.lab.labName}</h4>
                              <p className="text-xs text-slate-500">
                                Home collection: INR {Number(labData.lab.homeCollectionCharges || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500">
                                MRP: INR {basePrice.toLocaleString()} - Discount {Number(item?.labItemDiscount || 0)}%
                              </p>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <div className="text-sm font-bold text-slate-900">
                                Self Payable: INR {payableSelf.toLocaleString()}
                              </div>
                              <div className="text-xs font-semibold text-slate-500">
                                Family Payable: INR {payableFamily.toLocaleString()}
                              </div>
                              <button
                                onClick={() => handleBook(b, labData)}
                                disabled={!canUse}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm ${
                                  canUse
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Book with this lab
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 blur-3xl -mr-16 -mt-16" />
        <h4 className="text-lg font-black mb-2">How it works?</h4>
        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">
          These benefits are sponsored by your organization. Choose a lab that serves your pincode
          and continue to checkout. If corporate pays is active, your final payable amount is INR 0.
        </p>
      </div>
    </div>
  );
}
