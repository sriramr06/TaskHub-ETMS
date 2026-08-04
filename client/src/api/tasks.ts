import { api } from '@/api/client';
import type { ApiResponse, PaginationMeta, Task } from '@/types';

export interface ListTasksParams {
  page?: number;
  limit?: number;
  project?: string;
  status?: string;
  priority?: string;
  label?: string;
  assignee?: string;
  search?: string;
}

export const listTasks = async (
  params: ListTasksParams,
): Promise<{ tasks: Task[]; pagination: PaginationMeta }> => {
  const { data } = await api.get<ApiResponse<{ tasks: Task[]; pagination: PaginationMeta }>>(
    '/tasks',
    { params },
  );
  return data.data!;
};

export const getMyTasks = async (): Promise<Task[]> => {
  const { data } = await api.get<ApiResponse<{ tasks: Task[] }>>('/tasks/me');
  return data.data!.tasks;
};

export const getTask = async (id: string): Promise<Task> => {
  const { data } = await api.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`);
  return data.data!.task;
};

export interface CreateTaskPayload {
  title: string;
  description?: string;
  project: string;
  priority?: string;
  labels?: string[];
  assignees?: string[];
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const { data } = await api.post<ApiResponse<{ task: Task }>>('/tasks', payload);
  return data.data!.task;
};

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  order?: number;
}

export const updateTask = async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}`, payload);
  return data.data!.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const assignTask = async (id: string, assignees: string[]): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}/assign`, {
    assignees,
  });
  return data.data!.task;
};

export const addChecklistItem = async (id: string, title: string): Promise<Task> => {
  const { data } = await api.post<ApiResponse<{ task: Task }>>(`/tasks/${id}/checklist`, {
    title,
  });
  return data.data!.task;
};

export const updateChecklistItem = async (
  id: string,
  itemId: string,
  payload: { title?: string; completed?: boolean },
): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<{ task: Task }>>(
    `/tasks/${id}/checklist/${itemId}`,
    payload,
  );
  return data.data!.task;
};

export const removeChecklistItem = async (id: string, itemId: string): Promise<void> => {
  await api.delete(`/tasks/${id}/checklist/${itemId}`);
};

export const addComment = async (id: string, text: string): Promise<Task> => {
  const { data } = await api.post<ApiResponse<{ task: Task }>>(`/tasks/${id}/comments`, { text });
  return data.data!.task;
};

export const updateComment = async (id: string, commentId: string, text: string): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<{ task: Task }>>(
    `/tasks/${id}/comments/${commentId}`,
    { text },
  );
  return data.data!.task;
};

export const removeComment = async (id: string, commentId: string): Promise<void> => {
  await api.delete(`/tasks/${id}/comments/${commentId}`);
};

export const addAttachment = async (id: string, file: File): Promise<Task> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ApiResponse<{ task: Task }>>(
    `/tasks/${id}/attachments`,
    formData,
  );
  return data.data!.task;
};

export const removeAttachment = async (id: string, attachmentId: string): Promise<void> => {
  await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
};
