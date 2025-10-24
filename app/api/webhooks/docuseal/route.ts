import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { autoConvertLeadToClient } from "@/lib/client-portal/auto-convert-lead";
import { db } from "@/lib/db";
import {
  activityLogs,
  clientPortalUsers,
  documentSignatures,
  documents,
  proposalSignatures,
  proposals,
} from "@/lib/db/schema";
import { docusealClient } from "@/lib/docuseal/client";
import { sendSignedConfirmation } from "@/lib/docuseal/email-handler";
import { extractAuditTrail } from "@/lib/docuseal/uk-compliance-fields";
import {
  sendProposalDeclinedTeamEmail,
  sendProposalExpiredTeamEmail,
} from "@/lib/email/send-proposal-email";
import {
  checkSubmissionRateLimit,
  checkTenantRateLimit,
} from "@/lib/rate-limit/webhook";
import { uploadToS3 } from "@/lib/s3/upload";

export const runtime = "nodejs";

/**
 * Helper for consistent Sentry context in DocuSeal webhooks
 */
function sentryCtx(
  tagsOrExtra: Record<string, unknown>,
  extra?: Record<string, unknown>,
) {
  // If extra is provided, first arg is tags; otherwise first arg is extra
  if (extra !== undefined) {
    return {
      tags: { source: "docuseal_webhook", ...tagsOrExtra },
      extra,
    };
  }
  return {
    tags: { source: "docuseal_webhook" },
    extra: tagsOrExtra,
  };
}

/**
 * DocuSeal Webhook Handler
 *
 * Handles signature completion events from DocuSeal:
 * 1. Verifies webhook signature
 * 2. Downloads signed PDF
 * 3. Calculates SHA-256 hash
 * 4. Uploads to S3
 * 5. Stores audit trail
 * 6. Sends confirmation email
 */

/**
 * Check if a signature already exists for the given DocuSeal submission ID.
 * @param submissionId - The DocuSeal submission ID to check
 * @param entityType - Whether this is a proposal or document signature
 * @returns The existing signature record if found, null otherwise
 */
