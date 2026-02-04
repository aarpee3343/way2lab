// app/admin/packages/page.tsx
import Link from 'next/link';
import { getPackages, getPackageStats, deletePackageAction } from '@/app/actions/adminPackageActions';
import { Plus, Package, Activity, Search, Edit } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export const dynamic = 'force-dynamic';

export default async function PackagesPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const packages = await getPackages(query);
  const stats = await getPackageStats();

  return (
    <div className="admin-space-y">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="admin-page-title">Health Packages</h1>
          <p className="admin-page-subtitle">Manage checkup bundles and pricing</p>
        </div>
        <Link href="/admin/packages/add" className="admin-btn-primary">
          <Plus size={20} /> Add Package
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="admin-stat-grid">
        <StatCard 
          label="Total Packages" 
          value={stats.total} 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="Active" 
          value={stats.active} 
          icon={Activity} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label="Inactive" 
          value={stats.inactive} 
          icon={Package} 
          color="bg-slate-500" 
        />
      </div>

      {/* Data Table */}
      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <form className="admin-search-container" method="get">
            <Search className="admin-search-icon" size={18}/>
            <input
              name="q"
              defaultValue={query}
              className="admin-search-input"
              placeholder="Search packages..."
            />
          </form>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Package Name</th>
              <th>Included Tests</th>
              <th>Price</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => {
              const price = Number(pkg.price);
              const discount = Number(pkg.discount || 0);
              const finalPrice = discount > 0 ? price - (price * discount / 100) : price;

              return (
                <tr key={pkg.id} className="group">
                  <td>
                    <div className="admin-table-row-primary">{pkg.packageName}</div>
                    <div className="admin-table-row-secondary">{pkg.description || 'No description'}</div>
                  </td>
                  <td>
                    <span className="admin-badge-info">
                      {pkg._count.tests} Tests
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-row-primary">₹{Math.round(finalPrice)}</div>
                    {discount > 0 && (
                      <div className="admin-badge-success text-xs px-1.5 w-fit mt-1">
                        {discount}% OFF <span className="line-through text-slate-400 font-normal ml-1">₹{price}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={`admin-status-indicator ${pkg.isActive ? 'admin-badge-success' : 'admin-badge-default'}`}>
                      <div className={`admin-status-dot ${pkg.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/packages/edit/${pkg.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </Link>
                      <DeleteRowButton id={pkg.id} deleteAction={deletePackageAction} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {packages.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  {query ? `No packages found for "${query}".` : 'No packages found. Create one to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="admin-stat-card">
            <div className={`admin-stat-icon-container ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="admin-stat-label">{label}</p>
                <h3 className="admin-stat-value">{value}</h3>
            </div>
        </div>
    );
}
