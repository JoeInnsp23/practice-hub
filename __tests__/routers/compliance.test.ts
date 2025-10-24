/**
 * Compliance Router Integration Tests
 *
 * Integration-level tests for the compliance tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Context } from "@/app/server/context";
import { complianceRouter } from "@/app/server/routers/compliance";
import { db } from "@/lib/db";
import { activityLogs, compliance } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("app/server/routers/compliance.ts (Integration)", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof complianceRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
  };
  // Track compliance items separately (not in TestDataTracker)
  const complianceIds: string[] = [];

  beforeEach(async () => {
    // Create test tenant and user for each test
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create mock context with test tenant and user
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

    caller = createCaller(complianceRouter, ctx);
  });

  afterEach(async () => {
    // Clean up compliance items first (foreign key dependency)
    if (complianceIds.length > 0) {
      for (const id of complianceIds) {
        await db
          .delete(compliance)
          .where(eq(compliance.id, id))
          .catch(() => {
            // Ignore errors - item may already be deleted
          });
      }
      complianceIds.length = 0; // Clear array
    }

    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
  });

  describe("create (Integration)", () => {
    it("should create compliance item and persist to database", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        title: `VAT Return Q4 ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-03-31",
        description: "Quarterly VAT return submission",
        clientId: client.id,
        status: "pending" as const,
        priority: "high" as const,
      };

      const result = await caller.create(input);
      complianceIds.push(result.compliance.id);

      expect(result.success).toBe(true);
      expect(result.compliance.id).toBeDefined();
      expect(result.compliance.title).toContain("VAT Return");
      expect(result.compliance.tenantId).toBe(ctx.authContext.tenantId);

      // Verify database persistence
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, result.compliance.id));

      expect(dbItem).toBeDefined();
      expect(dbItem.title).toContain("VAT Return");
      expect(dbItem.tenantId).toBe(ctx.authContext.tenantId);
      expect(dbItem.clientId).toBe(client.id);
      expect(dbItem.type).toBe("tax_return");
      expect(dbItem.status).toBe("pending");
      expect(dbItem.priority).toBe("high");
      expect(dbItem.createdById).toBe(ctx.authContext.userId);
    });

    it("should create compliance with optional fields", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId, {
        firstName: "Jane",
        lastName: "Accountant",
      });
      tracker.users?.push(assigneeId);

      const input = {
        title: `Corporation Tax ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-12-31",
        description: "Annual corporation tax return",
        clientId: client.id,
        assignedToId: assigneeId,
        reminderDate: "2025-12-01",
        status: "pending" as const,
        priority: "medium" as const,
        notes: "Prepare all documentation",
      };

      const result = await caller.create(input);
      complianceIds.push(result.compliance.id);

      expect(result.success).toBe(true);
      expect(result.compliance.assignedToId).toBe(assigneeId);
      expect(result.compliance.notes).toBe("Prepare all documentation");
    });

    it("should create activity log for compliance creation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        title: `Activity Log Test ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-06-30",
        clientId: client.id,
      };

      const result = await caller.create(input);
      complianceIds.push(result.compliance.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.compliance.id),
            eq(activityLogs.entityType, "compliance"),
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Activity Log Test");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should default assignedToId to current user if not provided", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        title: `Default Assignee ${Date.now()}`,
        type: "annual_accounts",
        dueDate: "2025-09-30",
        clientId: client.id,
        // assignedToId not provided
      };

      const result = await caller.create(input);
      complianceIds.push(result.compliance.id);

      expect(result.compliance.assignedToId).toBe(ctx.authContext.userId);
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing title, type, dueDate, clientId
        description: "Missing required fields",
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list compliance items with tenant isolation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create compliance items
      const item1Result = await caller.create({
        title: `Compliance Alpha ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-04-30",
        clientId: client.id,
      });
      const item2Result = await caller.create({
        title: `Compliance Beta ${Date.now()}`,
        type: "payroll_submission",
        dueDate: "2025-05-31",
        clientId: client.id,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({});

      expect(result.compliance).toBeDefined();
      expect(result.compliance.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const item of result.compliance) {
        expect(item.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test items are in the list
      const itemIds = result.compliance.map(
        (c: typeof result.compliance[0]) => c.id,
      );
      expect(itemIds).toContain(item1Result.compliance.id);
      expect(itemIds).toContain(item2Result.compliance.id);
    });

    it("should filter compliance by search term", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const searchTerm = `SearchableVAT-${Date.now()}`;
      const item1Result = await caller.create({
        title: searchTerm,
        type: "vat_return",
        dueDate: "2025-06-30",
        clientId: client.id,
      });
      const item2Result = await caller.create({
        title: `Unrelated Payroll ${Date.now()}`,
        type: "payroll_submission",
        dueDate: "2025-06-30",
        clientId: client.id,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({ search: searchTerm });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      const hasSearchable = result.compliance.some(
        (c: typeof result.compliance[0]) => c.title.includes(searchTerm),
      );
      expect(hasSearchable).toBe(true);
    });

    it("should filter compliance by type", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const item1Result = await caller.create({
        title: `VAT Return ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-07-31",
        clientId: client.id,
      });
      const item2Result = await caller.create({
        title: `Annual Accounts ${Date.now()}`,
        type: "annual_accounts",
        dueDate: "2025-07-31",
        clientId: client.id,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({ type: "vat_return" });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      // All returned items should be VAT returns
      for (const item of result.compliance) {
        expect(item.type).toBe("vat_return");
      }
    });

    it("should filter compliance by status", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const item1Result = await caller.create({
        title: `Pending Item ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-08-31",
        clientId: client.id,
        status: "pending" as const,
      });
      const item2Result = await caller.create({
        title: `In Progress Item ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-08-31",
        clientId: client.id,
        status: "in_progress" as const,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({ status: "pending" });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      // All returned items should be pending
      for (const item of result.compliance) {
        expect(item.status).toBe("pending");
      }
    });

    it("should filter compliance by clientId", async () => {
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Filter Test 1",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Filter Test 2",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const item1Result = await caller.create({
        title: `Client 1 Compliance ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-09-30",
        clientId: client1.id,
      });
      const item2Result = await caller.create({
        title: `Client 2 Compliance ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-09-30",
        clientId: client2.id,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({ clientId: client1.id });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      // All returned items should belong to client1
      for (const item of result.compliance) {
        expect(item.clientId).toBe(client1.id);
      }
    });

    it("should filter compliance by assigneeId", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const assignee1 = await createTestUser(ctx.authContext.tenantId, {
        firstName: "Assignee",
        lastName: "One",
      });
      const assignee2 = await createTestUser(ctx.authContext.tenantId, {
        firstName: "Assignee",
        lastName: "Two",
      });
      tracker.users?.push(assignee1, assignee2);

      const item1Result = await caller.create({
        title: `Assignee 1 Task ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-10-31",
        clientId: client.id,
        assignedToId: assignee1,
      });
      const item2Result = await caller.create({
        title: `Assignee 2 Task ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-10-31",
        clientId: client.id,
        assignedToId: assignee2,
      });
      complianceIds.push(item1Result.compliance.id, item2Result.compliance.id);

      const result = await caller.list({ assigneeId: assignee1 });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      // All returned items should be assigned to assignee1
      for (const item of result.compliance) {
        expect(item.assignedToId).toBe(assignee1);
      }
    });

    it("should filter overdue compliance items", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create overdue item (past due date, not completed)
      const overdueResult = await caller.create({
        title: `Overdue Item ${Date.now()}`,
        type: "vat_return",
        dueDate: "2020-01-01", // Past date
        clientId: client.id,
        status: "pending" as const,
      });
      complianceIds.push(overdueResult.compliance.id);

      const result = await caller.list({ overdue: true });

      expect(result.compliance.length).toBeGreaterThanOrEqual(1);
      const hasOverdueItem = result.compliance.some(
        (c: typeof result.compliance[0]) => c.id === overdueResult.compliance.id,
      );
      expect(hasOverdueItem).toBe(true);
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve compliance item by ID", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `GetById Test ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-11-30",
        clientId: client.id,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.getById(createResult.compliance.id);

      expect(result.id).toBe(createResult.compliance.id);
      expect(result.title).toContain("GetById Test");
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Compliance item not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create compliance for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      // Create context for tenant A temporarily
      const ctxA = createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          organizationName: "Tenant A",
          role: "admin",
          email: `tenant-a-${Date.now()}@example.com`,
          firstName: "Tenant",
          lastName: "A",
        },
      });
      const callerA = createCaller(complianceRouter, ctxA);

      const complianceA = await callerA.create({
        title: `Tenant A Compliance ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: clientA.id,
      });
      complianceIds.push(complianceA.compliance.id);

      // Attempt to access tenant A's compliance from tenant B (our test tenant)
      await expect(caller.getById(complianceA.compliance.id)).rejects.toThrow(
        "Compliance item not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(complianceA.compliance.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update compliance item and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Original Title ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
        status: "pending" as const,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.update({
        id: createResult.compliance.id,
        data: {
          title: "Updated Title",
          status: "in_progress" as const,
          notes: "Work started",
        },
      });

      expect(result.compliance.title).toBe("Updated Title");
      expect(result.compliance.status).toBe("in_progress");
      expect(result.compliance.notes).toBe("Work started");

      // Verify database persistence
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      expect(dbItem.title).toBe("Updated Title");
      expect(dbItem.status).toBe("in_progress");
      expect(dbItem.notes).toBe("Work started");
    });

    it("should set completedDate when status changes to completed", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Completion Test ${Date.now()}`,
        type: "tax_return",
        dueDate: "2025-12-31",
        clientId: client.id,
        status: "pending" as const,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.update({
        id: createResult.compliance.id,
        data: {
          status: "completed" as const,
        },
      });

      expect(result.compliance.status).toBe("completed");
      expect(result.compliance.completedDate).toBeDefined();

      // Verify database persistence
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      expect(dbItem.completedDate).not.toBeNull();
    });

    it("should create activity log for update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Update Log Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
      });
      complianceIds.push(createResult.compliance.id);

      await caller.update({
        id: createResult.compliance.id,
        data: { priority: "urgent" as const },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, createResult.compliance.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent compliance item", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { title: "Should Fail" },
        }),
      ).rejects.toThrow("Compliance item not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create compliance for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const ctxA = createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          organizationName: "Tenant A",
          role: "admin",
          email: `tenant-a-${Date.now()}@example.com`,
          firstName: "Tenant",
          lastName: "A",
        },
      });
      const callerA = createCaller(complianceRouter, ctxA);

      const complianceA = await callerA.create({
        title: `Tenant A Item ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: clientA.id,
      });
      complianceIds.push(complianceA.compliance.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: complianceA.compliance.id,
          data: { title: "Malicious Update" },
        }),
      ).rejects.toThrow("Compliance item not found");
    });

    it("should allow partial updates", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Partial Update ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
        priority: "medium" as const,
        notes: "Original notes",
      });
      complianceIds.push(createResult.compliance.id);

      // Update only priority
      await caller.update({
        id: createResult.compliance.id,
        data: { priority: "urgent" as const },
      });

      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      // Priority should be updated
      expect(dbItem.priority).toBe("urgent");
      // Other fields should remain unchanged
      expect(dbItem.title).toContain("Partial Update");
      expect(dbItem.notes).toBe("Original notes");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete compliance item from database", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Delete Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.delete(createResult.compliance.id);

      expect(result.success).toBe(true);

      // Verify compliance is deleted (hard delete)
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      expect(dbItem).toBeUndefined();
    });

    it("should create activity log for deletion", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Delete Log Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
      });
      complianceIds.push(createResult.compliance.id);

      await caller.delete(createResult.compliance.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, createResult.compliance.id),
            eq(activityLogs.action, "deleted"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Delete Log Test");
    });

    it("should throw NOT_FOUND for non-existent compliance item", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Compliance item not found",
      );
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create compliance for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const ctxA = createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          organizationName: "Tenant A",
          role: "admin",
          email: `tenant-a-${Date.now()}@example.com`,
          firstName: "Tenant",
          lastName: "A",
        },
      });
      const callerA = createCaller(complianceRouter, ctxA);

      const complianceA = await callerA.create({
        title: `Tenant A Delete Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: clientA.id,
      });
      complianceIds.push(complianceA.compliance.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(complianceA.compliance.id)).rejects.toThrow(
        "Compliance item not found",
      );

      // Verify compliance still exists
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, complianceA.compliance.id));

      expect(dbItem).toBeDefined();
    });
  });

  describe("updateStatus (Integration)", () => {
    it("should update status and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Status Update Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
        status: "pending" as const,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.updateStatus({
        id: createResult.compliance.id,
        status: "in_progress",
      });

      expect(result.compliance.status).toBe("in_progress");

      // Verify database persistence
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      expect(dbItem.status).toBe("in_progress");
    });

    it("should set completedDate when status changes to completed", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Status Completion Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
        status: "pending" as const,
      });
      complianceIds.push(createResult.compliance.id);

      const result = await caller.updateStatus({
        id: createResult.compliance.id,
        status: "completed",
      });

      expect(result.compliance.status).toBe("completed");
      expect(result.compliance.completedDate).toBeDefined();

      // Verify database persistence
      const [dbItem] = await db
        .select()
        .from(compliance)
        .where(eq(compliance.id, createResult.compliance.id));

      expect(dbItem.completedDate).not.toBeNull();
    });

    it("should create activity log for status update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const createResult = await caller.create({
        title: `Status Log Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: client.id,
      });
      complianceIds.push(createResult.compliance.id);

      await caller.updateStatus({
        id: createResult.compliance.id,
        status: "completed",
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, createResult.compliance.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent compliance item", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.updateStatus({
          id: nonExistentId,
          status: "completed",
        }),
      ).rejects.toThrow("Compliance item not found");
    });

    it("should prevent cross-tenant status update", async () => {
      // Create compliance for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const ctxA = createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          organizationName: "Tenant A",
          role: "admin",
          email: `tenant-a-${Date.now()}@example.com`,
          firstName: "Tenant",
          lastName: "A",
        },
      });
      const callerA = createCaller(complianceRouter, ctxA);

      const complianceA = await callerA.create({
        title: `Tenant A Status Test ${Date.now()}`,
        type: "vat_return",
        dueDate: "2025-12-31",
        clientId: clientA.id,
      });
      complianceIds.push(complianceA.compliance.id);

      // Attempt to update status from different tenant
      await expect(
        caller.updateStatus({
          id: complianceA.compliance.id,
          status: "completed",
        }),
      ).rejects.toThrow("Compliance item not found");
    });

    it("should accept all valid status values", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const validStatuses: Array<
        "pending" | "in_progress" | "completed" | "overdue"
      > = ["pending", "in_progress", "completed", "overdue"];

      for (const status of validStatuses) {
        const createResult = await caller.create({
          title: `Status ${status} Test ${Date.now()}`,
          type: "vat_return",
          dueDate: "2025-12-31",
          clientId: client.id,
        });
        complianceIds.push(createResult.compliance.id);

        const result = await caller.updateStatus({
          id: createResult.compliance.id,
          status,
        });

        expect(result.compliance.status).toBe(status);
      }
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(complianceRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("updateStatus");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(complianceRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
