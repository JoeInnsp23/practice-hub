import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { tenants, users, workingPatterns } from "@/lib/db/schema";
import { appRouter } from "../../app/server";
import { cleanupTestData, type TestDataTracker } from "../helpers/factories";
import { createMockContext, type TestContextWithAuth } from "../helpers/trpc";

// Helper to create test context with auth parameters
function createTestContext(params: {
  userId: string;
  tenantId: string;
  role: string;
}) {
  return createMockContext({
    authContext: {
      userId: params.userId,
      tenantId: params.tenantId,
      role: params.role,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    },
  });
}

describe("workingPatterns router", () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let admin1Id: string;
  let user1Id: string;
  let user2Id: string;
  let admin2Id: string;
  let pattern1Id: string;
  let _pattern2Id: string;

  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  beforeEach(async () => {
    // Create two tenants for multi-tenant isolation tests
    const timestamp = Date.now();
    const [tenant1, tenant2] = await db
      .insert(tenants)
      .values([
        {
          id: crypto.randomUUID(),
          name: "Test Firm 1",
          slug: `test-firm-1-${timestamp}`,
        },
        {
          id: crypto.randomUUID(),
          name: "Test Firm 2",
          slug: `test-firm-2-${timestamp}`,
        },
      ])
      .returning();

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;
    tracker.tenants.push(tenant1Id, tenant2Id);

    // Create users for tenant 1
    const [admin1, user1, user2] = await db
      .insert(users)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `admin1-${timestamp}@example.com`,
          role: "admin",
          firstName: "Admin",
          lastName: "One",
          isActive: true,
          emailVerified: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `user1-${timestamp}@example.com`,
          role: "accountant",
          firstName: "User",
          lastName: "One",
          isActive: true,
          emailVerified: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `user2-${timestamp}@example.com`,
          role: "member",
          firstName: "User",
          lastName: "Two",
          isActive: true,
          emailVerified: true,
        },
      ])
      .returning();

    admin1Id = admin1.id;
    user1Id = user1.id;
    user2Id = user2.id;
    tracker.users.push(admin1Id, user1Id, user2Id);

    // Create user for tenant 2
    const [admin2] = await db
      .insert(users)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: tenant2Id,
          email: `admin2-${timestamp}@example.com`,
          role: "admin",
          firstName: "Admin",
          lastName: "Two",
          isActive: true,
          emailVerified: true,
        },
      ])
      .returning();

    admin2Id = admin2.id;
    tracker.users.push(admin2Id);

    // Create working patterns for tenant 1 users
    const [pattern1, pattern2] = await db
      .insert(workingPatterns)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          userId: user1Id,
          patternType: "full_time",
          contractedHours: 37.5,
          mondayHours: 7.5,
          tuesdayHours: 7.5,
          wednesdayHours: 7.5,
          thursdayHours: 7.5,
          fridayHours: 7.5,
          saturdayHours: 0,
          sundayHours: 0,
          effectiveFrom: "2025-01-01",
          notes: "Standard full-time pattern",
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          userId: user2Id,
          patternType: "part_time",
          contractedHours: 20,
          mondayHours: 5,
          tuesdayHours: 5,
          wednesdayHours: 5,
          thursdayHours: 5,
          fridayHours: 0,
          saturdayHours: 0,
          sundayHours: 0,
          effectiveFrom: "2025-01-01",
          notes: "Part-time pattern",
        },
      ])
      .returning();

    pattern1Id = pattern1.id;
    _pattern2Id = pattern2.id;
  });

  describe("list", () => {
    it("should list all working patterns for tenant", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.list({});

      expect(result.workingPatterns).toHaveLength(2);
      expect(result.workingPatterns[0]).toHaveProperty("userName");
      expect(result.workingPatterns[0]).toHaveProperty("userEmail");
    });

    it("should filter by userId when provided", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.list({ userId: user1Id });

      expect(result.workingPatterns).toHaveLength(1);
      expect(result.workingPatterns[0].userId).toBe(user1Id);
    });

    it("should enforce multi-tenant isolation", async () => {
      const ctx = createTestContext({
        userId: admin2Id,
        tenantId: tenant2Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.list({});

      // Tenant 2 should not see tenant 1's patterns
      expect(result.workingPatterns).toHaveLength(0);
    });
  });

  describe("getByUser", () => {
    it("should get all patterns for a specific user", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.getByUser(user1Id);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].userId).toBe(user1Id);
    });

    it("should throw NOT_FOUND for non-existent user", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.getByUser("non-existent-user-id"),
      ).rejects.toThrow("User not found");
    });

    it("should enforce multi-tenant isolation", async () => {
      const ctx = createTestContext({
        userId: admin2Id,
        tenantId: tenant2Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(caller.workingPatterns.getByUser(user1Id)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getActive", () => {
    it("should get the currently active pattern for a user", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.getActive(user1Id);

      expect(result.pattern).toBeDefined();
      expect(result.pattern?.userId).toBe(user1Id);
    });

    it("should return null if no active pattern", async () => {
      // Create a future pattern
      await db.insert(workingPatterns).values({
        id: crypto.randomUUID(),
        tenantId: tenant1Id,
        userId: admin1Id,
        patternType: "full_time",
        contractedHours: 37.5,
        mondayHours: 7.5,
        tuesdayHours: 7.5,
        wednesdayHours: 7.5,
        thursdayHours: 7.5,
        fridayHours: 7.5,
        saturdayHours: 0,
        sundayHours: 0,
        effectiveFrom: "2030-01-01", // Future date
        notes: "Future pattern",
      });

      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.getActive(admin1Id);

      // Should return the future pattern as null since it's not yet active
      expect(result.pattern).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new working pattern (admin only)", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.create({
        userId: admin1Id,
        patternType: "compressed_hours",
        contractedHours: 36,
        mondayHours: 9,
        tuesdayHours: 9,
        wednesdayHours: 9,
        thursdayHours: 9,
        fridayHours: 0,
        saturdayHours: 0,
        sundayHours: 0,
        effectiveFrom: "2025-02-01",
        notes: "Compressed 4-day week",
      });

      expect(result.pattern).toBeDefined();
      expect(result.pattern.patternType).toBe("compressed_hours");
      expect(result.pattern.contractedHours).toBe(36);

      // Verify in database
      const [dbPattern] = await db
        .select()
        .from(workingPatterns)
        .where(eq(workingPatterns.id, result.pattern.id));

      expect(dbPattern).toBeDefined();
      expect(dbPattern.userId).toBe(admin1Id);
    });

    it("should validate that sum of day hours equals contracted hours", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.create({
          userId: admin1Id,
          patternType: "full_time",
          contractedHours: 37.5,
          mondayHours: 7.5,
          tuesdayHours: 7.5,
          wednesdayHours: 7.5,
          thursdayHours: 7.5,
          fridayHours: 5, // Wrong! Should be 7.5
          saturdayHours: 0,
          sundayHours: 0,
          effectiveFrom: "2025-02-01",
        }),
      ).rejects.toThrow("Sum of day hours");
    });

    it("should throw BAD_REQUEST for non-existent user", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.create({
          userId: "non-existent-user-id",
          patternType: "full_time",
          contractedHours: 37.5,
          mondayHours: 7.5,
          tuesdayHours: 7.5,
          wednesdayHours: 7.5,
          thursdayHours: 7.5,
          fridayHours: 7.5,
          saturdayHours: 0,
          sundayHours: 0,
          effectiveFrom: "2025-02-01",
        }),
      ).rejects.toThrow("User not found");
    });
  });

  describe("update", () => {
    it("should update an existing working pattern (admin only)", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.update({
        id: pattern1Id,
        notes: "Updated notes",
      });

      expect(result.pattern).toBeDefined();
      expect(result.pattern.notes).toBe("Updated notes");

      // Verify in database
      const [dbPattern] = await db
        .select()
        .from(workingPatterns)
        .where(eq(workingPatterns.id, pattern1Id));

      expect(dbPattern.notes).toBe("Updated notes");
    });

    it("should validate sum of hours when updating", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.update({
          id: pattern1Id,
          mondayHours: 5, // This breaks the sum
        }),
      ).rejects.toThrow("Sum of day hours");
    });

    it("should throw NOT_FOUND for non-existent pattern", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.update({
          id: "non-existent-pattern-id",
          notes: "Updated",
        }),
      ).rejects.toThrow("Working pattern not found");
    });

    it("should enforce multi-tenant isolation", async () => {
      const ctx = createTestContext({
        userId: admin2Id,
        tenantId: tenant2Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.update({
          id: pattern1Id,
          notes: "Updated",
        }),
      ).rejects.toThrow("Working pattern not found");
    });
  });

  describe("delete", () => {
    it("should delete a working pattern (admin only)", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      const result = await caller.workingPatterns.delete(pattern1Id);

      expect(result.success).toBe(true);

      // Verify deleted from database
      const [dbPattern] = await db
        .select()
        .from(workingPatterns)
        .where(eq(workingPatterns.id, pattern1Id));

      expect(dbPattern).toBeUndefined();
    });

    it("should throw NOT_FOUND for non-existent pattern", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.workingPatterns.delete("non-existent-pattern-id"),
      ).rejects.toThrow("Working pattern not found");
    });

    it("should enforce multi-tenant isolation", async () => {
      const ctx = createTestContext({
        userId: admin2Id,
        tenantId: tenant2Id,
        role: "admin",
      });

      const caller = appRouter.createCaller(ctx);
      await expect(caller.workingPatterns.delete(pattern1Id)).rejects.toThrow(
        "Working pattern not found",
      );
    });
  });
});
