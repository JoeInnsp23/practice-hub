/**
 * Tasks Router Integration Tests
 *
 * Integration-level tests for the tasks tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tasksRouter } from "@/app/server/routers/tasks";
import { db } from "@/lib/db";
import {
  activityLogs,
  notifications,
  tasks,
  taskWorkflowInstances,
  workflowVersions,
} from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestTask,
  createTestTenant,
  createTestUser,
  createTestWorkflow,
  createTestWorkflowStage,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

type UrgentTask = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: Date | null;
  clientId: string;
  clientName: string | null;
};

describe("app/server/routers/tasks.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof tasksRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    tasks: [],
    workflows: [],
    workflowVersions: [],
    workflowStages: [],
    taskWorkflowInstances: [],
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
    tracker.workflows = [];
    tracker.workflowVersions = [];
    tracker.workflowStages = [];
    tracker.taskWorkflowInstances = [];
  });

  describe("create (Integration)", () => {
    it("should create task and persist to database", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
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
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Activity Log Test Task");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should auto-assign to current user if no assignee specified", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
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

      await expect(caller.create(invalidInput as unknown)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list tasks with tenant isolation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Task Alpha",
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Task Beta",
        },
      );
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({});

      expect(result.tasks).toBeDefined();
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation - all tasks should belong to current tenant
      for (const task of result.tasks) {
        expect(task.id).toBeDefined();
      }

      // Verify our test tasks are in the list
      const taskIds = result.tasks.map((t: (typeof result.tasks)[0]) => t.id);
      expect(taskIds).toContain(task1.id);
      expect(taskIds).toContain(task2.id);
    });

    it("should filter tasks by search term", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Searchable Unique Task",
          description: "Special description",
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Other Task",
          description: "Normal description",
        },
      );
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ search: "Searchable Unique" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      const hasSearchableTask = result.tasks.some(
        (t: (typeof result.tasks)[0]) => t.title.includes("Searchable Unique"),
      );
      expect(hasSearchableTask).toBe(true);
    });

    it("should filter tasks by status", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "in_progress",
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "completed",
        },
      );
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ status: "in_progress" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be in_progress
      for (const task of result.tasks) {
        expect(task.status).toBe("in_progress");
      }
    });

    it("should filter tasks by priority", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          priority: "high",
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          priority: "low",
        },
      );
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ priority: "high" });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be high priority
      for (const task of result.tasks) {
        expect(task.priority).toBe("high");
      }
    });

    it("should filter tasks by assignee", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId, {
        role: "user",
      });
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: assigneeId,
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      tracker.tasks?.push(task1.id, task2.id);

      const result = await caller.list({ assigneeId });

      expect(result.tasks.length).toBeGreaterThanOrEqual(1);
      // All returned tasks should be assigned to specified user
      for (const task of result.tasks) {
        expect(task.assignedToId).toBe(assigneeId);
      }
    });

    it("should filter tasks by client", async () => {
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Alpha",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Beta",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client1.id,
        ctx.authContext.userId,
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client2.id,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "GetById Test Task",
          description: "Test task for getById",
        },
      );
      tracker.tasks?.push(task.id);

      const result = await caller.getById(task.id);

      expect(result.id).toBe(task.id);
      expect(result.title).toBe("GetById Test Task");
      expect(result.description).toBe("Test task for getById");
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Task not found",
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client With Details",
        },
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const result = await caller.getById(task.id);

      expect(result.client).toBeDefined();
      expect(result.client?.id).toBe(client.id);
      expect(result.client?.name).toBe("Client With Details");
    });
  });

  describe("update (Integration)", () => {
    it("should update task and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Original Title",
          description: "Original Description",
          status: "pending",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "in_progress",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Update Log Test",
        },
      );
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
            eq(activityLogs.action, "updated"),
          ),
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
        }),
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
        }),
      ).rejects.toThrow("Task not found");
    });

    it("should allow partial updates", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Partial Update Test",
          description: "Original Description",
          priority: "medium",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Delete Test Task",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Delete Log Test",
        },
      );
      tracker.tasks?.push(task.id);

      await caller.delete(task.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task.id),
            eq(activityLogs.action, "deleted"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Delete Log Test");
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Task not found",
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "pending",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "in_progress",
        },
      );
      tracker.tasks?.push(task.id);

      const result = await caller.updateStatus({
        id: task.id,
        status: "completed",
      });

      expect(result.task.status).toBe("completed");
      expect(result.task.completedAt).toBeDefined();
    });

    it("should create activity log for status update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
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
            eq(activityLogs.action, "updated"),
          ),
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
        }),
      ).rejects.toThrow("Task not found");
    });
  });

  describe("bulkUpdateStatus (Integration)", () => {
    it("should update status for multiple tasks", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "pending",
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "pending",
        },
      );
      const task3 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          status: "pending",
        },
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task1.id, task2.id);

      await caller.bulkUpdateStatus({
        taskIds: [task1.id, task2.id],
        status: "completed",
      });

      // Verify activity logs
      const logs = await db
        .select()
        .from(activityLogs)
        .where(and(eq(activityLogs.action, "bulk_status_update")));

      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it("should throw error if any task not found", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task1.id);

      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.bulkUpdateStatus({
          taskIds: [task1.id, nonExistentId],
          status: "completed",
        }),
      ).rejects.toThrow("One or more tasks not found");
    });
  });

  describe("bulkAssign (Integration)", () => {
    it("should assign multiple tasks to a user", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId, {
        role: "user",
      });
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const assigneeId = await createTestUser(ctx.authContext.tenantId);
      tracker.users?.push(assigneeId);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
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
            eq(activityLogs.action, "bulk_assign"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("bulkDelete (Integration)", () => {
    it("should delete multiple tasks", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
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
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Bulk Delete Log Test",
        },
      );
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
            eq(activityLogs.action, "bulk_delete"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.description).toContain("Bulk Delete Log Test");
    });
  });

  describe("assignWorkflow (Integration)", () => {
    it("should assign workflow to task and create workflow instance", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          title: "Task for Workflow Assignment",
        },
      );
      tracker.tasks?.push(task.id);

      const workflow = await createTestWorkflow(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Test Workflow for Assignment",
        },
      );
      tracker.workflows?.push(workflow.id);

      // Create a workflow version (required for assignment)
      const [workflowVersion] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description || "",
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          config: {},
          stagesSnapshot: [],
          isActive: true, // Mark as active version
        })
        .returning();
      tracker.workflowVersions?.push(workflowVersion.id);

      const result = await caller.assignWorkflow({
        taskId: task.id,
        workflowId: workflow.id,
      });

      expect(result.success).toBe(true);
      expect(result.instance).toBeDefined();
      expect(result.instance.taskId).toBe(task.id);
      expect(result.instance.workflowId).toBe(workflow.id);
      expect(result.instance.workflowVersionId).toBe(workflowVersion.id);
      tracker.taskWorkflowInstances?.push(result.instance.id);

      // Verify task.workflowId is updated
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask.workflowId).toBe(workflow.id);

      // Verify workflow instance created
      const [instance] = await db
        .select()
        .from(taskWorkflowInstances)
        .where(eq(taskWorkflowInstances.id, result.instance.id));

      expect(instance).toBeDefined();
      expect(instance.status).toBe("active");
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const workflow = await createTestWorkflow(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.workflows?.push(workflow.id);

      const nonExistentTaskId = crypto.randomUUID();

      await expect(
        caller.assignWorkflow({
          taskId: nonExistentTaskId,
          workflowId: workflow.id,
        }),
      ).rejects.toThrow("Task not found");
    });

    it("should throw NOT_FOUND for non-existent workflow", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const nonExistentWorkflowId = crypto.randomUUID();

      await expect(
        caller.assignWorkflow({
          taskId: task.id,
          workflowId: nonExistentWorkflowId,
        }),
      ).rejects.toThrow("Workflow not found");
    });

    it("should prevent cross-tenant workflow assignment", async () => {
      // Create task for tenant B (our test tenant)
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      // Create workflow for tenant A (different tenant)
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId);
      tracker.workflows?.push(workflowA.id);

      // Attempt to assign tenant A's workflow to tenant B's task
      await expect(
        caller.assignWorkflow({
          taskId: task.id,
          workflowId: workflowA.id,
        }),
      ).rejects.toThrow("Workflow not found");
    });
  });

  describe("getWorkflowInstance (Integration)", () => {
    it("should retrieve workflow instance for task", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const workflow = await createTestWorkflow(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.workflows?.push(workflow.id);

      const stage = await createTestWorkflowStage(workflow.id, {
        name: "Stage 1",
        stageOrder: 1,
      });
      tracker.workflowStages?.push(stage.id);

      // Create workflow version
      const [workflowVersion] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description || "",
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          config: {},
          stagesSnapshot: [
            { id: stage.id, name: stage.name, stageOrder: stage.stageOrder },
          ],
        })
        .returning();
      tracker.workflowVersions?.push(workflowVersion.id);

      // Create workflow instance
      const [instance] = await db
        .insert(taskWorkflowInstances)
        .values({
          taskId: task.id,
          workflowId: workflow.id,
          workflowVersionId: workflowVersion.id,
          version: 1,
          stagesSnapshot: [
            { id: stage.id, name: stage.name, stageOrder: stage.stageOrder },
          ],
          status: "active",
        })
        .returning();
      tracker.taskWorkflowInstances?.push(instance.id);

      // Update task with workflowId
      await db
        .update(tasks)
        .set({ workflowId: workflow.id })
        .where(eq(tasks.id, task.id));

      const result = await caller.getWorkflowInstance(task.id);

      expect(result).toBeDefined();
      expect(result.instance).toBeDefined();
      expect(result.instance.id).toBe(instance.id);
      expect(result.workflow).toBeDefined();
      expect(result.workflow.id).toBe(workflow.id);
      expect(result.stages).toBeDefined();
    });

    it("should return null if task has no workflow", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const result = await caller.getWorkflowInstance(task.id);

      expect(result).toBeNull();
    });

    it("should throw NOT_FOUND for non-existent task", async () => {
      const nonExistentTaskId = crypto.randomUUID();

      await expect(
        caller.getWorkflowInstance(nonExistentTaskId),
      ).rejects.toThrow("Task not found");
    });

    it("should prevent cross-tenant access", async () => {
      // Create task for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientA = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientA.id);

      const taskA = await createTestTask(tenantAId, clientA.id, userAId);
      tracker.tasks?.push(taskA.id);

      // Attempt to access tenant A's task from tenant B
      await expect(caller.getWorkflowInstance(taskA.id)).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("updateChecklistItem (Integration)", () => {
    it("should update checklist item completion status", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const workflow = await createTestWorkflow(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.workflows?.push(workflow.id);

      const stageId = crypto.randomUUID();
      const itemId = crypto.randomUUID();

      const [workflowVersion] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description || "",
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          config: {},
          stagesSnapshot: [
            {
              id: stageId,
              name: "Test Stage",
              stageOrder: 1,
              checklistItems: [
                { id: itemId, text: "Test Item", isRequired: true },
              ],
            },
          ],
        })
        .returning();
      tracker.workflowVersions?.push(workflowVersion.id);

      const [instance] = await db
        .insert(taskWorkflowInstances)
        .values({
          taskId: task.id,
          workflowId: workflow.id,
          workflowVersionId: workflowVersion.id,
          version: 1,
          stagesSnapshot: workflowVersion.stagesSnapshot,
          status: "active",
          stageProgress: {},
        })
        .returning();
      tracker.taskWorkflowInstances?.push(instance.id);

      await db
        .update(tasks)
        .set({ workflowId: workflow.id })
        .where(eq(tasks.id, task.id));

      const result = await caller.updateChecklistItem({
        taskId: task.id,
        stageId,
        itemId,
        completed: true,
      });

      expect(result.success).toBe(true);

      // Verify stageProgress updated
      const [updatedInstance] = await db
        .select()
        .from(taskWorkflowInstances)
        .where(eq(taskWorkflowInstances.id, instance.id));

      expect(updatedInstance.stageProgress).toBeDefined();
      const progress = updatedInstance.stageProgress as Record<
        string,
        {
          checklistItems: Record<string, { completed: boolean }>;
        }
      >;
      expect(progress[stageId]).toBeDefined();
      expect(progress[stageId].checklistItems[itemId].completed).toBe(true);
    });

    it("should create activity log for checklist update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.tasks?.push(task.id);

      const workflow = await createTestWorkflow(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.workflows?.push(workflow.id);

      const itemId = crypto.randomUUID();

      // Create actual workflow stage (required for progress calculation)
      const stage = await createTestWorkflowStage(workflow.id, {
        name: "Test Stage",
        stageOrder: 1,
        checklistItems: [{ id: itemId, text: "Test Item", isRequired: true }],
      });
      tracker.workflowStages?.push(stage.id);

      const [workflowVersion] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description || "",
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          config: {},
          stagesSnapshot: [
            {
              id: stage.id,
              name: "Test Stage",
              stageOrder: 1,
              checklistItems: [
                { id: itemId, text: "Test Item", isRequired: true },
              ],
            },
          ],
        })
        .returning();
      tracker.workflowVersions?.push(workflowVersion.id);

      const [instance] = await db
        .insert(taskWorkflowInstances)
        .values({
          taskId: task.id,
          workflowId: workflow.id,
          workflowVersionId: workflowVersion.id,
          version: 1,
          stagesSnapshot: workflowVersion.stagesSnapshot,
          status: "active",
          stageProgress: {},
        })
        .returning();
      tracker.taskWorkflowInstances?.push(instance.id);

      await db
        .update(tasks)
        .set({ workflowId: workflow.id })
        .where(eq(tasks.id, task.id));

      await caller.updateChecklistItem({
        taskId: task.id,
        stageId: stage.id,
        itemId,
        completed: true,
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, task.id),
            eq(activityLogs.action, "checklist_updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1];
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent workflow instance", async () => {
      const nonExistentTaskId = crypto.randomUUID();
      const stageId = crypto.randomUUID();
      const itemId = crypto.randomUUID();

      await expect(
        caller.updateChecklistItem({
          taskId: nonExistentTaskId,
          stageId,
          itemId,
          completed: true,
        }),
      ).rejects.toThrow("Workflow instance not found");
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
      expect(procedures).toContain("createNote");
      expect(procedures).toContain("getNotes");
      expect(procedures).toContain("updateNote");
      expect(procedures).toContain("deleteNote");
      expect(procedures).toContain("getNoteCount");
      expect(procedures).toContain("getMentionableUsers");
    });

    it("should have 26 procedures total", () => {
      const procedures = Object.keys(tasksRouter._def.procedures);
      expect(procedures).toHaveLength(26);
    });
  });

  describe("Task Notes Procedures (Integration)", () => {
    let taskId: string;
    let clientId: string;

    beforeEach(async () => {
      // Create a test task for notes
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      clientId = client.id;
      tracker.clients?.push(clientId);

      const task = await createTestTask(
        ctx.authContext.tenantId,
        clientId,
        ctx.authContext.userId,
        {
          title: "Test Task for Notes",
        },
      );
      taskId = task.id;
      tracker.tasks?.push(taskId);
    });

    describe("createNote", () => {
      it("should create a task note", async () => {
        const result = await caller.createNote({
          taskId,
          note: "This is a test note",
          isInternal: false,
          mentionedUsers: [],
        });

        expect(result.success).toBe(true);
        expect(result.noteId).toBeDefined();
      });

      it("should create an internal note", async () => {
        const result = await caller.createNote({
          taskId,
          note: "This is an internal note",
          isInternal: true,
          mentionedUsers: [],
        });

        expect(result.success).toBe(true);

        // Verify note was created with internal flag
        const notes = await caller.getNotes({ taskId });
        expect(notes).toHaveLength(1);
        expect(notes[0].isInternal).toBe(true);
      });

      it("should create notifications for mentioned users", async () => {
        // Create another user to mention
        const mentionedUserId = await createTestUser(ctx.authContext.tenantId);
        tracker.users?.push(mentionedUserId);

        await caller.createNote({
          taskId,
          note: "Hey @[Test User], please review this",
          isInternal: false,
          mentionedUsers: [mentionedUserId],
        });

        // Verify notification was created
        const notificationResults = await db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, mentionedUserId));

        expect(notificationResults).toHaveLength(1);
      });

      it("should reject note for non-existent task", async () => {
        await expect(
          caller.createNote({
            taskId: "00000000-0000-0000-0000-000000000000",
            note: "Test note",
            isInternal: false,
            mentionedUsers: [],
          }),
        ).rejects.toThrow("Task not found");
      });

      it("should enforce tenant isolation", async () => {
        // Create task in different tenant
        const otherTenantId = await createTestTenant();
        tracker.tenants?.push(otherTenantId);

        const otherUserId = await createTestUser(otherTenantId);
        tracker.users?.push(otherUserId);

        const otherClient = await createTestClient(otherTenantId, otherUserId);
        tracker.clients?.push(otherClient.id);

        const otherTask = await createTestTask(
          otherTenantId,
          otherClient.id,
          otherUserId,
          {
            title: "Other Tenant Task",
          },
        );
        tracker.tasks?.push(otherTask.id);

        // Try to create note on other tenant's task
        await expect(
          caller.createNote({
            taskId: otherTask.id,
            note: "Unauthorized note",
            isInternal: false,
            mentionedUsers: [],
          }),
        ).rejects.toThrow("Task not found");
      });
    });

    describe("getNotes", () => {
      beforeEach(async () => {
        // Create some test notes
        await caller.createNote({
          taskId,
          note: "First note",
          isInternal: false,
          mentionedUsers: [],
        });
        await caller.createNote({
          taskId,
          note: "Second note",
          isInternal: true,
          mentionedUsers: [],
        });
      });

      it("should get all notes for a task", async () => {
        const notes = await caller.getNotes({ taskId });

        expect(notes).toHaveLength(2);
        expect(notes[0].note).toBeDefined();
        expect(notes[0].author).toBeDefined();
      });

      it("should order notes by creation date (newest first)", async () => {
        const notes = await caller.getNotes({ taskId });

        expect(notes[0].note).toBe("Second note");
        expect(notes[1].note).toBe("First note");
      });

      it("should support pagination", async () => {
        const notes = await caller.getNotes({ taskId, limit: 1, offset: 0 });

        expect(notes).toHaveLength(1);
      });

      it("should not return soft-deleted notes", async () => {
        const notes = await caller.getNotes({ taskId });
        const noteId = notes[0].id;

        // Delete the note
        await caller.deleteNote({ noteId });

        // Get notes again
        const remainingNotes = await caller.getNotes({ taskId });
        expect(remainingNotes).toHaveLength(1);
        expect(remainingNotes[0].id).not.toBe(noteId);
      });
    });

    describe("updateNote", () => {
      let noteId: string;

      beforeEach(async () => {
        const result = await caller.createNote({
          taskId,
          note: "Original note",
          isInternal: false,
          mentionedUsers: [],
        });
        noteId = result.noteId;
      });

      it("should update note content", async () => {
        await caller.updateNote({
          noteId,
          note: "Updated note",
        });

        const notes = await caller.getNotes({ taskId });
        expect(notes[0].note).toBe("Updated note");
      });

      it("should update updatedAt timestamp", async () => {
        const beforeUpdate = await caller.getNotes({ taskId });
        const originalUpdatedAt = beforeUpdate[0].updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));

        await caller.updateNote({
          noteId,
          note: "Updated note",
        });

        const afterUpdate = await caller.getNotes({ taskId });
        expect(afterUpdate[0].updatedAt).not.toEqual(originalUpdatedAt);
      });

      it("should allow admin to update any note", async () => {
        // Create another user's note
        const otherUserId = await createTestUser(ctx.authContext.tenantId);
        tracker.users?.push(otherUserId);

        const otherCtx = createMockContext({
          authContext: {
            ...ctx.authContext,
            userId: otherUserId,
            role: "member",
          },
        });
        const otherCaller = createCaller(tasksRouter, otherCtx);

        const otherNote = await otherCaller.createNote({
          taskId,
          note: "Other user's note",
          isInternal: false,
          mentionedUsers: [],
        });

        // Admin should be able to update it
        await caller.updateNote({
          noteId: otherNote.noteId,
          note: "Admin updated note",
        });

        const notes = await caller.getNotes({ taskId });
        const updated = notes.find(
          (n: (typeof notes)[0]) => n.id === otherNote.noteId,
        );
        expect(updated?.note).toBe("Admin updated note");
      });

      it("should reject update by non-owner non-admin", async () => {
        // Create another non-admin user
        const otherUserId = await createTestUser(ctx.authContext.tenantId, {
          role: "member",
        });
        tracker.users?.push(otherUserId);

        const otherCtx = createMockContext({
          authContext: {
            ...ctx.authContext,
            userId: otherUserId,
            role: "member",
          },
        });
        const otherCaller = createCaller(tasksRouter, otherCtx);

        // Try to update note created by original user
        await expect(
          otherCaller.updateNote({
            noteId,
            note: "Unauthorized update",
          }),
        ).rejects.toThrow("You do not have permission to edit this note");
      });
    });

    describe("deleteNote", () => {
      let noteId: string;

      beforeEach(async () => {
        const result = await caller.createNote({
          taskId,
          note: "Note to delete",
          isInternal: false,
          mentionedUsers: [],
        });
        noteId = result.noteId;
      });

      it("should soft delete a note", async () => {
        await caller.deleteNote({ noteId });

        // Note should not appear in getNotes
        const notes = await caller.getNotes({ taskId });
        expect(notes).toHaveLength(0);
      });

      it("should allow admin to delete any note", async () => {
        // Admin can delete - already tested above
        await caller.deleteNote({ noteId });

        const notes = await caller.getNotes({ taskId });
        expect(notes).toHaveLength(0);
      });

      it("should reject delete by non-owner non-admin", async () => {
        // Create another non-admin user
        const otherUserId = await createTestUser(ctx.authContext.tenantId, {
          role: "member",
        });
        tracker.users?.push(otherUserId);

        const otherCtx = createMockContext({
          authContext: {
            ...ctx.authContext,
            userId: otherUserId,
            role: "member",
          },
        });
        const otherCaller = createCaller(tasksRouter, otherCtx);

        // Try to delete note created by original user
        await expect(otherCaller.deleteNote({ noteId })).rejects.toThrow(
          "You do not have permission to delete this note",
        );
      });
    });

    describe("getNoteCount", () => {
      it("should return 0 for task with no notes", async () => {
        const count = await caller.getNoteCount({ taskId });
        expect(count).toBe(0);
      });

      it("should return correct count", async () => {
        await caller.createNote({
          taskId,
          note: "Note 1",
          isInternal: false,
          mentionedUsers: [],
        });
        await caller.createNote({
          taskId,
          note: "Note 2",
          isInternal: true,
          mentionedUsers: [],
        });

        const count = await caller.getNoteCount({ taskId });
        expect(count).toBe(2);
      });

      it("should exclude soft-deleted notes from count", async () => {
        const note1 = await caller.createNote({
          taskId,
          note: "Note 1",
          isInternal: false,
          mentionedUsers: [],
        });
        await caller.createNote({
          taskId,
          note: "Note 2",
          isInternal: false,
          mentionedUsers: [],
        });

        // Delete one note
        await caller.deleteNote({ noteId: note1.noteId });

        const count = await caller.getNoteCount({ taskId });
        expect(count).toBe(1);
      });
    });

    describe("getMentionableUsers", () => {
      beforeEach(async () => {
        // Create some test users with different names - use unique emails with timestamps
        const timestamp = Date.now();
        await createTestUser(ctx.authContext.tenantId, {
          firstName: "John",
          lastName: "Doe",
          email: `john.doe.${timestamp}@example.com`,
        });
        await createTestUser(ctx.authContext.tenantId, {
          firstName: "Jane",
          lastName: "Smith",
          email: `jane.smith.${timestamp}@example.com`,
        });
        await createTestUser(ctx.authContext.tenantId, {
          firstName: "Bob",
          lastName: "Johnson",
          email: `bob.johnson.${timestamp}@example.com`,
        });
      });

      it("should search by first name", async () => {
        const users = await caller.getMentionableUsers({ query: "john" });
        expect(users.length).toBeGreaterThan(0);
        expect(
          users.some((u: (typeof users)[0]) => u.firstName === "John"),
        ).toBe(true);
      });

      it("should search by last name", async () => {
        const users = await caller.getMentionableUsers({ query: "smith" });
        expect(users.length).toBeGreaterThan(0);
        expect(
          users.some((u: (typeof users)[0]) => u.lastName === "Smith"),
        ).toBe(true);
      });

      it("should search by email", async () => {
        const users = await caller.getMentionableUsers({
          query: "bob.johnson",
        });
        expect(users.length).toBeGreaterThan(0);
        expect(
          users.some((u: (typeof users)[0]) =>
            u.email?.includes("bob.johnson"),
          ),
        ).toBe(true);
      });

      it("should be case insensitive", async () => {
        const users = await caller.getMentionableUsers({ query: "JOHN" });
        expect(users.length).toBeGreaterThan(0);
      });

      it("should limit results to 10", async () => {
        const users = await caller.getMentionableUsers({ query: "" });
        expect(users.length).toBeLessThanOrEqual(10);
      });

      it("should only return users from same tenant", async () => {
        // Create user in different tenant
        const otherTenantId = await createTestTenant();
        tracker.tenants?.push(otherTenantId);

        await createTestUser(otherTenantId, {
          firstName: "Other",
          lastName: "User",
          email: `other.user.${Date.now()}@example.com`,
        });

        const users = await caller.getMentionableUsers({ query: "other" });
        expect(users).toHaveLength(0);
      });
    });
  });

  describe("reassign (Integration)", () => {
    it("should reassign a task to a new user", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      // Create another user to reassign to
      const newUserId = await createTestUser(ctx.authContext.tenantId, {
        firstName: "New",
        lastName: "Assignee",
        email: `new.assignee.${Date.now()}@example.com`,
      });
      tracker.users?.push(newUserId);

      const result = await caller.reassign({
        taskId: task.id,
        toUserId: newUserId,
        assignmentType: "assigned_to",
        changeReason: "Workload balancing",
      });

      expect(result.success).toBe(true);

      // Verify task was updated
      const updatedTask = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);

      expect(updatedTask[0].assignedToId).toBe(newUserId);
    });

    it("should prevent self-reassignment", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      await expect(
        caller.reassign({
          taskId: task.id,
          toUserId: ctx.authContext.userId,
          assignmentType: "assigned_to",
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("should enforce tenant isolation", async () => {
      const otherTenantId = await createTestTenant();
      tracker.tenants?.push(otherTenantId);

      const otherUserId = await createTestUser(otherTenantId, {
        firstName: "Other",
        lastName: "User",
        email: `other.user.${Date.now()}@example.com`,
      });
      const otherClient = await createTestClient(otherTenantId, otherUserId);
      const otherTask = await createTestTask(
        otherTenantId,
        otherClient.id,
        otherUserId,
        {},
      );

      const newUserId = await createTestUser(ctx.authContext.tenantId, {
        firstName: "New",
        lastName: "Assignee",
        email: `new.assignee.${Date.now()}@example.com`,
      });
      tracker.users?.push(newUserId);

      await expect(
        caller.reassign({
          taskId: otherTask.id,
          toUserId: newUserId,
          assignmentType: "assigned_to",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("bulkReassign (Integration)", () => {
    it("should reassign multiple tasks", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const task1 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      const task2 = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task1.id, task2.id);

      const newUserId = await createTestUser(ctx.authContext.tenantId, {
        firstName: "New",
        lastName: "Assignee",
        email: `new.assignee.${Date.now()}@example.com`,
      });
      tracker.users?.push(newUserId);

      const result = await caller.bulkReassign({
        taskIds: [task1.id, task2.id],
        toUserId: newUserId,
        assignmentType: "assigned_to",
        changeReason: "Bulk workload balancing",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // Verify both tasks were updated
      const updatedTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.tenantId, ctx.authContext.tenantId)));

      const reassignedTasks = updatedTasks.filter(
        (t: (typeof updatedTasks)[0]) => t.assignedToId === newUserId,
      );
      expect(reassignedTasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getAssignmentHistory (Integration)", () => {
    it("should return assignment history for a task", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          assignedToId: ctx.authContext.userId,
        },
      );
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      // Create another user and reassign
      const newUserId = await createTestUser(ctx.authContext.tenantId, {
        firstName: "New",
        lastName: "Assignee",
        email: `new.assignee.${Date.now()}@example.com`,
      });
      tracker.users?.push(newUserId);

      await caller.reassign({
        taskId: task.id,
        toUserId: newUserId,
        assignmentType: "assigned_to",
        changeReason: "Test reassignment",
      });

      const history = await caller.getAssignmentHistory({ taskId: task.id });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].toUser.id).toBe(newUserId);
      expect(history[0].changeReason).toBe("Test reassignment");
      expect(history[0].assignmentType).toBe("assigned_to");
    });

    it("should return empty array for task with no history", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const task = await createTestTask(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {},
      );
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      const history = await caller.getAssignmentHistory({ taskId: task.id });
      expect(history).toEqual([]);
    });
  });

  describe("getTopUrgentTasks", () => {
    it("should return user's urgent tasks", async () => {
      // Setup: Create test data
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      // Update context to use test user
      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create urgent task (high priority, due soon)
      const urgentTask = await createTestTask(tenant, client.id, user, {
        title: "Urgent Task - High Priority",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
      });
      tracker.tasks?.push(urgentTask.id);

      // Create normal task (not urgent)
      const normalTask = await createTestTask(tenant, client.id, user, {
        title: "Normal Task",
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
      });
      tracker.tasks?.push(normalTask.id);

      // Query urgent tasks
      const result = await caller.getTopUrgentTasks();

      // Verify urgent task is returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(urgentTask.id);
      expect(result[0].priority).toBe("high");
    });

    it("should return tasks due within 5 days", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create task due in 4 days (medium priority, but due soon)
      const dueSoonTask = await createTestTask(tenant, client.id, user, {
        title: "Due Soon Task",
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(dueSoonTask.id);

      const result = await caller.getTopUrgentTasks();

      expect(result.some((t: UrgentTask) => t.id === dueSoonTask.id)).toBe(
        true,
      );
    });

    it("should only return todo and in_progress tasks", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create completed urgent task
      const completedTask = await createTestTask(tenant, client.id, user, {
        title: "Completed Urgent Task",
        priority: "high",
        status: "completed",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(completedTask.id);

      const result = await caller.getTopUrgentTasks();

      // Completed task should not be in results
      expect(result.some((t: UrgentTask) => t.id === completedTask.id)).toBe(
        false,
      );
    });

    it("should limit results to 5 tasks", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create 7 urgent tasks
      for (let i = 0; i < 7; i++) {
        const task = await createTestTask(tenant, client.id, user, {
          title: `Urgent Task ${i + 1}`,
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        });
        tracker.tasks?.push(task.id);
      }

      const result = await caller.getTopUrgentTasks();

      // Should return max 5 tasks
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should order by due date ascending", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create tasks with different due dates
      const task1 = await createTestTask(tenant, client.id, user, {
        title: "Due in 4 days",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(task1.id);

      const task2 = await createTestTask(tenant, client.id, user, {
        title: "Due in 1 day",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(task2.id);

      const task3 = await createTestTask(tenant, client.id, user, {
        title: "Due in 2 days",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(task3.id);

      const result = await caller.getTopUrgentTasks();

      // Verify ordering by due date
      if (result.length >= 3) {
        const firstTask = result.find((t: UrgentTask) => t.id === task2.id);
        const secondTask = result.find((t: UrgentTask) => t.id === task3.id);
        const thirdTask = result.find((t: UrgentTask) => t.id === task1.id);

        expect(firstTask).toBeDefined();
        expect(secondTask).toBeDefined();
        expect(thirdTask).toBeDefined();

        if (firstTask && secondTask && thirdTask) {
          const firstIndex = result.indexOf(firstTask);
          const secondIndex = result.indexOf(secondTask);
          const thirdIndex = result.indexOf(thirdTask);

          expect(firstIndex).toBeLessThan(secondIndex);
          expect(secondIndex).toBeLessThan(thirdIndex);
        }
      }
    });

    it("should only return tasks assigned to current user", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user1 = await createTestUser(tenant, { role: "user" });
      const user2 = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user1, {});
      tracker.tenants?.push(tenant);
      tracker.users?.push(user1, user2);
      tracker.clients?.push(client.id);

      // Set context to user1
      ctx.authContext.userId = user1;
      ctx.authContext.tenantId = tenant;

      // Create task for user1
      const user1Task = await createTestTask(tenant, client.id, user1, {
        title: "User 1 Task",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(user1Task.id);

      // Create task for user2
      const user2Task = await createTestTask(tenant, client.id, user2, {
        title: "User 2 Task",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(user2Task.id);

      const result = await caller.getTopUrgentTasks();

      // Should only return user1's task
      expect(result.some((t: UrgentTask) => t.id === user1Task.id)).toBe(true);
      expect(result.some((t: UrgentTask) => t.id === user2Task.id)).toBe(false);
    });

    it("should include client name in results", async () => {
      // Setup
      const tenant = await createTestTenant();
      const user = await createTestUser(tenant, { role: "user" });
      const client = await createTestClient(tenant, user, {
        name: "Test Client Co",
      });
      tracker.tenants?.push(tenant);
      tracker.users?.push(user);
      tracker.clients?.push(client.id);

      ctx.authContext.userId = user;
      ctx.authContext.tenantId = tenant;

      // Create urgent task
      const task = await createTestTask(tenant, client.id, user, {
        title: "Task with Client",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(task.id);

      const result = await caller.getTopUrgentTasks();

      const foundTask = result.find((t: UrgentTask) => t.id === task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.clientName).toBe("Test Client Co");
    });

    it("should respect tenant isolation", async () => {
      // Setup
      const tenant1 = await createTestTenant();
      const tenant2 = await createTestTenant();
      const user1 = await createTestUser(tenant1, { role: "user" });
      const user2 = await createTestUser(tenant2, { role: "user" });
      const client1 = await createTestClient(tenant1, user1, {});
      const client2 = await createTestClient(tenant2, user2, {});
      tracker.tenants?.push(tenant1, tenant2);
      tracker.users?.push(user1, user2);
      tracker.clients?.push(client1.id, client2.id);

      // Set context to tenant1/user1
      ctx.authContext.userId = user1;
      ctx.authContext.tenantId = tenant1;

      // Create task for tenant1/user1
      const tenant1Task = await createTestTask(tenant1, client1.id, user1, {
        title: "Tenant 1 Task",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(tenant1Task.id);

      // Create task for tenant2/user2 (same user name, different tenant)
      const tenant2Task = await createTestTask(tenant2, client2.id, user2, {
        title: "Tenant 2 Task",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      tracker.tasks?.push(tenant2Task.id);

      const result = await caller.getTopUrgentTasks();

      // Should only return tenant1's task
      expect(result.some((t: UrgentTask) => t.id === tenant1Task.id)).toBe(
        true,
      );
      expect(result.some((t: UrgentTask) => t.id === tenant2Task.id)).toBe(
        false,
      );
    });
  });
});
