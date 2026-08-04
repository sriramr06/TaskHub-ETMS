import { z } from 'zod';
import { ProjectStatus } from '@/constants/enums/project';
import { TaskPriority } from '@/constants/enums/task';
import { objectIdSchema } from '@/validators/common.validator';

export const createProjectSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'Project name is required'),
      description: z.string().trim().min(1).optional(),
      priority: z.nativeEnum(TaskPriority).optional(),
      team: objectIdSchema.optional(),
      members: z.array(objectIdSchema).optional(),
      startDate: z.coerce.date().optional(),
      deadline: z.coerce.date().optional(),
      tags: z.array(z.string().trim().min(1)).optional(),
    })
    .refine((data) => !data.startDate || !data.deadline || data.deadline >= data.startDate, {
      message: 'Deadline cannot be before the start date',
      path: ['deadline'],
    }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    team: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    deadline: z.coerce.date().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    progress: z.coerce.number().min(0).max(100).optional(),
    isArchived: z.coerce.boolean().optional(),
  }),
});

export const projectIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const addProjectMemberSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    user: objectIdSchema,
  }),
});

export const projectMemberParamSchema = z.object({
  params: z.object({ id: objectIdSchema, userId: objectIdSchema }),
});
