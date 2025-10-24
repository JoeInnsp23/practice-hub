/**
 * Services Router Integration Tests
 *
 * Integration-level tests for the services tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { servicesRouter } from "@/app/server/routers/services";
import { db } from "@/lib/db";
import { activityLogs, services } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Helper function to create test service
async function createTestService(
  tenantId: string,
  overrides: Partial<typeof services.$inferInsert> = {},
) {
  const serviceId = crypto.randomUUID();
  const timestamp = Date.now();

  const [service] = await db
    .insert(services)
    .values({
      id: serviceId,
      tenantId,
      code: overrides.code || `SVC-${timestamp}`,
      name: overrides.name || `Test Service ${timestamp}`,
      category: overrides.category || "bookkeeping",
      description: overrides.description || "Test service description",
      pricingModel: overrides.pricingModel || "fixed",
      priceType: overrides.priceType || "fixed",
      price: overrides.price || "500.00",
      defaultRate: overrides.defaultRate,
      duration: overrides.duration,
      tags: overrides.tags,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      metadata: overrides.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return service;
}

describe("app/server/routers/services.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof servicesRouter>>;
  const tracker: TestDataTracker & { services?: string[] } = {
    tenants: [],
    users: [],
    services: [],
  };

  beforeEach(async () => {
    // Create test tenant and user for each test
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create mock context with test tenant and user
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    caller = createCaller(servicesRouter, ctx);
  });

  afterEach(async () => {
    // Cleanup services first (before tenants/users)
    if (tracker.services && tracker.services.length > 0) {
      await db
        .delete(services)
        .where(eq(services.id, tracker.services[0]))
        .catch(() => {});

      for (const serviceId of tracker.services) {
        await db
          .delete(services)
          .where(eq(services.id, serviceId))
          .catch(() => {});
      }
    }

    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.services = [];
  });

  describe("create (Integration)", () => {
    it("should create service and persist to database", async () => {
      const input = {
        code: `SVC-${Date.now()}`,
        name: "Bookkeeping Service",
        category: "bookkeeping",
        description: "Monthly bookkeeping service",
        pricingModel: "fixed" as const,
        priceType: "fixed" as const,
        price: "500.00",
      };

      const result = await caller.create(input);
      tracker.services?.push(result.service.id);

      expect(result.success).toBe(true);
      expect(result.service.id).toBeDefined();
      expect(result.service.name).toBe("Bookkeeping Service");
      expect(result.service.tenantId).toBe(ctx.authContext.tenantId);

      // Verify database persistence
      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, result.service.id));

      expect(dbService).toBeDefined();
      expect(dbService.name).toBe("Bookkeeping Service");
      expect(dbService.code).toBe(input.code);
      expect(dbService.category).toBe("bookkeeping");
      expect(dbService.priceType).toBe("fixed");
      expect(dbService.price).toBe("500.00");
      expect(dbService.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should create service with optional fields", async () => {
      const input = {
        code: `SVC-${Date.now()}`,
        name: "Hourly Consulting",
        category: "management",
        description: "Hourly consulting service",
        pricingModel: "fixed" as const,
        priceType: "hourly" as const,
        price: "150.00",
        defaultRate: "150.00",
        duration: 60,
        tags: ["consulting", "hourly"],
        metadata: { specialization: "tax" },
      };

      const result = await caller.create(input);
      tracker.services?.push(result.service.id);

      expect(result.success).toBe(true);

      // Verify optional fields
      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, result.service.id));

      expect(dbService.defaultRate).toBe("150.00");
      expect(dbService.duration).toBe(60);
      expect(dbService.tags).toEqual(["consulting", "hourly"]);
      expect(dbService.metadata).toEqual({ specialization: "tax" });
    });

    it("should create service with isActive defaulting to true", async () => {
      const input = {
        code: `SVC-${Date.now()}`,
        name: "Default Active Service",
        category: "bookkeeping",
        description: "Test service",
        pricingModel: "fixed" as const,
        priceType: "fixed" as const,
        price: "300.00",
      };

      const result = await caller.create(input);
      tracker.services?.push(result.service.id);

      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, result.service.id));

      expect(dbService.isActive).toBe(true);
    });

    it("should create activity log for service creation", async () => {
      const input = {
        code: `SVC-${Date.now()}`,
        name: "Activity Log Test Service",
        category: "tax_planning",
        description: "Test service",
        pricingModel: "fixed" as const,
        priceType: "fixed" as const,
        price: "750.00",
      };

      const result = await caller.create(input);
      tracker.services?.push(result.service.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.service.id),
            eq(activityLogs.entityType, "service"),
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Activity Log Test Service");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        name: "Incomplete Service",
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list services with tenant isolation", async () => {
      // Create test services
      const service1 = await createTestService(ctx.authContext.tenantId, {
        name: "Service Alpha",
        category: "bookkeeping",
      });
      const service2 = await createTestService(ctx.authContext.tenantId, {
        name: "Service Beta",
        category: "tax_planning",
      });
      tracker.services?.push(service1.id, service2.id);

      const result = await caller.list({});

      expect(result.services).toBeDefined();
      expect(result.services.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const service of result.services) {
        expect(service.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test services are in the list
      const serviceIds = result.services.map(
        (s: typeof result.services[0]) => s.id,
      );
      expect(serviceIds).toContain(service1.id);
      expect(serviceIds).toContain(service2.id);
    });

    it("should filter services by search term (name)", async () => {
      const service1 = await createTestService(ctx.authContext.tenantId, {
        name: "Searchable Bookkeeping Service",
      });
      const service2 = await createTestService(ctx.authContext.tenantId, {
        name: "Tax Filing Service",
      });
      tracker.services?.push(service1.id, service2.id);

      const result = await caller.list({ search: "Searchable" });

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      const hasSearchableService = result.services.some(
        (s: typeof result.services[0]) => s.name.includes("Searchable"),
      );
      expect(hasSearchableService).toBe(true);
    });

    it("should filter services by search term (code)", async () => {
      const uniqueCode = `SEARCH-${Date.now()}`;
      const service1 = await createTestService(ctx.authContext.tenantId, {
        code: uniqueCode,
        name: "Code Search Test",
      });
      tracker.services?.push(service1.id);

      const result = await caller.list({ search: uniqueCode });

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      const hasSearchableService = result.services.some(
        (s: typeof result.services[0]) => s.code === uniqueCode,
      );
      expect(hasSearchableService).toBe(true);
    });

    it("should filter services by category", async () => {
      const service1 = await createTestService(ctx.authContext.tenantId, {
        category: "bookkeeping",
      });
      const service2 = await createTestService(ctx.authContext.tenantId, {
        category: "tax_planning",
      });
      tracker.services?.push(service1.id, service2.id);

      const result = await caller.list({ category: "bookkeeping" });

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      // All returned services should be bookkeeping category
      for (const service of result.services) {
        expect(service.category).toBe("bookkeeping");
      }
    });

    it("should filter services by isActive status", async () => {
      const service1 = await createTestService(ctx.authContext.tenantId, {
        name: "Active Service",
        isActive: true,
      });
      const service2 = await createTestService(ctx.authContext.tenantId, {
        name: "Inactive Service",
        isActive: false,
      });
      tracker.services?.push(service1.id, service2.id);

      const result = await caller.list({ isActive: true });

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      // All returned services should be active
      for (const service of result.services) {
        expect(service.isActive).toBe(true);
      }
    });

    it("should handle multiple filters simultaneously", async () => {
      const service1 = await createTestService(ctx.authContext.tenantId, {
        name: "Multi Filter Service",
        category: "management",
        isActive: true,
      });
      tracker.services?.push(service1.id);

      const result = await caller.list({
        search: "Multi Filter",
        category: "management",
        isActive: true,
      });

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      const foundService = result.services.find(
        (s: typeof result.services[0]) => s.id === service1.id,
      );
      expect(foundService).toBeDefined();
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve service by ID", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "GetById Test Service",
        price: "999.99",
      });
      tracker.services?.push(service.id);

      const result = await caller.getById(service.id);

      expect(result.id).toBe(service.id);
      expect(result.name).toBe("GetById Test Service");
      expect(result.price).toBe("999.99");
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Service not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create service for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const serviceA = await createTestService(tenantAId, {
        name: "Tenant A Service",
      });
      tracker.services?.push(serviceA.id);

      // Create context for tenant B (our test tenant)
      // Attempt to access tenant A's service from tenant B
      await expect(caller.getById(serviceA.id)).rejects.toThrow(
        "Service not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(serviceA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update service and persist changes", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Original Service Name",
        price: "500.00",
        category: "bookkeeping",
      });
      tracker.services?.push(service.id);

      const result = await caller.update({
        id: service.id,
        data: {
          name: "Updated Service Name",
          price: "750.00",
          category: "tax_planning",
        },
      });

      expect(result.service.name).toBe("Updated Service Name");
      expect(result.service.price).toBe("750.00");
      expect(result.service.category).toBe("tax_planning");

      // Verify database persistence
      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, service.id));

      expect(dbService.name).toBe("Updated Service Name");
      expect(dbService.price).toBe("750.00");
      expect(dbService.category).toBe("tax_planning");
    });

    it("should create activity log for update", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Update Log Test",
      });
      tracker.services?.push(service.id);

      await caller.update({
        id: service.id,
        data: { name: "Updated for Log Test" },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, service.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Updated for Log Test");
    });

    it("should throw NOT_FOUND for non-existent service", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { name: "Should Fail" },
        }),
      ).rejects.toThrow("Service not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create service for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const serviceA = await createTestService(tenantAId);
      tracker.services?.push(serviceA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: serviceA.id,
          data: { name: "Malicious Update" },
        }),
      ).rejects.toThrow("Service not found");
    });

    it("should allow partial updates", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Partial Update Test",
        price: "500.00",
        category: "bookkeeping",
        description: "Original description",
      });
      tracker.services?.push(service.id);

      // Update only price
      await caller.update({
        id: service.id,
        data: { price: "999.99" },
      });

      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, service.id));

      // Price should be updated
      expect(dbService.price).toBe("999.99");
      // Other fields should remain unchanged
      expect(dbService.name).toBe("Partial Update Test");
      expect(dbService.category).toBe("bookkeeping");
      expect(dbService.description).toBe("Original description");
    });

    it("should update service pricing type and rate", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Pricing Update Test",
        priceType: "fixed",
        price: "500.00",
      });
      tracker.services?.push(service.id);

      await caller.update({
        id: service.id,
        data: {
          priceType: "hourly",
          price: "150.00",
          defaultRate: "150.00",
          duration: 60,
        },
      });

      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, service.id));

      expect(dbService.priceType).toBe("hourly");
      expect(dbService.price).toBe("150.00");
      expect(dbService.defaultRate).toBe("150.00");
      expect(dbService.duration).toBe(60);
    });
  });

  describe("delete (Integration)", () => {
    it("should soft delete service (mark as inactive)", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Delete Test Service",
        isActive: true,
      });
      tracker.services?.push(service.id);

      const result = await caller.delete(service.id);

      expect(result.success).toBe(true);

      // Verify service is marked inactive (soft delete)
      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, service.id));

      expect(dbService).toBeDefined();
      expect(dbService.isActive).toBe(false);
    });

    it("should create activity log for deactivation", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Delete Log Test",
      });
      tracker.services?.push(service.id);

      await caller.delete(service.id);

      // Verify activity log (action is "deactivated", not "deleted")
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, service.id),
            eq(activityLogs.action, "deactivated"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Delete Log Test");
    });

    it("should throw NOT_FOUND for non-existent service", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Service not found",
      );
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create service for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const serviceA = await createTestService(tenantAId);
      tracker.services?.push(serviceA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(serviceA.id)).rejects.toThrow(
        "Service not found",
      );

      // Verify service still exists and is still active
      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceA.id));

      expect(dbService).toBeDefined();
      expect(dbService.isActive).toBe(true);
    });

    it("should allow re-deactivation of already inactive service", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Already Inactive Service",
        isActive: false,
      });
      tracker.services?.push(service.id);

      const result = await caller.delete(service.id);

      expect(result.success).toBe(true);

      const [dbService] = await db
        .select()
        .from(services)
        .where(eq(services.id, service.id));

      expect(dbService.isActive).toBe(false);
    });
  });

  describe("Service Pricing Logic (Integration)", () => {
    it("should handle fixed pricing type", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Fixed Price Service",
        priceType: "fixed",
        price: "1000.00",
      });
      tracker.services?.push(service.id);

      const result = await caller.getById(service.id);

      expect(result.priceType).toBe("fixed");
      expect(result.price).toBe("1000.00");
    });

    it("should handle hourly pricing type with rate and duration", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Hourly Service",
        priceType: "hourly",
        price: "150.00",
        defaultRate: "150.00",
        duration: 120, // 2 hours
      });
      tracker.services?.push(service.id);

      const result = await caller.getById(service.id);

      expect(result.priceType).toBe("hourly");
      expect(result.price).toBe("150.00");
      expect(result.defaultRate).toBe("150.00");
      expect(result.duration).toBe(120);
    });

    it("should handle service with tags for categorization", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Tagged Service",
        tags: ["premium", "monthly", "bookkeeping"],
      });
      tracker.services?.push(service.id);

      const result = await caller.getById(service.id);

      expect(result.tags).toEqual(["premium", "monthly", "bookkeeping"]);
    });

    it("should handle service with custom metadata", async () => {
      const service = await createTestService(ctx.authContext.tenantId, {
        name: "Metadata Service",
        metadata: {
          billingCycle: "monthly",
          minimumEngagement: 3,
          specialization: "tax",
        },
      });
      tracker.services?.push(service.id);

      const result = await caller.getById(service.id);

      expect(result.metadata).toEqual({
        billingCycle: "monthly",
        minimumEngagement: 3,
        specialization: "tax",
      });
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(servicesRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
    });

    it("should have 5 procedures total", () => {
      const procedures = Object.keys(servicesRouter._def.procedures);
      expect(procedures).toHaveLength(5);
    });
  });
});
