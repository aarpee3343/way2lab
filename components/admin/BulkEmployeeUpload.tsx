'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { bulkUploadEmployeesAction } from '@/app/actions/adminCorporateActions';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkEmployeeUpload({ corporateId, onSuccess }: { corporateId: number, onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ success: number; fail: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStats(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Expected Headers: Name, Email, Phone, EmployeeID, Department, Location
        const cleanData = results.data.map((row: any) => ({
          name: row.Name || row.name,
          email: row.Email || row.email,
          phone: row.Phone || row.phone,
          employeeId: row.EmployeeID || row.employee_id,
          department: row.Department || row.department,
          location: row.Location || row.location,
        })).filter((row: any) => row.email && row.phone); // Basic Validation

        if (cleanData.length === 0) {
          toast.error("No valid rows found. Check CSV headers.");
          setUploading(false);
          return;
        }
        
        const res = await bulkUploadEmployeesAction(corporateId, cleanData);
        setUploading(false);
        
        if (res.success) {
          setStats({ success: res.stats.successCount, fail: res.stats.failCount });
          toast.success(`Processed ${res.stats.successCount} employees`);
          onSuccess(); // Refresh parent data
        } else {
          toast.error("Upload failed");
        }
      },
      error: (error) => {
        toast.error(`CSV Parse Error: ${error.message}`);
        setUploading(false);
      }
    });
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
      {!stats ? (
        <>
          <input 
            type="file" 
            accept=".csv" 
            id="csvUpload" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={uploading}
          />
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
                {uploading ? "Processing CSV..." : "Click to Upload Employee CSV"}
              </span>
              <span className="text-sm text-slate-500 mt-1 block">
                Headers: Name, Email, Phone, EmployeeID, Department, Location
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
              Success: <span className="font-bold text-emerald-600">{stats.success}</span> • 
              Failed: <span className="font-bold text-red-600">{stats.fail}</span>
            </p>
            <button 
              onClick={() => setStats(null)} 
              className="mt-4 text-xs font-bold text-blue-600 underline"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}