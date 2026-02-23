// app/admin/orders/_components/UploadReportForm.tsx
'use client';

import { useActionState, useState, type FormEvent } from 'react';
import { uploadReportAction } from '@/app/actions/adminOrderManagement';
import { useFormStatus } from 'react-dom';

type UploadState = { success: boolean; error?: string };
const initialState: UploadState = { success: false };

type OrderItemOption = {
  id: number;
  itemName: string | null;
  itemType: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} className="admin-btn-primary w-full">
      {pending ? 'Uploading...' : 'Upload Report'}
    </button>
  );
}

export default function UploadReportForm({
  orderId,
  orderItems
}: {
  orderId: number;
  orderItems: OrderItemOption[];
}) {
  const [state, formAction] = useActionState<UploadState, FormData>(
    uploadReportAction,
    initialState
  );
  const [reportType, setReportType] = useState<'PARTIAL' | 'COMPLETED' | ''>('');
  const [showTypePrompt, setShowTypePrompt] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const formElement = event.currentTarget;

    if (!reportType) {
      event.preventDefault();
      setShowTypePrompt(true);
      setLocalError('Choose upload type: Partial or Completed.');
      return;
    }

    if (reportType === 'PARTIAL') {
      const selectedItems = new FormData(formElement).getAll('partialOrderItemIds');
      if (!selectedItems.length) {
        event.preventDefault();
        setLocalError('Select at least one test/package for partial upload.');
        return;
      }
    }

    if (reportType === 'COMPLETED') {
      const shouldProceed = window.confirm(
        'Are you sure you want to upload a completed report? This will remove all partial reports for this order.'
      );
      if (!shouldProceed) {
        event.preventDefault();
        return;
      }
    }

    setLocalError(null);
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="admin-space-y">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="type" value={reportType} />

      <div>
        <label className="admin-form-label">Upload PDF Report</label>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="admin-form-input"
        />
      </div>

      {(showTypePrompt || reportType) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-xs font-semibold text-slate-700">Choose upload type</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReportType('PARTIAL');
                setLocalError(null);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                reportType === 'PARTIAL'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              Partial Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setReportType('COMPLETED');
                setLocalError(null);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                reportType === 'COMPLETED'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              Completed Upload
            </button>
          </div>
        </div>
      )}

      {reportType === 'PARTIAL' && (
        <div>
          <label className="admin-form-label">Select Tests/Packages for Partial Upload</label>
          <select
            name="partialOrderItemIds"
            multiple
            className="admin-form-select min-h-36"
            size={Math.min(Math.max(orderItems.length, 4), 8)}
          >
            {orderItems.map(item => (
              <option key={item.id} value={item.id}>
                {(item.itemName || 'Unnamed Item').trim()} ({item.itemType})
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-slate-500">Hold Ctrl/Cmd to select multiple items.</p>
        </div>
      )}

      {reportType === 'COMPLETED' && (
        <p className="text-xs rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
          Warning: Completed upload removes all partial uploads and keeps only one completed report.
        </p>
      )}

      <SubmitButton />

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state?.success && <p className="text-sm text-green-600">Report uploaded successfully</p>}
    </form>
  );
}
