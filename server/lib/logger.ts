/**
 * Structured logging with Pino
 *
 * In development: pretty-prints logs with color for readability.
 * In production: outputs JSON for parsing by log aggregators (e.g., Datadog, CloudWatch).
 *
 * Usage:
 *   import { logger } from './logger';
 *
 *   logger.info('User signed in', { userId: user.id });
 *   logger.warn('Rate limit approaching', { remaining: 10 });
 *   logger.error('Database connection failed', { error: err });
 *
 *   // Scoped loggers for modules:
 *   const syncLogger = logger.child({ module: 'sync' });
 *   syncLogger.info('Running weekly sync');
 */

import pino from "pino";

/**
 * Create a singleton logger instance.
 * Pretty-prints in dev, JSON in production.
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  },
  pino.transport({
    target: "pino-pretty",
    options:
      process.env.NODE_ENV === "production"
        ? { colorize: false, singleLine: true }
        : { colorize: true },
  }),
);

export { logger };
