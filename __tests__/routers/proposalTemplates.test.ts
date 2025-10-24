/**
 * Proposal Templates Router Tests
 *
 * Tests for the proposalTemplates tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { proposalTemplatesRouter } from "@/app/server/routers/proposalTemplates";
import { createCaller, createMockContext, type TestContextWithAuth } from "../helpers/trpc";

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
    transaction: vi.fn((cb) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }),
    ),
  },
}));

describe("app/server/routers/proposalTemplates.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof proposalTemplatesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    // Set admin role for admin procedures
    ctx.authContext = { ...ctx.authContext, role: "admin" };
    caller = createCaller(proposalTemplatesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(caller.list({})).resolves.not.toThrow();
    });

    it("should accept category filter", async () => {
      await expect(
        caller.list({ category: "startup" }),
      ).resolves.not.toThrow();
    });

    it("should accept isActive filter", async () => {
      await expect(
        caller.list({ isActive: true }),
      ).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        caller.list({ search: "test" }),
      ).resolves.not.toThrow();
    });

    it("should accept all filters combined", async () => {
      await expect(
        caller.list({
          category: "startup",
          isActive: true,
          search: "test template",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      await expect(caller.getById(validId)).resolves.not.toThrow();
    });

    it("should reject invalid UUID", async () => {
      await expect(caller.getById("invalid-id")).rejects.toThrow();
    });

    it("should reject non-string input", async () => {
      await expect(caller.getById(123 as any)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should accept valid template data with minimal fields", async () => {
      const validData = {
        name: "Test Template",
        defaultServices: [{ componentCode: "BOOK-001" }],
      };

      await expect(caller.create(validData)).resolves.not.toThrow();
    });

    it("should accept valid template data with all fields", async () => {
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

      await expect(caller.create(validData)).resolves.not.toThrow();
    });

    it("should require name field", async () => {
      const invalidData = {
        defaultServices: [],
      };

      await expect(caller.create(invalidData as any)).rejects.toThrow();
    });

    it("should require defaultServices array", async () => {
      const invalidData = {
        name: "Test Template",
      };

      await expect(caller.create(invalidData as any)).rejects.toThrow();
    });

    it("should validate defaultServices structure", async () => {
      const invalidData = {
        name: "Test Template",
        defaultServices: [{ invalid: "structure" }],
      };

      await expect(caller.create(invalidData as any)).rejects.toThrow();
    });

    it("should accept service config as optional", async () => {
      const validData = {
        name: "Test Template",
        defaultServices: [
          { componentCode: "BOOK-001" },
          { componentCode: "VAT-001", config: { test: "value" } },
        ],
      };

      await expect(caller.create(validData)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should accept partial update data", async () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Name",
        },
      };

      await expect(caller.update(validData)).resolves.not.toThrow();
    });

    it("should accept updating multiple fields", async () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Name",
          description: "Updated description",
          category: "enterprise",
          isDefault: true,
        },
      };

      await expect(caller.update(validData)).resolves.not.toThrow();
    });

    it("should accept updating services", async () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          defaultServices: [
            { componentCode: "BOOK-001" },
            { componentCode: "VAT-001", config: { test: "value" } },
          ],
        },
      };

      await expect(caller.update(validData)).resolves.not.toThrow();
    });

    it("should require valid UUID for id", async () => {
      const invalidData = {
        id: "invalid-id",
        data: {
          name: "Updated Name",
        },
      };

      await expect(caller.update(invalidData)).rejects.toThrow();
    });

    it("should accept empty data object", async () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {},
      };

      await expect(caller.update(validData)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      await expect(caller.delete(validId)).resolves.not.toThrow();
    });

    it("should reject invalid UUID", async () => {
      await expect(caller.delete("invalid-id")).rejects.toThrow();
    });
  });

  describe("setDefault", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      await expect(caller.setDefault(validId)).resolves.not.toThrow();
    });

    it("should reject invalid UUID", async () => {
      await expect(caller.setDefault("invalid-id")).rejects.toThrow();
    });

    it("should reject non-string input", async () => {
      await expect(caller.setDefault(123 as any)).rejects.toThrow();
    });
  });
});
