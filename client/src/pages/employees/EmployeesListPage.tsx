import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import * as employeesApi from '@/api/employees';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { RoleGate } from '@/components/RoleGate';
import { getErrorMessage } from '@/api/client';
import { optionalSelect } from '@/lib/zodHelpers';
import { EmploymentStatus, EmploymentType, Permission, UserRole, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

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

export const EmployeesListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, search, department, employmentStatus }],
    queryFn: () =>
      employeesApi.listEmployees({
        page,
        limit: 20,
        search: search || undefined,
        department: department || undefined,
        employmentStatus: employmentStatus || undefined,
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
      await employeesApi.createEmployee(values);
      toast.success('Employee created.');
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
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
          <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">Manage employee records and onboarding.</p>
        </div>
        <RoleGate permission={Permission.USER_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Add employee
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
        <Input
          placeholder="Department"
          className="w-44"
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
        />
        <Select
          value={employmentStatus}
          onChange={(e) => {
            setPage(1);
            setEmploymentStatus(e.target.value);
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          {Object.values(EmploymentStatus).map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {isLoading && <PageSpinner />}
        {!isLoading && data?.employees.length === 0 && (
          <EmptyState title="No employees found" description="Try adjusting your filters." />
        )}
        {!isLoading && data && data.employees.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/employees/${emp._id}`} className="flex items-center gap-3">
                        <Avatar
                          name={`${emp.user.firstName} ${emp.user.lastName}`}
                          src={emp.user.avatar}
                        />
                        <div>
                          <p className="font-medium text-slate-800">
                            {emp.user.firstName} {emp.user.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{emp.user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-slate-700">{emp.department}</td>
                    <td className="px-4 py-3 text-slate-700">{emp.designation}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(emp.employmentStatus)}>
                        {enumLabel(emp.employmentStatus)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add employee"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="First name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
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
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
