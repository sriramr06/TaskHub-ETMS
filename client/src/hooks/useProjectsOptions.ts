import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/api/projects';
import { useAuth } from '@/context/AuthContext';
import { Permission, hasPermission } from '@/lib/constants';

export const useProjectsOptions = () => {
  const { user } = useAuth();
  const enabled = hasPermission(user?.permissions, Permission.PROJECT_READ);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => listProjects({ limit: 100, isArchived: false }),
    enabled,
  });

  return { projects: data?.projects ?? [], isLoading: enabled && isLoading };
};
