import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
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
import { uploadToS3 } from "@/lib/s3/upload";

export const runtime = "nodejs";

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
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-docuseal-signature");
    const body = await request.text();

    if (!signature) {
      Sentry.captureException(new Error("Missing DocuSeal webhook signature"), {
        tags: { operation: "webhook_signature_missing", endpoint: "/api/webhooks/docuseal" },
      });
      return new Response("Missing signature", { status: 401 });
    }

    const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      Sentry.captureException(new Error("DOCUSEAL_WEBHOOK_SECRET not configured"), {
        tags: { operation: "webhook_config_error", severity: "critical" },
      });
      return new Response("Server configuration error", { status: 500 });
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      Sentry.captureException(new Error("Invalid DocuSeal webhook signature"), {
        tags: { operation: "webhook_signature_invalid" },
        extra: { providedSignature: signature.substring(0, 10) + "..." },
      });
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse webhook event
    const event = JSON.parse(body);

    // Handle different submission events
    if (event.event === "submission.completed") {
      await handleSubmissionCompleted(event.data);
    } else if (event.event === "submission.declined") {
      await handleSubmissionDeclined(event.data);
    } else if (event.event === "submission.expired") {
      await handleSubmissionExpired(event.data);
    } else {
      Sentry.captureMessage("Unsupported DocuSeal webhook event", {
        tags: { operation: "webhook_unsupported_event" },
        extra: { eventType: event.event, submissionId: event.data?.id },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { operation: "webhook_processing_error" },
      extra: { error: String(error) },
    });
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
    Sentry.captureException(new Error("Missing tenant_id in submission metadata"), {
      tags: { operation: "webhook_metadata_missing" },
      extra: { submissionId },
    });
    throw new Error("Invalid submission metadata");
  }

  // ✅ IDEMPOTENCY CHECK: Check if already processed
  if (proposalId) {
    const existingSignature = await db
      .select()
      .from(proposalSignatures)
      .where(eq(proposalSignatures.docusealSubmissionId, submissionId))
      .limit(1);

    if (existingSignature.length > 0) {
      Sentry.captureMessage("DocuSeal webhook already processed (cached)", {
        tags: { operation: "webhook_idempotency_cache" },
        extra: { submissionId, proposalId },
      });
      return; // Already processed - idempotent response
    }
  } else if (documentId) {
    const existingSignature = await db
      .select()
      .from(documentSignatures)
      .where(eq(documentSignatures.docusealSubmissionId, submissionId))
      .limit(1);

    if (existingSignature.length > 0) {
      Sentry.captureMessage("DocuSeal webhook already processed (cached)", {
        tags: { operation: "webhook_idempotency_cache" },
        extra: { submissionId, documentId },
      });
      return; // Already processed - idempotent response
    }
  }

  // Route to appropriate handler
  if (proposalId) {
    await handleProposalSigning(submission, metadata, proposalId, tenantId);
  } else if (documentId) {
    await handleDocumentSigning(submission, metadata, documentId, tenantId);
  } else {
    Sentry.captureException(new Error("No proposal_id or document_id in metadata"), {
      tags: { operation: "webhook_entity_id_missing" },
      extra: { submissionId, tenantId },
    });
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
    Sentry.captureException(new Error("Proposal not found in webhook handler"), {
      tags: { operation: "webhook_entity_not_found" },
      extra: { proposalId, tenantId, submissionId },
    });
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

  // Upload signed PDF to S3/MinIO
  const signedPdfUrl = await uploadToS3(
    signedPdfBuffer,
    `proposals/signed/${submissionId}.pdf`,
    "application/pdf",
  );

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
        docusealSignedPdfUrl: signedPdfUrl,
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
        signedPdfUrl,
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
      Sentry.captureException(conversionError as Error, {
        tags: { operation: "lead_conversion_error" },
        extra: { proposalId, leadId: proposalDetails.leadId },
      });
    }
  }

  // Send confirmation email via Resend
  try {
    await sendSignedConfirmation({
      recipientEmail: auditTrail.signerEmail,
      recipientName: auditTrail.signerName,
      proposalNumber,
      signedPdfUrl,
      auditTrailSummary: {
        signerName: auditTrail.signerName,
        signedAt: auditTrail.signedAt,
        ipAddress: auditTrail.ipAddress || "Unknown",
        documentHash,
      },
    });
  } catch (emailError) {
    Sentry.captureException(emailError as Error, {
      tags: { operation: "webhook_email_send_failed" },
      extra: { proposalId, submissionId },
    });
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
    Sentry.captureException(new Error("Document not found in webhook handler"), {
      tags: { operation: "webhook_document_not_found" },
      extra: { documentId, tenantId, submissionId },
    });
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

  // Upload signed PDF to S3
  const s3Key = `documents/signed/${tenantId}/${documentId}-${submissionId}.pdf`;
  const signedPdfUrl = await uploadToS3(
    signedPdfBuffer,
    s3Key,
    "application/pdf",
  );

  // Update document with signed PDF and status
  await db
    .update(documents)
    .set({
      signatureStatus: "signed",
      signedPdfUrl,
      signedAt: new Date(auditTrail.signedAt),
      signedBy: auditTrail.signerName,
    })
    .where(eq(documents.id, documentId));

  // Create document signature record
  await db.insert(documentSignatures).values({
    documentId,
    tenantId,
    signerEmail: auditTrail.signerEmail,
    signerName: auditTrail.signerName,
    docusealSubmissionId: submissionId,
    auditTrail,
    documentHash,
    signedPdfUrl,
    signedAt: new Date(auditTrail.signedAt),
  });

  // Create activity log
  await db.insert(activityLogs).values({
    tenantId,
    userId: doc.uploadedById,
    action: "Document Signed",
    entityType: "document",
    entityId: documentId,
    details: `Document "${doc.name}" signed by ${auditTrail.signerName}`,
    metadata: {
      documentId,
      submissionId,
      signerEmail: auditTrail.signerEmail,
      signedAt: auditTrail.signedAt,
    },
  });
}

