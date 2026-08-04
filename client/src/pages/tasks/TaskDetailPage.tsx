import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Paperclip, Plus, Send, Trash2, X } from 'lucide-react';
import * as tasksApi from '@/api/tasks';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { RoleGate } from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';
import { useUsersOptions } from '@/hooks/useUsersOptions';
import { getErrorMessage } from '@/api/client';
import { Permission, TaskPriority, TaskStatus, UserRole, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';
import { cn } from '@/lib/cn';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  actualHours: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { users } = useUsersOptions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[] | null>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getTask(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          startDate: task.startDate?.slice(0, 10) ?? '',
          dueDate: task.dueDate?.slice(0, 10) ?? '',
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
        }
      : undefined,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', id] });

  const onSubmit = async (values: FormValues) => {
    try {
      await tasksApi.updateTask(id!, values);
      await invalidate();
      toast.success('Task updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(id!),
    onSuccess: () => {
      toast.success('Task deleted.');
      navigate('/tasks');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const assignMutation = useMutation({
    mutationFn: (ids: string[]) => tasksApi.assignTask(id!, ids),
    onSuccess: async () => {
      toast.success('Assignees updated.');
      setAssigneeIds(null);
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addChecklistMutation = useMutation({
    mutationFn: (title: string) => tasksApi.addChecklistItem(id!, title),
    onSuccess: async () => {
      setChecklistTitle('');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      tasksApi.updateChecklistItem(id!, itemId, { completed }),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeChecklistMutation = useMutation({
    mutationFn: (itemId: string) => tasksApi.removeChecklistItem(id!, itemId),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => tasksApi.addComment(id!, text),
    onSuccess: async () => {
      setCommentText('');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeCommentMutation = useMutation({
    mutationFn: (commentId: string) => tasksApi.removeComment(id!, commentId),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: (file: File) => tasksApi.addAttachment(id!, file),
    onSuccess: async () => {
      toast.success('Attachment uploaded.');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => tasksApi.removeAttachment(id!, attachmentId),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <PageSpinner />;
  if (!task) return <p className="text-sm text-slate-500">Task not found.</p>;

  const selectedAssignees = assigneeIds ?? task.assignees.map((a) => a._id);
  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) => {
      const current = prev ?? task.assignees.map((a) => a._id);
      return current.includes(userId)
        ? current.filter((v) => v !== userId)
        : [...current, userId];
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/tasks" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                <Badge tone={statusTone(task.status)}>{enumLabel(task.status)}</Badge>
                <Badge tone={statusTone(task.priority)}>{enumLabel(task.priority)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                <Link to={`/projects/${task.project._id}`} className="hover:text-indigo-600">
                  {task.project.name}
                </Link>{' '}
                &middot; reported by {task.reporter.firstName} {task.reporter.lastName}
              </p>
            </div>
            <RoleGate permission={Permission.TASK_DELETE}>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Assignees</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {task.assignees.map((a) => (
              <div
                key={a._id}
                className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3"
              >
                <Avatar name={`${a.firstName} ${a.lastName}`} src={a.avatar} className="size-6" />
                <span className="text-xs font-medium text-slate-700">
                  {a.firstName} {a.lastName}
                </span>
              </div>
            ))}
            {task.assignees.length === 0 && (
              <p className="text-sm text-slate-500">No one is assigned yet.</p>
            )}
          </div>

          <RoleGate permission={Permission.TASK_ASSIGN}>
            <details className="rounded-lg border border-slate-200">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
                Manage assignees
              </summary>
              <div className="flex flex-col gap-1 border-t border-slate-100 p-3">
                {users.map((u) => (
                  <label key={u._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(u._id)}
                      onChange={() => toggleAssignee(u._id)}
                    />
                    {u.firstName} {u.lastName}
                  </label>
                ))}
                <Button
                  size="sm"
                  className="mt-2 w-fit"
                  isLoading={assignMutation.isPending}
                  onClick={() => assignMutation.mutate(selectedAssignees)}
                >
                  Save assignees
                </Button>
              </div>
            </details>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">
            Checklist ({task.checklist.filter((c) => c.completed).length}/{task.checklist.length})
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {task.checklist.map((item) => (
            <div key={item._id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) =>
                  toggleChecklistMutation.mutate({ itemId: item._id, completed: e.target.checked })
                }
              />
              <span
                className={cn(
                  'flex-1 text-sm text-slate-700',
                  item.completed && 'text-slate-400 line-through',
                )}
              >
                {item.title}
              </span>
              <RoleGate permission={Permission.TASK_EDIT}>
                <button
                  type="button"
                  onClick={() => removeChecklistMutation.mutate(item._id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-3.5" />
                </button>
              </RoleGate>
            </div>
          ))}
          <RoleGate permission={Permission.TASK_EDIT}>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add a checklist item"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                disabled={!checklistTitle.trim()}
                isLoading={addChecklistMutation.isPending}
                onClick={() => addChecklistMutation.mutate(checklistTitle.trim())}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">
            Attachments ({task.attachments.length})
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {task.attachments.map((att) => (
            <div key={att._id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 truncate text-sm text-indigo-600 hover:text-indigo-500"
              >
                <Paperclip className="size-4 shrink-0" />
                <span className="truncate">{att.name}</span>
              </a>
              <RoleGate permission={Permission.TASK_EDIT}>
                <button
                  type="button"
                  onClick={() => removeAttachmentMutation.mutate(att._id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </RoleGate>
            </div>
          ))}
          {task.attachments.length === 0 && (
            <p className="text-sm text-slate-500">No attachments yet.</p>
          )}
          <RoleGate permission={Permission.TASK_EDIT}>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addAttachmentMutation.mutate(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                isLoading={addAttachmentMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
                Upload file
              </Button>
            </div>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">
            Comments ({task.comments.length})
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {task.comments.map((comment) => {
            const canDelete =
              currentUser?._id === comment.user._id || currentUser?.role === UserRole.ADMIN;
            return (
              <div key={comment._id} className="flex gap-3">
                <Avatar
                  name={`${comment.user.firstName} ${comment.user.lastName}`}
                  src={comment.user.avatar}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">
                      {comment.user.firstName} {comment.user.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => removeCommentMutation.mutate(comment._id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{comment.text}</p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button
              disabled={!commentText.trim()}
              isLoading={addCommentMutation.isPending}
              onClick={() => addCommentMutation.mutate(commentText.trim())}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Task details</h2>
        </CardHeader>
        <CardBody>
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
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              {Object.values(TaskStatus).map((s) => (
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
            <Input
              label="Actual hours"
              type="number"
              min={0}
              error={errors.actualHours?.message}
              {...register('actualHours')}
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
        title="Delete task"
        description={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
