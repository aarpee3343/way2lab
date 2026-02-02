// app/admin/technicians/edit/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { getTechnicianFormData, getTechnicianById, updateTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { ArrowLeft, Save, Loader2, User, Key, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function EditTechnicianPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
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

  if (!tech) return <div className="admin-loading">Loading technician details...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="admin-page-title">Edit Technician</h1>
             <span className={`admin-badge ${tech.isActive ? 'admin-badge-success' : 'admin-badge-default'} text-xs px-2 py-0.5`}>
                {tech.isActive ? 'Active' : 'Inactive'}
             </span>
          </div>
          <p className="admin-page-subtitle">Update account details for {tech.name}</p>
        </div>
        <Link href="/admin/technicians" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-space-y">
        
        {/* Personal Info */}
        <div className="admin-form-section">
          <h3 className="admin-form-title">
             <User size={18} className="text-blue-600"/> Personal Information
          </h3>
          <div className="admin-form-grid">
            <div>
              <label className="admin-form-label">Full Name <span className="text-rose-500">*</span></label>
              <input name="name" required defaultValue={tech.name} className="admin-form-input" />
            </div>
            <div>
              <label className="admin-form-label">Phone Number <span className="text-rose-500">*</span></label>
              <input name="phone" required defaultValue={tech.phone} className="admin-form-input" />
            </div>
            <div>
              <label className="admin-form-label">Email Address</label>
              <input name="email" type="email" defaultValue={tech.email || ''} className="admin-form-input" />
            </div>
            <div className="col-span-2">
              <label className="admin-form-label">Address</label>
              <textarea name="address" rows={2} defaultValue={tech.address || ''} className="admin-form-textarea resize-none" />
            </div>
            <div>
               <label className="admin-form-label">Status</label>
               <select name="is_active" defaultValue={tech.isActive ? '1' : '0'} className="admin-form-select">
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
               </select>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="admin-form-section">
          <h3 className="admin-form-title">
             <Building2 size={18} className="text-emerald-600"/> Lab Assignment
          </h3>
          <div>
            <label className="admin-form-label mb-3">Assign Labs</label>
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
        </div>

        {/* Security */}
        <div className="admin-form-section">
          <h3 className="admin-form-title">
             <Key size={18} className="text-purple-600"/> Security
          </h3>
          <div className="admin-form-grid">
            <div>
              <label className="admin-form-label">Username</label>
              <input name="username" required defaultValue={tech.username} className="admin-form-input" />
            </div>
            <div>
              <label className="admin-form-label">New Password</label>
              <input name="password" type="password" className="admin-form-input" placeholder="Leave blank to keep current" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="admin-btn-primary w-full py-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Update Technician
        </button>
      </form>
    </div>
  );
}