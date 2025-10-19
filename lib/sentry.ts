/**
 * Sentry Error Tracking Utilities
 *
 * Custom helpers for error tracking and monitoring with Sentry.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error with additional context
 *
 * @param error - The error to capture
 * @param context - Additional context about the error
 */
export function captureError(
  error: Error,
  context?: Record<string, any>
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error("Error (Sentry not configured):", error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message with a severity level
 *
 * @param message - The message to capture
 * @param level - The severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
}

/**
 * Set user context for error tracking
 *
 * @param userId - The user's ID
 * @param email - The user's email
 * @param tenantId - The tenant ID
 * @param role - The user's role
 */
export function setUserContext(
  userId: string,
  email: string,
  tenantId: string,
  role?: string
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: userId,
    email,
    tenant: tenantId,
    role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 *
 * @param message - Description of the action
 * @param category - Category of the action
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Start a new transaction for performance monitoring
 *
 * @param name - Transaction name
 * @param op - Operation type
 */
export function startTransaction(name: string, op: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return null;
  }

  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Capture tRPC error with procedure context
 *
 * @param error - The error that occurred
 * @param path - The tRPC procedure path
 * @param input - The input that caused the error
 */
export function captureTRPCError(
  error: Error,
  path: string,
  input?: unknown
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error(`tRPC Error [${path}]:`, error, input);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      trpc: {
        path,
        input: input ? JSON.stringify(input) : undefined,
      },
    },
    tags: {
      trpc_path: path,
    },
  });
}
