/**
 * Onboarding Router Tests
 *
 * Tests for the onboarding tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingRouter } from "@/app/server/routers/onboarding";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock AI questionnaire helpers
vi.mock("@/lib/ai/questionnaire-prefill", () => ({
  getPrefilledQuestionnaire: vi.fn().mockResolvedValue({
    fields: {
      contact_first_name: { value: "John", verified: false },
      contact_last_name: { value: "Doe", verified: false },
    },
  }),
  validateQuestionnaireComplete: vi.fn().mockReturnValue({
    valid: true,
    errors: [],
  }),
}));

// Mock AI save helpers
vi.mock("@/lib/ai/save-extracted-data", () => ({
  updateExtractedResponse: vi.fn().mockResolvedValue(undefined),
  markResponseAsVerified: vi.fn().mockResolvedValue(undefined),
}));

// Mock email
vi.mock("@/lib/email-client-portal", () => ({
  sendKYCVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock LEM Verify client
vi.mock("@/lib/kyc/lemverify-client", () => ({
  lemverifyClient: {
    requestVerification: vi.fn().mockResolvedValue({
      id: "verify-123",
      verificationUrl: "https://lemverify.com/verify/123",
    }),
  },
}));

describe("app/server/routers/onboarding.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof onboardingRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(onboardingRouter, ctx);
    vi.clearAllMocks();
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(onboardingRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("createSession");
      expect(procedures).toContain("updateTask");
      expect(procedures).toContain("updateSession");
      expect(procedures).toContain("getStats");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getQuestionnaireSession");
      expect(procedures).toContain("updateQuestionnaireResponse");
      expect(procedures).toContain("verifyQuestionnaireResponse");
      expect(procedures).toContain("submitQuestionnaire");
      expect(procedures).toContain("getOnboardingStatus");
      expect(procedures).toContain("requestReVerification");
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(onboardingRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
