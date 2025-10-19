/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js to initialize monitoring tools.
 * It must be in the root of the project.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
