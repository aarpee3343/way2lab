// app/admin/tests/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/safe-toast';
import { Save, ArrowLeft, Trash2, FlaskConical, Clock, FileText, Banknote } from 'lucide-react';
import Link from 'next/link';
import { updateTestAction, getTestById, deleteTestAction } from '@/app/actions/adminInventoryActions';
import {
  Section,
  InputField,
  TextareaField,
  SelectField,
  CheckboxField,
  TEST_CATEGORIES,
  TEST_SPECIALTIES
} from '@/components/admin/tests/TestFormFields';

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const testId = Number(id);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!testId) return;

    getTestById(testId).then(data => {
      if (!data) {
        toast.error('Test not found');
        router.push('/admin/tests');
      } else {
        setForm(data);
        setLoading(false);
      }
    });
  }, [testId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const payload = {
      ...form,
      price: Number(form.price || 0),
      discount: Number(form.discount || 0)
    };

    const res = await updateTestAction(form.id, payload);

    if (res.success) {
      toast.success('Test Updated Successfully');
      router.refresh();
    } else {
      toast.error('Failed to update test');
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will remove the test from all labs.')) return;

    const res = await deleteTestAction(testId);
    if (res.success) {
      toast.success('Test Deleted');
      router.push('/admin/tests');
    }
  };

  if (loading || !form) return <div className="admin-loading">Loading Test...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="admin-page-title">Edit Diagnostic Test</h1>
          <p className="admin-page-subtitle">Update global test details</p>
        </div>
        <Link href="/admin/tests" className="admin-btn-secondary">
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-space-y">
        <Section title="Core Identity" icon={<FlaskConical size={18} />}>
          <div className="admin-form-grid">
            <InputField
              label="Test Name *"
              value={form.testName || ''}
              onChange={(e) => updateField('testName', e.target.value)}
            />
            <InputField
              label="Slug"
              value={form.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
            />
            <SelectField
              label="Category *"
              options={TEST_CATEGORIES}
              value={form.category || ''}
              onChange={(e) => updateField('category', e.target.value)}
            />
            <SelectField
              label="Specialty *"
              options={TEST_SPECIALTIES}
              value={form.specialty || ''}
              onChange={(e) => updateField('specialty', e.target.value)}
            />
            <div className="col-span-2">
              <TextareaField
                label="Short Description *"
                value={form.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
          </div>
        </Section>

        <Section title="Clinical Details" icon={<FileText size={18} />}>
          <div className="admin-form-grid">
            <div className="col-span-2">
              <TextareaField
                label="Preparation Instructions"
                value={form.preparation || ''}
                onChange={(e) => updateField('preparation', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <TextareaField
                label="Technician Notes"
                value={form.specialInstruction || ''}
                onChange={(e) => updateField('specialInstruction', e.target.value)}
              />
            </div>
          </div>
        </Section>

        <Section title="Pricing & Config" icon={<Banknote size={18} />}>
          <div className="admin-form-grid">
            <InputField
              label="Base Price (₹)"
              type="number"
              value={form.price ?? 0}
              onChange={(e) => updateField('price', Number(e.target.value || 0))}
            />
            <InputField
              label="Discount (%)"
              type="number"
              value={form.discount ?? 0}
              onChange={(e) => updateField('discount', Number(e.target.value || 0))}
            />
            <InputField
              label="Report Time"
              icon={<Clock size={16} />}
              value={form.scheduleReporting || ''}
              onChange={(e) => updateField('scheduleReporting', e.target.value)}
            />
            <div className="col-span-2 flex gap-6 mt-4">
              <CheckboxField
                label="Active Test"
                checked={Boolean(form.isActive)}
                onChange={(e) => updateField('isActive', e.target.checked)}
              />
              <CheckboxField
                label="Featured"
                checked={Boolean(form.showOnHomepage)}
                onChange={(e) => updateField('showOnHomepage', e.target.checked)}
              />
            </div>
          </div>
        </Section>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="admin-btn-danger"
          >
            <Trash2 size={18} /> Delete Test
          </button>

          <button
            type="submit"
            className="admin-btn-primary"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
