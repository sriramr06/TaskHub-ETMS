import { api } from '@/api/client';
import type { ApiResponse, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const login = async (payload: LoginPayload): Promise<User> => {
  const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/login', payload);
  return data.data!.user;
};

export const register = async (payload: RegisterPayload): Promise<User> => {
  const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/register', payload);
  return data.data!.user;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return data.data!.user;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await api.patch('/auth/change-password', payload);
};
