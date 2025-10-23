/**
 * Onboarding Router Tests
 *
 * Tests for the onboarding tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { onboardingRouter } from "@/app/server/routers/onboarding";
import { createCaller, createMockContext } from "../helpers/trpc";

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
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof onboardingRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(onboardingRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        onboardingRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        onboardingRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "in_progress",
        });
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      expect(() => {
        onboardingRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "invalid_status",
        });
      }).toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid session ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        onboardingRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        onboardingRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("createSession", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
        priority: "high",
      };

      expect(() => {
        onboardingRouter._def.procedures.createSession._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid session data", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.createSession._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        startDate: new Date("2025-01-01"),
        targetCompletionDate: new Date("2025-01-15"),
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
        priority: "high" as const,
      };

      expect(() => {
        onboardingRouter._def.procedures.createSession._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateTask", () => {
    it("should validate required taskId field", () => {
      const invalidInput = {
        // Missing taskId
        done: true,
      };

      expect(() => {
        onboardingRouter._def.procedures.updateTask._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid task update", () => {
      const validInput = {
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        done: true,
      };

      expect(() => {
        onboardingRouter._def.procedures.updateTask._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        done: false,
        notes: "Waiting for client response",
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.updateTask._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateSession", () => {
    it("should validate required sessionId field", () => {
      const invalidInput = {
        // Missing sessionId
        status: "completed",
      };

      expect(() => {
        onboardingRouter._def.procedures.updateSession._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid session update", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "in_progress" as const,
      };

      expect(() => {
        onboardingRouter._def.procedures.updateSession._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        priority: "medium" as const,
        targetCompletionDate: new Date("2025-02-01"),
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
        notes: "Client is very responsive",
      };

      expect(() => {
        onboardingRouter._def.procedures.updateSession._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getStats", () => {
    it("should have no required input", () => {
      const procedure = onboardingRouter._def.procedures.getStats;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("delete", () => {
    it("should accept valid session ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        onboardingRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        onboardingRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("getQuestionnaireSession", () => {
    it("should validate required sessionId field", () => {
      const invalidInput = {
        // Missing sessionId
      };

      expect(() => {
        onboardingRouter._def.procedures.getQuestionnaireSession._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid session ID", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.getQuestionnaireSession._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateQuestionnaireResponse", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing sessionId, questionKey, value
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.updateQuestionnaireResponse._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid response update", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        questionKey: "contact_first_name",
        value: "John",
      };

      expect(() => {
        onboardingRouter._def.procedures.updateQuestionnaireResponse._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept any value type", () => {
      const validInputObject = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        questionKey: "business_address",
        value: {
          street: "123 Main St",
          city: "London",
        },
      };

      expect(() => {
        onboardingRouter._def.procedures.updateQuestionnaireResponse._def.inputs[0]?.parse(
          validInputObject,
        );
      }).not.toThrow();
    });
  });

  describe("verifyQuestionnaireResponse", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing questionKey
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.verifyQuestionnaireResponse._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid verification request", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        questionKey: "contact_email",
      };

      expect(() => {
        onboardingRouter._def.procedures.verifyQuestionnaireResponse._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("submitQuestionnaire", () => {
    it("should validate required sessionId field", () => {
      const invalidInput = {
        // Missing sessionId
      };

      expect(() => {
        onboardingRouter._def.procedures.submitQuestionnaire._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid submission", () => {
      const validInput = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.submitQuestionnaire._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getOnboardingStatus", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        onboardingRouter._def.procedures.getOnboardingStatus._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.getOnboardingStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("requestReVerification", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        onboardingRouter._def.procedures.requestReVerification._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        onboardingRouter._def.procedures.requestReVerification._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
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
