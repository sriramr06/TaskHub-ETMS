import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFoundPage = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
    <p className="text-4xl font-bold text-slate-900">404</p>
    <p className="text-sm text-slate-500">This page doesn&apos;t exist.</p>
    <Link to="/">
      <Button variant="outline">Back to dashboard</Button>
    </Link>
  </div>
);
