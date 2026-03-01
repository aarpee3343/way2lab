'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  ShieldCheck,
  User,
  Wallet
} from 'lucide-react';

import { useCartStore } from '@/store/useCartStore';
import { useBookingStore } from '@/store/useBookingStore';
import { toast } from '@/lib/safe-toast';

export default function ReviewOrderPage() {
  const router = useRouter();
  const { items, totals, lab, coupon } = useCartStore();
  const {
    patientType,
    selectedAddressId,
    selectedFamilyMemberId,
    collectionType,
    scheduleDate,
    scheduleTime
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [walletUseAmount, setWalletUseAmount] = useState(0);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [addrRes, famRes, userRes, walletRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/family`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet`)
        ]);

        const userData = userRes.data.user;
        setUser(userData);
        setWallet(walletRes.data?.data || null);

        const address = addrRes.data.find((a: any) => a.id === selectedAddressId);
        let patientName = userData.name;
        let patientRel = 'Self';
        let patientPayload = {
          name: userData.name,
          dob: userData.dateOfBirth || null,
          gender: userData.gender || null,
          phone: userData.phone || null,
          uhid: userData.uhid || null,
          type: 'self',
          relation: 'Self'
        };

        if (patientType === 'family_member') {
          const member = famRes.data.find((m: any) => m.id === selectedFamilyMemberId);
          if (member) {
            patientName = member.name;
            patientRel = member.relationship;
            patientPayload = {
              name: member.name,
              dob: member.dateOfBirth || null,
              gender: member.gender || null,
              phone: member.phone || null,
              uhid: member.uhid || null,
              type: 'family',
              relation: member.relationship
            };
          }
        }

        setPatient(patientPayload);
        setData({ address, patientName, patientRel });
      } catch (e: any) {
        if (e.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/login?redirect=/checkout');
        } else {
          toast.error('Failed to load checkout details');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [patientType, router, selectedAddressId, selectedFamilyMemberId]);

  const getOrderSummary = () => {
    const patientTypeKey: 'self' | 'family' =
      patientType === 'family_member' ? 'family' : 'self';

    const getCorporatePaymentType = (item: any) =>
      !item?.isCorporate
        ? null
        : patientTypeKey === 'self'
          ? item.corporatePaymentSelf
          : item.corporatePaymentFamily;

    const getEffectivePrice = (item: any) => {
      const paymentType = getCorporatePaymentType(item);
      if (paymentType === 'CORPORATE_PAYS') return 0;
      return Number(item.price || 0);
    };

    const isCorporatePackageOrder = items.some((i) => i.isCorporate === true);
    const isCorporateCovered =
      !!user?.corporateId &&
      items.some((i) => i.isCorporate === true && getCorporatePaymentType(i) === 'CORPORATE_PAYS');

    const mrpTotal = items.reduce((sum, i) => sum + (Number(i.basePrice) || Number(i.price || 0)), 0);
    const sellingTotal = items.reduce((sum, i) => sum + Number(i.price || 0), 0);
    const payableTotal = items.reduce((sum, i) => sum + getEffectivePrice(i), 0);
    const testDiscount = mrpTotal - sellingTotal;
    const couponDiscount = Number(totals?.couponDiscount || 0);
    const homeCharge =
      collectionType === 'home_collection' && !isCorporatePackageOrder
        ? Number(lab?.homeCollectionCharges || 0)
        : 0;
    const orderTotal = Math.max(0, payableTotal - couponDiscount + homeCharge);
    const maxWalletUsable = Math.min(orderTotal, Number(wallet?.wallet?.balance || 0));
    const appliedWallet = isCorporateCovered ? 0 : Math.min(walletUseAmount, maxWalletUsable);
    const balanceDue = Math.max(0, orderTotal - appliedWallet);

    return {
      isCorporatePackageOrder,
      isCorporateCovered,
      mrpTotal,
      testDiscount,
      couponDiscount,
      homeCharge,
      orderTotal,
      maxWalletUsable,
      appliedWallet,
      balanceDue
    };
  };

  const handlePlaceOrder = async () => {
    if (!items.length) return toast.error('Cart is empty');
    if (!selectedAddressId || !scheduleDate || !scheduleTime) return toast.error('Schedule or address missing');
    if (!patient || !user || !data?.address) return toast.error('Unable to load patient details');

    setPlacingOrder(true);
    try {
      const summary = getOrderSummary();
      const payload = {
        labId: items[0].labId,
        items,
        patientDetails: {
          name: patient.name,
          type: patient.type,
          relation: patient.relation,
          dob: patient.dob || null,
          gender: patient.gender || null,
          phone: patient.phone || null,
          uhid: patient.uhid || null
        },
        addressId: selectedAddressId,
        schedule: {
          date: scheduleDate,
          time: scheduleTime,
          type: collectionType
        },
        paymentMode:
          summary.isCorporateCovered && summary.orderTotal === 0
            ? 'Corporate Credit'
            : summary.appliedWallet > 0 && summary.balanceDue > 0
              ? 'Wallet + Pay Upon Service'
              : summary.appliedWallet > 0
                ? 'Wallet'
                : 'Pay Upon Service',
        paymentStatus:
          summary.isCorporateCovered && summary.orderTotal === 0
            ? 'CORPORATE_BILLING'
            : summary.appliedWallet >= summary.orderTotal && summary.orderTotal > 0
              ? 'Paid'
              : summary.appliedWallet > 0
                ? 'Partial'
                : 'PENDING',
        walletAmountToUse: summary.appliedWallet,
        totals: {
          subtotal: summary.mrpTotal,
          discount: summary.testDiscount + summary.couponDiscount,
          homeCollection: summary.homeCharge,
          final: summary.orderTotal
        },
        couponCode: coupon?.code || null
      };

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders`, payload);
      if (res.data?.success) {
        router.push(`/order-success?id=${res.data.orderId}`);
      } else {
        toast.error(res.data?.message || 'Order failed');
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        toast.error('Session expired.');
        router.push('/login?redirect=/checkout');
      } else {
        toast.error(e.response?.data?.message || 'Order failed');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Preparing your review...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-700">Unable to load details</h2>
          <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = getOrderSummary();

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-800">Review & Pay</h1>
          <div className="flex gap-1 mt-1.5">
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 3/3</div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <span className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
              <User size={16} className="text-blue-500" /> Patient Details
            </span>
            <span className="text-sm font-bold text-slate-800">{data.patientName}</span>
          </div>

          <div className="p-5 flex items-start gap-4 border-b border-slate-50 border-dashed">
            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600 shrink-0"><Calendar size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Appointment</p>
              <p className="font-bold text-slate-800">{scheduleDate ? new Date(scheduleDate).toDateString() : 'Date Not Set'}</p>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                <Clock size={14} /> {scheduleTime || '--:--'}
              </div>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600 shrink-0"><MapPin size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Location</p>
              <p className="font-medium text-slate-800 text-sm leading-snug">{data.address?.addressLine1 || 'Address not found'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{data.address?.city} - {data.address?.pincode}</p>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-2 inline-block tracking-wide">
                {collectionType === 'home_collection' ? 'HOME COLLECTION' : 'LAB VISIT'}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Tests ({items.length})</h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">{items[0]?.labName}</span>
          </div>
          <div className="p-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <span className="text-slate-700 font-medium text-sm">{item.name}</span>
                <span className="font-bold text-slate-900 text-sm">Rs {item.price}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {summary.appliedWallet > 0
                  ? summary.balanceDue > 0
                    ? 'Wallet + Pay Upon Service'
                    : 'Wallet Payment'
                  : 'Pay Upon Service'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {summary.appliedWallet > 0
                  ? `Wallet applied Rs ${summary.appliedWallet.toFixed(2)}`
                  : 'Cash or UPI at collection'}
              </p>
            </div>
          </div>
          <div className="bg-blue-600 rounded-full p-1 shadow-md shadow-blue-200">
            <CheckCircle size={20} className="text-white fill-blue-600" />
          </div>
        </section>

        {!summary.isCorporateCovered && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wallet size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Use Wallet Balance</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Available balance: Rs {Number(wallet?.wallet?.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
            <input
              type="number"
              min={0}
              max={summary.maxWalletUsable}
              step="0.01"
              value={summary.appliedWallet || ''}
              onChange={(e) => {
                const next = Math.max(0, Number(e.target.value || 0));
                setWalletUseAmount(Math.min(next, summary.maxWalletUsable));
              }}
              className="mt-4 w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
              placeholder="Use wallet amount"
              disabled={summary.maxWalletUsable <= 0}
            />
            <p className="mt-2 text-[11px] text-slate-500">
              You can use up to Rs {summary.maxWalletUsable.toFixed(2)} on this order.
            </p>
          </section>
        )}
      </main>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_30px_-10px_rgba(0,0,0,0.1)] border-t border-slate-100 z-30 rounded-t-3xl"
      >
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">Balance Due</p>
            <div className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-2">
              Rs {summary.balanceDue.toFixed(2)}
              {summary.homeCharge > 0 && (
                <span className="text-xs font-semibold text-slate-400">(Includes +Rs {summary.homeCharge} home fee)</span>
              )}
            </div>
            {summary.appliedWallet > 0 && (
              <p className="text-[10px] font-bold text-emerald-700 mt-1">
                Wallet used - Rs {summary.appliedWallet.toFixed(2)}
              </p>
            )}
            {summary.isCorporateCovered && (
              <p className="text-[10px] font-bold text-emerald-700 mt-1">
                Corporate sponsored package - Balance due Rs 0
              </p>
            )}
            {summary.isCorporatePackageOrder && !summary.isCorporateCovered && (
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Corporate benefit (Self Pay) - Home collection charges are waived
              </p>
            )}
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {placingOrder ? 'Booking...' : 'Confirm & Book'} <ShieldCheck size={18} className="opacity-60" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
