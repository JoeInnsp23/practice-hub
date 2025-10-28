/**
 * Mock AWS S3 SDK
 *
 * Provides mock implementations of S3 operations for testing.
 */

import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import type { Command } from "@smithy/smithy-client";
import type { MetadataBearer, RequestPresigningArguments } from "@smithy/types";
import { vi } from "vitest";

// Mock S3 client
export class MockS3Client {
  send = vi.fn(async (_command: Command<unknown, unknown, unknown>) => {
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
  constructor(public input: PutObjectCommandInput) {}
}

// Mock GetObjectCommand
export class MockGetObjectCommand {
  constructor(public input: GetObjectCommandInput) {}
}

// Mock getSignedUrl
export const mockGetSignedUrl = vi.fn(
  async (
    _client: MockS3Client,
    command: Command<unknown, MetadataBearer, unknown>,
    options?: RequestPresigningArguments,
  ) => {
    const cmdInput = command.input as { Key?: string } | undefined;
    const key = cmdInput?.Key || "test-key";
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
