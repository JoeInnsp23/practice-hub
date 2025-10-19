/**
 * Compliance Router Tests
 *
 * Tests for the compliance tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { complianceRouter } from "@/app/server/routers/compliance";
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
    returning: vi.fn().mockResolvedValue([]),
  },
}));

describe("app/server/routers/compliance.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof complianceRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(complianceRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "VAT return",
        });
      }).not.toThrow();
    });

    it("should accept type filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          type: "tax_return",
        });
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "pending",
        });
      }).not.toThrow();
    });

    it("should accept all status filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "all",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept assigneeId filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          assigneeId: "660e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept overdue filter", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          overdue: true,
        });
      }).not.toThrow();
    });

    it("should accept all filters combined", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "VAT",
          type: "tax_return",
          status: "pending",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
          assigneeId: "660e8400-e29b-41d4-a716-446655440000",
          overdue: false,
        });
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      expect(() => {
        complianceRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "invalid_status",
        });
      }).toThrow();
    });

    it("should accept all valid status values", () => {
      const validStatuses = ["pending", "in_progress", "completed", "overdue", "all"];

      for (const status of validStatuses) {
        expect(() => {
          complianceRouter._def.procedures.list._def.inputs[0]?.parse({
            status,
          });
        }).not.toThrow();
      }
    });
  });

  describe("getById", () => {
    it("should accept valid compliance ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        complianceRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        complianceRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing title, type, dueDate
        description: "Test compliance item",
      };

      expect(() => {
        complianceRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid compliance data", () => {
      const validInput = {
        title: "VAT Return Q4 2025",
        type: "tax_return",
        dueDate: "2025-01-31",
        description: "Quarterly VAT return submission",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        complianceRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        title: "Corporation Tax Return",
        type: "tax_return",
        dueDate: "2025-12-31",
        description: "Annual corporation tax return",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
        reminderDate: "2025-12-01",
        status: "pending" as const,
        priority: "high" as const,
        notes: "Ensure all documentation is ready",
      };

      expect(() => {
        complianceRouter._def.procedures.create._def.inputs[0]?.parse(
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
          title: "Updated Compliance Item",
        },
      };

      expect(() => {
        complianceRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "Updated VAT Return",
          status: "in_progress" as const,
        },
      };

      expect(() => {
        complianceRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          priority: "urgent" as const,
        },
      };

      expect(() => {
        complianceRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid compliance ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        complianceRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        complianceRouter._def.procedures.delete._def.inputs[0]?.parse(null);
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
        complianceRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
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
        complianceRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "invalid_status",
      };

      expect(() => {
        complianceRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid status values", () => {
      const validStatuses = ["pending", "in_progress", "completed", "overdue"];

      for (const status of validStatuses) {
        expect(() => {
          complianceRouter._def.procedures.updateStatus._def.inputs[0]?.parse({
            id: "550e8400-e29b-41d4-a716-446655440000",
            status,
          });
        }).not.toThrow();
      }
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(complianceRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("updateStatus");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(complianceRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
