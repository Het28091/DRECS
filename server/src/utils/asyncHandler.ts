import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Wraps an async controller to automatically forward errors to
 * the global error handler via next(error), eliminating try/catch boilerplate.
 *
 * Usage: router.get('/path', asyncHandler(myController));
 */
export const asyncHandler = (fn: AsyncController): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
