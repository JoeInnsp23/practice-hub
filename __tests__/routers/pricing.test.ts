/**
 * Pricing Router Tests
 *
 * Tests for the pricing tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { pricingRouter } from "@/app/server/routers/pricing";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

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
    assertAuthContext(ctx);
    caller = createCaller(pricingRouter, ctx);
    vi.clearAllMocks();
  });

  describe("calculate", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing turnover, industry, services
      };

      await expect(
        caller.calculate(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid calculation input", async () => {
      const validInput = {
        turnover: "90k-149k",
        industry: "standard",
        services: [
          {
            serviceCode: "BOOKKEEPING_MONTHLY",
          },
        ],
      };

      await expect(
        caller.calculate(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept service with configuration", async () => {
      const validInput = {
        turnover: "150k-249k",
        industry: "complex",
        services: [
          {
            serviceCode: "BOOKKEEPING_MONTHLY",
            config: {
              complexity: "average",
              frequency: "monthly",
            },
          },
        ],
      };

      await expect(
        caller.calculate(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept transaction data", async () => {
      const validInput = {
        turnover: "500k-749k",
        industry: "regulated",
        services: [
          {
            serviceCode: "BOOKKEEPING_MONTHLY",
          },
        ],
        transactionData: {
          monthlyTransactions: 150,
          source: "xero",
        },
      };

      await expect(
        caller.calculate(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept modifiers", async () => {
      const validInput = {
        turnover: "1m+",
        industry: "standard",
        services: [
          {
            serviceCode: "VAT_QUARTERLY",
          },
        ],
        modifiers: {
          isRush: true,
          newClient: false,
          customDiscount: 5,
        },
      };

      await expect(
        caller.calculate(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate industry enum values", async () => {
      const invalidInput = {
        turnover: "90k-149k",
        industry: "invalid",
        services: [],
      };

      await expect(
        caller.calculate(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept all valid industry values", async () => {
      const validIndustries = ["simple", "standard", "complex", "regulated"];

      for (const industry of validIndustries) {
        await expect(
          caller.calculate({
            turnover: "90k-149k",
            industry,
            services: [],
          }),
        ).resolves.not.toThrow();
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
    it("should validate required componentId field", async () => {
      const invalidInput = {
        // Missing componentId
      };

      await expect(
        caller.getRules(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid component ID", async () => {
      const validInput = {
        componentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        caller.getRules(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("estimateTransactions", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing turnover, industry, vatRegistered
      };

      await expect(
        caller.estimateTransactions(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid estimation input", async () => {
      const validInput = {
        turnover: "250k-499k",
        industry: "standard",
        vatRegistered: true,
      };

      await expect(
        caller.estimateTransactions(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept all valid turnover bands", async () => {
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
        await expect(
          caller.estimateTransactions({
            turnover,
            industry: "standard",
            vatRegistered: false,
          }),
        ).resolves.not.toThrow();
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
