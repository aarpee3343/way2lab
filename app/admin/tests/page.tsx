// app/admin/tests/page.tsx
import Link from 'next/link';
import { getTestStats, getTests, deleteTestAction } from '@/app/actions/adminInventoryActions';
import { Plus, Search, FlaskConical, CheckCircle2, Tags, Stethoscope, Edit, Activity, ArrowUpRight } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

export default async function TestsPage() {
  const stats = await getTestStats();
  const tests = await getTests();

  return (
    <div className="admin-space-y">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="admin-page-title">Test Inventory</h1>
          <p className="admin-page-subtitle">Manage global catalog of diagnostic tests</p>
        </div>
        <Link href="/admin/tests/add" className="admin-btn-primary">
          <Plus size={20} /> Add New Test
        </Link>
      </div>

      {/* Modern Stats Grid */}
      <div className="admin-stat-grid">
        {[
          { label: 'Total Tests', val: stats.total, icon: FlaskConical, color: 'bg-blue-500' },
          { label: 'Active', val: stats.active, icon: Activity, color: 'bg-emerald-500' },
          { label: 'Categories', val: stats.categories, icon: Tags, color: 'bg-purple-500' },
          { label: 'Specialties', val: stats.specialties, icon: Stethoscope, color: 'bg-amber-500' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="flex justify-between items-start mb-4">
              <div className={`admin-stat-icon-container ${s.color}`}>
                <s.icon size={24} />
              </div>
              <span className="admin-badge-default flex items-center text-xs">
                <ArrowUpRight size={12} className="mr-1"/> +2.5%
              </span>
            </div>
            <h3 className="admin-stat-value">{s.val}</h3>
            <p className="admin-stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="admin-table-container">
        {/* Toolbar */}
        <div className="admin-table-toolbar">
          <div className="admin-search-container">
            <Search className="admin-search-icon" size={18} />
            <input 
              placeholder="Search tests by name, category..." 
              className="admin-search-input" 
            />
          </div>
          <div className="admin-space-x">
            <button className="admin-btn-secondary">Filters</button>
            <button className="admin-btn-secondary">Export</button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto admin-scrollbar">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="group">
                  <td>
                    <div className="admin-table-row-primary">{t.testName}</div>
                    <div className="admin-table-row-secondary">{t.slug || '-'}</div>
                  </td>
                  <td>
                    <span className="admin-badge-default">
                      {t.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="admin-table-row-primary">₹{Number(t.price).toFixed(2)}</span>
                      {Number(t.discount) > 0 && (
                        <span className="admin-badge-success text-[10px] px-1.5 w-fit">
                          {Number(t.discount)}% OFF
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`admin-status-indicator ${t.isActive ? 'admin-badge-success' : 'admin-badge-default'}`}>
                      <div className={`admin-status-dot ${t.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {t.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="text-right">
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