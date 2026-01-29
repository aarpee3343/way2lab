'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Ticket, ChevronRight, Hospital, Info, ChevronDown, ChevronUp, Lock, X, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';


// Helper function to safely format numbers
const formatPrice = (price: any) => {
  if (price === undefined || price === null) return '0';
  const num = Number(price);
  if (isNaN(num)) return '0';
  return num.toLocaleString();
};

// Helper function to get safe number value
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
  clearCart
} = useCartStore();

const totalMRP = items.reduce(
  (sum, item) => sum + getSafeNumber(item.basePrice),
  0
);

const totalSelling = items.reduce(
  (sum, item) => sum + getSafeNumber(item.price),
  0
);

const totalSavings = Math.max(0, totalMRP - totalSelling);

const totalDiscountPercent =
  totalMRP > 0 ? Math.round((totalSavings / totalMRP) * 100) : 0;



  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showBill, setShowBill] = useState(false);

  const safeTotals = totals || { subtotal: 0, couponDiscount: 0, finalAmount: 0 };

  // Calculate discount percentage for an item
  const calculateItemDiscount = (item: any) => {
    const basePrice = getSafeNumber(item.basePrice);
    const sellingPrice = getSafeNumber(item.price);
    
    if (basePrice > 0 && sellingPrice > 0 && basePrice > sellingPrice) {
      return Math.round(((basePrice - sellingPrice) / basePrice) * 100);
    }
    return 0;
  };

  // Calculate item savings
  const calculateItemSavings = (item: any) => {
    const basePrice = getSafeNumber(item.basePrice);
    const sellingPrice = getSafeNumber(item.price);
    
    if (basePrice > 0 && sellingPrice > 0 && basePrice > sellingPrice) {
      return basePrice - sellingPrice;
    }
    return 0;
  };

  // Fetch Coupons when Popup Opens
  useEffect(() => {
    if (showCouponInput) {
      setLoadingCoupons(true);
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/search/coupons`)
        .then(res => setAvailableCoupons(res.data))
        .catch(() => toast.error("Failed to load offers"))
        .finally(() => setLoadingCoupons(false));
    }
  }, [showCouponInput]);

  const handleApplyCoupon = async (
    e?: React.FormEvent,
    codeOverride?: string
  ) => {
    if (e) e.preventDefault();

    const codeToApply = codeOverride || couponCode;
    if (!codeToApply) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/search/coupon/validate`,
        {
          code: codeToApply,
          cartTotal: totalSelling,
        }
      );

      // ✅ THIS MUST RUN
      if (res.data.valid === true) {
        setCoupon({
          code: res.data.code,
          discountAmount: Number(res.data.discountAmount),
          type: res.data.type,
        });

        toast.success(res.data.message || 'Coupon applied!');
        setShowCouponInput(false); // closes modal
      } else {
        toast.error('Coupon could not be applied');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid Coupon');
    } finally {
      setLoading(false);
    }
  };


  // Debug: Log cart items to see what's stored
  useEffect(() => {
    console.log("🛒 Cart Items Debug:", items.map(item => ({
      name: item.name,
      price: item.price,
      basePrice: item.basePrice,
      discount: item.discount,
      hasDiscount: item.basePrice > item.price
    })));
  }, [items]);

  if (!lab) return (
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
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-xl text-slate-800">My Cart</h1>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Provider</p>
            <p className="font-bold text-slate-800 text-sm">{items[0]?.labName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Savings Banner - Only show if there are actual savings */}
        {totalSavings > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Ticket size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Total Savings</p>
                  <p className="text-2xl font-bold">₹{formatPrice(totalSavings)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-90">You saved</p>
                <p className="text-lg font-bold">
                  {totalDiscountPercent}% OFF
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, idx) => {
              const basePrice = getSafeNumber(item.basePrice);
              const sellingPrice = getSafeNumber(item.price);
              const discountPercent = calculateItemDiscount(item);
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} uppercase`}>
                          {item.type}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Includes report within 24hrs</p>
                    </div>
                    <button 
                      onClick={() => removeItem(idx)} 
                      className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Price Display */}
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <div className="flex items-center gap-3">
                        {/* Selling Price (Discounted Price) */}
                        <p className="font-bold text-lg text-slate-800">
                          ₹{formatPrice(sellingPrice)}
                        </p>

                        {/* MRP with strikethrough if there's a discount */}
                        {basePrice > 0 && basePrice > sellingPrice && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-slate-400 line-through relative">
                                ₹{formatPrice(basePrice)}
                                {/* Custom strikethrough line */}
                                <span className="absolute left-0 right-0 top-1/2 h-px bg-slate-400 transform -translate-y-1/2"></span>
                              </p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">
                              Save ₹{formatPrice(savings)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Savings per item */}
                    {discountPercent > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-emerald-600 font-bold">
                          {discountPercent}% OFF
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Coupon Trigger */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
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
        </motion.div>

        {/* Safety Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
          <Lock size={12} /> 100% Safe & Secure Payment
        </div>

      </main>

      {/* --- STICKY CHECKOUT FOOTER --- */}
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 md:pb-4 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-3xl"
      >
        <div className="max-w-3xl mx-auto">
          
          {/* Collapsible Bill Details */}
          <div onClick={() => setShowBill(!showBill)} className="flex justify-center p-2 -mt-4 mb-2 cursor-pointer opacity-50 hover:opacity-100">
            {showBill ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>

          <AnimatePresence>
            {showBill && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-2 text-sm text-slate-500 overflow-hidden"
              >
                {/* Total MRP */}
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span className="text-slate-400 line-through">
                    ₹{formatPrice(totalMRP)}
                  </span>
                </div>

                {/* Item Discount */}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>
                      Item Discount ({totalDiscountPercent}% OFF)
                    </span>
                    <span>-₹{formatPrice(totalSavings)}</span>
                  </div>
                )}

                {/* Subtotal (after item discount, before coupon) */}
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>₹{formatPrice(totalSelling)}</span>
                </div>

                {/* Coupon Discount */}
                {safeTotals.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{formatPrice(safeTotals.couponDiscount)}</span>
                  </div>
                )}

                <div className="h-px bg-slate-100 my-2" />

                {/* Total Payable */}
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Total Payable</span>
                  <span>
                    ₹{formatPrice(totalSelling - safeTotals.couponDiscount)}
                  </span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">To Pay</p>
              <p className="text-2xl font-extrabold text-slate-900">₹{formatPrice(safeTotals.finalAmount)}</p>
              
              {/* Show total savings in footer */}
              {totalSavings > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400 line-through relative">
                    ₹{formatPrice(totalMRP)}
                    <span className="absolute left-0 right-0 top-1/2 h-px bg-slate-400 transform -translate-y-1/2"></span>
                  </p>
                  <p className="text-xs font-bold text-emerald-600">
                    You save ₹{formatPrice(totalSavings)}

                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={() => router.push('/checkout/details')}
              className="bg-slate-900 text-white px-8 h-14 rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              Checkout <ArrowRight size={20}/>
            </button>
          </div>
        </div>
      </motion.div>

      {/* --- COUPON BOTTOM SHEET --- */}
      <AnimatePresence>
        {showCouponInput && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl relative"
            >
              <button onClick={() => setShowCouponInput(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full"><X size={20} className="text-slate-400"/></button>
              <h3 className="font-bold text-lg text-slate-800 mb-4">Apply Coupon</h3>
              
              <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2">
                <input 
                  autoFocus
                  placeholder="Enter code (e.g. WELCOME50)" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 uppercase placeholder:normal-case"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <button disabled={loading} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm">
                  {loading ? '...' : 'Apply'}
                </button>
              </form>

              <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Offers</p>
                
                {loadingCoupons ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : availableCoupons.length > 0 ? (
                  availableCoupons.map((c) => {
                    const isApplicable = !c.minCartVal || safeTotals.subtotal >= c.minCartVal;
                    
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => isApplicable && handleApplyCoupon(undefined, c.code)}
                        className={`border border-dashed border-slate-200 p-3 rounded-xl flex gap-3 transition-colors ${
                          isApplicable 
                            ? 'bg-yellow-50/50 hover:border-yellow-300 cursor-pointer' 
                            : 'bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shadow-sm font-bold text-xs h-fit border flex flex-col items-center justify-center min-w-[80px] ${
                          isApplicable ? 'bg-white text-yellow-600 border-yellow-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          <span>{c.code}</span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isApplicable ? 'text-slate-700' : 'text-slate-400'}`}>
                            {c.discountType === 'percentage' ? `${c.discountVal}% OFF` : `Save ₹${c.discountVal} flat`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                          
                          {/* Min Value Warning */}
                          {!isApplicable && (
                            <p className="text-[10px] text-red-400 font-medium mt-1">
                              Add items worth ₹{c.minCartVal - safeTotals.subtotal} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400 italic">No coupons available right now.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}