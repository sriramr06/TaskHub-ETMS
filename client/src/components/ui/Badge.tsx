import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'slate' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';

const toneClasses: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export const Badge = ({ className, tone = 'slate', ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
);
