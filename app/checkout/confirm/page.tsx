'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// ❌ REMOVED: import Cookies from 'js-cookie'; 

import { useCartStore } from '@/store/useCartStore';
import { useBookingStore } from '@/store/useBookingStore';

import {
  ClipboardList,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';

/* ----------------------------------
   HELPERS
----------------------------------- */

const getAgeFromDob = (dob?: string | null) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const getAgeLabel = (age: number | null) => {
  if (age === null) return '—';
  if (age < 1) return 'Infant';
  if (age < 18) return 'Minor';
  return 'Adult';
};

/* ==================================
   PAGE
================================== */

export default function ConfirmOrderPage() {
  const router = useRouter();

  /* ---------- STORES ---------- */
  const { items, totals, clearCart } = useCartStore();
  const {
    patientType,
    selectedFamilyMemberId,
    selectedAddressId,
    collectionType,
    scheduleDate,
    scheduleTime
  } = useBookingStore();

  /* ---------- STATE ---------- */
  const [loading, setLoading] = useState(true); // Start loading true
  const [address, setAddress] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [homeCharge, setHomeCharge] = useState(0);
  const [user, setUser] = useState<any>(null);

  /* ---------- GUARDS ---------- */
  useEffect(() => {
    if (!items.length) {
        router.push('/search');
        return;
    }
    if (!selectedAddressId || !scheduleDate) {
        router.push('/checkout/details');
        return;
    }
  }, [items.length, selectedAddressId, scheduleDate, router]);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        // ❌ REMOVED: const token = Cookies.get('token');
        
        // 1. Fetch User (This acts as the Auth Check)
        const meRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);
        const userData = meRes.data.user;
        setUser(userData);

        // 2. Fetch Address
        const addrRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`);
        setAddress(addrRes.data.find((a: any) => a.id === selectedAddressId));

        // 3. Set Patient Data
        if (patientType === 'self') {
          setPatient({
            name: userData.name,
            dob: userData.dateOfBirth,
            gender: userData.gender,
            phone: userData.phone,
            uhid: userData.uhid,
            type: 'self',
            relation: 'Self'
          });
        } 
        else if (patientType === 'family_member') {
          const famRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/family`);
          const m = famRes.data.find((f: any) => f.id === selectedFamilyMemberId);
          if (m) {
            setPatient({
              name: m.name,
              dob: m.dateOfBirth,
              gender: m.gender,
              phone: m.phone,
              uhid: m.uhid,
              type: 'family',
              relation: m.relationship
            });
          }
        }

        if (collectionType === 'home_collection') setHomeCharge(200);

      } catch (e: any) {
        // ✅ Handle Auth Failure Here
        if (e.response?.status === 401) {
           toast.error("Session expired.");
           router.push('/login?redirect=/checkout/confirm');
        } else {
           console.error("Load error", e);
        }
      } finally {
        setLoading(false);
      }
    };

    if (items.length > 0) load();
  }, [patientType, selectedFamilyMemberId, selectedAddressId, collectionType, items.length, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!patient || !address || !user) return null; // Should have redirected or loaded by now

  /* ---------- CALCULATIONS ---------- */
  const age = getAgeFromDob(patient.dob);

  const mrpTotal = items.reduce(
    (sum, i) => sum + (Number(i.basePrice) || Number(i.price)),
    0
  );

  const discountedTotal = items.reduce(
    (sum, i) => sum + Number(i.price),
    0
  );

  const testDiscount = mrpTotal - discountedTotal;
  const couponDiscount = totals.couponDiscount || 0;

  const finalTotal = discountedTotal - couponDiscount + homeCharge;

  /* ---------- CORPORATE BILLING CHECK ---------- */
  const isCorporateCovered =
    patient.type === 'self' &&
    !!user.corporateId &&
    items.some(i => i.isCorporate === true);

  /* ---------- PLACE ORDER ---------- */
  const placeOrder = async () => {
    setLoading(true);

    try {
      // ❌ REMOVED: const token = Cookies.get('token');

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

        paymentMode: isCorporateCovered
          ? 'Corporate Credit'
          : 'Pay Upon Service',

        paymentStatus: isCorporateCovered
          ? 'CORPORATE_BILLING'
          : 'PENDING',

        totals: {
          subtotal: mrpTotal,
          discount: testDiscount + couponDiscount,
          homeCollection: homeCharge,
          final: isCorporateCovered ? 0 : finalTotal
        }
      };

      // ✅ AUTOMATIC COOKIE HANDLING (No Headers)
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        payload
      );

      if (res.data.success) {
        clearCart();
        router.push(`/order-success?id=${res.data.orderNumber}`);
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
          toast.error("Session expired.");
          router.push('/login');
      } else {
          toast.error(e.response?.data?.message || 'Order failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ==================================
       UI
  ================================== */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <ClipboardList /> Review Order
          </h1>

          <Card title="Patient">
            <div className="flex gap-3">
              <User />
              <div>
                <p className="font-bold">{patient.name}</p>
                <p className="text-sm text-slate-600">
                  {patient.relation} • {age ?? '—'} yrs • {patient.gender || '—'} • {getAgeLabel(age)}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Schedule">
            <p className="font-semibold">
              {new Date(scheduleDate!).toLocaleDateString('en-IN')}
            </p>
            <p className="text-sm text-slate-600">{scheduleTime}</p>

            <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
              {collectionType === 'home_collection' ? 'Home Collection' : 'Lab Visit'}
            </span>

            <p className="mt-2 text-xs text-slate-500">
              Lab: {items[0]?.labName || '—'}
            </p>
          </Card>

          <Card title="Collection Address">
            <div className="flex gap-2">
              <MapPin />
              <div>
                <p className="font-medium">{address.addressLine1}</p>
                <p className="text-sm text-slate-600">
                  {address.city} - {address.pincode}
                </p>
              </div>
            </div>
          </Card>

          <Card title={`Tests (${items.length})`}>
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                <span>{i.name}</span>
                <span className="font-bold">₹{i.price}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl p-6 shadow-lg h-fit sticky top-4">

          <h3 className="font-bold mb-4">Payment Summary</h3>

          <Row label="MRP Total" value={mrpTotal} />
          {testDiscount > 0 && <Row label="WayToLab Discount" value={-testDiscount} />}
          {couponDiscount > 0 && <Row label="Coupon Discount" value={-couponDiscount} />}
          {homeCharge > 0 && <Row label="Home Collection Charges" value={homeCharge} />}

          <hr className="my-3" />

          <Row label="Amount Payable" value={isCorporateCovered ? 0 : finalTotal} bold />

          {isCorporateCovered && (
            <p className="text-xs text-green-600 font-bold mt-2 bg-green-50 p-2 rounded border border-green-200 text-center">
              Covered by Corporate Account
            </p>
          )}

          <button
            onClick={placeOrder}
            disabled={loading}
            className="mt-6 w-full h-14 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Confirm & Book <ArrowRight size={20}/></>}
          </button>

          <p className="text-xs text-center mt-3 text-slate-500 flex justify-center gap-1">
            <ShieldCheck size={14} /> Secure & Verified
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------
   UI HELPERS
----------------------------------- */

const Card = ({ title, children }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <h3 className="font-bold text-sm mb-3 uppercase text-slate-400 tracking-wider">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value, bold }: any) => (
  <div className={`flex justify-between ${bold ? 'font-extrabold text-lg text-slate-900' : 'text-sm text-slate-600 mb-1'}`}>
    <span>{label}</span>
    <span className={value < 0 ? 'text-green-600' : ''}>
      ₹{Math.abs(value).toLocaleString()}
    </span>
  </div>
);