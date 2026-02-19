'use client';

import { useActionState, useEffect, useState } from 'react';
import { deleteReportAction } from '@/app/actions/adminOrderManagement';
import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';

type DeleteState = { success: boolean; error?: string };
const initialState: DeleteState = { success: false };

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={14} />
      {pending ? 'Deleting...' : 'Delete Permanently'}
    </button>
  );
}

export default function DeleteReportButton({
  orderId,
  reportId
}: {
  orderId: number;
  reportId: number;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [remark, setRemark] = useState('');
  const [state, formAction] = useActionState<DeleteState, FormData>(
    deleteReportAction,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      setStage(0);
      setRemark('');
    }
  }, [state?.success]);

  if (stage === 0) {
    return (
      <button
        type="button"
        onClick={() => setStage(1)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
      >
        <Trash2 size={14} />
        Delete Report
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full rounded-xl border border-rose-200 bg-rose-50 p-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="reportId" value={reportId} />

      {stage === 1 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-rose-800">
            Confirmation 1: Enter mandatory remark for deleting this report.
          </p>
          <textarea
            name="remark"
            value={remark}
            onChange={e => setRemark(e.target.value)}
            rows={2}
            minLength={3}
            required
            placeholder="Why is this upload wrong?"
            className="admin-form-input resize-none bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStage(0)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStage(2)}
              disabled={remark.trim().length < 3}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-rose-800">
            Confirmation 2: Are you sure you want to permanently delete this report?
          </p>
          <p className="text-xs text-rose-700">
            Remark: <span className="font-semibold">{remark.trim()}</span>
          </p>
          <input type="hidden" name="remark" value={remark} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStage(1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back
            </button>
            <ConfirmDeleteButton />
          </div>
        </div>
      )}

      {state?.error && (
        <p className="mt-2 text-xs font-semibold text-rose-700">{state.error}</p>
      )}
    </form>
  );
}
