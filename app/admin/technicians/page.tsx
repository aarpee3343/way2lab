// app/admin/technicians/page.tsx
import Link from 'next/link';
import { getTechnicians, getTechnicianStats, deleteTechnicianAction } from '@/app/actions/adminTechnicianActions';
import { Plus, Users, CheckCircle, PauseCircle, Building2, Search, Edit } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function TechniciansPage() {
  const technicians = await getTechnicians();
  const stats = await getTechnicianStats();

  return (
    <div className="admin-space-y">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="admin-page-title">Technicians Management</h1>
          <p className="admin-page-subtitle">Manage laboratory technicians and assignments</p>
        </div>
        <Link href="/admin/technicians/add" className="admin-btn-primary">
          <Plus size={20} /> Add Technician
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="admin-stat-grid">
        <StatCard title="Total Technicians" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Active" value={stats.active} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard title="Inactive" value={stats.inactive} icon={PauseCircle} color="bg-amber-500" />
        <StatCard title="Total Labs" value={stats.labsCount} icon={Building2} color="bg-cyan-500" />
      </div>

      {/* Data Table */}
      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <div className="admin-search-container">
            <Search className="admin-search-icon" size={18}/>
            <input className="admin-search-input" placeholder="Search technicians..." />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Contact</th>
              <th>Assigned Labs</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {technicians.map((tech) => (
              <tr key={tech.id} className="group">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                       {tech.name.charAt(0)}
                    </div>
                    <div>
                       <div className="admin-table-row-primary">{tech.name}</div>
                       <div className="admin-table-row-secondary">{tech.email}</div>
                    </div>
                  </div>
                </td>
                <td className="text-slate-600 font-medium">
                  {tech.phone}
                </td>
                <td>
                   {tech.labCount > 0 ? (
                     <div className="flex flex-col gap-1">
                       <span className="admin-badge-info px-2 py-0.5 w-fit">
                         {tech.labCount} Lab(s)
                       </span>
                       <span className="admin-table-row-secondary truncate max-w-[200px]">{tech.labNames}</span>
                     </div>
                   ) : (
                     <span className="text-slate-400 text-xs italic">Unassigned</span>
                   )}
                </td>
                <td>
                  <div className={`admin-status-indicator ${tech.isActive ? 'admin-badge-success' : 'admin-badge-default'}`}>
                    <div className={`admin-status-dot ${tech.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    {tech.isActive ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/technicians/edit/${tech.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={18} />
                    </Link>
                    <DeleteRowButton id={tech.id} deleteAction={deleteTechnicianAction} />
                  </div>
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
    return (
        <div className="admin-stat-card">
            <div className={`admin-stat-icon-container ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="admin-stat-label">{title}</p>
                <h3 className="admin-stat-value">{value}</h3>
            </div>
        </div>
    );
}