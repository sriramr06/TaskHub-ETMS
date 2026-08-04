import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import * as usersApi from '@/api/users';
import * as employeesApi from '@/api/employees';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
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
import type { Employee } from '@/types';

const createSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: optionalSelect(z.nativeEnum(UserRole)),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: optionalSelect(z.nativeEnum(EmploymentType)),
  employmentStatus: optionalSelect(z.nativeEnum(EmploymentStatus)),
  joiningDate: z.string().min(1, 'Joining date is required'),
});

type CreateInput = z.input<typeof createSchema>;
type CreateValues = z.output<typeof createSchema>;

export const PeopleListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search, role, status }],
    queryFn: () =>
      usersApi.listUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Employee records enrich the user list with department/designation when
  // present; not every user has one (e.g. self-registered accounts), so the
  // table falls back to "—" for those rows instead of requiring it.
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeesApi.listEmployees({ limit: 200 }),
  });

  const employeeByUserId = useMemo(() => {
    const map = new Map<string, Employee>();
    employeesData?.employees.forEach((emp) => map.set(emp.user._id, emp));
    return map;
  }, [employeesData]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInput, unknown, CreateValues>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = async (values: CreateValues) => {
    try {
      await employeesApi.createEmployee(values);
      toast.success('Person added.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
      ]);
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
          <h1 className="text-xl font-semibold text-slate-900">People</h1>
          <p className="text-sm text-slate-500">Manage accounts and employment records.</p>
        </div>
        <RoleGate permission={Permission.USER_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Add person
          </Button>
        </RoleGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="w-40"
        >
          <option value="">All roles</option>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {enumLabel(r)}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-40"
        >
          <option value="">All statuses</option>
          {Object.values(UserStatus).map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && data?.users.length === 0 && (
          <EmptyState title="No people found" description="Try adjusting your filters." />
        )}
        {!isLoading && data && data.users.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Person</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u) => {
                    const employee = employeeByUserId.get(u._id);
                    return (
                      <tr key={u._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={`/people/${u._id}`} className="flex items-center gap-3">
                            <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatar} />
                            <div>
                              <p className="font-medium text-slate-800">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(u.role)}>{enumLabel(u.role)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{employee?.department ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-700">{employee?.designation ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(u.status)}>{enumLabel(u.status)}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add person" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Select label="Role" error={errors.role?.message} {...register('role')}>
            <option value="">Default (member)</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {enumLabel(r)}
              </option>
            ))}
          </Select>
          <Input
            label="Department"
            error={errors.department?.message}
            {...register('department')}
          />
          <Input
            label="Designation"
            error={errors.designation?.message}
            {...register('designation')}
          />
          <Select
            label="Employment type"
            error={errors.employmentType?.message}
            {...register('employmentType')}
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
            error={errors.employmentStatus?.message}
            {...register('employmentStatus')}
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
            error={errors.joiningDate?.message}
            {...register('joiningDate')}
          />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add person
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
