/**
 * Tasks Router Tests
 *
 * Tests for the tasks tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { tasksRouter } from "@/app/server/routers/tasks";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

// Mock the database
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
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  },
}));

describe("app/server/routers/tasks.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof tasksRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(tasksRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test task",
        });
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "pending",
        });
      }).not.toThrow();
    });

    it("should accept priority filter", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({
          priority: "high",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        tasksRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
          status: "in_progress",
          priority: "medium",
        });
      }).not.toThrow();
    });
  });

  describe("listOld", () => {
    it("should accept empty input", () => {
      expect(() => {
        tasksRouter._def.procedures.listOld._def.inputs[0]?.parse({});
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        tasksRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        tasksRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        description: "Test task",
      };

      expect(() => {
        tasksRouter._def.procedures.create._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid task data", () => {
      const validInput = {
        title: "Review documents",
        description: "Review client documents",
        status: "pending" as const,
        priority: "medium" as const,
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        title: "Complete tax return",
        description: "File annual tax return",
        status: "in_progress" as const,
        priority: "high" as const,
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        dueDate: "2025-12-31",
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          title: "Updated Task",
        },
      };

      expect(() => {
        tasksRouter._def.procedures.update._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "Updated Task Title",
          status: "completed" as const,
        },
      };

      expect(() => {
        tasksRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          priority: "high" as const,
        },
      };

      expect(() => {
        tasksRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid task ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        tasksRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        tasksRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("updateStatus", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing status
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid status update", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "completed" as const,
      };

      expect(() => {
        tasksRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("assignWorkflow", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing workflowId
        taskId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.assignWorkflow._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid workflow assignment", () => {
      const validInput = {
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        workflowId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.assignWorkflow._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getWorkflowInstance", () => {
    it("should accept valid task ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        tasksRouter._def.procedures.getWorkflowInstance._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });
  });

  describe("updateChecklistItem", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing stageId, taskId, and completed
        itemId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        tasksRouter._def.procedures.updateChecklistItem._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid checklist update", () => {
      const validInput = {
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        stageId: "660e8400-e29b-41d4-a716-446655440000",
        itemId: "770e8400-e29b-41d4-a716-446655440000",
        completed: true,
      };

      expect(() => {
        tasksRouter._def.procedures.updateChecklistItem._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(tasksRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
