/**
 * Reports Router Tests
 *
 * Tests for the reports tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportsRouter } from "@/app/server/routers/reports";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock cache
vi.mock("@/lib/cache", () => ({
  reportsDashboardKpiCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock reports queries
vi.mock("@/lib/db/queries/reports-queries", () => ({
  getReportsDashboardKpis: vi.fn().mockResolvedValue({
    totalRevenue: 250000,
    collectedRevenue: 200000,
    outstandingRevenue: 50000,
    activeClients: 45,
    newClients30d: 8,
    inProgressTasks: 25,
    overdueTasks: 5,
    totalHours30d: 320,
    billableHours30d: 256,
    upcomingCompliance30d: 12,
    overdueCompliance: 3,
  }),
  getMonthlyRevenue: vi.fn().mockResolvedValue([
    {
      month: new Date("2024-01-01"),
      invoiced: 20000,
      collected: 18000,
      invoiceCount: 15,
      uniqueClients: 10,
    },
    {
      month: new Date("2024-02-01"),
      invoiced: 22000,
      collected: 20000,
      invoiceCount: 18,
      uniqueClients: 12,
    },
    {
      month: new Date("2024-03-01"),
      invoiced: 25000,
      collected: 23000,
      invoiceCount: 20,
      uniqueClients: 14,
    },
  ]),
  getClientRevenue: vi.fn().mockResolvedValue([
    {
      clientId: "client-1",
      clientName: "Acme Corp",
      clientCode: "ACM001",
      totalInvoiced: 50000,
      totalPaid: 45000,
      outstanding: 5000,
      invoiceCount: 12,
    },
    {
      clientId: "client-2",
      clientName: "Tech Solutions Ltd",
      clientCode: "TSL002",
      totalInvoiced: 35000,
      totalPaid: 35000,
      outstanding: 0,
      invoiceCount: 8,
    },
  ]),
  getServicePerformance: vi.fn().mockResolvedValue([
    {
      serviceId: "service-1",
      serviceName: "Bookkeeping",
      serviceCode: "BK001",
      serviceCategory: "Accounting",
      totalRevenue: 80000,
      activeClients: 25,
      totalClients: 30,
    },
    {
      serviceId: "service-2",
      serviceName: "Tax Returns",
      serviceCode: "TX002",
      serviceCategory: "Tax",
      totalRevenue: 120000,
      activeClients: 35,
      totalClients: 40,
    },
  ]),
  calculateDateRange: vi.fn((_period: string) => ({
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
  })),
}));

describe("app/server/routers/reports.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof reportsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(reportsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getDashboardKpis", () => {
    it("should have no required input", () => {
      const procedure = reportsRouter._def.procedures.getDashboardKpis;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });

    it("should return KPIs with calculated metrics", async () => {
      const result = await caller.getDashboardKpis();

      expect(result).toMatchObject({
        totalRevenue: 250000,
        collectedRevenue: 200000,
        outstandingRevenue: 50000,
        activeClients: 45,
        activeTasks: 25,
        overdueTasks: 5,
      });

      // Check calculated metrics
      expect(result.utilizationRate).toBeGreaterThan(0);
      expect(result.collectionRate).toBeGreaterThan(0);
    });

    it("should handle null KPI data gracefully", async () => {
      const { getReportsDashboardKpis } = await import(
        "@/lib/db/queries/reports-queries"
      );
      vi.mocked(getReportsDashboardKpis).mockResolvedValueOnce({
        totalRevenue: null,
        collectedRevenue: null,
        outstandingRevenue: null,
        activeClients: null,
        newClients30d: null,
        pendingTasks: null,
        inProgressTasks: null,
        completedTasks30d: null,
        overdueTasks: null,
        totalHours30d: null,
        billableHours30d: null,
        upcomingCompliance30d: null,
        overdueCompliance: null,
        tenantId: "test-tenant-id",
      });

      const result = await caller.getDashboardKpis();

      expect(result).toMatchObject({
        totalRevenue: 0,
        activeClients: 0,
        overdueTasks: 0,
      });
    });
  });

  describe("getMonthlyRevenue", () => {
    it("should accept default parameters", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept months parameter", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          months: 6,
        });
      }).not.toThrow();
    });

    it("should accept period parameter", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          period: "this_year",
        });
      }).not.toThrow();
    });

    it("should accept custom date range", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          period: "custom",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-12-31T23:59:59Z",
        });
      }).not.toThrow();
    });

    it("should validate months min value", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          months: 0,
        });
      }).toThrow();
    });

    it("should validate months max value", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getMonthlyRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          months: 30,
        });
      }).toThrow();
    });

    it("should return monthly revenue data", async () => {
      const result = await caller.getMonthlyRevenue({ months: 12 });

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        invoiced: 20000,
        collected: 18000,
        invoiceCount: 15,
        uniqueClients: 10,
      });
    });
  });

  describe("getClientRevenue", () => {
    it("should accept default parameters", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getClientRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept limit parameter", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getClientRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          limit: 20,
        });
      }).not.toThrow();
    });

    it("should validate limit min value", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getClientRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          limit: 0,
        });
      }).toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getClientRevenue._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          limit: 100,
        });
      }).toThrow();
    });

    it("should return client revenue data", async () => {
      const result = await caller.getClientRevenue({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        clientName: "Acme Corp",
        totalInvoiced: 50000,
        totalPaid: 45000,
        outstanding: 5000,
      });
    });
  });

  describe("getServicePerformance", () => {
    it("should accept empty input", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getServicePerformance._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept period parameter", () => {
      expect(() => {
        (
          reportsRouter._def.procedures.getServicePerformance._def
            .inputs[0] as unknown as { parse: (input: unknown) => unknown }
        )?.parse({
          period: "this_year",
        });
      }).not.toThrow();
    });

    it("should return service performance data", async () => {
      const result = await caller.getServicePerformance();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        serviceName: "Bookkeeping",
        serviceCategory: "Accounting",
        totalRevenue: 80000,
        activeClients: 25,
      });
      expect(result[1]).toMatchObject({
        serviceName: "Tax Returns",
        totalRevenue: 120000,
      });
    });
  });

  describe("Multi-tenant isolation", () => {
    it("should filter KPIs by tenantId", async () => {
      const { getReportsDashboardKpis } = await import(
        "@/lib/db/queries/reports-queries"
      );

      await caller.getDashboardKpis();

      expect(getReportsDashboardKpis).toHaveBeenCalledWith("test-tenant-id");
    });

    it("should filter monthly revenue by tenantId", async () => {
      const { getMonthlyRevenue } = await import(
        "@/lib/db/queries/reports-queries"
      );

      await caller.getMonthlyRevenue({ months: 12 });

      expect(getMonthlyRevenue).toHaveBeenCalledWith(
        "test-tenant-id",
        expect.any(Object),
      );
    });

    it("should filter client revenue by tenantId", async () => {
      const { getClientRevenue } = await import(
        "@/lib/db/queries/reports-queries"
      );

      await caller.getClientRevenue({ limit: 10 });

      expect(getClientRevenue).toHaveBeenCalledWith(
        "test-tenant-id",
        expect.any(Object),
      );
    });

    it("should filter service performance by tenantId", async () => {
      const { getServicePerformance } = await import(
        "@/lib/db/queries/reports-queries"
      );

      await caller.getServicePerformance();

      expect(getServicePerformance).toHaveBeenCalledWith(
        "test-tenant-id",
        expect.any(Object),
      );
    });
  });
});
