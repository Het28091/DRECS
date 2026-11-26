import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error-handling middleware.
 * Must be registered last with app.use() in index.ts.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const conflict = err.name === 'VersionError' || (err as any).code === 11000;
  const malformed = ['ValidationError', 'CastError', 'SyntaxError'].includes(err.name);
  const statusCode = conflict ? 409 : malformed ? 400 : err.statusCode ?? 500;
  const message = conflict ? 'This record changed or already exists. Refresh and try again.' : statusCode >= 500 ? 'Something went wrong. Please try again.' : malformed ? 'Invalid request data' : err.message || 'Request failed';

  console.error(`[${req.method}] ${req.path} → ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Factory to create a structured operational error.
 */
export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
