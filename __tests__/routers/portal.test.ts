/**
 * Portal Router Tests
 *
 * Tests for the portal tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { portalRouter } from "@/app/server/routers/portal";
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
    returning: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/portal.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof portalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(portalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(portalRouter._def.procedures);

      expect(procedures).toContain("getCategoriesWithLinks");
      expect(procedures).toContain("getCategories");
      expect(procedures).toContain("createCategory");
      expect(procedures).toContain("updateCategory");
      expect(procedures).toContain("deleteCategory");
      expect(procedures).toContain("getLinks");
      expect(procedures).toContain("createLink");
      expect(procedures).toContain("updateLink");
      expect(procedures).toContain("deleteLink");
      expect(procedures).toContain("reorderCategories");
      expect(procedures).toContain("reorderLinks");
      expect(procedures).toContain("getUserFavorites");
      expect(procedures).toContain("toggleFavorite");
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(portalRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
