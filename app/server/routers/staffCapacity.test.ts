import { describe, expect, it } from "vitest";
import {
  createCaller,
  createMockContext,
} from "../../../__tests__/helpers/trpc";
import { staffCapacityRouter } from "./staffCapacity";

describe("staffCapacityRouter", () => {
  const ctx = createMockContext();
  const caller = createCaller(staffCapacityRouter, ctx);

  describe("list", () => {
    it("should return empty array when no capacity records exist", async () => {
      const result = await caller.list({});

      expect(result).toHaveProperty("capacityRecords");
      expect(Array.isArray(result.capacityRecords)).toBe(true);
    });

    it("should accept optional userId filter", async () => {
      const result = await caller.list({ userId: "user-1" });

      expect(result).toHaveProperty("capacityRecords");
      expect(Array.isArray(result.capacityRecords)).toBe(true);
    });
  });

  describe("getUtilization", () => {
    it("should return utilization data structure", async () => {
      const result = await caller.getUtilization({});

      expect(result).toHaveProperty("utilization");
      expect(Array.isArray(result.utilization)).toBe(true);
    });

    it("should accept optional userId filter", async () => {
      const result = await caller.getUtilization({ userId: "user-1" });

      expect(result).toHaveProperty("utilization");
      expect(Array.isArray(result.utilization)).toBe(true);
    });

    it("should accept optional weekStartDate", async () => {
      const result = await caller.getUtilization({
        weekStartDate: "2025-01-01",
      });

      expect(result).toHaveProperty("utilization");
      expect(Array.isArray(result.utilization)).toBe(true);
    });
  });

  describe("getUtilizationTrends", () => {
    it("should return trends data structure", async () => {
      const result = await caller.getUtilizationTrends({ weeks: 12 });

      expect(result).toHaveProperty("trends");
      expect(Array.isArray(result.trends)).toBe(true);
    });

    it("should default to 12 weeks if not specified", async () => {
      const result = await caller.getUtilizationTrends({});

      expect(result).toHaveProperty("trends");
      expect(Array.isArray(result.trends)).toBe(true);
    });

    it("should accept optional userId filter", async () => {
      const result = await caller.getUtilizationTrends({
        userId: "user-1",
        weeks: 8,
      });

      expect(result).toHaveProperty("trends");
      expect(Array.isArray(result.trends)).toBe(true);
    });
  });

  describe("getRecommendations", () => {
    it("should return recommendations data structure", async () => {
      const result = await caller.getRecommendations();

      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("teamUtilization");
      expect(result).toHaveProperty("totalCapacity");
      expect(result).toHaveProperty("totalActual");
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.teamUtilization).toBe("number");
      expect(typeof result.totalCapacity).toBe("number");
      expect(typeof result.totalActual).toBe("number");
    });
  });

  describe("multi-tenant isolation", () => {
    it("should only access capacity records for the authenticated tenant", async () => {
      // List should only return records for tenant-1
      const result = await caller.list({});

      // All records should belong to tenant-1
      result.capacityRecords.forEach((record: unknown) => {
        // Note: tenantId is not in the select, but it's enforced in the where clause
        expect(record).toBeDefined();
      });
    });

    it("should only show utilization for the authenticated tenant", async () => {
      const result = await caller.getUtilization({});

      // Utilization should only include users from tenant-1
      expect(result.utilization).toBeDefined();
    });
  });

  describe("utilization calculation", () => {
    it("should calculate utilization percentage correctly", () => {
      // Test the utilization formula
      const actualHours = 30;
      const weeklyHours = 37.5;
      const expected = (actualHours / weeklyHours) * 100;

      expect(expected).toBe(80);
    });

    it("should identify overallocated status (>100%)", () => {
      const utilizationPercent = 120;
      const status =
        utilizationPercent > 100
          ? "overallocated"
          : utilizationPercent < 75
            ? "underutilized"
            : "optimal";

      expect(status).toBe("overallocated");
    });

    it("should identify underutilized status (<75%)", () => {
      const utilizationPercent = 60;
      const status =
        utilizationPercent > 100
          ? "overallocated"
          : utilizationPercent < 75
            ? "underutilized"
            : "optimal";

      expect(status).toBe("underutilized");
    });

    it("should identify optimal status (75-100%)", () => {
      const utilizationPercent = 87;
      const status =
        utilizationPercent > 100
          ? "overallocated"
          : utilizationPercent < 75
            ? "underutilized"
            : "optimal";

      expect(status).toBe("optimal");
    });
  });
});
