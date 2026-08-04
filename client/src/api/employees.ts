import { api } from '@/api/client';
import type { ApiResponse, Employee, PaginationMeta } from '@/types';

export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  department?: string;
  employmentStatus?: string;
  search?: string;
}

export const listEmployees = async (
  params: ListEmployeesParams,
): Promise<{ employees: Employee[]; pagination: PaginationMeta }> => {
  const { data } = await api.get<
    ApiResponse<{ employees: Employee[]; pagination: PaginationMeta }>
  >('/employees', { params });
  return data.data!;
};

export const getMyEmployeeProfile = async (): Promise<Employee | null> => {
  try {
    const { data } = await api.get<ApiResponse<{ employee: Employee }>>('/employees/me');
    return data.data!.employee;
  } catch {
    return null;
  }
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const { data } = await api.get<ApiResponse<{ employee: Employee }>>(`/employees/${id}`);
  return data.data!.employee;
};

export interface CreateEmployeePayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone?: string;
  role?: string;
  department: string;
  designation: string;
  employmentType?: string;
  employmentStatus?: string;
  reportingManager?: string;
  joiningDate: string;
  dateOfBirth?: string;
  skills?: string[];
}

export const createEmployee = async (payload: CreateEmployeePayload): Promise<Employee> => {
  const { data } = await api.post<ApiResponse<{ employee: Employee }>>('/employees', payload);
  return data.data!.employee;
};

export type UpdateEmployeePayload = Partial<Omit<CreateEmployeePayload, 'email' | 'password'>>;

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeePayload,
): Promise<Employee> => {
  const { data } = await api.patch<ApiResponse<{ employee: Employee }>>(
    `/employees/${id}`,
    payload,
  );
  return data.data!.employee;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/employees/${id}`);
};
