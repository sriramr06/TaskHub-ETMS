import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, UsersRound } from 'lucide-react';
import * as teamsApi from '@/api/teams';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { RoleGate } from '@/components/RoleGate';
import { useUsersOptions } from '@/hooks/useUsersOptions';
import { getErrorMessage } from '@/api/client';
import { Permission, TeamStatus, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const createSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  teamLead: z.string().min(1, 'Team lead is required'),
});

type CreateValues = z.infer<typeof createSchema>;

export const TeamsListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { users } = useUsersOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['teams', { page, search, status }],
    queryFn: () =>
      teamsApi.listTeams({
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
  } = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (values: CreateValues) => {
    try {
      await teamsApi.createTeam(values);
      toast.success('Team created.');
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      reset();
      setModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Teams</h1>
          <p className="text-sm text-slate-500">Organize people into teams.</p>
        </div>
        <RoleGate permission={Permission.TEAM_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Create team
          </Button>
        </RoleGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search teams"
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
          {Object.values(TeamStatus).map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {!isLoading && data?.teams.length === 0 && (
        <EmptyState title="No teams found" icon={UsersRound} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        {data?.teams.map((team) => (
          <Link key={team._id} to={`/teams/${team._id}`}>
            <Card className="h-full p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{team.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {team.description ?? 'No description'}
                  </p>
                </div>
                <Badge tone={statusTone(team.status)}>{enumLabel(team.status)}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.user._id}
                      name={`${m.user.firstName} ${m.user.lastName}`}
                      src={m.user.avatar}
                      className="border-2 border-white"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500">{team.members.length} members</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {data && <Pagination meta={data.pagination} onPageChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create team">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Team name" error={errors.name?.message} {...register('name')} />
          <Textarea
            label="Description"
            error={errors.description?.message}
            {...register('description')}
          />
          <Select label="Team lead" error={errors.teamLead?.message} {...register('teamLead')}>
            <option value="">Select a team lead</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
