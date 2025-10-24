import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Context } from "@/app/server/context";
import { staffStatisticsRouter } from "@/app/server/routers/staffStatistics";
import { db } from "@/lib/db";
import { departments, staffCapacity, timeEntries } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { assertAuthContext, createCaller, createMockContext } from "../helpers/trpc";

describe("Staff Statistics Router", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof staffStatisticsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };
  let testTenantId: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testDeptId: string;

  beforeEach(async () => {
    // Create test tenant
    testTenantId = await createTestTenant();
    tracker.tenants?.push(testTenantId);

    // Create test department
    const [dept] = await db
      .insert(departments)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        name: "Tax Department",
        isActive: true,
      })
      .returning();
    testDeptId = dept.id;

    // Create test users
    testUser1Id = await createTestUser(testTenantId, {
      role: "staff",
      firstName: "Alice",
      lastName: "Smith",
      departmentId: testDeptId,
    });
    testUser2Id = await createTestUser(testTenantId, {
      role: "staff",
      firstName: "Bob",
      lastName: "Jones",
      departmentId: testDeptId,
    });

    tracker.users?.push(testUser1Id, testUser2Id);

    // Create staff capacity records
    await db.insert(staffCapacity).values([
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUser1Id,
        weeklyHours: 37.5,
        effectiveFrom: "2025-01-01",
      },
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUser2Id,
        weeklyHours: 40,
        effectiveFrom: "2025-01-01",
      },
    ]);

    // Create mock context
    ctx = createMockContext({
      authContext: {
        userId: testUser1Id,
        tenantId: testTenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });
    assertAuthContext(ctx);

    caller = createCaller(staffStatisticsRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe("getStaffUtilization", () => {
    it("should calculate utilization for staff with time entries", async () => {
      // Add time entries for a 1-week period
      const startDate = "2025-01-06"; // Monday
      const endDate = "2025-01-12"; // Sunday

      // User 1: 40 hours logged (37.5 capacity) = 107% utilization
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-06",
          hours: "8",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-07",
          hours: "8",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-08",
          hours: "8",
          billable: false,
        },
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-09",
          hours: "8",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-10",
          hours: "8",
          billable: true,
        },
      ]);

      const result = await caller.getStaffUtilization({
        startDate,
        endDate,
        userId: testUser1Id,
      });

      expect(result.staff.length).toBe(1);
      const staff = result.staff[0];

      expect(staff.userId).toBe(testUser1Id);
      expect(staff.totalLoggedHours).toBe(40);
      expect(staff.billableHours).toBe(32); // 4 days × 8 hours
      expect(staff.nonBillableHours).toBe(8); // 1 day × 8 hours
      expect(staff.capacityHours).toBe(37.5); // 1 week
      expect(staff.utilization).toBe(107); // Math.round(40 / 37.5 * 100)
      expect(staff.billablePercentage).toBe(80); // Math.round(32 / 40 * 100)
      expect(staff.status).toBe("overallocated");
    });

    it("should identify underutilized staff", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      // User 2: 20 hours logged (40 capacity) = 50% utilization (underutilized)
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-06",
          hours: "5",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-07",
          hours: "5",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-08",
          hours: "5",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-09",
          hours: "5",
          billable: true,
        },
      ]);

      const result = await caller.getStaffUtilization({
        startDate,
        endDate,
        userId: testUser2Id,
      });

      const staff = result.staff[0];
      expect(staff.utilization).toBe(50); // Math.round(20 / 40 * 100)
      expect(staff.status).toBe("underutilized");
    });

    it("should return all staff when no userId provided", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      const result = await caller.getStaffUtilization({
        startDate,
        endDate,
      });

      expect(result.staff.length).toBe(2);
      expect(result.summary.totalStaff).toBe(2);
    });

    it("should filter by department", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      const result = await caller.getStaffUtilization({
        startDate,
        endDate,
        departmentId: testDeptId,
      });

      expect(result.staff.length).toBe(2);
      expect(
        result.staff.every(
          (s: typeof result.staff[0]) => s.departmentId === testDeptId,
        ),
      ).toBe(true);
    });

    it("should calculate correct averages in summary", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      // User 1: 107% utilization (overallocated)
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-06",
          hours: "40",
          billable: true,
        },
      ]);

      // User 2: 50% utilization (underutilized)
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-06",
          hours: "20",
          billable: true,
        },
      ]);

      const result = await caller.getStaffUtilization({
        startDate,
        endDate,
      });

      // Average: (107 + 50) / 2 = 78.5 → 79
      expect(result.summary.averageUtilization).toBe(79);
      expect(result.summary.overallocated).toBe(1);
      expect(result.summary.underutilized).toBe(1);
    });
  });

  describe("getDepartmentUtilization", () => {
    it("should aggregate utilization by department", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      // Add time entries for both users
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-06",
          hours: "37.5",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-06",
          hours: "40",
          billable: true,
        },
      ]);

      const result = await caller.getDepartmentUtilization({
        startDate,
        endDate,
      });

      expect(result.departments.length).toBe(1);
      const dept = result.departments[0];

      expect(dept.departmentName).toBe("Tax Department");
      expect(dept.staffCount).toBe(2);
      expect(dept.capacityHours).toBe(77.5); // (37.5 + 40) * 1 week
      expect(dept.loggedHours).toBe(77.5);
      expect(dept.utilization).toBe(100);
    });
  });

  describe("getStaffUtilizationTrend", () => {
    it("should return 12-week trend data", async () => {
      const result = await caller.getStaffUtilizationTrend({
        userId: testUser1Id,
        weeks: 12,
      });

      expect(result.userId).toBe(testUser1Id);
      expect(result.weeklyCapacity).toBe(37.5);
      expect(result.weeks.length).toBe(12);

      // Verify structure of weeks
      result.weeks.forEach((week: typeof result.weeks[0]) => {
        expect(week).toHaveProperty("weekStartDate");
        expect(week).toHaveProperty("weekEndDate");
        expect(week).toHaveProperty("loggedHours");
        expect(week).toHaveProperty("utilization");
      });
    });

    it("should calculate trend utilization correctly", async () => {
      // Add time entries for the current week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: weekStart.toISOString().split("T")[0],
          hours: "30",
          billable: true,
        },
      ]);

      const result = await caller.getStaffUtilizationTrend({
        userId: testUser1Id,
        weeks: 1,
      });

      const currentWeek = result.weeks[0];
      expect(currentWeek.loggedHours).toBe(30);
      expect(currentWeek.utilization).toBe(80); // Math.round(30 / 37.5 * 100)
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        caller.getStaffUtilizationTrend({
          userId: "non-existent-user",
          weeks: 12,
        }),
      ).rejects.toThrow("Staff capacity not found");
    });
  });

  describe("getStaffComparison", () => {
    it("should return sorted staff comparison", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      // Add time entries
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-06",
          hours: "40",
          billable: true,
        },
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-06",
          hours: "20",
          billable: true,
        },
      ]);

      const result = await caller.getStaffComparison({
        startDate,
        endDate,
        sortBy: "hours",
        sortOrder: "desc",
      });

      expect(result.staff.length).toBe(2);
      expect(result.total).toBe(2);

      // Should be sorted by hours descending
      expect(result.staff[0].totalLoggedHours).toBeGreaterThan(
        result.staff[1].totalLoggedHours,
      );
    });

    it("should filter by status", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      // User 1: overallocated
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser1Id,
          date: "2025-01-06",
          hours: "40",
          billable: true,
        },
      ]);

      // User 2: underutilized
      await db.insert(timeEntries).values([
        {
          tenantId: testTenantId,
          userId: testUser2Id,
          date: "2025-01-06",
          hours: "20",
          billable: true,
        },
      ]);

      const result = await caller.getStaffComparison({
        startDate,
        endDate,
        status: "overallocated",
      });

      expect(result.staff.length).toBe(1);
      expect(result.staff[0].status).toBe("overallocated");
    });

    it("should sort by name alphabetically", async () => {
      const startDate = "2025-01-06";
      const endDate = "2025-01-12";

      const result = await caller.getStaffComparison({
        startDate,
        endDate,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Alice Smith should come before Bob Jones
      expect(result.staff[0].firstName).toBe("Alice");
      expect(result.staff[1].firstName).toBe("Bob");
    });
  });
});
