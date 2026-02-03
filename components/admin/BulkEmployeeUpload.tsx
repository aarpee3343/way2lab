'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { uploadCorporateEmployees } from '@/app/actions/adminCorporateActions';
import { Upload, FileText, Loader2, CheckCircle2, Download } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

// 1. Define Fields Configuration
const AVAILABLE_FIELDS = [
  { key: 'name', label: 'Full Name', required: true, sample: 'John Doe' },
  { key: 'email', label: 'Email', required: true, sample: 'john.doe@company.com' },
  { key: 'phone', label: 'Phone', required: true, sample: '9876543210' },
  { key: 'employeeId', label: 'Employee ID', required: true, sample: 'EMP-001' },
  { key: 'department', label: 'Department', required: false, sample: 'Engineering' },
  { key: 'location', label: 'Location', required: false, sample: 'Mumbai' },
  { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', required: false, sample: '1990-12-31' },
  { key: 'gender', label: 'Gender', required: false, sample: 'Male' },
];

export default function BulkEmployeeUpload({ corporateId, onSuccess }: { corporateId: number, onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ success: number; fail: number } | null>(null);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(AVAILABLE_FIELDS.map(f => f.key));

  // --- 2. UPDATED DOWNLOAD FUNCTION ---
  const handleDownloadTemplate = () => {
    // Filter fields based on user selection
    const activeFields = AVAILABLE_FIELDS.filter(f => selectedFields.includes(f.key));
    
    // Create Headers Object (Key -> Label)
    // Actually, usually CSVs just need the Keys as headers, but let's stick to keys for mapping
    const headers = activeFields.map(f => f.key);

    // Create Sample Row Object
    const sampleRow: any = {};
    activeFields.forEach(f => {
        sampleRow[f.key] = f.sample;
    });

    // Generate CSV with PapaParse
    const csv = Papa.unparse({
        fields: headers,
        data: [sampleRow] // Add the sample row
    });
    
    // Trigger Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTemplateOptions(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStats(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const cleanData = results.data.map((row: any) => {
          // Normalize keys (case insensitive matching)
          const normalized: any = {};
          Object.keys(row).forEach(k => {
            const key = k.toLowerCase().trim();
            // Map common variations to our schema
            if(key.includes('name')) normalized.name = row[k];
            else if(key.includes('email')) normalized.email = row[k];
            else if(key.includes('phone') || key.includes('contact')) normalized.phone = row[k];
            else if(key.includes('id') && key.includes('emp')) normalized.employeeId = row[k];
            else if(key.includes('dept')) normalized.department = row[k];
            else if(key.includes('loc')) normalized.location = row[k];
            else if(key.includes('dob') || key.includes('birth')) normalized.dob = row[k];
            else if(key.includes('gender') || key.includes('sex')) normalized.gender = row[k];
          });
          return normalized;
        }).filter((row: any) => (row.email || row.phone));

        if (cleanData.length === 0) {
          toast.error("No valid data found. Please use the template.");
          setUploading(false);
          return;
        }
        
        const res = await uploadCorporateEmployees(corporateId, cleanData);
        setUploading(false);
        
        if (res.success) {
          setStats({ success: res.stats.created + res.stats.mapped, fail: 0 });
          toast.success(`Processed: ${res.stats.created} Created, ${res.stats.mapped} Mapped`);
          onSuccess();
        } else {
          toast.error(res.error || "Upload failed");
        }
      },
      error: (error) => {
        toast.error(`CSV Error: ${error.message}`);
        setUploading(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Template Download Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
            <div>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={16}/> CSV Template
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                    Download sample file with correct formats.
                </p>
            </div>
            <button 
                onClick={() => setShowTemplateOptions(!showTemplateOptions)}
                className="text-xs text-blue-600 font-bold hover:underline"
            >
                {showTemplateOptions ? 'Close Options' : 'Customize'}
            </button>
        </div>

        {showTemplateOptions && (
            <div className="mt-3 grid grid-cols-2 gap-2 mb-3 bg-white p-3 rounded border border-slate-100">
                {AVAILABLE_FIELDS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={selectedFields.includes(field.key)}
                            disabled={field.required}
                            onChange={(e) => {
                                if(e.target.checked) setSelectedFields([...selectedFields, field.key]);
                                else setSelectedFields(selectedFields.filter(f => f !== field.key));
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-500">*</span>}
                    </label>
                ))}
            </div>
        )}

        <button 
            onClick={handleDownloadTemplate}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
        >
            <Download size={14} /> Download Sample CSV
        </button>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
        {!stats ? (
          <>
            <input type="file" accept=".csv" id="csvUpload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center gap-3">
              {uploading ? (
                <Loader2 className="animate-spin text-blue-600" size={40} />
              ) : (
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Upload size={28} />
                </div>
              )}
              <div>
                <span className="font-bold text-slate-800 text-lg block">
                  {uploading ? "Processing..." : "Upload Filled CSV"}
                </span>
                <span className="text-sm text-slate-500 mt-1 block">
                  Drag & drop or click to browse
                </span>
              </div>
            </label>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Upload Complete</h3>
              <p className="text-sm text-slate-600">
                Processed: <span className="font-bold text-emerald-600">{stats.success}</span>
              </p>
              <button onClick={() => setStats(null)} className="mt-4 text-xs font-bold text-blue-600 underline">
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}