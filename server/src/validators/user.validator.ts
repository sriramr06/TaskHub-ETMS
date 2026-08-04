import { z } from 'zod';
import { UserRole, UserStatus } from '@/constants/enums/user';
import { objectIdSchema } from '@/validators/common.validator';

export const updateMyProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    middleName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    middleName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  }),
});
