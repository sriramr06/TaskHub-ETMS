import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { UserRole } from '@/constants/enums/user';
import { Permission } from '@/constants/enums/permissions';
import { hasPermission } from '@/constants/rolesPermissions';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};
