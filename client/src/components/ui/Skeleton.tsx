import { cn } from '@/lib/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />
);

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <tr>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </td>
    {Array.from({ length: columns - 1 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton = () => (
  <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-4">
    <div className="flex items-start justify-between">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <div className="mt-auto flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-1.5 w-24 rounded-full" />
    </div>
  </div>
);

export const KanbanCardSkeleton = () => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-surface p-3">
    <Skeleton className="h-3.5 w-4/5" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="size-6 rounded-full" />
    </div>
  </div>
);
