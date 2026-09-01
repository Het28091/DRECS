import morgan from 'morgan';
import { env } from '../config/env';

/**
 * HTTP request logger using morgan.
 * Uses 'dev' format in development, 'combined' in production.
 */
export const requestLogger = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
);
