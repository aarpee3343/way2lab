import Link from 'next/link';
import { getPackages, getPackageStats, deletePackageAction } from '@/app/actions/adminPackageActions';
import { Plus, Package, Activity, Search, Edit } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function PackagesPage() {
  const packages = await getPackages();
  const stats = await getPackageStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Health Packages</h1>
          <p className="text-slate-500 mt-1">Manage checkup bundles and pricing</p>
        </div>
        <Link href="/admin/packages/add" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
          <Plus size={20} /> Add Package
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Total Packages</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Active</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.active}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Inactive</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
             <input className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search packages..." />
           </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Package Name</th>
              <th className="px-6 py-4">Included Tests</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map((pkg) => {
              const price = Number(pkg.price);
              const discount = Number(pkg.discount || 0);
              const finalPrice = discount > 0 ? price - (price * discount / 100) : price;

              return (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{pkg.packageName}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{pkg.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold">
                      {pkg._count.tests} Tests
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">₹{Math.round(finalPrice)}</div>
                    {discount > 0 && (
                      <div className="text-xs text-emerald-600 font-bold">{discount}% OFF <span className="line-through text-slate-400 font-normal ml-1">₹{price}</span></div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${pkg.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Link href={`/admin/packages/edit/${pkg.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={18} />
                    </Link>
                    <DeleteRowButton id={pkg.id} deleteAction={deletePackageAction} />
                  </td>
                </tr>
              );
            })}
            {packages.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  No packages found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}