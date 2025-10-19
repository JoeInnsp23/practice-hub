import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  kycVerifications,
  onboardingSessions,
} from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * LEM Verify Webhook Handler
 *
 * This endpoint receives verification results from LEM Verify:
 * 1. Document verification (passport/driving license)
 * 2. Face matching (biometric)
 * 3. Liveness detection (video)
 * 4. AML screening (via LexisNexis)
 * 5. PEP screening
 *
 * Setup Instructions:
 * 1. Deploy this endpoint to production
 * 2. Register URL with LEM Verify: https://app.innspiredaccountancy.com/api/webhooks/lemverify
 * 3. Get API key from LEM Verify dashboard
 * 4. Add LEMVERIFY_WEBHOOK_SECRET to environment variables
 *
 * Error Handling Strategy:
 * - 401 Unauthorized: Invalid/missing signature (security issue, don't retry)
 * - 400 Bad Request: Invalid JSON or missing required fields (don't retry)
 * - 500 Internal Server Error: Database connection failure (LEM Verify should retry)
 * - 200 OK: Successfully processed OR non-critical error (don't retry)
 *
 * This ensures LEM Verify only retries on genuine infrastructure failures,
 * not on data validation issues or expected scenarios (e.g., test webhooks).
 */

interface LemVerifyWebhookEvent {
  id: string; // Verification ID
  clientRef: string; // Our client ID
  status: "pending" | "in_progress" | "completed" | "failed";
  outcome?: "pass" | "fail" | "refer";

  // Document verification
  documentVerification?: {
    verified: boolean;
    documentType: "passport" | "driving_licence";
    extractedData?: Record<string, any>;
  };

  // Biometric verification
  facematch?: {
    result: "pass" | "fail";
    score: number;
  };

  liveness?: {
    result: "pass" | "fail";
    score: number;
  };

  // AML screening
  amlScreening?: {
    status: "clear" | "match" | "pep";
    pepMatch: boolean;
    sanctionsMatch: boolean;
    watchlistMatch: boolean;
    adverseMediaMatch: boolean;
    matches?: Array<{
      type: string;
      name: string;
      score: number;
    }>;
  };

  // URLs
  reportUrl?: string;
  documentUrls?: string[];

  // Alert type (for AML alerts)
  amlAlert?: boolean;

  // Timestamps
  completedAt?: string;
  updatedAt: string;
}

async function handleVerificationCompleted(
  event: LemVerifyWebhookEvent,
): Promise<void> {
  // Find the KYC verification record
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.lemverifyId, event.id))
    .limit(1);

  if (!verification) {
    console.warn("KYC verification not found for LEM Verify ID:", event.id);
    console.warn(
      "This may be a test webhook or a verification from another tenant",
    );
    return; // Not an error - may be test webhook
  }

  // Update verification record with results
  await db
    .update(kycVerifications)
    .set({
      status: event.status,
      outcome: event.outcome,
      documentType: event.documentVerification?.documentType,
      documentVerified: event.documentVerification?.verified || false,
      documentData: event.documentVerification?.extractedData,
      facematchResult: event.facematch?.result,
      facematchScore: event.facematch?.score.toString(),
      livenessResult: event.liveness?.result,
      livenessScore: event.liveness?.score.toString(),
      amlResult: event.amlScreening as any,
      amlStatus: event.amlScreening?.status,
      pepMatch: event.amlScreening?.pepMatch || false,
      sanctionsMatch: event.amlScreening?.sanctionsMatch || false,
      watchlistMatch: event.amlScreening?.watchlistMatch || false,
      adverseMediaMatch: event.amlScreening?.adverseMediaMatch || false,
      reportUrl: event.reportUrl,
      documentsUrl: event.documentUrls as any,
      completedAt: event.completedAt ? new Date(event.completedAt) : new Date(),
      updatedAt: new Date(),
      metadata: event as any,
    })
    .where(eq(kycVerifications.id, verification.id));

  // Auto-approve or reject based on outcome
  if (event.outcome === "pass" && event.amlScreening?.status === "clear") {
    // Update onboarding session to approved
    if (verification.onboardingSessionId) {
      await db
        .update(onboardingSessions)
        .set({
          status: "approved",
          progress: 100,
          actualCompletionDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboardingSessions.id, verification.onboardingSessionId));
    }

    // Update client status to active
    await db
      .update(clients)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, verification.clientId));

    // Update verification with approval
    await db
      .update(kycVerifications)
      .set({
        approvedAt: new Date(),
        approvedBy: null, // Auto-approved
        updatedAt: new Date(),
      })
      .where(eq(kycVerifications.id, verification.id));

    // Log activity
    await db.insert(activityLogs).values({
      tenantId: verification.tenantId,
      entityType: "client",
      entityId: verification.clientId,
      action: "kyc_verification_approved",
      description: "KYC verification passed - client auto-approved",
      userId: null,
      userName: "System",
      metadata: {
        verificationId: verification.id,
        lemverifyId: event.id,
        outcome: event.outcome,
      },
    });
  } else {
    // Update onboarding session to pending manual approval
    if (verification.onboardingSessionId) {
      await db
        .update(onboardingSessions)
        .set({
          status: "pending_approval",
          progress: 90,
          updatedAt: new Date(),
        })
        .where(eq(onboardingSessions.id, verification.onboardingSessionId));
    }

    // Log activity for manual review
    await db.insert(activityLogs).values({
      tenantId: verification.tenantId,
      entityType: "client",
      entityId: verification.clientId,
      action: "kyc_verification_requires_review",
      description:
        "KYC verification requires manual review - alerts or failures detected",
      userId: null,
      userName: "System",
      metadata: {
        verificationId: verification.id,
        lemverifyId: event.id,
        outcome: event.outcome,
        amlStatus: event.amlScreening?.status,
        pepMatch: event.amlScreening?.pepMatch,
        sanctionsMatch: event.amlScreening?.sanctionsMatch,
      },
    });
  }
}

