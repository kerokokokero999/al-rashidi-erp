export function SkeletonCard() {
  return (
    <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl border border-[var(--color-card-border)] animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
          <div className="h-5 bg-neutral-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-pulse">
      <div className="p-4 border-b border-[var(--color-card-border)]">
        <div className="h-4 bg-neutral-200 rounded w-1/4" />
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-200 rounded w-1/3" />
              <div className="h-3 bg-neutral-200 rounded w-1/4" />
            </div>
            <div className="h-6 bg-neutral-200 rounded w-20" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-200" />
              <div className="w-8 h-8 rounded-lg bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ items = 8 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-[var(--color-bg)] border border-[var(--color-neutral-200)] p-3 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-neutral-200 mx-auto mb-2" />
          <div className="h-3 bg-neutral-200 rounded w-3/4 mx-auto mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-2" />
          <div className="h-8 bg-neutral-200 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-neutral-200 rounded w-1/2" />
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-pulse space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-neutral-200 rounded w-1/4 mb-2" />
          <div className="h-10 bg-neutral-200 rounded w-full" />
        </div>
      ))}
      <div className="h-12 bg-neutral-200 rounded w-full mt-6" />
    </div>
  );
}

export function SkeletonInvoice() {
  return (
    <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl border border-[var(--color-card-border)] animate-pulse max-w-sm mx-auto">
      <div className="text-center mb-6 pb-4 border-b border-[var(--color-neutral-200)] space-y-2">
        <div className="h-6 bg-neutral-200 rounded w-2/3 mx-auto" />
        <div className="h-3 bg-neutral-200 rounded w-1/2 mx-auto" />
        <div className="h-3 bg-neutral-200 rounded w-1/3 mx-auto" />
      </div>
      <div className="space-y-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-2">
            <div className="h-3 bg-neutral-200 rounded flex-1" />
            <div className="h-3 bg-neutral-200 rounded w-12" />
            <div className="h-3 bg-neutral-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--color-neutral-200)] pt-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-neutral-200 rounded w-1/3" />
          <div className="h-3 bg-neutral-200 rounded w-1/4" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-neutral-200 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <div className="w-24 h-24 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}