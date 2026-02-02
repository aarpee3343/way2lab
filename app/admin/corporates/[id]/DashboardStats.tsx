// app/admin/corporates/[id]/DashboardStats.tsx
import { Users, CheckCircle, Clock, FileText } from 'lucide-react';

export default function CorpStatsGrid({ stats }: any) {
  return (
    <div className="admin-stat-grid mb-8">
      {[
        { label: 'Total Employees', val: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
        { label: 'Services Availed', val: stats.totalAvailed, icon: CheckCircle, color: 'bg-emerald-500' },
        { label: 'Pending Bookings', val: stats.totalPending, icon: Clock, color: 'bg-amber-500' },
        { label: 'Pre-Employment', val: stats.preEmploymentCount, icon: FileText, color: 'bg-purple-500' },
      ].map((stat, i) => (
        <div key={i} className="admin-stat-card">
          <div className={`admin-stat-icon-container ${stat.color}`}>
            <stat.icon size={20} />
          </div>
          <div>
            <h3 className="admin-stat-value">{stat.val}</h3>
            <p className="admin-stat-label">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}