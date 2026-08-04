import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/ui/Spinner';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
