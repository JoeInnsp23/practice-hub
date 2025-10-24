/**
 * Pricing Admin Router Tests
 *
 * Tests for the pricingAdmin tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { pricingAdminRouter } from "@/app/server/routers/pricingAdmin";
import { type TestContextWithAuth, createCaller, createMockContext } from "../helpers/trpc";

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
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/pricingAdmin.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof pricingAdminRouter>>;

  beforeEach(() => {
    ctx = createMockContext({
      authContext: {
        userId: crypto.randomUUID(),
        tenantId: crypto.randomUUID(),
        organizationName: "Test Organization",
        role: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
      },
    });
    caller = createCaller(pricingAdminRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getAllComponents", () => {
    it("should have no required input", () => {
      const procedure = pricingAdminRouter._def.procedures.getAllComponents;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getComponent", () => {
    it("should accept valid component ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(
        caller.getComponent(validId),
      ).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.getComponent(123),
      ).rejects.toThrow();
    });
  });

  describe("createComponent", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        category: "tax_compliance",
      };

      await expect(
        caller.createComponent(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid component data", async () => {
      const validInput = {
        code: "corp_tax",
        name: "Corporation Tax Return",
        category: "compliance",
        pricingModel: "fixed",
        description: "Annual corporation tax return",
        isActive: true,
      };

      await expect(
        caller.createComponent(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("updateComponent", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        data: {
          name: "Updated Component",
        },
      };

      await expect(
        caller.updateComponent(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Component Name",
          isActive: false,
        },
      };

      await expect(
        caller.updateComponent(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          isActive: false,
        },
      };

      await expect(
        caller.updateComponent(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("deleteComponent", () => {
    it("should accept valid component ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(
        caller.deleteComponent(validId),
      ).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.deleteComponent(null),
      ).rejects.toThrow();
    });
  });

  describe("cloneComponent", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing newCode and newName
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        caller.cloneComponent(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid clone data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        newCode: "corp_tax_v2",
        newName: "Corporation Tax Return V2",
      };

      await expect(
        caller.cloneComponent(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("bulkUpdateComponents", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing isActive
        ids: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      await expect(
        caller.bulkUpdateComponents(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid bulk update data", async () => {
      const validInput = {
        ids: [
          "550e8400-e29b-41d4-a716-446655440000",
          "660e8400-e29b-41d4-a716-446655440000",
        ],
        isActive: true,
      };

      await expect(
        caller.bulkUpdateComponents(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate ids is an array", async () => {
      const invalidInput = {
        ids: "not-an-array",
        isActive: true,
      };

      await expect(
        caller.bulkUpdateComponents(invalidInput),
      ).rejects.toThrow();
    });
  });

  describe("getAllRules", () => {
    it("should have no required input", () => {
      const procedure = pricingAdminRouter._def.procedures.getAllRules;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getRulesByComponent", () => {
    it("should accept valid component ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(
        caller.getRulesByComponent(validId),
      ).resolves.not.toThrow();
    });
  });

  describe("createRule", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        ruleType: "base_price",
      };

      await expect(
        caller.createRule(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid rule data", async () => {
      const validInput = {
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        ruleType: "turnover_band",
        minValue: "0",
        maxValue: "49999",
        price: "150.00",
        isActive: true,
      };

      await expect(
        caller.createRule(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("updateRule", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        data: {
          price: "200.00",
        },
      };

      await expect(
        caller.updateRule(invalidInput),
      ).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          price: "175.00",
          isActive: true,
        },
      };

      await expect(
        caller.updateRule(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("deleteRule", () => {
    it("should accept valid rule ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(
        caller.deleteRule(validId),
      ).resolves.not.toThrow();
    });
  });

  describe("bulkCreateRules", () => {
    it("should accept array of valid rules", async () => {
      const validInput = [
        {
          serviceId: "550e8400-e29b-41d4-a716-446655440000",
          ruleType: "turnover_band",
          minValue: "0",
          maxValue: "49999",
          price: "150.00",
          isActive: true,
        },
        {
          serviceId: "550e8400-e29b-41d4-a716-446655440000",
          ruleType: "turnover_band",
          minValue: "50000",
          maxValue: "99999",
          price: "200.00",
          isActive: true,
        },
      ];

      await expect(
        caller.bulkCreateRules(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate input is an array", async () => {
      const invalidInput = {
        componentId: "550e8400-e29b-41d4-a716-446655440000",
        ruleType: "base_price",
      };

      await expect(
        caller.bulkCreateRules(invalidInput),
      ).rejects.toThrow();
    });
  });

  describe("validatePricingIntegrity", () => {
    it("should have no required input", () => {
      const procedure =
        pricingAdminRouter._def.procedures.validatePricingIntegrity;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(pricingAdminRouter._def.procedures);

      expect(procedures).toContain("getAllComponents");
      expect(procedures).toContain("getComponent");
      expect(procedures).toContain("createComponent");
      expect(procedures).toContain("updateComponent");
      expect(procedures).toContain("deleteComponent");
      expect(procedures).toContain("cloneComponent");
      expect(procedures).toContain("bulkUpdateComponents");
      expect(procedures).toContain("getAllRules");
      expect(procedures).toContain("getRulesByComponent");
      expect(procedures).toContain("createRule");
      expect(procedures).toContain("updateRule");
      expect(procedures).toContain("deleteRule");
      expect(procedures).toContain("bulkCreateRules");
      expect(procedures).toContain("validatePricingIntegrity");
    });

    it("should have 14 procedures total", () => {
      const procedures = Object.keys(pricingAdminRouter._def.procedures);
      expect(procedures).toHaveLength(14);
    });
  });
});
