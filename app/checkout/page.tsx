'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useCartStore } from '@/store/useCartStore';
import { useBookingStore } from '@/store/useBookingStore';
import { 
  User, Calendar, MapPin, CheckCircle, CreditCard, ShieldCheck, 
  ArrowLeft, Lock, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewOrderPage() {
  const router = useRouter();
  const { items, totals, clearCart } = useCartStore();
  const { patientType, selectedAddressId, selectedFamilyMemberId, collectionType, scheduleDate, scheduleTime } = useBookingStore();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null); 
  const [showBill, setShowBill] = useState(false); 

  useEffect(() => {
    const loadDetails = async () => {
      const token = Cookies.get('token');
      if(!token) return;
      try {
        const [addrRes, famRes, userRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/family`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const address = addrRes.data.find((a: any) => a.id === selectedAddressId);
        let patientName = userRes.data.user.name;
        let patientRel = 'Self';

        if(patientType === 'family_member') {
          const member = famRes.data.find((m: any) => m.id === selectedFamilyMemberId);
          if(member) {
            patientName = member.name;
            patientRel = member.relationship;
          }
        }

        setData({ address, patientName, patientRel });
      } catch (e) { console.error(e); }
    };
    loadDetails();
  }, []);

  const handlePlaceOrder = async () => {
    router.push('/checkout/confirm');
  };

  if(!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Preparing your review...</p>
      </div>
    </div>
  );

  const homeCharge = collectionType === 'home_collection' ? 200 : 0;
  const grandTotal = totals.finalAmount + homeCharge;

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft size={20}/></button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-800">Review & Pay</h1>
          <div className="flex gap-1 mt-1.5">
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 3/3</div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. Summary Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <span className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
              <User size={16} className="text-blue-500"/> Patient Details
            </span>
            <span className="text-sm font-bold text-slate-800">{data.patientName}</span>
          </div>
          
          <div className="p-5 flex items-start gap-4 border-b border-slate-50 border-dashed">
            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600 shrink-0"><Calendar size={20}/></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Appointment</p>
              <p className="font-bold text-slate-800">{new Date(scheduleDate!).toDateString()}</p>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                <Clock size={14}/> {scheduleTime}
              </div>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600 shrink-0"><MapPin size={20}/></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Location</p>
              <p className="font-medium text-slate-800 text-sm leading-snug">{data.address?.addressLine1}</p>
              <p className="text-xs text-slate-500 mt-0.5">{data.address?.city} - {data.address?.pincode}</p>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-2 inline-block tracking-wide">
                {collectionType === 'home_collection' ? 'HOME COLLECTION' : 'LAB VISIT'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Items List */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Tests ({items.length})</h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">{items[0]?.labName}</span>
          </div>
          <div className="p-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <span className="text-slate-700 font-medium text-sm">{item.name}</span>
                <span className="font-bold text-slate-900 text-sm">₹{item.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Payment Method */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Pay Upon Service</p>
              <p className="text-xs text-slate-500 mt-0.5">Cash, UPI, or Card at collection</p>
            </div>
          </div>
          <div className="bg-blue-600 rounded-full p-1 shadow-md shadow-blue-200">
            <CheckCircle size={20} className="text-white fill-blue-600"/>
          </div>
        </section>

      </main>

      {/* 4. Payment Footer */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_30px_-10px_rgba(0,0,0,0.1)] border-t border-slate-100 z-30 rounded-t-3xl"
      >
        <div className="max-w-3xl mx-auto">
          
          {/* Accordion Toggle */}
          <div 
            onClick={() => setShowBill(!showBill)}
            className="flex justify-center p-2 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
          >
            {showBill ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>

          {/* Collapsible Bill Details */}
          <AnimatePresence>
            {showBill && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-4 space-y-3 text-sm border-b border-slate-50 overflow-hidden"
              >
                <div className="flex justify-between text-slate-500"><span>Item Total</span><span>₹{totals.subtotal}</span></div>
                {homeCharge > 0 && <div className="flex justify-between text-slate-500"><span>Home Collection</span><span>+₹{homeCharge}</span></div>}
                {totals.couponDiscount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-₹{totals.couponDiscount}</span></div>}
                <div className="h-px bg-slate-100 my-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Action Bar */}
          <div className="p-4 pt-2 pb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">Total Payable</p>
              <div className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-2">
                ₹{grandTotal} 
                <span className="text-xs font-semibold text-slate-400 line-through decoration-slate-300">₹{totals.subtotal + homeCharge}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={loading}
              className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-base"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing</span>
              ) : (
                <>Confirm & Book <Lock size={18} className="opacity-60"/></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}