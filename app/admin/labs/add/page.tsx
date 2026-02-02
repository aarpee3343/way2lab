'use client';

import { useState, useEffect } from 'react';
import { getLabFormData, createLabAction } from '@/app/actions/adminLabActions';
import { fetchStates, fetchCities, fetchPincodes } from '@/app/actions/locationActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { 
  Building2, MapPin, Package, FlaskConical, CheckCircle2, ArrowRight, ArrowLeft, 
  Search, Save, Loader2, Clock, Shield, X, Plus, Trash2, Info
} from 'lucide-react';
import Script from 'next/script';

const LAB_FEATURES = [
  { id: 'NABL', label: 'NABL Accredited', icon: Shield },
  { id: 'ISO_9001', label: 'ISO 9001 Certified', icon: Shield },
  { id: 'ISO_15189', label: 'ISO 15189 Certified', icon: Shield },
  { id: 'CLIA', label: 'CLIA Certified', icon: Shield },
  { id: 'FREE_HOME_COLLECTION', label: 'Free Home Collection', icon: MapPin },
  { id: 'PICKUP_60_MIN', label: '60 Min Pickup', icon: Clock },
];

export default function AddLabWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  
  // LOCATION STATES
  const [statesList, setStatesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [pincodesList, setPincodesList] = useState<string[]>([]);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  const [coverageState, setCoverageState] = useState('');
  const [coverageCity, setCoverageCity] = useState('');
  const [tempSelectedPins, setTempSelectedPins] = useState<Set<string>>(new Set());
  const [addedPincodes, setAddedPincodes] = useState<string[]>([]); 
  
  const [openPackage, setOpenPackage] = useState<any | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  const [form, setForm] = useState({
    labName: '',
    contactNo: '',
    email: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
    panNo: '',
    gstNo: '',
    activeStatus: true,
    homeCollectionCharges: 0,
    latitude: 0,
    longitude: 0,
    googlePlaceId: '',
    rating: 4.5,
    reviewCount: 0,
    features: [] as string[],
    timings: { from: '09:00', to: '21:00' },
    packages: [] as any[],
    tests: [] as any[],
  });

  // INITIAL DATA LOAD
  useEffect(() => {
    const init = async () => {
      try {
        const [states, formData] = await Promise.all([
          fetchStates(),
          getLabFormData()
        ]);
        setStatesList(states);
        setForm(prev => ({
          ...prev,
          packages: formData.packages.map(p => ({ ...p, selected: false, price: 0, discount: 0 })),
          tests: formData.tests.map(t => ({ ...t, selected: false, price: 0, discount: 0 }))
        }));
      } catch (err) {
        toast.error("Error loading initial data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // LOCATION HANDLERS
  const handleStateChange = async (stateName: string) => {
    setCoverageState(stateName);
    setCoverageCity('');
    setPincodesList([]);
    setFetchingLoc(true);
    try {
      const cities = await fetchCities(stateName);
      setCitiesList(cities);
    } finally {
      setFetchingLoc(false);
    }
  };

  const handleCityChange = async (cityName: string) => {
    setCoverageCity(cityName);
    setFetchingLoc(true);
    try {
      const pins = await fetchPincodes(cityName);
      setPincodesList(pins);
      setTempSelectedPins(new Set(pins)); 
    } finally {
      setFetchingLoc(false);
    }
  };

  const addSelectedPinsToCoverage = () => {
    if (tempSelectedPins.size === 0) {
      toast.error("Select at least one pincode first");
      return;
    }
    
    const newPins = Array.from(tempSelectedPins);
    // Merge with existing pins and remove any duplicates
    setAddedPincodes(prev => {
      const combined = Array.from(new Set([...prev, ...newPins]));
      return combined.sort(); 
    });

    // Clear the checkboxes so user can select from a different district if they want
    setTempSelectedPins(new Set());
    toast.success(`Added ${newPins.length} pincodes to coverage`);
  };

  const removePincode = (pin: string) => {
    setAddedPincodes(prev => prev.filter(p => p !== pin));
    toast.info(`Removed ${pin}`);
  };

  // GOOGLE AUTOCOMPLETE
  const initAutocomplete = () => {
    if (typeof window === 'undefined' || !window.google || !mapsLoaded) return;
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
    });
  };

  const handleNext = () => {
    if (step === 1 && (!form.labName || !form.pincode)) {
      toast.error("Lab Name & Primary Pincode are required");
      return;
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const finalPincodes = Array.from(new Set([form.pincode, ...addedPincodes])).filter(Boolean);
    
    const payload = { 
      ...form, 
      password: 'password123',
      pincodes: finalPincodes,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount)
    };

    const res = await createLabAction(payload);
    if (res.success) {
      toast.success("Lab created successfully!");
      router.push('/admin/labs');
    } else {
      toast.error(res.message || "Failed to add lab");
      setSubmitting(false);
    }
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
        <p className="text-sm font-medium tracking-tight">Syncing Database Records...</p>
    </div>
  );

  const inventoryList = form[step === 3 ? 'packages' : 'tests'];
  const filteredInventory = inventoryList.filter((item: any) => {
    const name = step === 3 ? item.packageName : item.testName;
    return name.toLowerCase().includes(inventorySearch.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />

      {/* STEPPER */}
      <div className="flex justify-between items-center mb-10 px-8 relative">
        <div className="absolute top-5 left-16 right-16 h-0.5 bg-slate-100 -z-10">
           <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
        {[
          { id: 1, label: "Identity", icon: Building2 },
          { id: 2, label: "Coverage", icon: MapPin },
          { id: 3, label: "Packages", icon: Package },
          { id: 4, label: "Tests", icon: FlaskConical },
        ].map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
               step >= s.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {step > s.id ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex-1 p-8 md:p-12">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lab Identity</h2>
                <p className="text-slate-500">Search via Google Maps or fill details manually.</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={22} />
                <input
                  id="location-search"
                  onFocus={initAutocomplete}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-base focus:outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                  placeholder="Find lab on Google Maps..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> General Info</h3>
                  <div className="space-y-4">
                    <div><label className="label">Lab Name *</label><input className="input-field" value={form.labName} onChange={e => setForm({ ...form, labName: e.target.value })} /></div>
                    <div><label className="label">Full Address</label><input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="label">City</label><input className="input-field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                      <div><label className="label">Pincode *</label><input className="input-field font-mono" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Compliance</h3>
                  <div className="space-y-4">
                    <div><label className="label">GST Number</label><input className="input-field font-mono" value={form.gstNo || ''} onChange={e => setForm({ ...form, gstNo: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
                    <div><label className="label">PAN Number</label><input className="input-field font-mono" value={form.panNo || ''} onChange={e => setForm({ ...form, panNo: e.target.value })} placeholder="ABCDE1234F" /></div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-sm font-bold text-slate-700">Lab Active Status</span>
                       <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={form.activeStatus} onChange={e => setForm({ ...form, activeStatus: e.target.checked })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COVERAGE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* LEFT: COMPACT FILTERS */}
                <div className="md:col-span-1 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Filter</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">State</label>
                      <select className="compact-input" value={coverageState} onChange={(e) => handleStateChange(e.target.value)}>
                        <option value="">Select State</option>
                        {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">District</label>
                      <select className="compact-input" disabled={!coverageState || fetchingLoc} value={coverageCity} onChange={(e) => handleCityChange(e.target.value)}>
                        <option value="">{fetchingLoc ? 'Loading...' : 'Select District'}</option>
                        {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* RIGHT: TIGHT PINCODE GRID */}
                <div className="md:col-span-3 border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Available Pincodes</span>
                    {pincodesList.length > 0 && (
                      <button 
                        onClick={() => setTempSelectedPins(tempSelectedPins.size === pincodesList.length ? new Set() : new Set(pincodesList))}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                      >
                        {tempSelectedPins.size === pincodesList.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="p-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {pincodesList.length > 0 ? (
                      Array.from(new Set(pincodesList)).map(pin => (
                        <label 
                          key={pin} 
                          className={`flex items-center justify-center py-1.5 px-2 rounded-lg border cursor-pointer transition-all ${
                            tempSelectedPins.has(pin) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={tempSelectedPins.has(pin)}
                            onChange={() => {
                              const newSet = new Set(tempSelectedPins);
                              newSet.has(pin) ? newSet.delete(pin) : newSet.add(pin);
                              setTempSelectedPins(newSet);
                            }}
                          />
                          <span className="text-xs font-mono font-bold">{pin}</span>
                        </label>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-slate-400 italic text-[11px]">
                        Select state and district to list pincodes
                      </div>
                    )}
                  </div>

                  {tempSelectedPins.size > 0 && (
                    <div className="p-2 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={addSelectedPinsToCoverage}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> Add {tempSelectedPins.size} Pins
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SUMMARY BAR: LOWER HEIGHT & SMALLER CHIPS */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Coverage ({addedPincodes.length})</h3>
                  </div>
                  {addedPincodes.length > 0 && (
                    <button onClick={() => setAddedPincodes([])} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase">Clear All</button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                  {addedPincodes.length > 0 ? (
                    addedPincodes.map(pin => (
                      <div key={`added-${pin}`} className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700 text-[11px]">
                        <span className="font-mono font-bold text-slate-300">{pin}</span>
                        <button onClick={() => removePincode(pin)} className="text-slate-500 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-[11px] italic">No pincodes added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: INVENTORY */}
          {(step === 3 || step === 4) && (
            <div className="flex flex-col h-full space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assign {step === 3 ? 'Packages' : 'Tests'}</h2>
                  <p className="text-slate-500 text-sm">Select inventory and set lab-specific pricing.</p>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-72 focus:bg-white transition-all" placeholder={`Search ${step === 3 ? 'packages' : 'tests'}...`} />
                </div>
              </div>

              <div className="flex-1 border-2 border-slate-100 rounded-3xl overflow-hidden shadow-inner bg-slate-50/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-6 py-4 w-20 text-center">Status</th>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4 w-44">Your Price (₹)</th>
                        <th className="px-6 py-4 w-32">Discount (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map((item: any) => (
                        <tr key={item.id} className={`transition-colors ${item.selected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}>
                          <td className="px-6 py-4 text-center">
                            <input type="checkbox" checked={item.selected} onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{step === 3 ? item.packageName : item.testName}</span>
                              {step === 3 && <button onClick={() => setOpenPackage(item)} className="text-[10px] font-black text-blue-600 text-left hover:underline uppercase mt-1">View Included Tests</button>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`relative transition-opacity ${item.selected ? 'opacity-100' : 'opacity-30'}`}>
                              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                              <input type="number" disabled={!item.selected} className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-black" value={item.price} onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'price', e.target.value)} />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`relative transition-opacity ${item.selected ? 'opacity-100' : 'opacity-30'}`}>
                              <input type="number" disabled={!item.selected} className="w-full pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-lg font-black" value={item.discount} onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'discount', e.target.value)} />
                              <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
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

        {/* STICKY ACTION BAR */}
        <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-200 flex justify-between items-center sticky bottom-0 z-50">
          <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-500 hover:bg-white hover:text-slate-900 transition-all disabled:opacity-0 flex items-center gap-2">
            <ArrowLeft size={16}/> Previous
          </button>
          {step < 4 ? (
            <button onClick={handleNext} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-black transition-all flex items-center gap-2 shadow-2xl shadow-slate-400">
              Next Stage <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-2xl shadow-emerald-200">
              {submitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Finalize Lab Creation
            </button>
          )}
        </div>
      </div>

      {openPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setOpenPackage(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{openPackage.packageName}</h3>
              <X className="cursor-pointer text-slate-400 hover:text-slate-900" onClick={() => setOpenPackage(null)} />
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {openPackage.tests?.map((pt: any) => (
                <div key={pt.test.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> {pt.test.testName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .label { @apply block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest; }
        .input-field { @apply w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-full hover:bg-slate-300; }
      `}</style>
    </div>
  );
}