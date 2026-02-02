'use client';
import { useState } from 'react';
import { Building2, Upload, Save, User } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function CorpSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Profile</h1>
      
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
        {/* Logo Upload Section */}
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
            <Upload size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Upload</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Corporate Brand Logo</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">This logo will appear alongside WayToLab on your employee portal and dashboard.</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Company Name</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold" defaultValue="Acme Industries" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Primary Contact Person</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold" defaultValue="HR Manager" />
          </div>
        </div>

        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200">
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
}