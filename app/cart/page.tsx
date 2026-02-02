'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Ticket, ChevronRight, Hospital, ChevronDown, ChevronUp, Lock, X, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/lib/safe-toast';

// --- HELPERS ---
const formatPrice = (price: any) => {
  if (price === undefined || price === null) return '0';
  const num = Number(price);
  return isNaN(num) ? '0' : num.toLocaleString();
};

const getSafeNumber = (value: any, defaultValue = 0) => {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

export default function CartPage() {
  const router = useRouter();
  const {
    lab,
    items,
    totals,
    coupon,
    setCoupon,
    removeCoupon,
    removeItem
  } = useCartStore();

  // --- STATE ---
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showBill, setShowBill] = useState(false);
  
  // New State: Track user logged in status locally to prevent double redirects
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- CALCULATIONS ---
  const totalMRP = items.reduce((sum, item) => sum + getSafeNumber(item.basePrice), 0);
  const totalSelling = items.reduce((sum, item) => sum + getSafeNumber(item.price), 0);
  const totalSavings = Math.max(0, totalMRP - totalSelling);
  const totalDiscountPercent = totalMRP > 0 ? Math.round((totalSavings / totalMRP) * 100) : 0;
  
  const safeTotals = totals || { subtotal: 0, couponDiscount: 0, finalAmount: 0 };

  const calculateItemDiscount = (item: any) => {
    const base = getSafeNumber(item.basePrice);
    const selling = getSafeNumber(item.price);
    if (base > selling) return Math.round(((base - selling) / base) * 100);
    return 0;
  };

  const calculateItemSavings = (item: any) => {
    return Math.max(0, getSafeNumber(item.basePrice) - getSafeNumber(item.price));
  };

  // --- EFFECTS ---

  // Check Auth Silent on Load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('/api/auth/me');
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);
  
  // Load Available Coupons when modal opens
  useEffect(() => {
    if (showCouponInput) {
      setLoadingCoupons(true);
      // Calls the API we create below
      axios.get('/api/search/coupons')
        .then(res => setAvailableCoupons(res.data))
        .catch(() => toast.error("Failed to load offers"))
        .finally(() => setLoadingCoupons(false));
    }
  }, [showCouponInput]);

  // --- HANDLERS ---

  const handleApplyCoupon = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const codeToApply = codeOverride || couponCode;
    if (!codeToApply) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/search/coupons/validate', {
        code: codeToApply,
        cartTotal: totalSelling,
        labId: lab?.labId // Optional: Pass Lab ID if coupon is lab-specific
      });

      if (res.data.valid) {
        setCoupon({
          code: res.data.code,
          discountAmount: Number(res.data.discountAmount),
          type: res.data.type,
        });
        toast.success(res.data.message || 'Coupon applied!');
        setShowCouponInput(false);
      } else {
        toast.error(res.data.message || 'Invalid Coupon');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    // If we already know they are authenticated from the useEffect check, skip API call
    if (isAuthenticated) {
      router.push('/checkout/details');
      return;
    }

    setLoading(true);
    try {
      // 1. Auth Check (Using cookie)
      await axios.get('/api/auth/me');
      setIsAuthenticated(true);
      
      // 2. Success -> Go to Checkout
      router.push('/checkout/details');
    } catch (error) {
      // 3. Fail -> Redirect to Login with return URL
      toast.info("Please login to proceed");
      router.push('/login?redirect=/checkout/details');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  if (!lab || items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
        <Hospital size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
      <p className="text-slate-400 text-center max-w-xs mb-8">Looks like you haven't added any tests yet.</p>
      <button onClick={() => router.push('/search')} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-black transition-all">
        Browse Tests
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-xl text-slate-800">My Cart</h1>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{items.length} items</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Provider</p>
            <p className="font-bold text-slate-800 text-sm">{lab.labName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Savings Banner */}
        {totalSavings > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg"><Ticket size={20} /></div>
              <div>
                <p className="text-sm font-bold opacity-90">Total Savings</p>
                <p className="text-2xl font-black">₹{formatPrice(totalSavings)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">You saved</p>
              <p className="text-lg font-bold">{totalDiscountPercent}% OFF</p>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, idx) => {
              const base = getSafeNumber(item.basePrice);
              const selling = getSafeNumber(item.price);
              const discount = calculateItemDiscount(item);
              const savings = calculateItemSavings(item);
              
              return (
                <motion.div 
                  key={`${item.id}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Price</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-slate-900">₹{formatPrice(selling)}</p>
                        {base > selling && (
                          <p className="text-sm text-slate-400 line-through">₹{formatPrice(base)}</p>
                        )}
                      </div>
                    </div>
                    {savings > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Savings</p>
                        <p className="text-sm font-bold text-emerald-600">₹{formatPrice(savings)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Coupon Trigger */}
        <div 
          onClick={() => setShowCouponInput(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 border-dashed flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-700">
            <Ticket size={20} className="text-slate-400"/>
            <span className="font-bold text-sm">
              {coupon ? <span className="text-green-600">Coupon Applied!</span> : "Apply Coupon"}
            </span>
          </div>
          {coupon ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded uppercase">{coupon.code}</span>
              <button onClick={(e) => { e.stopPropagation(); removeCoupon(); }}><X size={16} className="text-slate-400"/></button>
            </div>
          ) : (
            <ChevronRight size={18} className="text-slate-400"/>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
          <Lock size={12} /> 100% Safe & Secure Payment
        </div>
      </main>

      {/* Sticky Footer */}
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 md:pb-4 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-3xl"
      >
        <div className="max-w-3xl mx-auto">
          <div onClick={() => setShowBill(!showBill)} className="flex justify-center p-2 -mt-4 mb-2 cursor-pointer opacity-50 hover:opacity-100">
            {showBill ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>

          <AnimatePresence>
            {showBill && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-2 text-sm text-slate-500 overflow-hidden"
              >
                <div className="flex justify-between"><span>Total MRP</span><span className="line-through">₹{formatPrice(totalMRP)}</span></div>
                {totalSavings > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Item Discount</span><span>-₹{formatPrice(totalSavings)}</span></div>}
                <div className="flex justify-between font-medium text-slate-700"><span>Subtotal</span><span>₹{formatPrice(totalSelling)}</span></div>
                {safeTotals.couponDiscount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Coupon Discount</span><span>-₹{formatPrice(safeTotals.couponDiscount)}</span></div>}
                <div className="h-px bg-slate-100 my-2" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Payable</p>
              <p className="text-2xl font-extrabold text-slate-900">₹{formatPrice(safeTotals.finalAmount)}</p>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="bg-slate-900 text-white px-8 h-14 rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Checkout <ArrowRight size={20}/></>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponInput && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col"
            >
              <button onClick={() => setShowCouponInput(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full"><X size={20} className="text-slate-400"/></button>
              <h3 className="font-bold text-lg text-slate-800 mb-4 shrink-0">Apply Coupon</h3>
              
              <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2 mb-4 shrink-0">
                <input 
                  autoFocus
                  placeholder="Enter code" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 uppercase"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <button disabled={loading} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm">Apply</button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Offers</p>
                {loadingCoupons ? <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}</div> : 
                  availableCoupons.length > 0 ? availableCoupons.map((c) => {
                    const isApplicable = !c.minOrderValue || totalSelling >= Number(c.minOrderValue);
                    return (
                      <div key={c.id} onClick={() => isApplicable && handleApplyCoupon(undefined, c.code)} className={`border border-dashed border-slate-200 p-3 rounded-xl flex gap-3 ${isApplicable ? 'bg-yellow-50/50 hover:border-yellow-300 cursor-pointer' : 'bg-slate-50 opacity-60'}`}>
                        <div className="p-2 rounded-lg bg-white border border-yellow-100 shadow-sm font-bold text-xs flex items-center justify-center min-w-[70px] text-yellow-700">{c.code}</div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-800">{c.description || `${c.discountValue}% OFF`}</p>
                          {!isApplicable && <p className="text-[10px] text-red-400 font-medium mt-1">Add items worth ₹{Number(c.minOrderValue) - totalSelling} more</p>}
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-400 italic">No coupons available.</p>
                }
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}