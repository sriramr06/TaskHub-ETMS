import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, ListChecks, Users, UsersRound } from 'lucide-react';
import { getMyTasks, listTasks } from '@/api/tasks';
import { getMyProjects, listProjects } from '@/api/projects';
import { getMyTeams, listTeams } from '@/api/teams';
import { listUsers } from '@/api/users';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { statusTone } from '@/lib/statusTone';
import { Permission, UserRole, enumLabel, hasPermission } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();

  const tasksQuery = useQuery({ queryKey: ['tasks', 'me'], queryFn: getMyTasks });
  const projectsQuery = useQuery({ queryKey: ['projects', 'me'], queryFn: getMyProjects });

  // ADMIN/MANAGER are org-wide oversight roles — every list endpoint already
  // returns everyone's data for them (see the RBAC scoping work), so their
  // stat cards show real totals. Everyone else gets counts of their own
  // stuff, reusing the "my tasks"/"my projects" queries above for free.
  const isPrivileged = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const showUsersStat = isPrivileged && hasPermission(user?.permissions, Permission.USER_READ);
  const showTeamsStat = hasPermission(user?.permissions, Permission.TEAM_READ);

  const usersCountQuery = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => listUsers({ limit: 1 }),
    select: (data) => data.pagination.total,
    enabled: showUsersStat,
  });
  const projectsCountQuery = useQuery({
    queryKey: ['projects', 'count'],
    queryFn: () => listProjects({ limit: 1 }),
    select: (data) => data.pagination.total,
    enabled: isPrivileged,
  });
  const tasksCountQuery = useQuery({
    queryKey: ['tasks', 'count'],
    queryFn: () => listTasks({ limit: 1 }),
    select: (data) => data.pagination.total,
    enabled: isPrivileged,
  });
  const teamsCountQuery = useQuery({
    queryKey: ['teams', 'count'],
    queryFn: () => listTeams({ limit: 1 }),
    select: (data) => data.pagination.total,
    enabled: isPrivileged && showTeamsStat,
  });
  const myTeamsQuery = useQuery({
    queryKey: ['teams', 'me'],
    queryFn: getMyTeams,
    enabled: !isPrivileged && showTeamsStat,
  });

  const projectsStat = isPrivileged ? projectsCountQuery.data : projectsQuery.data?.length;
  const tasksStat = isPrivileged ? tasksCountQuery.data : tasksQuery.data?.length;
  const teamsStat = isPrivileged ? teamsCountQuery.data : myTeamsQuery.data?.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Hey {user?.firstName}, here&apos;s what&apos;s on your plate
        </h1>
        <p className="text-sm text-slate-500">A quick look at your tasks and projects.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {showUsersStat && (
          <StatCard
            label="Total users"
            value={usersCountQuery.data}
            icon={Users}
            isLoading={usersCountQuery.isLoading}
          />
        )}
        <StatCard
          label={isPrivileged ? 'Total projects' : 'My projects'}
          value={projectsStat}
          icon={FolderKanban}
          isLoading={isPrivileged ? projectsCountQuery.isLoading : projectsQuery.isLoading}
        />
        <StatCard
          label={isPrivileged ? 'Total tasks' : 'My tasks'}
          value={tasksStat}
          icon={ListChecks}
          isLoading={isPrivileged ? tasksCountQuery.isLoading : tasksQuery.isLoading}
        />
        {showTeamsStat && (
          <StatCard
            label={isPrivileged ? 'Total teams' : 'My teams'}
            value={teamsStat}
            icon={UsersRound}
            isLoading={isPrivileged ? teamsCountQuery.isLoading : myTeamsQuery.isLoading}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">My tasks</h2>
            <Link to="/tasks" className="text-xs font-medium text-teal-600 hover:text-teal-500">
              View all
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {tasksQuery.isLoading && <Spinner />}
            {tasksQuery.data && tasksQuery.data.length === 0 && (
              <EmptyState title="No tasks assigned to you" />
            )}
            {tasksQuery.data?.slice(0, 6).map((task) => (
              <Link
                key={task._id}
                to={`/tasks/${task._id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                  <p className="truncate text-xs text-slate-500">{task.project.name}</p>
                </div>
                <Badge tone={statusTone(task.status)}>{enumLabel(task.status)}</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">My projects</h2>
            <Link to="/projects" className="text-xs font-medium text-teal-600 hover:text-teal-500">
              View all
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {projectsQuery.isLoading && <Spinner />}
            {projectsQuery.data && projectsQuery.data.length === 0 && (
              <EmptyState title="You're not on any projects yet" />
            )}
            {projectsQuery.data?.slice(0, 6).map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.progress}% complete</p>
                </div>
                <Badge tone={statusTone(project.status)}>{enumLabel(project.status)}</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
