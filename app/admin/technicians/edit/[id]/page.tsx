'use client';

import { useState, useEffect, use } from 'react';
import { getTechnicianFormData, getTechnicianById, updateTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, User, Key, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function EditTechnicianPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrapping Params in Next.js 15
  
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [tech, setTech] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getTechnicianFormData(),
      getTechnicianById(parseInt(id))
    ]).then(([labsData, techData]) => {
      setLabs(labsData);
      setTech(techData);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateTechnicianAction(parseInt(id), formData);
    
    setLoading(false);
    if (res.success) {
      toast.success("Technician Updated Successfully");
      router.push('/admin/technicians');
    } else {
      toast.error(res.error);
    }
  };

  if (!tech) return <div className="text-center py-20 text-slate-400">Loading technician details...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-black text-slate-900">Edit Technician</h1>
             <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${tech.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {tech.isActive ? 'Active' : 'Inactive'}
             </span>
          </div>
          <p className="text-slate-500">Update account details for {tech.name}</p>
        </div>
        <Link href="/admin/technicians" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} /> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <User size={18} className="text-blue-600"/> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name <span className="text-rose-500">*</span></label>
              <input name="name" required defaultValue={tech.name} className="input-field" />
            </div>
            <div>
              <label className="label">Phone Number <span className="text-rose-500">*</span></label>
              <input name="phone" required defaultValue={tech.phone} className="input-field" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" defaultValue={tech.email || ''} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea name="address" rows={2} defaultValue={tech.address || ''} className="input-field resize-none" />
            </div>
            <div>
               <label className="label">Status</label>
               <select name="is_active" defaultValue={tech.isActive ? '1' : '0'} className="input-field bg-white">
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
               </select>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Building2 size={18} className="text-emerald-600"/> Lab Assignment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {labs.map(lab => (
              <label key={lab.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <input 
                    type="checkbox" 
                    name="lab_ids" 
                    value={lab.id} 
                    defaultChecked={tech.assignedLabIds.includes(lab.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" 
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">{lab.labName}</span>
                    <span className="block text-xs text-slate-400">{lab.city}</span>
                  </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Key size={18} className="text-purple-600"/> Security
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Username</label>
              <input name="username" required defaultValue={tech.username} className="input-field" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input name="password" type="password" className="input-field" placeholder="Leave blank to keep current" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Update Technician
        </button>

      </form>

      <style jsx>{`
        .label { @apply block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wide; }
        .input-field { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400; }
      `}</style>
    </div>
  );
}