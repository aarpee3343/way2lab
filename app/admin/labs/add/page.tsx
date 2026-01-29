'use client';

import { useState, useEffect } from 'react';
import { getLabFormData, createLabAction } from '@/app/actions/adminLabActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Package, FlaskConical, CheckCircle2, ArrowRight, ArrowLeft, 
  Search, Save, Loader2, Star, Clock, Shield 
} from 'lucide-react';
import Script from 'next/script'; // For Google Maps

// Define available features
const LAB_FEATURES = [
  { id: 'nabl', label: 'NABL Accredited', icon: Shield },
  { id: '24x7', label: '24x7 Open', icon: Clock },
  { id: 'home_collect', label: 'Free Home Collection', icon: MapPin },
  { id: 'reports_online', label: 'Online Reports', icon: Building2 },
];

export default function AddLabWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  
  const [form, setForm] = useState({
    labName: '', contactNo: '', email: '', 
    address: '', city: '', pincode: '', homeCollectionCharges: 0,
    latitude: 0, longitude: 0, googlePlaceId: '', 
    rating: 4.5, reviewCount: 100,
    features: [] as string[],
    timings: '08:00 AM - 08:00 PM', // Default timing string
    pincodesStr: '', 
    packages: [] as any[],
    tests: [] as any[]
  });

  useEffect(() => {
    getLabFormData().then(res => {
      setForm(prev => ({
        ...prev,
        packages: res.packages.map(p => ({ ...p, selected: false, price: 0, discount: 0 })),
        tests: res.tests.map(t => ({ ...t, selected: false, price: 0, discount: 0 }))
      }));
      setLoading(false);
    });
  }, []);

  // Initialize Google Autocomplete
  const initAutocomplete = () => {
    if (!window.google) return;
    const input = document.getElementById('location-search') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      fields: ['place_id', 'geometry', 'name', 'formatted_address', 'rating', 'user_ratings_total']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setForm(prev => ({
        ...prev,
        labName: place.name || prev.labName,
        address: place.formatted_address || prev.address,
        latitude: place.geometry?.location?.lat() || 0,
        longitude: place.geometry?.location?.lng() || 0,
        googlePlaceId: place.place_id || '',
        rating: place.rating || 4.5,
        reviewCount: place.user_ratings_total || 0
      }));
      toast.success("Location details fetched from Google!");
    });
  };

  const handleNext = () => {
    if (step === 1 && (!form.labName || !form.pincode)) {
      toast.error("Please fill Lab Name & Pincode");
      return;
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const pincodes = form.pincodesStr.split(',').map(s => s.trim()).filter(Boolean);
    
    // Ensure numeric values are numbers
    const payload = { 
      ...form, 
      pincodes,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount)
    };

    const res = await createLabAction(payload);
    
    if (res.success) {
      toast.success("Lab Added Successfully!");
      router.push('/admin/labs');
    } else {
      toast.error("Failed to add lab");
      setSubmitting(false);
    }
  };

  const toggleFeature = (id: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(id) 
        ? prev.features.filter(f => f !== id)
        : [...prev.features, id]
    }));
  };

  const toggleItem = (type: 'packages' | 'tests', id: number, field: string, val: any) => {
    setForm(prev => ({
      ...prev,
      [type]: prev[type].map((item: any) => 
        item.id === id ? { ...item, [field]: val } : item
      )
    }));
  };

  if(loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
       <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
       <p className="text-sm font-medium">Loading Wizard...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Load Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />

      {/* 1. Progress Header */}
      <div className="flex justify-between items-center mb-10 px-4 relative">
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-10 rounded-full">
           <div className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>

        {[
          { id: 1, label: "Identity", icon: Building2 },
          { id: 2, label: "Coverage", icon: MapPin },
          { id: 3, label: "Packages", icon: Package },
          { id: 4, label: "Tests", icon: FlaskConical },
        ].map((s) => (
          <div key={s.id} onClick={() => step > s.id && setStep(s.id)} className={`flex flex-col items-center gap-2 cursor-pointer group ${step === s.id ? 'scale-105' : ''} transition-transform`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-sm ${
               step === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 
               step > s.id ? 'bg-emerald-500 border-emerald-500 text-white' : 
               'bg-white border-slate-200 text-slate-400 group-hover:border-blue-300'
            }`}>
              {step > s.id ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Content Area */}
        <div className="flex-1 p-8">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lab Identity</h2>
                 <p className="text-slate-500 mt-1">Search Google Maps to auto-fill details or enter manually.</p>
              </div>

              {/* Google Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  id="location-search"
                  onFocus={initAutocomplete}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="Search lab on Google Maps (e.g. Apollo Diagnostics)..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="label">Lab Name <span className="text-rose-500">*</span></label>
                  <input className="input-field text-lg font-semibold" value={form.labName} onChange={e => setForm({...form, labName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Contact Number</label>
                  <input className="input-field" value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} />
                </div>
                <div>
                  <label className="label">Official Email</label>
                  <input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="label">Full Address</label>
                  <input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <label className="label">Pincode <span className="text-rose-500">*</span></label>
                  <input className="input-field font-mono" maxLength={6} value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
                </div>
                
                {/* Lat/Lng Display (Read Only) */}
                <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div>
                      <label className="label text-[10px]">Latitude</label>
                      <input className="bg-transparent font-mono text-xs w-full" readOnly value={form.latitude || ''} placeholder="Auto-filled from Google" />
                   </div>
                   <div>
                      <label className="label text-[10px]">Longitude</label>
                      <input className="bg-transparent font-mono text-xs w-full" readOnly value={form.longitude || ''} placeholder="Auto-filled from Google" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FEATURES & COVERAGE */}
          {step === 2 && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-4">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Features & Coverage</h2>
                 <p className="text-slate-500 mt-1">Highlight lab amenities and service areas.</p>
              </div>

              {/* Feature Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LAB_FEATURES.map(feat => (
                  <div 
                    key={feat.id}
                    onClick={() => toggleFeature(feat.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 text-center ${
                      form.features.includes(feat.id) 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    <feat.icon size={24} />
                    <span className="text-xs font-bold">{feat.label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="label">Lab Timings</label>
                    <input className="input-field" placeholder="e.g. Mon-Sat: 8AM-8PM" value={form.timings} onChange={e => setForm({...form, timings: e.target.value})} />
                 </div>
                 
                 <div className="col-span-2">
                    <label className="label mb-2">Service Pincodes (Comma Separated)</label>
                    <textarea 
                      className="input-field h-32 font-mono" 
                      placeholder="122001, 122002..."
                      value={form.pincodesStr}
                      onChange={e => setForm({...form, pincodesStr: e.target.value})}
                    />
                 </div>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: INVENTORY */}

          {(step === 3 || step === 4) && (

            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">

              <div className="flex justify-between items-end mb-6">

                 <div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assign {step === 3 ? 'Packages' : 'Tests'}</h2>

                    <p className="text-slate-500 mt-1">Select items and set custom pricing for this lab.</p>

                 </div>

                 <div className="relative group">

                    <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16}/>

                    <input className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all" placeholder="Search inventory..." />

                 </div>

              </div>



              <div className="flex-1 overflow-hidden border border-slate-200 rounded-xl shadow-inner bg-slate-50/50 flex flex-col">

                <div className="overflow-y-auto custom-scrollbar flex-1 p-1">

                  <table className="w-full text-sm text-left border-collapse">

                    <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs uppercase font-bold text-slate-500">

                      <tr>

                        <th className="px-4 py-3 w-16 text-center">Select</th>

                        <th className="px-4 py-3">Item Name</th>

                        <th className="px-4 py-3 w-40">Price (₹)</th>

                        <th className="px-4 py-3 w-32">Discount (%)</th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-200/50 bg-white">

                      {form[step === 3 ? 'packages' : 'tests'].map((item: any) => (

                        <tr key={item.id} className={`group transition-all ${item.selected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>

                          <td className="px-4 py-3 text-center">

                            <input

                              type="checkbox"

                              checked={item.selected}

                              onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'selected', e.target.checked)}

                              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer transition-all"

                            />

                          </td>

                          <td className="px-4 py-3">

                             <span className={`font-bold transition-colors ${item.selected ? 'text-blue-700' : 'text-slate-700'}`}>

                                {step === 3 ? item.packageName : item.testName}

                             </span>

                          </td>

                          <td className="px-4 py-3">

                            <div className={`relative transition-all ${item.selected ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-95 pointer-events-none'}`}>

                               <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">₹</span>

                               <input

                                 type="number"

                                 className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-sm font-bold focus:outline-none focus:border-blue-500 shadow-sm"

                                 value={item.price}

                                 onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'price', e.target.value)}

                               />

                            </div>

                          </td>

                          <td className="px-4 py-3">

                            <div className={`relative transition-all ${item.selected ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-95 pointer-events-none'}`}>

                               <input

                                 type="number"

                                 className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-6 py-1.5 text-sm font-bold focus:outline-none focus:border-blue-500 shadow-sm"

                                 value={item.discount}

                                 onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'discount', e.target.value)}

                               />

                               <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">%</span>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-20">
          <button 
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-0"
          >
            <ArrowLeft size={18}/> Back
          </button>

          {step < 4 ? (
            <button onClick={handleNext} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-black shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Next Step <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}
              Complete & Add Lab
            </button>
          )}
        </div>

      </div>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wide; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400; }
      `}</style>
    </div>
  );
}