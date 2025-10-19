import crypto from "node:crypto";
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
      console.error("Missing DocuSeal webhook signature");
      return new Response("Missing signature", { status: 401 });
    }

    const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("DOCUSEAL_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid DocuSeal webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse webhook event
    const event = JSON.parse(body);

    // Handle submission.completed event
    if (event.event === "submission.completed") {
      await handleSubmissionCompleted(event.data);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("DocuSeal webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

async function handleSubmissionCompleted(submission: any) {
  const _submissionId = submission.id;
  const metadata = submission.metadata || {};

  // Check if this is a proposal or document signature
  const proposalId = metadata.proposal_id;
  const documentId = metadata.document_id;
  const tenantId = metadata.tenant_id;

  if (!tenantId) {
    console.error("Missing tenant_id in submission metadata");
    throw new Error("Invalid submission metadata");
  }

  // Route to appropriate handler
  if (proposalId) {
    await handleProposalSigning(submission, metadata, proposalId, tenantId);
  } else if (documentId) {
    await handleDocumentSigning(submission, metadata, documentId, tenantId);
  } else {
    console.error("No proposal_id or document_id in metadata");
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
    console.error("Proposal not found:", proposalId);
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
      console.error("Failed to auto-convert lead to client:", conversionError);
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
    console.error("Failed to send confirmation email:", emailError);
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
    console.error("Document not found:", documentId);
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
