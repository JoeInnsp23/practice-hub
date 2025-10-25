/**
 * Mock AWS S3 SDK
 *
 * Provides mock implementations of S3 operations for testing.
 */

import { vi } from "vitest";

// Mock S3 client
export class MockS3Client {
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation requires flexible parameter types for testing
  send = vi.fn(async (_command: any) => {
    // Mock successful S3 operations
    return {
      $metadata: {
        httpStatusCode: 200,
      },
    };
  });
}

// Mock PutObjectCommand
export class MockPutObjectCommand {
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation requires flexible parameter types for testing
  constructor(public input: any) {}
}

// Mock GetObjectCommand
export class MockGetObjectCommand {
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation requires flexible parameter types for testing
  constructor(public input: any) {}
}

// Mock getSignedUrl
// biome-ignore lint/suspicious/noExplicitAny: Mock implementation requires flexible parameter types for testing
export const mockGetSignedUrl = vi.fn(
  async (_client: any, command: any, options?: any) => {
    const key = command.input?.Key || "test-key";
    const expiresIn = options?.expiresIn || 3600;
    return `https://mock-s3.example.com/test-bucket/${key}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=mock-signature`;
  },
);

// Mock uploadToS3 function
export const mockUploadToS3 = vi.fn(
  async (_buffer: Buffer, key: string, _contentType: string) => {
    return `http://localhost:9000/test-bucket/${key}`;
  },
);

// Mock getPresignedUrl function
export const mockGetPresignedUrl = vi.fn(
  async (key: string, expiresIn: number = 3600) => {
    return `https://mock-s3.example.com/test-bucket/${key}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=mock-signature`;
  },
);

// Helper to reset all mocks
export function resetS3Mocks() {
  vi.clearAllMocks();
}
