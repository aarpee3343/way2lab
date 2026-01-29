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
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {/* REQUIRED — this was missing */}
      <div>
        <label className="block text-xs font-bold mb-1">Report Type</label>
        <select name="type" required className="w-full border p-2 rounded">
          <option value="PARTIAL">Partial</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
      />

      <button
        disabled={pending}
        className="w-full bg-emerald-600 text-white py-2 rounded-lg disabled:opacity-50"
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
