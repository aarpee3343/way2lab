'use client';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { getCorporateProfile, updateCorporateProfile } from '@/app/actions/corporatePortalActions';

export default function CorpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    const load = async () => {
      const profile = await getCorporateProfile();
      if (profile?.corp) {
        setForm({
          companyName: profile.corp.companyName || '',
          contactPerson: profile.corp.contactPerson || '',
          phone: profile.corp.phone || '',
          address: profile.corp.address || '',
          city: profile.corp.city || '',
          state: profile.corp.state || '',
          pincode: profile.corp.pincode || ''
        });
        setLogoUrl(profile.corp.logoUrl || '');
      }
      const isEditor = Boolean(profile?.user?.canEdit || profile?.user?.role === 'SUPER_ADMIN');
      setCanEdit(isEditor);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview('');
      return;
    }
    const nextPreview = URL.createObjectURL(logoFile);
    setLogoPreview(nextPreview);
    return () => URL.revokeObjectURL(nextPreview);
  }, [logoFile]);

  const handleLogoUpload = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit settings');
      return;
    }
    if (!logoFile) {
      toast.error('Select a logo file first');
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      const res = await fetch('/api/corp/logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (data?.success) {
        setLogoUrl(data.logoUrl || '');
        setLogoFile(null);
        toast.success('Logo updated');
      } else {
        toast.error(data?.error || 'Logo upload failed');
      }
    } catch (error) {
      toast.error('Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit settings');
      return;
    }
    const res = await updateCorporateProfile(form);
    if (res.success) {
      toast.success('Profile updated');
    } else {
      toast.error(res.error || 'Update failed');
    }
  };

  if (loading) {
    return <div className="text-center text-slate-500 py-20">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Profile</h1>
      {!canEdit && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          You have view-only access. Contact a Super Admin to edit these settings.
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Organization Logo</h2>
            <p className="text-xs text-slate-500">This logo appears on the corporate portal header.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-40 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
              {logoPreview || logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview || logoUrl}
                  alt="Corporate Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 font-semibold">No Logo</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                disabled={!canEdit || logoUploading}
              />
              <button
                onClick={handleLogoUpload}
                disabled={!canEdit || logoUploading || !logoFile}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {logoUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Company Name</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Primary Contact Person</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Phone</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Address</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">City</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">State</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Pincode</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              disabled={!canEdit}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-60"
          disabled={!canEdit}
        >
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
}

