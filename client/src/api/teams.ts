import { api } from '@/api/client';
import type { ApiResponse, PaginationMeta, Team } from '@/types';

export interface ListTeamsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const listTeams = async (
  params: ListTeamsParams,
): Promise<{ teams: Team[]; pagination: PaginationMeta }> => {
  const { data } = await api.get<ApiResponse<{ teams: Team[]; pagination: PaginationMeta }>>(
    '/teams',
    { params },
  );
  return data.data!;
};

export const getMyTeams = async (): Promise<Team[]> => {
  const { data } = await api.get<ApiResponse<{ teams: Team[] }>>('/teams/me');
  return data.data!.teams;
};

export const getTeam = async (id: string): Promise<Team> => {
  const { data } = await api.get<ApiResponse<{ team: Team }>>(`/teams/${id}`);
  return data.data!.team;
};

export interface CreateTeamPayload {
  name: string;
  description?: string;
  teamLead: string;
  members?: { user: string; role?: string }[];
}

export const createTeam = async (payload: CreateTeamPayload): Promise<Team> => {
  const { data } = await api.post<ApiResponse<{ team: Team }>>('/teams', payload);
  return data.data!.team;
};

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  teamLead?: string;
  status?: string;
}

export const updateTeam = async (id: string, payload: UpdateTeamPayload): Promise<Team> => {
  const { data } = await api.patch<ApiResponse<{ team: Team }>>(`/teams/${id}`, payload);
  return data.data!.team;
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`);
};

export const addTeamMember = async (
  id: string,
  payload: { user: string; role?: string },
): Promise<Team> => {
  const { data } = await api.post<ApiResponse<{ team: Team }>>(`/teams/${id}/members`, payload);
  return data.data!.team;
};

export const updateTeamMemberRole = async (
  id: string,
  userId: string,
  role: string,
): Promise<Team> => {
  const { data } = await api.patch<ApiResponse<{ team: Team }>>(`/teams/${id}/members/${userId}`, {
    role,
  });
  return data.data!.team;
};

export const removeTeamMember = async (id: string, userId: string): Promise<void> => {
  await api.delete(`/teams/${id}/members/${userId}`);
};
