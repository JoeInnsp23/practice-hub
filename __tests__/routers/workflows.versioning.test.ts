import { afterEach, describe, expect, it } from "vitest";
import { tasksRouter } from "@/app/server/routers/tasks";
import { workflowsRouter } from "@/app/server/routers/workflows";
import {
  cleanupTestData,
  createTestClient,
  createTestTask,
  createTestTenant,
  createTestUser,
  createTestWorkflow,
  createTestWorkflowVersion,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("Workflow Versioning System", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    workflows: [],
    workflowVersions: [],
    workflowStages: [],
    taskWorkflowInstances: [],
    tasks: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.workflows = [];
    tracker.workflowVersions = [];
    tracker.workflowStages = [];
    tracker.taskWorkflowInstances = [];
    tracker.tasks = [];
  });

  describe("Router Procedures Exist", () => {
    it("should have all version management procedures", () => {
      const procedures = Object.keys(workflowsRouter._def.procedures);

      expect(procedures).toContain("listVersions");
      expect(procedures).toContain("publishVersion");
      expect(procedures).toContain("getActiveInstances");
      expect(procedures).toContain("migrateInstances");
      expect(procedures).toContain("compareVersions");
      expect(procedures).toContain("rollbackToVersion");
    });
  });

  describe("Input Validation", () => {
    it("should validate listVersions input", async () => {
      // Setup: Create tenant, user, and workflow
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      // Test: Should not throw when listing versions for a real workflow
      await expect(
        workflowCaller.listVersions(workflow.id),
      ).resolves.not.toThrow();
    });

    it("should validate publishVersion input", async () => {
      // Setup: Create tenant, user, workflow, and version
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
      });
      tracker.workflowVersions?.push(version.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      const input = {
        versionId: version.id,
        workflowId: workflow.id,
      };

      await expect(workflowCaller.publishVersion(input)).resolves.not.toThrow();
    });

    it("should validate publishVersion input with publishNotes", async () => {
      // Setup: Create tenant, user, workflow, and version
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
      });
      tracker.workflowVersions?.push(version.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      const input = {
        versionId: version.id,
        workflowId: workflow.id,
        publishNotes: "Fixed stage ordering issue",
      };

      await expect(workflowCaller.publishVersion(input)).resolves.not.toThrow();
    });

    it("should validate compareVersions input", async () => {
      // Setup: Create tenant, user, workflow, and 2 versions
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version1 = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
        version: 1,
      });
      tracker.workflowVersions?.push(version1.id);

      const version2 = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
        version: 2,
      });
      tracker.workflowVersions?.push(version2.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      const input = {
        workflowId: workflow.id,
        versionId1: version1.id,
        versionId2: version2.id,
      };

      await expect(
        workflowCaller.compareVersions(input),
      ).resolves.not.toThrow();
    });

    it("should validate rollbackToVersion input", async () => {
      // Setup: Create tenant, user, workflow, and version
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
      });
      tracker.workflowVersions?.push(version.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      const input = {
        workflowId: workflow.id,
        targetVersionId: version.id,
        publishImmediately: true,
        publishNotes: "Rollback to version 2 due to critical issue",
      };

      await expect(
        workflowCaller.rollbackToVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate rollbackToVersion input with minimal fields", async () => {
      // Setup: Create tenant, user, workflow, and version
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
      });
      tracker.workflowVersions?.push(version.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      const input = {
        workflowId: workflow.id,
        targetVersionId: version.id,
      };

      await expect(
        workflowCaller.rollbackToVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate migrateInstances input", async () => {
      // Setup: Create tenant, user, workflow, and version
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
      });
      tracker.workflowVersions?.push(version.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const workflowCaller = createCaller(workflowsRouter, ctx);

      // Note: migrateInstances requires real instances, but for input validation
      // we can test with empty array or non-existent IDs
      const input = {
        instanceIds: [],
        newVersionId: version.id,
      };

      await expect(
        workflowCaller.migrateInstances(input),
      ).resolves.not.toThrow();
    });
  });

  describe("Task Assignment with Versioning", () => {
    it("should validate assignWorkflow input", async () => {
      // Setup: Create tenant, user, client, workflow, and task
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const workflow = await createTestWorkflow(tenantId, userId);
      tracker.workflows?.push(workflow.id);

      // Create an active version for the workflow
      const version = await createTestWorkflowVersion(workflow.id, tenantId, {
        createdById: userId,
        isActive: true, // assignWorkflow requires an active version
      });
      tracker.workflowVersions?.push(version.id);

      const task = await createTestTask(tenantId, client.id, userId);
      tracker.tasks?.push(task.id);

      // Create context with real IDs
      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const taskCaller = createCaller(tasksRouter, ctx);

      const input = {
        taskId: task.id,
        workflowId: workflow.id,
      };

      await expect(taskCaller.assignWorkflow(input)).resolves.not.toThrow();
    });
  });
});
