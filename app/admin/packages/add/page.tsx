'use client';

import { useState, useEffect } from 'react';
import { getPackageFormData, createPackageAction } from '@/app/actions/adminPackageActions';
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

export default function AddPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]); // ✅ Track IDs separately
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [isCorporate, setIsCorporate] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    getPackageFormData().then(setTests);
  }, []);

  // ✅ Toggle Logic: Adds or Removes ID from state
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
    
    const defaultStatus = isCorporate ? 'off' : 'on';
    formData.append('is_active', defaultStatus);

    // ✅ IMPORTANT: Since we use custom state for checkboxes, 
    // we must manually append selected IDs if we don't use hidden inputs.
    // However, I have added Hidden Inputs below, so FormData will catch them automatically.

    const res = await createPackageAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success('Package Created Successfully');
      router.push('/admin/packages');
    } else {
      toast.error(res.error);
    }
  };

  // Filter for the Search List
  const filteredTests = tests.filter(t =>
    t.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get full objects of selected tests for the "Selected Container"
  const selectedTestsData = tests.filter(t => selectedTestIds.includes(t.id));

  const finalPrice = basePrice - (basePrice * discount) / 100;

  return (
    <div className="admin-space-y pb-24">
      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Create Package</h1>
          <p className="admin-page-subtitle">Build test bundles for users or corporate plans.</p>
        </div>
        <Link href="/admin/packages" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back to Packages
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ✅ HIDDEN INPUTS: This ensures FormData captures selected IDs regardless of search filter */}
        {selectedTestIds.map(id => (
          <input key={id} type="hidden" name="test_ids" value={id} />
        ))}

        <div className="lg:col-span-2 admin-space-y">
          
          {/* 1. Package Info Card */}
          <div className="admin-form-section">
            <h3 className="admin-form-title">
              <Box size={16} /> Package Details
            </h3>

            <div className="admin-form-grid">
              <div className="col-span-2">
                <label className="admin-form-label">Package Name *</label>
                <input name="package_name" required className="admin-form-input" />
              </div>

              {/* Corporate Toggle */}
              <div className="col-span-2">
                <label className="admin-form-label">Corporate Package</label>
                <div className="admin-form-checkbox">
                  <input
                    type="checkbox"
                    name="isCorporate"
                    id="corpToggle"
                    checked={isCorporate}
                    onChange={(e) => setIsCorporate(e.target.checked)}
                  />
                  <span>Corporate specific package</span>
                </div>
              </div>

              {/* Corporate Settings */}
              {isCorporate && (
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                  <div>
                    <label className="admin-form-label">
                      <Building size={14} /> Corporate Settings
                    </label>
                    <div className="admin-form-checkbox">
                      <input type="checkbox" name="isPreEmployment" />
                      <span>Pre-Employment</span>
                    </div>
                  </div>

                  <div>
                    <label className="admin-form-label">Package Category</label>
                    <select name="category" className="admin-form-select">
                      <option value="ANNUAL">Annual Health Checkup</option>
                      <option value="PRE_EMPLOYMENT">Pre-Employment Checkup</option>
                      <option value="EXECUTIVE">Executive Health Check</option>
                      <option value="BLUE_COLLAR">Blue-Collar Package</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-form-label">Description</label>
                  <textarea name="description" rows={3} className="admin-form-textarea resize-none" placeholder="Summary..." />
                </div>
                <div>
                  <label className="admin-form-label">Preparation</label>
                  <textarea name="preparation" rows={3} className="admin-form-textarea resize-none" placeholder="Instructions..." />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 2. SELECTED TESTS CONTAINER (The "Cart") */}
          {selectedTestIds.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header flex items-center justify-between">
                <div className="admin-card-title">
                  <CheckCircle2 size={18} /> Selected Tests ({selectedTestIds.length})
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTestIds([])}
                  className="admin-btn-secondary text-xs"
                >
                  Clear All
                </button>
              </div>
              <div className="admin-card-body">
                <div className="flex flex-wrap gap-2">
                  {selectedTestsData.map(test => (
                    <div key={test.id} className="admin-chip">
                      <span>{test.testName}</span>
                      <button
                        type="button"
                        onClick={() => toggleTest(test.id)}
                        className="admin-chip-remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. TEST SELECTOR (The "Inventory") */}
          <div className="admin-card flex flex-col h-[500px]">
            <div className="admin-card-header flex items-center justify-between gap-4">
              <div className="admin-card-title">
                <FileText size={18} /> Available Tests
              </div>
              <div className="admin-search-container max-w-[220px]">
                <Search size={16} className="admin-search-icon" />
                <input
                  placeholder="Search tests..."
                  className="admin-search-input"
                  onChange={e => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
              </div>
            </div>

            <div className="admin-card-body flex-1">
              <div className="flex-1 overflow-y-auto admin-scrollbar space-y-1">
                {filteredTests.map(test => {
                  const isSelected = selectedTestIds.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                        isSelected ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {test.testName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-500">Rs. {test.price}</span>
                    </div>
                  );
                })}

                {filteredTests.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No tests found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - PRICING */}
        <div className="admin-space-y">
          <div className="admin-card sticky top-4">
            <div className="admin-card-header">
              <div className="admin-card-title">
                <Calculator size={18} /> Pricing
              </div>
            </div>
            <div className="admin-card-body admin-space-y">
              <div>
                <label className="admin-form-label">Base Price</label>
                <input
                  type="number"
                  name="price"
                  className="admin-form-input"
                  placeholder="Base Price"
                  onChange={e => setBasePrice(+e.target.value || 0)}
                />
              </div>

              <div>
                <label className="admin-form-label">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  className="admin-form-input"
                  placeholder="Discount %"
                  onChange={e => setDiscount(+e.target.value || 0)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-500 mb-1">
                  <span>Total Items:</span>
                  <span>{selectedTestIds.length}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-900">
                   <span>Final Price:</span>
                   <span>Rs. {Math.round(finalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="admin-btn-primary w-full"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}
