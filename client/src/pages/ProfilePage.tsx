import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as usersApi from '@/api/users';
import * as authApi from '@/api/auth';
import { getMyEmployeeProfile } from '@/api/employees';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/api/client';
import { enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export const ProfilePage = () => {
  const { user, refetchUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const employeeQuery = useQuery({
    queryKey: ['employees', 'me'],
    queryFn: getMyEmployeeProfile,
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? '',
      middleName: user?.middleName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (values: ProfileValues) => {
    try {
      await usersApi.updateMyProfile(values);
      await refetchUser();
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    try {
      await authApi.changePassword(values);
      toast.success('Password changed. Please log in again.');
      resetPassword();
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const avatarMutation = useMutation({
    mutationFn: usersApi.updateMyAvatar,
    onMutate: () => setAvatarUploading(true),
    onSuccess: async () => {
      await refetchUser();
      toast.success('Avatar updated.');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setAvatarUploading(false),
  });

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const employee = employeeQuery.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Your profile</h1>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={fullName} src={user.avatar} className="size-16 text-base" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-500 disabled:opacity-60"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) avatarMutation.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{fullName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-1 flex gap-2">
              <Badge tone={statusTone(user.role)}>{enumLabel(user.role)}</Badge>
              <Badge tone={statusTone(user.status)}>{enumLabel(user.status)}</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {employee && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Employment details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Employee ID</p>
              <p className="font-medium text-slate-800">{employee.employeeId}</p>
            </div>
            <div>
              <p className="text-slate-500">Department</p>
              <p className="font-medium text-slate-800">{employee.department}</p>
            </div>
            <div>
              <p className="text-slate-500">Designation</p>
              <p className="font-medium text-slate-800">{employee.designation}</p>
            </div>
            <div>
              <p className="text-slate-500">Employment status</p>
              <Badge tone={statusTone(employee.employmentStatus)}>
                {enumLabel(employee.employmentStatus)}
              </Badge>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Edit profile</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <Input
              label="First name"
              error={profileErrors.firstName?.message}
              {...registerProfile('firstName')}
            />
            <Input
              label="Last name"
              error={profileErrors.lastName?.message}
              {...registerProfile('lastName')}
            />
            <Input
              label="Middle name"
              error={profileErrors.middleName?.message}
              {...registerProfile('middleName')}
            />
            <Input
              label="Phone"
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />
            <div className="col-span-2">
              <Button type="submit" isLoading={isProfileSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              label="Current password"
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />
            <div>
              <Button type="submit" variant="secondary" isLoading={isPasswordSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
