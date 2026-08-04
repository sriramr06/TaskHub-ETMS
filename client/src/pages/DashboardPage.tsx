import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyTasks } from '@/api/tasks';
import { getMyProjects } from '@/api/projects';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { statusTone } from '@/lib/statusTone';
import { enumLabel } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();

  const tasksQuery = useQuery({ queryKey: ['tasks', 'me'], queryFn: getMyTasks });
  const projectsQuery = useQuery({ queryKey: ['projects', 'me'], queryFn: getMyProjects });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Hey {user?.firstName}, here&apos;s what&apos;s on your plate
        </h1>
        <p className="text-sm text-slate-500">A quick look at your tasks and projects.</p>
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
            <Link
              to="/projects"
              className="text-xs font-medium text-teal-600 hover:text-teal-500"
            >
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
