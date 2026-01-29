import { cn } from "@/lib/utils";

// 1. Base Skeleton Pulse
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      {...props}
    />
  );
}

// 2. Lab Card Skeleton (Use this in Search Page)
export function LabCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" /> {/* Logo */}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" /> {/* Title */}
          <Skeleton className="h-3 w-24" /> {/* Rating */}
        </div>
        <Skeleton className="h-6 w-20 rounded-full" /> {/* Match Badge */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-24" /> {/* Price */}
        <Skeleton className="h-10 w-32 rounded-xl" /> {/* Button */}
      </div>
    </div>
  );
}

export { Skeleton };