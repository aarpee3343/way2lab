'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCorporates } from '@/app/actions/adminCorporateActions';
import { Building2, Plus, Users, Package, MoreHorizontal } from 'lucide-react';

export default function CorporatesPage() {
  const [corporates, setCorporates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCorporates().then(data => {
      setCorporates(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Corporate Partners</h1>
          <p className="text-slate-500 mt-1">Manage B2B contracts and employee benefits</p>
        </div>
        <Link href="/admin/corporates/add" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
          <Plus size={20} /> Add Corporate
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corporates.map((corp) => (
          <div key={corp.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                {corp.companyName.charAt(0)}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${corp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {corp.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">{corp.companyName}</h3>
            <p className="text-sm text-slate-500 mb-6">{corp.contactPerson}</p>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Employees</p>
                <div className="flex items-center gap-1 font-bold text-slate-700">
                  <Users size={16} className="text-blue-500"/> {corp._count.employees}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Packages</p>
                <div className="flex items-center gap-1 font-bold text-slate-700">
                  <Package size={16} className="text-purple-500"/> {corp._count.packages}
                </div>
              </div>
            </div>

            <Link 
              href={`/admin/corporates/${corp.id}`}
              className="block w-full py-2.5 rounded-lg border border-slate-200 text-center font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Manage Dashboard
            </Link>
          </div>
        ))}
        
        {corporates.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No Corporates Yet</h3>
            <p className="text-sm text-slate-400">Add your first corporate partner to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}