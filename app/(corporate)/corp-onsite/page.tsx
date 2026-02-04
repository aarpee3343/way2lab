'use client';

import { useEffect, useState } from 'react';
import { Activity, Calendar, Users } from 'lucide-react';
import { getCorporateOnsiteActivities } from '@/app/actions/corporatePortalActions';

type Camp = {
  id: number;
  title: string;
  status: string;
  expectedHeadcount?: number | null;
  labName?: string | null;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  _count?: { entries: number };
};

export default function CorporateOnsitePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    active: Camp[];
    planned: Camp[];
    completed: Camp[];
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    const res = await getCorporateOnsiteActivities();
    if (res) {
      setData(res as any);
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="text-center text-slate-500 py-20">Loading onsite activity...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Onsite Health Activity</h1>
          <p className="text-sm text-slate-500">
            Track ongoing and completed onsite camps for your organization.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Auto-refreshing every 15s{lastUpdated ? ` - Updated ${lastUpdated.toLocaleTimeString()}` : ''}
        </div>
      </div>

      <Section title="Active Camps" items={data?.active || []} />
      <Section title="Planned Camps" items={data?.planned || []} />
      <Section title="Completed Camps" items={data?.completed || []} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: Camp[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-blue-600" />
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No records found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((camp) => (
            <div key={camp.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="text-sm font-bold text-slate-800">{camp.title}</div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar size={14} /> Started{' '}
                {camp.startedAt ? new Date(camp.startedAt).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Users size={14} /> Expected: {camp.expectedHeadcount ?? '-'} - Booked:{' '}
                {camp._count?.entries ?? 0}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Users size={14} /> Lab: {camp.labName || '-'}
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-100 text-slate-600">
                {camp.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
