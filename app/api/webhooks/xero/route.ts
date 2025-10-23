/**
 * Xero Webhook Receiver
 *
 * Receives and stores webhook events from Xero
 * - Signature validation (HMAC-SHA256)
 * - Idempotent event storage
 * - Async event processing
 *
 * Based on original CRM app webhook architecture
 */

import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrationSettings, xeroWebhookEvents } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute timeout

/**
 * Xero webhook event structure
 */
interface XeroWebhookPayload {
  events: Array<{
    resourceUrl: string;
    resourceId: string;
    eventDateUtc: string;
    eventType: "CREATE" | "UPDATE" | "DELETE";
    eventCategory:
      | "INVOICE"
      | "CONTACT"
      | "PAYMENT"
      | "BANKTRANSACTION"
      | "ACCOUNT";
    tenantId: string; // Xero tenant/organisation ID
    tenantType: string;
    eventId: string; // Unique event ID for idempotency
  }>;
  lastEventSequence: number;
  firstEventSequence: number;
  entropy: string;
}

/**
 * Get tenant ID from Xero tenant ID
 * Looks up the Practice Hub tenant that has this Xero organisation connected
 */
async function getTenantIdFromXeroTenantId(
  xeroTenantId: string,
): Promise<string | null> {
  try {
    const settings = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.integrationType, "xero"))
      .limit(100);

    // Parse credentials to find matching Xero tenant
    for (const setting of settings) {
      if (setting.credentials) {
        try {
          // For now, we assume credentials contain selectedTenantId
          // This will need to be decrypted in production
          const config = setting.config as Record<string, unknown>;
          if (config?.selectedTenantId === xeroTenantId) {
            return setting.tenantId;
          }
        } catch (error) {}
      }
    }

    return null;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "getTenantIdFromXeroTenantId" },
      extra: { xeroTenantId },
    });
    return null;
  }
}

/**
 * POST /api/webhooks/xero
 *
 * Receives webhook events from Xero
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-xero-signature");

    // Validate signature
    const webhookKey = process.env.XERO_WEBHOOK_KEY;

    if (!webhookKey) {
      console.error("XERO_WEBHOOK_KEY not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }

    if (!signature) {
      console.error("Missing x-xero-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac("sha256", webhookKey)
      .update(body)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse payload
    let payload: XeroWebhookPayload;
    try {
      payload = JSON.parse(body) as XeroWebhookPayload;
    } catch (error) {
      console.error("Failed to parse webhook payload:", error);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Store events (idempotent)
    let storedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const event of payload.events) {
      try {
        // Get Practice Hub tenant ID from Xero tenant ID
        const tenantId = await getTenantIdFromXeroTenantId(event.tenantId);

        if (!tenantId) {
          console.warn(
            `No tenant found for Xero tenant ${event.tenantId}, skipping event`,
          );
          skippedCount++;
          continue;
        }

        // Insert event (idempotent - skip if eventId already exists)
        await db
          .insert(xeroWebhookEvents)
          .values({
            tenantId,
            eventId: event.eventId,
            eventType: event.eventType,
            eventCategory: event.eventCategory,
            eventDateUtc: new Date(event.eventDateUtc),
            resourceId: event.resourceId,
            resourceUrl: event.resourceUrl,
            xeroTenantId: event.tenantId,
            processed: false,
            rawPayload: payload,
          })
          .onConflictDoNothing();

        storedCount++;
      } catch (error) {
        errorCount++;
        Sentry.captureException(error, {
          tags: { operation: "store_xero_webhook_event" },
          extra: { eventId: event.eventId, eventCategory: event.eventCategory },
        });
        console.error(`Failed to store event ${event.eventId}:`, error);
      }
    }

    console.log(
      `Xero webhook received: ${storedCount} stored, ${skippedCount} skipped, ${errorCount} errors`,
    );

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({
      received: true,
      storedCount,
      skippedCount,
      errorCount,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "xero_webhook_receiver" },
    });
    console.error("Xero webhook handler error:", error);

    // Return 500 to trigger Xero retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
