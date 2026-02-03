'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// REMOVED: import Cookies from 'js-cookie'; 
import { useBookingStore } from '@/store/useBookingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Plus, Check, ChevronRight, X, Home, Briefcase, ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutDetails() {
  const [showPincodeAlert, setShowPincodeAlert] = useState(false);
  const router = useRouter();
  const { setPatient, setAddress, patientType, selectedAddressId, selectedFamilyMemberId } = useBookingStore();
  
  const { lab } = useCartStore();
  const allowedPincode = lab?.servicePincode;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState<'address' | 'member' | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Data
  const [newAddr, setNewAddr] = useState({ address_line1: '', address_line2: '', city: '', state: 'Haryana', pincode: '', type: 'Home' });
  const [newMember, setNewMember] = useState({ name: '', relationship: 'Parent', gender: 'Male', date_of_birth: '', phone: '' });

  const fetchUser = async () => {
    try {
      // ✅ FIX: No headers needed, browser sends HttpOnly cookie automatically
      const [addrRes, famRes, userRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/family`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`)
      ]);
      
      setAddresses(addrRes.data);
      setFamily(famRes.data);
      setMe(userRes.data?.user || userRes.data);
    } catch (e: any) { 
      console.error(e); 
      // ✅ FIX: Redirect if unauthorized
      if (e.response?.status === 401) {
         toast.error("Session expired. Please login.");
         router.push('/login?redirect=/checkout/details');
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!allowedPincode) return;
    if (addresses.length === 0) return;

    const validAddress = addresses.find(
      (addr) => String(addr.pincode) === String(allowedPincode)
    );

    if (validAddress) {
      setAddress(validAddress.id);
      setShowPincodeAlert(false);
    } else {
      setAddress(null as any);
      setShowPincodeAlert(true);
    }
  }, [addresses, allowedPincode, setAddress]);

  const handleSaveData = async (type: 'address' | 'member') => {
    setFormLoading(true);
    try {
      // ✅ FIX: No headers needed
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/checkout-helper`, {
        action: type === 'address' ? 'add_address' : 'add_member',
        ...(type === 'address' ? newAddr : newMember)
      });
      
      await fetchUser();
      setActiveModal(null);
      toast.success(`${type === 'address' ? 'Address' : 'Member'} added successfully`);
    } catch (err) { 
      toast.error("Failed to save data"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleNext = () => {
    if (!selectedAddressId) {
      toast.error("Please select a valid address");
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

    if (allowedPincode && selectedAddress && String(selectedAddress.pincode) !== String(allowedPincode)) {
      toast.error(`Selected address does not match pincode ${allowedPincode}. Please select or add a valid address.`);
      return;
    }

    if (!patientType) {
      toast.error("Please select a patient");
      return;
    }

    router.push('/checkout/schedule');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-800">Details</h1>
          <div className="flex gap-1 mt-1.5">
            <div className="h-1 w-8 bg-blue-600 rounded-full"/>
            <div className="h-1 w-8 bg-slate-200 rounded-full"/>
            <div className="h-1 w-8 bg-slate-200 rounded-full"/>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 1/3</div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Patient Selection */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Who is the test for?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Myself Card */}
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => setPatient('self')}
              className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                patientType === 'self' ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600' : 'border-transparent bg-white shadow-sm hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                  patientType === 'self' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {me?.name?.charAt(0)}
                </div>
                <div>
                  <p className={`font-bold transition-colors ${patientType === 'self' ? 'text-blue-900' : 'text-slate-700'}`}>Myself</p>
                  <p className="text-xs text-slate-500 font-medium">{me?.name}</p>
                </div>
                {patientType === 'self' && (
                  <div className="ml-auto bg-blue-600 text-white rounded-full p-1">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Family Members */}
            {family.map((f: any) => (
              <motion.div key={f.id} whileTap={{ scale: 0.98 }} onClick={() => setPatient('family_member', f.id)}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedFamilyMemberId === f.id ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600' : 'border-transparent bg-white shadow-sm hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                    selectedFamilyMemberId === f.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-bold transition-colors ${selectedFamilyMemberId === f.id ? 'text-purple-900' : 'text-slate-700'}`}>{f.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{f.relationship}</p>
                  </div>
                  {selectedFamilyMemberId === f.id && (
                    <div className="ml-auto bg-purple-600 text-white rounded-full p-1">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Add New Button */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveModal('member')}
              className="p-4 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all h-[84px] group"
            >
              <div className="bg-slate-100 p-2 rounded-full group-hover:bg-slate-200 transition-colors">
                <Plus size={20} /> 
              </div>
              <span className="font-bold text-sm">Add Member</span>
            </motion.button>
          </div>
        </section>

        {/* Address Selection */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Sample Collection Location
          </h2>

          <div className="space-y-3">
            {addresses.map((addr: any) => {
              const isAllowed = !allowedPincode || String(addr.pincode) === String(allowedPincode);
              return (
                <motion.div
                  key={addr.id}
                  whileTap={{ scale: isAllowed ? 0.99 : 1 }}
                  onClick={() => {
                    if (!isAllowed) {
                      toast.error(`Address pincode does not match lab service area (${allowedPincode}).`);
                      return;
                    }
                    setAddress(addr.id);
                  }}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    !isAllowed
                      ? 'opacity-50 cursor-not-allowed bg-slate-50'
                      : selectedAddressId === addr.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500 cursor-pointer'
                        : 'border-transparent bg-white shadow-sm hover:border-slate-200 cursor-pointer'
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${selectedAddressId === addr.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {addr.type === 'Office' ? <Briefcase size={20} /> : <Home size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold transition-colors ${selectedAddressId === addr.id ? 'text-emerald-900' : 'text-slate-700'}`}>{addr.type}</span>
                      {selectedAddressId === addr.id && <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">SELECTED</span>}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{addr.addressLine1}, {addr.city}</p>
                  </div>

                  {selectedAddressId === addr.id && (
                    <div className="bg-emerald-500 text-white rounded-full p-1"><Check size={14} strokeWidth={3} /></div>
                  )}
                </motion.div>
              );
            })}

            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveModal('address')}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all group"
            >
              <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-slate-200 transition-colors"><Plus size={18} /></div>
              <span className="font-bold text-sm">Add New Address</span>
            </motion.button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 md:pb-4 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={handleNext}
            className="w-full bg-slate-900 text-white h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20"
          >
            Next Step <ChevronRight size={20} />
          </button>
        </div>
      </div>
      {/* Ensure you keep the Modals code block exactly as it was in your previous snippet */}
      <AnimatePresence>
        {showPincodeAlert && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <MapPin size={28} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
                Address not available
              </h3>

              <p className="text-sm text-slate-500 text-center mb-5 leading-relaxed">
                You searched tests for pincode{' '}
                <span className="font-bold text-slate-700">{allowedPincode}</span>.
                <br />
                Please add or select an address with the same pincode to continue.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowPincodeAlert(false);

                    setNewAddr(prev => ({
                      ...prev,
                      pincode: String(allowedPincode || '')
                    }));

                    setActiveModal('address');
                  }}
                  className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold hover:bg-black transition-all"
                >
                  Add New Address
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"/>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">{activeModal === 'address' ? 'New Address' : 'New Member'}</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              {activeModal === 'address' ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveData('address'); }} className="space-y-4">
                  <div className="space-y-3">
                    <input placeholder="Flat / House No / Floor" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all" required onChange={e => setNewAddr({...newAddr, address_line1: e.target.value})} />
                    <input placeholder="Area / Sector / Locality" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all" onChange={e => setNewAddr({...newAddr, address_line2: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="City" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all" required onChange={e => setNewAddr({...newAddr, city: e.target.value})} />
                      <input placeholder="Pincode" value={newAddr.pincode} disabled={!!allowedPincode} className={`w-full rounded-xl p-3.5 font-medium outline-none transition-all ${allowedPincode ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white'}`} required />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Label As</p>
                    <div className="flex gap-2">
                      {['Home', 'Office', 'Other'].map(t => (
                        <button type="button" key={t} onClick={() => setNewAddr({...newAddr, type: t})} 
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${newAddr.type === t ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button disabled={formLoading} className="w-full bg-blue-600 text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70">
                    {formLoading ? 'Saving...' : 'Save Address'}
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveData('member'); }} className="space-y-4">
                  <input placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all" required onChange={e => setNewMember({...newMember, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all text-slate-600" onChange={e => setNewMember({...newMember, relationship: e.target.value})}>
                      <option>Parent</option><option>Spouse</option><option>Child</option><option>Sibling</option>
                    </select>
                    <select className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all text-slate-600" onChange={e => setNewMember({...newMember, gender: e.target.value})}>
                      <option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all text-slate-600" required onChange={e => setNewMember({...newMember, date_of_birth: e.target.value})} />
                    <input placeholder="Phone (Optional)" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 font-medium outline-none transition-all" onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                  </div>
                  <button disabled={formLoading} className="w-full bg-blue-600 text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70">
                    {formLoading ? 'Saving...' : 'Save Member'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}