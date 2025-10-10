/**
 * Mock Resend Email Service
 *
 * Provides mock implementations of Resend API for testing.
 */

import { vi } from "vitest";

// Mock email send response
export const mockEmailResponse = {
  id: "mock-email-id-123",
  from: "test@example.com",
  to: ["recipient@example.com"],
  created_at: new Date().toISOString(),
};

// Mock Resend class
export class MockResend {
  emails = {
    send: vi.fn(async (params: any) => {
      // Simulate successful email send
      return {
        data: mockEmailResponse,
        error: null,
      };
    }),
  };
}

// Mock email functions
export const mockSendKYCVerificationEmail = vi.fn(async (params: {
  email: string;
  clientName: string;
  verificationUrl: string;
}) => {
  // Simulate successful email
  return Promise.resolve();
});

export const mockSendClientPortalPasswordResetEmail = vi.fn(async (params: {
  email: string;
  userName: string;
  resetLink: string;
}) => {
  // Simulate successful email
  return Promise.resolve();
});

// Helper to reset all mocks
export function resetResendMocks() {
  vi.clearAllMocks();
}

// Helper to simulate email failure
export function simulateEmailFailure() {
  mockSendKYCVerificationEmail.mockRejectedValueOnce(new Error("Email service unavailable"));
}
