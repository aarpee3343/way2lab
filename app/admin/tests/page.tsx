import Link from 'next/link';
import { getTestStats, getTests, deleteTestAction } from '@/app/actions/adminInventoryActions';
import { Plus, Search, FlaskConical, CheckCircle2, Tags, Stethoscope, Edit, Activity, ArrowUpRight } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function TestsPage() {
  const stats = await getTestStats();
  const tests = await getTests();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Test Inventory</h1>
          <p className="text-slate-500 mt-1">Manage global catalog of diagnostic tests</p>
        </div>
        <Link href="/admin/tests/add" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center gap-2">
          <Plus size={20} /> Add New Test
        </Link>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', val: stats.total, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', val: stats.active, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Categories', val: stats.categories, icon: Tags, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Specialties', val: stats.specialties, icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon size={24} />
              </div>
              <span className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} className="mr-1"/> +2.5%
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{s.val}</h3>
            <p className="text-sm font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-0 z-10">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              placeholder="Search tests by name, category..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100">Filters</button>
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100">Export</button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Test Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Base Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((t) => (
                <tr key={t.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{t.testName}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">{t.slug || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {t.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">₹{Number(t.price).toFixed(2)}</span>
                      {Number(t.discount) > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded w-fit">
                          {Number(t.discount)}% OFF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit border ${t.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {t.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/tests/${t.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </Link>
                      <DeleteRowButton id={t.id} deleteAction={deleteTestAction} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}