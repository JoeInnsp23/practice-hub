/**
 * Performance Tests for Staff Statistics
 * Validates performance requirements for staff utilization calculations
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import { createCaller, createMockContext } from "../helpers/trpc";

describe("Staff Statistics Performance Tests", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof staffStatisticsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };

  let testTenantId: string;
  let testAdminId: string;
  let testDepartmentId: string;
  const testStaffIds: string[] = [];

  beforeAll(async () => {
    // 1. Create test tenant
    testTenantId = await createTestTenant();
    tracker.tenants?.push(testTenantId);

    // 2. Create admin user
    testAdminId = await createTestUser(testTenantId, { role: "admin" });
    tracker.users?.push(testAdminId);

    // 3. Create mock context
    ctx = createMockContext({
      authContext: {
        userId: testAdminId,
        tenantId: testTenantId,
        organizationName: "Performance Test Firm",
        role: "admin",
        email: `perftest-${Date.now()}@example.com`,
        firstName: "Perf",
        lastName: "Admin",
      },
    });

    caller = createCaller(staffStatisticsRouter, ctx);

    // 4. Create test department
    const [dept] = await db
      .insert(departments)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        name: "Performance Test Department",
        isActive: true,
      })
      .returning();
    testDepartmentId = dept.id;

    // 5. Create 100 staff users with capacity
    console.log("⏳ Creating 100 test staff members...");
    for (let i = 0; i < 100; i++) {
      const userId = await createTestUser(testTenantId, {
        role: "staff",
        firstName: `Staff${i}`,
        lastName: `User${i}`,
        departmentId: testDepartmentId,
      });
      testStaffIds.push(userId);
      tracker.users?.push(userId);

      // Create staff capacity (varied weekly hours)
      await db.insert(staffCapacity).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId,
        weeklyHours: 35 + (i % 3) * 2.5, // 35, 37.5, or 40 hours
        effectiveFrom: "2025-01-01",
      });

      // Create time entries for the current week
      await db.insert(timeEntries).values({
        tenantId: testTenantId,
        userId,
        date: "2025-01-06",
        hours: String(30 + (i % 15)), // Varied hours 30-44
        billable: i % 3 !== 0, // 2/3 billable
      });
    }

    console.log(
      `✓ Performance test setup complete: 100 staff, 1 department, tenant ${testTenantId}`,
    );
  });

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("should handle 100 staff utilization calculation in < 2 seconds", async () => {
    // Start performance timer
    const startTime = performance.now();

    // Execute utilization query for 100 staff
    const result = await caller.getStaffUtilization({
      startDate: "2025-01-06",
      endDate: "2025-01-12",
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000; // Convert to seconds

    // Log results
    console.log(`\n📊 Staff Utilization Performance:`);
    console.log(`   Staff count: ${result.staff.length}`);
    console.log(
      `   Average utilization: ${result.summary.averageUtilization}%`,
    );
    console.log(`   Overallocated: ${result.summary.overallocated}`);
    console.log(`   Underutilized: ${result.summary.underutilized}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per staff: ${(executionTime / result.staff.length).toFixed(3)}s`,
    );
    console.log(
      `   Status: ${executionTime < 2 ? "✅ PASS" : "❌ FAIL"} (requirement: <2s)\n`,
    );

    // Assertions
    // Note: 101 because we have 100 staff + 1 admin user
    expect(result.staff).toHaveLength(101);
    expect(result.summary.totalStaff).toBe(101);
    expect(executionTime).toBeLessThan(2.0); // Performance requirement

    // Verify calculations are correct
    expect(result.staff.every((s) => s.utilization >= 0)).toBe(true);
    expect(result.summary.averageUtilization).toBeGreaterThan(0);
  }, 10000); // 10 second timeout

  it("should handle 52-week trend calculation in < 1 second", async () => {
    // Pick first staff member for trend analysis
    const staffId = testStaffIds[0];

    // Create time entries for 52 weeks
    console.log("⏳ Creating 52 weeks of time entry data...");
    const promises = [];
    for (let week = 0; week < 52; week++) {
      const date = new Date("2025-01-01");
      date.setDate(date.getDate() + week * 7);
      const dateStr = date.toISOString().split("T")[0];

      promises.push(
        db.insert(timeEntries).values({
          tenantId: testTenantId,
          userId: staffId,
          date: dateStr,
          hours: String(35 + (week % 5)), // Varied hours
          billable: true,
        }),
      );
    }
    await Promise.all(promises);

    // Start performance timer
    const startTime = performance.now();

    // Execute 52-week trend query
    const result = await caller.getStaffUtilizationTrend({
      userId: staffId,
      weeks: 52,
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    // Log results
    const totalHours = result.weeks.reduce((sum, w) => sum + w.loggedHours, 0);
    console.log(`\n📈 52-Week Trend Performance:`);
    console.log(`   Weeks calculated: ${result.weeks.length}`);
    console.log(`   Staff capacity: ${result.weeklyCapacity} hrs/week`);
    console.log(`   Total hours logged: ${totalHours.toFixed(1)}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per week: ${(executionTime / result.weeks.length).toFixed(4)}s`,
    );
    console.log(
      `   Status: ${executionTime < 1 ? "✅ PASS" : "❌ FAIL"} (requirement: <1s)\n`,
    );

    // Assertions
    expect(result.weeks).toHaveLength(52);
    expect(result.userId).toBe(staffId);
    expect(executionTime).toBeLessThan(1.0); // Performance requirement

    // Verify data integrity
    expect(result.weeks.every((w) => w.utilization >= 0)).toBe(true);
    expect(totalHours).toBeGreaterThan(0);
  }, 15000); // 15 second timeout (includes data setup)

  it("should handle department utilization aggregation in < 1 second", async () => {
    // Create 5 more departments with 20 staff each
    console.log("⏳ Creating 5 departments with 20 staff each...");
    const deptIds: string[] = [testDepartmentId];

    for (let d = 0; d < 5; d++) {
      const [dept] = await db
        .insert(departments)
        .values({
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          name: `Department ${d + 1}`,
          isActive: true,
        })
        .returning();
      deptIds.push(dept.id);

      // Create 20 staff per department
      for (let s = 0; s < 20; s++) {
        const userId = await createTestUser(testTenantId, {
          role: "staff",
          firstName: `Staff${d}-${s}`,
          lastName: `User`,
          departmentId: dept.id,
        });
        tracker.users?.push(userId);

        await db.insert(staffCapacity).values({
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId,
          weeklyHours: 37.5,
          effectiveFrom: "2025-01-01",
        });

        await db.insert(timeEntries).values({
          tenantId: testTenantId,
          userId,
          date: "2025-01-06",
          hours: String(30 + s),
          billable: true,
        });
      }
    }

    // Start performance timer
    const startTime = performance.now();

    // Execute department aggregation query
    const result = await caller.getDepartmentUtilization({
      startDate: "2025-01-06",
      endDate: "2025-01-12",
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    // Log results
    const totalStaff = result.departments.reduce(
      (sum, d) => sum + d.staffCount,
      0,
    );
    console.log(`\n🏢 Department Aggregation Performance:`);
    console.log(`   Departments: ${result.departments.length}`);
    console.log(`   Total staff across all departments: ${totalStaff}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per department: ${(executionTime / result.departments.length).toFixed(3)}s`,
    );
    console.log(
      `   Status: ${executionTime < 1 ? "✅ PASS" : "❌ FAIL"} (requirement: <1s)\n`,
    );

    // Assertions
    expect(result.departments.length).toBeGreaterThanOrEqual(6);
    expect(totalStaff).toBeGreaterThanOrEqual(200);
    expect(executionTime).toBeLessThan(1.0); // Performance requirement

    // Verify aggregation integrity
    expect(result.departments.every((d) => d.staffCount > 0)).toBe(true);
    expect(result.departments.every((d) => d.utilization >= 0)).toBe(true);
  }, 15000); // 15 second timeout

  it("should handle staff comparison with sorting in < 500ms", async () => {
    // Test sorting performance with 100 staff
    const startTime = performance.now();

    const result = await caller.getStaffComparison({
      startDate: "2025-01-06",
      endDate: "2025-01-12",
      sortBy: "utilization",
      sortOrder: "desc",
    });

    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    console.log(`\n🔄 Staff Comparison Sorting Performance:`);
    console.log(`   Staff sorted: ${result.staff.length}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Status: ${executionTime < 0.5 ? "✅ PASS" : "❌ FAIL"} (requirement: <500ms)\n`,
    );

    // Assertions
    expect(result.staff.length).toBeGreaterThanOrEqual(100);
    expect(executionTime).toBeLessThan(0.5);

    // Verify sorting is correct (descending)
    for (let i = 1; i < result.staff.length; i++) {
      expect(result.staff[i - 1].utilization).toBeGreaterThanOrEqual(
        result.staff[i].utilization,
      );
    }
  }, 10000);
});
