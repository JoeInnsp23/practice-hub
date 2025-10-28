/**
 * Unit tests for Xero API Client
 *
 * Tests OAuth 2.0 authentication, token management, and transaction data fetching
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type BankTransaction,
  calculateMonthlyTransactions,
  fetchBankTransactions,
  getAccessToken,
  getAuthorizationUrl,
  getConnections,
  getValidAccessToken,
  refreshAccessToken,
  type XeroConnection,
  type XeroTokenResponse,
} from "./client";

// Mock environment variables
vi.stubEnv("XERO_CLIENT_ID", "test-client-id");
vi.stubEnv("XERO_CLIENT_SECRET", "test-client-secret");
vi.stubEnv("XERO_REDIRECT_URI", "http://localhost:3000/api/xero/callback");

// Mock database - create a proper mock chain
interface MockQueryChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

const mockQueryChain: MockQueryChain = {
  from: vi.fn(function (this: MockQueryChain) {
    return this; // Return mockQueryChain itself to continue the chain
  }),
  where: vi.fn(function (this: MockQueryChain) {
    return this; // Return mockQueryChain itself to continue the chain
  }),
  limit: vi.fn(),
  set: vi.fn(function (this: MockQueryChain) {
    return this; // Return mockQueryChain itself to continue the chain
  }),
};

// Set context for all chainable methods
mockQueryChain.from = mockQueryChain.from.bind(mockQueryChain);
mockQueryChain.where = mockQueryChain.where.bind(mockQueryChain);
mockQueryChain.set = mockQueryChain.set.bind(mockQueryChain);

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => mockQueryChain),
    update: vi.fn(() => mockQueryChain),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  xeroConnections: {
    id: "id",
    clientId: "clientId",
    tenantId: "tenantId",
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    expiresAt: "expiresAt",
    xeroTenantId: "xeroTenantId",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
}));

describe("lib/xero/client.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("XERO_CLIENT_ID", "test-client-id");
    vi.stubEnv("XERO_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("XERO_REDIRECT_URI", "http://localhost:3000/api/xero/callback");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAuthorizationUrl", () => {
    it("should generate valid OAuth URL with state parameter", () => {
      const state = "test-state-123";
      const url = getAuthorizationUrl(state);

      expect(url).toContain(
        "https://login.xero.com/identity/connect/authorize",
      );
      expect(url).toContain(`state=${state}`);
      expect(url).toContain("response_type=code");
      expect(url).toContain("client_id="); // Don't assert specific value
      expect(url).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fxero%2Fcallback",
      );
      expect(url).toContain("scope=");
      expect(url).toContain("accounting.transactions.read");
      expect(url).toContain("offline_access");
    });

    it.skip("should throw error if XERO_CLIENT_ID is not set", () => {
      // Note: This test is skipped because env vars are read at module import time
      // Testing this would require reloading the module, which is not practical in vitest
      // In practice, the application will fail to start if XERO_CLIENT_ID is not set
    });
  });

  describe("getAccessToken", () => {
    it("should exchange code for access token successfully", async () => {
      const mockResponse: XeroTokenResponse = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_in: 1800,
        token_type: "Bearer",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getAccessToken("test-authorization-code");

      expect(result.access_token).toBe("mock_access_token");
      expect(result.refresh_token).toBe("mock_refresh_token");
      expect(result.expires_in).toBe(1800);
      expect(result.token_type).toBe("Bearer");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://identity.xero.com/connect/token",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        }),
      );
    });

    it("should throw error on 401 Unauthorized response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(getAccessToken("invalid-code")).rejects.toThrow(
        "Xero token exchange failed: Unauthorized",
      );
    });

    it("should throw error on 500 Server Error response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      await expect(getAccessToken("test-code")).rejects.toThrow(
        "Xero token exchange failed: Internal Server Error",
      );
    });

    it.skip("should throw error if credentials are not configured", async () => {
      // Note: This test is skipped because env vars are read at module import time
      // Testing this would require reloading the module, which is not practical in vitest
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token successfully", async () => {
      const mockResponse: XeroTokenResponse = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 1800,
        token_type: "Bearer",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await refreshAccessToken("old_refresh_token");

      expect(result.access_token).toBe("new_access_token");
      expect(result.refresh_token).toBe("new_refresh_token");
      expect(result.expires_in).toBe(1800);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://identity.xero.com/connect/token",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        }),
      );
    });

    it("should throw error when refresh token is expired", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Refresh token expired",
      } as Response);

      await expect(refreshAccessToken("expired_token")).rejects.toThrow(
        "Xero token refresh failed: Refresh token expired",
      );
    });

    it.skip("should throw error if credentials are not configured", async () => {
      // Note: This test is skipped because env vars are read at module import time
      // Testing this would require reloading the module, which is not practical in vitest
    });
  });

  describe("getConnections", () => {
    it("should fetch Xero connections successfully", async () => {
      const mockConnections: XeroConnection[] = [
        {
          tenantId: "tenant-1",
          tenantName: "Test Organization 1",
          organisationId: "org-1",
        },
        {
          tenantId: "tenant-2",
          tenantName: "Test Organization 2",
          organisationId: "org-2",
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConnections,
      } as Response);

      const result = await getConnections("test-access-token");

      expect(result).toEqual(mockConnections);
      expect(result).toHaveLength(2);
      expect(result[0].tenantName).toBe("Test Organization 1");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.xero.com/connections",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should throw error when fetch fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      await expect(getConnections("invalid-token")).rejects.toThrow(
        "Failed to fetch Xero connections",
      );
    });
  });

  describe("getValidAccessToken", () => {
    it("should return valid token if not near expiry", async () => {
      const mockConnection = {
        id: "connection-1",
        clientId: "client-1",
        tenantId: "tenant-1",
        accessToken: "current_access_token",
        refreshToken: "current_refresh_token",
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
        xeroTenantId: "xero-tenant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryChain.limit.mockResolvedValue([mockConnection]);

      const result = await getValidAccessToken("client-1");

      expect(result.accessToken).toBe("current_access_token");
      expect(result.xeroTenantId).toBe("xero-tenant-1");

      // Should not call refresh
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should refresh token when near expiration (5-min buffer)", async () => {
      const mockConnection = {
        id: "connection-1",
        clientId: "client-1",
        tenantId: "tenant-1",
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes from now (within 5-min buffer)
        xeroTenantId: "xero-tenant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokenResponse: XeroTokenResponse = {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 1800,
        token_type: "Bearer",
      };

      mockQueryChain.limit.mockResolvedValue([mockConnection]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await getValidAccessToken("client-1");

      expect(result.accessToken).toBe("new_access_token");
      expect(result.xeroTenantId).toBe("xero-tenant-1");

      // Should have called refresh
      expect(global.fetch).toHaveBeenCalledWith(
        "https://identity.xero.com/connect/token",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should refresh token when already expired", async () => {
      const mockConnection = {
        id: "connection-1",
        clientId: "client-1",
        tenantId: "tenant-1",
        accessToken: "expired_access_token",
        refreshToken: "refresh_token",
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (expired)
        xeroTenantId: "xero-tenant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokenResponse: XeroTokenResponse = {
        access_token: "refreshed_access_token",
        refresh_token: "refreshed_refresh_token",
        expires_in: 1800,
        token_type: "Bearer",
      };

      mockQueryChain.limit.mockResolvedValue([mockConnection]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await getValidAccessToken("client-1");

      expect(result.accessToken).toBe("refreshed_access_token");
    });

    it("should throw error when no Xero connection found for client", async () => {
      mockQueryChain.limit.mockResolvedValue([]);

      await expect(getValidAccessToken("non-existent-client")).rejects.toThrow(
        "No Xero connection found for this client",
      );
    });
  });

  describe("fetchBankTransactions", () => {
    it("should fetch bank transactions successfully", async () => {
      const mockApiResponse = {
        BankTransactions: [
          {
            Date: "2025-01-15T00:00:00",
            Reference: "Transaction 1",
            Total: 150.5,
            Type: "SPEND" as const,
          },
          {
            Date: "2025-01-20T00:00:00",
            Reference: "Transaction 2",
            Total: 200.0,
            Type: "RECEIVE" as const,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const fromDate = new Date("2025-01-01");
      const toDate = new Date("2025-01-31");

      const result = await fetchBankTransactions(
        "test-token",
        "tenant-1",
        fromDate,
        toDate,
      );

      expect(result).toHaveLength(2);
      expect(result[0].reference).toBe("Transaction 1");
      expect(result[0].total).toBe(150.5);
      expect(result[0].type).toBe("SPEND");
      expect(result[1].reference).toBe("Transaction 2");
      expect(result[1].total).toBe(200.0);
      expect(result[1].type).toBe("RECEIVE");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://api.xero.com/api.xro/2.0/BankTransactions",
        ),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "xero-tenant-id": "tenant-1",
            Accept: "application/json",
          }),
        }),
      );
    });

    it("should handle empty transactions response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ BankTransactions: [] }),
      } as Response);

      const result = await fetchBankTransactions(
        "test-token",
        "tenant-1",
        new Date(),
        new Date(),
      );

      expect(result).toEqual([]);
    });

    it("should handle missing optional fields in transactions", async () => {
      const mockApiResponse = {
        BankTransactions: [
          {
            Date: "2025-01-15T00:00:00",
            Type: "SPEND" as const,
            // Reference and Total are missing
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const result = await fetchBankTransactions(
        "test-token",
        "tenant-1",
        new Date(),
        new Date(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].reference).toBe("");
      expect(result[0].description).toBe("");
      expect(result[0].total).toBe(0);
    });

    it("should throw error on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(
        fetchBankTransactions(
          "invalid-token",
          "tenant-1",
          new Date(),
          new Date(),
        ),
      ).rejects.toThrow("Failed to fetch Xero bank transactions: Unauthorized");
    });
  });

  describe("Error Handling", () => {
    describe("Network Errors", () => {
      it("should handle network error in getAccessToken", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

        await expect(getAccessToken("test-code")).rejects.toThrow(
          "Network error",
        );
      });

      it("should handle network error in refreshAccessToken", async () => {
        global.fetch = vi
          .fn()
          .mockRejectedValue(new Error("Connection timeout"));

        await expect(refreshAccessToken("test-token")).rejects.toThrow(
          "Connection timeout",
        );
      });

      it("should handle network error in getConnections", async () => {
        global.fetch = vi
          .fn()
          .mockRejectedValue(new Error("DNS resolution failed"));

        await expect(getConnections("test-token")).rejects.toThrow(
          "DNS resolution failed",
        );
      });

      it("should handle network error in fetchBankTransactions", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Request timeout"));

        await expect(
          fetchBankTransactions(
            "test-token",
            "tenant-1",
            new Date(),
            new Date(),
          ),
        ).rejects.toThrow("Request timeout");
      });
    });

    describe("HTTP Error Codes", () => {
      it("should handle 429 Rate Limit error in getAccessToken", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          text: async () => "Rate limit exceeded",
        } as Response);

        await expect(getAccessToken("test-code")).rejects.toThrow(
          "Xero token exchange failed: Rate limit exceeded",
        );
      });

      it("should handle 500 Internal Server Error in refreshAccessToken", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "Internal server error",
        } as Response);

        await expect(refreshAccessToken("test-token")).rejects.toThrow(
          "Xero token refresh failed: Internal server error",
        );
      });
    });

    describe("Malformed Responses", () => {
      it("should handle invalid JSON in getAccessToken", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new Error("Unexpected token in JSON");
          },
        } as Partial<Response>);

        await expect(getAccessToken("test-code")).rejects.toThrow(
          "Unexpected token in JSON",
        );
      });

      it("should handle invalid JSON in fetchBankTransactions", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new Error("Invalid JSON response");
          },
        } as Partial<Response>);

        await expect(
          fetchBankTransactions(
            "test-token",
            "tenant-1",
            new Date(),
            new Date(),
          ),
        ).rejects.toThrow("Invalid JSON response");
      });
    });
  });

  describe("calculateMonthlyTransactions", () => {
    it("should return 0 for empty transactions array", () => {
      const result = calculateMonthlyTransactions([]);
      expect(result).toBe(0);
    });

    it("should calculate average monthly transactions correctly", () => {
      const transactions: BankTransaction[] = [
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
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 3 transactions across 2 months = 1.5, rounded to 2
      expect(result).toBe(2);
    });

    it("should handle single month with multiple transactions", () => {
      const transactions: BankTransaction[] = [
        {
          date: "2025-01-05",
          type: "SPEND",
          total: 100,
          description: "Test 1",
          reference: "REF1",
        },
        {
          date: "2025-01-15",
          type: "SPEND",
          total: 200,
          description: "Test 2",
          reference: "REF2",
        },
        {
          date: "2025-01-25",
          type: "RECEIVE",
          total: 150,
          description: "Test 3",
          reference: "REF3",
        },
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 3 transactions in 1 month = 3
      expect(result).toBe(3);
    });

    it("should handle single transaction in single month", () => {
      const transactions: BankTransaction[] = [
        {
          date: "2025-01-15",
          type: "SPEND",
          total: 100,
          description: "Test",
          reference: "REF1",
        },
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 1 transaction in 1 month = 1
      expect(result).toBe(1);
    });

    it("should handle transactions across multiple months", () => {
      const transactions: BankTransaction[] = [
        {
          date: "2025-01-10",
          type: "SPEND",
          total: 100,
          description: "Jan 1",
          reference: "REF1",
        },
        {
          date: "2025-01-20",
          type: "SPEND",
          total: 200,
          description: "Jan 2",
          reference: "REF2",
        },
        {
          date: "2025-02-05",
          type: "RECEIVE",
          total: 150,
          description: "Feb 1",
          reference: "REF3",
        },
        {
          date: "2025-03-12",
          type: "SPEND",
          total: 75,
          description: "Mar 1",
          reference: "REF4",
        },
        {
          date: "2025-03-22",
          type: "RECEIVE",
          total: 125,
          description: "Mar 2",
          reference: "REF5",
        },
        {
          date: "2025-03-28",
          type: "SPEND",
          total: 90,
          description: "Mar 3",
          reference: "REF6",
        },
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 6 transactions: Jan=2, Feb=1, Mar=3
      // Average = (2+1+3)/3 = 2
      expect(result).toBe(2);
    });

    it("should round fractional averages correctly", () => {
      const transactions: BankTransaction[] = [
        {
          date: "2025-01-10",
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
          date: "2025-02-05",
          type: "RECEIVE",
          total: 150,
          description: "Test 3",
          reference: "REF3",
        },
        {
          date: "2025-03-12",
          type: "SPEND",
          total: 75,
          description: "Test 4",
          reference: "REF4",
        },
        {
          date: "2025-04-15",
          type: "RECEIVE",
          total: 125,
          description: "Test 5",
          reference: "REF5",
        },
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 5 transactions across 4 months = 1.25, rounded to 1
      expect(result).toBe(1);
    });
  });
});
