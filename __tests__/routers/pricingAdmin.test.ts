/**
 * Pricing Admin Router Tests
 *
 * Tests for the pricingAdmin tRPC router
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pricingAdminRouter } from "@/app/server/routers/pricingAdmin";
import {
  cleanupTestData,
  createTestPricingRule,
  createTestService,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/pricingAdmin.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof pricingAdminRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    services: [],
    pricingRules: [],
  };

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
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.services = [];
    tracker.pricingRules = [];
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.getComponent(service.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.getComponent(123)).rejects.toThrow();
    });
  });

  describe("createComponent", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        category: "tax_compliance",
      };

      await expect(caller.createComponent(invalidInput)).rejects.toThrow();
    });

    it("should accept valid component data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        code: "corp_tax",
        name: "Corporation Tax Return",
        category: "compliance" as const,
        pricingModel: "fixed" as const,
        description: "Annual corporation tax return",
        isActive: true,
      };

      const result = await caller.createComponent(validInput);
      tracker.services?.push(result.component.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
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

      await expect(caller.updateComponent(invalidInput)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: service.id,
        data: {
          name: "Updated Component Name",
          isActive: false,
        },
      };

      await expect(caller.updateComponent(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: service.id,
        data: {
          isActive: false,
        },
      };

      await expect(caller.updateComponent(validInput)).resolves.not.toThrow();
    });
  });

  describe("deleteComponent", () => {
    it("should accept valid component ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.deleteComponent(service.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.deleteComponent(null)).rejects.toThrow();
    });
  });

  describe("cloneComponent", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing newCode and newName
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(caller.cloneComponent(invalidInput)).rejects.toThrow();
    });

    it("should accept valid clone data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: service.id,
        newCode: "corp_tax_v2",
        newName: "Corporation Tax Return V2",
      };

      const result = await caller.cloneComponent(validInput);
      tracker.services?.push(result.component.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("bulkUpdateComponents", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing isActive
        ids: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      await expect(caller.bulkUpdateComponents(invalidInput)).rejects.toThrow();
    });

    it("should accept valid bulk update data", async () => {
      // Create real test data (router creates activity logs which require real tenant)
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service1 = await createTestService(tenantId, {
        code: "TEST_SVC_1",
      });
      tracker.services?.push(service1.id);

      const service2 = await createTestService(tenantId, {
        code: "TEST_SVC_2",
      });
      tracker.services?.push(service2.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        ids: [service1.id, service2.id],
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

      await expect(caller.bulkUpdateComponents(invalidInput)).rejects.toThrow();
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

      await expect(caller.getRulesByComponent(validId)).resolves.not.toThrow();
    });
  });

  describe("createRule", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        ruleType: "base_price",
      };

      await expect(caller.createRule(invalidInput)).rejects.toThrow();
    });

    it("should accept valid rule data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        componentId: service.id, // Fixed: router expects componentId, not serviceId
        ruleType: "turnover_band" as const,
        minValue: "0",
        maxValue: "49999",
        price: "150.00",
        isActive: true,
      };

      const result = await caller.createRule(validInput);
      tracker.pricingRules?.push(result.rule.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
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

      await expect(caller.updateRule(invalidInput)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      const rule = await createTestPricingRule(tenantId, service.id);
      tracker.pricingRules?.push(rule.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: rule.id,
        data: {
          price: "175.00",
          isActive: true,
        },
      };

      await expect(caller.updateRule(validInput)).resolves.not.toThrow();
    });
  });

  describe("deleteRule", () => {
    it("should accept valid rule ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      const rule = await createTestPricingRule(tenantId, service.id);
      tracker.pricingRules?.push(rule.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.deleteRule(rule.id)).resolves.not.toThrow();
    });
  });

  describe("bulkCreateRules", () => {
    it("should accept array of valid rules", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const service = await createTestService(tenantId);
      tracker.services?.push(service.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = [
        {
          componentId: service.id, // Fixed: router expects componentId, not serviceId
          ruleType: "turnover_band" as const,
          minValue: "0",
          maxValue: "49999",
          price: "150.00",
          isActive: true,
        },
        {
          componentId: service.id, // Fixed: router expects componentId, not serviceId
          ruleType: "turnover_band" as const,
          minValue: "50000",
          maxValue: "99999",
          price: "200.00",
          isActive: true,
        },
      ];

      const result = await caller.bulkCreateRules(validInput);
      for (const rule of result.rules) {
        tracker.pricingRules?.push(rule.id);
      }
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should validate input is an array", async () => {
      const invalidInput = {
        componentId: "550e8400-e29b-41d4-a716-446655440000",
        ruleType: "base_price",
      };

      await expect(caller.bulkCreateRules(invalidInput)).rejects.toThrow();
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
