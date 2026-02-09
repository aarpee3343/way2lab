import { formatISTDateTime } from '@/lib/date-time';

type OnsiteActivity = {
  campId?: number;
  title?: string | null;
  labName?: string | null;
  startedAt?: string | null;
  expectedHeadcount?: number | null;
  reached?: number;
  remaining?: number | null;
  progress?: number | null;
};

export default function OnsiteActivityCard({ activity }: { activity?: OnsiteActivity | null }) {
  const expected = activity?.expectedHeadcount ?? null;
  const reached = activity?.reached ?? 0;
  const remaining = activity?.remaining ?? null;
  const progress =
    activity?.progress ??
    (expected && expected > 0
      ? Math.min(100, Math.round((reached / expected) * 100))
      : null);

  const ringStyle = progress !== null
    ? { background: `conic-gradient(#22c55e ${progress}%, #e2e8f0 0)` }
    : { background: '#e2e8f0' };

  const startedLabel = activity?.startedAt
    ? formatISTDateTime(activity.startedAt)
    : null;

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-100/60 rounded-full blur-2xl" />
      <div className="flex items-center justify-between gap-6 relative">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Onsite Activity</p>
          <h3 className="text-lg font-black text-slate-900 mt-2">
            {activity?.title || 'No active camp'}
          </h3>
          {startedLabel && (
            <p className="text-xs text-slate-500 mt-1">Started {startedLabel}</p>
          )}
          {activity?.labName && (
            <p className="text-xs text-slate-500 mt-1">Lab {activity.labName}</p>
          )}
        </div>
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full" style={ringStyle} />
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-sm font-black text-slate-800">
            {progress !== null ? `${progress}%` : '--'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6 relative">
        <Metric label="Expected" value={expected ?? '--'} tone="blue" />
        <Metric label="Reached" value={reached} tone="emerald" />
        <Metric label="Remaining" value={remaining ?? '--'} tone="amber" />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: number | string;
  tone: 'blue' | 'emerald' | 'amber';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-700'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-amber-50 text-amber-700';

  return (
    <div className={`rounded-2xl p-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}
