import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type Permission } from '@/lib/constants';

interface RoleGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate = ({ permission, children, fallback = null }: RoleGateProps) => {
  const { user } = useAuth();
  if (!hasPermission(user?.role, permission)) return <>{fallback}</>;
  return <>{children}</>;
};
