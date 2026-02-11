'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/safe-toast';
import {
  createCorporateUserByAdminAction,
  getCorporateManagementDetailsAction,
  setCorporateUserActiveStatusByAdminAction,
  updateCorporateAction
} from '@/app/actions/adminCorporateActions';

export default function CorporateManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corporateId = Number(id);

  const [loading, setLoading] = useState(true);
  const [corp, setCorp] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingSpoc, setCreatingSpoc] = useState(false);

  const [profileForm, setProfileForm] = useState<any>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    employeeCount: 0,
    panNumber: '',
    gstin: ''
  });

  const [spocForm, setSpocForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEPT_HEAD',
    canEdit: false,
    maskContactInfo: true,
    accessDept: '',
    accessLocation: ''
  });

  const load = async () => {
    setLoading(true);
    const data = await getCorporateManagementDetailsAction(corporateId);
    setCorp(data);
    if (data) {
      setProfileForm({
        companyName: data.companyName || '',
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        employeeCount: data.employeeCount || 0,
        panNumber: data.panNumber || '',
        gstin: data.gstin || ''
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [corporateId]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateCorporateAction(corporateId, profileForm);
    setSavingProfile(false);
    if (res.success) {
      toast.success('Corporate profile updated');
      await load();
    } else {
      toast.error(res.error || 'Update failed');
    }
  };

  const onCreateSpoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSpoc(true);
    const res = await createCorporateUserByAdminAction({
      corporateId,
      name: spocForm.name,
      email: spocForm.email,
      password: spocForm.password,
      role: spocForm.role as any,
      canEdit: spocForm.canEdit,
      maskContactInfo: spocForm.maskContactInfo,
      accessDept: spocForm.accessDept || undefined,
      accessLocation: spocForm.accessLocation || undefined
    });
    setCreatingSpoc(false);

    if (res.success) {
      toast.success('SPOC created');
      setSpocForm({
        name: '',
        email: '',
        password: '',
        role: 'DEPT_HEAD',
        canEdit: false,
        maskContactInfo: true,
        accessDept: '',
        accessLocation: ''
      });
      await load();
    } else {
      toast.error(res.error || 'Failed to create SPOC');
    }
  };

  const toggleSpocStatus = async (userId: number, nextStatus: boolean) => {
    const res = await setCorporateUserActiveStatusByAdminAction({
      corporateId,
      userId,
      isActive: nextStatus
    });
    if (res.success) {
      toast.success('SPOC status updated');
      await load();
    } else {
      toast.error(res.error || 'Status update failed');
    }
  };

  if (loading || !corp) {
    return <div className="p-10 text-center text-slate-400">Loading corporate management...</div>;
  }

  const hrContacts = (corp.users || []).filter((u: any) => u.role === 'DEPT_HEAD');

  return (
    <div className="admin-space-y">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Corporate Management</h1>
          <p className="admin-page-subtitle">{corp.companyName}</p>
        </div>
        <div className="admin-space-x">
          <Link href={`/admin/corporates/${corporateId}`} className="admin-btn-secondary">Back</Link>
          <Link href={`/admin/corporates/${corporateId}/finance`} className="admin-btn-secondary">Open Financials</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="admin-card">
          <div className="admin-card-header">Corporate Details</div>
          <div className="admin-card-body">
            <form onSubmit={onSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="admin-form-input" placeholder="Company Name" value={profileForm.companyName} onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })} />
              <input className="admin-form-input" placeholder="Contact Person" value={profileForm.contactPerson} onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })} />
              <input className="admin-form-input" placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              <input className="admin-form-input" placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              <input className="admin-form-input md:col-span-2" placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
              <input className="admin-form-input" placeholder="City" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
              <input className="admin-form-input" placeholder="State" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
              <input className="admin-form-input" placeholder="Pincode" value={profileForm.pincode} onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })} />
              <input className="admin-form-input" placeholder="PAN" value={profileForm.panNumber} onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value })} />
              <input className="admin-form-input" placeholder="GSTIN" value={profileForm.gstin} onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })} />
              <input className="admin-form-input" type="number" placeholder="Employee Count" value={profileForm.employeeCount} onChange={(e) => setProfileForm({ ...profileForm, employeeCount: Number(e.target.value || 0) })} />
              <div className="md:col-span-2">
                <button type="submit" className="admin-btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Corporate Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">Add SPOC / Admin User</div>
          <div className="admin-card-body">
            <form onSubmit={onCreateSpoc} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="admin-form-input" placeholder="Name" value={spocForm.name} onChange={(e) => setSpocForm({ ...spocForm, name: e.target.value })} />
              <input className="admin-form-input" placeholder="Email" value={spocForm.email} onChange={(e) => setSpocForm({ ...spocForm, email: e.target.value })} />
              <input className="admin-form-input" type="password" placeholder="Password" value={spocForm.password} onChange={(e) => setSpocForm({ ...spocForm, password: e.target.value })} />
              <select className="admin-form-select" value={spocForm.role} onChange={(e) => setSpocForm({ ...spocForm, role: e.target.value })}>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="DEPT_HEAD">Dept Head / HR</option>
                <option value="LOCATION_MANAGER">Location Manager</option>
              </select>
              <input className="admin-form-input" placeholder="Access Department" value={spocForm.accessDept} onChange={(e) => setSpocForm({ ...spocForm, accessDept: e.target.value })} />
              <input className="admin-form-input" placeholder="Access Location" value={spocForm.accessLocation} onChange={(e) => setSpocForm({ ...spocForm, accessLocation: e.target.value })} />
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={spocForm.canEdit} onChange={(e) => setSpocForm({ ...spocForm, canEdit: e.target.checked })} /> Can Edit</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={spocForm.maskContactInfo} onChange={(e) => setSpocForm({ ...spocForm, maskContactInfo: e.target.checked })} /> Mask Contact Info</label>
              <div className="md:col-span-2">
                <button type="submit" className="admin-btn-primary" disabled={creatingSpoc}>
                  {creatingSpoc ? 'Creating...' : 'Create SPOC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">SPOC / Corporate Users</div>
        <div className="admin-card-body p-0">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(corp.users || []).map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role.replace('_', ' ')}</td>
                    <td>{u.accessDept || u.accessLocation || '-'}</td>
                    <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button
                        className="admin-btn-secondary"
                        onClick={() => toggleSpocStatus(u.id, !u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">HR Details</div>
        <div className="admin-card-body">
          {hrContacts.length === 0 ? (
            <p className="text-sm text-slate-500">No HR / Dept Head contacts configured.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hrContacts.map((h: any) => (
                <div key={h.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-slate-800">{h.name}</p>
                  <p className="text-sm text-slate-500">{h.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dept: {h.accessDept || '-'} | Location: {h.accessLocation || '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
