import mongoose from 'mongoose';
import { z } from 'zod';
import { UserRole } from '@/constants/enums/user';
import { EmploymentType, EmploymentStatus } from '@/constants/enums/employee';

const objectId = z.string().refine((val) => mongoose.isValidObjectId(val), 'Invalid id');

const addressSchema = z.object({
  line1: z.string().trim().optional(),
  line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1, 'Emergency contact name is required'),
  relation: z.string().trim().min(1, 'Emergency contact relation is required'),
  phone: z.string().trim().min(1, 'Emergency contact phone is required'),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().trim().min(1, 'First name is required'),
    middleName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1, 'Last name is required'),
    phone: z.string().trim().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    department: z.string().trim().min(1, 'Department is required'),
    designation: z.string().trim().min(1, 'Designation is required'),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
    reportingManager: objectId.optional(),
    joiningDate: z.coerce.date({ required_error: 'Joining date is required' }),
    dateOfBirth: z.coerce.date().optional(),
    address: addressSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
    skills: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    department: z.string().trim().min(1).optional(),
    designation: z.string().trim().min(1).optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
    reportingManager: objectId.optional(),
    joiningDate: z.coerce.date().optional(),
    dateOfBirth: z.coerce.date().optional(),
    address: addressSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
    skills: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
