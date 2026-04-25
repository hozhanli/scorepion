/**
 * ErrorToast imperative API — fire error notifications from anywhere.
 *
 * This is a module-level event emitter that doesn't require React context.
 * Works from API clients, catch blocks, and non-React services.
 *
 * Usage:
 *   import { showErrorToast, dismissErrorToast } from '@/lib/error-toast';
 *
 *   try {
 *     // ...
 *   } catch (error) {
 *     showErrorToast({
 *       title: "Prediction didn't save",
 *       message: "Check your connection and try again",
 *       retry: () => submitPrediction(...),
 *     });
 *   }
 */

import { captureError } from "@/lib/sentry";

export interface ErrorToastOptions {
  /** Required: Title text (e.g. "Prediction didn't save") */
  title: string;
  /** Optional: Description or message body */
  message?: string;
  /** Optional: Retry handler — if present, renders a Retry button */
  retry?: () => void;
  /** Duration before auto-dismiss (default: 4000ms) */
  durationMs?: number;
  /** Deduplication ID — same ID replaces existing toast */
  id?: string;
  /** Optional: The underlying error object (for Sentry) */
  error?: Error;
  /** Optional: If true, don't send to Sentry (expected failures like 401) */
  skipSentry?: boolean;
}

interface QueuedError extends ErrorToastOptions {
  id: string;
}

/**
 * Type for subscribers to error toast events
 */
type ErrorToastSubscriber = (queue: QueuedError[]) => void;

/**
 * Module-level state: error queue + subscribers
 */
let errorQueue: QueuedError[] = [];
let subscribers: Set<ErrorToastSubscriber> = new Set();
let idCounter = 0;

/**
 * Internal: Notify all subscribers of queue changes
 */
function notifySubscribers() {
  subscribers.forEach((subscriber) => {
    subscriber([...errorQueue]);
  });
}

/**
 * Show an error toast. If an error with the same ID already exists, it replaces it.
 * Max 3 visible at once; older ones are kept in queue.
 * Also captures to Sentry unless skipSentry is true or error is not provided.
 */
export function showErrorToast(options: ErrorToastOptions): string {
  const id = options.id || `error-${idCounter++}`;

  // Capture to Sentry if we have an error and it's not marked as expected
  if (options.error && !options.skipSentry) {
    captureError(options.error, {
      title: options.title,
      message: options.message,
    });
  }

  // Remove any existing error with this ID (for deduplication)
  errorQueue = errorQueue.filter((e) => e.id !== id);

  // Add new error to queue
  errorQueue.push({
    ...options,
    id,
  });

  // Keep max 3 in queue (we display them at the bottom, stacked)
  if (errorQueue.length > 3) {
    errorQueue = errorQueue.slice(-3);
  }

  notifySubscribers();
  return id;
}

/**
 * Dismiss a specific error by ID, or dismiss the oldest if no ID given.
 */
export function dismissErrorToast(id?: string): void {
  if (id) {
    errorQueue = errorQueue.filter((e) => e.id !== id);
  } else if (errorQueue.length > 0) {
    // Remove the oldest (first in queue)
    errorQueue = errorQueue.slice(1);
  }
  notifySubscribers();
}

/**
 * Clear all errors from the queue.
 */
export function dismissAllErrorToasts(): void {
  errorQueue = [];
  notifySubscribers();
}

/**
 * Internal: Subscribe to error queue changes.
 * Used by <ErrorToastHost /> to listen for updates.
 */
export function subscribeToErrors(callback: ErrorToastSubscriber): () => void {
  subscribers.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
}
