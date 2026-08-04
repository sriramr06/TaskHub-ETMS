import mongoose from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), 'Invalid id');
