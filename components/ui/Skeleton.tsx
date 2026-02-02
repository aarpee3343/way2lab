import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex items-center justify-between">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* AI Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Skeleton className="h-44 w-44 rounded-full" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-28 rounded-lg" />
                  <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Skeleton className="h-full min-h-[300px] rounded-[2rem]" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map(i => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ✅ NEW: Added LabCardSkeleton for Search Page
export function LabCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header: Avatar + Title + Badge */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Features Row */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>

      {/* Test List */}
      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      {/* Footer: Price + Button */}
      <div className="flex justify-between items-end pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </div>
  );
}