import type { LucideIcon } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  isLoading?: boolean;
}

export const StatCard = ({ label, value, icon: Icon, isLoading }: StatCardProps) => (
  <Card>
    <CardBody className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {isLoading || value === undefined ? (
          <Skeleton className="mt-1 h-6 w-10" />
        ) : (
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        )}
      </div>
    </CardBody>
  </Card>
);
