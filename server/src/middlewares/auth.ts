import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { verifyAccessToken } from '@/utils/jwt';
import { User } from '@/models/User';
import { UserStatus } from '@/constants/enums/user';
import { env } from '@/config/env';

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return req.cookies?.[env.COOKIE_NAME] as string | undefined;
};

export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.id);

  if (!user) {
    throw new AppError('User belonging to this token no longer exists.', 401);
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError('Your account is not active. Contact an administrator.', 403);
  }

  req.user = user;
  next();
});
