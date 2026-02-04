'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/safe-toast';
import Script from 'next/script';

import {
  getLabById,
  getLabFormData,
  updateLabAction,
} from '@/app/actions/adminLabActions';

import { fetchStates, fetchCities, fetchPincodes } from '@/app/actions/locationActions';

import {
  Building2, MapPin, Package, FlaskConical, CheckCircle2,
  ArrowRight, ArrowLeft, Search, Save, Loader2,
  Clock, Shield, X, Plus, Info
} from 'lucide-react';

/* -------------------------------------------------
   CONSTANTS (same as Add)
------------------------------------------------- */

const LAB_FEATURES = [
  { id: 'NABL', label: 'NABL Accredited', icon: Shield },
  { id: 'ISO_9001', label: 'ISO 9001 Certified', icon: Shield },
  { id: 'ISO_15189', label: 'ISO 15189 Certified', icon: Shield },
  { id: 'CLIA', label: 'CLIA Certified', icon: Shield },
  { id: 'FREE_HOME_COLLECTION', label: 'Free Home Collection', icon: MapPin },
  { id: 'PICKUP_60_MIN', label: '60 Min Pickup', icon: Clock },
];

/* -------------------------------------------------
   PAGE
------------------------------------------------- */

export default function EditLabPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const labId = Number(id);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // LOCATION
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

  const [form, setForm] = useState<any>(null);

  /* -------------------------------------------------
     INITIAL LOAD (EDIT LOGIC)
  ------------------------------------------------- */

  useEffect(() => {
    if (!labId || Number.isNaN(labId)) {
      toast.error('Invalid lab ID');
      router.push('/admin/labs');
      return;
    }

    const init = async () => {
      try {
        const [states, inventory, lab] = await Promise.all([
          fetchStates(),
          getLabFormData(),
          getLabById(labId),
        ]);

        if (!lab) {
          toast.error('Lab not found');
          router.push('/admin/labs');
          return;
        }

        setStatesList(states);
        setAddedPincodes(lab.pincodes || []);

        const packages = inventory.packages.map(p => {
          const existing = lab.packages.find(lp => lp.id === p.id);
          return {
            ...p,
            selected: !!existing,
            price: existing?.price ?? 0,
            discount: existing?.discount ?? 0,
          };
        });

        const tests = inventory.tests.map(t => {
          const existing = lab.tests.find(lt => lt.id === t.id);
          return {
            ...t,
            selected: !!existing,
            price: existing?.price ?? 0,
            discount: existing?.discount ?? 0,
          };
        });

        setForm({
          labName: lab.labName,
          contactNo: lab.contactNo,
          email: lab.email,
          address: lab.address,
          state: lab.state,
          city: lab.city,
          pincode: lab.pincode,
          panNo: lab.panNo,
          gstNo: lab.gstNo,
          activeStatus: lab.activeStatus,
          homeCollectionCharges: lab.homeCollectionCharges,
          latitude: lab.latitude,
          longitude: lab.longitude,
          googlePlaceId: '',
          rating: lab.rating,
          reviewCount: lab.reviewCount,
          features: lab.features || [],
          timings: lab.timings ?? { from: '09:00', to: '21:00' },
          packages,
          tests,
        });
      } catch (e) {
        console.error(e);
        toast.error('Failed to load lab');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [labId, router]);

  /* -------------------------------------------------
     SAME HELPERS AS ADD
  ------------------------------------------------- */

  const toggleItem = (type: 'packages' | 'tests', id: number, field: string, val: any) => {
    setForm((prev: any) => ({
      ...prev,
      [type]: prev[type].map((item: any) =>
        item.id === id ? { ...item, [field]: val } : item
      ),
    }));
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
      toast.error('Select at least one pincode first');
      return;
    }

    const newPins = Array.from(tempSelectedPins);
    setAddedPincodes((prev: string[]) => {
      const combined = Array.from(new Set([...prev, ...newPins]));
      return combined.sort();
    });

    setTempSelectedPins(new Set());
    toast.success(`Added ${newPins.length} pincodes to coverage`);
  };

  const removePincode = (pin: string) => {
    setAddedPincodes((prev: string[]) => prev.filter(p => p !== pin));
    toast.info(`Removed ${pin}`);
  };

  const handleNext = () => {
    if (step === 1 && (!form.labName || !form.pincode)) {
      toast.error('Lab Name & Primary Pincode are required');
      return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      ...form,
      pincodes: Array.from(new Set([form.pincode, ...addedPincodes])),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
    };

    const res = await updateLabAction(labId, payload);

    if (res.success) {
      toast.success('Lab updated successfully!');
      router.push('/admin/labs');
    } else {
      toast.error(res.error || 'Failed to update lab');
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------
     LOADING
  ------------------------------------------------- */

  if (loading || !form) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium tracking-tight">
          Loading Lab Data...
        </p>
      </div>
    );
  }

  const inventoryList = form[step === 3 ? 'packages' : 'tests'];
  const filteredInventory = inventoryList.filter((item: any) => {
    const name = step === 3 ? item.packageName : item.testName;
    return name.toLowerCase().includes(inventorySearch.toLowerCase());
  });

  /* -------------------------------------------------
     RENDER
  ------------------------------------------------- */

  return (
    <div className="admin-space-y pb-24">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />

      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Edit Lab Partner</h1>
          <p className="admin-page-subtitle">Update lab profile, coverage, and inventory pricing.</p>
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
                <p className="admin-page-subtitle">Update core identity and compliance details.</p>
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
                          onChange={e => setForm({ ...form, state: e.target.value })}
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
                      <input className="admin-form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="admin-form-label">Pincode *</label>
                      <input className="admin-form-input font-mono" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
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
                        value={form.contactNo || ''}
                        onChange={e => setForm({ ...form, contactNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-form-label">Email</label>
                      <input
                        type="email"
                        className="admin-form-input"
                        placeholder="lab@example.com"
                        value={form.email || ''}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-form-label">Home Collection Charges (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="admin-form-input"
                        value={form.homeCollectionCharges ?? 0}
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
                <div className="admin-table-toolbar">
                  <div className="admin-search-container">
                    <Search className="admin-search-icon" size={18} />
                    <input
                      value={inventorySearch}
                      onChange={e => setInventorySearch(e.target.value)}
                      className="admin-search-input"
                      placeholder={`Search ${step === 3 ? 'packages' : 'tests'}...`}
                    />
                  </div>
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
              {submitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Update Lab
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
