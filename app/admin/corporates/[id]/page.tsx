'use client';
import { useState, useEffect, use } from 'react';
import { getCorporateDetails, mapDomainAction, assignCorporateService, getAdminInventory } from '@/app/actions/adminCorporateActions';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { toast } from 'sonner';
import { Users, Package, Plus, Link as LinkIcon, Calendar } from 'lucide-react';

export default function CorporateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corpId = parseInt(id);
  
  const [corp, setCorp] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');
  
  // Forms State
  const [domainInput, setDomainInput] = useState('');
  const [serviceForm, setServiceForm] = useState({ type: 'PACKAGE', itemId: '', validFrom: '', validTill: '' });

  const refresh = () => getCorporateDetails(corpId).then(setCorp);

  useEffect(() => {
    refresh();
    getAdminInventory().then(setInventory);
  }, [corpId]);

  if (!corp) return <div className="p-10 text-center">Loading...</div>;

  const handleDomainMap = async () => {
    if(!domainInput) return;
    const res = await mapDomainAction(corpId, domainInput);
    if(res.success) {
      toast.success(`Domain Mapped! ${res.count} users updated.`);
      setDomainInput('');
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleAssignService = async () => {
    const res = await assignCorporateService({ ...serviceForm, corporateId: corpId });
    if(res.success) {
      toast.success("Service Assigned Successfully");
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{corp.companyName}</h1>
          <p className="text-slate-500">{corp.city}, {corp.state} • {corp.contactPerson}</p>
          <div className="flex gap-2 mt-3">
            {corp.domains.map((d:string) => (
              <span key={d} className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">{d}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">{corp._count.employees}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Total Employees</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('employees')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Employees</button>
        <button onClick={() => setActiveTab('services')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'services' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Services</button>
      </div>

      {/* --- EMPLOYEES TAB --- */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Actions */}
          <div className="space-y-6">
            
            {/* Domain Mapping */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><LinkIcon size={18}/> Domain Mapping</h3>
              <p className="text-xs text-slate-500 mb-3">Auto-map users who register with this domain.</p>
              <div className="flex gap-2">
                <input 
                  value={domainInput} 
                  onChange={e => setDomainInput(e.target.value)} 
                  placeholder="e.g. acme.com" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" 
                />
                <button onClick={handleDomainMap} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm">Map</button>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={18}/> Bulk Upload</h3>
              <BulkEmployeeUpload corporateId={corpId} onSuccess={refresh} />
            </div>
          </div>

          {/* Right: List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-600">Employee List (Recent)</div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-bold text-slate-400 uppercase bg-white">
                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Emp ID</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corp.employees.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-bold">{e.name}</td>
                    <td className="px-4 py-3 text-slate-500">{e.email}<br/>{e.phone}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{e.employeeId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SERVICES TAB --- */}
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
                >
                  <option value="">Select...</option>
                  {serviceForm.type === 'PACKAGE' 
                    ? inventory?.packages.map((p:any) => <option key={p.id} value={p.id}>{p.packageName}</option>)
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

              <button onClick={handleAssignService} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black">
                Assign to Corporate
              </button>
            </div>
          </div>

          {/* Active Services List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800">Active Services</h3>
            {corp.services.length === 0 && <div className="text-slate-400 text-sm italic">No active services assigned.</div>}
            
            {corp.services.map((s: any) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
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
                <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">Active</div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}