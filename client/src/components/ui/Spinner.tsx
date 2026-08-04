import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('size-5 animate-spin text-indigo-600', className)} />
);

export const PageSpinner = () => (
  <div className="flex h-64 items-center justify-center">
    <Spinner className="size-8" />
  </div>
);
