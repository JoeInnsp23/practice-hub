/**
 * Workflows Router Tests
 *
 * Tests for the workflows tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { workflowsRouter } from "@/app/server/routers/workflows";
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
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/workflows.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof workflowsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(workflowsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        workflowsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept isActive filter", () => {
      expect(() => {
        workflowsRouter._def.procedures.list._def.inputs[0]?.parse({
          isActive: true,
        });
      }).not.toThrow();
    });

    it("should accept type filter", () => {
      expect(() => {
        workflowsRouter._def.procedures.list._def.inputs[0]?.parse({
          type: "tax_return",
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        workflowsRouter._def.procedures.list._def.inputs[0]?.parse({
          isActive: true,
          type: "bookkeeping",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid workflow ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        workflowsRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        workflowsRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        description: "Test workflow",
      };

      expect(() => {
        workflowsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid workflow data", () => {
      const validInput = {
        name: "Tax Return Workflow",
        type: "tax_return",
        config: {}, // Required field
      };

      expect(() => {
        workflowsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        name: "Client Onboarding",
        description: "Standard client onboarding process",
        type: "onboarding",
        trigger: "manual" as const,
        serviceComponentId: "550e8400-e29b-41d4-a716-446655440000",
        isActive: true,
        estimatedDays: 14,
        config: {}, // Required field
      };

      expect(() => {
        workflowsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept workflow with stages", () => {
      const validInput = {
        name: "Complex Workflow",
        type: "audit",
        config: {}, // Required field
        stages: [
          {
            name: "Initial Review",
            description: "Review client documents",
            stageOrder: 1,
            isRequired: true,
            estimatedHours: "8.00",
            checklistItems: [
              "Review tax documents",
              "Verify client information",
            ],
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

      expect(() => {
        workflowsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          name: "Updated Workflow",
        },
      };

      expect(() => {
        workflowsRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Workflow Name",
          description: "Updated description",
        },
      };

      expect(() => {
        workflowsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          isActive: false,
        },
      };

      expect(() => {
        workflowsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept stage updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          stages: [
            {
              name: "New Stage",
              stageOrder: 1,
              isRequired: true,
            },
          ],
        },
      };

      expect(() => {
        workflowsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid workflow ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        workflowsRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        workflowsRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("toggleActive", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing isActive
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        workflowsRouter._def.procedures.toggleActive._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid toggle data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        isActive: true,
      };

      expect(() => {
        workflowsRouter._def.procedures.toggleActive._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept both true and false values", () => {
      const trueInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        isActive: true,
      };

      const falseInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        isActive: false,
      };

      expect(() => {
        workflowsRouter._def.procedures.toggleActive._def.inputs[0]?.parse(
          trueInput,
        );
      }).not.toThrow();

      expect(() => {
        workflowsRouter._def.procedures.toggleActive._def.inputs[0]?.parse(
          falseInput,
        );
      }).not.toThrow();
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
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(workflowsRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
