import { z } from 'zod';
import { TaskStatus, TaskPriority, TaskLabel } from '@/constants/enums/task';
import { objectIdSchema } from '@/validators/common.validator';

export const createTaskSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, 'Task title is required'),
      description: z.string().trim().min(1).optional(),
      project: objectIdSchema,
      priority: z.nativeEnum(TaskPriority).optional(),
      labels: z.array(z.nativeEnum(TaskLabel)).optional(),
      assignees: z.array(objectIdSchema).optional(),
      startDate: z.coerce.date().optional(),
      dueDate: z.coerce.date().optional(),
      estimatedHours: z.coerce.number().min(0).optional(),
      dependencies: z.array(objectIdSchema).optional(),
    })
    .refine((data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate, {
      message: 'Due date cannot be before the start date',
      path: ['dueDate'],
    }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    labels: z.array(z.nativeEnum(TaskLabel)).optional(),
    startDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    estimatedHours: z.coerce.number().min(0).optional(),
    actualHours: z.coerce.number().min(0).optional(),
    dependencies: z.array(objectIdSchema).optional(),
    order: z.coerce.number().optional(),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const assignTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    assignees: z.array(objectIdSchema).min(1, 'At least one assignee is required'),
  }),
});

export const addChecklistItemSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(1, 'Checklist item title is required'),
  }),
});

export const updateChecklistItemSchema = z.object({
  params: z.object({ id: objectIdSchema, itemId: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(1).optional(),
    completed: z.coerce.boolean().optional(),
  }),
});

export const checklistItemParamSchema = z.object({
  params: z.object({ id: objectIdSchema, itemId: objectIdSchema }),
});

export const addCommentSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    text: z.string().trim().min(1, 'Comment text is required'),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({ id: objectIdSchema, commentId: objectIdSchema }),
  body: z.object({
    text: z.string().trim().min(1, 'Comment text is required'),
  }),
});

export const commentParamSchema = z.object({
  params: z.object({ id: objectIdSchema, commentId: objectIdSchema }),
});

export const attachmentParamSchema = z.object({
  params: z.object({ id: objectIdSchema, attachmentId: objectIdSchema }),
});
