import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client configuration (works with MinIO and Hetzner S3)
const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

const bucketName = process.env.S3_BUCKET_NAME || "practice-hub-proposals";

/**
 * Upload file to S3 (MinIO or Hetzner)
 *
 * @param buffer - File buffer to upload
 * @param key - S3 object key (file path in bucket)
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = "application/octet-stream",
): Promise<string> {
  try {
    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    // Construct public URL
    const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
    const publicUrl = `${endpoint}/${bucketName}/${key}`;

    console.log(`File uploaded to S3: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
}

/**
 * Upload file with automatic public read ACL (for MinIO)
 */
export async function uploadPublicFile(
  buffer: Buffer,
  key: string,
  contentType: string = "application/octet-stream",
): Promise<string> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read", // Make file publicly accessible
      }),
    );

    const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
    const publicUrl = `${endpoint}/${bucketName}/${key}`;

    return publicUrl;
  } catch (error) {
    console.error("S3 public upload error:", error);
    throw new Error(`Failed to upload public file to S3: ${error}`);
  }
}

/**
 * Generate presigned URL for secure document access
 *
 * Creates a temporary URL that expires after a set time (default 1 hour).
 * Use this for sensitive documents like KYC verification files.
 *
 * @param key - S3 object key (file path in bucket)
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL with expiration
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    console.log(`Generated presigned URL for ${key} (expires in ${expiresIn}s)`);

    return presignedUrl;
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error}`);
  }
}

/**
 * Upload file and return presigned URL instead of public URL
 *
 * More secure alternative to uploadToS3() for sensitive documents.
 * The returned URL expires after the specified time.
 *
 * @param buffer - File buffer to upload
 * @param key - S3 object key (file path in bucket)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL with expiration
 */
export async function uploadWithPresignedUrl(
  buffer: Buffer,
  key: string,
  contentType: string = "application/octet-stream",
  expiresIn: number = 3600,
): Promise<string> {
  try {
    // Upload file to S3 (private by default, no public-read ACL)
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // No ACL - private by default
      }),
    );

    // Generate presigned URL for secure access
    const presignedUrl = await getPresignedUrl(key, expiresIn);

    console.log(`File uploaded to S3 with presigned URL: ${key}`);

    return presignedUrl;
  } catch (error) {
    console.error("S3 upload with presigned URL error:", error);
    throw new Error(`Failed to upload file with presigned URL: ${error}`);
  }
}

/**
 * Extract S3 key from public URL or presigned URL
 *
 * Useful for generating new presigned URLs from existing database URLs
 *
 * @param url - S3 URL (public or presigned)
 * @returns S3 object key
 */
export function extractS3Key(url: string): string {
  try {
    const urlObj = new URL(url);

    // Handle different URL formats:
    // 1. Direct MinIO: http://localhost:9000/bucket-name/key
    // 2. Presigned: http://localhost:9000/bucket-name/key?X-Amz-...
    // 3. Hetzner: https://fsn1.your-objectstorage.com/bucket-name/key

    const pathname = urlObj.pathname;

    // Remove leading slash and bucket name
    const parts = pathname.split("/").filter(Boolean);

    if (parts[0] === bucketName) {
      // Remove bucket name from path
      return parts.slice(1).join("/");
    }

    // Fallback: return full pathname
    return pathname.replace(/^\/+/, "");
  } catch (error) {
    console.error("Failed to extract S3 key from URL:", error);
    throw new Error(`Invalid S3 URL: ${url}`);
  }
}
