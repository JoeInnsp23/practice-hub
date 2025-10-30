/**
 * TransactionData Router Tests
 *
 * Tests for the transactionData tRPC router
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transactionDataRouter } from "@/app/server/routers/transactionData";
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

// Mock Xero client
vi.mock("@/lib/xero/client", () => ({
  getValidAccessToken: vi.fn(),
  fetchBankTransactions: vi.fn(),
  calculateMonthlyTransactions: vi.fn(),
}));

describe("app/server/routers/transactionData.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof transactionDataRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    transactionData: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(transactionDataRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.transactionData = [];
  });

  describe("getByClient", () => {
    it("should accept valid client ID", async () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      // Should not throw on valid UUID
      await expect(caller.getByClient(clientId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.getByClient(123 as unknown as string),
      ).rejects.toThrow();
    });
  });

  describe("estimate", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        clientId: "test-id",
        // Missing required fields
      };

      await expect(
        caller.estimate(
          invalidInput as unknown as Parameters<typeof caller.estimate>[0],
        ),
      ).rejects.toThrow();
    });

    it("should accept valid estimate input", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(transactionDataRouter, ctx);

      const validInput = {
        clientId: client.id,
        turnover: "150k-249k",
        industry: "standard",
        vatRegistered: true,
        saveEstimate: false,
      };

      await expect(caller.estimate(validInput)).resolves.not.toThrow();
    });

    it("should validate turnover is a string", async () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: 150000, // Should be string
        industry: "standard",
        vatRegistered: true,
      };

      await expect(
        caller.estimate(
          invalidInput as unknown as Parameters<typeof caller.estimate>[0],
        ),
      ).rejects.toThrow();
    });

    it("should validate industry is a string", async () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: 123, // Should be string
        vatRegistered: true,
      };

      await expect(
        caller.estimate(
          invalidInput as unknown as Parameters<typeof caller.estimate>[0],
        ),
      ).rejects.toThrow();
    });

    it("should validate vatRegistered is a boolean", async () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: "standard",
        vatRegistered: "yes", // Should be boolean
      };

      await expect(
        caller.estimate(
          invalidInput as unknown as Parameters<typeof caller.estimate>[0],
        ),
      ).rejects.toThrow();
    });
  });

  describe("fetchFromXero", () => {
    it("should accept valid client ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(transactionDataRouter, ctx);

      // Mock Xero to throw NOT_FOUND (no connection) - this tests input validation
      const { getValidAccessToken } = await import("@/lib/xero/client");

      vi.mocked(getValidAccessToken).mockRejectedValue(
        new Error("No Xero connection found for this client"),
      );

      // Should get NOT_FOUND error (not input validation error)
      await expect(caller.fetchFromXero(client.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: expect.stringContaining("No Xero connection found"),
      });
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.fetchFromXero({ invalid: "object" } as unknown as string),
      ).rejects.toThrow();
    });
  });

  describe("upsert", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing clientId and monthlyTransactions
        dataSource: "manual",
      };

      await expect(
        caller.upsert(
          invalidInput as unknown as Parameters<typeof caller.upsert>[0],
        ),
      ).rejects.toThrow();
    });

    it("should accept valid upsert input", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(transactionDataRouter, ctx);

      const validInput = {
        clientId: client.id,
        monthlyTransactions: 150,
        dataSource: "manual" as const,
      };

      await expect(caller.upsert(validInput)).resolves.not.toThrow();
    });

    it("should validate monthlyTransactions is a number", async () => {
      const invalidInput = {
        clientId: "test-id",
        monthlyTransactions: "150", // Should be number
        dataSource: "manual",
      };

      await expect(
        caller.upsert(
          invalidInput as unknown as Parameters<typeof caller.upsert>[0],
        ),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid transaction data ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(transactionDataRouter, ctx);

      // Create transaction data first
      const result = await caller.upsert({
        clientId: client.id,
        monthlyTransactions: 100,
        dataSource: "manual",
      });

      // Delete it
      await expect(
        caller.delete(result.transactionData.id),
      ).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.delete(123 as unknown as string)).rejects.toThrow();
    });
  });

  describe("getAllWithData", () => {
    it("should have no required input", () => {
      // getAllWithData should accept no input
      const procedure = transactionDataRouter._def.procedures.getAllWithData;

      // Check that inputs array is empty or undefined
      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getHistory", () => {
    it("should accept valid client ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(transactionDataRouter, ctx);

      await expect(caller.getHistory(client.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.getHistory(null as unknown as string),
      ).rejects.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(transactionDataRouter._def.procedures);

      expect(procedures).toContain("getByClient");
      expect(procedures).toContain("getHistory");
      expect(procedures).toContain("upsert");
      expect(procedures).toContain("fetchFromXero");
      expect(procedures).toContain("estimate");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getAllWithData");
    });

    it("should have 7 procedures total", () => {
      const procedures = Object.keys(transactionDataRouter._def.procedures);
      expect(procedures).toHaveLength(7);
    });
  });
});
