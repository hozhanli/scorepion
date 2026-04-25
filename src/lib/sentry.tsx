/**
 * Client-side Sentry error tracking (React Native / Expo)
 *
 * SETUP FOR NEW DEVELOPERS:
 * 1. Create a Sentry.io account and sign in (https://sentry.io)
 * 2. Create two new projects: "scorepion-server" (Node) and "scorepion-client" (React Native)
 * 3. Copy the client project's DSN and add it to your .env.local as EXPO_PUBLIC_SENTRY_DSN=
 * 4. The SDK initializes automatically on app start; in dev, if DSN is missing, Sentry becomes a no-op
 * 5. All errors captured via this module are tagged with user ID (if logged in) for production debugging
 *
 * In production: errors are sampled at 20% to keep quota manageable (production-only)
 * In dev: Sentry is disabled unless you explicitly set EXPO_PUBLIC_SENTRY_DSN
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import React from "react";
import { ErrorBoundary as BaseErrorBoundary } from "@/components/ErrorBoundary";

let initialized = false;

/**
 * Initialize Sentry for React Native.
 * Safe to call multiple times; initializes once.
 * No-op if DSN is not configured (common in dev/CI).
 */
export function initSentryClient(): void {
  if (initialized) return;

  const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // Development mode: no DSN configured, skip Sentry to avoid polluting free tier
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 0.5 : 0.2,
    enableAutoSessionTracking: true,
    environment: __DEV__ ? "development" : "production",
    // Don't capture breadcrumbs that might leak PII
    beforeBreadcrumb: (breadcrumb: any) => {
      // Strip authorization headers from network breadcrumbs
      if (breadcrumb.category === "http" && breadcrumb.data?.["request.headers"]?.Authorization) {
        return null;
      }
      return breadcrumb;
    },
  });

  initialized = true;
}

/**
 * Capture an exception in Sentry with optional context.
 * Silent no-op if Sentry is not initialized.
 */
export function captureError(error: Error | string, context?: Record<string, any>): void {
  if (!initialized) return;

  if (typeof error === "string") {
    Sentry.captureMessage(error, "error");
  } else {
    Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  }
}

/**
 * Capture a message in Sentry.
 * Silent no-op if Sentry is not initialized.
 */
export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set the current user context (called after login).
 * Silent no-op if Sentry is not initialized.
 */
export function setUser(user: { id: string; username: string }): void {
  if (!initialized) return;
  Sentry.setUser({
    id: user.id,
    username: user.username,
  });
}

/**
 * Clear the current user context (called on logout).
 * Silent no-op if Sentry is not initialized.
 */
export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Error boundary that captures errors to Sentry before rendering the fallback.
 * Wraps the app's existing ErrorBoundary and hooks Sentry capture on error.
 */
export function SentryErrorBoundary(props: SentryErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      onError={(error, stackTrace) => {
        captureError(error, { stackTrace });
      }}
    >
      {props.children}
    </BaseErrorBoundary>
  );
}
