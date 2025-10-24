/**
 * Activities Router Tests
 *
 * Tests for the activities tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { activitiesRouter } from "@/app/server/routers/activities";
import { createCaller, createMockContext } from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
}));

describe("app/server/routers/activities.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof activitiesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(activitiesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getRecent", () => {
    it("should accept empty input", () => {
      expect(() => {
        activitiesRouter._def.procedures.getRecent._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept limit parameter", () => {
      expect(() => {
        activitiesRouter._def.procedures.getRecent._def.inputs[0]?.parse({
          limit: 10,
        });
      }).not.toThrow();
    });

    it("should default limit to 20", () => {
      const result =
        activitiesRouter._def.procedures.getRecent._def.inputs[0]?.parse({});
      expect(result?.limit).toBe(20);
    });

    it("should validate limit min value", () => {
      expect(() => {
        activitiesRouter._def.procedures.getRecent._def.inputs[0]?.parse({
          limit: 0, // Below minimum of 1
        });
      }).toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        activitiesRouter._def.procedures.getRecent._def.inputs[0]?.parse({
          limit: 101, // Exceeds max of 100
        });
      }).toThrow();
    });
  });

  describe("list", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing entityType and entityId
        limit: 50,
      };

      expect(() => {
        activitiesRouter._def.procedures.list._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid input", () => {
      const validInput = {
        entityType: "client",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        activitiesRouter._def.procedures.list._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept limit parameter", () => {
      const validInput = {
        entityType: "lead",
        entityId: "660e8400-e29b-41d4-a716-446655440000",
        limit: 25,
      };

      expect(() => {
        activitiesRouter._def.procedures.list._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should default limit to 50", () => {
      const result =
        activitiesRouter._def.procedures.list._def.inputs[0]?.parse({
          entityType: "proposal",
          entityId: "770e8400-e29b-41d4-a716-446655440000",
        });
      expect(result?.limit).toBe(50);
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing entityType, entityId, action, description
        metadata: { test: "value" },
      };

      expect(() => {
        activitiesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid activity data", () => {
      const validInput = {
        entityType: "task",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        action: "completed",
        description: "Task marked as complete",
      };

      expect(() => {
        activitiesRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional metadata", () => {
      const validInput = {
        entityType: "invoice",
        entityId: "660e8400-e29b-41d4-a716-446655440000",
        action: "sent",
        description: "Invoice sent to client",
        metadata: {
          invoiceNumber: "INV-001",
          amount: 1000,
        },
      };

      expect(() => {
        activitiesRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getActivityCounts", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing entityId
        entityType: "client",
      };

      expect(() => {
        activitiesRouter._def.procedures.getActivityCounts._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid input", () => {
      const validInput = {
        entityType: "client",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        activitiesRouter._def.procedures.getActivityCounts._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(activitiesRouter._def.procedures);

      expect(procedures).toContain("getRecent");
      expect(procedures).toContain("list");
      expect(procedures).toContain("create");
      expect(procedures).toContain("getActivityCounts");
    });

    it("should have 4 procedures total", () => {
      const procedures = Object.keys(activitiesRouter._def.procedures);
      expect(procedures).toHaveLength(4);
    });
  });
});
