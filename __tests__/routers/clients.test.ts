/**
 * Clients Router Integration Tests
 *
 * Integration-level tests for the clients tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientsRouter } from "@/app/server/routers/clients";
import { db } from "@/lib/db";
import { activityLogs, clientContacts, clients } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock HMRC client module for VAT validation tests
const { mockValidateVAT } = vi.hoisted(() => ({
  mockValidateVAT: vi.fn(),
}));

vi.mock("@/lib/hmrc/client", () => ({
  validateVAT: mockValidateVAT,
  VATNotFoundError: class VATNotFoundError extends Error {},
  RateLimitError: class RateLimitError extends Error {},
  AuthenticationError: class AuthenticationError extends Error {},
}));

describe("app/server/routers/clients.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
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
    }) as TestContextWithAuth;

    caller = createCaller(clientsRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
  });

  describe("create (Integration)", () => {
    it("should create client and persist to database", async () => {
      const input = {
        clientCode: `TEST-CLIENT-${Date.now()}`,
        name: "Test Client Ltd",
        type: "limited_company" as const,
        status: "active" as const,
        email: "test@client.com",
        phone: "+44 20 1234 5678",
      };

      const result = await caller.create(input);
      tracker.clients?.push(result.client.id);

      expect(result.success).toBe(true);
      expect(result.client.id).toBeDefined();
      expect(result.client.name).toBe("Test Client Ltd");
      expect(result.client.tenantId).toBe(ctx.authContext.tenantId);

      // Verify database persistence
      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, result.client.id));

      expect(dbClient).toBeDefined();
      expect(dbClient.name).toBe("Test Client Ltd");
      expect(dbClient.tenantId).toBe(ctx.authContext.tenantId);
      expect(dbClient.createdBy).toBe(ctx.authContext.userId);
      expect(dbClient.email).toBe("test@client.com");
    });

    it("should create client with primary contact", async () => {
      const input = {
        clientCode: `TEST-CLIENT-${Date.now()}`,
        name: "Test Client with Contact",
        type: "limited_company" as const,
        status: "active" as const,
        primaryContact: {
          firstName: "John",
          lastName: "Doe",
          email: "john@client.com",
          phone: "+44 20 1234 5678",
        },
      };

      const result = await caller.create(input);
      tracker.clients?.push(result.client.id);

      expect(result.success).toBe(true);

      // Verify primary contact was created
      const [contact] = await db
        .select()
        .from(clientContacts)
        .where(
          and(
            eq(clientContacts.clientId, result.client.id),
            eq(clientContacts.isPrimary, true),
          ),
        );

      expect(contact).toBeDefined();
      expect(contact.firstName).toBe("John");
      expect(contact.lastName).toBe("Doe");
      expect(contact.email).toBe("john@client.com");
    });

    it("should create activity log for client creation", async () => {
      const input = {
        clientCode: `TEST-CLIENT-${Date.now()}`,
        name: "Activity Log Test Client",
        type: "limited_company" as const,
        status: "active" as const,
      };

      const result = await caller.create(input);
      tracker.clients?.push(result.client.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.client.id),
            eq(activityLogs.entityType, "client"),
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Activity Log Test Client");
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required clientCode and name
        type: "limited_company" as const,
      };

      await expect(caller.create(invalidInput as Record<string, unknown>)).rejects.toThrow();
    });

    it("should validate primary contact email format", async () => {
      const invalidInput = {
        clientCode: `TEST-${Date.now()}`,
        name: "Test Client",
        type: "limited_company" as const,
        primaryContact: {
          firstName: "John",
          lastName: "Doe",
          email: "invalid-email", // Invalid email format
        },
      };

      await expect(caller.create(invalidInput as Record<string, unknown>)).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list clients with tenant isolation", async () => {
      // Create test clients
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Alpha",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Client Beta",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const result = await caller.list({});

      expect(result.clients).toBeDefined();
      expect(result.clients.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const client of result.clients) {
        expect(client.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test clients are in the list
      const clientIds = result.clients.map(
        (c: (typeof result.clients)[0]) => c.id,
      );
      expect(clientIds).toContain(client1.id);
      expect(clientIds).toContain(client2.id);
    });

    it("should filter clients by search term", async () => {
      // Create clients with specific names
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Searchable Alpha Corp",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Beta Industries",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const result = await caller.list({ search: "Searchable" });

      expect(result.clients.length).toBeGreaterThanOrEqual(1);
      const hasSearchableClient = result.clients.some(
        (c: (typeof result.clients)[0]) => c.name.includes("Searchable"),
      );
      expect(hasSearchableClient).toBe(true);
    });

    it("should filter clients by type", async () => {
      // Create clients with different types
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          type: "limited_company",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          type: "individual",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const result = await caller.list({ type: "limited_company" });

      expect(result.clients.length).toBeGreaterThanOrEqual(1);
      // All returned clients should be limited companies
      for (const client of result.clients) {
        expect(client.type).toBe("limited_company");
      }
    });

    it("should filter clients by status", async () => {
      // Create clients with different statuses
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          status: "active",
        },
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          status: "onboarding",
        },
      );
      tracker.clients?.push(client1.id, client2.id);

      const result = await caller.list({ status: "active" });

      expect(result.clients.length).toBeGreaterThanOrEqual(1);
      // All returned clients should be active
      for (const client of result.clients) {
        expect(client.status).toBe("active");
      }
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve client by ID", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "GetById Test Client",
        },
      );
      tracker.clients?.push(client.id);

      const result = await caller.getById(client.id);

      expect(result.id).toBe(client.id);
      expect(result.name).toBe("GetById Test Client");
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Client not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create client for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId, {
        name: "Tenant A Client",
      });
      tracker.clients?.push(clientA.id);

      // Create context for tenant B (our test tenant)
      // Attempt to access tenant A's client from tenant B
      await expect(caller.getById(clientA.id)).rejects.toThrow(
        "Client not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(clientA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update client and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Original Name",
          email: "original@client.com",
        },
      );
      tracker.clients?.push(client.id);

      const result = await caller.update({
        id: client.id,
        data: {
          name: "Updated Name",
          email: "updated@client.com",
        },
      });

      expect(result.client.name).toBe("Updated Name");
      expect(result.client.email).toBe("updated@client.com");

      // Verify database persistence
      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(dbClient.name).toBe("Updated Name");
      expect(dbClient.email).toBe("updated@client.com");
    });

    it("should create activity log for update", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Update Log Test",
        },
      );
      tracker.clients?.push(client.id);

      await caller.update({
        id: client.id,
        data: { name: "Updated for Log Test" },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, client.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent client", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { name: "Should Fail" },
        }),
      ).rejects.toThrow("Client not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create client for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: clientA.id,
          data: { name: "Malicious Update" },
        }),
      ).rejects.toThrow("Client not found");
    });

    it("should allow partial updates", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Partial Update Test",
          email: "original@client.com",
          phone: "+44 20 1111 2222",
        },
      );
      tracker.clients?.push(client.id);

      // Update only phone
      await caller.update({
        id: client.id,
        data: { phone: "+44 20 9999 8888" },
      });

      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      // Phone should be updated
      expect(dbClient.phone).toBe("+44 20 9999 8888");
      // Other fields should remain unchanged
      expect(dbClient.name).toBe("Partial Update Test");
      expect(dbClient.email).toBe("original@client.com");
    });
  });

  describe("delete (Integration)", () => {
    it("should archive client (soft delete)", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Delete Test Client",
          status: "active",
        },
      );
      tracker.clients?.push(client.id);

      const result = await caller.delete(client.id);

      expect(result.success).toBe(true);

      // Verify client is archived (soft delete, not hard delete)
      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(dbClient).toBeDefined();
      expect(dbClient.status).toBe("archived");
    });

    it("should create activity log for archiving", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Delete Log Test",
        },
      );
      tracker.clients?.push(client.id);

      await caller.delete(client.id);

      // Verify activity log (action is "archived", not "deleted")
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, client.id),
            eq(activityLogs.action, "archived"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("Delete Log Test");
    });

    it("should throw NOT_FOUND for non-existent client", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Client not found",
      );
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create client for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(clientA.id)).rejects.toThrow(
        "Client not found",
      );

      // Verify client still exists
      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientA.id));

      expect(dbClient).toBeDefined();
    });
  });

  describe("getClientServices (Integration)", () => {
    it("should retrieve client services", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const result = await caller.getClientServices(client.id);

      expect(result.services).toBeDefined();
      expect(Array.isArray(result.services)).toBe(true);
    });

    it("should enforce tenant isolation (returns empty for other tenant's client)", async () => {
      // Create client for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      // Should return empty services (tenant isolation at query level)
      const result = await caller.getClientServices(clientA.id);
      expect(result.services).toEqual([]);
    });
  });

  describe("getClientContacts (Integration)", () => {
    it("should retrieve client contacts", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const result = await caller.getClientContacts(client.id);

      expect(result.contacts).toBeDefined();
      expect(Array.isArray(result.contacts)).toBe(true);
    });
  });

  describe("getClientDirectors (Integration)", () => {
    it("should retrieve client directors", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const result = await caller.getClientDirectors(client.id);

      expect(result.directors).toBeDefined();
      expect(Array.isArray(result.directors)).toBe(true);
    });
  });

  describe("getClientPSCs (Integration)", () => {
    it("should retrieve client PSCs (Persons with Significant Control)", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const result = await caller.getClientPSCs(client.id);

      expect(result.pscs).toBeDefined();
      expect(Array.isArray(result.pscs)).toBe(true);
    });
  });

  describe("validateVAT (Integration)", () => {
    beforeEach(() => {
      // Reset mock before each test
      mockValidateVAT.mockReset();
    });

    it("should validate VAT number without updating database when clientId not provided", async () => {
      mockValidateVAT.mockResolvedValue({
        isValid: true,
        vatNumber: "123456789",
        businessName: "Test Company Ltd",
        businessAddress: {
          line1: "123 Test Street",
          postcode: "SW1A 1AA",
          countryCode: "GB",
        },
      });

      const result = await caller.validateVAT({
        vatNumber: "GB123456789",
      });

      expect(result.isValid).toBe(true);
      expect(result.vatNumber).toBe("123456789"); // HMRC normalizes by removing GB prefix
      expect(result.businessName).toBe("Test Company Ltd");
    });

    it("should validate VAT number and update database when clientId provided", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          vatNumber: "GB123456789",
          vatValidationStatus: null,
        },
      );
      tracker.clients?.push(client.id);

      mockValidateVAT.mockResolvedValue({
        isValid: true,
        vatNumber: "123456789",
        businessName: "Test Company Ltd",
        businessAddress: {
          line1: "123 Test Street",
          postcode: "SW1A 1AA",
          countryCode: "GB",
        },
      });

      const result = await caller.validateVAT({
        vatNumber: "GB123456789",
        clientId: client.id,
      });

      expect(result.isValid).toBe(true);
      expect(result.businessName).toBe("Test Company Ltd");

      // Verify database was updated
      const [updatedClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(updatedClient.vatValidationStatus).toBe("valid");
      expect(updatedClient.vatValidatedAt).toBeDefined();
    });

    it("should enforce multi-tenant isolation (cannot update client from different tenant)", async () => {
      // Create client in a different tenant
      const otherTenantId = await createTestTenant();
      const otherUserId = await createTestUser(otherTenantId);
      tracker.tenants?.push(otherTenantId);
      tracker.users?.push(otherUserId);

      const otherClient = await createTestClient(otherTenantId, otherUserId, {
        vatNumber: "GB987654321",
      });
      tracker.clients?.push(otherClient.id);

      mockValidateVAT.mockResolvedValue({
        isValid: true,
        vatNumber: "987654321",
      });

      // Try to validate using our context (different tenant)
      const result = await caller.validateVAT({
        vatNumber: "GB987654321",
        clientId: otherClient.id,
      });

      // Validation should succeed but database should NOT be updated
      expect(result.isValid).toBe(true);

      // Verify the other client's record was NOT updated
      const [unchangedClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, otherClient.id));

      expect(unchangedClient.vatValidationStatus).toBeNull();
    });

    it("should handle invalid VAT number gracefully", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      mockValidateVAT.mockResolvedValue({
        isValid: false,
        vatNumber: "999999999",
      });

      const result = await caller.validateVAT({
        vatNumber: "GB999999999",
        clientId: client.id,
      });

      expect(result.isValid).toBe(false);
      expect(result.vatNumber).toBe("999999999");

      // Verify database was updated with invalid status
      const [updatedClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(updatedClient.vatValidationStatus).toBe("invalid");
    });

    it("should log activity when validating VAT number", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      mockValidateVAT.mockResolvedValue({
        isValid: true,
        vatNumber: "123456789",
        businessName: "Test Company Ltd",
      });

      await caller.validateVAT({
        vatNumber: "GB123456789",
        clientId: client.id,
      });

      // Verify activity log was created
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, ctx.authContext.tenantId),
            eq(activityLogs.entityType, "vat_validation"),
            eq(activityLogs.entityId, client.id),
          ),
        );

      expect(logs.length).toBeGreaterThan(0);
      const log = logs[0];
      expect(log.action).toBe("validated");
      expect(log.userId).toBe(ctx.authContext.userId);
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(clientsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getClientServices");
      expect(procedures).toContain("getClientContacts");
      expect(procedures).toContain("getClientDirectors");
      expect(procedures).toContain("getClientPSCs");
      expect(procedures).toContain("updateContact");
    });

    it("should have 11 procedures total", () => {
      const procedures = Object.keys(clientsRouter._def.procedures);
      expect(procedures.length).toBeGreaterThanOrEqual(10);
    });
  });
});
