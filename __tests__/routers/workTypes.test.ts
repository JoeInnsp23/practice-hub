/**
 * Work Types Router Integration Tests
 *
 * Integration tests for the workTypes tRPC router.
 * Tests verify CRUD operations, tenant isolation, and business logic.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Context } from "@/app/server/context";
import { workTypesRouter } from "@/app/server/routers/workTypes";
import { db } from "@/lib/db";
import { workTypes, timeEntries } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

// Helper function to create test work type
async function createTestWorkType(
  tenantId: string,
  overrides: Partial<typeof workTypes.$inferInsert> = {},
) {
  const timestamp = Date.now();
  const [workType] = await db
    .insert(workTypes)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      code: overrides.code || `TEST_${timestamp}`,
      label: overrides.label || `Test Work Type ${timestamp}`,
      colorCode: overrides.colorCode || "#3b82f6",
      isBillable: overrides.isBillable ?? true,
      sortOrder: overrides.sortOrder ?? 0,
      isActive: overrides.isActive ?? true,
    })
    .returning();

  return workType;
}

describe("app/server/routers/workTypes.ts (Integration)", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof workTypesRouter>>;
  const tracker: TestDataTracker & { workTypes?: string[] } = {
    tenants: [],
    users: [],
    workTypes: [],
  };

  beforeEach(async () => {
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    caller = createCaller(workTypesRouter, ctx);
  });

  afterEach(async () => {
    // Cleanup work types
    if (tracker.workTypes && tracker.workTypes.length > 0) {
      for (const workTypeId of tracker.workTypes) {
        await db
          .delete(workTypes)
          .where(eq(workTypes.id, workTypeId))
          .catch(() => {});
      }
      tracker.workTypes = [];
    }

    // Cleanup test data
    await cleanupTestData(tracker);
  });

  describe("list", () => {
    it("should list all active work types for tenant", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const workType1 = await createTestWorkType(ctx.authContext.tenantId, {
        code: "WORK1",
        label: "Work Type 1",
        sortOrder: 1,
      });
      const workType2 = await createTestWorkType(ctx.authContext.tenantId, {
        code: "WORK2",
        label: "Work Type 2",
        sortOrder: 2,
      });

      tracker.workTypes?.push(workType1.id, workType2.id);

      const result = await caller.list();

      expect(result.workTypes).toHaveLength(2);
      expect(result.workTypes[0].code).toBe("WORK1");
      expect(result.workTypes[1].code).toBe("WORK2");
    });

    it("should filter out inactive work types by default", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const active = await createTestWorkType(ctx.authContext.tenantId, {
        code: "ACTIVE",
        isActive: true,
      });
      const inactive = await createTestWorkType(ctx.authContext.tenantId, {
        code: "INACTIVE",
        isActive: false,
      });

      tracker.workTypes?.push(active.id, inactive.id);

      const result = await caller.list();

      expect(result.workTypes).toHaveLength(1);
      expect(result.workTypes[0].code).toBe("ACTIVE");
    });

    it("should include inactive when requested", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const active = await createTestWorkType(ctx.authContext.tenantId, {
        code: "ACTIVE",
        isActive: true,
      });
      const inactive = await createTestWorkType(ctx.authContext.tenantId, {
        code: "INACTIVE",
        isActive: false,
      });

      tracker.workTypes?.push(active.id, inactive.id);

      const result = await caller.list({ includeInactive: true });

      expect(result.workTypes).toHaveLength(2);
    });

    it("should enforce tenant isolation", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      // Create work type for another tenant
      const otherTenantId = await createTestTenant();
      tracker.tenants?.push(otherTenantId);

      const otherWorkType = await createTestWorkType(otherTenantId, {
        code: "OTHER",
      });
      tracker.workTypes?.push(otherWorkType.id);

      const result = await caller.list();

      expect(result.workTypes).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new work type", async () => {
      const result = await caller.create({
        code: "CUSTOM",
        label: "Custom Work",
        colorCode: "#ef4444",
        isBillable: false,
      });

      expect(result.workType.code).toBe("CUSTOM");
      expect(result.workType.label).toBe("Custom Work");
      expect(result.workType.colorCode).toBe("#ef4444");
      expect(result.workType.isBillable).toBe(false);

      tracker.workTypes?.push(result.workType.id);
    });

    it("should auto-assign sort order", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const workType1 = await createTestWorkType(ctx.authContext.tenantId, {
        sortOrder: 5,
      });
      tracker.workTypes?.push(workType1.id);

      const result = await caller.create({
        code: "NEW",
        label: "New Type",
        colorCode: "#3b82f6",
        isBillable: true,
      });

      expect(result.workType.sortOrder).toBe(6);
      tracker.workTypes?.push(result.workType.id);
    });

    it("should reject duplicate code", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const existing = await createTestWorkType(ctx.authContext.tenantId, {
        code: "DUPLICATE",
      });
      tracker.workTypes?.push(existing.id);

      await expect(
        caller.create({
          code: "DUPLICATE",
          label: "Duplicate",
          colorCode: "#3b82f6",
          isBillable: true,
        }),
      ).rejects.toThrow("Work type with this code already exists");
    });

    it("should reject invalid color code", async () => {
      await expect(
        caller.create({
          code: "INVALID",
          label: "Invalid",
          colorCode: "not-a-color",
          isBillable: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update work type properties", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const workType = await createTestWorkType(ctx.authContext.tenantId, {
        code: "UPDATE_ME",
        label: "Old Label",
        colorCode: "#000000",
      });
      tracker.workTypes?.push(workType.id);

      const result = await caller.update({
        id: workType.id,
        label: "New Label",
        colorCode: "#ffffff",
        isBillable: false,
      });

      expect(result.workType.label).toBe("New Label");
      expect(result.workType.colorCode).toBe("#ffffff");
      expect(result.workType.isBillable).toBe(false);
      expect(result.workType.code).toBe("UPDATE_ME"); // Code unchanged
    });

    it("should reject update for non-existent work type", async () => {
      await expect(
        caller.update({
          id: crypto.randomUUID(),
          label: "New Label",
        }),
      ).rejects.toThrow("Work type not found");
    });

    it("should enforce tenant isolation", async () => {
      // Create work type for another tenant
      const otherTenantId = await createTestTenant();
      tracker.tenants?.push(otherTenantId);

      const otherWorkType = await createTestWorkType(otherTenantId, {
        code: "OTHER",
      });
      tracker.workTypes?.push(otherWorkType.id);

      await expect(
        caller.update({
          id: otherWorkType.id,
          label: "Hacked",
        }),
      ).rejects.toThrow("Work type not found");
    });
  });

  describe("softDelete", () => {
    it("should hard delete when no time entries exist", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const workType = await createTestWorkType(ctx.authContext.tenantId, {
        code: "DELETE_ME",
      });
      tracker.workTypes?.push(workType.id);

      const result = await caller.softDelete(workType.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Work type deleted");

      // Verify it's actually deleted
      const [deleted] = await db
        .select()
        .from(workTypes)
        .where(eq(workTypes.id, workType.id));

      expect(deleted).toBeUndefined();
    });

    it("should soft delete when time entries exist", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const workType = await createTestWorkType(ctx.authContext.tenantId, {
        code: "USED",
      });
      tracker.workTypes?.push(workType.id);

      // Create a time entry using this work type
      const [timeEntry] = await db
        .insert(timeEntries)
        .values({
          id: crypto.randomUUID(),
          tenantId: ctx.authContext.tenantId,
          userId: ctx.authContext.userId,
          date: new Date().toISOString().split("T")[0],
          hours: "1.00",
          workType: "USED",
          billable: true,
          status: "draft",
        })
        .returning();

      const result = await caller.softDelete(workType.id);

      expect(result.success).toBe(true);
      expect(result.message).toContain("deactivated");

      // Verify it's soft deleted
      const [softDeleted] = await db
        .select()
        .from(workTypes)
        .where(eq(workTypes.id, workType.id));

      expect(softDeleted.isActive).toBe(false);

      // Cleanup
      await db.delete(timeEntries).where(eq(timeEntries.id, timeEntry.id));
    });
  });

  describe("reorder", () => {
    it("should update sort orders", async () => {
      if (!ctx.authContext) throw new Error("No auth context");

      const wt1 = await createTestWorkType(ctx.authContext.tenantId, {
        code: "A",
        sortOrder: 1,
      });
      const wt2 = await createTestWorkType(ctx.authContext.tenantId, {
        code: "B",
        sortOrder: 2,
      });
      tracker.workTypes?.push(wt1.id, wt2.id);

      await caller.reorder([
        { id: wt1.id, sortOrder: 2 },
        { id: wt2.id, sortOrder: 1 },
      ]);

      const [updated1] = await db
        .select()
        .from(workTypes)
        .where(eq(workTypes.id, wt1.id));
      const [updated2] = await db
        .select()
        .from(workTypes)
        .where(eq(workTypes.id, wt2.id));

      expect(updated1.sortOrder).toBe(2);
      expect(updated2.sortOrder).toBe(1);
    });
  });
});
