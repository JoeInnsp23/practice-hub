/**
 * Mock LEM Verify API Client
 *
 * Provides mock implementations of LEM Verify API methods for testing.
 */

import { vi } from "vitest";
import type {
  VerificationRequest,
  VerificationResponse,
  VerificationStatus,
} from "@/lib/kyc/lemverify-client";

// Mock verification responses
export const mockVerificationResponse: VerificationResponse = {
  id: "mock-verification-id-123",
  clientRef: "client-123",
  status: "pending",
  verificationUrl:
    "https://verify.lemverify.com/verify/mock-verification-id-123",
  createdAt: new Date().toISOString(),
};

export const mockVerificationStatusPassed: VerificationStatus = {
  id: "mock-verification-id-123",
  clientRef: "client-123",
  status: "completed",
  outcome: "pass",
  documentVerification: {
    verified: true,
    documentType: "passport",
    extractedData: {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-15",
      documentNumber: "123456789",
      expiryDate: "2030-01-15",
      nationality: "British",
    },
  },
  facematch: {
    result: "pass",
    score: 95,
  },
  liveness: {
    result: "pass",
    score: 98,
  },
  amlScreening: {
    status: "clear",
    pepMatch: false,
    sanctionsMatch: false,
    watchlistMatch: false,
    adverseMediaMatch: false,
  },
  reportUrl: "https://reports.lemverify.com/mock-verification-id-123",
  documentUrls: ["https://docs.lemverify.com/passport.jpg"],
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockVerificationStatusFailed: VerificationStatus = {
  ...mockVerificationStatusPassed,
  id: "mock-verification-id-456",
  outcome: "fail",
  documentVerification: {
    verified: false,
    documentType: "passport",
  },
  facematch: {
    result: "fail",
    score: 45,
  },
};

export const mockVerificationStatusPEPMatch: VerificationStatus = {
  ...mockVerificationStatusPassed,
  id: "mock-verification-id-789",
  outcome: "refer",
  amlScreening: {
    status: "pep",
    pepMatch: true,
    sanctionsMatch: false,
    watchlistMatch: false,
    adverseMediaMatch: false,
    matches: [
      {
        type: "PEP",
        name: "John Doe",
        score: 85,
      },
    ],
  },
};

// Mock LEM Verify API Client class
export class MockLemVerifyClient {
  requestVerification = vi.fn(
    async (_request: VerificationRequest): Promise<VerificationResponse> => {
      return mockVerificationResponse;
    },
  );

  getVerificationStatus = vi.fn(
    async (verificationId: string): Promise<VerificationStatus> => {
      // Return different results based on ID for testing
      if (verificationId.includes("fail")) {
        return mockVerificationStatusFailed;
      }
      if (verificationId.includes("pep")) {
        return mockVerificationStatusPEPMatch;
      }
      return mockVerificationStatusPassed;
    },
  );

  downloadReport = vi.fn(async (_verificationId: string): Promise<Buffer> => {
    return Buffer.from("mock-pdf-content");
  });

  downloadDocuments = vi.fn(async (_verificationId: string) => {
    return {
      passport: Buffer.from("mock-passport-image"),
      selfie: Buffer.from("mock-selfie-image"),
    };
  });

  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation requires flexible parameter types for testing
  listVerifications = vi.fn(async (_params?: any) => {
    return {
      verifications: [mockVerificationStatusPassed],
      total: 1,
    };
  });
}

// Export singleton mock instance
export const mockLemverifyClient = new MockLemVerifyClient();

// Helper to reset all mocks
export function resetLemVerifyMocks() {
  mockLemverifyClient.requestVerification.mockClear();
  mockLemverifyClient.getVerificationStatus.mockClear();
  mockLemverifyClient.downloadReport.mockClear();
  mockLemverifyClient.downloadDocuments.mockClear();
  mockLemverifyClient.listVerifications.mockClear();
}
