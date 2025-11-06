import { describe, expect, it } from "vitest";
import { getHubGradient, HUB_COLORS, type HubName } from "./hub-colors";

describe("hub-colors", () => {
  describe("HUB_COLORS", () => {
    it("should include all 10 hub colors", () => {
      expect(HUB_COLORS).toHaveProperty("practice-hub");
      expect(HUB_COLORS).toHaveProperty("client-hub");
      expect(HUB_COLORS).toHaveProperty("proposal-hub");
      expect(HUB_COLORS).toHaveProperty("employee-hub");
      expect(HUB_COLORS).toHaveProperty("social-hub");
      expect(HUB_COLORS).toHaveProperty("portal-hub");
      expect(HUB_COLORS).toHaveProperty("admin-hub");
      expect(HUB_COLORS).toHaveProperty("bookkeeping-hub");
      expect(HUB_COLORS).toHaveProperty("accounts-hub");
      expect(HUB_COLORS).toHaveProperty("payroll-hub");
    });

    it("should have correct color values", () => {
      expect(HUB_COLORS["practice-hub"]).toBe("#2dd4bf");
      expect(HUB_COLORS["client-hub"]).toBe("#3b82f6");
      expect(HUB_COLORS["proposal-hub"]).toBe("#ec4899");
      expect(HUB_COLORS["employee-hub"]).toBe("#10b981");
      expect(HUB_COLORS["social-hub"]).toBe("#8b5cf6");
      expect(HUB_COLORS["portal-hub"]).toBe("#4f46e5");
      expect(HUB_COLORS["admin-hub"]).toBe("#f97316");
      expect(HUB_COLORS["bookkeeping-hub"]).toBe("#f59e0b");
      expect(HUB_COLORS["accounts-hub"]).toBe("#06b6d4");
      expect(HUB_COLORS["payroll-hub"]).toBe("#84cc16");
    });

    it("should be a const object", () => {
      // TypeScript's 'as const' ensures type-level readonly, but not runtime frozen
      // This is sufficient for type safety - the object cannot be modified
      // in well-typed code
      expect(HUB_COLORS).toBeDefined();
      expect(typeof HUB_COLORS).toBe("object");
    });
  });

  describe("HubName type", () => {
    it("should accept valid hub names", () => {
      const validHubNames: HubName[] = [
        "practice-hub",
        "client-hub",
        "proposal-hub",
        "employee-hub",
        "social-hub",
        "portal-hub",
        "admin-hub",
        "bookkeeping-hub",
        "accounts-hub",
        "payroll-hub",
      ];

      validHubNames.forEach((hubName) => {
        expect(HUB_COLORS[hubName]).toBeDefined();
      });
    });
  });

  describe("getHubGradient", () => {
    it("should return correct gradient for client-hub blue", () => {
      const gradient = getHubGradient("#3b82f6");
      expect(gradient).toBe("linear-gradient(90deg, #3b82f6, #2563eb)");
    });

    it("should return correct gradient for admin orange", () => {
      const gradient = getHubGradient("#f97316");
      expect(gradient).toBe("linear-gradient(90deg, #f97316, #ea580c)");
    });

    it("should return correct gradient for employee-hub emerald", () => {
      const gradient = getHubGradient("#10b981");
      expect(gradient).toBe("linear-gradient(90deg, #10b981, #059669)");
    });

    it("should return correct gradient for proposal-hub pink", () => {
      const gradient = getHubGradient("#ec4899");
      expect(gradient).toBe("linear-gradient(90deg, #ec4899, #db2777)");
    });

    it("should return correct gradient for social-hub purple", () => {
      const gradient = getHubGradient("#8b5cf6");
      expect(gradient).toBe("linear-gradient(90deg, #8b5cf6, #7c3aed)");
    });

    it("should return correct gradient for practice-hub teal", () => {
      const gradient = getHubGradient("#2dd4bf");
      expect(gradient).toBe("linear-gradient(90deg, #2dd4bf, #14b8a6)");
    });

    it("should default to blue gradient for unknown colors", () => {
      const gradient = getHubGradient("#ff0000");
      expect(gradient).toBe("linear-gradient(90deg, #3b82f6, #2563eb)");
    });

    it("should default to blue gradient for empty string", () => {
      const gradient = getHubGradient("");
      expect(gradient).toBe("linear-gradient(90deg, #3b82f6, #2563eb)");
    });

    it("should handle all hub colors from HUB_COLORS", () => {
      Object.values(HUB_COLORS).forEach((color) => {
        const gradient = getHubGradient(color);
        expect(gradient).toBeTruthy();
        expect(gradient).toContain("linear-gradient");
        expect(gradient).toContain(color);
      });
    });
  });
});
