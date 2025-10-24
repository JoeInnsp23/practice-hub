import { beforeEach, describe, expect, it, vi } from "vitest";
import { tasksRouter } from "@/app/server/routers/tasks";
import { workflowsRouter } from "@/app/server/routers/workflows";
import { createCaller, createMockContext, type TestContextWithAuth } from "../helpers/trpc";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    transaction: vi.fn((fn) =>
      fn({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      }),
    ),
  },
}));

describe("Workflow Versioning System", () => {
  let ctx: TestContextWithAuth;
  let _workflowCaller: ReturnType<typeof createCaller<typeof workflowsRouter>>;
  let _taskCaller: ReturnType<typeof createCaller<typeof tasksRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _workflowCaller = createCaller(workflowsRouter, ctx);
    _taskCaller = createCaller(tasksRouter, ctx);
    vi.clearAllMocks();
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
      await expect(
        _workflowCaller.listVersions("workflow-uuid-123"),
      ).resolves.not.toThrow();
    });

    it("should validate publishVersion input", async () => {
      const input = {
        versionId: "version-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      await expect(
        _workflowCaller.publishVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate publishVersion input with publishNotes", async () => {
      const input = {
        versionId: "version-uuid-123",
        workflowId: "workflow-uuid-456",
        publishNotes: "Fixed stage ordering issue",
      };

      await expect(
        _workflowCaller.publishVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate compareVersions input", async () => {
      const input = {
        workflowId: "workflow-uuid-123",
        versionId1: "version-uuid-456",
        versionId2: "version-uuid-789",
      };

      await expect(
        _workflowCaller.compareVersions(input),
      ).resolves.not.toThrow();
    });

    it("should validate rollbackToVersion input", async () => {
      const input = {
        workflowId: "workflow-uuid-123",
        targetVersionId: "version-uuid-456",
        publishImmediately: true,
        publishNotes: "Rollback to version 2 due to critical issue",
      };

      await expect(
        _workflowCaller.rollbackToVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate rollbackToVersion input with minimal fields", async () => {
      const input = {
        workflowId: "workflow-uuid-123",
        targetVersionId: "version-uuid-456",
      };

      await expect(
        _workflowCaller.rollbackToVersion(input),
      ).resolves.not.toThrow();
    });

    it("should validate migrateInstances input", async () => {
      const input = {
        instanceIds: ["inst-1", "inst-2", "inst-3"],
        newVersionId: "version-uuid-789",
      };

      await expect(
        _workflowCaller.migrateInstances(input),
      ).resolves.not.toThrow();
    });
  });

  describe("Task Assignment with Versioning", () => {
    it("should validate assignWorkflow input", async () => {
      const input = {
        taskId: "task-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      await expect(_taskCaller.assignWorkflow(input)).resolves.not.toThrow();
    });
  });
});
