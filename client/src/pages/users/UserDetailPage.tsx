import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import * as usersApi from '@/api/users';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/api/client';
import { UserRole, UserStatus, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

type FormValues = z.infer<typeof schema>;

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUser(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: user
      ? {
          firstName: user.firstName,
          middleName: user.middleName ?? '',
          lastName: user.lastName,
          phone: user.phone ?? '',
          role: user.role,
          status: user.status,
        }
      : undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteUser(id!),
    onSuccess: () => {
      toast.success('User deleted.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await usersApi.updateUser(id!, values);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!user) return <p className="text-sm text-slate-500">User not found.</p>;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const isSelf = currentUser?._id === user._id;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to="/users" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      <Card>
        <CardBody className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={user.avatar} className="size-14 text-base" />
            <div>
              <p className="text-base font-semibold text-slate-900">{fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1 flex gap-2">
                <Badge tone={statusTone(user.role)}>{enumLabel(user.role)}</Badge>
                <Badge tone={statusTone(user.status)}>{enumLabel(user.status)}</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={isSelf}
            title={isSelf ? "You can't delete your own account" : undefined}
            onClick={() => setConfirmDelete(true)}
          >
            Delete user
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Edit user</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
            <Input
              label="Middle name"
              error={errors.middleName?.message}
              {...register('middleName')}
            />
            <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
            <Select label="Role" error={errors.role?.message} {...register('role')}>
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>
                  {enumLabel(r)}
                </option>
              ))}
            </Select>
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              {Object.values(UserStatus).map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </Select>
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
        title="Delete user"
        description={`Are you sure you want to delete ${fullName}? This also removes their employee record if one exists.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
