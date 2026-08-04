import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ListChecks, Plus, X } from 'lucide-react';
import * as projectsApi from '@/api/projects';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { RoleGate } from '@/components/RoleGate';
import { useUsersOptions } from '@/hooks/useUsersOptions';
import { useTeamsOptions } from '@/hooks/useTeamsOptions';
import { getErrorMessage } from '@/api/client';
import { Permission, ProjectStatus, TaskPriority, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const schema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(TaskPriority),
  team: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  progress: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { users } = useUsersOptions();
  const { teams } = useTeamsOptions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: project
      ? {
          name: project.name,
          description: project.description ?? '',
          status: project.status,
          priority: project.priority,
          team: project.team?._id ?? '',
          startDate: project.startDate?.slice(0, 10) ?? '',
          deadline: project.deadline?.slice(0, 10) ?? '',
          progress: project.progress,
        }
      : undefined,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects', id] });

  const onSubmit = async (values: FormValues) => {
    try {
      await projectsApi.updateProject(id!, { ...values, team: values.team || undefined });
      await invalidate();
      toast.success('Project updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(id!),
    onSuccess: () => {
      toast.success('Project deleted.');
      navigate('/projects');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addProjectMember(id!, newMemberId),
    onSuccess: async () => {
      toast.success('Member added.');
      setNewMemberId('');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeProjectMember(id!, userId),
    onSuccess: async () => {
      toast.success('Member removed.');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <PageSpinner />;
  if (!project) return <p className="text-sm text-slate-500">Project not found.</p>;

  const memberIds = new Set(project.members.map((m) => m._id));
  const availableUsers = users.filter((u) => !memberIds.has(u._id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/projects"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{project.name}</p>
                <Badge tone={statusTone(project.status)}>{enumLabel(project.status)}</Badge>
                <Badge tone={statusTone(project.priority)}>{enumLabel(project.priority)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Owned by {project.owner.firstName} {project.owner.lastName}
                {project.team && ` · ${project.team.name}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/tasks?project=${project._id}`}>
                <Button variant="outline" size="sm">
                  <ListChecks className="size-4" />
                  View tasks
                </Button>
              </Link>
              <RoleGate permission={Permission.PROJECT_DELETE}>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </RoleGate>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">
            Members ({project.members.length})
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <RoleGate permission={Permission.PROJECT_EDIT}>
            <div className="flex gap-2">
              <Select
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                className="flex-1"
              >
                <option value="">Select a user to add</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </Select>
              <Button
                disabled={!newMemberId}
                isLoading={addMemberMutation.isPending}
                onClick={() => addMemberMutation.mutate()}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </RoleGate>

          <div className="divide-y divide-slate-100">
            {project.members.map((member) => (
              <div key={member._id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar name={`${member.firstName} ${member.lastName}`} src={member.avatar} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <RoleGate permission={Permission.PROJECT_EDIT}>
                  <button
                    type="button"
                    onClick={() => removeMemberMutation.mutate(member._id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="size-4" />
                  </button>
                </RoleGate>
              </div>
            ))}
            {project.members.length === 0 && (
              <p className="py-2 text-sm text-slate-500">No members yet.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Project details</h2>
        </CardHeader>
        <CardBody>
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
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              {Object.values(ProjectStatus).map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </Select>
            <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {enumLabel(p)}
                </option>
              ))}
            </Select>
            <Select label="Team" error={errors.team?.message} {...register('team')}>
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Input
              label="Progress (%)"
              type="number"
              min={0}
              max={100}
              error={errors.progress?.message}
              {...register('progress')}
            />
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
            <div className="col-span-2">
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project"
        description={`Are you sure you want to delete "${project.name}"? This also deletes all of its tasks.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
