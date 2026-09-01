import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { createError } from './errorHandler';
import { UserRole } from '../models/User';

/**
 * Role-Based Authorization Middleware.
 * Accepts one or multiple allowed roles and grants access if req.user.role matches.
 * Returns 401 if unauthenticated, or 403 if role is unauthorized.
 *
 * Usage:
 *   router.get('/protected', authenticate, roleGuard('authority', 'admin'), controller);
 */
export const roleGuard = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Unauthorized — Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createError(
          `Forbidden — Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          403,
        ),
      );
    }

    next();
  };
};
