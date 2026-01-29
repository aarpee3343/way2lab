'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

import { useCartStore } from '@/store/useCartStore';
import { useBookingStore } from '@/store/useBookingStore';

import {
  ClipboardList,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [homeCharge, setHomeCharge] = useState(0);

  /* ---------- GUARDS ---------- */
  useEffect(() => {
    if (!items.length) router.push('/search');
    if (!selectedAddressId || !scheduleDate) router.push('/checkout/details');
  }, []);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      const token = Cookies.get('token');
      if (!token) return router.push('/login');

      try {
        /* ADDRESS */
        const addrRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/user/addresses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAddress(addrRes.data.find((a: any) => a.id === selectedAddressId));

        /* PATIENT */
        if (patientType === 'self') {
          const me = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const u = me.data.user;
          setPatient({
            name: u.name,
            dob: u.dateOfBirth,
            gender: u.gender,
            phone: u.phone,
            uhid: u.uhid,
            type: 'self',
            relation: 'Self'
          });
        }

        if (patientType === 'family_member') {
          const fam = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/user/family`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const m = fam.data.find((f: any) => f.id === selectedFamilyMemberId);
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

        if (collectionType === 'home_collection') setHomeCharge(200);
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [patientType, selectedFamilyMemberId, selectedAddressId, collectionType]);

  if (!patient || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading details…
      </div>
    );
  }

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

  const finalTotal =
    discountedTotal - couponDiscount + homeCharge;

  /* ---------- PLACE ORDER ---------- */
  const placeOrder = async () => {
    setLoading(true);

    try {
      const token = Cookies.get('token');

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
        paymentMode: 'Pay Upon Service',
        totals: {
          subtotal: mrpTotal,
          discount: testDiscount + couponDiscount,
          homeCollection: homeCharge,
          final: finalTotal
        }
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        clearCart();
        router.push(`/order-success?id=${res.data.orderNumber}`);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Order failed');
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

          {/* PATIENT */}
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

          {/* SCHEDULE */}
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

          {/* ADDRESS */}
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

          {/* TESTS */}
          <Card title={`Tests (${items.length})`}>
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
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

          {testDiscount > 0 && (
            <Row label="WayToLab Discount" value={-testDiscount} />
          )}

          {couponDiscount > 0 && (
            <Row label="Coupon Discount" value={-couponDiscount} />
          )}

          {homeCharge > 0 && (
            <Row label="Home Collection Charges" value={homeCharge} />
          )}

          <hr className="my-3" />

          <Row label="Amount Payable" value={finalTotal} bold />

          <button
            onClick={placeOrder}
            disabled={loading}
            className="mt-4 w-full h-14 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2"
          >
            {loading ? 'Placing…' : <>Place Order <ArrowRight /></>}
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
  <div className="bg-white rounded-2xl p-5 shadow-sm">
    <h3 className="font-bold text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value, bold }: any) => (
  <div className={`flex justify-between ${bold ? 'font-extrabold text-lg' : 'text-sm'}`}>
    <span>{label}</span>
    <span className={value < 0 ? 'text-green-600' : ''}>
      ₹{Math.abs(value)}
    </span>
  </div>
);
