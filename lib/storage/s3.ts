import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Hetzner S3 configuration
const s3Client = new S3Client({
  region: process.env.S3_REGION || "eu-central",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required for Hetzner S3
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "practice-hub-proposals";

export interface UploadOptions {
  fileName: string;
  buffer: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to Hetzner S3
 * @param options - Upload configuration
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(options: UploadOptions): Promise<string> {
  const {
    fileName,
    buffer,
    contentType = "application/pdf",
    metadata,
  } = options;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      // Make the object publicly readable
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct public URL
    const endpoint = process.env.S3_ENDPOINT || "";
    const publicUrl = `${endpoint}/${BUCKET_NAME}/${fileName}`;

    return publicUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a presigned URL for temporary access to a private file
 * @param fileName - Name of the file in S3
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  fileName: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(
      `Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Delete a file from Hetzner S3
 * @param fileName - Name of the file to delete
 */
export async function deleteFromS3(fileName: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(
      `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get a file buffer from S3
 * @param fileName - Name of the file to retrieve
 * @returns File buffer
 */
export async function getFromS3(fileName: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("File body is empty");
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error retrieving from S3:", error);
    throw new Error(
      `Failed to retrieve file from S3: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
