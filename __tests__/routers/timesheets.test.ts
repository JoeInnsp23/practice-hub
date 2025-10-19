/**
 * Timesheets Router Tests
 *
 * Tests for the timesheets tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { timesheetsRouter } from "@/app/server/routers/timesheets";
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
    execute: vi.fn().mockResolvedValue({ rows: [{}] }),
  },
}));

describe("app/server/routers/timesheets.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(timesheetsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept startDate filter", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          startDate: "2025-01-01",
        });
      }).not.toThrow();
    });

    it("should accept endDate filter", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          endDate: "2025-01-31",
        });
      }).not.toThrow();
    });

    it("should accept userId filter", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          userId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept billable filter", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          billable: true,
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        timesheetsRouter._def.procedures.list._def.inputs[0]?.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
          billable: true,
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        timesheetsRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        timesheetsRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        description: "Test entry",
      };

      expect(() => {
        timesheetsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid time entry data", () => {
      const validInput = {
        date: "2025-01-15",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Development work",
        hours: "8.00",
        billable: true,
        rate: "150.00",
        status: "draft" as const,
      };

      expect(() => {
        timesheetsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        date: "2025-01-15",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Client meeting",
        hours: "2.00",
        billable: false,
        rate: "0.00",
        status: "draft" as const,
        serviceComponentId: "660e8400-e29b-41d4-a716-446655440000",
        taskId: "770e8400-e29b-41d4-a716-446655440000",
        startTime: "09:00",
        endTime: "11:00",
        notes: "Discussed project requirements",
      };

      expect(() => {
        timesheetsRouter._def.procedures.create._def.inputs[0]?.parse(
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
          hours: "10.00",
        },
      };

      expect(() => {
        timesheetsRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          hours: "6.00",
          billable: false,
        },
      };

      expect(() => {
        timesheetsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          notes: "Updated description",
        },
      };

      expect(() => {
        timesheetsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid time entry ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        timesheetsRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        timesheetsRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("summary", () => {
    it("should validate required date fields", () => {
      const invalidInput = {
        // Missing required startDate/endDate
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        timesheetsRouter._def.procedures.summary._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid summary query", () => {
      const validInput = {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      };

      expect(() => {
        timesheetsRouter._def.procedures.summary._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional userId filter", () => {
      const validInput = {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        timesheetsRouter._def.procedures.summary._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(timesheetsRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
