import { useQuery } from '@tanstack/react-query';
import { listTeams } from '@/api/teams';
import { useAuth } from '@/context/AuthContext';
import { Permission, hasPermission } from '@/lib/constants';

export const useTeamsOptions = () => {
  const { user } = useAuth();
  const enabled = hasPermission(user?.permissions, Permission.TEAM_READ);

  const { data, isLoading } = useQuery({
    queryKey: ['teams', 'options'],
    queryFn: () => listTeams({ limit: 100 }),
    enabled,
  });

  return { teams: data?.teams ?? [], isLoading: enabled && isLoading };
};
