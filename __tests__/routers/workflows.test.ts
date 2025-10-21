/**
 * Workflows Router Integration Tests
 *
 * Integration-level tests for the workflows tRPC router.
 * Tests verify database operations, tenant isolation, versioning, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { workflowsRouter } from "@/app/server/routers/workflows";
import { createCaller, createMockContext } from "../helpers/trpc";
import {
  createTestTenant,
  createTestUser,
  createTestWorkflow,
  createTestWorkflowStage,
  createTestTask,
  createTestClient,
  cleanupTestData,
  type TestDataTracker,
} from "../helpers/factories";
import { db } from "@/lib/db";
import { workflows, workflowStages, workflowVersions, taskWorkflowInstances } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Context } from "@/app/server/context";

describe("app/server/routers/workflows.ts (Integration)", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof workflowsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    tasks: [],
    workflows: [],
    workflowStages: [],
    workflowVersions: [],
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

    caller = createCaller(workflowsRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.tasks = [];
    tracker.workflows = [];
    tracker.workflowStages = [];
    tracker.workflowVersions = [];
    tracker.taskWorkflowInstances = [];
  });

  describe("create (Integration)", () => {
    it("should create workflow and persist to database", async () => {
      const input = {
        name: `Tax Return Workflow ${Date.now()}`,
        description: "Standard tax return process",
        type: "tax_return",
        trigger: "manual" as const,
        isActive: true,
        estimatedDays: 14,
        config: {},
      };

      const result = await caller.create(input);
      tracker.workflows?.push(result.workflow.id);

      expect(result.success).toBe(true);
      expect(result.workflow.id).toBeDefined();
      expect(result.workflow.name).toBe(input.name);
      expect(result.workflow.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.workflow.version).toBe(1);

      // Verify database persistence
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, result.workflow.id));

      expect(dbWorkflow).toBeDefined();
      expect(dbWorkflow.name).toBe(input.name);
      expect(dbWorkflow.tenantId).toBe(ctx.authContext.tenantId);
      expect(dbWorkflow.createdById).toBe(ctx.authContext.userId);
    });

    it("should create workflow with stages", async () => {
      const input = {
        name: `Workflow with Stages ${Date.now()}`,
        type: "audit",
        config: {},
        stages: [
          {
            name: "Initial Review",
            description: "Review client documents",
            stageOrder: 1,
            isRequired: true,
            estimatedHours: "8.00",
            checklistItems: ["Review tax documents", "Verify client information"],
            autoComplete: false,
            requiresApproval: true,
          },
          {
            name: "Final Approval",
            description: "Manager approval",
            stageOrder: 2,
            isRequired: true,
            estimatedHours: "2.00",
            checklistItems: ["Manager sign-off"],
            autoComplete: false,
            requiresApproval: true,
          },
        ],
      };

      const result = await caller.create(input);
      tracker.workflows?.push(result.workflow.id);

      expect(result.success).toBe(true);

      // Verify stages were created
      const dbStages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, result.workflow.id));

      expect(dbStages.length).toBe(2);
      expect(dbStages[0].name).toBe("Initial Review");
      expect(dbStages[1].name).toBe("Final Approval");
    });

    it("should create initial version snapshot", async () => {
      const input = {
        name: `Versioned Workflow ${Date.now()}`,
        type: "onboarding",
        config: {},
      };

      const result = await caller.create(input);
      tracker.workflows?.push(result.workflow.id);

      expect(result.version).toBeDefined();
      expect(result.version.version).toBe(1);
      expect(result.version.changeType).toBe("created");

      // Verify version snapshot in database
      const [dbVersion] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.id, result.version.id));

      expect(dbVersion).toBeDefined();
      expect(dbVersion.workflowId).toBe(result.workflow.id);
      expect(dbVersion.version).toBe(1);
      // The create operation sets isActive to true and publishedAt
      expect(dbVersion.isActive).toBe(true);
      expect(dbVersion.publishedAt).toBeDefined();
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required name and type
        config: {},
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list workflows with tenant isolation", async () => {
      // Create test workflows
      const workflow1 = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Workflow Alpha",
      });
      const workflow2 = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Workflow Beta",
      });
      tracker.workflows?.push(workflow1.id, workflow2.id);

      const result = await caller.list({});

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const workflow of result) {
        expect(workflow.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test workflows are in the list
      const workflowIds = result.map(w => w.id);
      expect(workflowIds).toContain(workflow1.id);
      expect(workflowIds).toContain(workflow2.id);
    });

    it("should filter workflows by isActive status", async () => {
      // Create active and inactive workflows
      const activeWorkflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        isActive: true,
      });
      const inactiveWorkflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        isActive: false,
      });
      tracker.workflows?.push(activeWorkflow.id, inactiveWorkflow.id);

      const result = await caller.list({ isActive: true });

      expect(result.length).toBeGreaterThanOrEqual(1);
      // All returned workflows should be active
      for (const workflow of result) {
        expect(workflow.isActive).toBe(true);
      }
    });

    it("should return stage count for each workflow", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      await createTestWorkflowStage(workflow.id, { stageOrder: 1 });
      await createTestWorkflowStage(workflow.id, { stageOrder: 2 });
      tracker.workflows?.push(workflow.id);

      const result = await caller.list({});

      const testWorkflow = result.find(w => w.id === workflow.id);
      expect(testWorkflow).toBeDefined();
      expect(testWorkflow!.stageCount).toBe(2);
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve workflow with stages", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "GetById Test Workflow",
      });
      const stage1 = await createTestWorkflowStage(workflow.id, { stageOrder: 1, name: "Stage 1" });
      const stage2 = await createTestWorkflowStage(workflow.id, { stageOrder: 2, name: "Stage 2" });
      tracker.workflows?.push(workflow.id);

      const result = await caller.getById(workflow.id);

      expect(result.id).toBe(workflow.id);
      expect(result.name).toBe("GetById Test Workflow");
      expect(result.stages).toBeDefined();
      expect(result.stages.length).toBe(2);
      expect(result.stages[0].name).toBe("Stage 1");
      expect(result.stages[1].name).toBe("Stage 2");
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow("Workflow not found");
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create workflow for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId, {
        name: "Tenant A Workflow",
      });
      tracker.workflows?.push(workflowA.id);

      // Attempt to access tenant A's workflow from tenant B (our test tenant)
      await expect(caller.getById(workflowA.id)).rejects.toThrow("Workflow not found");

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(workflowA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update workflow and increment version", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Original Name",
        description: "Original description",
        version: 1,
      });
      tracker.workflows?.push(workflow.id);

      const result = await caller.update({
        id: workflow.id,
        data: {
          name: "Updated Name",
          description: "Updated description",
        },
        publishImmediately: true,
      });

      expect(result.workflow.name).toBe("Updated Name");
      expect(result.workflow.version).toBe(2);

      // Verify database persistence
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, workflow.id));

      expect(dbWorkflow.name).toBe("Updated Name");
      expect(dbWorkflow.version).toBe(2);
    });

    it("should create new version snapshot on update", async () => {
      // Use the create endpoint to ensure initial version is created
      const createResult = await caller.create({
        name: `Update Version Test ${Date.now()}`,
        type: "onboarding",
        config: {},
      });
      tracker.workflows?.push(createResult.workflow.id);

      const result = await caller.update({
        id: createResult.workflow.id,
        data: { name: "Updated for Version Test" },
        changeDescription: "Test update",
        publishImmediately: false,
      });

      expect(result.version).toBeDefined();
      expect(result.version.version).toBe(2);
      expect(result.version.changeType).toBe("updated");

      // Verify version snapshot
      const versions = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, createResult.workflow.id));

      expect(versions.length).toBeGreaterThanOrEqual(2); // Initial version + update
    });

    it("should update stages when provided", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      await createTestWorkflowStage(workflow.id, { stageOrder: 1, name: "Old Stage" });
      tracker.workflows?.push(workflow.id);

      await caller.update({
        id: workflow.id,
        data: {
          stages: [
            {
              name: "New Stage 1",
              stageOrder: 1,
              isRequired: true,
              estimatedHours: "4.00",
              checklistItems: [],
              autoComplete: false,
              requiresApproval: false,
            },
            {
              name: "New Stage 2",
              stageOrder: 2,
              isRequired: true,
              estimatedHours: "6.00",
              checklistItems: [],
              autoComplete: false,
              requiresApproval: false,
            },
          ],
        },
      });

      const dbStages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, workflow.id));

      expect(dbStages.length).toBe(2);
      expect(dbStages[0].name).toBe("New Stage 1");
      expect(dbStages[1].name).toBe("New Stage 2");
    });

    it("should throw NOT_FOUND for non-existent workflow", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { name: "Should Fail" },
        })
      ).rejects.toThrow("Workflow not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create workflow for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId);
      tracker.workflows?.push(workflowA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: workflowA.id,
          data: { name: "Malicious Update" },
        })
      ).rejects.toThrow("Workflow not found");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete workflow from database", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        name: "Delete Test Workflow",
      });
      tracker.workflows?.push(workflow.id);

      const result = await caller.delete(workflow.id);

      expect(result.success).toBe(true);

      // Verify workflow is deleted
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, workflow.id));

      expect(dbWorkflow).toBeUndefined();
    });

    it("should prevent deletion if workflow is in use by tasks", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
      const task = await createTestTask(ctx.authContext.tenantId, client.id, ctx.authContext.userId);

      tracker.workflows?.push(workflow.id);
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      // Create a workflow version first (required for foreign key)
      const [version] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          config: workflow.config,
          stagesSnapshot: { stages: [] },
          changeDescription: "Initial version",
          changeType: "created",
          isActive: true,
          createdById: ctx.authContext.userId,
        })
        .returning();

      tracker.workflowVersions?.push(version.id);

      // Create task workflow instance
      const [instance] = await db
        .insert(taskWorkflowInstances)
        .values({
          taskId: task.id,
          workflowId: workflow.id,
          workflowVersionId: version.id,
          version: 1,
          status: "active",
          stagesSnapshot: {},
        })
        .returning();

      tracker.taskWorkflowInstances?.push(instance.id);

      await expect(caller.delete(workflow.id)).rejects.toThrow(
        "Cannot delete workflow that is in use by tasks"
      );

      // Verify workflow still exists
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, workflow.id));

      expect(dbWorkflow).toBeDefined();
    });

    it("should throw NOT_FOUND for non-existent workflow", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow("Workflow not found");
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create workflow for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId);
      tracker.workflows?.push(workflowA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(workflowA.id)).rejects.toThrow("Workflow not found");

      // Verify workflow still exists
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, workflowA.id));

      expect(dbWorkflow).toBeDefined();
    });
  });

  describe("toggleActive (Integration)", () => {
    it("should toggle workflow active status", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId, {
        isActive: true,
      });
      tracker.workflows?.push(workflow.id);

      const result = await caller.toggleActive({
        id: workflow.id,
        isActive: false,
      });

      expect(result.success).toBe(true);
      expect(result.workflow.isActive).toBe(false);

      // Verify database persistence
      const [dbWorkflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, workflow.id));

      expect(dbWorkflow.isActive).toBe(false);
    });

    it("should throw NOT_FOUND for non-existent workflow", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.toggleActive({
          id: nonExistentId,
          isActive: true,
        })
      ).rejects.toThrow("Workflow not found");
    });

    it("should prevent cross-tenant toggle", async () => {
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId, { isActive: true });
      tracker.workflows?.push(workflowA.id);

      await expect(
        caller.toggleActive({
          id: workflowA.id,
          isActive: false,
        })
      ).rejects.toThrow("Workflow not found");
    });
  });

  describe("listVersions (Integration)", () => {
    it("should list all versions for a workflow", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.workflows?.push(workflow.id);

      // Create a version manually for testing
      const [version] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          estimatedDays: workflow.estimatedDays,
          serviceComponentId: workflow.serviceComponentId,
          config: workflow.config,
          stagesSnapshot: { stages: [] },
          changeDescription: "Initial version",
          changeType: "created",
          isActive: true,
          createdById: ctx.authContext.userId,
        })
        .returning();

      const result = await caller.listVersions(workflow.id);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].workflowId).toBe(workflow.id);
    });

    it("should enforce tenant isolation for version listing", async () => {
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId, {
        email: `isolation-test-${crypto.randomUUID()}@example.com`,
      });
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const workflowA = await createTestWorkflow(tenantAId, userAId);
      tracker.workflows?.push(workflowA.id);

      // Should return empty array (tenant isolation)
      const result = await caller.listVersions(workflowA.id);
      expect(result).toEqual([]);
    });
  });

  describe("publishVersion (Integration)", () => {
    it("should publish a version and make it active", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.workflows?.push(workflow.id);

      const [version1] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          trigger: workflow.trigger || "manual",
          estimatedDays: workflow.estimatedDays,
          serviceComponentId: workflow.serviceComponentId,
          config: workflow.config,
          stagesSnapshot: { stages: [] },
          changeDescription: "Version 1",
          changeType: "created",
          isActive: false,
          createdById: ctx.authContext.userId,
        })
        .returning();

      const result = await caller.publishVersion({
        versionId: version1.id,
        workflowId: workflow.id,
        publishNotes: "Publishing version 1",
      });

      expect(result.success).toBe(true);

      // Verify version is now active
      const [dbVersion] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.id, version1.id));

      expect(dbVersion.isActive).toBe(true);
      expect(dbVersion.publishedAt).toBeDefined();
    });

    it("should deactivate other versions when publishing", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.workflows?.push(workflow.id);

      const [version1] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: workflow.name,
          type: workflow.type,
          trigger: "manual",
          config: {},
          stagesSnapshot: { stages: [] },
          changeDescription: "Version 1",
          changeType: "created",
          isActive: true,
          createdById: ctx.authContext.userId,
        })
        .returning();

      const [version2] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 2,
          name: workflow.name,
          type: workflow.type,
          trigger: "manual",
          config: {},
          stagesSnapshot: { stages: [] },
          changeDescription: "Version 2",
          changeType: "updated",
          isActive: false,
          createdById: ctx.authContext.userId,
        })
        .returning();

      await caller.publishVersion({
        versionId: version2.id,
        workflowId: workflow.id,
      });

      // Version 1 should be deactivated
      const [dbVersion1] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.id, version1.id));

      expect(dbVersion1.isActive).toBe(false);

      // Version 2 should be active
      const [dbVersion2] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.id, version2.id));

      expect(dbVersion2.isActive).toBe(true);
    });
  });

  describe("compareVersions (Integration)", () => {
    it("should compare two versions and show differences", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.workflows?.push(workflow.id);

      const [version1] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 1,
          name: "Original Name",
          description: "Original description",
          type: workflow.type,
          trigger: "manual",
          estimatedDays: 10,
          config: {},
          stagesSnapshot: {
            stages: [
              { id: "stage1", name: "Stage 1", stageOrder: 1, isRequired: true, estimatedHours: "8", checklistItems: [] }
            ]
          },
          changeDescription: "Version 1",
          changeType: "created",
          isActive: false,
          createdById: ctx.authContext.userId,
        })
        .returning();

      const [version2] = await db
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          tenantId: ctx.authContext.tenantId,
          version: 2,
          name: "Updated Name",
          description: "Updated description",
          type: workflow.type,
          trigger: "manual",
          estimatedDays: 14,
          config: {},
          stagesSnapshot: {
            stages: [
              { id: "stage1", name: "Stage 1 Updated", stageOrder: 1, isRequired: true, estimatedHours: "10", checklistItems: [] }
            ]
          },
          changeDescription: "Version 2",
          changeType: "updated",
          isActive: false,
          createdById: ctx.authContext.userId,
        })
        .returning();

      const result = await caller.compareVersions({
        workflowId: workflow.id,
        versionId1: version1.id,
        versionId2: version2.id,
      });

      expect(result).toBeDefined();
      expect(result.version1.version).toBe(1);
      expect(result.version2.version).toBe(2);
      expect(result.metadataChanges).toContain("name");
      expect(result.metadataChanges).toContain("description");
      expect(result.metadataChanges).toContain("estimatedDays");
      expect(result.summary.stagesModified).toBeGreaterThanOrEqual(1);
    });

    it("should throw NOT_FOUND for non-existent versions", async () => {
      const workflow = await createTestWorkflow(ctx.authContext.tenantId, ctx.authContext.userId);
      tracker.workflows?.push(workflow.id);

      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.compareVersions({
          workflowId: workflow.id,
          versionId1: nonExistentId,
          versionId2: nonExistentId,
        })
      ).rejects.toThrow("One or both versions not found");
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(workflowsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("toggleActive");
      expect(procedures).toContain("listVersions");
      expect(procedures).toContain("publishVersion");
      expect(procedures).toContain("getActiveInstances");
      expect(procedures).toContain("migrateInstances");
      expect(procedures).toContain("compareVersions");
      expect(procedures).toContain("rollbackToVersion");
    });

    it("should have 12 procedures total", () => {
      const procedures = Object.keys(workflowsRouter._def.procedures);
      expect(procedures.length).toBe(12);
    });
  });
});
