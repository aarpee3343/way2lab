'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useCartStore } from '@/store/useCartStore';
import {
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Clock,
  Receipt,
  Download,
  Home,
  ArrowRight,
  AlertCircle,
  Phone,
  FileText,
  Info,
  Building2
} from 'lucide-react';

/* ---------------- HELPERS ---------------- */

const getAgeFromDob = (dob?: string | null) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};


const getReportETA = (items: any[] = []) => {
  let maxHours = 0;

  items.forEach((i) => {
    if (i.packageId) maxHours = Math.max(maxHours, 48);
    else if (i.itemName?.toLowerCase().includes('x-ray')) maxHours = Math.max(maxHours, 72);
    else maxHours = Math.max(maxHours, 24);
  });

  return maxHours || 24;
};

/* ---------------- MAIN COMPONENT ---------------- */

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const { clearCart } = useCartStore();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearCart();

    const fetchOrder = async () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/order/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.id) setOrder(res.data);
        else setError('Invalid order response');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
    else {
      setError('Invalid order');
      setLoading(false);
    }
  }, [orderId, clearCart, router]);

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-sm w-full">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <p className="font-bold text-slate-800">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-bold"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- CALCULATIONS ---------------- */

  const age = getAgeFromDob(order.patientDob);
  const isMinor = age !== null && age < 18;

  const totalMRP = order.items.reduce(
    (s: number, i: any) => s + Number(i.basePrice || 0),
    0
  );

  const sellingTotal = order.items.reduce(
    (s: number, i: any) => s + Number(i.price || 0),
    0
  );

  const labDiscount = totalMRP - sellingTotal;
  const couponDiscount = Number(order.discountAmount || 0);
  const homeCollection = Number(order.homeCollectionCharges || 0);
  const payable = Number(order.finalAmount || 0);
  const totalSavings = labDiscount + couponDiscount;

  const reportHours = getReportETA(order.items);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* SUCCESS HEADER */}
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-3" size={72} />
          <h1 className="text-2xl font-extrabold text-slate-900">Order Confirmed</h1>
          <p className="text-slate-500 mt-1">Order ID: #{order.orderNumber}</p>
        </div>

        {/* PATIENT CARD */}
        <Card title="Patient Details" icon={<User />}>
          <div className="space-y-1">
            <p className="font-bold text-lg flex items-center gap-2">
              {order.patientName}
              {isMinor && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                  Minor
                </span>
              )}
            </p>
            <p className="text-sm text-slate-600">
              {age ?? '—'} yrs • {order.patientGender || '—'}
            </p>
            <p className="text-xs text-slate-500">
              UHID: {order.patientUHID || '—'}
            </p>
          </div>
        </Card>

        {/* SCHEDULE */}
        <Card title="Schedule" icon={<Calendar />}>
          <p className="font-semibold">
            {new Date(order.preferredDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
            <Clock size={14} /> {order.preferredTimeSlot}
          </p>
        </Card>

        {/* COLLECTION */}
        <Card title="Collection Type" icon={<MapPin />}>
          <span className="inline-block mb-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
            {order.collectionType === 'home_collection'
              ? 'Home Collection'
              : 'Lab Visit'}
          </span>

          {order.collectionType === 'center_visit' && order.lab && (
            <div className="mt-3 text-sm space-y-1">
              <p className="font-bold flex items-center gap-2">
                <Building2 size={16} /> {order.lab.labName}
              </p>
              <p className="text-slate-600">
                {order.lab.address}, {order.lab.city} - {order.lab.pincode}
              </p>
              {order.lab.contactNo && (
                <p className="text-blue-600 font-medium flex items-center gap-1">
                  <Phone size={14} /> {order.lab.contactNo}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* TESTS */}
        <Card title="Tests Booked" icon={<FileText />}>
          <div className="space-y-2">
            {order.items.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-700">{i.itemName}</span>
                <span className="font-bold">₹{i.price}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* PAYMENT */}
        <Card title="Payment Summary" icon={<Receipt />}>
          <SummaryRow label="Total MRP" value={totalMRP} />
          {labDiscount > 0 && <SummaryRow label="Lab Discount" value={-labDiscount} />}
          {couponDiscount > 0 && <SummaryRow label="Coupon Discount" value={-couponDiscount} />}
          {homeCollection > 0 && <SummaryRow label="Home Collection Charges" value={homeCollection} />}
          <hr className="my-2" />
          <SummaryRow label="Total Payable" value={payable} bold />
          {totalSavings > 0 && (
            <p className="text-xs font-bold text-emerald-600 mt-1">
              You saved ₹{totalSavings}
            </p>
          )}
        </Card>

        {/* REPORT ETA */}
        <Card title="Report ETA" icon={<Info />}>
          <p className="font-bold">
            Reports expected within {reportHours} hours
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Reports will be shared via SMS & Email
          </p>
        </Card>

        {/* ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/receipt?token=${Cookies.get(
              'token'
            )}`}
            target="_blank"
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-blue-600 text-white font-bold"
          >
            <Download size={18} /> Download Receipt
          </a>

          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-slate-900 text-white font-bold"
          >
            <Home size={18} /> Home
          </button>
        </div>

      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

const Card = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
    <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const SummaryRow = ({ label, value, bold }: any) => (
  <div className={`flex justify-between ${bold ? 'font-extrabold text-lg' : 'text-sm'}`}>
    <span>{label}</span>
    <span className={value < 0 ? 'text-red-500' : ''}>
      ₹{Math.abs(value)}
    </span>
  </div>
);

/* ---------------- EXPORT ---------------- */

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div />}>
      <SuccessContent />
    </Suspense>
  );
}
