#!/usr/bin/env tsx
/**
 * Email Queue Background Worker
 *
 * This script processes pending emails from the email queue.
 * It should be run periodically (e.g., every 60 seconds) via cron or a process manager.
 *
 * Usage:
 *   - Manual: pnpm tsx scripts/process-email-queue.ts
 *   - Cron: * * * * * cd /path/to/app && pnpm tsx scripts/process-email-queue.ts
 *   - PM2: pm2 start scripts/process-email-queue.ts --cron "* * * * *"
 *
 * Features:
 *   - Processes pending emails in batches
 *   - Respects user notification preferences
 *   - Implements retry logic with exponential backoff
 *   - Rate limiting to avoid hitting Resend API limits
 *   - Comprehensive error logging via Sentry
 */

import * as Sentry from "@sentry/nextjs";
import { processEmailQueue } from "@/lib/email/queue-processor";

// Initialize Sentry for background worker error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});

/**
 * Main entry point for email queue processing
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log(
      `[${new Date().toISOString()}] Starting email queue processing...`,
    );

    // Process email queue with default options
    const result = await processEmailQueue({
      batchSize: 100, // Process up to 100 emails per run
      respectNotificationPreferences: true, // Honor user settings
      sendDelay: 100, // 100ms delay between emails to avoid rate limits
    });

    const duration = Date.now() - startTime;

    console.log(
      `[${new Date().toISOString()}] Email queue processing complete:`,
    );
    console.log(`  - Processed: ${result.processed} emails`);
    console.log(`  - Sent: ${result.sent} emails`);
    console.log(`  - Failed: ${result.failed} emails`);
    console.log(`  - Retrying: ${result.retrying} emails`);
    console.log(`  - Duration: ${duration}ms`);

    // Exit with success
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(
      `[${new Date().toISOString()}] Email queue processing failed after ${duration}ms:`,
      error,
    );

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        script: "process-email-queue",
        duration: duration.toString(),
      },
    });

    // Exit with error code
    process.exit(1);
  }
}

// Run the main function
main();
