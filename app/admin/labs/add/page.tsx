'use client';

import { useState, useEffect } from 'react';
import { getLabFormData, createLabAction } from '@/app/actions/adminLabActions';
import { fetchStates, fetchCities, fetchPincodes } from '@/app/actions/locationActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [identityCitiesList, setIdentityCitiesList] = useState<string[]>([]);
  const [identityPincodesList, setIdentityPincodesList] = useState<string[]>([]);
  const [fetchingIdentityLoc, setFetchingIdentityLoc] = useState(false);

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
    isApiIntegrated: false,
    apiProvider: '',
    apiBaseUrl: '',
    apiAuthType: 'API_KEY',
    apiUsername: '',
    apiPassword: '',
    apiKey: '',
    apiSecret: '',
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
          tests: formData.tests.map(t => ({
            id: t.id,
            testName: t.testName,
            basePrice: Number(t.price) || 0,
            baseDiscount: Number(t.discount) || 0,
            selected: false,
            price: 0,
            discount: 0
          }))
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
  const handleIdentityStateChange = async (stateName: string) => {
    setForm(prev => ({ ...prev, state: stateName, city: '', pincode: '' }));
    setIdentityCitiesList([]);
    setIdentityPincodesList([]);

    if (!stateName) return;

    setFetchingIdentityLoc(true);
    try {
      const cities = await fetchCities(stateName);
      setIdentityCitiesList(cities);
    } finally {
      setFetchingIdentityLoc(false);
    }
  };

  const handleIdentityCityChange = async (cityName: string) => {
    setForm(prev => ({ ...prev, city: cityName, pincode: '' }));
    setIdentityPincodesList([]);

    if (!cityName) return;

    setFetchingIdentityLoc(true);
    try {
      const pins = await fetchPincodes(cityName);
      setIdentityPincodesList(Array.from(new Set(pins)));
    } finally {
      setFetchingIdentityLoc(false);
    }
  };

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
    if (form.isApiIntegrated) {
      if (!String(form.apiProvider || '').trim()) {
        toast.error('API provider is required when integration is enabled');
        return;
      }
      if (!String(form.apiBaseUrl || '').trim()) {
        toast.error('API base URL is required when integration is enabled');
        return;
      }

      const hasCredentials =
        Boolean(String(form.apiKey || '').trim()) ||
        (Boolean(String(form.apiUsername || '').trim()) && Boolean(String(form.apiPassword || '').trim())) ||
        Boolean(String(form.apiSecret || '').trim());

      if (!hasCredentials) {
        toast.error('Add API credentials (API key or username/password) to enable integration');
        return;
      }
    }

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
      toast.error(res.error || "Failed to add lab");
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

  const setAllTestsSelected = (selected: boolean) => {
    setForm(prev => ({
      ...prev,
      tests: prev.tests.map((t: any) => ({ ...t, selected }))
    }));
  };

  const applyBasePricingToTests = (onlySelected: boolean) => {
    setForm(prev => ({
      ...prev,
      tests: prev.tests.map((t: any) => {
        if (onlySelected && !t.selected) return t;
        return {
          ...t,
          price: Number(t.basePrice) || 0,
          discount: Number(t.baseDiscount) || 0
        };
      })
    }));
  };

  const selectAllAndUseBasePricing = () => {
    setForm(prev => ({
      ...prev,
      tests: prev.tests.map((t: any) => ({
        ...t,
        selected: true,
        price: Number(t.basePrice) || 0,
        discount: Number(t.baseDiscount) || 0
      }))
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
    <div className="admin-space-y pb-24">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />

      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Add Lab Partner</h1>
          <p className="admin-page-subtitle">Create lab profile, coverage, and inventory pricing.</p>
        </div>
        <Link href="/admin/labs" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back to Labs
        </Link>
      </div>

      {/* STEPPER */}
      <div className="admin-stepper">
        {[
          { id: 1, label: "Identity", icon: Building2 },
          { id: 2, label: "Coverage", icon: MapPin },
          { id: 3, label: "Packages", icon: Package },
          { id: 4, label: "Tests", icon: FlaskConical },
        ].map((s) => (
          <div key={s.id} className={`admin-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'complete' : ''}`}>
            <div className="admin-step-circle">
              {step > s.id ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
            </div>
            <span className="admin-step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-card admin-wizard-card">
        <div className="admin-card-body admin-wizard-body">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="admin-space-y">
              <div>
                <h2 className="admin-page-title">Lab Identity</h2>
                <p className="admin-page-subtitle">Search via Google Maps or fill details manually.</p>
              </div>

              <div className="admin-form-section">
                <h3 className="admin-form-title">
                  <Search size={16} /> Google Maps Lookup
                </h3>
                <div className="relative">
                  <Search className="admin-search-icon" size={18} />
                  <input
                    id="location-search"
                    onFocus={initAutocomplete}
                    className="admin-form-input pl-10"
                    placeholder="Find lab on Google Maps..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="admin-form-section">
                  <h3 className="admin-form-title">
                    <Info size={16} /> General Info
                  </h3>
                  <div className="admin-form-grid">
                    <div>
                      <label className="admin-form-label">Lab Name *</label>
                      <input className="admin-form-input" value={form.labName} onChange={e => setForm({ ...form, labName: e.target.value })} />
                    </div>
                    <div>
                      <label className="admin-form-label">Full Address</label>
                      <input className="admin-form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                      <label className="admin-form-label">State</label>
                      {statesList.length > 0 ? (
                        <select
                          className="admin-form-select"
                          value={form.state}
                          onChange={e => handleIdentityStateChange(e.target.value)}
                        >
                          <option value="">Select State</option>
                          {statesList.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="admin-form-input"
                          placeholder="State"
                          value={form.state}
                          onChange={e => setForm({ ...form, state: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="admin-form-label">City</label>
                      {identityCitiesList.length > 0 || form.state ? (
                        <select
                          className="admin-form-select"
                          disabled={!form.state || fetchingIdentityLoc}
                          value={form.city}
                          onChange={e => handleIdentityCityChange(e.target.value)}
                        >
                          <option value="">{fetchingIdentityLoc ? 'Loading...' : 'Select City'}</option>
                          {identityCitiesList.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <input className="admin-form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="admin-form-label">Pincode *</label>
                      {identityPincodesList.length > 0 || form.city ? (
                        <select
                          className="admin-form-select font-mono"
                          disabled={!form.city || fetchingIdentityLoc}
                          value={form.pincode}
                          onChange={e => setForm({ ...form, pincode: e.target.value })}
                        >
                          <option value="">{fetchingIdentityLoc ? 'Loading...' : 'Select Pincode'}</option>
                          {identityPincodesList.map(pin => (
                            <option key={pin} value={pin}>{pin}</option>
                          ))}
                        </select>
                      ) : (
                        <input className="admin-form-input font-mono" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-form-section">
                  <h3 className="admin-form-title">
                    <Clock size={16} /> Contact & Operations
                  </h3>
                  <div className="admin-form-grid">
                    <div>
                      <label className="admin-form-label">Contact Number</label>
                      <input
                        className="admin-form-input"
                        placeholder="+91 9876543210"
                        value={form.contactNo}
                        onChange={e => setForm({ ...form, contactNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-form-label">Email</label>
                      <input
                        type="email"
                        className="admin-form-input"
                        placeholder="lab@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-form-label">Home Collection Charges (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="admin-form-input"
                        value={form.homeCollectionCharges}
                        onChange={e => setForm({ ...form, homeCollectionCharges: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="admin-form-label">Timings From</label>
                        <input
                          type="time"
                          className="admin-form-input"
                          value={form.timings?.from || ''}
                          onChange={e => setForm({ ...form, timings: { ...(form.timings || {}), from: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="admin-form-label">Timings To</label>
                        <input
                          type="time"
                          className="admin-form-input"
                          value={form.timings?.to || ''}
                          onChange={e => setForm({ ...form, timings: { ...(form.timings || {}), to: e.target.value } })}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="admin-form-label">Lab Features</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LAB_FEATURES.map(feature => (
                          <label key={feature.id} className="admin-form-checkbox">
                            <input
                              type="checkbox"
                              checked={form.features?.includes(feature.id)}
                              onChange={(e) => {
                                const next = new Set(form.features || []);
                                if (e.target.checked) {
                                  next.add(feature.id);
                                } else {
                                  next.delete(feature.id);
                                }
                                setForm({ ...form, features: Array.from(next) });
                              }}
                            />
                            <span>{feature.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-form-section">
                  <h3 className="admin-form-title">
                    <Shield size={16} /> Compliance
                  </h3>
                  <div className="admin-form-grid">
                    <div>
                      <label className="admin-form-label">GST Number</label>
                      <input className="admin-form-input font-mono" value={form.gstNo || ''} onChange={e => setForm({ ...form, gstNo: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div>
                      <label className="admin-form-label">PAN Number</label>
                      <input className="admin-form-input font-mono" value={form.panNo || ''} onChange={e => setForm({ ...form, panNo: e.target.value })} placeholder="ABCDE1234F" />
                    </div>
                    <div className="col-span-2">
                      <label className="admin-form-label">Lab Active Status</label>
                      <div className="admin-form-checkbox">
                        <input type="checkbox" checked={form.activeStatus} onChange={e => setForm({ ...form, activeStatus: e.target.checked })} />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-form-section">
                  <h3 className="admin-form-title">
                    <Info size={16} /> API Integration (Optional)
                  </h3>
                  <div className="admin-form-grid">
                    <div className="col-span-2">
                      <label className="admin-form-label">Enable API Integration</label>
                      <div className="admin-form-checkbox">
                        <input
                          type="checkbox"
                          checked={form.isApiIntegrated}
                          onChange={e => setForm({ ...form, isApiIntegrated: e.target.checked })}
                        />
                        <span>Lab uses external API for bookings/status sync</span>
                      </div>
                    </div>

                    {form.isApiIntegrated && (
                      <>
                        <div>
                          <label className="admin-form-label">Provider *</label>
                          <input
                            className="admin-form-input"
                            placeholder="e.g. Apollo"
                            value={form.apiProvider || ''}
                            onChange={e => setForm({ ...form, apiProvider: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="admin-form-label">Auth Type</label>
                          <select
                            className="admin-form-select"
                            value={form.apiAuthType || 'API_KEY'}
                            onChange={e => setForm({ ...form, apiAuthType: e.target.value })}
                          >
                            <option value="API_KEY">API Key</option>
                            <option value="BASIC">Username & Password</option>
                            <option value="TOKEN">Token</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="admin-form-label">API Base URL *</label>
                          <input
                            className="admin-form-input"
                            placeholder="https://example.com/api"
                            value={form.apiBaseUrl || ''}
                            onChange={e => setForm({ ...form, apiBaseUrl: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="admin-form-label">API Username</label>
                          <input
                            className="admin-form-input"
                            value={form.apiUsername || ''}
                            onChange={e => setForm({ ...form, apiUsername: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="admin-form-label">API Password</label>
                          <input
                            type="password"
                            className="admin-form-input"
                            value={form.apiPassword || ''}
                            onChange={e => setForm({ ...form, apiPassword: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="admin-form-label">API Key</label>
                          <input
                            type="password"
                            className="admin-form-input"
                            value={form.apiKey || ''}
                            onChange={e => setForm({ ...form, apiKey: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="admin-form-label">API Secret / Token</label>
                          <input
                            type="password"
                            className="admin-form-input"
                            value={form.apiSecret || ''}
                            onChange={e => setForm({ ...form, apiSecret: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COVERAGE */}
          {step === 2 && (
            <div className="admin-space-y">
              <div>
                <h2 className="admin-page-title">Coverage</h2>
                <p className="admin-page-subtitle">Select serviceable pincodes for this lab.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="admin-form-section">
                  <h3 className="admin-form-title">Location Filter</h3>
                  <div className="admin-form-grid">
                    <div className="col-span-2">
                      <label className="admin-form-label">State</label>
                      <select className="admin-form-select" value={coverageState} onChange={(e) => handleStateChange(e.target.value)}>
                        <option value="">Select State</option>
                        {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="admin-form-label">District</label>
                      <select className="admin-form-select" disabled={!coverageState || fetchingLoc} value={coverageCity} onChange={(e) => handleCityChange(e.target.value)}>
                        <option value="">{fetchingLoc ? 'Loading...' : 'Select District'}</option>
                        {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="admin-form-section lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="admin-form-title">Available Pincodes</h3>
                    {pincodesList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTempSelectedPins(tempSelectedPins.size === pincodesList.length ? new Set() : new Set(pincodesList))}
                        className="admin-btn-secondary text-xs"
                      >
                        {tempSelectedPins.size === pincodesList.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[220px] overflow-y-auto admin-scrollbar">
                    {pincodesList.length > 0 ? (
                      Array.from(new Set(pincodesList)).map(pin => (
                        <label
                          key={pin}
                          className={`admin-chip cursor-pointer justify-center ${tempSelectedPins.has(pin) ? 'admin-chip-active' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={tempSelectedPins.has(pin)}
                            onChange={() => {
                              const newSet = new Set(tempSelectedPins);
                              if (newSet.has(pin)) {
                                newSet.delete(pin);
                              } else {
                                newSet.add(pin);
                              }
                              setTempSelectedPins(newSet);
                            }}
                          />
                          <span className="font-mono">{pin}</span>
                        </label>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                        Select state and district to list pincodes.
                      </div>
                    )}
                  </div>

                  {tempSelectedPins.size > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={addSelectedPinsToCoverage}
                        className="admin-btn-primary w-full"
                      >
                        <Plus size={16} /> Add {tempSelectedPins.size} Pins
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="admin-form-title">
                    <CheckCircle2 size={16} /> Coverage Summary ({addedPincodes.length})
                  </h3>
                  {addedPincodes.length > 0 && (
                    <button type="button" onClick={() => setAddedPincodes([])} className="admin-btn-secondary text-xs">
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto admin-scrollbar">
                  {addedPincodes.length > 0 ? (
                    addedPincodes.map(pin => (
                      <div key={`added-${pin}`} className="admin-chip">
                        <span className="font-mono">{pin}</span>
                        <button type="button" onClick={() => removePincode(pin)} className="admin-chip-remove">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No pincodes added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: INVENTORY */}
          {(step === 3 || step === 4) && (
            <div className="admin-space-y">
              <div>
                <h2 className="admin-page-title">Assign {step === 3 ? 'Packages' : 'Tests'}</h2>
                <p className="admin-page-subtitle">Select inventory and set lab-specific pricing.</p>
              </div>

              <div className="admin-table-container">
                <div className="admin-table-toolbar flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="admin-search-container">
                    <Search className="admin-search-icon" size={18} />
                    <input
                      value={inventorySearch}
                      onChange={e => setInventorySearch(e.target.value)}
                      className="admin-search-input"
                      placeholder={`Search ${step === 3 ? 'packages' : 'tests'}...`}
                    />
                  </div>
                  {step === 4 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAllTestsSelected(true)}
                        className="admin-btn-secondary text-xs"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllTestsSelected(false)}
                        className="admin-btn-secondary text-xs"
                      >
                        Clear Selection
                      </button>
                      <button
                        type="button"
                        onClick={() => applyBasePricingToTests(true)}
                        className="admin-btn-secondary text-xs"
                      >
                        Use Base Price and Discount
                      </button>
                      <button
                        type="button"
                        onClick={selectAllAndUseBasePricing}
                        className="admin-btn-primary text-xs"
                      >
                        Select All and Apply Base
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-table-wrapper admin-scrollbar">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="w-20 text-center">Status</th>
                        <th>Item Details</th>
                        <th className="w-44">Your Price (Rs.)</th>
                        <th className="w-32">Discount (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item: any) => (
                        <tr key={item.id} className={item.selected ? 'bg-slate-50' : ''}>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'selected', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="admin-table-row-primary">{step === 3 ? item.packageName : item.testName}</span>
                              {step === 3 && (
                                <button onClick={() => setOpenPackage(item)} className="text-xs text-blue-600 text-left">
                                  View included tests
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={`relative ${item.selected ? 'opacity-100' : 'opacity-40'}`}>
                              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">Rs.</span>
                              <input
                                type="number"
                                disabled={!item.selected}
                                className="admin-form-input admin-input-compact pl-12"
                                value={item.price}
                                onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'price', e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className={`relative ${item.selected ? 'opacity-100' : 'opacity-40'}`}>
                              <input
                                type="number"
                                disabled={!item.selected}
                                className="admin-form-input admin-input-compact pr-8"
                                value={item.discount}
                                onChange={e => toggleItem(step === 3 ? 'packages' : 'tests', item.id, 'discount', e.target.value)}
                              />
                              <span className="absolute right-3 top-2.5 text-slate-400 text-xs">%</span>
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

        {/* STICKY ACTION BAR */}
        <div className="admin-action-bar">
          <button
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className={`admin-btn-secondary ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft size={16}/> Previous
          </button>
          {step < 4 ? (
            <button onClick={handleNext} className="admin-btn-primary">
              Next Stage <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="admin-btn-primary bg-emerald-600 hover:bg-emerald-700">
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
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 admin-scrollbar">
              {openPackage.tests?.map((pt: any) => (
                <div key={pt.test.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> {pt.test.testName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
