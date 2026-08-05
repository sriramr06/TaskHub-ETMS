import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';
import * as teamsApi from '@/api/teams';
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
import { useUsersOptions } from '@/hooks/useUsersOptions';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Permission, TeamRole, TeamStatus, enumLabel, hasPermission } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const schema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  status: z.nativeEnum(TeamStatus),
});

type FormValues = z.infer<typeof schema>;

export const TeamDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const canEditTeam = hasPermission(currentUser?.permissions, Permission.TEAM_UPDATE);
  const { users } = useUsersOptions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<string>(TeamRole.CONTRIBUTOR);

  const { data: team, isLoading } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.getTeam(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: team
      ? { name: team.name, description: team.description ?? '', status: team.status }
      : undefined,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teams', id] });

  const onSubmit = async (values: FormValues) => {
    try {
      await teamsApi.updateTeam(id!, values);
      await invalidate();
      toast.success('Team updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => teamsApi.deleteTeam(id!),
    onSuccess: () => {
      toast.success('Team deleted.');
      navigate('/teams');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addMemberMutation = useMutation({
    mutationFn: () => teamsApi.addTeamMember(id!, { user: newMemberId, role: newMemberRole }),
    onSuccess: async () => {
      toast.success('Member added.');
      setNewMemberId('');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => teamsApi.removeTeamMember(id!, userId),
    onSuccess: async () => {
      toast.success('Member removed.');
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      teamsApi.updateTeamMemberRole(id!, userId, role),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <PageSpinner />;
  if (!team) return <p className="text-sm text-slate-500">Team not found.</p>;

  const memberIds = new Set(team.members.map((m) => m.user._id));
  const availableUsers = users.filter((u) => u._id !== team.teamLead._id && !memberIds.has(u._id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/teams"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Back to teams
      </Link>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">{team.name}</p>
              <Badge tone={statusTone(team.status)}>{enumLabel(team.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Led by {team.teamLead.firstName} {team.teamLead.lastName}
            </p>
          </div>
          <RoleGate permission={Permission.TEAM_DELETE}>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete team
            </Button>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Members ({team.members.length})</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <RoleGate permission={Permission.TEAM_UPDATE}>
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
              <Select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="w-36"
              >
                {Object.values(TeamRole).map((r) => (
                  <option key={r} value={r}>
                    {enumLabel(r)}
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
            {team.members.map((member) => (
              <div key={member.user._id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${member.user.firstName} ${member.user.lastName}`}
                    src={member.user.avatar}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleGate
                    permission={Permission.TEAM_UPDATE}
                    fallback={<Badge tone="blue">{enumLabel(member.role)}</Badge>}
                  >
                    <Select
                      value={member.role}
                      onChange={(e) =>
                        changeRoleMutation.mutate({ userId: member.user._id, role: e.target.value })
                      }
                      className="w-32"
                    >
                      {Object.values(TeamRole).map((r) => (
                        <option key={r} value={r}>
                          {enumLabel(r)}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeMemberMutation.mutate(member.user._id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </RoleGate>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Team details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Team name"
              disabled={!canEditTeam}
              error={errors.name?.message}
              {...register('name')}
            />
            <Textarea
              label="Description"
              disabled={!canEditTeam}
              error={errors.description?.message}
              {...register('description')}
            />
            <Select
              label="Status"
              disabled={!canEditTeam}
              error={errors.status?.message}
              {...register('status')}
            >
              {Object.values(TeamStatus).map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </Select>
            <RoleGate permission={Permission.TEAM_UPDATE}>
              <div>
                <Button type="submit" isLoading={isSubmitting}>
                  Save changes
                </Button>
              </div>
            </RoleGate>
          </form>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete team"
        description={`Are you sure you want to delete "${team.name}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
