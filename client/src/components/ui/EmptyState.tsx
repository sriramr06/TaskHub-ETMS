import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16 text-center">
    <Icon className="size-8 text-slate-300" />
    <p className="text-sm font-medium text-slate-700">{title}</p>
    {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
