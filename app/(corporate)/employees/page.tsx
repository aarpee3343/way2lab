'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileUp,
  Download,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import CSVSampleModal from '@/components/corporate/CSVSampleModal';
import { toast } from '@/lib/safe-toast';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { getCorpSession } from '@/app/actions/corporateAuthActions';
import {
  getCorporateEmployees,
  setCorporateEmployeeStatus,
  uploadEmployeesForCorp
} from '@/app/actions/corporatePortalActions';

const PAGE_SIZE = 10;

export default function EmployeeManagementPage() {
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [corporateId, setCorporateId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [maskContact, setMaskContact] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deptFilter, setDeptFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadSession = async () => {
      const session = await getCorpSession();
      setCorporateId(session?.corporateId ?? null);
      setMaskContact(Boolean(session?.maskContactInfo));
    };
    loadSession();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getCorporateEmployees({
        search: searchTerm,
        status: statusFilter,
        department: deptFilter || undefined,
        location: locationFilter || undefined
      });
      setEmployees(res.employees || []);
      setCanEdit(Boolean(res.canEdit));
      setMaskContact(Boolean(res.maskContactInfo));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, deptFilter, locationFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, deptFilter, locationFilter]);

  const departments = useMemo(
    () => Array.from(new Set(employees.map(e => e.department).filter(Boolean))),
    [employees]
  );
  const locations = useMemo(
    () => Array.from(new Set(employees.map(e => e.location).filter(Boolean))),
    [employees]
  );

  const maskValue = (value?: string | null) => {
    if (!value) return '-';
    if (!maskContact) return value;
    if (value.includes('@')) {
      const [u, d] = value.split('@');
      return `${u.slice(0, 2)}***@${d}`;
    }
    return `${value.slice(0, 2)}******${value.slice(-2)}`;
  };

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedEmployees = employees.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = employees.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, employees.length);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const toggleStatus = async (id: number, current: boolean) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit employees');
      return;
    }
    const res = await setCorporateEmployeeStatus(id, !current);
    if (res.success) {
      toast.success(`Employee ${current ? 'deactivated' : 'activated'}`);
      setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, isActive: !current } : emp));
    } else {
      toast.error(res.error || 'Update failed');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {showSampleModal && corporateId !== null && (
        <CSVSampleModal
          corporateId={corporateId}
          onClose={() => setShowSampleModal(false)}
        />
      )}
      {showUploadModal && corporateId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Bulk Upload Employees</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <BulkEmployeeUpload
              corporateId={corporateId}
              onSuccess={() => {
                setShowUploadModal(false);
              }}
              uploadAction={uploadEmployeesForCorp}
            />
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" /> Employee Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage organization access and service eligibility</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (!corporateId) {
                toast.error('Unable to load corporate context. Please re-login.');
                return;
              }
              setShowSampleModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            <Download size={16} /> Sample Data
          </button>
          <button
            onClick={() => {
              if (!canEdit) {
                toast.error('You do not have permission to upload employees');
                return;
              }
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <FileUp size={16} /> Bulk Upload CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search by name, email, or employee ID..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <Filter size={18} /> Advanced Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Employee Info</th>
                <th className="px-4 py-5">Department</th>
                <th className="px-4 py-5">Employee ID</th>
                <th className="px-4 py-5 text-center">Benefit Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={5} className="px-8 py-6 text-slate-500">Loading employees...</td></tr>
              )}
              {!loading && employees.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-6 text-slate-500">No employees found.</td></tr>
              )}
              {pagedEmployees.map((emp) => (
                <tr key={emp.id} className={`group transition-all ${!emp.isActive ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${emp.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {(emp.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className={`font-black tracking-tight ${emp.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{emp.name || 'Unnamed'}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase">
                          {maskValue(emp.email)} - {maskValue(emp.phone)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-bold text-slate-600">{emp.department || '-'}</td>
                  <td className="px-4 py-5 font-mono text-xs text-slate-500">{emp.employeeId || '-'}</td>
                  <td className="px-4 py-5 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      emp.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {emp.isActive ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(emp.id, emp.isActive)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${
                          emp.isActive ? 'border-rose-100 text-rose-500 hover:bg-rose-50' : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
                        }`}
                      >
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {showingFrom}-{showingTo} of {employees.length} Employees
          </p>
          <div className="flex gap-2">
             <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={!canPrev}
               className={`px-4 py-1 text-xs font-bold ${canPrev ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 cursor-not-allowed'}`}
             >
               Prev
             </button>
             <span className="px-2 py-1 text-xs font-bold text-slate-400">
               Page {currentPage} of {totalPages}
             </span>
             <button
               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
               disabled={!canNext}
               className={`px-4 py-1 text-xs font-bold ${canNext ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 cursor-not-allowed'}`}
             >
               Next
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

