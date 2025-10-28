/**
 * Email Queue Processor
 *
 * Background worker that processes pending emails from the email queue.
 * Implements retry logic, rate limiting, and respects user notification preferences.
 *
 * Features (FR32: AC8):
 * - Processes pending emails in batches
 * - Sends emails via Resend API
 * - Implements retry logic with exponential backoff
 * - Respects user notification preferences (Story 6.1)
 * - Handles rate limiting (429 errors)
 * - Updates queue status (sent/failed/bounced)
 */

import * as Sentry from "@sentry/nextjs";
import { and, eq, lte, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailQueue, userSettings, users } from "@/lib/db/schema";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "Practice Hub <noreply@notify.innspiredaccountancy.com>";

/**
 * Email queue processing options
 */
export interface QueueProcessorOptions {
  /** Maximum number of emails to process in one batch (default: 100) */
  batchSize?: number;
  /** Whether to respect user notification preferences (default: true) */
  respectNotificationPreferences?: boolean;
  /** Delay between emails in milliseconds to avoid rate limits (default: 100ms) */
  sendDelay?: number;
}

/**
 * Result of processing a single email
 */
interface ProcessResult {
  emailId: string;
  success: boolean;
  error?: string;
  shouldRetry: boolean;
}

/**
 * Calculates exponential backoff delay for retries
 *
 * @param attemptNumber - Current attempt number (0-indexed)
 * @returns Delay in milliseconds (5min, 15min, 30min)
 */
function calculateRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 5min, 15min, 30min
  const baseDelay = 5 * 60 * 1000; // 5 minutes
  return baseDelay * 3 ** attemptNumber;
}

/**
 * Checks if user has email notifications enabled
 *
 * Integrates with Story 6.1 notification preferences
 *
 * @param tenantId - Tenant ID
 * @param recipientEmail - Recipient's email address
 * @returns True if email notifications are enabled
 */
async function checkNotificationPreferences(
  tenantId: string,
  recipientEmail: string,
): Promise<boolean> {
  try {
    // Find user by email and tenant
    const user = await db.query.users.findFirst({
      where: and(eq(users.tenantId, tenantId), eq(users.email, recipientEmail)),
    });

    // If no user found, allow email (fail open for external recipients)
    if (!user) {
      return true;
    }

    // Query user settings
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    });

    // If no settings found, default to allowing email
    if (!settings) {
      return true;
    }

    // Check emailNotifications preference (default: true)
    return settings.emailNotifications !== false;
  } catch (error) {
    // If preference check fails, default to allowing email (fail open)
    console.error("Error checking notification preferences:", error);
    return true;
  }
}

/**
 * Sends a single email from the queue
 *
 * @param email - Email queue record
 * @param options - Processing options
 * @returns Processing result
 */
async function processEmail(
  email: typeof emailQueue.$inferSelect,
  options: QueueProcessorOptions,
): Promise<ProcessResult> {
  const { respectNotificationPreferences = true } = options;

  try {
    // Check notification preferences if enabled
    if (respectNotificationPreferences) {
      const allowEmail = await checkNotificationPreferences(
        email.tenantId,
        email.recipientEmail,
      );

      if (!allowEmail) {
        // User has disabled email notifications, skip sending
        await db
          .update(emailQueue)
          .set({
            status: "failed",
            errorMessage: "User has disabled email notifications",
            sentAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));

        return {
          emailId: email.id,
          success: false,
          error: "Notifications disabled",
          shouldRetry: false,
        };
      }
    }

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email.recipientEmail,
      subject: email.subject,
      html: email.bodyHtml,
      text: email.bodyText ?? undefined,
    });

    if (error) {
      // Handle Resend API errors
      if (error.name === "validation_error") {
        // Invalid email address - mark as bounced, don't retry
        await db
          .update(emailQueue)
          .set({
            status: "bounced",
            errorMessage: `Invalid email: ${error.message}`,
            sentAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));

        return {
          emailId: email.id,
          success: false,
          error: error.message,
          shouldRetry: false,
        };
      }

      // Other errors - mark as failed, will retry
      throw new Error(error.message);
    }

    // Success - update queue record
    await db
      .update(emailQueue)
      .set({
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
      })
      .where(eq(emailQueue.id, email.id));

    return {
      emailId: email.id,
      success: true,
      shouldRetry: false,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Capture error in Sentry (per CLAUDE.md error policy)
    Sentry.captureException(error, {
      tags: {
        operation: "email_queue_processor",
        emailId: email.id,
      },
      extra: {
        tenantId: email.tenantId,
        recipientEmail: email.recipientEmail,
        attempts: email.attempts,
      },
    });

    // Check if we should retry
    const shouldRetry = email.attempts < email.maxAttempts;

    if (shouldRetry) {
      // Increment attempts and schedule retry
      const nextSendAt = new Date(
        Date.now() + calculateRetryDelay(email.attempts),
      );

      await db
        .update(emailQueue)
        .set({
          attempts: email.attempts + 1,
          errorMessage,
          sendAt: nextSendAt,
        })
        .where(eq(emailQueue.id, email.id));
    } else {
      // Max retries exceeded - mark as failed
      await db
        .update(emailQueue)
        .set({
          status: "failed",
          errorMessage: `Max retries exceeded: ${errorMessage}`,
          sentAt: new Date(),
        })
        .where(eq(emailQueue.id, email.id));
    }

    return {
      emailId: email.id,
      success: false,
      error: errorMessage,
      shouldRetry,
    };
  }
}

