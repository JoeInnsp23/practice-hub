/**
 * Admin KYC Router Tests
 *
 * Tests for the admin-kyc tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TestContextWithAuth } from "@/app/server/context";
import { adminKycRouter } from "@/app/server/routers/admin-kyc";
import {
  createCaller,
  createMockContext,
} from "../helpers/trpc";

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
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof adminKycRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Admin router requires admin role
    _caller = createCaller(adminKycRouter, ctx);
    vi.clearAllMocks();
  });

  describe("listPendingReviews", () => {
    it("should accept empty input", async () => {
      await expect(_caller.listPendingReviews({})).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      await expect(
        _caller.listPendingReviews({ status: "pending" }),
      ).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      await expect(
        _caller.listPendingReviews({
          limit: 25,
          offset: 50,
        }),
      ).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      await expect(
        _caller.listPendingReviews({
          status: "invalid",
        }),
      ).rejects.toThrow();
    });

    it("should accept both pending and completed status", async () => {
      const validStatuses = ["pending", "completed"] as const;

      for (const status of validStatuses) {
        await expect(
          _caller.listPendingReviews({ status }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("getVerificationDetail", () => {
    it("should validate required verificationId field", async () => {
      await expect(
        _caller.getVerificationDetail({
        }),
      ).rejects.toThrow();
    });

    it("should accept valid verification ID", async () => {
      await expect(
        _caller.getVerificationDetail({
          verificationId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("approveVerification", () => {
    it("should validate required verificationId field", async () => {
      await expect(
        _caller.approveVerification({
          notes: "Approved",
        }),
      ).rejects.toThrow();
    });

    it("should accept valid approval data", async () => {
      await expect(
        _caller.approveVerification({
          verificationId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional notes", async () => {
      await expect(
        _caller.approveVerification({
          verificationId: "550e8400-e29b-41d4-a716-446655440000",
          notes: "Verification approved after review",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("rejectVerification", () => {
    it("should validate required fields", async () => {
      await expect(
        _caller.rejectVerification({
        }),
      ).rejects.toThrow();
    });

    it("should accept valid rejection data", async () => {
      await expect(
        _caller.rejectVerification({
          verificationId: "550e8400-e29b-41d4-a716-446655440000",
          reason: "Document does not match identity",
        }),
      ).resolves.not.toThrow();
    });

    it("should validate reason minimum length", async () => {
      await expect(
        _caller.rejectVerification({
          verificationId: "550e8400-e29b-41d4-a716-446655440000",
          reason: "Short", // Below minimum of 10 characters
        }),
      ).rejects.toThrow();
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
