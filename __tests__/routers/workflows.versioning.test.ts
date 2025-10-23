import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { tasksRouter } from "@/app/server/routers/tasks";
import { workflowsRouter } from "@/app/server/routers/workflows";
import { createCaller, createMockContext } from "../helpers/trpc";

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
  let ctx: Context;
  let workflowCaller: ReturnType<typeof createCaller<typeof workflowsRouter>>;
  let taskCaller: ReturnType<typeof createCaller<typeof tasksRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    workflowCaller = createCaller(workflowsRouter, ctx);
    taskCaller = createCaller(tasksRouter, ctx);
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
    it("should validate listVersions input", () => {
      expect(() => {
        workflowsRouter._def.procedures.listVersions._def.inputs[0]?.parse(
          "workflow-uuid-123",
        );
      }).not.toThrow();
    });

    it("should validate publishVersion input", () => {
      const input = {
        versionId: "version-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      expect(() => {
        workflowsRouter._def.procedures.publishVersion._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should validate publishVersion input with publishNotes", () => {
      const input = {
        versionId: "version-uuid-123",
        workflowId: "workflow-uuid-456",
        publishNotes: "Fixed stage ordering issue",
      };

      expect(() => {
        workflowsRouter._def.procedures.publishVersion._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should validate compareVersions input", () => {
      const input = {
        workflowId: "workflow-uuid-123",
        versionId1: "version-uuid-456",
        versionId2: "version-uuid-789",
      };

      expect(() => {
        workflowsRouter._def.procedures.compareVersions._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should validate rollbackToVersion input", () => {
      const input = {
        workflowId: "workflow-uuid-123",
        targetVersionId: "version-uuid-456",
        publishImmediately: true,
        publishNotes: "Rollback to version 2 due to critical issue",
      };

      expect(() => {
        workflowsRouter._def.procedures.rollbackToVersion._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should validate rollbackToVersion input with minimal fields", () => {
      const input = {
        workflowId: "workflow-uuid-123",
        targetVersionId: "version-uuid-456",
      };

      expect(() => {
        workflowsRouter._def.procedures.rollbackToVersion._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should validate migrateInstances input", () => {
      const input = {
        instanceIds: ["inst-1", "inst-2", "inst-3"],
        newVersionId: "version-uuid-789",
      };

      expect(() => {
        workflowsRouter._def.procedures.migrateInstances._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });
  });

  describe("Task Assignment with Versioning", () => {
    it("should validate assignWorkflow input", () => {
      const input = {
        taskId: "task-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      expect(() => {
        tasksRouter._def.procedures.assignWorkflow._def.inputs[0]?.parse(input);
      }).not.toThrow();
    });
  });
});
