import { api } from '@/api/client';
import type { ApiResponse, PaginationMeta, Project } from '@/types';

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  team?: string;
  isArchived?: boolean;
  search?: string;
}

export const listProjects = async (
  params: ListProjectsParams,
): Promise<{ projects: Project[]; pagination: PaginationMeta }> => {
  const { data } = await api.get<ApiResponse<{ projects: Project[]; pagination: PaginationMeta }>>(
    '/projects',
    { params },
  );
  return data.data!;
};

export const getMyProjects = async (): Promise<Project[]> => {
  const { data } = await api.get<ApiResponse<{ projects: Project[] }>>('/projects/me');
  return data.data!.projects;
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await api.get<ApiResponse<{ project: Project }>>(`/projects/${id}`);
  return data.data!.project;
};

export interface CreateProjectPayload {
  name: string;
  description?: string;
  priority?: string;
  team?: string;
  members?: string[];
  startDate?: string;
  deadline?: string;
  tags?: string[];
}

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const { data } = await api.post<ApiResponse<{ project: Project }>>('/projects', payload);
  return data.data!.project;
};

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  team?: string;
  startDate?: string;
  deadline?: string;
  tags?: string[];
  progress?: number;
  isArchived?: boolean;
}

export const updateProject = async (
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> => {
  const { data } = await api.patch<ApiResponse<{ project: Project }>>(`/projects/${id}`, payload);
  return data.data!.project;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const addProjectMember = async (id: string, user: string): Promise<Project> => {
  const { data } = await api.post<ApiResponse<{ project: Project }>>(`/projects/${id}/members`, {
    user,
  });
  return data.data!.project;
};

export const removeProjectMember = async (id: string, userId: string): Promise<void> => {
  await api.delete(`/projects/${id}/members/${userId}`);
};
