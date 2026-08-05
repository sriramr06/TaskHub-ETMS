import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type Permission, type UserRole } from '@/lib/constants';

interface RoleGateProps {
  /** Gate by an existing backend Permission (preferred — mirrors what the API actually allows). */
  permission?: Permission;
  /**
   * Gate by an explicit role allowlist instead. Use this only when no single
   * backend Permission maps to the UI decision (e.g. "show this whole section
   * to admins/managers, even though members have enough API access for
   * other reasons like populating picker dropdowns").
   */
  roles?: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate = ({ permission, roles, children, fallback = null }: RoleGateProps) => {
  const { user } = useAuth();

  if (permission && !hasPermission(user?.permissions, permission)) return <>{fallback}</>;
  if (roles && (!user || !roles.includes(user.role))) return <>{fallback}</>;

  return <>{children}</>;
};
