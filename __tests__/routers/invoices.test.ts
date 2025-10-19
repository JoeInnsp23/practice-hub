/**
 * Invoices Router Tests
 *
 * Tests for the invoices tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoicesRouter } from "@/app/server/routers/invoices";
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

describe("app/server/routers/invoices.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof invoicesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(invoicesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "INV-001",
        });
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "paid",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept overdue filter", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({
          overdue: true,
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        invoicesRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "INV",
          status: "sent",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        invoicesRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        invoicesRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        invoiceNumber: "INV-001",
      };

      expect(() => {
        invoicesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invoice data", () => {
      const validInput = {
        invoiceNumber: "INV-001",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxAmount: "200.00",
        total: "1200.00",
      };

      expect(() => {
        invoicesRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept invoice with items", () => {
      const validInput = {
        invoiceNumber: "INV-002",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxAmount: "200.00",
        total: "1200.00",
        items: [
          {
            description: "Service A",
            quantity: "1.00",
            rate: "500.00",
            amount: "500.00",
          },
          {
            description: "Service B",
            quantity: "2.00",
            rate: "250.00",
            amount: "500.00",
          },
        ],
      };

      expect(() => {
        invoicesRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept optional paidDate", () => {
      const validInput = {
        invoiceNumber: "INV-003",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "paid" as const,
        subtotal: "1000.00",
        taxAmount: "200.00",
        total: "1200.00",
        paidDate: "2025-01-15",
      };

      expect(() => {
        invoicesRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          status: "sent" as const,
        },
      };

      expect(() => {
        invoicesRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          status: "sent" as const,
          dueDate: "2025-02-28",
        },
      };

      expect(() => {
        invoicesRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          notes: "Payment received",
        },
      };

      expect(() => {
        invoicesRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("updateStatus", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing status
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        invoicesRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid status update", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "paid" as const,
      };

      expect(() => {
        invoicesRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept status update with paid date", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "paid" as const,
        paidDate: "2025-01-15",
      };

      expect(() => {
        invoicesRouter._def.procedures.updateStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid invoice ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        invoicesRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        invoicesRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(invoicesRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("updateStatus");
      expect(procedures).toContain("delete");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(invoicesRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
