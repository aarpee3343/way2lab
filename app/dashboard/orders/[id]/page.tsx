'use client';

import { useEffect, useState, use } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import AiHealthDashboard from './AiHealthDashboard'; 
import {
  Calendar,
  Clock,
  MapPin,
  Home,
  Building2,
  User,
  Phone,
  FileText,
  Receipt,
  X,
  RefreshCcw,
  Ban,
  FlaskConical,
  FileDown,
  UserCog,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

/* ---------------- HELPERS ---------------- */

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const getAgeLabel = (dob?: string | null) => {
  if (!dob) return '—';
  const age =
    Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  if (age < 1) return 'Infant';
  if (age < 18) return 'Minor';
  return `${age} yrs`;
};

/* ---------------- PAGE ---------------- */

export default function OrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* Reschedule */
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] =
    useState<'home_collection' | 'center_visit'>('home_collection');

  const fetchOrder = async () => {
    const token = Cookies.get('token');
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(res.data);
      setNewType(res.data.collectionType);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.warning('Select date & time');
      return;
    }

    try {
      const token = Cookies.get('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/reschedule`,
        { date: newDate, time: newTime, collectionType: newType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order rescheduled');
      setOpen(false);
      fetchOrder();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Reschedule failed');
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading order…
      </div>
    );
  }

  const mrp = order.totalAmount || 0;
  const discount = order.discountAmount || 0;
  const home = order.homeCollectionCharges || 0;
  const final = order.finalAmount || 0;
  const savings = mrp + home - final;

  return (
    <div className="min-h-screen bg-slate-100 pb-32">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-6 rounded-b-3xl">
        <h1 className="text-xl font-extrabold">
          Order #{order.orderNumber}
        </h1>
        <span className="mt-3 inline-block text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
          {order.status}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-5 mt-6">

        {/* PATIENT */}
        <Card title="Patient" icon={<User />}>
          <p className="font-bold">{order.patientName}</p>
          <p className="text-sm text-slate-600">
            {getAgeLabel(order.patientDob)} • {order.patientGender} •{' '}
            {order.patientRelation || 'Self'}
          </p>
          <p className="text-xs text-slate-500">
            UHID: {order.patientUHID || '—'}
          </p>
          {order.patientPhone && (
            <p className="flex items-center gap-2 text-sm mt-1">
              <Phone size={14} /> {order.patientPhone}
            </p>
          )}
        </Card>
        {/* AI REPORT SUMMARY */}
          {order.reportSummary &&
            order.reports?.some((r: any) => r.reportType === 'COMPLETED') && (
              <Card title="AI Health Analysis" icon={<Activity className="text-indigo-600" />}>
                {/* ✅ UPDATED COMPONENT CALL */}
                <AiHealthDashboard 
                  dataString={order.reportSummary.content} 
                  orderId={order.id} 
                  orderNumber={order.orderNumber}
                />
                
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] text-slate-400">
                  <span>Powered by MediAI v2.0</span>
                  <span>This summary is AI generated and for reference only. Not a medical diagnosis.</span>
                </div>
              </Card>
          )}

        {/* REPORTS */}
        <Card title="Reports" icon={<FileText />}>
          {order.reports?.length ? (
            order.reports.map((r: any) => (
              <a
                key={r.id}
                href={`/api/reports/${r.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center text-sm py-2"
              >
                <span>{r.reportType} Report</span>
                <FileDown size={16} />
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Reports will appear here once uploaded.
            </p>
          )}
        </Card>

        {/* SCHEDULE */}
        <Card title="Schedule" icon={<Calendar />}>
          <p className="font-semibold">{formatDate(order.preferredDate)}</p>
          <p className="text-sm flex items-center gap-1">
            <Clock size={14} /> {order.preferredTimeSlot}
          </p>
          <span className="mt-2 inline-flex items-center gap-2 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
            {order.collectionType === 'home_collection'
              ? <><Home size={14} /> Home Collection</>
              : <><Building2 size={14} /> Lab Visit</>}
          </span>
        </Card>

        {/* LAB */}
        {order.lab && (
          <Card title="Laboratory" icon={<FlaskConical />}>
            <p className="font-bold">{order.lab.labName}</p>
            <p className="text-sm text-slate-600">
              {order.lab.address}, {order.lab.city} - {order.lab.pincode}
            </p>
            {order.lab.contactNo && (
              <p className="text-sm mt-1">
                <Phone size={14} /> {order.lab.contactNo}
              </p>
            )}
          </Card>
        )}

        {/* TECHNICIAN */}
        <Card title="Technician" icon={<UserCog />}>
          {order.technician ? (
            <>
              <p className="font-bold">{order.technician.name}</p>
              <p className="text-sm">
                <Phone size={14} /> {order.technician.phone}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Technician not assigned yet.
            </p>
          )}
        </Card>

        {/* PAYMENT */}
        <Card title="Payment Summary" icon={<Receipt />}>
          <Row label="MRP" value={mrp} />
          {discount > 0 && <Row label="Coupon Discount" value={-discount} />}
          {home > 0 && <Row label="Home Collection" value={home} />}
          {savings > 0 && (
            <Row label="You Saved" value={-savings} highlight />
          )}
          <hr />
          <Row label="Total Paid" value={final} bold />
        </Card>
      </div>

      {/* FOOTER ACTIONS */}
      {order.status === 'PENDING' && (
        <div className="
          fixed bottom-0 right-0 left-0 md:left-72
          z-30 bg-white border-t
          px-4 py-3 flex gap-3
        ">
          <button
            onClick={() => setOpen(true)}
            className="flex-1 h-14 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Reschedule
          </button>

          <button
            onClick={async () => {
              if (!confirm('Cancel this order?')) return;
              const token = Cookies.get('token');
              await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              toast.success('Order cancelled');
              fetchOrder();
            }}
            className="flex-1 h-14 border border-red-300 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Ban size={18} /> Cancel
          </button>
        </div>
      )}

      {/* RESCHEDULE SHEET */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Reschedule</h3>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full border rounded-xl p-3 mb-3"
              onChange={e => setNewDate(e.target.value)}
            />

            <select
              className="w-full border rounded-xl p-3 mb-6"
              onChange={e => setNewTime(e.target.value)}
            >
              <option>Select Time</option>
              <option>07:00 AM - 08:00 AM</option>
              <option>08:00 AM - 09:00 AM</option>
              <option>09:00 AM - 10:00 AM</option>
            </select>

            <button
              onClick={handleReschedule}
              className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

const Card = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
    <h3 className="font-bold text-sm flex items-center gap-2">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const Row = ({ label, value, bold, highlight }: any) => (
  <div
    className={`flex justify-between text-sm ${
      bold ? 'font-extrabold text-lg' : ''
    }`}
  >
    <span>{label}</span>
    <span className={highlight ? 'text-green-600 font-bold' : ''}>
      ₹{Math.abs(value)}
    </span>
  </div>
);