/**
 * Processes pending emails from the queue
 *
 * Main entry point for the queue processor.
 * Should be called periodically (e.g., every 60 seconds) by a background worker.
 *
 * @param options - Processing options
 * @returns Processing summary
 *
 * @example
 * ```typescript
 * // Run every 60 seconds
 * setInterval(async () => {
 *   const result = await processEmailQueue({ batchSize: 100 });
 *   console.log(`Processed ${result.processed} emails, ${result.sent} sent, ${result.failed} failed`);
 * }, 60000);
 * ```
 */
export async function processEmailQueue(
  options: QueueProcessorOptions = {},
): Promise<{
  processed: number;
  sent: number;
  failed: number;
  retrying: number;
}> {
  const { batchSize = 100, sendDelay = 100 } = options;

  try {
    // Query pending emails that are ready to send
    const pendingEmails = await db.query.emailQueue.findMany({
      where: and(
        eq(emailQueue.status, "pending"),
        lte(emailQueue.sendAt, sql`NOW()`),
      ),
      limit: batchSize,
      orderBy: (emailQueue, { asc }) => [asc(emailQueue.sendAt)],
    });

    if (pendingEmails.length === 0) {
      return { processed: 0, sent: 0, failed: 0, retrying: 0 };
    }

    console.log(`Processing ${pendingEmails.length} pending emails...`);

    // Process emails with delay between sends to avoid rate limits
    const results: ProcessResult[] = [];

    for (const email of pendingEmails) {
      const result = await processEmail(email, options);
      results.push(result);

      // Add delay between sends to avoid rate limiting
      if (sendDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, sendDelay));
      }
    }

    // Calculate summary
    const summary = {
      processed: results.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success && !r.shouldRetry).length,
      retrying: results.filter((r) => r.shouldRetry).length,
    };

    console.log(
      `Email queue processing complete: ${summary.sent} sent, ${summary.failed} failed, ${summary.retrying} retrying`,
    );

    return summary;
  } catch (error) {
    // Capture queue processing errors
    Sentry.captureException(error, {
      tags: { operation: "email_queue_processor" },
    });

    console.error("Error processing email queue:", error);
    throw error;
  }
}

/**
 * Queues an email for sending
 *
 * Helper function to add emails to the queue
 *
 * @param params - Email parameters
 * @returns Created email queue record
 */
export async function queueEmail(params: {
  tenantId: string;
  emailTemplateId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  variables?: Record<string, unknown> | null;
  sendAt?: Date;
  maxAttempts?: number;
}): Promise<typeof emailQueue.$inferSelect> {
  const [queuedEmail] = await db
    .insert(emailQueue)
    .values({
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      emailTemplateId: params.emailTemplateId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      subject: params.subject,
      bodyHtml: params.bodyHtml,
      bodyText: params.bodyText,
      variables: params.variables,
      status: "pending",
      sendAt: params.sendAt ?? new Date(),
      attempts: 0,
      maxAttempts: params.maxAttempts ?? 3,
    })
    .returning();

  return queuedEmail;
}
