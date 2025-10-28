/**
 * Sentry Server-Side Configuration
 *
 * This configuration is used for the Node.js server.
 * It captures errors that occur on the server.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Filter out sensitive data
    beforeSend(event, _hint) {
      // Filter out authentication errors
      if (event.exception?.values?.[0]?.value?.includes("UNAUTHORIZED")) {
        return null;
      }

      // Remove sensitive environment variables
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as Record<string, string>;
        delete env.DATABASE_URL;
        delete env.BETTER_AUTH_SECRET;
        delete env.UPSTASH_REDIS_REST_TOKEN;
        delete env.RESEND_API_KEY;
      }

      // Remove request cookies
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      return event;
    },
  });
} else {
  console.warn("Sentry DSN not configured - error tracking disabled");
}
