/**
 * Admin KYC Router Tests
 *
 * Tests for the admin-kyc tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { adminKycRouter } from "@/app/server/routers/admin-kyc";
import { createCaller, createMockContext } from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/admin-kyc.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof adminKycRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Admin router requires admin role
    caller = createCaller(adminKycRouter, ctx);
    vi.clearAllMocks();
  });

  describe("listPendingReviews", () => {
    it("should accept empty input", () => {
      expect(() => {
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {
            status: "pending",
          },
        );
      }).not.toThrow();
    });

    it("should accept pagination parameters", () => {
      expect(() => {
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {
            limit: 25,
            offset: 50,
          },
        );
      }).not.toThrow();
    });

    it("should default limit to 50", () => {
      const result =
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {},
        );
      expect(result?.limit).toBe(50);
    });

    it("should default offset to 0", () => {
      const result =
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {},
        );
      expect(result?.offset).toBe(0);
    });

    it("should validate status enum values", () => {
      expect(() => {
        adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
          {
            status: "invalid",
          },
        );
      }).toThrow();
    });

    it("should accept both pending and completed status", () => {
      const validStatuses = ["pending", "completed"];

      for (const status of validStatuses) {
        expect(() => {
          adminKycRouter._def.procedures.listPendingReviews._def.inputs[0]?.parse(
            {
              status,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("getVerificationDetail", () => {
    it("should validate required verificationId field", () => {
      const invalidInput = {
        // Missing verificationId
      };

      expect(() => {
        adminKycRouter._def.procedures.getVerificationDetail._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid verification ID", () => {
      const validInput = {
        verificationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        adminKycRouter._def.procedures.getVerificationDetail._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("approveVerification", () => {
    it("should validate required verificationId field", () => {
      const invalidInput = {
        // Missing verificationId
        notes: "Approved",
      };

      expect(() => {
        adminKycRouter._def.procedures.approveVerification._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid approval data", () => {
      const validInput = {
        verificationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        adminKycRouter._def.procedures.approveVerification._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional notes", () => {
      const validInput = {
        verificationId: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Verification approved after review",
      };

      expect(() => {
        adminKycRouter._def.procedures.approveVerification._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("rejectVerification", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing verificationId and reason
      };

      expect(() => {
        adminKycRouter._def.procedures.rejectVerification._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid rejection data", () => {
      const validInput = {
        verificationId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Document does not match identity",
      };

      expect(() => {
        adminKycRouter._def.procedures.rejectVerification._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate reason minimum length", () => {
      const invalidInput = {
        verificationId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Short", // Below minimum of 10 characters
      };

      expect(() => {
        adminKycRouter._def.procedures.rejectVerification._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("getReviewStats", () => {
    it("should have no required input", () => {
      const procedure = adminKycRouter._def.procedures.getReviewStats;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(adminKycRouter._def.procedures);

      expect(procedures).toContain("listPendingReviews");
      expect(procedures).toContain("getVerificationDetail");
      expect(procedures).toContain("approveVerification");
      expect(procedures).toContain("rejectVerification");
      expect(procedures).toContain("getReviewStats");
    });

    it("should have 5 procedures total", () => {
      const procedures = Object.keys(adminKycRouter._def.procedures);
      expect(procedures).toHaveLength(5);
    });
  });
});
