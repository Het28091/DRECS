import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { createError } from './errorHandler';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * JWT Authentication Middleware.
 * Extracts the Bearer token from the Authorization header,
 * verifies it using verifyAccessToken(), and attaches req.user.
 * Returns 401 if token is missing, invalid, or expired.
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(createError('Authentication token required', 401));
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    next(createError('Authentication token missing', 401));
    return;
  }

  try {
    const decodedPayload = verifyAccessToken(token);
    const user = await User.findById(decodedPayload.id).select('email role isActive');

    // JWT claims can become stale after an account is deactivated or its role changes.
    // Authorize requests using the current account state instead.
    if (!user || !user.isActive) {
      next(createError('Invalid or expired authentication token', 401));
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    next();
  } catch (_error) {
    next(createError('Invalid or expired authentication token', 401));
  }
};
