/**
 * Timesheets Router Integration Tests
 *
 * Integration-level tests for the timesheets tRPC router.
 * Tests verify database operations, tenant isolation, time tracking calculations, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { timesheetsRouter } from "@/app/server/routers/timesheets";
import { db } from "@/lib/db";
import { activityLogs, timeEntries } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestTenant,
  createTestTimeEntry,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/timesheets.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    timeEntries: [],
  };

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

    caller = createCaller(timesheetsRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.timeEntries = [];
  });

  describe("create (Integration)", () => {
    it("should create time entry and persist to database", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        date: "2025-01-15",
        clientId: client.id,
        description: "Development work",
        hours: "8.00",
        billable: true,
        rate: "150.00",
        status: "draft" as const,
      };

      const result = await caller.create(input);
      tracker.timeEntries?.push(result.timeEntry.id);

      expect(result.success).toBe(true);
      expect(result.timeEntry.id).toBeDefined();
      expect(result.timeEntry.description).toBe("Development work");
      expect(result.timeEntry.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.timeEntry.userId).toBe(ctx.authContext.userId);

      // Verify database persistence
      const [dbEntry] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, result.timeEntry.id));

      expect(dbEntry).toBeDefined();
      expect(dbEntry.description).toBe("Development work");
      expect(dbEntry.hours).toBe("8.00");
      expect(dbEntry.billable).toBe(true);
      expect(dbEntry.rate).toBe("150.00");
      expect(dbEntry.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should create time entry with optional fields", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        date: "2025-01-15",
        clientId: client.id,
        description: "Client meeting",
        hours: "2.00",
        billable: false,
        rate: "0.00",
        status: "draft" as const,
        startTime: "09:00:00",
        endTime: "11:00:00",
        notes: "Discussed project requirements",
      };

      const result = await caller.create(input);
      tracker.timeEntries?.push(result.timeEntry.id);

      expect(result.success).toBe(true);
      expect(result.timeEntry.startTime).toBe("09:00:00");
      expect(result.timeEntry.endTime).toBe("11:00:00");
      expect(result.timeEntry.notes).toBe("Discussed project requirements");
    });

    it("should create activity log for time entry creation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        date: "2025-01-15",
        clientId: client.id,
        description: "Activity Log Test",
        hours: "5.00",
        billable: true,
        rate: "100.00",
        status: "draft" as const,
      };

      const result = await caller.create(input);
      tracker.timeEntries?.push(result.timeEntry.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.timeEntry.id),
            eq(activityLogs.entityType, "timeEntry"),
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("5.00h");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        description: "Test entry",
      };

      await expect(caller.create(invalidInput as unknown)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list time entries with tenant isolation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create test time entries
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "Entry Alpha", hours: "5.00" },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "Entry Beta", hours: "3.00" },
      );
      tracker.timeEntries?.push(entry1.id, entry2.id);

      const result = await caller.list({});

      expect(result.timeEntries).toBeDefined();
      expect(result.timeEntries.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const entry of result.timeEntries) {
        expect(entry.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test entries are in the list
      const entryIds = result.timeEntries.map(
        (e: (typeof result.timeEntries)[0]) => e.id,
      );
      expect(entryIds).toContain(entry1.id);
      expect(entryIds).toContain(entry2.id);
    });

    it("should filter time entries by date range", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entries with different dates
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-10", hours: "5.00" },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-20", hours: "3.00" },
      );
      tracker.timeEntries?.push(entry1.id, entry2.id);

      // Filter to only get entries from Jan 15 onwards
      const result = await caller.list({ startDate: "2025-01-15" });

      expect(result.timeEntries.length).toBeGreaterThanOrEqual(1);
      // Should include entry2, might not include entry1
      const hasEntry2 = result.timeEntries.some(
        (e: (typeof result.timeEntries)[0]) => e.id === entry2.id,
      );
      expect(hasEntry2).toBe(true);
    });

    it("should filter time entries by user", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entry for our test user
      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
      );
      tracker.timeEntries?.push(entry.id);

      const result = await caller.list({ userId: ctx.authContext.userId });

      expect(result.timeEntries.length).toBeGreaterThanOrEqual(1);
      // All returned entries should be for this user
      for (const e of result.timeEntries) {
        expect(e.userId).toBe(ctx.authContext.userId);
      }
    });

    it("should filter time entries by client", async () => {
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client One",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Two",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      // Create entries for different clients
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client1.id,
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client2.id,
      );
      tracker.timeEntries?.push(entry1.id, entry2.id);

      const result = await caller.list({ clientId: client1.id });

      expect(result.timeEntries.length).toBeGreaterThanOrEqual(1);
      // All returned entries should be for client1
      for (const e of result.timeEntries) {
        expect(e.clientId).toBe(client1.id);
      }
    });

    it("should filter time entries by billable status", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create billable and non-billable entries
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { billable: true, hours: "5.00" },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { billable: false, hours: "3.00" },
      );
      tracker.timeEntries?.push(entry1.id, entry2.id);

      const result = await caller.list({ billable: true });

      expect(result.timeEntries.length).toBeGreaterThanOrEqual(1);
      // All returned entries should be billable
      for (const e of result.timeEntries) {
        expect(e.billable).toBe(true);
      }
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve time entry by ID", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "GetById Test Entry" },
      );
      tracker.timeEntries?.push(entry.id);

      const result = await caller.getById(entry.id);

      expect(result.id).toBe(entry.id);
      expect(result.description).toBe("GetById Test Entry");
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Time entry not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create time entry for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const entryA = await createTestTimeEntry(
        tenantAId,
        userAId,
        clientAId.id,
        {
          description: "Tenant A Entry",
        },
      );
      tracker.timeEntries?.push(entryA.id);

      // Attempt to access tenant A's entry from tenant B (our test tenant)
      await expect(caller.getById(entryA.id)).rejects.toThrow(
        "Time entry not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(entryA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update time entry and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          description: "Original Description",
          hours: "5.00",
          billable: true,
        },
      );
      tracker.timeEntries?.push(entry.id);

      const result = await caller.update({
        id: entry.id,
        data: {
          description: "Updated Description",
          hours: "8.00",
          billable: false,
        },
      });

      expect(result.timeEntry.description).toBe("Updated Description");
      expect(result.timeEntry.hours).toBe("8.00");
      expect(result.timeEntry.billable).toBe(false);

      // Verify database persistence
      const [dbEntry] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, entry.id));

      expect(dbEntry.description).toBe("Updated Description");
      expect(dbEntry.hours).toBe("8.00");
      expect(dbEntry.billable).toBe(false);
    });

    it("should create activity log for update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "Update Log Test" },
      );
      tracker.timeEntries?.push(entry.id);

      await caller.update({
        id: entry.id,
        data: { description: "Updated for Log Test" },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, entry.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent time entry", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { hours: "10.00" },
        }),
      ).rejects.toThrow("Time entry not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create time entry for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const entryA = await createTestTimeEntry(
        tenantAId,
        userAId,
        clientAId.id,
      );
      tracker.timeEntries?.push(entryA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: entryA.id,
          data: { description: "Malicious Update" },
        }),
      ).rejects.toThrow("Time entry not found");
    });

    it("should allow partial updates", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          description: "Partial Update Test",
          hours: "5.00",
          notes: "Original notes",
        },
      );
      tracker.timeEntries?.push(entry.id);

      // Update only notes
      await caller.update({
        id: entry.id,
        data: { notes: "Updated notes only" },
      });

      const [dbEntry] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, entry.id));

      // Notes should be updated
      expect(dbEntry.notes).toBe("Updated notes only");
      // Other fields should remain unchanged
      expect(dbEntry.description).toBe("Partial Update Test");
      expect(dbEntry.hours).toBe("5.00");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete time entry", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "Delete Test Entry" },
      );
      tracker.timeEntries?.push(entry.id);

      const result = await caller.delete(entry.id);

      expect(result.success).toBe(true);

      // Verify entry is deleted (hard delete)
      const [dbEntry] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, entry.id));

      expect(dbEntry).toBeUndefined();
    });

    it("should create activity log for deletion", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { description: "Delete Log Test", hours: "5.00" },
      );
      tracker.timeEntries?.push(entry.id);

      await caller.delete(entry.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, entry.id),
            eq(activityLogs.action, "deleted"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("5.00h");
    });

    it("should throw NOT_FOUND for non-existent time entry", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Time entry not found",
      );
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create time entry for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const entryA = await createTestTimeEntry(
        tenantAId,
        userAId,
        clientAId.id,
      );
      tracker.timeEntries?.push(entryA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(entryA.id)).rejects.toThrow(
        "Time entry not found",
      );

      // Verify entry still exists
      const [dbEntry] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, entryA.id));

      expect(dbEntry).toBeDefined();
    });
  });

  describe("summary (Integration)", () => {
    it("should calculate summary statistics correctly", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create multiple time entries
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-10", hours: "8.00", billable: true },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-11", hours: "5.00", billable: true },
      );
      const entry3 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-12", hours: "3.00", billable: false },
      );
      tracker.timeEntries?.push(entry1.id, entry2.id, entry3.id);

      const result = await caller.summary({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      expect(result.totalEntries).toBeGreaterThanOrEqual(3);
      expect(result.totalHours).toBeGreaterThanOrEqual(16); // 8 + 5 + 3
      expect(result.billableHours).toBeGreaterThanOrEqual(13); // 8 + 5
      expect(result.nonBillableHours).toBeGreaterThanOrEqual(3);
      expect(result.daysWorked).toBeGreaterThanOrEqual(3);
      expect(result.uniqueClients).toBeGreaterThanOrEqual(1);
    });

    it("should filter summary by user", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entry for our test user
      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-15", hours: "6.00" },
      );
      tracker.timeEntries?.push(entry.id);

      const result = await caller.summary({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        userId: ctx.authContext.userId,
      });

      expect(result.totalEntries).toBeGreaterThanOrEqual(1);
      expect(result.totalHours).toBeGreaterThanOrEqual(6);
    });

    it("should respect tenant isolation in summary", async () => {
      // Create entry for our tenant
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const entry = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        { date: "2025-01-15", hours: "7.00" },
      );
      tracker.timeEntries?.push(entry.id);

      // Create entry for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const entryA = await createTestTimeEntry(
        tenantAId,
        userAId,
        clientAId.id,
        {
          date: "2025-01-15",
          hours: "100.00", // Large hours to detect if included
        },
      );
      tracker.timeEntries?.push(entryA.id);

      // Summary should only include our tenant's data
      const result = await caller.summary({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      // The summary should not include the other tenant's 100 hours
      // (We know our entry is 7 hours, so total should be close to that)
      expect(result.totalHours).toBeLessThan(50); // Should be around 7, not 107
    });

    it("should validate required date fields", async () => {
      const invalidInput = {
        // Missing required startDate/endDate
        userId: ctx.authContext.userId,
      };

      await expect(caller.summary(invalidInput as unknown)).rejects.toThrow();
    });
  });

  describe("getWeek (Integration)", () => {
    it("should return time entries for specified week", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entries for 3 different days in the same week
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-13", // Monday
          hours: "7.5",
          workType: "WORK",
        },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-14", // Tuesday
          hours: "8.0",
          workType: "WORK",
        },
      );
      const entry3 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-20", // Next Monday (different week)
          hours: "6.0",
          workType: "TOIL",
        },
      );

      tracker.timeEntries?.push(entry1.id, entry2.id, entry3.id);

      // Query for week of Jan 13-19
      const result = await caller.getWeek({
        weekStartDate: "2025-01-13",
        weekEndDate: "2025-01-19",
      });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toContain(entry1.id);
      expect(result.map((e) => e.id)).toContain(entry2.id);
      expect(result.map((e) => e.id)).not.toContain(entry3.id);
    });

    it("should enforce tenant isolation when querying week", async () => {
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId, { role: "staff" });
      const clientAId = await createTestClient(tenantAId, userAId);

      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const entryA = await createTestTimeEntry(
        tenantAId,
        userAId,
        clientAId.id,
        {
          date: "2025-01-15",
        },
      );
      tracker.timeEntries?.push(entryA.id);

      // Query from tenant B (our test tenant) should not see tenant A's entries
      const result = await caller.getWeek({
        weekStartDate: "2025-01-13",
        weekEndDate: "2025-01-19",
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("copyPreviousWeek (Integration)", () => {
    it("should copy entries from previous week with adjusted dates", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entries for previous week (Jan 6-12)
      const prevEntry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-06", // Monday
          hours: "7.5",
          workType: "WORK",
          description: "Week 1 work",
        },
      );
      const prevEntry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-08", // Wednesday
          hours: "8.0",
          workType: "WORK",
          description: "Week 1 work",
        },
      );

      tracker.timeEntries?.push(prevEntry1.id, prevEntry2.id);

      // Copy to current week (Jan 13-19)
      const result = await caller.copyPreviousWeek({
        currentWeekStartDate: "2025-01-13",
        currentWeekEndDate: "2025-01-19",
      });

      expect(result.success).toBe(true);
      expect(result.entriesCopied).toBe(2);

      // Verify copied entries exist in current week
      const currentWeekEntries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, ctx.authContext.tenantId),
            eq(timeEntries.userId, ctx.authContext.userId),
            eq(timeEntries.date, "2025-01-13"), // Monday of current week
          ),
        );

      // Track new entries for cleanup
      for (const entry of currentWeekEntries) {
        tracker.timeEntries?.push(entry.id);
      }

      expect(currentWeekEntries).toHaveLength(1);
      expect(currentWeekEntries[0].hours).toBe("7.50");
      expect(currentWeekEntries[0].workType).toBe("WORK");
      expect(currentWeekEntries[0].status).toBe("draft");
    });

    it("should return zero entries copied when previous week is empty", async () => {
      const result = await caller.copyPreviousWeek({
        currentWeekStartDate: "2025-01-13",
        currentWeekEndDate: "2025-01-19",
      });

      expect(result.success).toBe(true);
      expect(result.entriesCopied).toBe(0);
    });
  });

  describe("getWeeklySummary (Integration)", () => {
    it("should calculate total hours and billable percentage", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create entries with mix of billable and non-billable
      const entry1 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-13",
          hours: "7.5",
          billable: true,
          workType: "WORK",
        },
      );
      const entry2 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-14",
          hours: "8.0",
          billable: true,
          workType: "WORK",
        },
      );
      const entry3 = await createTestTimeEntry(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        client.id,
        {
          date: "2025-01-15",
          hours: "7.5",
          billable: false,
          workType: "TOIL",
        },
      );

      tracker.timeEntries?.push(entry1.id, entry2.id, entry3.id);

      const result = await caller.getWeeklySummary({
        weekStartDate: "2025-01-13",
        weekEndDate: "2025-01-19",
      });

      expect(result.totalHours).toBe(23);
      expect(result.billableHours).toBe(15.5);
      expect(result.nonBillableHours).toBe(7.5);
      expect(result.billablePercentage).toBeCloseTo(67.39, 1);
      expect(result.entriesCount).toBe(3);

      // Check work type breakdown
      expect(result.workTypeBreakdown).toHaveLength(2);
      expect(result.workTypeBreakdown).toContainEqual({
        name: "WORK",
        hours: 15.5,
        percentage: expect.closeTo(67.39, 1),
      });
      expect(result.workTypeBreakdown).toContainEqual({
        name: "TOIL",
        hours: 7.5,
        percentage: expect.closeTo(32.61, 1),
      });
    });

    it("should handle empty week with zero hours", async () => {
      const result = await caller.getWeeklySummary({
        weekStartDate: "2025-01-13",
        weekEndDate: "2025-01-19",
      });

      expect(result.totalHours).toBe(0);
      expect(result.billableHours).toBe(0);
      expect(result.billablePercentage).toBe(0);
      expect(result.workTypeBreakdown).toHaveLength(0);
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(timesheetsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("summary");
      expect(procedures).toContain("getWeek");
      expect(procedures).toContain("copyPreviousWeek");
      expect(procedures).toContain("getWeeklySummary");
    });

    it("should have 16 procedures total", () => {
      const procedures = Object.keys(timesheetsRouter._def.procedures);
      expect(procedures).toHaveLength(16);
    });
  });
});
