// app/admin/tests/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateTestAction, getTestById, deleteTestAction } from '@/app/actions/adminInventoryActions'; 

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const testId = Number(id);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!testId) return;

    getTestById(testId).then(data => {
      if (!data) {
        toast.error("Test not found");
        router.push('/admin/tests');
      } else {
        setForm(data);
        setLoading(false);
      }
    });
  }, [testId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    
    const res = await updateTestAction(form.id, form);
    
    if (res.success) {
      toast.success("Test Updated Successfully");
      router.refresh();
    } else {
      toast.error("Failed to update test");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will remove the test from all labs.")) return;
    
    const res = await deleteTestAction(testId);
    if (res.success) {
      toast.success("Test Deleted");
      router.push('/admin/tests');
    }
  };

  if (loading || !form) return <div className="admin-loading">Loading Test...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="admin-page-title">Edit Test: {form.testName}</h1>
          <p className="admin-page-subtitle">Update global test details</p>
        </div>
        <Link href="/admin/tests" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-space-y">
        
        <div className="admin-form-section">
          <h3 className="admin-form-title mb-4">Basic Information</h3>
          <div className="admin-form-grid">
            <div className="col-span-2 sm:col-span-1">
              <label className="admin-form-label">Test Name</label>
              <input 
                className="admin-form-input" 
                value={form.testName} 
                onChange={e => setForm({...form, testName: e.target.value})} 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="admin-form-label">Slug</label>
              <input 
                className="admin-form-input bg-slate-50" 
                value={form.slug} 
                readOnly 
              />
            </div>
            <div>
              <label className="admin-form-label">Category</label>
              <select 
                className="admin-form-select" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="Pathology">Pathology</option>
                <option value="Radiology">Radiology</option>
                <option value="Cardiology">Cardiology</option>
              </select>
            </div>
            <div>
              <label className="admin-form-label">Specialty</label>
              <select 
                className="admin-form-select" 
                value={form.specialty} 
                onChange={e => setForm({...form, specialty: e.target.value})}
              >
                <option value="General">General</option>
                <option value="Heart">Heart</option>
                <option value="Diabetes">Diabetes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="admin-form-label">Description</label>
              <textarea 
                rows={3} 
                className="admin-form-textarea" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <h3 className="admin-form-title mb-4">Global Defaults</h3>
          <div className="admin-alert admin-alert-warning mb-4">
            Note: Updating price here changes the <strong>Global Base Price</strong>. 
            Lab-specific prices set in the Lab Manager will override this.
          </div>
          <div className="admin-form-grid">
            <div>
              <label className="admin-form-label">Base Price (₹)</label>
              <input 
                type="number" 
                className="admin-form-input" 
                value={form.price} 
                onChange={e => setForm({...form, price: parseFloat(e.target.value)})} 
              />
            </div>
            <div>
              <label className="admin-form-label">Discount (%)</label>
              <input 
                type="number" 
                className="admin-form-input" 
                value={form.discount} 
                onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} 
              />
            </div>
             <div className="flex items-center gap-2 mt-6">
               <input 
                 type="checkbox" 
                 checked={form.isActive} 
                 onChange={e => setForm({...form, isActive: e.target.checked})} 
                 className="w-5 h-5"
               />
               <span className="font-bold text-slate-700">Active</span>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            type="button" 
            onClick={handleDelete} 
            className="admin-btn-danger"
          >
            <Trash2 size={18} /> Delete Test
          </button>
          
          <button 
            type="submit" 
            className="admin-btn-primary"
          >
            <Save size={18} /> Update Test
          </button>
        </div>
      </form>
    </div>
  );
}