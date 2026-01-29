'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateTestAction, getTestById, deleteTestAction } from '@/app/actions/adminInventoryActions'; 

// Fix Type: params is a Promise
export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Fix: Unwrap params properly
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

  if (loading || !form) return <div className="p-10 text-center">Loading Test...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Test: {form.testName}</h1>
          <p className="text-slate-500">Update global test details</p>
        </div>
        <Link href="/admin/tests" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Test Name</label>
              <input className="input-field" value={form.testName} onChange={e => setForm({...form, testName: e.target.value})} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Slug</label>
              <input className="input-field bg-slate-50" value={form.slug} readOnly />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="Pathology">Pathology</option>
                <option value="Radiology">Radiology</option>
                <option value="Cardiology">Cardiology</option>
              </select>
            </div>
            <div>
              <label className="label">Specialty</label>
              <select className="input-field" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}>
                <option value="General">General</option>
                <option value="Heart">Heart</option>
                <option value="Diabetes">Diabetes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Global Defaults</h3>
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
            Note: Updating price here changes the <strong>Global Base Price</strong>. 
            Lab-specific prices set in the Lab Manager will override this.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Base Price (₹)</label>
              <input type="number" className="input-field" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="label">Discount (%)</label>
              <input type="number" className="input-field" value={form.discount} onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} />
            </div>
             <div className="flex items-center gap-2 mt-6">
               <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5"/>
               <span className="font-bold text-slate-700">Active</span>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            type="button" 
            onClick={handleDelete} 
            className="text-rose-500 hover:text-rose-700 flex items-center gap-2 font-bold px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} /> Delete Test
          </button>
          
          <button 
            type="submit" 
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
          >
            <Save size={18} /> Update Test
          </button>
        </div>
      </form>
      
      <style jsx>{`
        .label { 
          @apply block text-xs font-bold text-slate-500 uppercase mb-1; 
        }
        .input-field { 
          @apply w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all; 
        }
      `}</style>
    </div>
  );
}