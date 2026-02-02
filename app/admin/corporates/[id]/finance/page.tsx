'use client';
import { CreditCard, TrendingDown, Clock, Download, Plus } from 'lucide-react';

export default function CorporateFinanceAdmin() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl text-white">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Outstanding Dues</p>
          <h2 className="text-3xl font-black">₹4,85,200</h2>
          <div className="mt-4 flex items-center gap-2 text-rose-400 text-xs font-bold">
            <TrendingDown size={14}/> 15% Increase from last month
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Wallet Credit Limit</p>
          <h2 className="text-3xl font-black text-slate-900">₹10,00,000</h2>
          <button className="mt-4 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Update Limit</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-sm uppercase">Financial Ledger / Invoices</h3>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
            <Plus size={14}/> Record Payment
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
            <tr>
              <th className="px-6 py-4">Transaction Date</th>
              <th className="px-6 py-4">Service Description</th>
              <th className="px-6 py-4">Utilization</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-6 py-4 font-bold">Jan 2026 Billing</td>
              <td className="px-6 py-4 text-slate-500 text-xs">Annual Health Checkup Batch #1</td>
              <td className="px-6 py-4 font-bold">142 Employees</td>
              <td className="px-6 py-4 font-black text-slate-900">₹2,13,000</td>
              <td className="px-6 py-4 text-right">
                <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Download size={18}/></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}