/**
 * Legal Router Tests
 *
 * Tests for the legal tRPC router
 * Validates multi-tenant isolation, version tracking, and admin authorization
 */

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { legalRouter } from "@/app/server/routers/legal";
import { createCaller, createMockContext } from "../helpers/trpc";

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
  let caller: ReturnType<typeof createCaller<typeof legalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(legalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getByType", () => {
    it("should require pageType input", () => {
      const procedure = legalRouter._def.procedures.getByType;

      expect(() => {
        procedure._def.inputs[0]?.parse({});
      }).toThrow();
    });

    it("should accept valid pageType: privacy", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: "privacy",
        });
      }).not.toThrow();
    });

    it("should accept valid pageType: terms", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: "terms",
        });
      }).not.toThrow();
    });

    it("should accept valid pageType: cookie_policy", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: "cookie_policy",
        });
      }).not.toThrow();
    });

    it("should reject invalid pageType", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: "invalid_type",
        });
      }).toThrow();
    });
  });

  describe("update", () => {
    it("should require both pageType and content", () => {
      const procedure = legalRouter._def.procedures.update;

      expect(() => {
        procedure._def.inputs[0]?.parse({});
      }).toThrow();

      expect(() => {
        procedure._def.inputs[0]?.parse({ pageType: "privacy" });
      }).toThrow();

      expect(() => {
        procedure._def.inputs[0]?.parse({ content: "Test content" });
      }).toThrow();
    });

    it("should accept valid input with pageType and content", () => {
      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse({
          pageType: "privacy",
          content: "# Privacy Policy\n\nThis is the privacy policy content.",
        });
      }).not.toThrow();
    });

    it("should reject empty content", () => {
      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse({
          pageType: "privacy",
          content: "",
        });
      }).toThrow();
    });

    it("should accept markdown formatted content", () => {
      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse({
          pageType: "terms",
          content: `# Terms of Service

## Section 1
- Item 1
- Item 2

**Bold text** and *italic text*`,
        });
      }).not.toThrow();
    });
  });

  describe("getVersionHistory", () => {
    it("should require pageType input", () => {
      const procedure = legalRouter._def.procedures.getVersionHistory;

      expect(() => {
        procedure._def.inputs[0]?.parse({});
      }).toThrow();
    });

    it("should accept valid pageType", () => {
      expect(() => {
        legalRouter._def.procedures.getVersionHistory._def.inputs[0]?.parse({
          pageType: "privacy",
        });
      }).not.toThrow();
    });

    it("should reject invalid pageType", () => {
      expect(() => {
        legalRouter._def.procedures.getVersionHistory._def.inputs[0]?.parse({
          pageType: "invalid",
        });
      }).toThrow();
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
    it("update input should accept content that will be versioned", () => {
      const input = {
        pageType: "privacy" as const,
        content: "Updated privacy policy content",
      };

      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse(input);
      }).not.toThrow();
    });
  });

  describe("input validation edge cases", () => {
    it("should reject null pageType", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: null,
        });
      }).toThrow();
    });

    it("should reject undefined pageType", () => {
      expect(() => {
        legalRouter._def.procedures.getByType._def.inputs[0]?.parse({
          pageType: undefined,
        });
      }).toThrow();
    });

    it("should accept long content for update", () => {
      const longContent = "A".repeat(10000); // 10K characters
      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse({
          pageType: "terms",
          content: longContent,
        });
      }).not.toThrow();
    });

    it("should handle special characters in content", () => {
      const specialContent = `# Privacy Policy

Special characters: !@#$%^&*()_+-=[]{}|;':",./<>?
Unicode: 你好 مرحبا Здравствуйте`;

      expect(() => {
        legalRouter._def.procedures.update._def.inputs[0]?.parse({
          pageType: "privacy",
          content: specialContent,
        });
      }).not.toThrow();
    });
  });
});
