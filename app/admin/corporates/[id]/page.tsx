'use client';
import { useState, useEffect, use, useCallback } from 'react';
import { 
  getCorporateDetails, 
  mapDomainAction, 
  assignCorporateService, 
  assignEmployeesToPackageAction,
  clearPackageAssignmentsAction,
  getAdminInventory,
  updateCorporateEmployeeStatus,
  updateCorporateAction,      
  deleteCorporateServiceAction, 
  setCorporateActiveStatus       
} from '@/app/actions/adminCorporateActions';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { toast } from '@/lib/safe-toast';
import { Users, Package, Plus, Link as LinkIcon, Calendar, RefreshCcw, Pencil, Trash2, X } from 'lucide-react';

export default function CorporateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corpId = parseInt(id);
  
  const [corp, setCorp] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const serviceTypes = ['PACKAGE', 'COUPON'] as const;
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Service Form State
  const [serviceForm, setServiceForm] = useState<{
    type: 'PACKAGE' | 'COUPON';
    itemId: string;
    validFrom: string;
    validTill: string;
    selfPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
    familyPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
    selfLimit: number;
    familyLimit: number;
  }>({ 
    type: 'PACKAGE', 
    itemId: '', 
    validFrom: '', 
    validTill: '',
    selfPaymentType: 'CORPORATE_PAYS', 
    familyPaymentType: 'USER_PAYS',
    selfLimit: 1,
    familyLimit: 0
  });
  const [domainInput, setDomainInput] = useState('');
  const [employeeAssignForm, setEmployeeAssignForm] = useState({
    packageId: '',
    identifiers: ''
  });
  const [assigningEmployees, setAssigningEmployees] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  const refresh = useCallback(() => {
    return getCorporateDetails(corpId).then(data => {
      setCorp(data);
      if (data) {
        // Pre-fill edit form
        setEditForm({
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          employeeCount: data.employeeCount,
          panNumber: data.panNumber || '',
          gstin: data.gstin || ''
        });
      }
    });
  }, [corpId]);

  useEffect(() => {
    refresh();
    getAdminInventory().then(setInventory);
  }, [refresh]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview('');
      return;
    }
    const nextPreview = URL.createObjectURL(logoFile);
    setLogoPreview(nextPreview);
    return () => URL.revokeObjectURL(nextPreview);
  }, [logoFile]);

  // --- ACTIONS ---

  const handleUpdateCorporate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateCorporateAction(corpId, editForm);
    if(res.success) {
        toast.success("Corporate Updated!");
        setIsEditModalOpen(false);
        refresh();
    } else {
        toast.error(res.error);
    }
  };

  const handleArchiveCorporate = async () => {
    if (!confirm("Archive this corporate? Employees will become regular users and corporate logins will be disabled.")) return;
    const res = await setCorporateActiveStatus(corpId, false);
    if(res.success) {
        toast.success("Corporate Archived");
        refresh();
    } else {
        toast.error(res.error);
    }
  };

  const handleRestoreCorporate = async () => {
    const res = await setCorporateActiveStatus(corpId, true);
    if (res.success) {
      toast.success("Corporate Restored");
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleRemoveService = async (serviceId: number) => {
    if(!confirm("Remove this service? The package will be released back to inventory.")) return;
    const res = await deleteCorporateServiceAction(serviceId);
    if(res.success) {
        toast.success("Service Removed");
        refresh();
    } else {
        toast.error(res.error);
    }
  };

  // ... (Keep existing handleDomainMap, handleAssignService, toggleEmployeeStatus logic here) ...
  const toggleEmployeeStatus = async (customerId: number, newStatus: boolean) => {
    const res = await updateCorporateEmployeeStatus(customerId, newStatus, corpId);
    if(res.success) { toast.success("Status Updated"); refresh(); } 
    else { toast.error("Failed"); }
  };
  const handleDomainMap = async () => {
    if(!domainInput) return;
    const res = await mapDomainAction(corpId, domainInput);
    if(res.success) { toast.success(`Mapped!`); setDomainInput(''); refresh(); }
    else { toast.error(res.error); }
  };
  const handleAssignService = async () => {
    if (!serviceForm.itemId) return toast.error("Select item");
    const itemId = Number(serviceForm.itemId);
    if (Number.isNaN(itemId)) return toast.error("Invalid item");
    if (!serviceForm.validFrom || !serviceForm.validTill) {
      return toast.error("Select valid dates");
    }

    const res = await assignCorporateService({
      corporateId: corpId,
      type: serviceForm.type,
      itemId,
      validFrom: serviceForm.validFrom,
      validTill: serviceForm.validTill,
      selfPaymentType: serviceForm.selfPaymentType,
      familyPaymentType: serviceForm.familyPaymentType,
      selfLimit: serviceForm.selfLimit,
      familyLimit: serviceForm.familyLimit
    });
    if(res.success) { toast.success("Assigned!"); refresh(); }
    else { toast.error(res.error); }
  };

  const handleAssignEmployees = async () => {
    if (!employeeAssignForm.packageId) {
      toast.error('Select a package service');
      return;
    }

    const identifiers = employeeAssignForm.identifiers
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (identifiers.length === 0) {
      toast.error('Enter employee emails / IDs / phones');
      return;
    }

    setAssigningEmployees(true);
    const res = await assignEmployeesToPackageAction({
      corporateId: corpId,
      packageId: Number(employeeAssignForm.packageId),
      identifiers
    });
    setAssigningEmployees(false);

    if (res.success) {
      toast.success(`Assigned to ${res.assigned} employees`);
      setEmployeeAssignForm({ packageId: employeeAssignForm.packageId, identifiers: '' });
      refresh();
    } else {
      toast.error(res.error || 'Assignment failed');
    }
  };

  const handleClearAssignments = async () => {
    if (!employeeAssignForm.packageId) {
      toast.error('Select a package service');
      return;
    }
    if (!confirm('Clear all employee assignments for this package?')) return;

    const res = await clearPackageAssignmentsAction({
      corporateId: corpId,
      packageId: Number(employeeAssignForm.packageId)
    });
    if (res.success) {
      toast.success(`Cleared ${res.removed} assignments`);
      refresh();
    } else {
      toast.error(res.error || 'Failed to clear assignments');
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Select a logo file first');
      return;
    }
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('corporateId', String(corpId));
      const res = await fetch('/api/admin/corporates/logo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data?.success) {
        toast.success('Logo updated');
        setLogoFile(null);
        refresh();
      } else {
        toast.error(data?.error || 'Logo upload failed');
      }
    } catch (error) {
      toast.error('Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };


  if (!corp) return <div className="p-10 text-center flex items-center justify-center gap-2"><RefreshCcw className="animate-spin"/> Loading...</div>;
  const isArchived = !corp.isActive;

  return (
    <div className="space-y-8 relative">
      
      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Edit Corporate</h2>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                <form onSubmit={handleUpdateCorporate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500">Name</label><input required className="w-full border p-2 rounded" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500">Person</label><input required className="w-full border p-2 rounded" value={editForm.contactPerson} onChange={e => setEditForm({...editForm, contactPerson: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500">Phone</label><input required className="w-full border p-2 rounded" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500">Email</label><input required className="w-full border p-2 rounded" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
                        
                        <div className="col-span-2 border-t pt-4 mt-2 font-bold text-sm text-slate-400">Address Details</div>
                        <div className="col-span-2"><input placeholder="Address" className="w-full border p-2 rounded" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>
                        <div><input placeholder="City" className="w-full border p-2 rounded" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} /></div>
                        <div><input placeholder="State" className="w-full border p-2 rounded" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} /></div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black">Save Changes</button>
                    </div>
                </form>

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-red-100">
                    <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Archive</h3>
                    <button onClick={handleArchiveCorporate} className="text-xs text-red-500 border border-red-200 px-3 py-2 rounded hover:bg-red-50 font-bold flex items-center gap-2">
                        <Trash2 size={14} /> Archive Corporate
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900">{corp.companyName}</h1>
            <button onClick={() => setIsEditModalOpen(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                <Pencil size={20} />
            </button>
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
              isArchived ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isArchived ? 'Archived' : 'Active'}
            </span>
          </div>
          <p className="text-slate-500">{corp.city || 'No City'}, {corp.state || 'No State'} • {corp.contactPerson}</p>
          <div className="flex gap-2 mt-3">
            {(corp.domains || []).map((d:string) => (
              <span key={d} className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">{d}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">{corp._count?.employees || 0}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Total Employees</div>
          {isArchived && (
            <button
              onClick={handleRestoreCorporate}
              className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100"
            >
              Restore Corporate
            </button>
          )}
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-40 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
          {logoPreview || corp.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview || corp.logoUrl}
              alt={`${corp.companyName} Logo`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400 font-semibold">No Logo</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800">Corporate Logo</h3>
          <p className="text-xs text-slate-500 mb-3">Shown on the corporate portal header.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              disabled={isArchived || logoUploading}
            />
            <button
              onClick={handleLogoUpload}
              disabled={isArchived || logoUploading || !logoFile}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-60"
            >
              {logoUploading ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('employees')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Employees</button>
        <button onClick={() => setActiveTab('services')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'services' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Services</button>
      </div>

      {/* --- EMPLOYEES TAB (Same as before) --- */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* ... Left Side ... */}
           <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><LinkIcon size={18}/> Domain Mapping</h3>
                <div className="flex gap-2">
                    <input
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      placeholder="e.g. acme.com"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-60"
                      disabled={isArchived}
                    />
                    <button
                      onClick={handleDomainMap}
                      disabled={isArchived}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-60"
                    >
                      Map
                    </button>
                </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={18}/> Bulk Upload</h3>
                    {isArchived ? (
                      <div className="text-xs text-slate-500">
                        Corporate is archived. Bulk uploads are disabled.
                      </div>
                    ) : (
                      <BulkEmployeeUpload corporateId={corpId} onSuccess={refresh} />
                    )}
                </div>
           </div>
           
           {/* ... Right Side (List) ... */}
           <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-slate-400 uppercase bg-white">
                    <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {corp.employees && corp.employees.map((e: any) => (
                        <tr key={e.id} className={!e.isActive ? 'opacity-50 grayscale' : ''}>
                        <td className="px-4 py-3 font-bold">{e.name}</td>
                        <td className="px-4 py-3 text-slate-500">
                            <div>{e.phone}</div>
                            <div className="text-xs">{e.email}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button onClick={() => toggleEmployeeStatus(e.id, !e.isActive)} className={`text-xs font-bold px-3 py-1 rounded-lg border ${e.isActive ? 'border-red-200 text-red-500' : 'border-emerald-200 text-emerald-500'}`}>
                                {e.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
           </div>
        </div>
      )}

      {/* --- SERVICES TAB (With Remove Button) --- */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Service Form */}
          <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Assign Service</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Service Type</label>
                <div className="flex gap-2 mt-1">
                  {serviceTypes.map(t => (
                    <button key={t} onClick={() => setServiceForm({...serviceForm, type: t})} 
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border ${serviceForm.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Select Item</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm mt-1"
                  onChange={e => setServiceForm({...serviceForm, itemId: e.target.value})}
                  value={serviceForm.itemId}
                >
                  <option value="">Select...</option>
                  {serviceForm.type === 'PACKAGE' 
                    ? inventory?.packages.map((p:any) => <option key={p.id} value={p.id}>{p.packageName} (₹{p.price})</option>)
                    : inventory?.coupons.map((c:any) => <option key={c.id} value={c.id}>{c.code}</option>)
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Valid From</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" onChange={e => setServiceForm({...serviceForm, validFrom: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Valid Till</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" onChange={e => setServiceForm({...serviceForm, validTill: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Self Payment</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1"
                    value={serviceForm.selfPaymentType}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        selfPaymentType: e.target.value as 'USER_PAYS' | 'CORPORATE_PAYS'
                      })
                    }
                  >
                    <option value="CORPORATE_PAYS">Corporate Pays</option>
                    <option value="USER_PAYS">Self Pay</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Family Payment</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1"
                    value={serviceForm.familyPaymentType}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        familyPaymentType: e.target.value as 'USER_PAYS' | 'CORPORATE_PAYS'
                      })
                    }
                  >
                    <option value="CORPORATE_PAYS">Corporate Pays</option>
                    <option value="USER_PAYS">Self Pay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-bold text-slate-500">Limits (Self)</label>
                    <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" value={serviceForm.selfLimit} 
                    onChange={e => setServiceForm({...serviceForm, selfLimit: e.target.value === '' ? 0 : parseInt(e.target.value)})}/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500">Limits (Family)</label>
                    <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" value={serviceForm.familyLimit} 
                    onChange={e =>setServiceForm({...serviceForm,familyLimit: e.target.value === '' ? 0 : parseInt(e.target.value)})}/>
                 </div>
              </div>

              <button
                onClick={handleAssignService}
                disabled={isArchived}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-60"
              >
                Assign to Corporate
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> Limit Package to Employees</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Package Service</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm mt-1"
                  value={employeeAssignForm.packageId}
                  onChange={(e) => setEmployeeAssignForm({ ...employeeAssignForm, packageId: e.target.value })}
                >
                  <option value="">Select...</option>
                  {(corp?.services || [])
                    .filter((s: any) => s.package)
                    .map((s: any) => (
                      <option key={s.id} value={s.package.id}>
                        {s.package.packageName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Employee Emails / IDs / Phones</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm mt-1 min-h-[120px]"
                  placeholder="Paste emails, employee IDs, or phone numbers (comma or new line separated)"
                  value={employeeAssignForm.identifiers}
                  onChange={(e) => setEmployeeAssignForm({ ...employeeAssignForm, identifiers: e.target.value })}
                />
              </div>
              <button
                onClick={handleAssignEmployees}
                disabled={isArchived || assigningEmployees}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {assigningEmployees ? 'Assigning...' : 'Assign to Selected Employees'}
              </button>
              <button
                onClick={handleClearAssignments}
                disabled={isArchived}
                className="w-full bg-white text-slate-700 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                Clear Package Assignments (Make Available to All)
              </button>
            </div>
          </div>
        </div>

          {/* Active Services List (UPDATED WITH DELETE BUTTON) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800">Active Services</h3>
            {corp.services.length === 0 && <div className="text-slate-400 text-sm italic">No active services assigned.</div>}
            
            {corp.services.map((s: any) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {s.package ? <Package size={20}/> : <span className="font-bold">%</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{s.package?.packageName || `Coupon: ${s.coupon?.code}`}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12}/> {new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTill).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex flex-col items-end gap-1">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">Active</span>
                        <span className="text-[10px] text-slate-400">Limits: {s.selfUsageLimit} (Self) / {s.familyUsageLimit} (Fam)</span>
                     </div>
                     
                     {/* DELETE SERVICE BUTTON */}
                     <button 
                        onClick={() => handleRemoveService(s.id)}
                        disabled={isArchived}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 disabled:opacity-40"
                        title="Remove Service"
                     >
                        <Trash2 size={16} />
                     </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
