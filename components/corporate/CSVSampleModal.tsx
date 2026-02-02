'use client';
import { useState } from 'react';
import { Download, X, Check } from 'lucide-react';
import { generateSampleCSV } from '@/app/actions/corporateExportActions';

export default function CSVSampleModal({ corporateId, onClose }: any) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  const options = [
    { id: 'employeeId', label: 'Employee ID' },
    { id: 'department', label: 'Department' },
    { id: 'location', label: 'Location' },
    { id: 'uhid', label: 'Existing UHID' },
  ];

  const handleDownload = async () => {
    const csvData = await generateSampleCSV(selectedFields, corporateId);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WayToLab_Sample_Upload.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-800">Customize Sample File</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500 font-medium">Which additional details will you provide for your employees?</p>
          
          <div className="grid grid-cols-1 gap-2">
            {options.map(opt => (
              <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedFields.includes(opt.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selectedFields.includes(opt.id)}
                  onChange={() => {
                    setSelectedFields(prev => prev.includes(opt.id) ? prev.filter(f => f !== opt.id) : [...prev, opt.id])
                  }}
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedFields.includes(opt.id) ? 'bg-blue-600' : 'border-2 border-slate-200'}`}>
                  {selectedFields.includes(opt.id) && <Check size={14} className="text-white" strokeWidth={4} />}
                </div>
              </label>
            ))}
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Mandatory Fields Included:</p>
            <p className="text-xs text-amber-600 font-bold">Name, Email/Phone, DOB, Gender, CorporateID</p>
          </div>

          <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black flex items-center justify-center gap-2 shadow-xl transition-all">
            <Download size={20} /> Download CSV Template
          </button>
        </div>
      </div>
    </div>
  );
}