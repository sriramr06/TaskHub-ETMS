import { z } from 'zod';
import { TeamRole, TeamStatus } from '@/constants/enums/team';
import { objectIdSchema } from '@/validators/common.validator';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Team name is required'),
    description: z.string().trim().min(1).optional(),
    teamLead: objectIdSchema,
    members: z
      .array(
        z.object({
          user: objectIdSchema,
          role: z.nativeEnum(TeamRole).optional(),
        }),
      )
      .optional(),
  }),
});

export const updateTeamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    teamLead: objectIdSchema.optional(),
    status: z.nativeEnum(TeamStatus).optional(),
  }),
});

export const teamIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const addTeamMemberSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    user: objectIdSchema,
    role: z.nativeEnum(TeamRole).optional(),
  }),
});

export const updateTeamMemberSchema = z.object({
  params: z.object({ id: objectIdSchema, userId: objectIdSchema }),
  body: z.object({
    role: z.nativeEnum(TeamRole),
  }),
});

export const teamMemberParamSchema = z.object({
  params: z.object({ id: objectIdSchema, userId: objectIdSchema }),
});
