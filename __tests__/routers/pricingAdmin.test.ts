/**
 * Pricing Admin Router Tests
 *
 * Tests for the pricingAdmin tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { pricingAdminRouter } from "@/app/server/routers/pricingAdmin";
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
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/pricingAdmin.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof pricingAdminRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
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
    it("should accept valid component ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        pricingAdminRouter._def.procedures.getComponent._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        pricingAdminRouter._def.procedures.getComponent._def.inputs[0]?.parse(
          123,
        );
      }).toThrow();
    });
  });

  describe("createComponent", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        category: "tax_compliance",
      };

      expect(() => {
        pricingAdminRouter._def.procedures.createComponent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid component data", () => {
      const validInput = {
        code: "corp_tax",
        name: "Corporation Tax Return",
        category: "compliance",
        pricingModel: "fixed",
        description: "Annual corporation tax return",
        isActive: true,
      };

      expect(() => {
        pricingAdminRouter._def.procedures.createComponent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateComponent", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          name: "Updated Component",
        },
      };

      expect(() => {
        pricingAdminRouter._def.procedures.updateComponent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Component Name",
          isActive: false,
        },
      };

      expect(() => {
        pricingAdminRouter._def.procedures.updateComponent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          isActive: false,
        },
      };

      expect(() => {
        pricingAdminRouter._def.procedures.updateComponent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteComponent", () => {
    it("should accept valid component ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        pricingAdminRouter._def.procedures.deleteComponent._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        pricingAdminRouter._def.procedures.deleteComponent._def.inputs[0]?.parse(
          null,
        );
      }).toThrow();
    });
  });

  describe("cloneComponent", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing newCode and newName
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        pricingAdminRouter._def.procedures.cloneComponent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid clone data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        newCode: "corp_tax_v2",
        newName: "Corporation Tax Return V2",
      };

      expect(() => {
        pricingAdminRouter._def.procedures.cloneComponent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("bulkUpdateComponents", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing isActive
        ids: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      expect(() => {
        pricingAdminRouter._def.procedures.bulkUpdateComponents._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid bulk update data", () => {
      const validInput = {
        ids: [
          "550e8400-e29b-41d4-a716-446655440000",
          "660e8400-e29b-41d4-a716-446655440000",
        ],
        isActive: true,
      };

      expect(() => {
        pricingAdminRouter._def.procedures.bulkUpdateComponents._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate ids is an array", () => {
      const invalidInput = {
        ids: "not-an-array",
        isActive: true,
      };

      expect(() => {
        pricingAdminRouter._def.procedures.bulkUpdateComponents._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
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
    it("should accept valid component ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        pricingAdminRouter._def.procedures.getRulesByComponent._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });
  });

  describe("createRule", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        ruleType: "base_price",
      };

      expect(() => {
        pricingAdminRouter._def.procedures.createRule._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid rule data", () => {
      const validInput = {
        serviceId: "550e8400-e29b-41d4-a716-446655440000",
        ruleType: "turnover_band",
        minValue: "0",
        maxValue: "49999",
        price: "150.00",
        isActive: true,
      };

      expect(() => {
        pricingAdminRouter._def.procedures.createRule._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateRule", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          price: "200.00",
        },
      };

      expect(() => {
        pricingAdminRouter._def.procedures.updateRule._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          price: "175.00",
          isActive: true,
        },
      };

      expect(() => {
        pricingAdminRouter._def.procedures.updateRule._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteRule", () => {
    it("should accept valid rule ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        pricingAdminRouter._def.procedures.deleteRule._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });
  });

  describe("bulkCreateRules", () => {
    it("should accept array of valid rules", () => {
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

      expect(() => {
        pricingAdminRouter._def.procedures.bulkCreateRules._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate input is an array", () => {
      const invalidInput = {
        componentId: "550e8400-e29b-41d4-a716-446655440000",
        ruleType: "base_price",
      };

      expect(() => {
        pricingAdminRouter._def.procedures.bulkCreateRules._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
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
