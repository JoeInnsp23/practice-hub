import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, proposals } from "@/lib/db/schema";
import { extractS3Key, getPresignedUrl } from "./upload";

/**
 * Get presigned URL for signed proposal PDF
 *
 * Generates a time-limited presigned URL for secure access to signed proposal PDFs.
 * Supports backward compatibility with old public URLs stored in the database.
 *
 * @param proposalId - Proposal UUID
 * @param ttlSeconds - Time-to-live in seconds (default: 48 hours)
 * @returns Presigned URL with expiration, or null if no PDF available
 */
export async function getProposalSignedPdfUrl(
  proposalId: string,
  ttlSeconds: number = 48 * 60 * 60, // 48 hours
): Promise<string | null> {
  const [proposal] = await db
    .select({
      signedPdfKey: proposals.docusealSignedPdfKey,
      // Fallback to old URL for backward compatibility
      signedPdfUrl: proposals.docusealSignedPdfUrl,
    })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    return null;
  }

  // Prefer new key-based approach
  if (proposal.signedPdfKey) {
    return await getPresignedUrl(proposal.signedPdfKey, ttlSeconds);
  }

  // BACKWARD COMPATIBILITY: If old URL exists, extract key and generate presigned URL
  if (proposal.signedPdfUrl) {
    try {
      const key = extractS3Key(proposal.signedPdfUrl);
      return await getPresignedUrl(key, ttlSeconds);
    } catch (error) {
      console.error(
        "Failed to extract S3 key from legacy URL:",
        proposal.signedPdfUrl,
        error,
      );
      // Fallback: return the old URL (better than nothing)
      return proposal.signedPdfUrl;
    }
  }

  return null;
}

/**
 * Get presigned URL for signed document PDF
 *
 * Generates a time-limited presigned URL for secure access to signed document PDFs.
 * Supports backward compatibility with old public URLs stored in the database.
 *
 * @param documentId - Document UUID
 * @param ttlSeconds - Time-to-live in seconds (default: 48 hours)
 * @returns Presigned URL with expiration, or null if no PDF available
 */
export async function getDocumentSignedPdfUrl(
  documentId: string,
  ttlSeconds: number = 48 * 60 * 60, // 48 hours
): Promise<string | null> {
  const [document] = await db
    .select({
      signedPdfKey: documents.signedPdfKey,
      // Fallback to old URL for backward compatibility
      signedPdfUrl: documents.signedPdfUrl,
    })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    return null;
  }

  // Prefer new key-based approach
  if (document.signedPdfKey) {
    return await getPresignedUrl(document.signedPdfKey, ttlSeconds);
  }

  // BACKWARD COMPATIBILITY: If old URL exists, extract key and generate presigned URL
  if (document.signedPdfUrl) {
    try {
      const key = extractS3Key(document.signedPdfUrl);
      return await getPresignedUrl(key, ttlSeconds);
    } catch (error) {
      console.error(
        "Failed to extract S3 key from legacy URL:",
        document.signedPdfUrl,
        error,
      );
      // Fallback: return the old URL (better than nothing)
      return document.signedPdfUrl;
    }
  }

  return null;
}
