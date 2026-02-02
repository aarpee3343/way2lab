// app/admin/tests/add/page.tsx
'use client';

import { useState, useRef } from 'react';
import { createTestAction, bulkCreateTestsAction } from '@/app/actions/adminInventoryActions';
import {
  Save,
  ArrowLeft,
  Loader2,
  FlaskConical,
  Clock,
  FileText,
  Banknote,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/safe-toast';
import { useRouter } from 'next/navigation';

export default function AddTestPage() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ---------------- MANUAL CREATE ----------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTestAction(formData);

    setLoading(false);

    if (result?.success) {
      toast.success('Test Created Successfully!');
      router.push('/admin/tests');
    } else {
      toast.error(result?.error || 'Failed to create test');
    }
  };

  // ---------------- BULK UPLOAD ----------------
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = values[i] || ''));
      return obj;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        const result = await bulkCreateTestsAction(parsed);

        if (result.success) {
          toast.success(`${result.count} Tests Imported Successfully!`);
          router.push('/admin/tests');
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Invalid CSV format');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="admin-page-title">Add Diagnostic Test</h1>
          <p className="admin-page-subtitle">Manual or bulk CSV upload</p>
        </div>

        <div className="admin-space-x">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleUploadClick}
            disabled={loading}
            className="admin-btn-primary bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Bulk Upload
          </button>

          <Link href="/admin/tests" className="admin-btn-secondary">
            <ArrowLeft size={18} /> Cancel
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-space-y">
        <Section title="Core Identity" icon={<FlaskConical size={18} />}>
          <div className="admin-form-grid">
            <InputField name="test_name" label="Test Name *" required />
            <InputField name="slug" label="Slug" />
            <SelectField name="category" label="Category *" options={['Pathology', 'Radiology', 'Cardiology']} />
            <SelectField name="specialty" label="Specialty *" options={['General', 'Heart', 'Diabetes']} />
            <div className="col-span-2">
              <TextareaField name="description" label="Short Description *" />
            </div>
          </div>
        </Section>

        <Section title="Clinical Details" icon={<FileText size={18} />}>
          <div className="admin-form-grid">
            <div className="col-span-2">
              <TextareaField name="preparation" label="Preparation Instructions" />
            </div>
            <div className="col-span-2">
              <TextareaField name="special_instruction" label="Technician Notes" />
            </div>
          </div>
        </Section>

        <Section title="Pricing & Config" icon={<Banknote size={18} />}>
          <div className="admin-form-grid">
            <InputField name="price" label="Base Price (₹)" type="number" required />
            <InputField name="discount" label="Discount (%)" type="number" />
            <InputField name="schedule_reporting" label="Report Time" icon={<Clock size={16} />} />
            <div className="col-span-2 flex gap-6 mt-4">
              <CheckboxField name="is_active" label="Active Test" defaultChecked />
              <CheckboxField name="show_on_homepage" label="Featured" />
            </div>
          </div>
        </Section>

        <button
          disabled={loading}
          className="admin-btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save & Publish
        </button>
      </form>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

function Section({ title, icon, children }: any) {
  return (
    <div className="admin-form-section">
      <h3 className="admin-form-title">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, icon, ...props }: any) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3">{icon}</span>}
        <input {...props} className="admin-form-input" />
      </div>
    </div>
  );
}

function TextareaField({ label, ...props }: any) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <textarea {...props} className="admin-form-textarea" />
    </div>
  );
}

function SelectField({ label, options, ...props }: any) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <select {...props} className="admin-form-select">
        <option value="">Select</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, ...props }: any) {
  return (
    <label className="admin-form-checkbox">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}