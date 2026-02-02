'use client';

import { useState } from 'react';
import { 
  Users, UserPlus, FileUp, Download, Search, 
  MoreHorizontal, ShieldAlert, CheckCircle2, XCircle, Filter
} from 'lucide-react';
import CSVSampleModal from '@/components/corporate/CSVSampleModal';
import { toast } from '@/lib/safe-toast';

export default function EmployeeManagementPage() {
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dummy data for UI - Replace with your actual Fetch logic
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Vikram Mehta', email: 'v.mehta@acme.com', phone: '9876543210', empId: 'AC-102', dept: 'Operations', status: 'ACTIVE' },
    { id: 2, name: 'Sanya Iyer', email: 's.iyer@acme.com', phone: '9822113344', empId: 'AC-105', dept: 'HR', status: 'INACTIVE' },
    { id: 3, name: 'Amit Kumar', email: 'a.kumar@acme.com', phone: '9112233445', empId: 'AC-109', dept: 'IT', status: 'ACTIVE' },
  ]);

  const toggleStatus = (id: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        toast.info(`Employee ${emp.name} is now ${newStatus}`);
        return { ...emp, status: newStatus };
      }
      return emp;
    }));
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {showSampleModal && <CSVSampleModal corporateId={1} onClose={() => setShowSampleModal(false)} />}

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
            onClick={() => setShowSampleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            <Download size={16} /> Sample Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
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
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 font-bold text-slate-600 hover:bg-slate-50 transition-all">
          <Filter size={18} /> Advanced Filters
        </button>
      </div>

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
              {employees.map((emp) => (
                <tr key={emp.id} className={`group transition-all ${emp.status === 'INACTIVE' ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${emp.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className={`font-black tracking-tight ${emp.status === 'ACTIVE' ? 'text-slate-800' : 'text-slate-400'}`}>{emp.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase">{emp.email} • {emp.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-bold text-slate-600">{emp.dept}</td>
                  <td className="px-4 py-5 font-mono text-xs text-slate-500">{emp.empId}</td>
                  <td className="px-4 py-5 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {emp.status === 'ACTIVE' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {emp.status}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(emp.id)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${
                          emp.status === 'ACTIVE' ? 'border-rose-100 text-rose-500 hover:bg-rose-50' : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
                        }`}
                      >
                        {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing 3 of {employees.length} Employees</p>
          <div className="flex gap-2">
             <button className="px-4 py-1 text-xs font-bold text-slate-400 cursor-not-allowed">Prev</button>
             <button className="px-4 py-1 text-xs font-bold text-blue-600">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}