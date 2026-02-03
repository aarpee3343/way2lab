'use client';
import { useState, useEffect, use } from 'react';
import { 
  getCorporateDetails, 
  mapDomainAction, 
  assignCorporateService, 
  getAdminInventory,
  bulkUpdateEmployeeStatus,
  updateCorporateAction,      
  deleteCorporateServiceAction, 
  deleteCorporateAction       
} from '@/app/actions/adminCorporateActions';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { toast } from '@/lib/safe-toast';
import { useRouter } from 'next/navigation';
import { Users, Package, Plus, Link as LinkIcon, Calendar, RefreshCcw, Pencil, Trash2, X } from 'lucide-react';

export default function CorporateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corpId = parseInt(id);
  const router = useRouter();
  
  const [corp, setCorp] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Service Form State
  const [serviceForm, setServiceForm] = useState({ 
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

  const refresh = () => getCorporateDetails(corpId).then(data => {
    setCorp(data);
    if(data) {
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

  useEffect(() => {
    refresh();
    getAdminInventory().then(setInventory);
  }, [corpId]);

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

  const handleDeleteCorporate = async () => {
    if(!confirm("ARE YOU SURE? This will permanently delete this corporate and release all packages.")) return;
    const res = await deleteCorporateAction(corpId);
    if(res.success) {
        toast.success("Corporate Deleted");
        router.push('/admin/corporates');
    } else {
        toast.error(res.error);
    }
  };

  const handleRemoveService = async (serviceId: number, packageId: number | null) => {
    if(!confirm("Remove this service? The package will be released back to inventory.")) return;
    const res = await deleteCorporateServiceAction(serviceId, packageId);
    if(res.success) {
        toast.success("Service Removed");
        refresh();
    } else {
        toast.error(res.error);
    }
  };

  // ... (Keep existing handleDomainMap, handleAssignService, toggleEmployeeStatus logic here) ...
  const toggleEmployeeStatus = async (customerId: number, newStatus: boolean, email: string) => {
    const res = await bulkUpdateEmployeeStatus([email], newStatus);
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
    const res = await assignCorporateService({ ...serviceForm, corporateId: corpId });
    if(res.success) { toast.success("Assigned!"); refresh(); }
    else { toast.error(res.error); }
  };


  if (!corp) return <div className="p-10 text-center flex items-center justify-center gap-2"><RefreshCcw className="animate-spin"/> Loading...</div>;

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
                    <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Danger Zone</h3>
                    <button onClick={handleDeleteCorporate} className="text-xs text-red-500 border border-red-200 px-3 py-2 rounded hover:bg-red-50 font-bold flex items-center gap-2">
                        <Trash2 size={14} /> Delete Corporate Permanently
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
          </div>
          <p className="text-slate-500">{corp.city || 'No City'}, {corp.state || 'No State'} • {corp.contactPerson}</p>
          <div className="flex gap-2 mt-3">
            {corp.domains.map((d:string) => (
              <span key={d} className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">{d}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">{corp._count?.employees || 0}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Total Employees</div>
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
                    <input value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="e.g. acme.com" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    <button onClick={handleDomainMap} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm">Map</button>
                </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={18}/> Bulk Upload</h3>
                    <BulkEmployeeUpload corporateId={corpId} onSuccess={refresh} />
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
                            <button onClick={() => toggleEmployeeStatus(e.id, !e.isActive, e.email)} className={`text-xs font-bold px-3 py-1 rounded-lg border ${e.isActive ? 'border-red-200 text-red-500' : 'border-emerald-200 text-emerald-500'}`}>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Assign Service</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Service Type</label>
                <div className="flex gap-2 mt-1">
                  {['PACKAGE', 'COUPON'].map(t => (
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
                    <label className="text-xs font-bold text-slate-500">Limits (Self)</label>
                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" value={serviceForm.selfLimit} onChange={e => setServiceForm({...serviceForm, selfLimit: parseInt(e.target.value)})}/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500">Limits (Family)</label>
                    <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm mt-1" value={serviceForm.familyLimit} 
                    onChange={e =>setServiceForm({...serviceForm,familyLimit: e.target.value === '' ? 0 : parseInt(e.target.value)})}/>
                 </div>
              </div>

              <button onClick={handleAssignService} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black">
                Assign to Corporate
              </button>
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
                        onClick={() => handleRemoveService(s.id, s.package?.id || null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
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