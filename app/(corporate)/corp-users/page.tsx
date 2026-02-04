'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

import {
  getCorporateSubAdmins,
  toggleMaskingAction,
} from '@/app/actions/corporateAuthActions';
import { createCorporateUser, getCorporateProfile } from '@/app/actions/corporatePortalActions';

export default function CorporateUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEPT_HEAD',
    accessDept: '',
    accessLocation: '',
    canEdit: false,
    maskContactInfo: true
  });

  const loadUsers = async () => {
    try {
      const res = await getCorporateSubAdmins();
      setUsers(res || []);
    } catch (e) {
      toast.error('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadUsers();
      const profile = await getCorporateProfile();
      const isEditor = Boolean(profile?.user?.canEdit || profile?.user?.role === 'SUPER_ADMIN');
      setCanEdit(isEditor);
    };
    load();
  }, []);

  const handleToggleMasking = async (userId: number, currentStatus: boolean) => {
    const res = await toggleMaskingAction(userId, currentStatus);

    if (res.success) {
      toast.success('Privacy settings updated');
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, maskContactInfo: !currentStatus }
            : u
        )
      );
    } else {
      toast.error(res.error || 'Update failed');
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Fill all required fields');
      return;
    }
    const res = await createCorporateUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role as any,
      accessDept: form.accessDept || undefined,
      accessLocation: form.accessLocation || undefined,
      canEdit: form.canEdit,
      maskContactInfo: form.maskContactInfo
    });

    if (res.success) {
      toast.success('Sub-admin created');
      setShowCreate(false);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'DEPT_HEAD',
        accessDept: '',
        accessLocation: '',
        canEdit: false,
        maskContactInfo: true
      });
      loadUsers();
    } else {
      toast.error(res.error || 'Create failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-slate-500 py-20">
        Loading access controls...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Create Sub-Admin</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <input
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Email"
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Password"
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="DEPT_HEAD">Dept Head</option>
                  <option value="LOCATION_MANAGER">Location Manager</option>
                </select>
                <input
                  placeholder="Access Department (optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={form.accessDept}
                  onChange={(e) => setForm({ ...form, accessDept: e.target.value })}
                />
              </div>
              <input
                placeholder="Access Location (optional)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                value={form.accessLocation}
                onChange={(e) => setForm({ ...form, accessLocation: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={form.canEdit}
                  onChange={(e) => setForm({ ...form, canEdit: e.target.checked })}
                />
                Allow editing permissions
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={form.maskContactInfo}
                  onChange={(e) => setForm({ ...form, maskContactInfo: e.target.checked })}
                />
                Mask employee contact info
              </label>
              <button
                onClick={handleCreate}
                className="bg-slate-900 text-white py-3 rounded-2xl font-black text-sm"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Administrative Access
          </h1>
          <p className="text-slate-500 text-sm">
            Manage dashboard permissions and data privacy for sub-admins.
          </p>
        </div>

        <button
          onClick={() => {
            if (!canEdit) {
              toast.error('You do not have permission to create users');
              return;
            }
            setShowCreate(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} /> New Sub-Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(u => (
          <div
            key={u.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{u.name}</h4>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>

              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase">
                {u.role?.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3 border-t border-slate-50 pt-4 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">
                  Access Boundary
                </span>
                <span className="text-slate-800 font-black">
                  {u.accessLocation || u.accessDept || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Edit Rights</span>
                <span className="text-slate-800 font-black">
                  {u.canEdit ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-bold">
                  Privacy Masking
                </span>

                <button
                  onClick={() =>
                    handleToggleMasking(u.id, u.maskContactInfo)
                  }
                  className={`flex items-center gap-2 text-xs font-black px-3 py-2 rounded-xl transition-all ${
                    u.maskContactInfo
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {u.maskContactInfo ? (
                    <>
                      <EyeOff size={14} /> Contact Masked
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Contact Visible
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

