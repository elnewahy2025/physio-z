// frontend/src/components/Skeletons.tsx
// Loading skeleton components that replace spinners for a smoother UX.

interface SkeletonProps {
  className?: string;
}

// ─── Base skeleton block ───
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

// ─── Card skeleton (for dashboard cards, stats) ───
export function CardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Stats grid skeleton (4 stat cards) ───
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── List item skeleton (patient/appointment/invoice rows) ───
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Avatar/icon */}
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />

      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-8 w-12 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Full list skeleton ───
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="card">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: items }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Table skeleton ───
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Column headers */}
      <div
        className="mb-4 grid gap-4 border-b border-gray-100 pb-3 dark:border-gray-700"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid items-center gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-4 ${colIndex === 0 ? 'w-16' : colIndex === cols - 1 ? 'w-24' : 'w-full'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Form skeleton ───
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      {/* Submit button */}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Calendar skeleton ───
export function CalendarSkeleton() {
  return (
    <div className="card !p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard skeleton (full page) ───
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats grid */}
      <StatsGridSkeleton />

      {/* Appointments card */}
      <div className="card">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}