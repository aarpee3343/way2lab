import Link from 'next/link';
import prisma from '@/lib/prisma';
import { deleteLabAction } from '@/app/actions/adminLabActions';
import { Edit, Plus, Building2, MapPin } from 'lucide-react';
import DeleteRowButton from '@/components/admin/DeleteRowButton';

// Simple getter for labs (can be moved to actions file if preferred)
async function getLabs() {
  return await prisma.lab.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { tests: true } } }
  });
}

export default async function LabsPage() {
  const labs = await getLabs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Partners</h1>
          <p className="text-slate-500">Manage diagnostic centers and service areas</p>
        </div>
        <Link href="/admin/labs/add" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
          <Plus size={18} /> Add Lab
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Lab Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Tests Assigned</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {labs.map((lab) => (
              <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      <Building2 size={18} />
                    </div>
                    <span className="font-bold text-slate-800">{lab.labName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{lab.city}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {lab.pincode}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {lab.contactNo}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                    {lab._count.tests} Tests
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    lab.activeStatus 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {lab.activeStatus ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/labs/${lab.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit size={18} />
                    </Link>
                    
                    {/* Use Client Component for Delete to avoid Runtime Error */}
                    <DeleteRowButton id={lab.id} deleteAction={deleteLabAction} />
                  </div>
                </td>
              </tr>
            ))}
            
            {labs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No labs found. Add your first lab partner.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}