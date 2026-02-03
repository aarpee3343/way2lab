'use client';

import { useState, useEffect, use } from 'react';
import { getPackageById, getPackageFormData, updatePackageAction } from '@/app/actions/adminPackageActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calculator,
  Search,
  Box,
  FileText,
  Building,
  X,
  CheckCircle2,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Unwrap params using React.use()
  const { id } = use(params);
  const packageId = parseInt(id);

  const [loading, setLoading] = useState(true);
  
  // Data States
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [packageData, setPackageData] = useState<any>(null);
  const [isCorporate, setIsCorporate] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch both the Package Data and the Full Test List in parallel
        const [pkg, allTests] = await Promise.all([
          getPackageById(packageId),
          getPackageFormData()
        ]);

        if (!pkg) {
          toast.error("Package not found");
          router.push('/admin/packages');
          return;
        }

        setTests(allTests);
        setPackageData(pkg);
        
        // Pre-fill State
        setSelectedTestIds(pkg.testIds); // [1, 5, 10]
        setBasePrice(pkg.price);
        setDiscount(pkg.discount);
        
        // Logic to determine if "Corporate Toggle" should be on
        if (pkg.category && pkg.category !== 'ANNUAL') {
          setIsCorporate(true);
        }

      } catch (e) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [packageId, router]);


  // --- 2. HANDLERS ---
  const toggleTest = (testId: number) => {
    setSelectedTestIds(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Call Update Action
    const res = await updatePackageAction(packageId, formData);

    setLoading(false);
    if (res.success) {
      toast.success('Package Updated Successfully');
      router.push('/admin/packages');
    } else {
      toast.error(res.error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Filter & Calc
  const filteredTests = tests.filter(t =>
    t.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedTestsData = tests.filter(t => selectedTestIds.includes(t.id));
  const finalPrice = basePrice - (basePrice * discount) / 100;

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-amber-200">
              Edit Mode
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Edit Package: {packageData.packageName}
          </h1>
        </div>

        <Link
          href="/admin/packages"
          className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Hidden Inputs for Selected Tests */}
        {selectedTestIds.map(id => (
          <input key={id} type="hidden" name="test_ids" value={id} />
        ))}

        <div className="lg:col-span-2 space-y-6">
          
          {/* PACKAGE INFO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Box size={18} />
              </span>
              Package Details
            </h3>

            <div className="space-y-5">
              <div>
                <label className="label">Package Name *</label>
                <input 
                  name="package_name" 
                  defaultValue={packageData.packageName}
                  required 
                  className="input-field text-lg font-semibold" 
                />
              </div>

               {/* Active Status */}
               <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input 
                  type="checkbox" 
                  name="is_active" 
                  id="activeToggle"
                  className="w-5 h-5 rounded accent-blue-600"
                  defaultChecked={packageData.isActive}
                />
                <label htmlFor="activeToggle" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Package is Active & Visible
                </label>
              </div>

              {/* Corporate Toggle */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <input 
                  type="checkbox" 
                  id="corpToggle"
                  className="w-5 h-5 rounded accent-purple-600"
                  checked={isCorporate}
                  onChange={(e) => setIsCorporate(e.target.checked)}
                />
                <label htmlFor="corpToggle" className="text-sm font-bold text-purple-900 cursor-pointer">
                  Is this a Corporate Specific Package?
                </label>
              </div>

              {/* Corporate Settings */}
              {isCorporate && (
                <div className="grid grid-cols-2 gap-5 py-6 border-y border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-3">
                    <label className="label flex items-center gap-2">
                      <Building size={14} /> Corporate Settings
                    </label>
                    <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="isPreEmployment" 
                          className="w-4 h-4" 
                          // defaultChecked={packageData.isPreEmployment} // Uncomment if in DB
                        />
                        <span className="text-sm font-bold text-slate-700">Pre-Employment</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="label">Package Category</label>
                    <select 
                      name="category" 
                      className="input-field"
                      defaultValue={packageData.category || 'ANNUAL'}
                    >
                      <option value="ANNUAL">Annual Health Checkup</option>
                      <option value="PRE_EMPLOYMENT">Pre-Employment Checkup</option>
                      <option value="EXECUTIVE">Executive Health Check</option>
                      <option value="BLUE_COLLAR">Blue-Collar Package</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={packageData.description}
                    rows={3} 
                    className="input-field resize-none" 
                  />
                </div>
                <div>
                  <label className="label">Preparation</label>
                  <textarea 
                    name="preparation" 
                    defaultValue={packageData.preparation}
                    rows={3} 
                    className="input-field resize-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SELECTED TESTS CONTAINER */}
          {selectedTestIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl animate-in slide-in-from-bottom-2">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} /> Selected Tests ({selectedTestIds.length})
                </span>
                <button 
                  type="button"
                  onClick={() => setSelectedTestIds([])}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                >
                  Clear All
                </button>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTestsData.map(test => (
                  <div key={test.id} className="bg-white pl-3 pr-2 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2 shadow-sm">
                    <span className="text-sm font-bold text-slate-700">{test.testName}</span>
                    <button 
                      type="button"
                      onClick={() => toggleTest(test.id)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEST SELECTOR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} /> Available Tests
              </h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  placeholder="Search tests..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-2 space-y-1">
              {filteredTests.map(test => {
                const isSelected = selectedTestIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                      }`}>
                         {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <span className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                        {test.testName}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-500">₹{test.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-4">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Calculator size={18} /> Pricing
            </h3>

            <input
              type="number"
              name="price"
              className="input-field mb-3"
              placeholder="Base Price"
              value={basePrice}
              onChange={e => setBasePrice(+e.target.value || 0)}
            />

            <input
              type="number"
              name="discount"
              className="input-field"
              placeholder="Discount %"
              value={discount}
              onChange={e => setDiscount(+e.target.value || 0)}
            />

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Total Items:</span>
                <span>{selectedTestIds.length}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-900">
                 <span>Final Price:</span>
                 <span>₹{Math.round(finalPrice)}</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center gap-2 mt-6 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Update Package
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        .label {
          @apply block text-xs font-bold text-slate-500 uppercase mb-1;
        }
        .input-field {
          @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all;
        }
      `}</style>
    </div>
  );
}