async function handleAMLAlert(event: LemVerifyWebhookEvent) {
  // Find the KYC verification record
  const [verification] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.lemverifyId, event.id))
    .limit(1);

  if (!verification) {
    console.error("KYC verification not found for LEM Verify ID:", event.id);
    return;
  }

  // Log critical alert
  await db.insert(activityLogs).values({
    tenantId: verification.tenantId,
    entityType: "client",
    entityId: verification.clientId,
    action: "kyc_aml_alert",
    description: "AML ALERT: Immediate review required",
    userId: null,
    userName: "System",
    metadata: {
      verificationId: verification.id,
      lemverifyId: event.id,
      amlAlert: event.amlScreening,
      severity: "critical",
    },
  });
}

export async function POST(request: Request) {
  let body: string;
  let event: LemVerifyWebhookEvent;

  try {
    body = await request.text();

    // Verify webhook signature for security
    const signature = request.headers.get("x-lemverify-signature");
    if (!signature) {
      console.error("Missing LEM Verify webhook signature");
      return new Response("Missing signature", { status: 401 });
    }

    const webhookSecret = process.env.LEMVERIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("LEMVERIFY_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Verify signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid LEM Verify webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse webhook event
    try {
      event = JSON.parse(body);
      // Event successfully parsed
    } catch (parseError) {
      console.error("Failed to parse webhook body:", parseError);
      // 400 Bad Request: Invalid JSON (don't retry)
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!event.id || !event.status) {
      console.error("Missing required fields in webhook event");
      // 400 Bad Request: Missing required fields (don't retry)
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Handle different event types
    try {
      if (event.status === "completed") {
        await handleVerificationCompleted(event);
      } else if (event.amlAlert) {
        await handleAMLAlert(event);
      } else {
      }

      // 200 OK: Successfully processed
      return new Response(JSON.stringify({ success: true, processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (dbError: any) {
      console.error("Database error processing webhook:", dbError);

      // Check if it's a critical database error (connection, etc.) vs constraint violation
      const isCriticalError =
        dbError.code === "ECONNREFUSED" ||
        dbError.code === "ETIMEDOUT" ||
        dbError.message?.includes("Connection");

      if (isCriticalError) {
        // 500 Internal Server Error: Database connection issue (should retry)
        return new Response(
          JSON.stringify({ error: "Database connection error", retry: true }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        // 200 OK but log the error: Data issue, not connection (don't retry)
        console.warn(
          "Non-critical database error - webhook processed but not saved:",
          dbError,
        );

        // Log to activity logs if possible
        try {
          if (event.clientRef) {
            await db.insert(activityLogs).values({
              tenantId: "system",
              entityType: "system",
              entityId: event.id,
              action: "webhook_processing_error",
              description: `Failed to process LEM Verify webhook: ${dbError.message}`,
              userId: null,
              userName: "System",
              metadata: {
                error: dbError.message,
                verificationId: event.id,
                eventStatus: event.status,
              },
            });
          }
        } catch (logError) {
          console.error("Failed to log webhook error:", logError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            warning: "Partial processing failure",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }
  } catch (error: any) {
    console.error("Unexpected webhook error:", error);

    // 500 Internal Server Error: Unexpected error (should retry)
    return new Response(
      JSON.stringify({ error: "Internal server error", retry: true }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
