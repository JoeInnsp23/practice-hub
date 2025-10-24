/**
 * Proposal Templates Router Tests
 *
 * Tests for the proposalTemplates tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { proposalTemplatesRouter } from "@/app/server/routers/proposalTemplates";
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
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    transaction: vi.fn((cb) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      }),
    ),
  },
}));

describe("app/server/routers/proposalTemplates.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof proposalTemplatesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    // Set admin role for admin procedures
    ctx.authContext = { ...ctx.authContext, role: "admin" };
    _caller = createCaller(proposalTemplatesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept category filter", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.list._def.inputs[0]?.parse({
          category: "startup",
        });
      }).not.toThrow();
    });

    it("should accept isActive filter", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.list._def.inputs[0]?.parse({
          isActive: true,
        });
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
        });
      }).not.toThrow();
    });

    it("should accept all filters combined", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.list._def.inputs[0]?.parse({
          category: "startup",
          isActive: true,
          search: "test template",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      expect(() => {
        proposalTemplatesRouter._def.procedures.getById._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should reject invalid UUID", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.getById._def.inputs[0]?.parse(
          "invalid-id",
        );
      }).toThrow();
    });

    it("should reject non-string input", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.getById._def.inputs[0]?.parse(
          123,
        );
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should accept valid template data with minimal fields", () => {
      const validData = {
        name: "Test Template",
        defaultServices: [{ componentCode: "BOOK-001" }],
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });

    it("should accept valid template data with all fields", () => {
      const validData = {
        name: "Test Template",
        description: "Test description",
        category: "startup",
        defaultServices: [
          { componentCode: "BOOK-001" },
          {
            componentCode: "VAT-001",
            config: { complexity: "average", employees: 5 },
          },
        ],
        termsAndConditions: "Standard terms",
        notes: "Internal notes",
        isDefault: false,
        isActive: true,
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });

    it("should require name field", () => {
      const invalidData = {
        defaultServices: [],
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidData,
        );
      }).toThrow();
    });

    it("should require defaultServices array", () => {
      const invalidData = {
        name: "Test Template",
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidData,
        );
      }).toThrow();
    });

    it("should validate defaultServices structure", () => {
      const invalidData = {
        name: "Test Template",
        defaultServices: [{ invalid: "structure" }],
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidData,
        );
      }).toThrow();
    });

    it("should accept service config as optional", () => {
      const validData = {
        name: "Test Template",
        defaultServices: [
          { componentCode: "BOOK-001" },
          { componentCode: "VAT-001", config: { test: "value" } },
        ],
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.create._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should accept partial update data", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Name",
        },
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.update._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });

    it("should accept updating multiple fields", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Name",
          description: "Updated description",
          category: "enterprise",
          isDefault: true,
        },
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.update._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });

    it("should accept updating services", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          defaultServices: [
            { componentCode: "BOOK-001" },
            { componentCode: "VAT-001", config: { test: "value" } },
          ],
        },
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.update._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });

    it("should require valid UUID for id", () => {
      const invalidData = {
        id: "invalid-id",
        data: {
          name: "Updated Name",
        },
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidData,
        );
      }).toThrow();
    });

    it("should accept empty data object", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {},
      };

      expect(() => {
        proposalTemplatesRouter._def.procedures.update._def.inputs[0]?.parse(
          validData,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      expect(() => {
        proposalTemplatesRouter._def.procedures.delete._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should reject invalid UUID", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.delete._def.inputs[0]?.parse(
          "invalid-id",
        );
      }).toThrow();
    });
  });

  describe("setDefault", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      expect(() => {
        proposalTemplatesRouter._def.procedures.setDefault._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should reject invalid UUID", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.setDefault._def.inputs[0]?.parse(
          "invalid-id",
        );
      }).toThrow();
    });

    it("should reject non-string input", () => {
      expect(() => {
        proposalTemplatesRouter._def.procedures.setDefault._def.inputs[0]?.parse(
          123,
        );
      }).toThrow();
    });
  });
});
