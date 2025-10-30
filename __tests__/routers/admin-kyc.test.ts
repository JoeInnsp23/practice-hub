/**
 * Admin KYC Router Tests
 *
 * Tests for the admin-kyc tRPC router
 */

import { afterEach, describe, expect, it } from "vitest";
import { adminKycRouter } from "@/app/server/routers/admin-kyc";
import { db } from "@/lib/db";
import { kycVerifications } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("app/server/routers/admin-kyc.ts", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    kycVerifications: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.kycVerifications = [];
  });

  describe("listPendingReviews", () => {
    it("should accept empty input", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(caller.listPendingReviews({})).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.listPendingReviews({ status: "pending" }),
      ).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.listPendingReviews({
          limit: 25,
          offset: 50,
        }),
      ).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.listPendingReviews({
          status: "invalid",
        }),
      ).rejects.toThrow();
    });

    it("should accept both pending and completed status", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      const validStatuses = ["pending", "completed"] as const;

      for (const status of validStatuses) {
        await expect(
          caller.listPendingReviews({ status }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("getVerificationDetail", () => {
    it("should validate required verificationId field", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(caller.getVerificationDetail({})).rejects.toThrow();
    });

    it("should accept valid verification ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      // Create KYC verification record
      const [kycRecord] = await db
        .insert(kycVerifications)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          clientId: client.id,
          lemverifyId: `lemverify-${Date.now()}`,
          clientRef: `ref-${Date.now()}`,
          status: "completed",
          outcome: "pass",
        })
        .returning();
      tracker.kycVerifications?.push(kycRecord.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.getVerificationDetail({
          verificationId: kycRecord.id,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("approveVerification", () => {
    it("should validate required verificationId field", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.approveVerification({
          notes: "Approved",
        }),
      ).rejects.toThrow();
    });

    it("should accept valid approval data", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const [kycRecord] = await db
        .insert(kycVerifications)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          clientId: client.id,
          lemverifyId: `lemverify-${Date.now()}`,
          clientRef: `ref-${Date.now()}`,
          status: "completed",
          outcome: "pass",
        })
        .returning();
      tracker.kycVerifications?.push(kycRecord.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.approveVerification({
          verificationId: kycRecord.id,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional notes", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const [kycRecord] = await db
        .insert(kycVerifications)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          clientId: client.id,
          lemverifyId: `lemverify-${Date.now()}`,
          clientRef: `ref-${Date.now()}`,
          status: "completed",
          outcome: "pass",
        })
        .returning();
      tracker.kycVerifications?.push(kycRecord.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.approveVerification({
          verificationId: kycRecord.id,
          notes: "Verification approved after review",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("rejectVerification", () => {
    it("should validate required fields", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(caller.rejectVerification({})).rejects.toThrow();
    });

    it("should accept valid rejection data", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const [kycRecord] = await db
        .insert(kycVerifications)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          clientId: client.id,
          lemverifyId: `lemverify-${Date.now()}`,
          clientRef: `ref-${Date.now()}`,
          status: "completed",
          outcome: "pass",
        })
        .returning();
      tracker.kycVerifications?.push(kycRecord.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.rejectVerification({
          verificationId: kycRecord.id,
          reason: "Document does not match identity",
        }),
      ).resolves.not.toThrow();
    });

    it("should validate reason minimum length", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const [kycRecord] = await db
        .insert(kycVerifications)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          clientId: client.id,
          lemverifyId: `lemverify-${Date.now()}`,
          clientRef: `ref-${Date.now()}`,
          status: "completed",
          outcome: "pass",
        })
        .returning();
      tracker.kycVerifications?.push(kycRecord.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(adminKycRouter, ctx);

      await expect(
        caller.rejectVerification({
          verificationId: kycRecord.id,
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
