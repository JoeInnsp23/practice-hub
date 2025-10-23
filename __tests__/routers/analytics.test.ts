/**
 * Analytics Router Tests
 *
 * Tests for the analytics tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { analyticsRouter } from "@/app/server/routers/analytics";
import { createCaller, createMockContext } from "../helpers/trpc";

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
    caller = createCaller(analyticsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getLeadStats", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLeadStats._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLeadStats._def.inputs[0]?.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        });
      }).not.toThrow();
    });

    it("should accept startDate only", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLeadStats._def.inputs[0]?.parse({
          startDate: "2025-01-01",
        });
      }).not.toThrow();
    });

    it("should accept endDate only", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLeadStats._def.inputs[0]?.parse({
          endDate: "2025-01-31",
        });
      }).not.toThrow();
    });
  });

  describe("getProposalStats", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getProposalStats._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getProposalStats._def.inputs[0]?.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        });
      }).not.toThrow();
    });
  });

  describe("getConversionMetrics", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getConversionMetrics._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getConversionMetrics._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getPipelineMetrics", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getPipelineMetrics._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getPipelineMetrics._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getModelComparison", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getModelComparison._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getModelComparison._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getServicePopularity", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });

    it("should accept limit parameter", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {
            limit: 25,
          },
        );
      }).not.toThrow();
    });

    it("should accept all parameters combined", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            limit: 20,
          },
        );
      }).not.toThrow();
    });

    it("should validate limit min value", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {
            limit: 0, // Below minimum of 1
          },
        );
      }).toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {
            limit: 51, // Exceeds max of 50
          },
        );
      }).toThrow();
    });

    it("should default limit to 10", () => {
      const result =
        analyticsRouter._def.procedures.getServicePopularity._def.inputs[0]?.parse(
          {},
        );
      expect(result?.limit).toBe(10);
    });
  });

  describe("getDiscountAnalysis", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getDiscountAnalysis._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getDiscountAnalysis._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
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
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getComplexityDistribution._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getComplexityDistribution._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getWinLossStats", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getWinLossStats._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getWinLossStats._def.inputs[0]?.parse({
          from: "2025-01-01",
          to: "2025-01-31",
        });
      }).not.toThrow();
    });

    it("should accept assignedToId filter", () => {
      expect(() => {
        analyticsRouter._def.procedures.getWinLossStats._def.inputs[0]?.parse({
          assignedToId: "user-123",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        analyticsRouter._def.procedures.getWinLossStats._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept all filters combined", () => {
      expect(() => {
        analyticsRouter._def.procedures.getWinLossStats._def.inputs[0]?.parse({
          from: "2025-01-01",
          to: "2025-01-31",
          assignedToId: "user-123",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });
  });

  describe("getPipelineValueByStage", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getPipelineValueByStage._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept asOf date", () => {
      expect(() => {
        analyticsRouter._def.procedures.getPipelineValueByStage._def.inputs[0]?.parse(
          {
            asOf: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getAverageDealSize", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getAverageDealSize._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getAverageDealSize._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getSalesCycleDuration", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getSalesCycleDuration._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getSalesCycleDuration._def.inputs[0]?.parse(
          {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
          },
        );
      }).not.toThrow();
    });
  });

  describe("getMonthlyTrend", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getMonthlyTrend._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept months parameter", () => {
      expect(() => {
        analyticsRouter._def.procedures.getMonthlyTrend._def.inputs[0]?.parse({
          months: 6,
        });
      }).not.toThrow();
    });

    it("should validate months min value", () => {
      expect(() => {
        analyticsRouter._def.procedures.getMonthlyTrend._def.inputs[0]?.parse({
          months: 0, // Below minimum of 1
        });
      }).toThrow();
    });

    it("should validate months max value", () => {
      expect(() => {
        analyticsRouter._def.procedures.getMonthlyTrend._def.inputs[0]?.parse({
          months: 25, // Exceeds max of 24
        });
      }).toThrow();
    });

    it("should default months to 12", () => {
      const result =
        analyticsRouter._def.procedures.getMonthlyTrend._def.inputs[0]?.parse(
          {},
        );
      expect(result?.months).toBe(12);
    });
  });

  describe("getLossReasons", () => {
    it("should accept empty input", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLossReasons._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept date range", () => {
      expect(() => {
        analyticsRouter._def.procedures.getLossReasons._def.inputs[0]?.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        });
      }).not.toThrow();
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
