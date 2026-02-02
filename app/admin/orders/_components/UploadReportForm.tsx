// app/admin/orders/_components/UploadReportForm.tsx
'use client';

import { useActionState } from 'react';
import { uploadReportAction } from '@/app/actions/adminOrderManagement';
import { useFormStatus } from 'react-dom';

const initialState = { success: false, error: null };

export default function UploadReportForm({ orderId }: { orderId: number }) {
  const [state, formAction] = useActionState(
    uploadReportAction,
    initialState
  );

  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="admin-space-y">
      <input type="hidden" name="orderId" value={orderId} />

      {/* REQUIRED — this was missing */}
      <div>
        <label className="admin-form-label">Report Type</label>
        <select name="type" required className="admin-form-select">
          <option value="PARTIAL">Partial</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="admin-form-input"
      />

      <button
        disabled={pending}
        className="admin-btn-primary w-full"
      >
        {pending ? 'Uploading…' : 'Upload Report'}
      </button>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-green-600">Report uploaded successfully</p>
      )}
    </form>
  );
}