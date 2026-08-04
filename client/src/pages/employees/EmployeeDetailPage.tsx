import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
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
import { EmploymentStatus, EmploymentType, Permission, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

const schema = z.object({
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.nativeEnum(EmploymentType),
  employmentStatus: z.nativeEnum(EmploymentStatus),
  joiningDate: z.string().min(1, 'Joining date is required'),
  skills: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.getEmployee(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const deleteMutation = useMutation({
    mutationFn: () => employeesApi.deleteEmployee(id!),
    onSuccess: () => {
      toast.success('Employee deleted.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate('/employees');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await employeesApi.updateEmployee(id!, {
        ...values,
        skills: values.skills
          ? values.skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!employee) return <p className="text-sm text-slate-500">Employee not found.</p>;

  const fullName = `${employee.user.firstName} ${employee.user.lastName}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        to="/employees"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Back to employees
      </Link>

      <Card>
        <CardBody className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={employee.user.avatar} className="size-14 text-base" />
            <div>
              <p className="text-base font-semibold text-slate-900">{fullName}</p>
              <p className="text-sm text-slate-500">{employee.user.email}</p>
              <div className="mt-1 flex gap-2">
                <Badge tone="slate">{employee.employeeId}</Badge>
                <Badge tone={statusTone(employee.employmentStatus)}>
                  {enumLabel(employee.employmentStatus)}
                </Badge>
              </div>
            </div>
          </div>
          <RoleGate permission={Permission.USER_DELETE}>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </RoleGate>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Employment details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
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
            <Input
              label="Skills (comma separated)"
              error={errors.skills?.message}
              {...register('skills')}
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
        title="Delete employee"
        description={`Are you sure you want to delete ${fullName}'s employee record?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
