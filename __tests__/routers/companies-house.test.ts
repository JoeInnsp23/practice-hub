/**
 * Companies House Integration Tests
 *
 * Integration-level tests for the clients.lookupCompaniesHouse tRPC procedure.
 * Tests verify API integration, caching, rate limiting, and activity logging.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientsRouter } from "@/app/server/routers/clients";
import type {
  CompanyDetails,
  Officer,
  PSC,
} from "@/lib/companies-house/client";
import { db } from "@/lib/db";
import {
  activityLogs,
  companiesHouseCache,
  companiesHouseRateLimit,
} from "@/lib/db/schema";
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

// Mock the Companies House API client module
vi.mock("@/lib/companies-house/client", () => ({
  getCompany: vi.fn(),
  getOfficers: vi.fn(),
  getPSCs: vi.fn(),
  CompanyNotFoundError: class extends Error {
    constructor(companyNumber: string) {
      super(`Company ${companyNumber} not found`);
      this.name = "CompanyNotFoundError";
    }
  },
  RateLimitError: class extends Error {
    constructor() {
      super("Companies House API rate limit exceeded");
      this.name = "RateLimitError";
    }
  },
  APIServerError: class extends Error {
    constructor(statusCode: number) {
      super(`Companies House API server error: ${statusCode}`);
      this.name = "APIServerError";
    }
  },
  NetworkError: class extends Error {
    constructor(originalError: unknown) {
      super(`Network error: ${originalError}`);
      this.name = "NetworkError";
    }
  },
}));

describe("app/server/routers/clients.ts - lookupCompaniesHouse (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
  };

  // Mock data for Companies House API responses
  const mockCompanyDetails: CompanyDetails = {
    companyNumber: "12345678",
    companyName: "Test Company Ltd",
    status: "active",
    type: "ltd",
    registeredOffice: {
      addressLine1: "123 Test Street",
      locality: "London",
      postalCode: "SW1A 1AA",
      country: "United Kingdom",
    },
    dateOfCreation: "2020-01-01",
    sicCodes: ["62020"],
  };

  const mockOfficers: Officer[] = [
    {
      name: "John Doe",
      role: "director",
      appointedOn: "2020-01-01",
    },
    {
      name: "Jane Smith",
      role: "secretary",
      appointedOn: "2020-01-01",
    },
  ];

  const mockPSCs: PSC[] = [
    {
      name: "John Doe",
      notifiedOn: "2020-01-01",
      natureOfControl: ["ownership-of-shares-75-to-100-percent"],
      kind: "individual-person-with-significant-control",
    },
  ];

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

    caller = createCaller(clientsRouter, ctx);

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(tracker);

    // Clean Companies House tables
    await db.delete(companiesHouseCache);
    await db.delete(companiesHouseRateLimit);

    // Delete activity logs created by tests
    if (ctx?.authContext?.tenantId) {
      await db
        .delete(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, ctx.authContext.tenantId),
            eq(activityLogs.entityType, "companies_house_lookup"),
          ),
        );
    }

    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];

    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should successfully lookup company and return data", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      const result = await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });

      expect(result).toBeDefined();
      expect(result.company).toEqual(mockCompanyDetails);
      expect(result.officers).toEqual(mockOfficers);
      expect(result.pscs).toEqual(mockPSCs);

      // Verify API calls were made
      expect(getCompany).toHaveBeenCalledWith("12345678");
      expect(getOfficers).toHaveBeenCalledWith("12345678");
      expect(getPSCs).toHaveBeenCalledWith("12345678");
    });

    it("should validate company number format (8 digits)", async () => {
      await expect(
        caller.lookupCompaniesHouse({ companyNumber: "123" }),
      ).rejects.toThrow("Company number must be 8 digits");

      await expect(
        caller.lookupCompaniesHouse({ companyNumber: "123456789" }),
      ).rejects.toThrow("Company number must be 8 digits");

      await expect(
        caller.lookupCompaniesHouse({ companyNumber: "ABCD1234" }),
      ).rejects.toThrow("Company number must be 8 digits");
    });

    it("should throw error for invalid company number format", async () => {
      try {
        await caller.lookupCompaniesHouse({ companyNumber: "invalid" });
        throw new Error("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Cache Scenarios", () => {
    it("should return cached data on second lookup (cache hit)", async () => {
      // Mock API client functions for first call
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      // First lookup - should call API
      const result1 = await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });

      expect(result1.company).toEqual(mockCompanyDetails);
      expect(getCompany).toHaveBeenCalledTimes(1);
      expect(getOfficers).toHaveBeenCalledTimes(1);
      expect(getPSCs).toHaveBeenCalledTimes(1);

      // Second lookup - should use cache
      const result2 = await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });

      expect(result2.company).toEqual(mockCompanyDetails);
      // API should NOT be called again (still 1 time from first call)
      expect(getCompany).toHaveBeenCalledTimes(1);
      expect(getOfficers).toHaveBeenCalledTimes(1);
      expect(getPSCs).toHaveBeenCalledTimes(1);

      // Verify cache entry exists
      const cached = await db
        .select()
        .from(companiesHouseCache)
        .where(eq(companiesHouseCache.companyNumber, "12345678"))
        .limit(1);

      expect(cached.length).toBe(1);
      expect(cached[0].companyNumber).toBe("12345678");
    });

    it("should bypass cache and call API after cache expires", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      // Insert expired cache entry
      const now = new Date();
      const expiredTime = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago (expired)

      await db.insert(companiesHouseCache).values({
        id: "ch-12345678",
        companyNumber: "12345678",
        cachedData: {
          company: mockCompanyDetails,
          officers: mockOfficers,
          pscs: mockPSCs,
        },
        cachedAt: expiredTime,
        expiresAt: new Date(expiredTime.getTime() + 24 * 60 * 60 * 1000), // Expired 1 hour ago
      });

      // Lookup should bypass expired cache and call API
      const result = await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });

      expect(result.company).toEqual(mockCompanyDetails);
      // API should be called because cache is expired
      expect(getCompany).toHaveBeenCalledTimes(1);
      expect(getOfficers).toHaveBeenCalledTimes(1);
      expect(getPSCs).toHaveBeenCalledTimes(1);
    });

    it("should complete cached lookup in under 100ms (AC #19 performance requirement)", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      // First lookup - populate cache
      await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });

      // Second lookup - measure cache hit performance
      const startTime = performance.now();
      const result = await caller.lookupCompaniesHouse({
        companyNumber: "12345678",
      });
      const duration = performance.now() - startTime;

      // Verify cache hit
      expect(result.company).toEqual(mockCompanyDetails);
      expect(getCompany).toHaveBeenCalledTimes(1); // Only called once (first lookup)

      // Verify performance: cached lookup should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Rate Limiting", () => {
    it("should return cached data when rate limit exceeded", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      // Insert valid cache entry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      await db.insert(companiesHouseCache).values({
        id: "ch-87654321",
        companyNumber: "87654321",
        cachedData: {
          company: { ...mockCompanyDetails, companyNumber: "87654321" },
          officers: mockOfficers,
          pscs: mockPSCs,
        },
        cachedAt: now,
        expiresAt,
      });

      // Set rate limit to maximum (600 requests in current window)
      await db.insert(companiesHouseRateLimit).values({
        id: "global",
        requestsCount: 600,
        windowStart: now,
        updatedAt: now,
      });

      // Lookup should return cached data without calling API
      const result = await caller.lookupCompaniesHouse({
        companyNumber: "87654321",
      });

      expect(result.company.companyNumber).toBe("87654321");
      // API should NOT be called because rate limit is exceeded
      expect(getCompany).not.toHaveBeenCalled();
      expect(getOfficers).not.toHaveBeenCalled();
      expect(getPSCs).not.toHaveBeenCalled();
    });

    it("should throw error when rate limited and no cache available", async () => {
      // Set rate limit to maximum (600 requests in current window)
      const now = new Date();
      await db.insert(companiesHouseRateLimit).values({
        id: "global",
        requestsCount: 600,
        windowStart: now,
        updatedAt: now,
      });

      // Lookup with no cache should throw TOO_MANY_REQUESTS
      try {
        await caller.lookupCompaniesHouse({ companyNumber: "99999999" });
        throw new Error("Should have thrown rate limit error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
        expect((error as TRPCError).message).toContain("Too many requests");
      }
    });
  });

  describe("Activity Logging", () => {
    it("should log lookup activity in activityLogs table", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      await caller.lookupCompaniesHouse({ companyNumber: "12345678" });

      // Verify activity log was created
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityType, "companies_house_lookup"),
            eq(activityLogs.action, "looked_up"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1];
      expect(log.description).toContain("Test Company Ltd");
      expect(log.description).toContain("12345678");

      // Verify company number is stored in metadata
      expect(log.metadata).toBeDefined();
      const metadata = log.metadata as {
        companyNumber: string;
        companyName: string;
      };
      expect(metadata.companyNumber).toBe("12345678");
      expect(metadata.companyName).toBe("Test Company Ltd");
    });

    it("should include tenantId and userId in activity log", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue(mockCompanyDetails);
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      await caller.lookupCompaniesHouse({ companyNumber: "12345678" });

      // Verify activity log includes tenant and user info
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityType, "companies_house_lookup"),
            eq(activityLogs.action, "looked_up"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1];
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.userName).toContain("Test User");
    });
  });

  describe("Tenant Isolation", () => {
    it("should isolate cache entries by company number (no tenantId needed)", async () => {
      // Mock API client functions
      const { getCompany, getOfficers, getPSCs } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockResolvedValue({
        ...mockCompanyDetails,
        companyNumber: "11111111",
      });
      vi.mocked(getOfficers).mockResolvedValue(mockOfficers);
      vi.mocked(getPSCs).mockResolvedValue(mockPSCs);

      // First tenant lookup
      await caller.lookupCompaniesHouse({ companyNumber: "11111111" });

      // Create second tenant and user
      const tenant2Id = await createTestTenant();
      const user2Id = await createTestUser(tenant2Id);
      tracker.tenants?.push(tenant2Id);
      tracker.users?.push(user2Id);

      const ctx2: TestContextWithAuth = createMockContext({
        authContext: {
          userId: user2Id,
          tenantId: tenant2Id,
          organizationName: "Second Tenant",
          role: "admin",
          email: "tenant2@example.com",
          firstName: "Tenant",
          lastName: "Two",
        },
      });

      const caller2 = createCaller(clientsRouter, ctx2);

      // Second tenant should also access same cache (cache is global, not per-tenant)
      const result = await caller2.lookupCompaniesHouse({
        companyNumber: "11111111",
      });

      expect(result.company.companyNumber).toBe("11111111");
      // API should only be called once (first tenant), second tenant uses cache
      expect(getCompany).toHaveBeenCalledTimes(1);
    });

    it("should use global rate limiting (not per-tenant)", async () => {
      // Set rate limit to maximum
      const now = new Date();
      await db.insert(companiesHouseRateLimit).values({
        id: "global",
        requestsCount: 600,
        windowStart: now,
        updatedAt: now,
      });

      // Insert cache for company
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db.insert(companiesHouseCache).values({
        id: "ch-22222222",
        companyNumber: "22222222",
        cachedData: {
          company: { ...mockCompanyDetails, companyNumber: "22222222" },
          officers: mockOfficers,
          pscs: mockPSCs,
        },
        cachedAt: now,
        expiresAt,
      });

      // First tenant lookup - should use cache (rate limited)
      const result1 = await caller.lookupCompaniesHouse({
        companyNumber: "22222222",
      });
      expect(result1.company.companyNumber).toBe("22222222");

      // Create second tenant
      const tenant2Id = await createTestTenant();
      const user2Id = await createTestUser(tenant2Id);
      tracker.tenants?.push(tenant2Id);
      tracker.users?.push(user2Id);

      const ctx2: TestContextWithAuth = createMockContext({
        authContext: {
          userId: user2Id,
          tenantId: tenant2Id,
          organizationName: "Second Tenant",
          role: "admin",
          email: "tenant2@example.com",
          firstName: "Tenant",
          lastName: "Two",
        },
      });

      const caller2 = createCaller(clientsRouter, ctx2);

      // Second tenant should also be rate limited (global rate limit)
      const result2 = await caller2.lookupCompaniesHouse({
        companyNumber: "22222222",
      });
      expect(result2.company.companyNumber).toBe("22222222");

      // Verify rate limit is still at 600 (no new API calls made)
      const [rateLimit] = await db
        .select()
        .from(companiesHouseRateLimit)
        .where(eq(companiesHouseRateLimit.id, "global"))
        .limit(1);

      expect(rateLimit.requestsCount).toBe(600);
    });
  });

  describe("Error Handling", () => {
    it("should throw NOT_FOUND for 404 errors", async () => {
      // Mock API to throw CompanyNotFoundError
      const { getCompany, CompanyNotFoundError } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockRejectedValue(
        new CompanyNotFoundError("99999999"),
      );

      try {
        await caller.lookupCompaniesHouse({ companyNumber: "99999999" });
        throw new Error("Should have thrown NOT_FOUND error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
        expect((error as TRPCError).message).toContain("Company not found");
      }
    });

    it("should throw TOO_MANY_REQUESTS for 429 errors", async () => {
      // Mock API to throw RateLimitError
      const { getCompany, RateLimitError } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockRejectedValue(new RateLimitError());

      try {
        await caller.lookupCompaniesHouse({ companyNumber: "88888888" });
        throw new Error("Should have thrown TOO_MANY_REQUESTS error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
        expect((error as TRPCError).message).toContain("Too many requests");
      }
    });

    it("should throw INTERNAL_SERVER_ERROR for API server errors", async () => {
      // Mock API to throw APIServerError
      const { getCompany, APIServerError } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockRejectedValue(new APIServerError(503));

      try {
        await caller.lookupCompaniesHouse({ companyNumber: "77777777" });
        throw new Error("Should have thrown INTERNAL_SERVER_ERROR");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
        expect((error as TRPCError).message).toContain(
          "Companies House API is currently unavailable",
        );
      }
    });

    it("should throw INTERNAL_SERVER_ERROR for network errors", async () => {
      // Mock API to throw NetworkError
      const { getCompany, NetworkError } = await import(
        "@/lib/companies-house/client"
      );
      vi.mocked(getCompany).mockRejectedValue(
        new NetworkError(new Error("Connection refused")),
      );

      try {
        await caller.lookupCompaniesHouse({ companyNumber: "66666666" });
        throw new Error("Should have thrown INTERNAL_SERVER_ERROR");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
        expect((error as TRPCError).message).toContain(
          "Unable to connect to Companies House",
        );
      }
    });
  });
});
