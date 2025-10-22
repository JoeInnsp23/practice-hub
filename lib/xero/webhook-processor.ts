/**
 * Xero Webhook Event Processor
 *
 * Processes unprocessed webhook events from the queue
 * - Fetches resource data from Xero API
 * - Updates Practice Hub database (invoices, contacts, etc.)
 * - Forwards events to external webhooks (Make.com, Zapier)
 *
 * Based on original CRM app webhook architecture
 */

import { db } from "@/lib/db";
import { xeroWebhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

export interface XeroWebhookEvent {
  id: string;
  tenantId: string;
  eventId: string;
  eventType: "CREATE" | "UPDATE" | "DELETE";
  eventCategory: string;
  eventDateUtc: Date;
  resourceId: string;
  resourceUrl: string | null;
  xeroTenantId: string;
  processed: boolean;
  processedAt: Date | null;
  processingError: string | null;
  rawPayload: unknown;
  createdAt: Date;
}

/**
 * Process webhook events
 *
 * Fetches unprocessed events and handles them based on category
 * Runs in background worker or on-demand via API
 */
export async function processWebhookEvents(): Promise<{
  processed: number;
  failed: number;
}> {
  let processed = 0;
  let failed = 0;

  try {
    // Fetch unprocessed events (batch of 100)
    const unprocessedEvents = await db
      .select()
      .from(xeroWebhookEvents)
      .where(eq(xeroWebhookEvents.processed, false))
      .limit(100);

    console.log(`Processing ${unprocessedEvents.length} unprocessed webhook events...`);

    for (const event of unprocessedEvents) {
      try {
        // Handle event based on category
        await handleWebhookEvent(event as unknown as XeroWebhookEvent);

        // Mark as processed
        await db
          .update(xeroWebhookEvents)
          .set({ processed: true, processedAt: new Date() })
          .where(eq(xeroWebhookEvents.id, event.id));

        processed++;
      } catch (error) {
        failed++;

        // Log error but don't fail the batch
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await db
          .update(xeroWebhookEvents)
          .set({ processingError: errorMessage })
          .where(eq(xeroWebhookEvents.id, event.id));

        Sentry.captureException(error, {
          tags: { operation: "process_webhook_event", eventCategory: event.eventCategory },
          extra: { eventId: event.eventId, resourceId: event.resourceId },
        });

        console.error(`Failed to process event ${event.eventId}:`, error);
      }
    }

    console.log(`Webhook processing complete: ${processed} processed, ${failed} failed`);

    return { processed, failed };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "processWebhookEvents" },
    });
    console.error("Failed to process webhook events:", error);
    throw error;
  }
}

/**
 * Handle individual webhook event based on category
 */
async function handleWebhookEvent(event: XeroWebhookEvent): Promise<void> {
  console.log(`Handling ${event.eventCategory} event: ${event.eventType} ${event.resourceId}`);

  switch (event.eventCategory) {
    case "INVOICE":
      await handleInvoiceEvent(event);
      break;

    case "CONTACT":
      await handleContactEvent(event);
      break;

    case "PAYMENT":
      await handlePaymentEvent(event);
      break;

    case "BANKTRANSACTION":
      await handleBankTransactionEvent(event);
      break;

    default:
      console.log(`Unsupported event category: ${event.eventCategory}`);
      break;
  }
}

/**
 * Handle INVOICE webhook events
 *
 * - CREATE: New invoice created in Xero → sync to Practice Hub
 * - UPDATE: Invoice updated in Xero → update Practice Hub
 * - DELETE: Invoice deleted in Xero → mark as deleted
 */
async function handleInvoiceEvent(event: XeroWebhookEvent): Promise<void> {
  // TODO: Implement invoice sync logic
  // 1. Fetch invoice data from Xero API using resourceId
  // 2. Map to Practice Hub invoice format
  // 3. Upsert to Practice Hub database
  // 4. Update sync status in integrationSettings

  console.log(`TODO: Handle INVOICE ${event.eventType} for ${event.resourceId}`);
}

/**
 * Handle CONTACT webhook events
 *
 * - CREATE: New contact created in Xero → sync to Practice Hub
 * - UPDATE: Contact updated in Xero → update Practice Hub
 * - DELETE: Contact deleted in Xero → mark as deleted
 */
async function handleContactEvent(event: XeroWebhookEvent): Promise<void> {
  // TODO: Implement contact sync logic
  // 1. Fetch contact data from Xero API using resourceId
  // 2. Map to Practice Hub client format
  // 3. Upsert to Practice Hub database

  console.log(`TODO: Handle CONTACT ${event.eventType} for ${event.resourceId}`);
}

/**
 * Handle PAYMENT webhook events
 *
 * - CREATE: New payment received → update invoice status
 * - UPDATE: Payment updated → update Practice Hub
 * - DELETE: Payment deleted → revert invoice status
 */
async function handlePaymentEvent(event: XeroWebhookEvent): Promise<void> {
  // TODO: Implement payment sync logic
  // 1. Fetch payment data from Xero API using resourceId
  // 2. Update related invoice status
  // 3. Record payment in Practice Hub

  console.log(`TODO: Handle PAYMENT ${event.eventType} for ${event.resourceId}`);
}

/**
 * Handle BANKTRANSACTION webhook events
 *
 * - CREATE: New bank transaction → sync to Practice Hub
 * - UPDATE: Transaction updated → update Practice Hub
 * - DELETE: Transaction deleted → mark as deleted
 */
async function handleBankTransactionEvent(event: XeroWebhookEvent): Promise<void> {
  // TODO: Implement bank transaction sync logic
  // 1. Fetch transaction data from Xero API using resourceId
  // 2. Categorize transaction
  // 3. Record in Practice Hub

  console.log(`TODO: Handle BANKTRANSACTION ${event.eventType} for ${event.resourceId}`);
}
