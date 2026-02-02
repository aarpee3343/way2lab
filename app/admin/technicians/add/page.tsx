'use client';

import { useState, useEffect } from 'react';
import { getTechnicianFormData, createTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { ArrowLeft, Save, Loader2, User, Key, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AddTechnicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);

  // State for Auto-fill logic
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('technician123'); // Default Password

  useEffect(() => {
    // Fetch Labs
    getTechnicianFormData().then(setLabs);
  }, []);

  // ✅ Auto-generate Username: "WTL." + first word of name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const firstWord = val.trim().split(' ')[0];
    if (firstWord) {
      setUsername(`WTL.${firstWord}`);
    } else {
      setUsername('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Validate Lab Selection Client-side
    if (formData.getAll('lab_ids').length === 0) {
        toast.error("Please assign at least one lab");
        setLoading(false);
        return;
    }

    const res = await createTechnicianAction(formData);
    
    setLoading(false);
    if (res.success) {
      toast.success("Technician Added Successfully");
      router.push('/admin/technicians');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-page-title">Add Technician</h1>
          <p className="admin-page-subtitle">Create a new account for lab staff</p>
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
              <input 
                name="name" 
                required 
                className="admin-form-input" 
                placeholder="John Doe" 
                value={name}
                onChange={handleNameChange} // Triggers auto-fill
              />
            </div>
            <div>
              <label className="admin-form-label">Phone Number <span className="text-rose-500">*</span></label>
              <input name="phone" required className="admin-form-input" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="admin-form-label">Email Address</label>
              <input name="email" type="email" className="admin-form-input" placeholder="john@example.com" />
            </div>
            <div className="col-span-2">
              <label className="admin-form-label">Address</label>
              <textarea name="address" rows={2} className="admin-form-textarea resize-none" placeholder="Residential Address" />
            </div>
          </div>
        </div>

        {/* Assignments (Multiple Labs) */}
        <div className="admin-form-section">
          <h3 className="admin-form-title">
             <Building2 size={18} className="text-emerald-600"/> Lab Assignment
          </h3>
          <div>
            <label className="admin-form-label mb-3">Assign Labs (Select Multiple) <span className="text-rose-500">*</span></label>
            
            {labs.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-lg text-center">No labs found. Please add labs first.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {labs.map(lab => (
                    <label key={lab.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <input 
                        type="checkbox" 
                        name="lab_ids" 
                        value={lab.id} 
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" 
                    />
                    <div>
                        <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">{lab.labName}</span>
                        <span className="block text-xs text-slate-400">{lab.city}</span>
                    </div>
                    </label>
                ))}
                </div>
            )}
          </div>
        </div>

        {/* Account Security (Auto-Filled) */}
        <div className="admin-form-section">
          <h3 className="admin-form-title">
             <Key size={18} className="text-purple-600"/> Security
          </h3>
          <div className="admin-form-grid">
            <div>
              <label className="admin-form-label">Username <span className="text-rose-500">*</span></label>
              <input 
                name="username" 
                required 
                className="admin-form-input bg-slate-50" 
                placeholder="Auto-generated"
                value={username}
                readOnly // Prevent manual edits to ensure format
              />
            </div>
            <div>
              <label className="admin-form-label">Password <span className="text-rose-500">*</span></label>
              <input 
                name="password" 
                type="text" 
                required 
                className="admin-form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="admin-btn-primary w-full py-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Save Technician
        </button>
      </form>
    </div>
  );
}