/**
 * Pricing Router Tests
 *
 * Tests for the pricing tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { pricingRouter } from "@/app/server/routers/pricing";
import { createCaller, createMockContext } from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/pricing.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof pricingRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(pricingRouter, ctx);
    vi.clearAllMocks();
  });

  describe("calculate", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing turnover, industry, services
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid calculation input", () => {
      const validInput = {
        turnover: "90k-149k",
        industry: "standard",
        services: [
          {
            componentCode: "BOOKKEEPING_MONTHLY",
          },
        ],
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept service with configuration", () => {
      const validInput = {
        turnover: "150k-249k",
        industry: "complex",
        services: [
          {
            componentCode: "BOOKKEEPING_MONTHLY",
            config: {
              complexity: "average",
              frequency: "monthly",
            },
          },
        ],
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept transaction data", () => {
      const validInput = {
        turnover: "500k-749k",
        industry: "regulated",
        services: [
          {
            componentCode: "BOOKKEEPING_MONTHLY",
          },
        ],
        transactionData: {
          monthlyTransactions: 150,
          source: "xero",
        },
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept modifiers", () => {
      const validInput = {
        turnover: "1m+",
        industry: "standard",
        services: [
          {
            componentCode: "VAT_QUARTERLY",
          },
        ],
        modifiers: {
          isRush: true,
          newClient: false,
          customDiscount: 5,
        },
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate industry enum values", () => {
      const invalidInput = {
        turnover: "90k-149k",
        industry: "invalid",
        services: [],
      };

      expect(() => {
        pricingRouter._def.procedures.calculate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid industry values", () => {
      const validIndustries = ["simple", "standard", "complex", "regulated"];

      for (const industry of validIndustries) {
        expect(() => {
          pricingRouter._def.procedures.calculate._def.inputs[0]?.parse({
            turnover: "90k-149k",
            industry,
            services: [],
          });
        }).not.toThrow();
      }
    });
  });

  describe("getComponents", () => {
    it("should have no required input", () => {
      const procedure = pricingRouter._def.procedures.getComponents;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getRules", () => {
    it("should validate required componentId field", () => {
      const invalidInput = {
        // Missing componentId
      };

      expect(() => {
        pricingRouter._def.procedures.getRules._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid component ID", () => {
      const validInput = {
        componentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        pricingRouter._def.procedures.getRules._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("estimateTransactions", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing turnover, industry, vatRegistered
      };

      expect(() => {
        pricingRouter._def.procedures.estimateTransactions._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid estimation input", () => {
      const validInput = {
        turnover: "250k-499k",
        industry: "standard",
        vatRegistered: true,
      };

      expect(() => {
        pricingRouter._def.procedures.estimateTransactions._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept all valid turnover bands", () => {
      const validTurnoverBands = [
        "0-89k",
        "90k-149k",
        "150k-249k",
        "250k-499k",
        "500k-749k",
        "750k-999k",
        "1m+",
      ];

      for (const turnover of validTurnoverBands) {
        expect(() => {
          pricingRouter._def.procedures.estimateTransactions._def.inputs[0]?.parse(
            {
              turnover,
              industry: "standard",
              vatRegistered: false,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(pricingRouter._def.procedures);

      expect(procedures).toContain("calculate");
      expect(procedures).toContain("getComponents");
      expect(procedures).toContain("getRules");
      expect(procedures).toContain("estimateTransactions");
    });

    it("should have 4 procedures total", () => {
      const procedures = Object.keys(pricingRouter._def.procedures);
      expect(procedures).toHaveLength(4);
    });
  });
});
