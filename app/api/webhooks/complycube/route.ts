import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amlChecks, onboardingSessions, activityLogs, clients } from "@/lib/db/schema";
import { complycubeClient } from "@/lib/aml/complycube-client";

export const runtime = "nodejs";

/**
 * ComplyCube Webhook Handler
 *
 * Handles async AML check results from ComplyCube:
 * 1. Verifies webhook signature
 * 2. Updates AML check status
 * 3. Updates onboarding session status
 * 4. Sends notifications to staff if manual review needed
 * 5. Sends email to client on approval/rejection
 */

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-complycube-signature");
    const body = await request.text();

    if (!signature) {
      console.error("Missing ComplyCube webhook signature");
      return new Response("Missing signature", { status: 401 });
    }

    const webhookSecret = process.env.COMPLYCUBE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("COMPLYCUBE_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid ComplyCube webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse webhook event
    const event = JSON.parse(body);
    console.log("ComplyCube webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "check.completed":
        await handleCheckCompleted(event.data);
        break;
      case "check.failed":
        await handleCheckFailed(event.data);
        break;
      case "document.verified":
        await handleDocumentVerified(event.data);
        break;
      default:
        console.log("Unhandled webhook event type:", event.type);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("ComplyCube webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

async function handleCheckCompleted(checkData: any) {
  const checkId = checkData.id;
  const clientId = checkData.clientId;
  const outcome = checkData.outcome; // "clear" | "consider" | "attention"
  const riskLevel = checkData.riskLevel; // "low" | "medium" | "high"

  console.log("AML check completed:", {
    checkId,
    outcome,
    riskLevel,
  });

  // Find our AML check record
  const [amlCheck] = await db
    .select()
    .from(amlChecks)
    .where(eq(amlChecks.checkId, checkId))
    .limit(1);

  if (!amlCheck) {
    console.error("AML check not found in database:", checkId);
    return;
  }

  // Download compliance report
  let reportUrl: string | null = null;
  try {
    const reportBuffer = await complycubeClient.downloadReport(checkId);
    // TODO: Upload to S3 and store URL
    // For now, we'll skip this and staff can download from ComplyCube
    reportUrl = `https://complycube.com/checks/${checkId}/report`;
  } catch (error) {
    console.error("Failed to download compliance report:", error);
  }

  // Determine approval status based on outcome and risk level
  let approvalStatus: "pending_approval" | "approved" | "rejected" = "pending_approval";
  if (outcome === "clear" && riskLevel === "low") {
    approvalStatus = "approved";
  } else if (outcome === "attention" || riskLevel === "high") {
    // Automatic rejection for high-risk cases
    approvalStatus = "rejected";
  }

  // Update AML check record
  await db
    .update(amlChecks)
    .set({
      status: "complete",
      riskLevel,
      outcome,
      reportUrl,
      checkedAt: new Date(),
    })
    .where(eq(amlChecks.id, amlCheck.id));

  // Update onboarding session status
  if (amlCheck.onboardingSessionId) {
    let onboardingStatus: "pending_approval" | "approved" | "rejected";

    if (approvalStatus === "approved") {
      onboardingStatus = "approved";
    } else if (approvalStatus === "rejected") {
      onboardingStatus = "rejected";
    } else {
      onboardingStatus = "pending_approval";
    }

    await db
      .update(onboardingSessions)
      .set({
        status: onboardingStatus,
      })
      .where(eq(onboardingSessions.id, amlCheck.onboardingSessionId));

    // Update client status
    const [session] = await db
      .select()
      .from(onboardingSessions)
      .where(eq(onboardingSessions.id, amlCheck.onboardingSessionId))
      .limit(1);

    if (session) {
      const clientStatus = onboardingStatus === "approved" ? "active" : "onboarding";

      await db
        .update(clients)
        .set({
          status: clientStatus,
        })
        .where(eq(clients.id, session.clientId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId: amlCheck.tenantId,
        entityType: "client",
        entityId: session.clientId,
        action: "aml_check_completed",
        description: `AML check ${onboardingStatus}: Risk level ${riskLevel}, Outcome: ${outcome}`,
        userId: null,
        userName: "System (ComplyCube)",
        metadata: {
          checkId,
          outcome,
          riskLevel,
          approvalStatus,
        },
      });
    }
  }

  // Send notification emails based on status
  if (approvalStatus === "approved") {
    // TODO: Send welcome email to client
    console.log("Client approved - send welcome email");
  } else if (approvalStatus === "rejected") {
    // TODO: Send rejection email to client
    console.log("Client rejected - send rejection email");
  } else {
    // TODO: Send notification to staff for manual review
    console.log("Manual review required - notify staff");
  }

  console.log("AML check processing completed");
}

async function handleCheckFailed(checkData: any) {
  const checkId = checkData.id;
  const error = checkData.error;

  console.error("AML check failed:", {
    checkId,
    error,
  });

  // Find and update AML check record
  await db
    .update(amlChecks)
    .set({
      status: "failed",
      checkedAt: new Date(),
    })
    .where(eq(amlChecks.checkId, checkId));

  // TODO: Notify staff of failure
  console.log("AML check failed - notify staff");
}

async function handleDocumentVerified(documentData: any) {
  const documentId = documentData.id;
  const outcome = documentData.outcome;

  console.log("Document verified:", {
    documentId,
    outcome,
  });

  // TODO: Update document verification status
  // This would tie into the onboarding document upload flow
}
