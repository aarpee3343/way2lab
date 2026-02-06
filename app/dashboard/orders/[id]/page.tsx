'use client';

import { useEffect, useState, use, useCallback } from 'react';
import axios from 'axios';
import AiHealthDashboard from './AiHealthDashboard';
import {
  Calendar,
  Clock,
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
  Activity,
  Microscope,
  Package
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';

/* ---------------- HELPERS ---------------- */
// ... (Keep your existing formatDate, getAgeLabel, isRescheduleAllowed helpers here) ...
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const getAgeLabel = (dob?: string | null) => {
  if (!dob) return '-';
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  if (age < 1) return 'Infant';
  if (age < 18) return 'Minor';
  return `${age} yrs`;
};

const isRescheduleAllowed = (orderDateStr: string) => {
  if (!orderDateStr) return false;
  const orderDate = new Date(orderDateStr);
  const deadline = new Date(orderDate);
  deadline.setDate(orderDate.getDate() - 1);
  deadline.setHours(18, 0, 0, 0);
  return new Date() < deadline;
};

/* ---------------- PAGE ---------------- */

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  
  // Reschedule State
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<'home_collection' | 'center_visit'>('home_collection');

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/order/${id}`, { withCredentials: true });
      setOrder(res.data);
      setNewType(res.data.collectionType);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to load order';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ... (Keep your existing Handlers: onRescheduleClick, handleConfirmReschedule, handleCancel) ...
  const onRescheduleClick = () => {
    if (!isRescheduleAllowed(order.preferredDate)) {
      alert("You can't do this action now, contact Support");
      return;
    }
    setOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !newTime) {
      toast.warning('Select date & time');
      return;
    }
    try {
      await axios.put(`/api/order/${order.id}/reschedule`, { date: newDate, time: newTime, collectionType: newType }, { withCredentials: true });
      toast.success('Order rescheduled');
      setOpen(false);
      fetchOrder();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Reschedule failed');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axios.put(`/api/order/${order.id}/cancel`, {}, { withCredentials: true });
      toast.success('Order cancelled');
      fetchOrder();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Cancel failed');
    }
  };

  const handleShareToggle = async (share: boolean) => {
    if (!order) return;
    setSharing(true);
    try {
      await axios.patch('/api/user/reports/share', { orderId: order.id, share });
      toast.success(share ? 'Shared with corporate' : 'Unshared from corporate');
      setOrder((prev: any) => ({ ...prev, isReportSharedWithCorp: share }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update sharing');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading order...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="text-center space-y-3">
          <p className="font-medium">Unable to load this order.</p>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Order not found.</div>;
  }

  const mrp = Number(order.totalAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const rawHome = Number(order.homeCollectionCharges || 0);
  const rawFinal = Number(order.finalAmount || 0);

  const isCorporatePackageOrder = Boolean(order.package?.isCorporate);
  const isCorporateSponsored =
    isCorporatePackageOrder &&
    (order.paymentStatus === 'CORPORATE_BILLING' || order.paymentMode === 'Corporate Credit');

  const home = isCorporatePackageOrder ? 0 : rawHome;
  const final = isCorporateSponsored
    ? 0
    : (isCorporatePackageOrder ? Math.max(0, rawFinal - rawHome) : rawFinal);

  return (
    <div className="min-h-screen bg-slate-100 relative">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-8 pb-16 rounded-b-[2.5rem] shadow-lg mb-[-3rem]">
        <div className="max-w-3xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Order #{order.orderNumber}</h1>
            <p className="text-blue-100 text-sm mt-1 opacity-90">Booked on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">{order.status}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-5 pb-24">

        {/* 1. PATIENT */}
        <Card title="Patient Details" icon={<User />}>
          <p className="font-bold">{order.patientName}</p>
          <p className="text-sm text-slate-600">{getAgeLabel(order.patientDob)} - {order.patientGender}</p>
          {order.patientPhone && <p className="text-sm mt-1 text-slate-500 flex items-center gap-2"><Phone size={14}/> {order.patientPhone}</p>}
        </Card>

        {/* 2. ORDER ITEMS (TESTS & PACKAGES) */}
        <Card title="Order Items" icon={<Microscope />}>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${item.itemType === 'package' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.itemType === 'package' ? <Package size={18} /> : <FlaskConical size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.itemName}</p>
                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{item.itemType}</span>
                  </div>
                </div>
                <p className="font-bold text-slate-700 text-sm">INR {item.price}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 3. TECHNICIAN SECTION */}
        <Card title="Technician Details" icon={<UserCog />}>
          {order.technician ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl">
                {order.technician.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{order.technician.name}</p>
                <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                  <Phone size={14} /> {order.technician.phone}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UserCog className="mx-auto text-slate-300 mb-2" size={24} />
              <p className="text-sm text-slate-500 font-medium">Technician not assigned yet</p>
              <p className="text-xs text-slate-400">You can see technician details here once assigned.</p>
            </div>
          )}
        </Card>

        {/* 4. AI REPORT SUMMARY */}
        {/* Only show if Report is generated and not pre-employment */}
        {!order.package?.isPreEmployment && (order.reportSummary || order.reports?.length > 0) && (
          <Card title="Report Summary" icon={<Activity className="text-indigo-600" />}>
            {order.reportSummary ? (
              <>
                <AiHealthDashboard 
                  dataString={order.reportSummary.content} 
                  orderId={order.id} 
                  orderNumber={order.orderNumber}
                />
                <div className="mt-4 pt-3 border-t flex justify-between text-[10px] text-slate-400">
                  <span>Powered by MediAI</span><span>Not a diagnosis</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic">
                AI Summary will be generated once the report is uploaded.
              </p>
            )}
          </Card>
        )}

        {/* 5. DOWNLOAD REPORTS */}
        {!order.package?.isPreEmployment ? (
          <Card title="Download Reports" icon={<FileText />}>
            {order.reports?.length > 0 ? (
              <div className="space-y-2">
                {order.reports.map((r: any) => (
                  <a key={r.id} href={`/api/reports/${r.id}`} target="_blank" className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
                    <span className="text-sm font-medium text-blue-700">{r.reportType || 'Lab Report'}</span>
                    <FileDown size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Reports will appear here once uploaded by the lab.</p>
            )}

            {order.reports?.length > 0 && order.canShare && (
              <button
                onClick={() => handleShareToggle(!order.isReportSharedWithCorp)}
                disabled={sharing}
                className={`mt-4 w-full h-11 rounded-xl font-bold text-sm border transition-all ${
                  order.isReportSharedWithCorp
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sharing
                  ? 'Updating...'
                  : order.isReportSharedWithCorp
                    ? 'Shared with Corporate'
                    : 'Share with Corporate'}
              </button>
            )}
          </Card>
        ) : (
          <Card title="Download Reports" icon={<FileText />}>
            <p className="text-sm text-slate-500">
              Pre-employment reports are shared directly with your corporate team.
            </p>
          </Card>
        )}

        {/* 6. LAB DETAILS */}
        {order.lab && (
          <Card title="Laboratory" icon={<Building2 />}>
            <p className="font-bold">{order.lab.labName}</p>
            <p className="text-sm text-slate-600">{order.lab.address}, {order.lab.city} - {order.lab.pincode}</p>
            {order.lab.contactNo && <p className="text-sm mt-1 text-blue-600 font-medium flex gap-1"><Phone size={14}/> {order.lab.contactNo}</p>}
          </Card>
        )}

        {/* 7. SCHEDULE & PAYMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Schedule" icon={<Calendar />}>
            <p className="font-semibold">{formatDate(order.preferredDate)}</p>
            <p className="text-sm flex items-center gap-1 text-slate-600"><Clock size={14} /> {order.preferredTimeSlot}</p>
            <span className="inline-block mt-2 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
              {order.collectionType === 'home_collection' ? 'Home Collection' : 'Lab Visit'}
            </span>
          </Card>

          <Card title="Payment" icon={<Receipt />}>
            <Row label="MRP" value={mrp} />
            <Row label="Discount" value={-discount} />
            <Row label="Collection" value={home} />
            <div className="border-t my-1 pt-1"><Row label="Paid" value={final} bold /></div>
            {isCorporateSponsored && (
              <p className="text-xs font-bold text-emerald-700 mt-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                Corporate sponsored package - Payable INR 0
              </p>
            )}
            {isCorporatePackageOrder && !isCorporateSponsored && (
              <p className="text-xs font-bold text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                Corporate benefit (Self Pay) - Home collection charges are waived
              </p>
            )}
          </Card>
        </div>

        {/* FOOTER ACTIONS (Only Pending) */}
        {order.status === 'PENDING' && (
          <div className="sticky bottom-4 z-20">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl flex gap-3">
              <button onClick={onRescheduleClick} className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                <RefreshCcw size={18} /> Reschedule
              </button>
              <button onClick={handleCancel} className="flex-1 h-12 bg-white border border-red-200 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                <Ban size={18} /> Cancel
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Reschedule Modal (Same as before) */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Reschedule</h3>
              <button onClick={() => setOpen(false)}><X/></button>
            </div>
            <div className="space-y-4">
              <input type="date" className="w-full border p-3 rounded-xl" onChange={e => setNewDate(e.target.value)} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
              <select className="w-full border p-3 rounded-xl" onChange={e => setNewTime(e.target.value)}>
                <option>07:00 AM - 08:00 AM</option>
                <option>08:00 AM - 09:00 AM</option>
                <option>09:00 AM - 10:00 AM</option>
              </select>
              <button onClick={handleConfirmReschedule} className="w-full bg-black text-white py-3 rounded-xl font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UI Components
const Card = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-full">
    <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800 mb-3 uppercase tracking-wider">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const Row = ({ label, value, bold }: any) => (
  <div className={`flex justify-between text-sm ${bold ? 'font-extrabold text-slate-900 text-lg' : 'text-slate-600 mb-1'}`}>
    <span>{label}</span>
    <span>INR {Math.abs(value).toLocaleString()}</span>
  </div>
);
