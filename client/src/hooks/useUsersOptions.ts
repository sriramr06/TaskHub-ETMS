import { useQuery } from '@tanstack/react-query';
import { listUsers } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { Permission, hasPermission } from '@/lib/constants';

export const useUsersOptions = () => {
  const { user } = useAuth();
  const enabled = hasPermission(user?.permissions, Permission.USER_READ);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => listUsers({ limit: 100, status: 'active' }),
    enabled,
  });

  return { users: data?.users ?? [], isLoading: enabled && isLoading };
};
