'use client';
import { useState, useEffect, use, useCallback } from 'react';
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
import { 
  Users, Package, Plus, Link as LinkIcon, Calendar, 
  RefreshCcw, Pencil, Trash2, X, Building2, Mail, 
  Phone, MapPin, User, Shield, AlertTriangle,
  CheckCircle, ArrowLeft
} from 'lucide-react';

export default function CorporateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corpId = parseInt(id);
  const router = useRouter();
  
  const [corp, setCorp] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Service Form State
  const [serviceForm, setServiceForm] = useState<{
    type: 'PACKAGE' | 'COUPON';
    itemId: string;
    validFrom: string;
    validTill: string;
    selfPaymentType: 'CORPORATE_PAYS' | 'USER_PAYS';
    familyPaymentType: 'CORPORATE_PAYS' | 'USER_PAYS';
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCorporateDetails(corpId);
      setCorp(data);
      if(data) {
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
    } finally {
      setLoading(false);
    }
  }, [corpId]);

  useEffect(() => {
    refresh();
    getAdminInventory().then(setInventory);
  }, [refresh]);

  // --- ACTIONS ---
  const handleUpdateCorporate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateCorporateAction(corpId, editForm);
    if(res.success) {
      toast.success("Corporate updated successfully!");
      setIsEditModalOpen(false);
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteCorporate = async () => {
    if(!confirm("Are you sure you want to delete this corporate? This action cannot be undone and will release all assigned packages.")) return;
    const res = await deleteCorporateAction(corpId);
    if(res.success) {
      toast.success("Corporate deleted successfully");
      router.push('/admin/corporates');
    } else {
      toast.error(res.error);
    }
  };

  const handleRemoveService = async (serviceId: number) => {
    if(!confirm("Remove this service? The package will be released back to inventory.")) return;
    const res = await deleteCorporateServiceAction(serviceId);
    if(res.success) {
      toast.success("Service removed successfully");
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const toggleEmployeeStatus = async (customerId: number, newStatus: boolean, email: string) => {
    const res = await bulkUpdateEmployeeStatus([email], newStatus);
    if(res.success) { 
      toast.success(`Employee ${newStatus ? 'activated' : 'deactivated'} successfully`); 
      refresh(); 
    } else { 
      toast.error("Failed to update status"); 
    }
  };

  const handleDomainMap = async () => {
    if(!domainInput) {
      toast.error("Please enter a domain");
      return;
    }
    const res = await mapDomainAction(corpId, domainInput);
    if(res.success) { 
      toast.success(`Domain ${domainInput} mapped successfully!`); 
      setDomainInput(''); 
      refresh(); 
    } else { 
      toast.error(res.error); 
    }
  };

  const handleAssignService = async () => {
    if (!serviceForm.itemId) {
      toast.error("Please select an item");
      return;
    }
    if (!serviceForm.validFrom || !serviceForm.validTill) {
      toast.error("Please select validity dates");
      return;
    }
    const res = await assignCorporateService({
      ...serviceForm,
      corporateId: corpId,
      itemId: Number(serviceForm.itemId)
    });
    if(res.success) { 
      toast.success("Service assigned successfully!"); 
      refresh(); 
    } else { 
      toast.error(res.error); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <RefreshCcw className="animate-spin h-8 w-8 text-blue-600 mb-4" />
        <p className="text-slate-600">Loading corporate details...</p>
      </div>
    );
  }

  if (!corp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Corporate Not Found</h2>
        <button 
          onClick={() => router.push('/admin/corporates')}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
        >
          Back to Corporates
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Edit Corporate Details</h2>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCorporate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company Name</label>
                  <input 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={editForm.companyName} 
                    onChange={e => setEditForm({...editForm, companyName: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                  <input 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={editForm.contactPerson} 
                    onChange={e => setEditForm({...editForm, contactPerson: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                  <input 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input 
                    required 
                    type="email"
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  />
                </div>

                <div className="md:col-span-2 border-t pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Address Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Address</label>
                      <input 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                        value={editForm.address} 
                        onChange={e => setEditForm({...editForm, address: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">City</label>
                      <input 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                        value={editForm.city} 
                        onChange={e => setEditForm({...editForm, city: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">State</label>
                      <input 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                        value={editForm.state} 
                        onChange={e => setEditForm({...editForm, state: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-black"
                >
                  <CheckCircle size={18} className="inline mr-2" /> Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white text-slate-700 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="border-t border-red-100 bg-red-50/50 p-6 rounded-b-2xl">
              <h3 className="text-sm font-bold text-red-700 uppercase mb-4">
                <AlertTriangle size={16} className="inline mr-2" /> Danger Zone
              </h3>
              <button 
                onClick={handleDeleteCorporate}
                className="text-sm text-red-600 border border-red-300 px-4 py-3 rounded-lg hover:bg-red-50 font-semibold w-full"
              >
                <Trash2 size={16} className="inline mr-2" /> Delete Corporate Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED HEADER */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/corporates')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{corp.companyName}</h1>
              <p className="text-sm text-slate-600">
                {corp.contactPerson} • {corp.email}
              </p>
            </div>
            {corp.domains?.map((d:string) => (
              <span key={d} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded border border-blue-200">
                {d}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{corp._count?.employees || 0}</div>
              <div className="text-xs font-semibold text-slate-400">Employees</div>
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit Corporate"
            >
              <Pencil size={20} />
            </button>
            <button 
              onClick={refresh}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-100">
          <button 
            onClick={() => setActiveTab('employees')} 
            className={`flex-1 px-6 py-3 font-semibold text-sm border-b-2 ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Users size={18} className="inline mr-2" /> Employees
          </button>
          <button 
            onClick={() => setActiveTab('services')} 
            className={`flex-1 px-6 py-3 font-semibold text-sm border-b-2 ${activeTab === 'services' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Package size={18} className="inline mr-2" /> Services
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 md:p-6">
        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">
                  <LinkIcon className="text-blue-600 inline mr-2" size={18}/> Domain Mapping
                </h3>
                <div className="space-y-3">
                  <input 
                    value={domainInput} 
                    onChange={e => setDomainInput(e.target.value)} 
                    placeholder="e.g. company.com" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                  <button 
                    onClick={handleDomainMap}
                    className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-black"
                  >
                    <LinkIcon size={16} className="inline mr-2" /> Map Domain
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">
                  <Users className="text-blue-600 inline mr-2" size={18}/> Bulk Employee Upload
                </h3>
                <BulkEmployeeUpload corporateId={corpId} onSuccess={refresh} />
              </div>
            </div>
            
            {/* Right Column - Employee List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-800">Employee List</h3>
                  <p className="text-sm text-slate-600">{corp.employees?.length || 0} employees</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Employee</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Contact Info</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {corp.employees && corp.employees.length > 0 ? (
                        corp.employees.map((e: any) => (
                          <tr key={e.id} className={`hover:bg-slate-50 ${!e.isActive ? 'opacity-75' : ''}`}>
                            <td className="p-4">
                              <div className="font-semibold text-slate-900">{e.name}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-slate-700">{e.phone}</div>
                              <div className="text-xs text-slate-500">{e.email}</div>
                            </td>
                            <td className="p-4">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${e.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {e.isActive ? 'Active' : 'Inactive'}
                              </div>
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => toggleEmployeeStatus(e.id, !e.isActive, e.email)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold ${e.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {e.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No employees found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Service Form */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit">
              <h3 className="font-semibold text-slate-800 mb-5">
                <Plus className="text-blue-600 inline mr-2" size={20}/> Assign New Service
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Service Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PACKAGE', 'COUPON'] as const).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setServiceForm({...serviceForm, type: t, itemId: ''})} 
                        className={`py-3 text-sm font-semibold rounded-lg border ${serviceForm.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Select {serviceForm.type}</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                    onChange={e => setServiceForm({...serviceForm, itemId: e.target.value})}
                    value={serviceForm.itemId}
                  >
                    <option value="">Select...</option>
                    {serviceForm.type === 'PACKAGE' 
                      ? inventory?.packages?.map((p:any) => (
                          <option key={p.id} value={p.id}>
                            {p.packageName} (₹{p.price})
                          </option>
                        ))
                      : inventory?.coupons?.map((c:any) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.description}
                          </option>
                        ))
                    }
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Validity Period</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                        onChange={e => setServiceForm({...serviceForm, validFrom: e.target.value})}
                        value={serviceForm.validFrom}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">End Date</label>
                      <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                        onChange={e => setServiceForm({...serviceForm, validTill: e.target.value})}
                        value={serviceForm.validTill}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Usage Limits</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Self</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                        value={serviceForm.selfLimit} 
                        onChange={e => setServiceForm({...serviceForm, selfLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Family</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                        value={serviceForm.familyLimit} 
                        onChange={e => setServiceForm({...serviceForm, familyLimit: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAssignService}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-black"
                >
                  <Shield size={18} className="inline mr-2" /> Assign Service
                </button>
              </div>
            </div>

            {/* Active Services List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-800 text-lg">Active Services</h3>
                  <div className="text-sm text-slate-600">
                    {corp.services?.length || 0} services assigned
                  </div>
                </div>
                
                {corp.services && corp.services.length > 0 ? (
                  <div className="space-y-4">
                    {corp.services.map((s: any) => (
                      <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${s.package ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                              {s.package ? (
                                <Package size={24} className="text-blue-600" />
                              ) : (
                                <span className="font-bold text-emerald-600 text-xl">%</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 text-lg">
                                {s.package?.packageName || `Coupon: ${s.coupon?.code}`}
                              </h4>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Calendar size={14} />
                                  <span>
                                    {new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTill).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    Self: {s.selfUsageLimit || '∞'}
                                  </span>
                                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                    Family: {s.familyUsageLimit || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                Active
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleRemoveService(s.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove Service"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <h4 className="font-semibold text-slate-700 mb-2">No Active Services</h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
