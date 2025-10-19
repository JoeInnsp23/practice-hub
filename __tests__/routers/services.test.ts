/**
 * Services Router Tests
 *
 * Tests for the services tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { servicesRouter } from "@/app/server/routers/services";
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
  },
}));

describe("app/server/routers/services.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof servicesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(servicesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        servicesRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        servicesRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "accounting",
        });
      }).not.toThrow();
    });

    it("should accept category filter", () => {
      expect(() => {
        servicesRouter._def.procedures.list._def.inputs[0]?.parse({
          category: "bookkeeping",
        });
      }).not.toThrow();
    });

    it("should accept isActive filter", () => {
      expect(() => {
        servicesRouter._def.procedures.list._def.inputs[0]?.parse({
          isActive: true,
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        servicesRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
          category: "tax",
          isActive: true,
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        servicesRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        servicesRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        name: "Test Service",
      };

      expect(() => {
        servicesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid service data", () => {
      const validInput = {
        code: "SVC001",
        name: "Bookkeeping Service",
        category: "bookkeeping",
        description: "Monthly bookkeeping",
        priceType: "fixed" as const,
        price: "500.00",
      };

      expect(() => {
        servicesRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        code: "SVC002",
        name: "Tax Filing",
        category: "tax",
        description: "Annual tax return",
        priceType: "hourly" as const,
        price: "150.00",
        defaultRate: "150.00",
        duration: 120,
        tags: ["tax", "annual"],
      };

      expect(() => {
        servicesRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          name: "Updated Service",
        },
      };

      expect(() => {
        servicesRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Service Name",
          price: "600.00",
        },
      };

      expect(() => {
        servicesRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
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
        servicesRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid service ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        servicesRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        servicesRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(servicesRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
    });

    it("should have 5 procedures total", () => {
      const procedures = Object.keys(servicesRouter._def.procedures);
      expect(procedures).toHaveLength(5);
    });
  });
});
