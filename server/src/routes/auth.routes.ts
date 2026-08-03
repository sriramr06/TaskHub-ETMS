import { Router } from 'express';
import { protect } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { authLimiter } from '@/middlewares/rateLimiter';
import { registerSchema, loginSchema, changePasswordSchema } from '@/validators/auth.validator';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
} from '@/controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
