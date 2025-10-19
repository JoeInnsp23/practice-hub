/**
 * Portal Router Tests
 *
 * Tests for the portal tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { portalRouter } from "@/app/server/routers/portal";
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
    innerJoin: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/portal.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof portalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(portalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getCategoriesWithLinks", () => {
    it("should have no required input", () => {
      const procedure = portalRouter._def.procedures.getCategoriesWithLinks;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("getCategories", () => {
    it("should have no required input", () => {
      const procedure = portalRouter._def.procedures.getCategories;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("createCategory", () => {
    it("should validate required name field", () => {
      const invalidInput = {
        // Missing name
        description: "Test category",
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid category data", () => {
      const validInput = {
        name: "My Category",
        description: "Test category",
        iconName: "folder",
        colorHex: "#3b82f6",
        sortOrder: 1,
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate name minimum length", () => {
      const invalidInput = {
        name: "", // Empty string
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate name maximum length", () => {
      const invalidInput = {
        name: "a".repeat(101), // Exceeds max of 100
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate colorHex format", () => {
      const invalidInput = {
        name: "Test Category",
        colorHex: "invalid", // Invalid hex format
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid hex color", () => {
      const validInputs = [
        { name: "Category 1", colorHex: "#FF0000" },
        { name: "Category 2", colorHex: "#00ff00" },
        { name: "Category 3", colorHex: "#0000FF" },
      ];

      for (const input of validInputs) {
        expect(() => {
          portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
            input,
          );
        }).not.toThrow();
      }
    });

    it("should default sortOrder to 0", () => {
      const result =
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse({
          name: "Test Category",
        });
      expect(result?.sortOrder).toBe(0);
    });

    it("should validate sortOrder minimum value", () => {
      const invalidInput = {
        name: "Test Category",
        sortOrder: -1, // Below minimum of 0
      };

      expect(() => {
        portalRouter._def.procedures.createCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("updateCategory", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing id, name, sortOrder, isActive
        description: "Updated category",
      };

      expect(() => {
        portalRouter._def.procedures.updateCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated Category",
        description: "Updated description",
        iconName: "folder",
        colorHex: "#ef4444",
        sortOrder: 2,
        isActive: true,
      };

      expect(() => {
        portalRouter._def.procedures.updateCategory._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteCategory", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
      };

      expect(() => {
        portalRouter._def.procedures.deleteCategory._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid category ID", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        portalRouter._def.procedures.deleteCategory._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getLinks", () => {
    it("should accept empty input", () => {
      expect(() => {
        portalRouter._def.procedures.getLinks._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept categoryId filter", () => {
      const validInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        portalRouter._def.procedures.getLinks._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("createLink", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing categoryId, title, url
        description: "Test link",
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid link data with external URL", () => {
      const validInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        title: "External Link",
        description: "Link to external site",
        url: "https://example.com",
        isInternal: false,
        iconName: "external-link",
        sortOrder: 1,
        targetBlank: true,
        requiresAuth: false,
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept valid link data with internal path", () => {
      const validInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Internal Link",
        url: "/dashboard",
        isInternal: true,
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate title minimum length", () => {
      const invalidInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        title: "", // Empty string
        url: "/test",
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate title maximum length", () => {
      const invalidInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        title: "a".repeat(201), // Exceeds max of 200
        url: "/test",
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept allowedRoles array", () => {
      const validInput = {
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Admin Link",
        url: "/admin",
        allowedRoles: ["admin", "org:admin"],
      };

      expect(() => {
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should default isInternal to false", () => {
      const result =
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse({
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Test Link",
          url: "https://example.com",
        });
      expect(result?.isInternal).toBe(false);
    });

    it("should default targetBlank to true", () => {
      const result =
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse({
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Test Link",
          url: "https://example.com",
        });
      expect(result?.targetBlank).toBe(true);
    });

    it("should default requiresAuth to false", () => {
      const result =
        portalRouter._def.procedures.createLink._def.inputs[0]?.parse({
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Test Link",
          url: "https://example.com",
        });
      expect(result?.requiresAuth).toBe(false);
    });
  });

  describe("updateLink", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing id, categoryId, title, url, isInternal, sortOrder, isActive, targetBlank, requiresAuth
        description: "Updated link",
      };

      expect(() => {
        portalRouter._def.procedures.updateLink._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "660e8400-e29b-41d4-a716-446655440000",
        title: "Updated Link",
        description: "Updated description",
        url: "https://updated.com",
        isInternal: false,
        iconName: "link",
        sortOrder: 3,
        isActive: true,
        targetBlank: true,
        requiresAuth: true,
        allowedRoles: ["admin"],
      };

      expect(() => {
        portalRouter._def.procedures.updateLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteLink", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
      };

      expect(() => {
        portalRouter._def.procedures.deleteLink._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid link ID", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        portalRouter._def.procedures.deleteLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("reorderCategories", () => {
    it("should validate required categories field", () => {
      const invalidInput = {
        // Missing categories
      };

      expect(() => {
        portalRouter._def.procedures.reorderCategories._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid reorder data", () => {
      const validInput = {
        categories: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            sortOrder: 0,
          },
          {
            id: "660e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
          },
        ],
      };

      expect(() => {
        portalRouter._def.procedures.reorderCategories._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate array elements have required fields", () => {
      const invalidInput = {
        categories: [
          {
            // Missing id and sortOrder
          },
        ],
      };

      expect(() => {
        portalRouter._def.procedures.reorderCategories._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("reorderLinks", () => {
    it("should validate required links field", () => {
      const invalidInput = {
        // Missing links
      };

      expect(() => {
        portalRouter._def.procedures.reorderLinks._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid reorder data", () => {
      const validInput = {
        links: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            sortOrder: 0,
          },
          {
            id: "660e8400-e29b-41d4-a716-446655440000",
            sortOrder: 1,
          },
        ],
      };

      expect(() => {
        portalRouter._def.procedures.reorderLinks._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getUserFavorites", () => {
    it("should have no required input", () => {
      const procedure = portalRouter._def.procedures.getUserFavorites;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("toggleFavorite", () => {
    it("should validate required linkId field", () => {
      const invalidInput = {
        // Missing linkId
      };

      expect(() => {
        portalRouter._def.procedures.toggleFavorite._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid link ID", () => {
      const validInput = {
        linkId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        portalRouter._def.procedures.toggleFavorite._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
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
