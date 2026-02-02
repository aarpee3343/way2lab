'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

import {
  getCorporateSubAdmins,
  toggleMaskingAction,
} from '@/app/actions/corporateAuthActions';

/* ==================================
   PAGE
================================== */

export default function CorporateUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD USERS ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        // corporateId usually comes from session / middleware
        const res = await getCorporateSubAdmins();
        setUsers(res || []);
      } catch (e) {
        toast.error('Failed to load sub-admins');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ---------- TOGGLE MASKING ---------- */
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

  if (loading) {
    return (
      <div className="text-center text-slate-500 py-20">
        Loading access controls…
      </div>
    );
  }

  /* ==================================
     UI
  ================================== */

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Administrative Access
          </h1>
          <p className="text-slate-500 text-sm">
            Manage dashboard permissions and data privacy for sub-admins.
          </p>
        </div>

        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100">
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
                  {u.accessLocation || u.accessDept || '—'}
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
