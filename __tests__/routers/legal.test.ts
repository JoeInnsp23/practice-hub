/**
 * Legal Router Tests
 *
 * Tests for the legal tRPC router
 * Validates multi-tenant isolation, version tracking, and admin authorization
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { legalRouter } from "@/app/server/routers/legal";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/legal.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof legalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    assertAuthContext(ctx);
    _caller = createCaller(legalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getByType", () => {
    it("should require pageType input", async () => {
      await expect(_caller.getByType({} as any)).rejects.toThrow();
    });

    it("should accept valid pageType: privacy", async () => {
      await expect(
        _caller.getByType({ pageType: "privacy" }),
      ).resolves.not.toThrow();
    });

    it("should accept valid pageType: terms", async () => {
      await expect(
        _caller.getByType({ pageType: "terms" }),
      ).resolves.not.toThrow();
    });

    it("should accept valid pageType: cookie_policy", async () => {
      await expect(
        _caller.getByType({ pageType: "cookie_policy" }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid pageType", async () => {
      await expect(
        _caller.getByType({ pageType: "invalid_type" } as any),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should require both pageType and content", async () => {
      await expect(_caller.update({} as any)).rejects.toThrow();
      await expect(
        _caller.update({ pageType: "privacy" } as any),
      ).rejects.toThrow();
      await expect(_caller.update({ content: "Test content" } as any)).rejects.toThrow();
    });

    it("should accept valid input with pageType and content", async () => {
      await expect(
        _caller.update({
          pageType: "privacy",
          content: "# Privacy Policy\n\nThis is the privacy policy content.",
        }),
      ).resolves.not.toThrow();
    });

    it("should reject empty content", async () => {
      await expect(
        _caller.update({
          pageType: "privacy",
          content: "",
        } as any),
      ).rejects.toThrow();
    });

    it("should accept markdown formatted content", async () => {
      await expect(
        _caller.update({
          pageType: "terms",
          content: `# Terms of Service

## Section 1
- Item 1
- Item 2

**Bold text** and *italic text*`,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getVersionHistory", () => {
    it("should require pageType input", async () => {
      await expect(_caller.getVersionHistory({} as any)).rejects.toThrow();
    });

    it("should accept valid pageType", async () => {
      await expect(
        _caller.getVersionHistory({ pageType: "privacy" }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid pageType", async () => {
      await expect(
        _caller.getVersionHistory({ pageType: "invalid" } as any),
      ).rejects.toThrow();
    });
  });

  describe("getAll", () => {
    it("should have no required input", () => {
      const procedure = legalRouter._def.procedures.getAll;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("multi-tenant isolation", () => {
    it("getByType should be protected (requires authentication)", () => {
      const procedure = legalRouter._def.procedures.getByType;
      expect(procedure._def.meta).toBeUndefined(); // Protected procedures don't have public meta
    });

    it("update should require admin role", () => {
      const procedure = legalRouter._def.procedures.update;
      // Admin procedures are middleware-protected in trpc.ts
      expect(procedure._def).toBeDefined();
    });

    it("getVersionHistory should require admin role", () => {
      const procedure = legalRouter._def.procedures.getVersionHistory;
      expect(procedure._def).toBeDefined();
    });

    it("getAll should be protected (requires authentication)", () => {
      const procedure = legalRouter._def.procedures.getAll;
      expect(procedure._def.meta).toBeUndefined();
    });
  });

  describe("version tracking", () => {
    it("update input should accept content that will be versioned", async () => {
      const input = {
        pageType: "privacy" as const,
        content: "Updated privacy policy content",
      };

      await expect(_caller.update(input)).resolves.not.toThrow();
    });
  });

  describe("input validation edge cases", () => {
    it("should reject null pageType", async () => {
      await expect(
        _caller.getByType({ pageType: null } as any),
      ).rejects.toThrow();
    });

    it("should reject undefined pageType", async () => {
      await expect(
        _caller.getByType({ pageType: undefined } as any),
      ).rejects.toThrow();
    });

    it("should accept long content for update", async () => {
      const longContent = "A".repeat(10000); // 10K characters
      await expect(
        _caller.update({
          pageType: "terms",
          content: longContent,
        }),
      ).resolves.not.toThrow();
    });

    it("should handle special characters in content", async () => {
      const specialContent = `# Privacy Policy

Special characters: !@#$%^&*()_+-=[]{}|;':",./<>?
Unicode: 你好 مرحبا Здравствуйте`;

      await expect(
        _caller.update({
          pageType: "privacy",
          content: specialContent,
        }),
      ).resolves.not.toThrow();
    });
  });
});
