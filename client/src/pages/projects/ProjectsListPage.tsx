import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderKanban, Plus, Search } from 'lucide-react';
import * as projectsApi from '@/api/projects';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { RoleGate } from '@/components/RoleGate';
import { useTeamsOptions } from '@/hooks/useTeamsOptions';
import { getErrorMessage } from '@/api/client';
import { optionalSelect } from '@/lib/zodHelpers';
import { Permission, ProjectStatus, TaskPriority, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const createSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  priority: optionalSelect(z.nativeEnum(TaskPriority)),
  team: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
});

type CreateInput = z.input<typeof createSchema>;
type CreateValues = z.output<typeof createSchema>;

export const ProjectsListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { teams } = useTeamsOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, status }],
    queryFn: () =>
      projectsApi.listProjects({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInput, unknown, CreateValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (values: CreateValues) => {
    try {
      await projectsApi.createProject({
        ...values,
        team: values.team || undefined,
      });
      toast.success('Project created.');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      setModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Track initiatives across your organization.</p>
        </div>
        <RoleGate permission={Permission.PROJECT_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            New project
          </Button>
        </RoleGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search projects"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          {Object.values(ProjectStatus).map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <PageSpinner />}
      {!isLoading && data?.projects.length === 0 && (
        <EmptyState title="No projects found" icon={FolderKanban} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.projects.map((project) => (
          <Link key={project._id} to={`/projects/${project._id}`}>
            <Card className="flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{project.name}</p>
                <Badge tone={statusTone(project.status)}>{enumLabel(project.status)}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-slate-500">
                {project.description ?? 'No description'}
              </p>
              <div className="mt-auto flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{project.progress}% complete</span>
                  <Badge tone={statusTone(project.priority)}>{enumLabel(project.priority)}</Badge>
                </div>
                <ProgressBar value={project.progress} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {data && <Pagination meta={data.pagination} onPageChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New project" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Project name" error={errors.name?.message} {...register('name')} />
          </div>
          <div className="col-span-2">
            <Textarea
              label="Description"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            <option value="">Default (medium)</option>
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>
                {enumLabel(p)}
              </option>
            ))}
          </Select>
          <Select label="Team (optional)" error={errors.team?.message} {...register('team')}>
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Deadline"
            type="date"
            error={errors.deadline?.message}
            {...register('deadline')}
          />
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
