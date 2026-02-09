'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ArrowRight, Star, AlertCircle, ShoppingBag, 
  Filter, Crosshair, CheckCircle2, X, Loader2, ChevronDown
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { LabCardSkeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

// Types
interface UserLocation {
  pincode: string;
  area?: string;
  city?: string;
  display?: string;
  lat?: number;
  lng?: number;
  isSet: boolean;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- 1. STATE MANAGEMENT ---
  
  // Location State
  const [location, setLocation] = useState<UserLocation>({ pincode: '', isSet: false });
  const [showLocModal, setShowLocModal] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]); // Dropdown results
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // Active search filters
  
  // Results State
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    sort: 'relevance',
    fullMatch: false,
    minRating: 0
  });

  const isPublicPackageItem = (item: any) => {
    if (item?.type !== 'package') return true;
    const isActive = item?.isActive ?? item?.isactive;
    const isCorporate = item?.isCorporate ?? item?.iscorporate;
    return isActive !== false && isCorporate !== true;
  };

  // --- 2. LOCATION LOGIC (Restored) ---

  useEffect(() => {
    // Load location from local storage on mount
    const saved = localStorage.getItem('user_location');
    if (saved) {
      setLocation(JSON.parse(saved));
    } else {
      setShowLocModal(true);
    }
  }, []);

  const saveLocation = (loc: UserLocation) => {
    setLocation(loc);
    localStorage.setItem('user_location', JSON.stringify(loc));
    setShowLocModal(false);
    // If we have items selected, re-fetch labs for new location
    if (selectedItems.length > 0) fetchLabs(loc);
  };

  const handleManualPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = (document.getElementById('manual-pin') as HTMLInputElement).value;
    if (pin.length !== 6) return toast.error("Enter valid 6-digit pincode");

    setDetectingLoc(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json`);
      let lat, lng;
      if (res.data && res.data.length > 0) {
        lat = parseFloat(res.data[0].lat);
        lng = parseFloat(res.data[0].lon);
      }
      const newLoc = { pincode: pin, display: pin, lat, lng, isSet: true };
      saveLocation(newLoc);
      toast.success(`Location set: ${pin}`);
    } catch (error) {
      // Fallback if API fails
      saveLocation({ pincode: pin, display: pin, isSet: true });
    } finally {
      setDetectingLoc(false);
    }
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    if (!GOOGLE_KEY) return toast.error("Google Maps Key missing");

    setDetectingLoc(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`
          );

          if (res.data.status === "OK" && res.data.results.length > 0) {
            const result = res.data.results[0];
            let pincode = '', area = '', city = '';

            result.address_components.forEach((comp: any) => {
              if (comp.types.includes("postal_code")) pincode = comp.long_name;
              if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) area = comp.long_name;
              if (comp.types.includes("locality")) city = comp.long_name;
            });

            if (pincode) {
              const display = `${area || city || pincode} (${pincode})`;
              saveLocation({ pincode, area, city, display, lat: latitude, lng: longitude, isSet: true });
              toast.success("Location detected successfully");
            } else {
              toast.error("Area detected, but pincode unclear. Please enter manually.");
            }
          }
        } catch (e) {
          toast.error("Location detection failed");
        } finally {
          setDetectingLoc(false);
        }
      },
      () => {
        toast.error("Permission denied. Enter pincode manually.");
        setDetectingLoc(false);
      }
    );
  };

  // --- 3. SEARCH & FETCH LOGIC ---

  // Initial URL Params Load
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlId = searchParams.get('id');

    if (urlQuery && selectedItems.length === 0) {
      setQuery(urlQuery);
      
      const fetchInitialItem = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API_BASE}/search`, { params: { query: urlQuery } });
          const data = (res.data.results || []).filter(isPublicPackageItem);
          if (data.length > 0) {
            const match = urlId ? data.find((i:any) => i.id == urlId) : data[0];
            if (match) setSelectedItems([match]);
          }
        } catch (e) {
          console.error("Initial load failed", e);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialItem();
    }
  }, [searchParams, selectedItems.length]); 

  // Autocomplete Dropdown
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    
    const timer = setTimeout(async () => {
      // Don't search if query matches selected item (prevents dropdown opening on load)
      if (selectedItems.length === 1 && selectedItems[0].name === query) return;

      try {
        const res = await axios.get(`${API_BASE}/search`, { params: { query } });
        const filtered = (res.data.results || []).filter(isPublicPackageItem);
        setResults(filtered);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedItems]);

  // Main Lab Fetch
  const fetchLabs = useCallback(async (currentLoc = location) => {
    if (selectedItems.length === 0 || !currentLoc.isSet) { 
      setLabs([]); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/search/labs/search`, {
        items: selectedItems,
        pincode: currentLoc.pincode,
        userLat: currentLoc.lat,
        userLng: currentLoc.lng
      });
      
      let data = Array.isArray(res.data) ? res.data : [];

      if (filters.fullMatch) data = data.filter((l: any) => l.isFullMatch);
      if (filters.minRating > 0) data = data.filter((l: any) => (l.lab.rating || 0) >= filters.minRating);

      data.sort((a: any, b: any) => {
        switch(filters.sort) {
           case 'price_low': return a.totalPrice - b.totalPrice;
           case 'price_high': return b.totalPrice - a.totalPrice;
           case 'rating': return b.lab.rating - a.lab.rating;
           case 'distance': 
              const distA = parseFloat(a.lab.distance) || 999;
              const distB = parseFloat(b.lab.distance) || 999;
              return distA - distB;
           default: // relevance
              if (a.isFullMatch && !b.isFullMatch) return -1;
              if (!a.isFullMatch && b.isFullMatch) return 1;
              return a.totalPrice - b.totalPrice;
        }
      });

      setLabs(data);
    } catch (error) {
      toast.error("Failed to fetch labs");
    } finally {
      setLoading(false);
    }
  }, [selectedItems, location, filters]);

  // Trigger fetch when dependencies change
  useEffect(() => { 
    if (location.isSet) fetchLabs(); 
  }, [fetchLabs, location.isSet]);

  // --- 4. UI HELPERS ---

  const addItem = (item: any) => {
    if (!isPublicPackageItem(item)) return;
    setSelectedItems(prev => {
      if (prev.some(i => i.id === item.id && i.type === item.type)) return prev;
      return [...prev, item];
    });
    setQuery('');
    setResults([]);
  };

  const removeItem = (id: any) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const { setLabCart, clearCart } = useCartStore();

  const handleBook = (labData: any) => {
    if (!confirm('Create new cart with these items?')) return;

    const cartItems = labData.foundItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      price: Number(item.labItemPrice),
      basePrice: Number(item.labItemMRP),
      isCorporate: Boolean(item.isCorporate),
      labId: labData.lab.id,
      labName: labData.lab.labName,
    }));

    clearCart();
    setLabCart(
      {
        labId: labData.lab.id,
        labName: labData.lab.labName,
        servicePincode: location.pincode,
        homeCollectionCharges: Number(labData.lab.homeCollectionCharges || 0),
        timings: labData.lab.timings ?? null
      },
      cartItems
    );
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* --- LOCATION MODAL --- */}
      <AnimatePresence>
        {showLocModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-slate-800">Set Location</h2>
                 {location.isSet && <button onClick={() => setShowLocModal(false)}><X size={20} className="text-slate-400"/></button>}
              </div>
              <p className="text-sm text-slate-500 mb-6">Enter your pincode to see accurate prices and lab availability.</p>
              
              <button 
                onClick={handleAutoDetect}
                disabled={detectingLoc}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold mb-4 hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {detectingLoc ? <Loader2 className="animate-spin" /> : <Crosshair size={18} />}
                Use Current Location
              </button>
              
              <div className="relative flex items-center mb-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Or enter manually</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleManualPincode}>
                <div className="flex gap-2">
                  <input id="manual-pin" type="text" maxLength={6} placeholder="e.g. 122001" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-mono text-lg" />
                  <button type="submit" className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-black">
                    Check
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="sticky top-[70px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-3">
          
          {/* SEARCH BAR */}
          <div className="relative z-50">
            <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3 border focus-within:border-blue-500 transition-all">
              <Search className="text-slate-400 mr-3" size={20} />
              <input 
                className="flex-1 bg-transparent border-none outline-none text-slate-800"
                placeholder="Search tests..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
                {results.map((r: any) => (
                  <div key={r.id} onClick={() => addItem(r)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50">
                    <div>
                        <p className="font-semibold text-slate-700 text-sm">{r.name}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{r.type}</span>
                    </div>
                    <div className="text-right">
                        {/* <p className="font-bold text-slate-900 text-sm">₹{r.price}</p> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCATION BAR & FILTERS */}
          <div className="flex items-center justify-between">
             
             {/* Location Display */}
             <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
                <MapPin size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">
                   {location.isSet ? (
                     <>Serving in <span className="text-blue-700 font-bold">{location.display || location.pincode}</span></>
                   ) : (
                     <span className="text-red-500 font-bold">Location not set</span>
                   )}
                </span>
                <button onClick={() => setShowLocModal(true)} className="text-[10px] font-bold text-blue-600 underline ml-1 hover:text-blue-800">
                   CHANGE
                </button>
             </div>

             {/* Filter Toggle */}
             {/* <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
                <Filter size={14} /> Filters <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
             </button> */}
          </div>

          {/* FILTERS PANEL */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-slate-200 rounded-xl p-4 mt-2 shadow-sm space-y-4">
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</p>
                      <div className="flex flex-wrap gap-2">
                        {[{ id: 'relevance', label: 'Recommended' }, { id: 'price_low', label: 'Price: Low to High' }, { id: 'rating', label: 'Top Rated' }].map(opt => (
                          <button key={opt.id} onClick={() => setFilters({...filters, sort: opt.id})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.sort === opt.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                             {opt.label}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preferences</p>
                      <div className="flex flex-wrap gap-3">
                         <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"><input type="checkbox" checked={filters.fullMatch} onChange={e => setFilters({...filters, fullMatch: e.target.checked})} className="accent-blue-600 w-4 h-4"/><span className="text-xs font-bold text-slate-700">Full Match Only</span></label>
                         <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"><input type="checkbox" checked={filters.minRating === 4.5} onChange={e => setFilters({...filters, minRating: e.target.checked ? 4.5 : 0})} className="accent-blue-600 w-4 h-4"/><span className="text-xs font-bold text-slate-700"> Rated 4.5+ ★</span></label>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Items Tags */}
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedItems.map((item) => (
                <span key={item.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">
                  {item.name}
                  <button onClick={() => removeItem(item.id)} className="hover:text-red-300 transition-colors"><X size={12}/></button>
                </span>
              ))}
              <button onClick={() => setSelectedItems([])} className="text-xs text-red-500 font-bold hover:underline px-2">Clear All</button>
            </div>
          )}
        </div>
      </header>

      {/* --- RESULTS --- */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <Breadcrumbs />

        {loading && (
          <div className="space-y-4">
            <LabCardSkeleton />
            <LabCardSkeleton />
          </div>
        )}

        {!loading && labs.length === 0 && selectedItems.length > 0 && location.isSet && (
           <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <AlertCircle size={40} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No labs found nearby</h3>
              <p className="text-slate-500 text-sm mt-1">We couldn't find labs servicing {location.pincode} with these specific tests.</p>
           </div>
        )}

        {!loading && labs.length === 0 && selectedItems.length === 0 && (
           <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
              <ShoppingBag size={48} className="text-blue-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">Start your search</h3>
              <p className="text-slate-500 text-sm mt-2">Add tests to compare prices across top labs.</p>
           </div>
        )}

        {labs.map((labData: any) => (
          <LabCard 
            key={labData.lab.id} 
            data={labData} 
            selectedCount={selectedItems.length}
            onBook={() => handleBook(labData)} 
          />
        ))}
      </main>
    </div>
  );
}

// Sub-components (LabCard) remain same as before
const LabCard = ({ data, selectedCount, onBook }: { data: any, selectedCount: number, onBook: () => void }) => {
  const { lab, totalPrice, totalBasePrice, totalDiscount, foundItems, isFullMatch } = data;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
           <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100">
              {lab.labName.charAt(0)}
           </div>
           <div>
              <h3 className="font-bold text-lg text-slate-800 leading-tight">{lab.labName}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                 <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" /> {lab.rating.toFixed(1)}
                 </span>
                 <span>•</span>
                 <span>{lab.distance} away</span>
              </div>
           </div>
        </div>
        
        {isFullMatch ? (
           <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
              <CheckCircle2 size={12} /> ALL {selectedCount} TESTS
           </span>
        ) : (
           <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-1 rounded-full border border-amber-100">
              PARTIAL MATCH
           </span>
        )}
      </div>

      {/* Features */}
      {lab.features && Array.isArray(lab.features) && lab.features.length > 0 && (
         <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {lab.features.map((f: string, i: number) => (
               <span key={i} className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100 whitespace-nowrap">
                  {f}
               </span>
            ))}
         </div>
      )}

      {/* Test List */}
      <div className="bg-slate-50/50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
         {foundItems.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-700 truncate">{item.name}</span>
               </div>
               <span className="font-bold text-slate-900 shrink-0">₹{item.labItemPrice}</span>
            </div>
         ))}
         {selectedCount > foundItems.length && (
            <div className="pt-2 mt-2 border-t border-slate-200 text-xs text-red-500 font-medium flex items-center gap-1">
               <AlertCircle size={12} /> {selectedCount - foundItems.length} tests not available at this lab
            </div>
         )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
         <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Price</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-slate-900">₹{totalPrice}</span>
               {totalDiscount > 0 && <span className="text-sm text-slate-400 line-through">₹{totalBasePrice}</span>}
            </div>
            {totalDiscount > 0 && <p className="text-xs font-bold text-emerald-600">{totalDiscount}% Savings</p>}
         </div>
         
         <button onClick={onBook} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all hover:shadow-lg flex items-center gap-2 group">
            {isFullMatch ? 'Select Lab' : 'Proceed Anyway'} 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
         </button>
      </div>

    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
