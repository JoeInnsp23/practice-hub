import { describe, expect, it } from "vitest";
import { extractS3Key } from "@/lib/s3/upload";

// Note: We're testing only the pure function (extractS3Key) here
// The upload functions require AWS SDK mocking which is complex
// In a real scenario, you'd mock @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner

describe("lib/s3/upload.ts", () => {
  describe("extractS3Key", () => {
    // Use the bucket name from test setup (lib/s3/upload.ts reads it at module load time)
    const bucketName = process.env.S3_BUCKET_NAME || "test-bucket";

    it("should extract key from MinIO direct URL", () => {
      const url = `http://localhost:9000/${bucketName}/onboarding/session123/document.pdf`;
      const key = extractS3Key(url);
      expect(key).toBe("onboarding/session123/document.pdf");
    });

    it("should extract key from presigned MinIO URL", () => {
      const url = `http://localhost:9000/${bucketName}/onboarding/session123/document.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250110T120000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=abc123`;
      const key = extractS3Key(url);
      expect(key).toBe("onboarding/session123/document.pdf");
    });

    it("should extract key from Hetzner S3 URL", () => {
      const url = `https://fsn1.your-objectstorage.com/${bucketName}/proposals/2025/proposal-001.pdf`;
      const key = extractS3Key(url);
      expect(key).toBe("proposals/2025/proposal-001.pdf");
    });

    it("should handle nested paths", () => {
      const url = `http://localhost:9000/${bucketName}/tenant1/client2/documents/year2025/report.pdf`;
      const key = extractS3Key(url);
      expect(key).toBe("tenant1/client2/documents/year2025/report.pdf");
    });

    it("should handle keys with special characters", () => {
      const url = `http://localhost:9000/${bucketName}/docs/file%20with%20spaces.pdf`;
      const key = extractS3Key(url);
      expect(key).toBe("docs/file%20with%20spaces.pdf");
    });

    it("should handle URLs without bucket name prefix", () => {
      const url = "http://localhost:9000/some-key/file.pdf";
      const key = extractS3Key(url);
      // Fallback behavior: returns pathname without leading slash
      expect(key).toBe("some-key/file.pdf");
    });

    it("should throw error for invalid URLs", () => {
      expect(() => extractS3Key("not-a-valid-url")).toThrow();
    });

    it("should handle single-level keys", () => {
      const url = `http://localhost:9000/${bucketName}/document.pdf`;
      const key = extractS3Key(url);
      expect(key).toBe("document.pdf");
    });

    it("should remove multiple leading slashes", () => {
      const url = "http://localhost:9000///path/to/file.pdf";
      const key = extractS3Key(url);
      expect(key).toBe("path/to/file.pdf");
    });
  });

  // TODO: Add tests for upload functions when AWS SDK mocking is set up
  // describe("getPresignedUrl", () => { ... });
  // describe("uploadWithPresignedUrl", () => { ... });
  // describe("uploadToS3", () => { ... });
});
