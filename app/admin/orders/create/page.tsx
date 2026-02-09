// app/admin/orders/create/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  checkCustomerAction, 
  searchAdminTestsAction, 
  placeAdminOrderAction,
  getActiveCorporatesForOrder,
  getCorporateEmployeesForOrder,
  getCorporateEmployeeDetailsForOrder
} from '@/app/actions/adminOrderActions';
import { getAdminSettings } from '@/app/actions/adminSettingsActions';
import { 
  Search, User, MapPin, Clock, CreditCard, 
  CheckCircle2, Printer, Plus, Trash2, Home,
  AlertCircle, Calendar, Package, Building2,
  Briefcase, Users
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import Link from 'next/link';
import { getISTDateInputValue } from '@/lib/date-time';
// ✅ Import Google Autocomplete
import Autocomplete from "react-google-autocomplete";

export default function AdminCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);

  // Booking Type (Regular vs Corporate)
  const [orderType, setOrderType] = useState<'regular' | 'corporate'>('regular');
  const [corporates, setCorporates] = useState<any[]>([]);
  const [corporatesLoading, setCorporatesLoading] = useState(false);
  const [selectedCorporateId, setSelectedCorporateId] = useState<number | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  
  // Customer & Address State
  const emptyCustomer = { id: null, name: '', email: '', dob: '', age: '', gender: '' };
  const emptyAddress = {
    id: null as number | null, 
    pincode: '', 
    city: '', 
    state: '', 
    line: '' // Street Address
  };

  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(emptyCustomer);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [address, setAddress] = useState(emptyAddress);
  const [showAddrSuggestions, setShowAddrSuggestions] = useState(false);

  // Search & Cart State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showPackages, setShowPackages] = useState(false);

  // Enhanced State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [associateId, setAssociateId] = useState('');
  const [urgentOrder, setUrgentOrder] = useState(false);
  const [patientNotes, setPatientNotes] = useState('');
  const [paymentModes, setPaymentModes] = useState<string[]>(['Pay Upon Service']);
  const settingsAppliedRef = useRef(false);

  const resetCustomerAndAddress = useCallback(() => {
    setPhone('');
    setCustomer({ id: null, name: '', email: '', dob: '', age: '', gender: '' });
    setSavedAddresses([]);
    setShowAddrSuggestions(false);
    setAddress({
      id: null,
      pincode: '',
      city: '',
      state: '',
      line: ''
    });
  }, []);

  const resetCartAndDiscounts = useCallback(() => {
    setCart([]);
    setQuery('');
    setSearchResults([]);
    setDiscountApplied(false);
    setCouponDiscount(0);
    setCouponCode('');
  }, []);

  useEffect(() => {
    setDiscountApplied(false);
    setCouponDiscount(0);
  }, [cart]);

  // Logistics
  const [logistics, setLogistics] = useState({
    collectionType: 'center_visit', 
    homeCharges: 0,
    date: getISTDateInputValue(),
    time: '',
    instructions: '',
    paymentMode: 'Pay Upon Service'
  });

  useEffect(() => {
    let active = true;
    getAdminSettings()
      .then((settings) => {
        if (!active) return;
        const modes = settings.paymentModes?.modes?.length
          ? settings.paymentModes.modes
          : ['Pay Upon Service'];
        setPaymentModes(modes);

        setLogistics((prev) => {
          const next = { ...prev };
          if (!modes.includes(prev.paymentMode)) {
            next.paymentMode = settings.paymentModes?.defaultMode || modes[0];
          }

          if (!settingsAppliedRef.current) {
            settingsAppliedRef.current = true;
            next.collectionType = settings.defaults?.collectionType || prev.collectionType;
            if (typeof settings.defaults?.homeCharge === 'number') {
              next.homeCharges = settings.defaults.homeCharge;
            }
          }

          return next;
        });
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    resetCustomerAndAddress();
    resetCartAndDiscounts();
    setSelectedCorporateId(null);
    setSelectedEmployeeId(null);
    setEmployees([]);
    setEmployeeSearch('');
  }, [orderType, resetCustomerAndAddress, resetCartAndDiscounts]);

  useEffect(() => {
    if (orderType !== 'corporate') return;
    let active = true;
    setCorporatesLoading(true);
    getActiveCorporatesForOrder()
      .then((data) => {
        if (!active) return;
        setCorporates(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (active) setCorporatesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderType]);

  useEffect(() => {
    if (orderType !== 'corporate' || !selectedCorporateId) {
      setEmployees([]);
      return;
    }
    const timer = setTimeout(() => {
      setEmployeesLoading(true);
      getCorporateEmployeesForOrder(selectedCorporateId, employeeSearch)
        .then((data) => {
          setEmployees(Array.isArray(data) ? data : []);
        })
        .finally(() => setEmployeesLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [orderType, selectedCorporateId, employeeSearch]);

  // --- GOOGLE ADDRESS HANDLER ---
  const handleGoogleAddressSelect = (place: any) => {
    let street = '';
    let city = '';
    let state = '';
    let pincode = '';

    // Extract address components from Google response
    if (place.address_components) {
      place.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) street = component.long_name + ' ';
        if (types.includes('route')) street += component.long_name;
        if (types.includes('locality')) city = component.long_name;
        if (types.includes('administrative_area_level_1')) state = component.long_name;
        if (types.includes('postal_code')) pincode = component.long_name;
      });
    }

    // Fallback: If street is empty, use the first part of the formatted address
    if (!street && place.formatted_address) {
      street = place.formatted_address.split(',')[0];
    }

    setAddress({
      id: null, // It's a new address from Google, not DB
      line: street,
      city: city,
      state: state,
      pincode: pincode
    });
    
    toast.success("Address auto-filled from Google Maps");
  };

  // --- 1. PINCODE AUTO-FILL LOGIC ---
  useEffect(() => {
    if (address.pincode.length === 6) {
      setLoading(true);
      fetch(`https://api.postalpincode.in/pincode/${address.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === 'Success') {
            const details = data[0].PostOffice[0];
            setAddress(prev => ({
              ...prev,
              city: details.District,
              state: details.State
            }));
            toast.success(`Location found: ${details.District}, ${details.State}`);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [address.pincode]);

  const handleCorporateSelect = (value: string) => {
    const corpId = value ? Number(value) : null;
    setSelectedCorporateId(corpId);
    setSelectedEmployeeId(null);
    setEmployees([]);
    setEmployeeSearch('');
    resetCustomerAndAddress();
    resetCartAndDiscounts();
  };

  const handleEmployeeSelect = async (value: string) => {
    const empId = value ? Number(value) : null;
    setSelectedEmployeeId(empId);
    resetCustomerAndAddress();
    resetCartAndDiscounts();

    if (!empId) return;

    setLoading(true);
    try {
      const res = await getCorporateEmployeeDetailsForOrder(empId, selectedCorporateId ?? undefined);
      if (res.found && res.data) {
        setCustomer({ ...res.data, id: res.data.id } as any);
        setPhone(res.data.phone || '');
        setSavedAddresses(res.data.addresses || []);
        setShowAddrSuggestions(Boolean(res.data.addresses?.length));
      } else {
        toast.error('Employee not found');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CUSTOMER CHECK ---
  const handleCheckCustomer = async () => {
    if (orderType === 'corporate') {
      return toast.error('Select a corporate employee to load details');
    }
    if (phone.length !== 10) return toast.error("Enter valid 10-digit phone");
    setLoading(true);
    try {
      const res = await checkCustomerAction(phone);
      if (res.found && res.data) {
        setCustomer({ ...res.data, id: res.data.id } as any);
        setSavedAddresses(res.data.addresses);
        setShowAddrSuggestions(true); // Show suggestions immediately
        toast.success("Customer found!");
      } else {
        setCustomer({ id: null, name: '', email: '', dob: '', age: '', gender: '' });
        setSavedAddresses([]);
        toast.info("New customer. Please fill details.");
      }
    } finally { setLoading(false); }
  };

  // --- 3. ADDRESS SELECTION ---
  const selectSavedAddress = (addr: any) => {
    setAddress({
      id: addr.id,
      pincode: addr.pincode,
      city: addr.city,
      state: addr.state,
      line: addr.addressLine1
    });
    setShowAddrSuggestions(false);
  };

  // --- 4. ROBUST TEST SEARCH ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      if (orderType === 'corporate' && !selectedCorporateId) {
        setSearchResults([]);
        return;
      }
      if (!address.pincode || address.pincode.length < 6) {
        // Don't toast error here to avoid spamming, just don't search
        return; 
      }

      setSearching(true);
      const lockedLabId = cart.length > 0 ? cart[0].labId : undefined;
      
      const results = await searchAdminTestsAction(
        query, 
        address.pincode, 
        lockedLabId,
        orderType === 'corporate' ? selectedCorporateId ?? undefined : undefined
      );
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, address.pincode, cart, orderType, selectedCorporateId]);

  // --- AGE / DOB HANDLERS ---
  const handleAgeChange = (ageVal: string) => {
    setCustomer(prev => ({ ...prev, age: ageVal }));
    if(ageVal) {
        const year = new Date().getFullYear() - parseInt(ageVal);
        setCustomer(prev => ({ ...prev, dob: `${year}-01-01` }));
    }
  };

  const handleDobChange = (dobVal: string) => {
    setCustomer(prev => ({ ...prev, dob: dobVal }));
    if(dobVal) {
        const diff = Date.now() - new Date(dobVal).getTime();
        const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
        setCustomer(prev => ({ ...prev, age: String(age) }));
    }
  };

  // --- CART HANDLERS ---
  const addToCart = (item: any) => {
    const normalizedItem = item?.corporateCovered ? { ...item, price: 0 } : item;
    if (cart.some(i => i.id === item.id && i.type === item.type)) {
      return toast.error("Item already in cart");
    }
    if (cart.length > 0 && cart[0].labId !== normalizedItem.labId) {
      return toast.error(`Lab Mismatch! Current cart is from ${cart[0].labName}`);
    }
    setCart([...cart, normalizedItem]);
    // Auto-set home charges
    if (cart.length === 0 && logistics.collectionType === 'home_collection') {
       setLogistics(prev => ({ ...prev, homeCharges: normalizedItem.homeCollectionCharges }));
    }
    setQuery('');
    setSearchResults([]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // --- COUPON HANDLER ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setLoading(true);
    try {
      // Call coupon validation API
      const response = await fetch('/api/search/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode.trim(),
          cartTotal: cart.reduce((acc, item) => acc + item.price, 0)
        }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setCouponDiscount(Number(data.discountAmount || 0));
        setDiscountApplied(true);
        toast.success(`Coupon applied! Discount: ₹${Number(data.discountAmount || 0)}`);
      } else {
        toast.error(data.message || data.error || "Invalid coupon code");
      }
    } catch (error) {
      toast.error("Failed to apply coupon");
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!customer.name || !address.pincode || !address.line) return toast.error("Missing Customer or Address details");
    if (orderType === 'corporate') {
      if (!selectedCorporateId) return toast.error("Select a corporate");
      if (!selectedEmployeeId || !customer.id) return toast.error("Select a corporate employee");
    }

    setLoading(true);
    const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    const homeCharges = logistics.collectionType === 'home_collection' ? logistics.homeCharges : 0;
    const packageItem = cart.length === 1 && cart[0].type === 'package' ? cart[0] : null;

    const payload = {
        customerId: customer.id,
        existingAddressId: address.id,
        phone, name: customer.name, email: customer.email, 
        gender: customer.gender, dob: customer.dob, age: customer.age,
        
        address: address.line, city: address.city, 
        state: address.state, pincode: address.pincode,
        
        labId: cart[0].labId,
        items: cart,
        subtotal, 
        couponCode: discountApplied ? couponCode.trim() : null,
        couponDiscount,
        finalTotal: subtotal + homeCharges - couponDiscount,
        associateId: associateId.trim() || null,
        urgentOrder,
        ...logistics,
        instructions: patientNotes || logistics.instructions,
        packageId: packageItem ? packageItem.id : null
    };

    const res = await placeAdminOrderAction(payload);
    setLoading(false);

    if (res.success && 'orderId' in res) {
      toast.success("Order Created!");
      setOrderSuccessId(res.orderId);
    } else {
      toast.error("Failed: " + ('error' in res ? res.error : 'Unknown error'));
    }
  };

  const searchDisabled = address.pincode.length < 6 || (orderType === 'corporate' && !selectedCorporateId);
  const corporateCoveredItems = cart.filter((item) => item?.corporateCovered);
  const corporateCoveredCount = corporateCoveredItems.length;
  const corporateCoveredTotal = corporateCoveredItems.reduce(
    (acc, item) => acc + Number(item.sellingPrice ?? item.price ?? 0),
    0
  );
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Success Screen
  if (orderSuccessId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Order Created Successfully!</h2>
        <p className="text-slate-500 mb-2">Order ID: <span className="font-bold">#{orderSuccessId}</span></p>
        <p className="text-slate-500 mb-8">Total Amount: <span className="font-bold">₹{(cart.reduce((acc, i) => acc + i.price, 0) + (logistics.collectionType === 'home_collection' ? logistics.homeCharges : 0) - couponDiscount).toFixed(2)}</span></p>
        
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/admin/orders/${orderSuccessId}`)} 
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
            Copy Link
          </button>
          <Link href={`/admin/orders/${orderSuccessId}`} 
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors">
            View Details
          </Link>
          <a href={`/api/order/${orderSuccessId}/pdf`} target="_blank" 
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors">
            Download PDF
          </a>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="admin-btn-primary">
            <Plus size={18} className="inline mr-2"/> New Booking
          </button>
          <a href={`/api/order/${orderSuccessId}/pdf`} target="_blank" className="admin-btn-secondary border-2">
            <Printer size={18} className="inline mr-2"/> Receipt
          </a>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT: FORM */}
      <div className="col-span-12 lg:col-span-7 space-y-6 overflow-y-auto pr-2 pb-20">

        {/* Booking Type */}
        <div className="admin-form-section">
          <h3 className="admin-form-title mb-4">
            <Briefcase size={20} className="text-slate-600"/> Booking Type
          </h3>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setOrderType('regular')}
              className={`px-4 py-2 text-sm font-bold rounded-md ${orderType === 'regular' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              <User size={14} className="inline mr-1" /> Regular
            </button>
            <button
              onClick={() => setOrderType('corporate')}
              className={`px-4 py-2 text-sm font-bold rounded-md ${orderType === 'corporate' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              <Building2 size={14} className="inline mr-1" /> Corporate
            </button>
          </div>
        </div>

        {orderType === 'corporate' && (
          <div className="admin-form-section">
            <h3 className="admin-form-title mb-4">
              <Building2 size={20} className="text-blue-600"/> Corporate Booking
            </h3>
            <div className="admin-form-grid">
              <div className="col-span-2 sm:col-span-1">
                <label className="admin-form-label">Corporate</label>
                <select
                  className="w-full mt-1 admin-form-input"
                  value={selectedCorporateId ?? ''}
                  onChange={e => handleCorporateSelect(e.target.value)}
                  disabled={corporatesLoading}
                >
                  <option value="">{corporatesLoading ? 'Loading...' : 'Select Corporate'}</option>
                  {corporates.map((corp) => (
                    <option key={corp.id} value={corp.id}>
                      {corp.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="admin-form-label">Search Employee</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg text-sm transition-all outline-none"
                    placeholder="Name, email, phone, ID"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    disabled={!selectedCorporateId}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="admin-form-label">Employee</label>
                <select
                  className="w-full mt-1 admin-form-input"
                  value={selectedEmployeeId ?? ''}
                  onChange={e => handleEmployeeSelect(e.target.value)}
                  disabled={!selectedCorporateId || employeesLoading}
                >
                  <option value="">{employeesLoading ? 'Loading...' : 'Select Employee'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employeeId ? `(${emp.employeeId})` : emp.email ? `(${emp.email})` : emp.phone ? `(${emp.phone})` : ''}
                    </option>
                  ))}
                </select>
                {selectedCorporateId && !employeesLoading && employees.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No active employees found for this corporate.</p>
                )}
                {selectedEmployee && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <Users size={12} />
                    <span>
                      {selectedEmployee.department || 'No Department'} â€¢ {selectedEmployee.location || 'No Location'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Customer */}
        <div className="admin-form-section">
          <h3 className="admin-form-title mb-4">
            <User size={20} className="text-blue-600"/> {orderType === 'corporate' ? 'Employee Details' : 'Customer Details'}
          </h3>
          <div className="admin-form-grid">
            <div className="col-span-2 sm:col-span-1">
              <label className="admin-form-label">Phone Number</label>
              <div className="flex gap-2 mt-1">
                <input className="flex-1 admin-form-input" placeholder="9876543210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)} />
                {orderType === 'regular' && (
                  <button onClick={handleCheckCustomer} disabled={loading} className="admin-btn-primary bg-blue-600 px-3">
                    {loading ? '...' : <Search size={16}/>}
                  </button>
                )}
              </div>
              {orderType === 'corporate' && (
                <p className="text-[10px] text-slate-500 mt-1">Employee details are loaded from the corporate list.</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="admin-form-label">Full Name</label>
              <input className="w-full mt-1 admin-form-input" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            </div>
            <div>
              <label className="admin-form-label">DOB</label>
              <input type="date" className="w-full mt-1 admin-form-input" value={customer.dob} onChange={e => handleDobChange(e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Age</label>
              <input type="number" className="w-full mt-1 admin-form-input" value={customer.age} onChange={e => handleAgeChange(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="admin-form-label">Gender</label>
              <div className="flex gap-4 mt-1">
                {['Male', 'Female', 'Other'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={g} checked={customer.gender === g} onChange={e => setCustomer({...customer, gender: e.target.value})} />
                    <span className="text-sm">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Address (Enhanced with Google Maps) */}
        <div className="admin-form-section relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="admin-form-title">
              <MapPin size={20} className="text-emerald-600"/> Location
            </h3>
            {savedAddresses.length > 0 && (
               <button onClick={() => setShowAddrSuggestions(!showAddrSuggestions)} className="text-xs font-bold text-blue-600 hover:underline">
                 {showAddrSuggestions ? 'Hide Saved' : `Show ${savedAddresses.length} Saved Addresses`}
               </button>
            )}
          </div>

          {/* Address Suggestions Dropdown */}
          {showAddrSuggestions && savedAddresses.length > 0 && (
            <div className="mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 gap-2">
               {savedAddresses.map((addr, i) => (
                 <div key={i} onClick={() => selectSavedAddress(addr)} className="flex items-start gap-3 p-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer transition-all">
                    <Home size={16} className="mt-1 text-slate-400" />
                    <div>
                       <p className="text-sm font-bold text-slate-700">{addr.city} - {addr.pincode}</p>
                       <p className="text-xs text-slate-500">{addr.addressLine1}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}

          <div className="space-y-4">
            {/* Google Autocomplete Input */}
            <div>
              <label className="admin-form-label">Search Address (Google Maps)</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
                  onPlaceSelected={handleGoogleAddressSelect}
                  options={{
                    types: ["address"],
                    componentRestrictions: { country: "in" },
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg text-sm transition-all outline-none"
                  placeholder="Start typing to search address..."
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="col-span-3">
                <label className="admin-form-label">Address Line *</label>
                <input className="w-full mt-1 admin-form-input" placeholder="House No, Street, Landmark"
                  value={address.line} onChange={e => setAddress({...address, line: e.target.value, id: null})}
                />
              </div>
              <div>
                <label className="admin-form-label">Pincode *</label>
                <input 
                  className="w-full mt-1 admin-form-input font-bold" 
                  placeholder="110001" maxLength={6}
                  value={address.pincode}
                  onChange={e => {
                    setAddress({...address, pincode: e.target.value, id: null});
                    // Clear search results if pincode changes
                    if (e.target.value.length < 6) setSearchResults([]);
                  }}
                />
              </div>
              <div>
                <label className="admin-form-label">City</label>
                <input className="w-full mt-1 admin-form-input bg-slate-50" readOnly value={address.city} />
              </div>
              <div>
                <label className="admin-form-label">State</label>
                <input className="w-full mt-1 admin-form-input bg-slate-50" readOnly value={address.state} />
              </div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        <div className="admin-form-section">
          <div className="flex justify-between items-center mb-4">
            <h3 className="admin-form-title">
              <Package size={20} className="text-amber-600"/> Packages
            </h3>
            <button onClick={() => setShowPackages(!showPackages)} className="text-sm font-medium text-blue-600 hover:underline">
              {showPackages ? 'Hide Info' : 'View Info'}
            </button>
          </div>
          
          {showPackages && (
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
              Use the search box on the right to add tests or packages. Packages are labeled as “Package” in results.
              {orderType === 'corporate' && (
                <div className="mt-2 text-xs text-slate-500">
                  Corporate packages follow the assigned payment terms (corporate pays vs self pay).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logistics */}
        <div className="admin-form-section">
           <h3 className="admin-form-title mb-4">
            <Clock size={20} className="text-purple-600"/> Schedule & Payment
          </h3>
          <div className="admin-form-grid">
             <div className="col-span-2">
                 <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                    <button onClick={() => setLogistics({...logistics, collectionType: 'center_visit'})} className={`px-4 py-2 text-sm font-bold rounded-md ${logistics.collectionType === 'center_visit' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Center Visit</button>
                    <button onClick={() => setLogistics({...logistics, collectionType: 'home_collection'})} className={`px-4 py-2 text-sm font-bold rounded-md ${logistics.collectionType === 'home_collection' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Home Collection</button>
                 </div>
             </div>
             {logistics.collectionType === 'home_collection' && (
                <div className="col-span-2">
                    <label className="admin-form-label">Home Charges</label>
                    <input type="number" className="w-32 mt-1 admin-form-input" value={logistics.homeCharges} onChange={e => setLogistics({...logistics, homeCharges: Number(e.target.value)})} />
                </div>
             )}
             <div>
                <label className="admin-form-label">Date</label>
                <input type="date" className="w-full mt-1 admin-form-input" value={logistics.date} onChange={e => setLogistics({...logistics, date: e.target.value})} />
             </div>
              <div>
                 <label className="admin-form-label">Time</label>
                 <select className="w-full mt-1 admin-form-input" value={logistics.time} onChange={e => setLogistics({...logistics, time: e.target.value})}>
                     <option value="">Select</option>
                     <option value="07:00 - 08:00">07:00 - 08:00</option>
                     <option value="08:00 - 09:00">08:00 - 09:00</option>
                     <option value="09:00 - 10:00">09:00 - 10:00</option>
                     <option value="10:00 - 11:00">10:00 - 11:00</option>
                 </select>
              </div>
              <div>
                 <label className="admin-form-label">Payment Mode</label>
                 <select
                   className="w-full mt-1 admin-form-input"
                   value={logistics.paymentMode}
                   onChange={e => setLogistics({ ...logistics, paymentMode: e.target.value })}
                 >
                   {paymentModes.map((mode, idx) => (
                     <option key={`${mode}-${idx}`} value={mode}>
                       {mode}
                     </option>
                   ))}
                 </select>
              </div>
              <div className="col-span-2">
                 <label className="admin-form-label">Special Instructions</label>
                <textarea className="w-full mt-1 admin-form-textarea" 
                  placeholder="Any special instructions for sample collection..."
                  value={patientNotes}
                  onChange={e => setPatientNotes(e.target.value)}
                />
             </div>
             <div className="col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="urgent-order"
                  checked={urgentOrder}
                  onChange={(e) => setUrgentOrder(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="urgent-order" className="text-sm text-slate-700 font-medium flex items-center gap-1">
                  <AlertCircle size={14} /> Priority Processing
                </label>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT: SEARCH & CART */}
      <div className="col-span-12 lg:col-span-5 h-full flex flex-col bg-white border-l border-slate-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 mb-2">Add Tests</h3>
          <div className="relative">
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
              placeholder={
                orderType === 'corporate' && !selectedCorporateId
                  ? "Select corporate first"
                  : address.pincode.length < 6
                    ? "Enter Pincode first"
                    : "Search tests or packages..."
              }
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={searchDisabled}
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20}/>
            
            {/* SEARCH RESULTS DROPDOWN */}
            {(searching || searchResults.length > 0) && query.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto z-50 p-2">
                {searching ? (
                  <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <div key={`${item.type}-${item.id}`} onClick={() => addToCart(item)} 
                      className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer group flex justify-between items-center"
                    >
                      <div>
                        <div className="admin-table-row-primary">{item.name}</div>
                        <div className="admin-table-row-secondary">
                          {item.labName}
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {item.type}
                          </span>
                          {item.paymentType && (
                            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.paymentType === 'CORPORATE_PAYS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.paymentType === 'CORPORATE_PAYS' ? 'Corporate Pays' : 'Self Pay'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.corporateCovered ? (
                          <>
                            <div className="admin-table-row-primary text-emerald-600">₹0</div>
                            <div className="text-[10px] text-slate-400 line-through">
                              ₹{Number(item.sellingPrice ?? item.price).toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="admin-table-row-primary text-emerald-600">
                            ₹{Number(item.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-sm">No tests found for this pincode.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CART ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <Plus size={48} className="mb-2"/>
               <p>Add tests to begin</p>
             </div>
          ) : (
             cart.map((item, i) => (
               <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                     <p className="admin-table-row-primary">{item.name}</p>
                     <p className="admin-table-row-secondary">
                     {item.labName}
                     {item.paymentType && (
                       <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.paymentType === 'CORPORATE_PAYS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {item.paymentType === 'CORPORATE_PAYS' ? 'Corporate Pays' : 'Self Pay'}
                       </span>
                     )}
                  </p>
                  </div>
                  <div className="flex items-center gap-3">
                     {item.corporateCovered ? (
                       <div className="text-right">
                         <div className="admin-table-row-primary text-emerald-600">₹0</div>
                         <div className="text-[10px] text-slate-400 line-through">
                           ₹{Number(item.sellingPrice ?? item.price).toFixed(2)}
                         </div>
                       </div>
                     ) : (
                       <span className="admin-table-row-primary">₹{Number(item.price).toFixed(2)}</span>
                     )}
                     <button onClick={() => removeFromCart(i)} className="admin-btn-danger p-1 rounded"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))
          )}
        </div>
        
        {/* TOTALS */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          {/* Associate ID */}
          <div className="mb-4">
            <label className="admin-form-label mb-1">Associate ID (Optional)</label>
            <input 
              type="text" 
              placeholder="ASSOC-123"
              className="w-full admin-form-input"
              value={associateId}
              onChange={(e) => setAssociateId(e.target.value)}
            />
          </div>
          
          {/* Coupon Section */}
          <div className="mb-4">
            <label className="admin-form-label mb-1">Coupon Code</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="DISCOUNT10"
                className="flex-1 admin-form-input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={discountApplied}
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={discountApplied || loading}
                className={`px-4 rounded-lg font-medium ${
                  discountApplied 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {discountApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
          </div>
          
          {/* Enhanced Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>₹{cart.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
            </div>


              {corporateCoveredCount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Corporate Coverage ({corporateCoveredCount} item{corporateCoveredCount > 1 ? 's' : ''})</span>
                  <span>-₹{corporateCoveredTotal.toFixed(2)}</span>
                </div>
              )}
            
            {logistics.collectionType === 'home_collection' && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Home Collection Charges</span>
                <span>₹{Number(logistics.homeCharges).toFixed(2)}</span>
              </div>
            )}
            
            {discountApplied && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Coupon Discount</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
              <span>Total Amount</span>
              <span>₹{(
                cart.reduce((acc, i) => acc + i.price, 0) + 
                (logistics.collectionType === 'home_collection' ? logistics.homeCharges : 0) - 
                couponDiscount
              ).toFixed(2)}</span>
            </div>
          </div>

           

           {corporateCoveredCount > 0 && (
             <p className="text-xs text-slate-500 mb-2">
               Corporate covered items will be billed to the corporate account.
             </p>
           )}

           <button onClick={handleSubmit} disabled={loading} className="admin-btn-primary w-full py-3">
              {loading ? 'Processing...' : 'Confirm Order'}
           </button>
        </div>
      </div>
    </div>
  );
}
