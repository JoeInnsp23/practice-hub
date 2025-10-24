/**
 * Dashboard Router Tests
 *
 * Tests for the dashboard tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { dashboardRouter } from "@/app/server/routers/dashboard";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

// Mock dashboard queries
vi.mock("@/lib/db/queries/dashboard-queries", () => ({
  getDashboardKpis: vi.fn().mockResolvedValue({
    totalRevenue: 10000,
    collectedRevenue: 8000,
    outstandingRevenue: 2000,
    activeClients: 25,
    newClients30d: 5,
    pendingTasks: 10,
    inProgressTasks: 15,
    completedTasks30d: 30,
    overdueTasks: 3,
    totalHours30d: 160,
    billableHours30d: 120,
    upcomingCompliance30d: 8,
    overdueCompliance: 2,
  }),
  getActivityFeed: vi.fn().mockResolvedValue([
    {
      id: "1",
      entityType: "client",
      entityId: "client-1",
      entityName: "Test Client",
      action: "created",
      description: "Created new client",
      userName: "John Doe",
      userDisplayName: "John Doe",
      userEmail: "john@example.com",
      createdAt: new Date(),
    },
  ]),
}));

describe("app/server/routers/dashboard.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof dashboardRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    assertAuthContext(ctx);
    _caller = createCaller(dashboardRouter, ctx);
    vi.clearAllMocks();
  });

  describe("kpis", () => {
    it("should have no required input", () => {
      const procedure = dashboardRouter._def.procedures.kpis;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("activity", () => {
    it("should accept empty input", async () => {
      await expect(_caller.activity({})).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      await expect(_caller.activity({
        limit: 50,
        offset: 100,
      })).resolves.not.toThrow();
    });

    it("should accept entityType filter", async () => {
      await expect(_caller.activity({
        entityType: "client",
      })).resolves.not.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(_caller.activity({
        limit: 150, // Exceeds max of 100
      })).rejects.toThrow();
    });

    it("should validate limit min value", async () => {
      await expect(_caller.activity({
        limit: 0, // Below minimum of 1
      })).rejects.toThrow();
    });

    it("should accept all filters combined", async () => {
      await expect(_caller.activity({
        limit: 25,
        offset: 50,
        entityType: "task",
      })).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(dashboardRouter._def.procedures);

      expect(procedures).toContain("kpis");
      expect(procedures).toContain("activity");
    });

    it("should have 2 procedures total", () => {
      const procedures = Object.keys(dashboardRouter._def.procedures);
      expect(procedures).toHaveLength(2);
    });
  });
});
