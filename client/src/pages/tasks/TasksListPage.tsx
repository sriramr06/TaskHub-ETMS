import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import * as tasksApi from '@/api/tasks';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { RoleGate } from '@/components/RoleGate';
import { useProjectsOptions } from '@/hooks/useProjectsOptions';
import { getErrorMessage } from '@/api/client';
import { optionalSelect } from '@/lib/zodHelpers';
import { Permission, TaskPriority, TaskStatus, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';
import type { Task } from '@/types';

const createSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  project: z.string().min(1, 'Project is required'),
  priority: optionalSelect(z.nativeEnum(TaskPriority)),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: optionalSelect(z.coerce.number().min(0)),
});

type CreateInput = z.input<typeof createSchema>;
type CreateValues = z.output<typeof createSchema>;

const COLUMNS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.HOLD,
  TaskStatus.REVIEW,
  TaskStatus.BLOCKED,
];

const TaskCard = ({ task }: { task: Task }) => {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: string) => tasksApi.updateTask(task._id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card className="flex flex-col gap-2 p-3">
      <Link to={`/tasks/${task._id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600">
        {task.title}
      </Link>
      <p className="text-xs text-slate-500">{task.project.name}</p>
      <div className="flex items-center justify-between">
        <Badge tone={statusTone(task.priority)}>{enumLabel(task.priority)}</Badge>
        <div className="flex -space-x-2">
          {task.assignees.slice(0, 3).map((a) => (
            <Avatar
              key={a._id}
              name={`${a.firstName} ${a.lastName}`}
              src={a.avatar}
              className="size-6 border-2 border-white text-[10px]"
            />
          ))}
        </div>
      </div>
      <RoleGate permission={Permission.TASK_EDIT}>
        <Select
          value={task.status}
          onChange={(e) => statusMutation.mutate(e.target.value)}
          className="mt-1 py-1 text-xs"
        >
          {COLUMNS.map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </RoleGate>
    </Card>
  );
};

export const TasksListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? '';
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { projects } = useProjectsOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { project: projectFilter }],
    queryFn: () => tasksApi.listTasks({ project: projectFilter || undefined, limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInput, unknown, CreateValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (values: CreateValues) => {
    try {
      await tasksApi.createTask(values);
      toast.success('Task created.');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      setModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const tasksByStatus = (status: TaskStatus) => data?.tasks.filter((t) => t.status === status) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">Board view of all work in progress.</p>
        </div>
        <RoleGate permission={Permission.TASK_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            New task
          </Button>
        </RoleGate>
      </div>

      <Select
        value={projectFilter}
        onChange={(e) => setSearchParams(e.target.value ? { project: e.target.value } : {})}
        className="w-64"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </Select>

      {isLoading && <PageSpinner />}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((status) => (
            <div key={status} className="flex min-w-[240px] flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase text-slate-500">
                  {enumLabel(status)}
                </h2>
                <span className="text-xs text-slate-400">{tasksByStatus(status).length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {tasksByStatus(status).map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New task" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
          </div>
          <div className="col-span-2">
            <Textarea
              label="Description"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
          <Select label="Project" error={errors.project?.message} {...register('project')}>
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            <option value="">Default (medium)</option>
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>
                {enumLabel(p)}
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
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
          <Input
            label="Estimated hours"
            type="number"
            min={0}
            error={errors.estimatedHours?.message}
            {...register('estimatedHours')}
          />
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
