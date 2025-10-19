/**
 * Sentry Client-Side Configuration
 *
 * This configuration is used for the browser client.
 * It captures errors that occur in the browser.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 0.0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Filter out authentication errors from being sent to Sentry
      if (event.exception?.values?.[0]?.value?.includes("UNAUTHORIZED")) {
        return null;
      }

      // Remove sensitive data from event
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      return event;
    },
  });
} else {
  console.warn("Sentry DSN not configured - error tracking disabled");
}
