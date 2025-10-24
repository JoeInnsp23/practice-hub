/**
 * TransactionData Router Tests
 *
 * Tests for the transactionData tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { transactionDataRouter } from "@/app/server/routers/transactionData";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

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
    returning: vi.fn(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  },
}));

// Mock Xero client
vi.mock("@/lib/xero/client", () => ({
  getValidAccessToken: vi.fn(),
  fetchBankTransactions: vi.fn(),
  calculateMonthlyTransactions: vi.fn(),
}));

describe("app/server/routers/transactionData.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof transactionDataRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    assertAuthContext(ctx);
    caller = createCaller(transactionDataRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getByClient", () => {
    it("should accept valid client ID", async () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      // Should not throw on valid UUID
      await expect(caller.getByClient(clientId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.getByClient(123 as any)).rejects.toThrow();
    });
  });

  describe("estimate", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        clientId: "test-id",
        // Missing required fields
      };

      await expect(caller.estimate(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid estimate input", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
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

      await expect(caller.estimate(invalidInput as any)).rejects.toThrow();
    });

    it("should validate industry is a string", async () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: 123, // Should be string
        vatRegistered: true,
      };

      await expect(caller.estimate(invalidInput as any)).rejects.toThrow();
    });

    it("should validate vatRegistered is a boolean", async () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: "standard",
        vatRegistered: "yes", // Should be boolean
      };

      await expect(caller.estimate(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("fetchFromXero", () => {
    it("should accept valid client ID", async () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.fetchFromXero(clientId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.fetchFromXero({ invalid: "object" } as any),
      ).rejects.toThrow();
    });

    describe("Implementation", () => {
      beforeEach(async () => {
        // Import db mock to set up return values
        const { db } = await import("@/lib/db");

        // Mock client query to return a valid client
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: "test-client-1",
                  name: "Test Client",
                  tenantId: "test-tenant",
                },
              ]),
            }),
          }),
        } as any);

        // Mock insert for transaction data storage AND activity logs
        // The router calls insert twice: once for clientTransactionData, once for activityLogs
        vi.mocked(db.insert).mockImplementation((_table: any) => {
          // Create a promise-like object that can handle both cases
          const valuesResult = {
            // For transaction data: has onConflictDoUpdate
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: "test-transaction-data",
                  clientId: "test-client-1",
                  tenantId: "test-tenant",
                  monthlyTransactions: 2,
                  dataSource: "xero",
                },
              ]),
            }),
            // For activity logs: directly awaitable (no onConflictDoUpdate)
            then: (resolve: any) => Promise.resolve(undefined).then(resolve),
            catch: (reject: any) => Promise.resolve(undefined).catch(reject),
          };

          return {
            values: vi.fn().mockReturnValue(valuesResult),
          } as any;
        });
      });

      it("should fetch transactions from Xero and calculate monthly average", async () => {
        const clientId = "test-client-1";

        // Import the mocked functions
        const {
          getValidAccessToken,
          fetchBankTransactions,
          calculateMonthlyTransactions,
        } = await import("@/lib/xero/client");

        // Mock getValidAccessToken to return a valid token
        vi.mocked(getValidAccessToken).mockResolvedValue({
          accessToken: "test-access-token",
          xeroTenantId: "test-tenant-id",
        });

        // Mock fetchBankTransactions to return test transactions
        vi.mocked(fetchBankTransactions).mockResolvedValue([
          {
            date: "2025-01-15",
            type: "SPEND",
            total: 100,
            description: "Test 1",
            reference: "REF1",
          },
          {
            date: "2025-01-20",
            type: "SPEND",
            total: 200,
            description: "Test 2",
            reference: "REF2",
          },
          {
            date: "2025-02-10",
            type: "RECEIVE",
            total: 150,
            description: "Test 3",
            reference: "REF3",
          },
        ]);

        // Mock calculateMonthlyTransactions to return the average
        vi.mocked(calculateMonthlyTransactions).mockReturnValue(2); // 3 transactions / 2 months = 1.5, rounded to 2

        const result = await caller.fetchFromXero(clientId);

        // Verify the mocks were called correctly
        expect(getValidAccessToken).toHaveBeenCalledWith(clientId);
        expect(fetchBankTransactions).toHaveBeenCalledWith(
          "test-access-token",
          "test-tenant-id",
          expect.any(Date),
          expect.any(Date),
        );
        expect(calculateMonthlyTransactions).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ total: 100 }),
            expect.objectContaining({ total: 200 }),
            expect.objectContaining({ total: 150 }),
          ]),
        );

        // Verify the result matches router's return structure
        expect(result).toMatchObject({
          success: true,
          transactionData: expect.objectContaining({
            monthlyTransactions: 2,
            dataSource: "xero",
          }),
          transactionCount: 3,
          dateRange: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
          }),
        });
      });

      it("should handle errors when Xero connection not found", async () => {
        const clientId = "test-client-no-connection";

        const { getValidAccessToken } = await import("@/lib/xero/client");

        // Mock getValidAccessToken to throw error
        vi.mocked(getValidAccessToken).mockRejectedValue(
          new Error("No Xero connection found for this client"),
        );

        // Router catches errors with "No Xero connection" and throws NOT_FOUND
        await expect(caller.fetchFromXero(clientId)).rejects.toMatchObject({
          code: "NOT_FOUND",
          message: expect.stringContaining("No Xero connection found"),
        });
      });

      it("should handle errors when token refresh fails", async () => {
        const clientId = "test-client-token-fail";

        const { getValidAccessToken } = await import("@/lib/xero/client");

        // Mock getValidAccessToken to throw token refresh error
        vi.mocked(getValidAccessToken).mockRejectedValue(
          new Error("Xero token refresh failed: Refresh token expired"),
        );

        // Router catches and wraps the error with INTERNAL_SERVER_ERROR
        await expect(caller.fetchFromXero(clientId)).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: expect.stringContaining("Xero token refresh failed"),
        });
      });

      it("should handle errors when fetching transactions fails", async () => {
        const clientId = "test-client-fetch-fail";

        const { getValidAccessToken, fetchBankTransactions } = await import(
          "@/lib/xero/client"
        );

        vi.mocked(getValidAccessToken).mockResolvedValue({
          accessToken: "test-access-token",
          xeroTenantId: "test-tenant-id",
        });

        // Mock fetchBankTransactions to throw error
        vi.mocked(fetchBankTransactions).mockRejectedValue(
          new Error("Failed to fetch Xero bank transactions: Unauthorized"),
        );

        // Router catches and wraps the error with INTERNAL_SERVER_ERROR
        await expect(caller.fetchFromXero(clientId)).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: expect.stringContaining("Failed to fetch"),
        });
      });

      it("should handle empty transaction list", async () => {
        const clientId = "test-client-no-transactions";

        const {
          getValidAccessToken,
          fetchBankTransactions,
          calculateMonthlyTransactions,
        } = await import("@/lib/xero/client");

        vi.mocked(getValidAccessToken).mockResolvedValue({
          accessToken: "test-access-token",
          xeroTenantId: "test-tenant-id",
        });

        // Mock empty transactions
        vi.mocked(fetchBankTransactions).mockResolvedValue([]);
        vi.mocked(calculateMonthlyTransactions).mockReturnValue(0);

        const result = await caller.fetchFromXero(clientId);

        // Verify structure (monthlyTransactions comes from DB mock, not calculation)
        expect(result).toMatchObject({
          success: true,
          transactionData: expect.objectContaining({
            dataSource: "xero",
            monthlyTransactions: expect.any(Number),
          }),
          transactionCount: 0,
          dateRange: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
          }),
        });

        // Verify calculateMonthlyTransactions was called with empty array
        expect(calculateMonthlyTransactions).toHaveBeenCalledWith([]);
      });

      it("should respect tenant isolation (uses correct client's connection)", async () => {
        const clientId = "test-client-tenant-1";

        const {
          getValidAccessToken,
          fetchBankTransactions,
          calculateMonthlyTransactions,
        } = await import("@/lib/xero/client");

        vi.mocked(getValidAccessToken).mockResolvedValue({
          accessToken: "tenant-1-token",
          xeroTenantId: "tenant-1-xero-id",
        });

        vi.mocked(fetchBankTransactions).mockResolvedValue([
          {
            date: "2025-01-15",
            type: "SPEND",
            total: 100,
            description: "Test",
            reference: "REF",
          },
        ]);

        vi.mocked(calculateMonthlyTransactions).mockReturnValue(1);

        await caller.fetchFromXero(clientId);

        // Verify getValidAccessToken was called with the correct client ID
        // This ensures tenant isolation - each client's Xero connection is separate
        expect(getValidAccessToken).toHaveBeenCalledWith(clientId);
        expect(getValidAccessToken).toHaveBeenCalledTimes(1);

        // Verify fetchBankTransactions used the correct tenant's token
        expect(fetchBankTransactions).toHaveBeenCalledWith(
          "tenant-1-token",
          "tenant-1-xero-id",
          expect.any(Date),
          expect.any(Date),
        );
      });
    });
  });

  describe("upsert", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing clientId and monthlyTransactions
        dataSource: "manual",
      };

      await expect(caller.upsert(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid upsert input", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
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

      await expect(caller.upsert(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid transaction data ID", async () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.delete(id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.delete(123 as any)).rejects.toThrow();
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
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.getHistory(clientId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.getHistory(null as any)).rejects.toThrow();
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
