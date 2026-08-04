import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import * as usersApi from '@/api/users';
import * as employeesApi from '@/api/employees';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { RoleGate } from '@/components/RoleGate';
import { getErrorMessage } from '@/api/client';
import { optionalSelect } from '@/lib/zodHelpers';
import {
  EmploymentStatus,
  EmploymentType,
  Permission,
  UserRole,
  UserStatus,
  enumLabel,
} from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';
import { useAuth } from '@/context/AuthContext';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

type UserFormValues = z.infer<typeof userSchema>;

const employeeSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.nativeEnum(EmploymentType),
  employmentStatus: z.nativeEnum(EmploymentStatus),
  joiningDate: z.string().min(1, 'Joining date is required'),
  skills: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const linkEmployeeSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: optionalSelect(z.nativeEnum(EmploymentType)),
  employmentStatus: optionalSelect(z.nativeEnum(EmploymentStatus)),
  joiningDate: z.string().min(1, 'Joining date is required'),
});

type LinkEmployeeInput = z.input<typeof linkEmployeeSchema>;
type LinkEmployeeValues = z.output<typeof linkEmployeeSchema>;

export const PersonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUser(id!),
    enabled: !!id,
  });

  // No "get employee by user id" endpoint exists, so the same cached
  // all-employees lookup used on the list page is reused here to find the
  // linked record, if any.
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeesApi.listEmployees({ limit: 200 }),
  });
  const employee = employeesData?.employees.find((e) => e.user._id === id);

  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    formState: { errors: userErrors, isSubmitting: isUserSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
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

  const {
    register: registerLink,
    handleSubmit: handleLinkSubmit,
    formState: { errors: linkErrors, isSubmitting: isLinkSubmitting },
  } = useForm<LinkEmployeeInput, unknown, LinkEmployeeValues>({
    resolver: zodResolver(linkEmployeeSchema),
  });

  const {
    register: registerEmployee,
    handleSubmit: handleEmployeeSubmit,
    formState: { errors: employeeErrors, isSubmitting: isEmployeeSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    values: employee
      ? {
          department: employee.department,
          designation: employee.designation,
          employmentType: employee.employmentType,
          employmentStatus: employee.employmentStatus,
          joiningDate: employee.joiningDate.slice(0, 10),
          skills: employee.skills.join(', '),
        }
      : undefined,
  });

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['employees'] }),
    ]);

  const deleteUserMutation = useMutation({
    mutationFn: () => usersApi.deleteUser(id!),
    onSuccess: async () => {
      toast.success('Person deleted.');
      await invalidateAll();
      navigate('/people');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: () => employeesApi.deleteEmployee(employee!._id),
    onSuccess: async () => {
      toast.success('Employee record removed. The account has been deactivated.');
      setConfirmDeleteEmployee(false);
      await invalidateAll();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onUserSubmit = async (values: UserFormValues) => {
    try {
      await usersApi.updateUser(id!, values);
      await invalidateAll();
      toast.success('Person updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onLinkSubmit = async (values: LinkEmployeeValues) => {
    try {
      await employeesApi.linkEmployee({ ...values, user: id! });
      await invalidateAll();
      toast.success('Employee record created.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onEmployeeSubmit = async (values: EmployeeFormValues) => {
    try {
      await employeesApi.updateEmployee(employee!._id, {
        ...values,
        skills: values.skills
          ? values.skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });
      await invalidateAll();
      toast.success('Employment details updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (userLoading || employeesLoading) return <PageSpinner />;
  if (!user) return <p className="text-sm text-slate-500">Person not found.</p>;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const isSelf = currentUser?._id === user._id;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        to="/people"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Back to people
      </Link>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={user.avatar} className="size-14 text-base" />
            <div>
              <p className="text-base font-semibold text-slate-900">{fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1 flex gap-2">
                <Badge tone={statusTone(user.role)}>{enumLabel(user.role)}</Badge>
                <Badge tone={statusTone(user.status)}>{enumLabel(user.status)}</Badge>
                {employee && <Badge tone="slate">{employee.employeeId}</Badge>}
              </div>
            </div>
          </div>
          <RoleGate permission={Permission.USER_DELETE}>
            <Button
              variant="danger"
              size="sm"
              disabled={isSelf}
              title={isSelf ? "You can't delete your own account" : undefined}
              onClick={() => setConfirmDeleteUser(true)}
            >
              Delete person
            </Button>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Account details</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={handleUserSubmit(onUserSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Input
              label="First name"
              error={userErrors.firstName?.message}
              {...registerUser('firstName')}
            />
            <Input
              label="Last name"
              error={userErrors.lastName?.message}
              {...registerUser('lastName')}
            />
            <Input
              label="Middle name"
              error={userErrors.middleName?.message}
              {...registerUser('middleName')}
            />
            <Input label="Phone" error={userErrors.phone?.message} {...registerUser('phone')} />
            <Select label="Role" error={userErrors.role?.message} {...registerUser('role')}>
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>
                  {enumLabel(r)}
                </option>
              ))}
            </Select>
            <Select label="Status" error={userErrors.status?.message} {...registerUser('status')}>
              {Object.values(UserStatus).map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={isUserSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {employee ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Employment details</h2>
            <RoleGate permission={Permission.USER_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setConfirmDeleteEmployee(true)}
              >
                Remove employee record
              </Button>
            </RoleGate>
          </CardHeader>
          <CardBody>
            <form
              onSubmit={handleEmployeeSubmit(onEmployeeSubmit)}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <Input
                label="Department"
                error={employeeErrors.department?.message}
                {...registerEmployee('department')}
              />
              <Input
                label="Designation"
                error={employeeErrors.designation?.message}
                {...registerEmployee('designation')}
              />
              <Select
                label="Employment type"
                error={employeeErrors.employmentType?.message}
                {...registerEmployee('employmentType')}
              >
                {Object.values(EmploymentType).map((t) => (
                  <option key={t} value={t}>
                    {enumLabel(t)}
                  </option>
                ))}
              </Select>
              <Select
                label="Employment status"
                error={employeeErrors.employmentStatus?.message}
                {...registerEmployee('employmentStatus')}
              >
                {Object.values(EmploymentStatus).map((s) => (
                  <option key={s} value={s}>
                    {enumLabel(s)}
                  </option>
                ))}
              </Select>
              <Input
                label="Joining date"
                type="date"
                error={employeeErrors.joiningDate?.message}
                {...registerEmployee('joiningDate')}
              />
              <Input
                label="Skills (comma separated)"
                error={employeeErrors.skills?.message}
                {...registerEmployee('skills')}
              />
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={isEmployeeSubmitting}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <RoleGate
          permission={Permission.USER_CREATE}
          fallback={
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">
                  This account isn&apos;t linked to an employee record.
                </p>
              </CardBody>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Add employment details</h2>
            </CardHeader>
            <CardBody>
              <p className="mb-4 text-sm text-slate-500">
                This account isn&apos;t linked to an employee record yet. Fill this in to track{' '}
                {fullName}&apos;s department, designation, and employment status.
              </p>
              <form
                onSubmit={handleLinkSubmit(onLinkSubmit)}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <Input
                  label="Department"
                  error={linkErrors.department?.message}
                  {...registerLink('department')}
                />
                <Input
                  label="Designation"
                  error={linkErrors.designation?.message}
                  {...registerLink('designation')}
                />
                <Select
                  label="Employment type"
                  error={linkErrors.employmentType?.message}
                  {...registerLink('employmentType')}
                >
                  <option value="">Default (full-time)</option>
                  {Object.values(EmploymentType).map((t) => (
                    <option key={t} value={t}>
                      {enumLabel(t)}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Employment status"
                  error={linkErrors.employmentStatus?.message}
                  {...registerLink('employmentStatus')}
                >
                  <option value="">Default (probation)</option>
                  {Object.values(EmploymentStatus).map((s) => (
                    <option key={s} value={s}>
                      {enumLabel(s)}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Joining date"
                  type="date"
                  error={linkErrors.joiningDate?.message}
                  {...registerLink('joiningDate')}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" isLoading={isLinkSubmitting}>
                    Add employment details
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </RoleGate>
      )}

      <ConfirmDialog
        open={confirmDeleteUser}
        title="Delete person"
        description={`Are you sure you want to delete ${fullName}? This also removes their employee record if one exists.`}
        confirmLabel="Delete"
        isLoading={deleteUserMutation.isPending}
        onConfirm={() => deleteUserMutation.mutate()}
        onCancel={() => setConfirmDeleteUser(false)}
      />

      <ConfirmDialog
        open={confirmDeleteEmployee}
        title="Remove employee record"
        description={`This removes ${fullName}'s employment details and deactivates their account. Their login will still exist.`}
        confirmLabel="Remove"
        isLoading={deleteEmployeeMutation.isPending}
        onConfirm={() => deleteEmployeeMutation.mutate()}
        onCancel={() => setConfirmDeleteEmployee(false)}
      />
    </div>
  );
};
