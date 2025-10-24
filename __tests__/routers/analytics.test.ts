/**
 * Analytics Router Tests
 *
 * Tests for the analytics tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { analyticsRouter } from "@/app/server/routers/analytics";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/analytics.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof analyticsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    assertAuthContext(ctx);
    caller = createCaller(analyticsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getLeadStats", () => {
    it("should accept empty input", async () => {
      await expect(caller.getLeadStats({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getLeadStats({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept startDate only", async () => {
      await expect(
        caller.getLeadStats({
          startDate: "2025-01-01",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept endDate only", async () => {
      await expect(
        caller.getLeadStats({
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getProposalStats", () => {
    it("should accept empty input", async () => {
      await expect(caller.getProposalStats({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getProposalStats({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getConversionMetrics", () => {
    it("should accept empty input", async () => {
      await expect(caller.getConversionMetrics({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getConversionMetrics({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getPipelineMetrics", () => {
    it("should accept empty input", async () => {
      await expect(caller.getPipelineMetrics({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getPipelineMetrics({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getModelComparison", () => {
    it("should accept empty input", async () => {
      await expect(caller.getModelComparison({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getModelComparison({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getServicePopularity", () => {
    it("should accept empty input", async () => {
      await expect(caller.getServicePopularity({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getServicePopularity({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept limit parameter", async () => {
      await expect(
        caller.getServicePopularity({
          limit: 25,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept all parameters combined", async () => {
      await expect(
        caller.getServicePopularity({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
          limit: 20,
        }),
      ).resolves.not.toThrow();
    });

    it("should reject limit below min value", async () => {
      await expect(
        caller.getServicePopularity({
          limit: 0, // Below minimum of 1
        }),
      ).rejects.toThrow();
    });

    it("should reject limit above max value", async () => {
      await expect(
        caller.getServicePopularity({
          limit: 51, // Exceeds max of 50
        }),
      ).rejects.toThrow();
    });
  });

  describe("getDiscountAnalysis", () => {
    it("should accept empty input", async () => {
      await expect(caller.getDiscountAnalysis({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getDiscountAnalysis({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getTaskMetrics", () => {
    it("should have no required input", () => {
      const procedure = analyticsRouter._def.procedures.getTaskMetrics;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getComplexityDistribution", () => {
    it("should accept empty input", async () => {
      await expect(
        caller.getComplexityDistribution({}),
      ).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getComplexityDistribution({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getWinLossStats", () => {
    it("should accept empty input", async () => {
      await expect(caller.getWinLossStats({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getWinLossStats({
          from: "2025-01-01",
          to: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept assignedToId filter", async () => {
      await expect(
        caller.getWinLossStats({
          assignedToId: "user-123",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept clientId filter", async () => {
      await expect(
        caller.getWinLossStats({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept all filters combined", async () => {
      await expect(
        caller.getWinLossStats({
          from: "2025-01-01",
          to: "2025-01-31",
          assignedToId: "user-123",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getPipelineValueByStage", () => {
    it("should accept empty input", async () => {
      await expect(caller.getPipelineValueByStage({})).resolves.not.toThrow();
    });

    it("should accept asOf date", async () => {
      await expect(
        caller.getPipelineValueByStage({
          asOf: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getAverageDealSize", () => {
    it("should accept empty input", async () => {
      await expect(caller.getAverageDealSize({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getAverageDealSize({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getSalesCycleDuration", () => {
    it("should accept empty input", async () => {
      await expect(caller.getSalesCycleDuration({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getSalesCycleDuration({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getMonthlyTrend", () => {
    it("should accept empty input", async () => {
      await expect(caller.getMonthlyTrend({})).resolves.not.toThrow();
    });

    it("should accept months parameter", async () => {
      await expect(
        caller.getMonthlyTrend({
          months: 6,
        }),
      ).resolves.not.toThrow();
    });

    it("should reject months below min value", async () => {
      await expect(
        caller.getMonthlyTrend({
          months: 0, // Below minimum of 1
        }),
      ).rejects.toThrow();
    });

    it("should reject months above max value", async () => {
      await expect(
        caller.getMonthlyTrend({
          months: 25, // Exceeds max of 24
        }),
      ).rejects.toThrow();
    });
  });

  describe("getLossReasons", () => {
    it("should accept empty input", async () => {
      await expect(caller.getLossReasons({})).resolves.not.toThrow();
    });

    it("should accept date range", async () => {
      await expect(
        caller.getLossReasons({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(analyticsRouter._def.procedures);

      // Existing procedures
      expect(procedures).toContain("getLeadStats");
      expect(procedures).toContain("getProposalStats");
      expect(procedures).toContain("getConversionMetrics");
      expect(procedures).toContain("getPipelineMetrics");
      expect(procedures).toContain("getModelComparison");
      expect(procedures).toContain("getServicePopularity");
      expect(procedures).toContain("getDiscountAnalysis");
      expect(procedures).toContain("getTaskMetrics");
      expect(procedures).toContain("getComplexityDistribution");
      expect(procedures).toContain("getSalesFunnelMetrics");
      expect(procedures).toContain("getPipelineVelocityMetrics");

      // New procedures
      expect(procedures).toContain("getWinLossStats");
      expect(procedures).toContain("getPipelineValueByStage");
      expect(procedures).toContain("getAverageDealSize");
      expect(procedures).toContain("getSalesCycleDuration");
      expect(procedures).toContain("getMonthlyTrend");
      expect(procedures).toContain("getLossReasons");
    });

    it("should have 17 procedures total", () => {
      const procedures = Object.keys(analyticsRouter._def.procedures);
      expect(procedures).toHaveLength(17);
    });
  });
});
