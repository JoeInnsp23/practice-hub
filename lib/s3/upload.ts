import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
