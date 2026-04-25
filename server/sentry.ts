/**
 * Server-side Sentry error tracking (Node / Express)
 *
 * Integrates with Express middleware to capture request context,
 * unhandled exceptions, and manual error reporting.
 *
 * Usage:
 *   import { initSentryServer, sentryRequestHandler, sentryErrorHandler } from './sentry';
 *
 *   // At startup:
 *   initSentryServer();
 *   app.use(sentryRequestHandler());
 *   // ... routes ...
 *   app.use(sentryErrorHandler());
 */

import * as Sentry from "@sentry/node";
import type { Request, Response, NextFunction } from "express";

let initialized = false;

/**
 * Initialize Sentry for Node / Express.
 * Safe to call multiple times; initializes once.
 * No-op if SENTRY_DSN is not configured (common in dev/CI).
 */
export function initSentryServer(): void {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    // Development mode: no DSN configured, skip Sentry
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || "development",
    // Strip authorization and sensitive headers from breadcrumbs
    beforeBreadcrumb: (breadcrumb: any) => {
      if (breadcrumb.category === "http" && breadcrumb.data?.request_headers) {
        const headers = breadcrumb.data.request_headers as Record<string, string>;
        delete headers.Authorization;
        delete headers.authorization;
        delete headers["X-API-Key"];
        delete headers["x-api-key"];
      }
      return breadcrumb;
    },
  });

  initialized = true;
}

/**
 * Express middleware to capture request context.
 * Must be placed early in the middleware stack, before route handlers.
 */
export function sentryRequestHandler() {
  // Sentry v10 auto-instruments Express via `setupExpressErrorHandler` + OpenTelemetry.
  // No separate request handler middleware is needed — Sentry.init() picks up
  // traces automatically. Return a pass-through so the existing wiring keeps working.
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Express error handler middleware to capture exceptions.
 * Must be placed after route handlers and before final error handler.
 */
export function sentryErrorHandler() {
  if (!initialized) {
    return (_err: unknown, _req: Request, _res: Response, next: NextFunction) => next(_err);
  }
  // v10 exposes `setupExpressErrorHandler(app)` — but that takes the app, not
  // returning middleware. For our middleware-chain pattern we manually forward
  // exceptions via `Sentry.captureException` then rethrow.
  return (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
    Sentry.captureException(err);
    next(err);
  };
}

/**
 * Capture an exception in Sentry with optional request context.
 * Silent no-op if Sentry is not initialized.
 */
export function captureError(error: Error, req?: Request): void {
  if (!initialized) return;

  if (req) {
    Sentry.captureException(error, (scope) => {
      scope.setContext("http", {
        method: req.method,
        url: req.originalUrl,
        status: (req as any).statusCode,
      });
      return scope;
    });
  } else {
    Sentry.captureException(error);
  }
}
