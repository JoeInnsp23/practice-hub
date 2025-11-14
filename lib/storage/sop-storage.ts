/**
 * SOP Storage Utilities
 *
 * Provides SOP-specific file storage operations using MinIO/S3.
 * SOPs are stored in the dedicated `practice-hub-sops` bucket with versioning enabled.
 *
 * Key Structure: {tenantId}/sops/{sopId}/{version}/{filename}
 * Example: tenant-1/sops/sop-123/1.0/gdpr-policy.pdf
 *
 * Security:
 * - Private bucket (authenticated access only via presigned URLs)
 * - Versioning enabled for compliance audit trail
 * - File type validation (PDF, video, images only)
 * - File size limits enforced
 *
 * @module sop-storage
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as Sentry from "@sentry/nextjs";

// S3 Client configuration (same as existing s3.ts)
const s3Client = new S3Client({
  region: process.env.S3_REGION || "eu-central",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

// Dedicated SOP bucket (private, versioned)
const SOP_BUCKET_NAME = process.env.S3_BUCKET_NAME_SOPS || "practice-hub-sops";

// File size limits (bytes)
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const ALLOWED_FILE_TYPES = {
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  image: ["image/png", "image/jpeg", "image/jpg"],
  document: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ],
} as const;

export type SopFileType = "pdf" | "video" | "image" | "document";

export interface UploadSopFileOptions {
  tenantId: string;
  sopId: string;
  version: string;
  file: File | Buffer;
  fileName: string;
  fileType: SopFileType;
}

/**
 * Validate file type and size
 */
function validateFile(
  buffer: Buffer,
  fileType: SopFileType,
  contentType: string,
): void {
  // Validate MIME type
  const allowedTypes = ALLOWED_FILE_TYPES[fileType];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(
      `Invalid file type: ${contentType}. Expected one of: ${allowedTypes.join(", ")}`,
    );
  }

  // Validate size
  const fileSize = buffer.length;
  let maxSize: number;

  switch (fileType) {
    case "pdf":
    case "document":
      maxSize = MAX_PDF_SIZE;
      break;
    case "video":
      maxSize = MAX_VIDEO_SIZE;
      break;
    case "image":
      maxSize = MAX_IMAGE_SIZE;
      break;
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }

  if (fileSize > maxSize) {
    throw new Error(
      `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(2)}MB) for ${fileType} files`,
    );
  }
}

/**
 * Generate S3 key for SOP file
 * Format: {tenantId}/sops/{sopId}/{version}/{filename}
 */
function generateSopKey(
  tenantId: string,
  sopId: string,
  version: string,
  fileName: string,
): string {
  // Sanitize filename (remove special characters, preserve extension)
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_");

  return `${tenantId}/sops/${sopId}/${version}/${sanitizedFileName}`;
}

/**
 * Upload SOP file to S3
 *
 * @param options - Upload configuration
 * @returns S3 key of uploaded file
 *
 * @throws Error if file validation fails or upload fails
 *
 * @example
 * ```typescript
 * const s3Key = await uploadSopFile({
 *   tenantId: "tenant-1",
 *   sopId: "sop-123",
 *   version: "1.0",
 *   file: fileBuffer,
 *   fileName: "gdpr-policy.pdf",
 *   fileType: "pdf",
 * });
 * ```
 */
export async function uploadSopFile(
  options: UploadSopFileOptions,
): Promise<string> {
  const { tenantId, sopId, version, file, fileName, fileType } = options;

  try {
    // Convert File to Buffer if needed
    const buffer =
      file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());

    // Detect content type
    const contentType = file instanceof File ? file.type : getContentType(fileName);

    // Validate file
    validateFile(buffer, fileType, contentType);

    // Generate S3 key
    const s3Key = generateSopKey(tenantId, sopId, version, fileName);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: SOP_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        tenantId,
        sopId,
        version,
        originalFileName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return s3Key;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "uploadSopFile" },
      extra: { tenantId, sopId, version, fileName },
    });
    throw new Error(
      `Failed to upload SOP file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get presigned URL for temporary SOP file access
 *
 * @param s3Key - S3 key of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL for downloading the file
 *
 * @example
 * ```typescript
 * const url = await getSopFileUrl("tenant-1/sops/sop-123/1.0/gdpr-policy.pdf");
 * // Returns: https://s3.endpoint.com/practice-hub-sops/tenant-1/sops/sop-123/1.0/gdpr-policy.pdf?...
 * ```
 */
export async function getSopFileUrl(
  s3Key: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: SOP_BUCKET_NAME,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "getSopFileUrl" },
      extra: { s3Key },
    });
    throw new Error(
      `Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Delete SOP file from S3
 *
 * @param s3Key - S3 key of the file to delete
 *
 * @example
 * ```typescript
 * await deleteSopFile("tenant-1/sops/sop-123/1.0/gdpr-policy.pdf");
 * ```
 */
export async function deleteSopFile(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: SOP_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "deleteSopFile" },
      extra: { s3Key },
    });
    throw new Error(
      `Failed to delete SOP file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get content type from filename extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}

/**
 * Parse S3 key to extract SOP metadata
 *
 * @param s3Key - S3 key to parse
 * @returns Parsed metadata or null if invalid key format
 *
 * @example
 * ```typescript
 * const metadata = parseSopKey("tenant-1/sops/sop-123/1.0/gdpr-policy.pdf");
 * // Returns: { tenantId: "tenant-1", sopId: "sop-123", version: "1.0", fileName: "gdpr-policy.pdf" }
 * ```
 */
export function parseSopKey(s3Key: string): {
  tenantId: string;
  sopId: string;
  version: string;
  fileName: string;
} | null {
  const pattern = /^([^/]+)\/sops\/([^/]+)\/([^/]+)\/(.+)$/;
  const match = s3Key.match(pattern);

  if (!match) {
    return null;
  }

  return {
    tenantId: match[1],
    sopId: match[2],
    version: match[3],
    fileName: match[4],
  };
}
