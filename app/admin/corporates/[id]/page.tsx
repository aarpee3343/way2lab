'use client';

import { useState, useEffect, use } from 'react';
import { getCorporateById } from '@/app/actions/adminCorporateActions';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { User, Package, Plus, Search, Building2, Ticket } from 'lucide-react';

export default function CorporateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'packages'>('employees');

  const refreshData = () => {
    getCorporateById(parseInt(id)).then(setData);
  };

  useEffect(() => {
    refreshData();
  }, [id]);

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-8 pb-32">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-start">
        <div className="flex gap-6">
          <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-3xl">
            {data.companyName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{data.companyName}</h1>
            <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1"><User size={16}/> {data.contactPerson}</span>
              <span className="flex items-center gap-1"><Building2 size={16}/> {data.address || 'No Address'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">{data._count.employees}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employees</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Employees
        </button>
        <button 
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'packages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Packages & Benefits
        </button>
      </div>

      {/* Tab Content: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Onboard Employees</h3>
            <BulkEmployeeUpload corporateId={parseInt(id)} onSuccess={refreshData} />
          </div>

          {/* Employee List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                 <input className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full text-sm outline-none" placeholder="Search employees..." />
               </div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Dept / Loc</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">{emp.email}</div>
                      <div className="text-xs text-slate-400">{emp.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{emp.department || '-'}</div>
                      <div className="text-xs text-slate-400">{emp.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                    </td>
                  </tr>
                ))}
                {data.employees.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-xl text-slate-800">Assigned Packages</h3>
             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Plus size={16} /> Create Corporate Package
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {data.packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-slate-800">{pkg.packageName}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${pkg.paymentType === 'CORPORATE_PAYS' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {pkg.paymentType === 'CORPORATE_PAYS' ? 'Paid by Corp' : 'Discounted'}
                      </span>
                   </div>
                   <p className="text-slate-500 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                   <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="font-bold text-slate-900">₹{pkg.price}</span>
                      <button className="text-blue-600 text-sm font-bold hover:underline">Assign to Employees</button>
                   </div>
                </div>
             ))}
             {data.packages.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                   <Package size={32} className="mx-auto text-slate-300 mb-2"/>
                   <p className="text-slate-500 font-medium">No packages assigned yet.</p>
                </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
}