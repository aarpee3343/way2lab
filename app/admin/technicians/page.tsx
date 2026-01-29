import Link from 'next/link';
import { getTechnicians, getTechnicianStats, deleteTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { Plus, Users, CheckCircle, PauseCircle, Building2, Search, Edit } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function TechniciansPage() {
  const technicians = await getTechnicians();
  const stats = await getTechnicianStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Technicians Management</h1>
          <p className="text-slate-500 mt-1">Manage laboratory technicians and assignments</p>
        </div>
        <Link href="/admin/technicians/add" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
          <Plus size={20} /> Add Technician
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Technicians" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Active" value={stats.active} icon={CheckCircle} color="emerald" />
        <StatCard title="Inactive" value={stats.inactive} icon={PauseCircle} color="amber" />
        <StatCard title="Total Labs" value={stats.labsCount} icon={Building2} color="cyan" />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
             <input className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search technicians..." />
           </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Technician</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Assigned Labs</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {technicians.map((tech) => (
              <tr key={tech.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                       {tech.name.charAt(0)}
                    </div>
                    <div>
                       <div className="font-bold text-slate-800">{tech.name}</div>
                       <div className="text-xs text-slate-400">{tech.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {tech.phone}
                </td>
                <td className="px-6 py-4">
                   {tech.labCount > 0 ? (
                     <div className="flex flex-col gap-1">
                       <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold w-fit">
                         {tech.labCount} Lab(s)
                       </span>
                       <span className="text-xs text-slate-400 truncate max-w-[200px]">{tech.labNames}</span>
                     </div>
                   ) : (
                     <span className="text-slate-400 text-xs italic">Unassigned</span>
                   )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${tech.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tech.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {tech.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Link href={`/admin/technicians/edit/${tech.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit size={18} />
                  </Link>
                  <DeleteRowButton id={tech.id} deleteAction={deleteTechnicianAction} />
                </td>
              </tr>
            ))}
            {technicians.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No technicians found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        cyan: "bg-cyan-50 text-cyan-600"
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-800">{value}</h3>
            </div>
        </div>
    );
}