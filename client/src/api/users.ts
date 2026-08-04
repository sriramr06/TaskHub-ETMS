import { api } from '@/api/client';
import type { ApiResponse, PaginationMeta, User } from '@/types';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export const listUsers = async (
  params: ListUsersParams,
): Promise<{ users: User[]; pagination: PaginationMeta }> => {
  const { data } = await api.get<ApiResponse<{ users: User[]; pagination: PaginationMeta }>>(
    '/users',
    { params },
  );
  return data.data!;
};

export const getUser = async (id: string): Promise<User> => {
  const { data } = await api.get<ApiResponse<{ user: User }>>(`/users/${id}`);
  return data.data!.user;
};

export interface UpdateUserPayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<User> => {
  const { data } = await api.patch<ApiResponse<{ user: User }>>(`/users/${id}`, payload);
  return data.data!.user;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const updateMyProfile = async (payload: UpdateUserPayload): Promise<User> => {
  const { data } = await api.patch<ApiResponse<{ user: User }>>('/users/me', payload);
  return data.data!.user;
};

export const updateMyAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.patch<ApiResponse<{ user: User }>>('/users/me/avatar', formData);
  return data.data!.user;
};
