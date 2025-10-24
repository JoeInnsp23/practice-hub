/**
 * Pricing Config Router Tests
 *
 * Tests for the pricingConfig tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { pricingConfigRouter } from "@/app/server/routers/pricingConfig";
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
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/pricingConfig.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof pricingConfigRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(pricingConfigRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getConfig", () => {
    it("should have no required input", () => {
      const procedure = pricingConfigRouter._def.procedures.getConfig;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("updateComplexityMultipliers", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing multipliers
        model: "modelA",
      };

      await expect(
        caller.updateComplexityMultipliers(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid Model A multipliers", async () => {
      const validInput = {
        model: "modelA" as const,
        multipliers: {
          clean: 0.95,
          average: 1.0,
          complex: 1.15,
          disaster: 1.4,
        },
      };

      await expect(
        caller.updateComplexityMultipliers(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept valid Model B multipliers", async () => {
      const validInput = {
        model: "modelB" as const,
        multipliers: {
          clean: 0.95,
          average: 1.0,
          complex: 1.1,
          disaster: 1.25,
        },
      };

      await expect(
        caller.updateComplexityMultipliers(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate model enum values", async () => {
      const invalidInput = {
        model: "modelC",
        multipliers: {
          clean: 0.95,
          average: 1.0,
          complex: 1.15,
          disaster: 1.4,
        },
      };

      await expect(
        caller.updateComplexityMultipliers(invalidInput),
      ).rejects.toThrow();
    });

    it("should validate multiplier min value", async () => {
      const invalidInput = {
        model: "modelA",
        multipliers: {
          clean: 0.4, // Below minimum of 0.5
          average: 1.0,
          complex: 1.15,
          disaster: 1.4,
        },
      };

      await expect(
        caller.updateComplexityMultipliers(invalidInput),
      ).rejects.toThrow();
    });

    it("should validate multiplier max value", async () => {
      const invalidInput = {
        model: "modelA",
        multipliers: {
          clean: 0.95,
          average: 1.0,
          complex: 1.15,
          disaster: 2.5, // Exceeds maximum of 2.0
        },
      };

      await expect(
        caller.updateComplexityMultipliers(invalidInput),
      ).rejects.toThrow();
    });
  });

  describe("updateIndustryMultipliers", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing regulated
        simple: 0.95,
        standard: 1.0,
        complex: 1.15,
      };

      await expect(
        caller.updateIndustryMultipliers(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid industry multipliers", async () => {
      const validInput = {
        simple: 0.95,
        standard: 1.0,
        complex: 1.15,
        regulated: 1.3,
      };

      await expect(
        caller.updateIndustryMultipliers(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate multiplier ranges", async () => {
      const invalidInput = {
        simple: 0.3, // Below minimum
        standard: 1.0,
        complex: 1.15,
        regulated: 1.3,
      };

      await expect(
        caller.updateIndustryMultipliers(invalidInput),
      ).rejects.toThrow();
    });
  });

  describe("updateDiscountRules", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required nested fields
        volumeTier1: {
          threshold: 500,
        },
      };

      await expect(
        caller.updateDiscountRules(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid discount rules", async () => {
      const validInput = {
        volumeTier1: {
          threshold: 500,
          percentage: 5,
          description: "5% volume discount",
        },
        volumeTier2: {
          threshold: 1000,
          percentage: 3,
          description: "Additional 3% discount",
        },
        rushFee: {
          percentage: 25,
          description: "25% rush fee",
        },
        newClient: {
          percentage: 10,
          duration: 12,
          description: "10% first-year discount",
        },
        customDiscount: {
          maxPercentage: 25,
          requiresApproval: true,
          description: "Custom discount",
        },
      };

      await expect(
        caller.updateDiscountRules(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate percentage ranges", async () => {
      const invalidInput = {
        volumeTier1: {
          threshold: 500,
          percentage: 150, // Exceeds max of 100
          description: "5% volume discount",
        },
        volumeTier2: {
          threshold: 1000,
          percentage: 3,
          description: "Additional 3% discount",
        },
        rushFee: {
          percentage: 25,
          description: "25% rush fee",
        },
        newClient: {
          percentage: 10,
          duration: 12,
          description: "10% first-year discount",
        },
        customDiscount: {
          maxPercentage: 25,
          requiresApproval: true,
          description: "Custom discount",
        },
      };

      await expect(
        caller.updateDiscountRules(invalidInput),
      ).rejects.toThrow();
    });

    it("should validate duration ranges", async () => {
      const invalidInput = {
        volumeTier1: {
          threshold: 500,
          percentage: 5,
          description: "5% volume discount",
        },
        volumeTier2: {
          threshold: 1000,
          percentage: 3,
          description: "Additional 3% discount",
        },
        rushFee: {
          percentage: 25,
          description: "25% rush fee",
        },
        newClient: {
          percentage: 10,
          duration: 48, // Exceeds max of 36
          description: "10% first-year discount",
        },
        customDiscount: {
          maxPercentage: 25,
          requiresApproval: true,
          description: "Custom discount",
        },
      };

      await expect(
        caller.updateDiscountRules(invalidInput),
      ).rejects.toThrow();
    });
  });

  describe("updateGlobalSettings", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        defaultTurnoverBand: "90k-149k",
      };

      await expect(
        caller.updateGlobalSettings(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid global settings", async () => {
      const validInput = {
        defaultTurnoverBand: "90k-149k",
        defaultIndustry: "standard" as const,
        roundingRule: "nearest_1" as const,
        currencySymbol: "£",
        taxRate: 20,
      };

      await expect(
        caller.updateGlobalSettings(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate industry enum values", async () => {
      const invalidInput = {
        defaultTurnoverBand: "90k-149k",
        defaultIndustry: "invalid",
        roundingRule: "nearest_1",
        currencySymbol: "£",
        taxRate: 0,
      };

      await expect(
        caller.updateGlobalSettings(invalidInput),
      ).rejects.toThrow();
    });

    it("should validate rounding rule enum values", async () => {
      const invalidInput = {
        defaultTurnoverBand: "90k-149k",
        defaultIndustry: "standard",
        roundingRule: "nearest_100",
        currencySymbol: "£",
        taxRate: 0,
      };

      await expect(
        caller.updateGlobalSettings(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept all valid industry values", async () => {
      const validIndustries = ["simple", "standard", "complex", "regulated"];

      for (const industry of validIndustries) {
        await expect(
          caller.updateGlobalSettings({
            defaultTurnoverBand: "90k-149k",
            defaultIndustry: industry,
            roundingRule: "nearest_1",
            currencySymbol: "£",
            taxRate: 0,
          }),
        ).resolves.not.toThrow();
      }
    });

    it("should accept all valid rounding rules", async () => {
      const validRules = ["nearest_1", "nearest_5", "nearest_10", "none"];

      for (const rule of validRules) {
        await expect(
          caller.updateGlobalSettings({
            defaultTurnoverBand: "90k-149k",
            defaultIndustry: "standard",
            roundingRule: rule,
            currencySymbol: "£",
            taxRate: 0,
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("resetToDefaults", () => {
    it("should have no required input", () => {
      const procedure = pricingConfigRouter._def.procedures.resetToDefaults;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("exportConfig", () => {
    it("should have no required input", () => {
      const procedure = pricingConfigRouter._def.procedures.exportConfig;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("importConfig", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing config
      };

      await expect(
        caller.importConfig(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid configuration import", async () => {
      const validInput = {
        config: {
          complexityMultipliers: {
            modelA: {
              clean: 0.95,
              average: 1.0,
              complex: 1.15,
              disaster: 1.4,
            },
            modelB: {
              clean: 0.95,
              average: 1.0,
              complex: 1.1,
              disaster: 1.25,
            },
          },
          industryMultipliers: {
            simple: 0.95,
            standard: 1.0,
            complex: 1.15,
            regulated: 1.3,
          },
          discountRules: {
            volumeTier1: {
              threshold: 500,
              percentage: 5,
              description: "5% volume discount",
            },
            volumeTier2: {
              threshold: 1000,
              percentage: 3,
              description: "Additional 3% discount",
            },
            rushFee: {
              percentage: 25,
              description: "25% rush fee",
            },
            newClient: {
              percentage: 10,
              duration: 12,
              description: "10% first-year discount",
            },
            customDiscount: {
              maxPercentage: 25,
              requiresApproval: true,
              description: "Custom discount",
            },
          },
          globalSettings: {
            defaultTurnoverBand: "90k-149k",
            defaultIndustry: "standard" as const,
            roundingRule: "nearest_1" as const,
            currencySymbol: "£",
            taxRate: 0,
          },
        },
      };

      await expect(
        caller.importConfig(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(pricingConfigRouter._def.procedures);

      expect(procedures).toContain("getConfig");
      expect(procedures).toContain("updateComplexityMultipliers");
      expect(procedures).toContain("updateIndustryMultipliers");
      expect(procedures).toContain("updateDiscountRules");
      expect(procedures).toContain("updateGlobalSettings");
      expect(procedures).toContain("resetToDefaults");
      expect(procedures).toContain("exportConfig");
      expect(procedures).toContain("importConfig");
    });

    it("should have 8 procedures total", () => {
      const procedures = Object.keys(pricingConfigRouter._def.procedures);
      expect(procedures).toHaveLength(8);
    });
  });
});