async function handleSubmissionDeclined(submission: any) {
  const submissionId = submission.id;
  const metadata = submission.metadata || {};
  const proposalId = metadata.proposal_id;
  const tenantId = metadata.tenant_id;

  if (!tenantId || !proposalId) {
    Sentry.captureException(new Error("Missing metadata in declined webhook"), {
      tags: { operation: "webhook_declined_metadata_missing" },
      extra: { submissionId },
    });
    return;
  }

  // Get proposal details
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    Sentry.captureException(new Error("Proposal not found for declined event"), {
      tags: { operation: "webhook_declined_entity_not_found" },
      extra: { proposalId, submissionId },
    });
    return;
  }

  // Update proposal status to rejected
  await db
    .update(proposals)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, proposalId));

  // Log activity
  await db.insert(activityLogs).values({
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
    },
  });

  Sentry.captureMessage("Proposal signature declined", {
    tags: { operation: "webhook_declined" },
    extra: { proposalId, submissionId },
  });
}

async function handleSubmissionExpired(submission: any) {
  const submissionId = submission.id;
  const metadata = submission.metadata || {};
  const proposalId = metadata.proposal_id;
  const tenantId = metadata.tenant_id;

  if (!tenantId || !proposalId) {
    Sentry.captureException(new Error("Missing metadata in expired webhook"), {
      tags: { operation: "webhook_expired_metadata_missing" },
      extra: { submissionId },
    });
    return;
  }

  // Get proposal details
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    Sentry.captureException(new Error("Proposal not found for expired event"), {
      tags: { operation: "webhook_expired_entity_not_found" },
      extra: { proposalId, submissionId },
    });
    return;
  }

  // Update proposal status to expired
  await db
    .update(proposals)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, proposalId));

  // Log activity
  await db.insert(activityLogs).values({
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

  Sentry.captureMessage("Proposal signature expired", {
    tags: { operation: "webhook_expired" },
    extra: { proposalId, submissionId },
  });
}