async function findSignatureBySubmissionId(
  submissionId: string,
  entityType: "proposal" | "document",
) {
  if (entityType === "proposal") {
    const existing = await db
      .select()
      .from(proposalSignatures)
      .where(eq(proposalSignatures.docusealSubmissionId, submissionId))
      .limit(1);
    return existing.length > 0 ? existing[0] : null;
  } else {
    const existing = await db
      .select()
      .from(documentSignatures)
      .where(eq(documentSignatures.docusealSubmissionId, submissionId))
      .limit(1);
    return existing.length > 0 ? existing[0] : null;
  }
}

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-docuseal-signature");
    const body = await request.text();

    if (!signature) {
      Sentry.captureException(
        new Error("Missing DocuSeal webhook signature"),
        sentryCtx({
          operation: "webhook_signature_missing",
          endpoint: "/api/webhooks/docuseal",
        }),
      );
      return new Response("Missing signature", { status: 401 });
    }

    const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      Sentry.captureException(
        new Error("DOCUSEAL_WEBHOOK_SECRET not configured"),
        sentryCtx({ operation: "webhook_config_error", severity: "critical" }),
      );
      return new Response("Server configuration error", { status: 500 });
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      Sentry.captureException(
        new Error("Invalid DocuSeal webhook signature"),
        sentryCtx(
          { operation: "webhook_signature_invalid" },
          { providedSignature: `${signature.substring(0, 10)}...` },
        ),
      );
      return new Response("Invalid signature", { status: 401 });
    }

    // Timestamp-based replay protection
    const timestampHeader = request.headers.get("x-docuseal-timestamp");

    if (!timestampHeader) {
      Sentry.captureException(
        new Error("Missing DocuSeal webhook timestamp"),
        sentryCtx({
          operation: "webhook_timestamp_missing",
          endpoint: "/api/webhooks/docuseal",
        }),
      );
      return new Response("Missing timestamp", { status: 400 });
    }

    const timestamp = Number.parseInt(timestampHeader, 10);

    if (Number.isNaN(timestamp) || timestamp <= 0) {
      Sentry.captureException(
        new Error("Invalid DocuSeal webhook timestamp format"),
        sentryCtx(
          { operation: "webhook_timestamp_invalid" },
          { timestampHeader },
        ),
      );
      return new Response("Invalid timestamp format", { status: 400 });
    }

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const requestAge = Math.abs(currentTime - timestamp);

    if (requestAge > 300) {
      Sentry.captureException(
        new Error(
          "DocuSeal webhook request too old (replay attack protection)",
        ),
        sentryCtx(
          { operation: "webhook_replay_rejected" },
          {
            timestamp,
            currentTime,
            requestAge,
            maxAge: 300,
          },
        ),
      );
      return new Response("Request too old", { status: 410 });
    }

    // Parse webhook event
    const event = JSON.parse(body);

    // ✅ RATE LIMITING: Extract identifiers early
    const metadata = event.data?.metadata || {};
    const tenantId = metadata.tenant_id;
    const submissionId = event.data?.id;

    if (!tenantId || !submissionId) {
      Sentry.captureException(
        new Error("Missing tenantId or submissionId in webhook payload"),
        sentryCtx(
          { operation: "webhook_rate_limit_missing_ids" },
          { tenantId, submissionId, eventType: event.event },
        ),
      );
      return new Response("Invalid webhook payload", { status: 400 });
    }

    // ✅ RATE LIMITING: Tenant-level (10 req/sec) → 429 on breach
    const tenantRateLimit = await checkTenantRateLimit(tenantId);
    if (!tenantRateLimit.success) {
      Sentry.captureException(
        new Error("DocuSeal webhook tenant rate limit exceeded"),
        sentryCtx(
          { operation: "webhook_rate_limit", limit_type: "tenant" },
          {
            tenantId,
            submissionId,
            limit: tenantRateLimit.limit,
            reset: tenantRateLimit.reset,
          },
        ),
      );

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded for tenant",
          retryAfter: Math.ceil((tenantRateLimit.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": tenantRateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(tenantRateLimit.reset).toISOString(),
            "Retry-After": Math.ceil(
              (tenantRateLimit.reset - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // ✅ RATE LIMITING: Submission-level (1 req/sec) → 409 on breach
    const submissionRateLimit = await checkSubmissionRateLimit(submissionId);
    if (!submissionRateLimit.success) {
      Sentry.captureException(
        new Error("DocuSeal webhook submission spam detected"),
        sentryCtx(
          { operation: "webhook_rate_limit", limit_type: "submission" },
          {
            tenantId,
            submissionId,
            limit: submissionRateLimit.limit,
            reset: submissionRateLimit.reset,
          },
        ),
      );

      return new Response(
        JSON.stringify({
          error: "Duplicate submission spam detected",
          retryAfter: Math.ceil(
            (submissionRateLimit.reset - Date.now()) / 1000,
          ),
        }),
        {
          status: 409, // Conflict (duplicate spam)
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": submissionRateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(
              submissionRateLimit.reset,
            ).toISOString(),
            "Retry-After": Math.ceil(
              (submissionRateLimit.reset - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // ✅ IDEMPOTENCY GUARD: Check for duplicates before processing
    if (event.event === "submission.completed") {
      // Note: submissionId and metadata already extracted above for rate limiting
      const proposalId = metadata.proposal_id;
      const documentId = metadata.document_id;

      if (submissionId) {
        let existingSignature = null;
        let entityType: "proposal" | "document" | null = null;

        if (proposalId) {
          entityType = "proposal";
          existingSignature = await findSignatureBySubmissionId(
            submissionId,
            "proposal",
          );
        } else if (documentId) {
          entityType = "document";
          existingSignature = await findSignatureBySubmissionId(
            submissionId,
            "document",
          );
        }

        if (existingSignature) {
          // Duplicate detected - return cached response
          Sentry.addBreadcrumb({
            category: "webhook",
            message: "DocuSeal webhook idempotency cache hit",
            level: "info",
            data: { submissionId, entityType, proposalId, documentId },
          });

          Sentry.captureMessage(
            "DocuSeal webhook already processed (idempotent)",
            sentryCtx(
              {
                operation: "webhook_idempotency_cache",
                entity_type: entityType,
              },
              { submissionId, proposalId, documentId },
            ),
          );

          return new Response(JSON.stringify({ ok: true, cached: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // ✅ IDEMPOTENCY GUARD: Check for declined/expired duplicates
    if (
      event.event === "submission.declined" ||
      event.event === "submission.expired"
    ) {
      // Note: metadata already extracted above for rate limiting
      const proposalId = metadata.proposal_id;

      if (proposalId) {
        const [existingProposal] = await db
          .select({ status: proposals.status })
          .from(proposals)
          .where(eq(proposals.id, proposalId))
          .limit(1);

        const expectedStatus =
          event.event === "submission.declined" ? "rejected" : "expired";

        if (existingProposal && existingProposal.status === expectedStatus) {
          Sentry.addBreadcrumb({
            category: "webhook",
            message: `DocuSeal ${event.event} idempotency cache hit`,
            level: "info",
            data: {
              proposalId,
              submissionId: event.data?.id,
              status: expectedStatus,
            },
          });

          Sentry.captureMessage(
            `DocuSeal ${event.event} already processed (idempotent)`,
            sentryCtx(
              {
                operation: `webhook_${expectedStatus}_idempotency`,
                entity_type: "proposal",
              },
              { proposalId, submissionId: event.data?.id },
            ),
          );

          return new Response(JSON.stringify({ ok: true, cached: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // Handle different submission events
    if (event.event === "submission.completed") {
      await handleSubmissionCompleted(event.data);
    } else if (event.event === "submission.declined") {
      await handleSubmissionDeclined(event.data);
    } else if (event.event === "submission.expired") {
      await handleSubmissionExpired(event.data);
    } else {
      Sentry.captureMessage(
        "Unsupported DocuSeal webhook event",
        sentryCtx(
          { operation: "webhook_unsupported_event" },
          { eventType: event.event, submissionId: event.data?.id },
        ),
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    Sentry.captureException(
      error as Error,
      sentryCtx(
        { operation: "webhook_processing_error" },
        { error: String(error) },
      ),
    );
    return new Response("Internal server error", { status: 500 });
  }
}

async function handleSubmissionCompleted(submission: any) {
  const submissionId = submission.id;
  const metadata = submission.metadata || {};

  // Check if this is a proposal or document signature
  const proposalId = metadata.proposal_id;
  const documentId = metadata.document_id;
  const tenantId = metadata.tenant_id;

  if (!tenantId) {
    Sentry.captureException(
      new Error("Missing tenant_id in submission metadata"),
      sentryCtx({ operation: "webhook_metadata_missing" }, { submissionId }),
    );
    throw new Error("Invalid submission metadata");
  }

  // Route to appropriate handler
  if (proposalId) {
    await handleProposalSigning(submission, metadata, proposalId, tenantId);
  } else if (documentId) {
    await handleDocumentSigning(submission, metadata, documentId, tenantId);
  } else {
    Sentry.captureException(
      new Error("No proposal_id or document_id in metadata"),
      sentryCtx(
        { operation: "webhook_entity_id_missing" },
        { submissionId, tenantId },
      ),
    );
    throw new Error("Invalid submission metadata");
  }
}

async function handleProposalSigning(
  submission: any,
  metadata: any,
  proposalId: string,
  tenantId: string,
) {
  const submissionId = submission.id;
  const proposalNumber = metadata.proposal_number;

  // Get proposal details (including leadId for auto-conversion)
  const [proposalDetails] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposalDetails) {
    Sentry.captureException(
      new Error("Proposal not found in webhook handler"),
      sentryCtx(
        { operation: "webhook_entity_not_found" },
        { proposalId, tenantId, submissionId },
      ),
    );
    throw new Error("Proposal not found");
  }

  // Extract audit trail from submission
  const auditTrail = extractAuditTrail(submission);

  // Download signed PDF from DocuSeal
  const signedPdfBuffer = await docusealClient.downloadSignedPdf(submissionId);

  // Calculate SHA-256 hash of signed PDF
  const documentHash = crypto
    .createHash("sha256")
    .update(signedPdfBuffer)
    .digest("hex");

  // Upload signed PDF to S3/MinIO and store key (not public URL)
  const s3Key = `proposals/signed/${submissionId}.pdf`;
  await uploadToS3(signedPdfBuffer, s3Key, "application/pdf");
  // Note: We store the S3 key, not the URL, for secure presigned URL access

  // Check if signer is a portal user
  let portalUserId: string | null = null;
  const portalUser = await db
    .select({ id: clientPortalUsers.id })
    .from(clientPortalUsers)
    .where(eq(clientPortalUsers.email, auditTrail.signerEmail))
    .limit(1);

  if (portalUser.length > 0) {
    portalUserId = portalUser[0].id;
  }

  // Update database in transaction
  await db.transaction(async (tx) => {
    // Update proposal status and DocuSeal fields
    await tx
      .update(proposals)
      .set({
        status: "signed",
        signedAt: new Date(auditTrail.signedAt),
        docusealSignedPdfKey: s3Key, // Store S3 key for secure presigned URL access
        documentHash,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Create signature record with full audit trail
    await tx.insert(proposalSignatures).values({
      tenantId,
      proposalId,
      docusealSubmissionId: submissionId,
      signatureType: "electronic",
      signatureMethod: "docuseal",
      signerName: auditTrail.signerName,
      signerEmail: auditTrail.signerEmail,
      signingCapacity: auditTrail.signingCapacity || null,
      companyInfo: {
        name: auditTrail.companyName,
        number: auditTrail.companyNumber,
        authorityConfirmed: auditTrail.authorityConfirmed,
      },
      auditTrail: {
        ...auditTrail,
        documentHash,
      },
      documentHash,
      signatureData: submissionId, // Store submission ID as signature data reference
      ipAddress: auditTrail.ipAddress || null,
      userAgent: auditTrail.userAgent || null,
      viewedAt: auditTrail.viewedAt ? new Date(auditTrail.viewedAt) : null,
      signedAt: new Date(auditTrail.signedAt),
    });

    // Log activity
    await tx.insert(activityLogs).values({
      tenantId,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal_signed",
      description: portalUserId
        ? `Proposal #${proposalNumber} signed via client portal by ${auditTrail.signerName} (${auditTrail.signerEmail})`
        : `Proposal #${proposalNumber} signed by ${auditTrail.signerName} (${auditTrail.signerEmail})`,
      userId: null, // No internal user ID for signature
      userName: auditTrail.signerName,
      metadata: {
        auditTrail,
        documentHash,
        s3Key, // Store S3 key in metadata (not public URL)
        portalUserId: portalUserId || undefined,
        signedViaPortal: !!portalUserId,
      },
    });
  });

  // Auto-convert lead to client if proposal has a leadId
  if (proposalDetails.leadId) {
    try {
      const conversionResult = await autoConvertLeadToClient(
        proposalId,
        proposalDetails.leadId,
        tenantId,
      );

      if (conversionResult) {
        // Lead successfully converted to client and portal user
        // Additional processing could be added here if needed
      }
    } catch (conversionError) {
      Sentry.captureException(
        conversionError as Error,
        sentryCtx(
          { operation: "lead_conversion_error" },
          { proposalId, leadId: proposalDetails.leadId },
        ),
      );
    }
  }

  // Send confirmation email via Resend
  try {
    await sendSignedConfirmation({
      recipientEmail: auditTrail.signerEmail,
      recipientName: auditTrail.signerName,
      proposalNumber,
      proposalId, // Pass proposalId instead of URL for secure presigned URL generation
      auditTrailSummary: {
        signerName: auditTrail.signerName,
        signedAt: auditTrail.signedAt,
        ipAddress: auditTrail.ipAddress || "Unknown",
        documentHash,
      },
    });
  } catch (emailError) {
    Sentry.captureException(
      emailError as Error,
      sentryCtx(
        { operation: "webhook_email_send_failed" },
        { proposalId, submissionId },
      ),
    );
    // Don't throw - email failure shouldn't break the webhook
  }
}

async function handleDocumentSigning(
  submission: any,
  _metadata: any,
  documentId: string,
  tenantId: string,
) {
  const submissionId = submission.id;

  // Get document details
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) {
    Sentry.captureException(
      new Error("Document not found in webhook handler"),
      sentryCtx(
        { operation: "webhook_document_not_found" },
        { documentId, tenantId, submissionId },
      ),
    );
    throw new Error("Document not found");
  }

  // Extract audit trail from submission
  const auditTrail = extractAuditTrail(submission);

  // Download signed PDF from DocuSeal
  const signedPdfBuffer = await docusealClient.downloadSignedPdf(submissionId);

  // Calculate SHA-256 hash of signed PDF
  const documentHash = crypto
    .createHash("sha256")
    .update(signedPdfBuffer)
    .digest("hex");

  // Upload signed PDF to S3 and store key (not public URL)
  const s3Key = `documents/signed/${tenantId}/${documentId}-${submissionId}.pdf`;
  await uploadToS3(signedPdfBuffer, s3Key, "application/pdf");
  // Note: We store the S3 key, not the URL, for secure presigned URL access

  // Update database in transaction
  await db.transaction(async (tx) => {
    // Update document with signed PDF and status
    await tx
      .update(documents)
      .set({
        signatureStatus: "signed",
        signedPdfKey: s3Key, // Store S3 key for secure presigned URL access
        signedAt: new Date(auditTrail.signedAt),
        signedBy: auditTrail.signerName,
      })
      .where(eq(documents.id, documentId));

    // Create document signature record
    await tx.insert(documentSignatures).values({
      documentId,
      tenantId,
      signerEmail: auditTrail.signerEmail,
      signerName: auditTrail.signerName,
      docusealSubmissionId: submissionId,
      auditTrail,
      documentHash,
      signedPdfUrl: null, // No longer storing public URL
      signedAt: new Date(auditTrail.signedAt),
    });

    // Create activity log
    await tx.insert(activityLogs).values({
      tenantId,
      userId: doc.uploadedById,
      action: "Document Signed",
      entityType: "document",
      entityId: documentId,
      description: `Document "${doc.name}" signed by ${auditTrail.signerName}`,
      metadata: {
        documentId,
        submissionId,
        signerEmail: auditTrail.signerEmail,
        signedAt: auditTrail.signedAt,
      },
    });
  });
}

async function handleSubmissionDeclined(submission: any) {
  const submissionId = submission.id;
  const metadata = submission.metadata || {};
  const proposalId = metadata.proposal_id;
  const tenantId = metadata.tenant_id;

  // ❌ THROW instead of return - ensures proper error handling
  if (!tenantId || !proposalId) {
    Sentry.captureException(
      new Error("Missing metadata in declined webhook"),
      sentryCtx(
        { operation: "webhook_declined_metadata_missing" },
        { submissionId },
      ),
    );
    throw new Error("Missing metadata in declined webhook");
  }

  // Get proposal details
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    Sentry.captureException(
      new Error("Proposal not found for declined event"),
      sentryCtx(
        { operation: "webhook_declined_entity_not_found" },
        { proposalId, submissionId },
      ),
    );
    throw new Error("Proposal not found for declined event");
  }

  // ✅ WRAP IN TRANSACTION for atomic database updates
  await db.transaction(async (tx) => {
    // Update proposal status to rejected
    await tx
      .update(proposals)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Log activity
    await tx.insert(activityLogs).values({
      tenantId,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal_signature_declined",
      description: `Proposal #${proposal.proposalNumber} signature declined by signer`,
      userId: null,
      userName: "DocuSeal Webhook",
      metadata: {
        submissionId,
        declinedAt: new Date().toISOString(),
        signerEmail: metadata.signer_email || "Unknown",
      },
    });
  });

  // ✅ SEND TEAM EMAIL NOTIFICATION (non-blocking - don't throw on email failure)
  try {
    await sendProposalDeclinedTeamEmail({
      proposalId,
      signerEmail: metadata.signer_email || "Unknown",
      declinedAt: new Date(),
    });
  } catch (emailError) {
    Sentry.captureException(
      emailError as Error,
      sentryCtx(
        { operation: "webhook_declined_email_failed" },
        { proposalId, submissionId },
      ),
    );
    // Don't throw - email failure shouldn't break the webhook
  }

  Sentry.captureMessage(
    "Proposal signature declined",
    sentryCtx({ operation: "webhook_declined" }, { proposalId, submissionId }),
  );
}

async function handleSubmissionExpired(submission: any) {
  const submissionId = submission.id;
  const metadata = submission.metadata || {};
  const proposalId = metadata.proposal_id;
  const tenantId = metadata.tenant_id;

  // ❌ THROW instead of return - ensures proper error handling
  if (!tenantId || !proposalId) {
    Sentry.captureException(
      new Error("Missing metadata in expired webhook"),
      sentryCtx(
        { operation: "webhook_expired_metadata_missing" },
        { submissionId },
      ),
    );
    throw new Error("Missing metadata in expired webhook");
  }

  // Get proposal details
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    Sentry.captureException(
      new Error("Proposal not found for expired event"),
      sentryCtx(
        { operation: "webhook_expired_entity_not_found" },
        { proposalId, submissionId },
      ),
    );
    throw new Error("Proposal not found for expired event");
  }

  // ✅ WRAP IN TRANSACTION for atomic database updates
  await db.transaction(async (tx) => {
    // Update proposal status to expired
    await tx
      .update(proposals)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Log activity
    await tx.insert(activityLogs).values({
      tenantId,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal_signature_expired",
      description: `Proposal #${proposal.proposalNumber} signature link expired`,
      userId: null,
      userName: "DocuSeal Webhook",
      metadata: {
        submissionId,
        expiredAt: new Date().toISOString(),
      },
    });
  });

  // ✅ SEND TEAM EMAIL NOTIFICATION (non-blocking - don't throw on email failure)
  try {
    await sendProposalExpiredTeamEmail({
      proposalId,
      expiredAt: new Date(),
    });
  } catch (emailError) {
    Sentry.captureException(
      emailError as Error,
      sentryCtx(
        { operation: "webhook_expired_email_failed" },
        { proposalId, submissionId },
      ),
    );
    // Don't throw - email failure shouldn't break the webhook
  }

  Sentry.captureMessage(
    "Proposal signature expired",
    sentryCtx({ operation: "webhook_expired" }, { proposalId, submissionId }),
  );
}
