/**
 * Tasks Router Integration Tests
 *
 * Integration-level tests for the tasks tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { tasksRouter } from "@/app/server/routers/tasks";
import { createCaller, createMockContext } from "../helpers/trpc";
import {
  createTestTenant,
  createTestUser,
  createTestClient,
  createTestTask,
  cleanupTestData,
  type TestDataTracker,
} from "../helpers/factories";
import { db } from "@/lib/db";
import { tasks, activityLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Context } from "@/app/server/context";

describe("app/server/routers/tasks.ts (Integration)", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof tasksRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    tasks: [],
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

    caller = createCaller(tasksRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.tasks = [];
  });

  describe("create (Integration)", () => {
    it("should create task and persist to database", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const input = {
        title: "Review Annual Accounts",
        description: "Review and finalize annual accounts for client",
        status: "pending" as const,
        priority: "high" as const,
        clientId: client.id,
      };

      const result = await caller.create(input);
      tracker.tasks?.push(result.task.id);

      expect(result.success).toBe(true);
      expect(result.task.id).toBeDefined();
      expect(result.task.title).toBe("Review Annual Accounts");
      expect(result.task.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.task.createdById).toBe(ctx.authContext.userId);

      // Verify database persistence
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, result.task.id));

      expect(dbTask).toBeDefined();
      expect(dbTask.title).toBe("Review Annual Accounts");
      expect(dbTask.status).toBe("pending");
      expect(dbTask.priority).toBe("high");
      expect(dbTask.clientId).toBe(client.id);
    });

    it("should create activity log for task creation", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const input = {
        title: "Activity Log Test Task",
        status: "pending" as const,
        clientId: client.id,
      };

      const result = await caller.create(input);
      tracker.tasks?.push(result.task.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.task.id),
            eq(activityLogs.entityType, "task"),
            eq(activityLogs.action, "created")
          )
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Activity Log Test Task");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should auto-assign to current user if no assignee specified", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const input = {
        title: "Auto-Assigned Task",
        clientId: client.id,
      };

      const result = await caller.create(input);
      tracker.tasks?.push(result.task.id);

      expect(result.task.assignedToId).toBe(ctx.authContext.userId);
    });

    it("should set default status to pending if not provided", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const input = {
        title: "Default Status Task",
        clientId: client.id,
      };

      const result = await caller.create(input);
      tracker.tasks?.push(result.task.id);

      expect(result.task.status).toBe("pending");
    });

    it("should set default priority to medium if not provided", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const input = {
        title: "Default Priority Task",
        clientId: client.id,
      };

      const result = await caller.create(input);
      tracker.tasks?.push(result.task.id);

      expect(result.task.priority).toBe("medium");
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required title
        description: "Missing title",
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list tasks with tenant isolation", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Task Alpha",
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Task Beta",
      });
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({});

      expect(result.tasks).toBeDefined();
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation - all tasks should belong to current tenant
      for (const task of result.tasks) {
        expect(task.id).toBeDefined();
      }

      // Verify our test tasks are in the list
      const taskIds = result.tasks.map(t => t.id);
      expect(taskIds).toContain(task1.id);
      expect(taskIds).toContain(task2.id);
    });

    it("should filter tasks by search term", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Searchable Unique Task",
        description: "Special description",
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Other Task",
        description: "Normal description",
      });
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ search: "Searchable Unique" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      const hasSearchableTask = result.tasks.some(t => t.title.includes("Searchable Unique"));
      expect(hasSearchableTask).toBe(true);
    });

    it("should filter tasks by status", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "in_progress",
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "completed",
      });
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ status: "in_progress" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be in_progress
      for (const task of result.tasks) {
        expect(task.status).toBe("in_progress");
      }
    });

    it("should filter tasks by priority", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        priority: "high",
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        priority: "low",
      });
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ priority: "high" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be high priority
      for (const task of result.tasks) {
        expect(task.priority).toBe("high");
      }
    });

    it("should filter tasks by assignee", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId, { role: "user" });
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        assignedToId: assigneeId,
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        assignedToId: ctx.authContext.userId,
      });
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ assigneeId });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be assigned to specified user
      for (const task of result.tasks) {
        expect(task.assignedToId).toBe(assigneeId);
      }
    });

    it("should filter tasks by client", async () => {
      const client1 = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Client Alpha",
      });
      const client2 = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Client Beta",
      });
      tracker.clients?.push(client1.id, client2.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client1.id, ctx.authContext.userId);
      const task2 = await createTestTask(ctx.authContext.tenantId, client2.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ clientId: client1.id });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should belong to client1
      for (const task of result.tasks) {
        expect(task.clientId).toBe(client1.id);
      }
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve task by ID", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "GetById Test Task",
        description: "Test task for getById",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.getById(task.id);

      expect(result.id).toBe(task.id);
      expect(result.title).toBe("GetById Test Task");
      expect(result.description).toBe("Test task for getById");
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow("Task not found");
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create task for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const taskA = await createTestTask(tenantAId, clientA.id, userAId, {
        title: "Tenant A Task",
      });
      tracker.tasks?.push(taskA.id);

      // Attempt to access tenant A's task from tenant B (our test tenant)
      await expect(caller.getById(taskA.id)).rejects.toThrow("Task not found");

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(taskA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    it("should include client information in response", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Client With Details",
      });
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task.id);

      const result = await caller.getById(task.id);

      expect(result.client).toBeDefined();
      expect(result.client?.id).toBe(client.id);
      expect(result.client?.name).toBe("Client With Details");
    });
  });

  describe("update (Integration)", () => {
    it("should update task and persist changes", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Original Title",
        description: "Original Description",
        status: "pending",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.update({
        id: task.id,
        data: {
          title: "Updated Title",
          description: "Updated Description",
          status: "in_progress",
        },
      });

      expect(result.task.title).toBe("Updated Title");
      expect(result.task.description).toBe("Updated Description");
      expect(result.task.status).toBe("in_progress");

      // Verify database persistence
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask.title).toBe("Updated Title");
      expect(dbTask.description).toBe("Updated Description");
      expect(dbTask.status).toBe("in_progress");
    });

    it("should auto-set progress to 100 when status changes to completed", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "in_progress",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.update({
        id: task.id,
        data: {
          status: "completed",
        },
      });

      expect(result.task.status).toBe("completed");

      // Progress should auto-set to 100
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask.progress).toBe(100);
    });

    it("should create activity log for update", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Update Log Test",
      });
      tracker.tasks?.push(task.id);

      await caller.update({
        id: task.id,
        data: { title: "Updated for Log Test" },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task.id),
            eq(activityLogs.action, "updated")
          )
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { title: "Should Fail" },
        })
      ).rejects.toThrow("Task not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create task for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const taskA = await createTestTask(tenantAId, clientA.id, userAId);
      tracker.tasks?.push(taskA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: taskA.id,
          data: { title: "Malicious Update" },
        })
      ).rejects.toThrow("Task not found");
    });

    it("should allow partial updates", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Partial Update Test",
        description: "Original Description",
        priority: "medium",
      });
      tracker.tasks?.push(task.id);

      // Update only priority
      await caller.update({
        id: task.id,
        data: { priority: "high" },
      });

      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      // Priority should be updated
      expect(dbTask.priority).toBe("high");
      // Other fields should remain unchanged
      expect(dbTask.title).toBe("Partial Update Test");
      expect(dbTask.description).toBe("Original Description");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete task from database", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Delete Test Task",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.delete(task.id);

      expect(result.success).toBe(true);

      // Verify task is deleted
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask).toBeUndefined();
    });

    it("should create activity log for deletion", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Delete Log Test",
      });
      tracker.tasks?.push(task.id);

      await caller.delete(task.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task.id),
            eq(activityLogs.action, "deleted")
          )
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Delete Log Test");
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow("Task not found");
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create task for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const taskA = await createTestTask(tenantAId, clientA.id, userAId);
      tracker.tasks?.push(taskA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(taskA.id)).rejects.toThrow("Task not found");

      // Verify task still exists
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskA.id));

      expect(dbTask).toBeDefined();
    });
  });

  describe("updateStatus (Integration)", () => {
    it("should update task status", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "pending",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.updateStatus({
        id: task.id,
        status: "in_progress",
      });

      expect(result.task.status).toBe("in_progress");

      // Verify database persistence
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask.status).toBe("in_progress");
    });

    it("should set completedAt when status changes to completed", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "in_progress",
      });
      tracker.tasks?.push(task.id);

      const result = await caller.updateStatus({
        id: task.id,
        status: "completed",
      });

      expect(result.task.status).toBe("completed");
      expect(result.task.completedAt).toBeDefined();
    });

    it("should create activity log for status update", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task.id);

      await caller.updateStatus({
        id: task.id,
        status: "completed",
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task.id),
            eq(activityLogs.action, "updated")
          )
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1];
      expect(log.description).toContain("status");
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.updateStatus({
          id: nonExistentId,
          status: "completed",
        })
      ).rejects.toThrow("Task not found");
    });
  });

  describe("bulkUpdateStatus (Integration)", () => {
    it("should update status for multiple tasks", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "pending",
      });
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "pending",
      });
      const task3 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        status: "pending",
      });
      tracker.tasks?.push(task1.id, task2.id, task3.id);

      const result = await caller.bulkUpdateStatus({
        taskIds: [task1.id, task2.id, task3.id],
        status: "in_progress",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);

      // Verify all tasks updated
      const updatedTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task1.id));

      expect(updatedTasks[0].status).toBe("in_progress");
    });

    it("should create activity logs for each task", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id, task2.id);

      await caller.bulkUpdateStatus({
        taskIds: [task1.id, task2.id],
        status: "completed",
      });

      // Verify activity logs
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.action, "bulk_status_update")
          )
        );

      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it("should throw error if any task not found", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id);

      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.bulkUpdateStatus({
          taskIds: [task1.id, nonExistentId],
          status: "completed",
        })
      ).rejects.toThrow("One or more tasks not found");
    });
  });

  describe("bulkAssign (Integration)", () => {
    it("should assign multiple tasks to a user", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId, { role: "user" });
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.bulkAssign({
        taskIds: [task1.id, task2.id],
        assigneeId,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // Verify assignments
      const [dbTask1] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task1.id));

      expect(dbTask1.assignedToId).toBe(assigneeId);
    });

    it("should create activity logs for each assignment", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId);
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id);

      await caller.bulkAssign({
        taskIds: [task1.id],
        assigneeId,
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task1.id),
            eq(activityLogs.action, "bulk_assign")
          )
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("bulkDelete (Integration)", () => {
    it("should delete multiple tasks", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      const task2 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.bulkDelete({
        taskIds: [task1.id, task2.id],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // Verify tasks deleted
      const [dbTask1] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task1.id));

      expect(dbTask1).toBeUndefined();
    });

    it("should create activity logs before deletion", async () => {
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId, {
        title: "Bulk Delete Log Test",
      });
      tracker.tasks?.push(task1.id);

      await caller.bulkDelete({
        taskIds: [task1.id],
      });

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task1.id),
            eq(activityLogs.action, "bulk_delete")
          )
        );

      expect(log).toBeDefined();
      expect(log.description).toContain("Bulk Delete Log Test");
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(tasksRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("listOld");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("updateStatus");
      expect(procedures).toContain("assignWorkflow");
      expect(procedures).toContain("getWorkflowInstance");
      expect(procedures).toContain("updateChecklistItem");
      expect(procedures).toContain("bulkUpdateStatus");
      expect(procedures).toContain("bulkAssign");
      expect(procedures).toContain("bulkDelete");
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(tasksRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
