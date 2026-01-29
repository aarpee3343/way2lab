'use client';

import dynamic from 'next/dynamic';

// 🚀 DYNAMIC IMPORT: This tells Next.js "Only load this chunk in the browser"
// This prevents the "window is not defined" error during build.
const LiveMap = dynamic(() => import('@/components/admin/LiveMap'), { 
  ssr: false, 
  loading: () => (
    <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold">Loading Map...</p>
      </div>
    </div>
  )
});

export default function LiveMapPage() {
  return <LiveMap />;
}