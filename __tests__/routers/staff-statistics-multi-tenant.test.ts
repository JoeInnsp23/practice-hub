import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  departments,
  staffCapacity,
  timeEntries,
} from "@/lib/db/schema";
import { staffStatisticsRouter } from "@/app/server/routers/staffStatistics";
import type { Context } from "@/app/server/context";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("Staff Statistics Multi-Tenant Isolation", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };

  let tenantAId: string;
  let tenantBId: string;
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;
  let deptAId: string;
  let deptBId: string;

  beforeEach(async () => {
    // Create two separate tenants
    tenantAId = await createTestTenant();
    tenantBId = await createTestTenant();

    tracker.tenants?.push(tenantAId, tenantBId);

    // Create departments
    const [deptA] = await db.insert(departments).values({
      id: crypto.randomUUID(),
      tenantId: tenantAId,
      name: "Tenant A Dept",
      isActive: true,
    }).returning();

    const [deptB] = await db.insert(departments).values({
      id: crypto.randomUUID(),
      tenantId: tenantBId,
      name: "Tenant B Dept",
      isActive: true,
    }).returning();

    deptAId = deptA.id;
    deptBId = deptB.id;

    // Create users
    userA1Id = await createTestUser(tenantAId, {
      role: "staff",
      firstName: "Alice",
      lastName: "A",
      departmentId: deptAId,
    });
    userA2Id = await createTestUser(tenantAId, {
      role: "staff",
      firstName: "Bob",
      lastName: "A",
      departmentId: deptAId,
    });
    userB1Id = await createTestUser(tenantBId, {
      role: "staff",
      firstName: "Charlie",
      lastName: "B",
      departmentId: deptBId,
    });

    tracker.users?.push(userA1Id, userA2Id, userB1Id);

    // Create staff capacity
    await db.insert(staffCapacity).values([
      {
        id: crypto.randomUUID(),
        tenantId: tenantAId,
        userId: userA1Id,
        weeklyHours: 37.5,
        effectiveFrom: "2025-01-01",
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenantAId,
        userId: userA2Id,
        weeklyHours: 40,
        effectiveFrom: "2025-01-01",
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenantBId,
        userId: userB1Id,
        weeklyHours: 35,
        effectiveFrom: "2025-01-01",
      },
    ]);

    // Create time entries for all users
    await db.insert(timeEntries).values([
      // Tenant A - User 1
      {
        tenantId: tenantAId,
        userId: userA1Id,
        date: "2025-01-06",
        hours: "40",
        billable: true,
      },
      // Tenant A - User 2
      {
        tenantId: tenantAId,
        userId: userA2Id,
        date: "2025-01-06",
        hours: "30",
        billable: true,
      },
      // Tenant B - User 1
      {
        tenantId: tenantBId,
        userId: userB1Id,
        date: "2025-01-06",
        hours: "20",
        billable: true,
      },
    ]);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  it("should only return stats for current tenant", async () => {
    const startDate = "2025-01-06";
    const endDate = "2025-01-12";

    // Query from Tenant A
    const callerA = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userA1Id,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const statsA = await callerA.getStaffUtilization({
      startDate,
      endDate,
    });

    // Should see 2 staff from Tenant A only
    expect(statsA.staff.length).toBe(2);
    expect(statsA.staff.every((s) => s.departmentName === "Tenant A Dept")).toBe(
      true,
    );

    // Verify the correct names
    const names = statsA.staff.map((s) => s.firstName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).not.toContain("Charlie");

    // Query from Tenant B
    const callerB = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userB1Id,
          tenantId: tenantBId,
          role: "admin",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const statsB = await callerB.getStaffUtilization({
      startDate,
      endDate,
    });

    // Should see 1 staff from Tenant B only
    expect(statsB.staff.length).toBe(1);
    expect(statsB.staff[0].firstName).toBe("Charlie");
    expect(statsB.staff[0].departmentName).toBe("Tenant B Dept");
  });

  it("should isolate department utilization", async () => {
    const startDate = "2025-01-06";
    const endDate = "2025-01-12";

    // Query from Tenant A
    const callerA = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userA1Id,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const deptStatsA = await callerA.getDepartmentUtilization({
      startDate,
      endDate,
    });

    // Should see 1 department from Tenant A
    expect(deptStatsA.departments.length).toBe(1);
    expect(deptStatsA.departments[0].departmentName).toBe("Tenant A Dept");
    expect(deptStatsA.departments[0].staffCount).toBe(2);

    // Query from Tenant B
    const callerB = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userB1Id,
          tenantId: tenantBId,
          role: "admin",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const deptStatsB = await callerB.getDepartmentUtilization({
      startDate,
      endDate,
    });

    // Should see 1 department from Tenant B
    expect(deptStatsB.departments.length).toBe(1);
    expect(deptStatsB.departments[0].departmentName).toBe("Tenant B Dept");
    expect(deptStatsB.departments[0].staffCount).toBe(1);
  });

  it("should isolate staff utilization trends", async () => {
    // Query trend for Tenant A user from Tenant A context
    const callerA = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userA1Id,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const trendA = await callerA.getStaffUtilizationTrend({
      userId: userA1Id,
      weeks: 12,
    });

    expect(trendA.userId).toBe(userA1Id);
    expect(trendA.weeklyCapacity).toBe(37.5);
    expect(trendA.weeks.length).toBe(12);

    // Attempt to query Tenant A user from Tenant B context
    const callerB = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userB1Id,
          tenantId: tenantBId,
          role: "admin",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    // Should fail because userA1Id doesn't belong to tenantB
    await expect(
      callerB.getStaffUtilizationTrend({
        userId: userA1Id,
        weeks: 12,
      }),
    ).rejects.toThrow("Staff capacity not found");
  });

  it("should isolate staff comparison data", async () => {
    const startDate = "2025-01-06";
    const endDate = "2025-01-12";

    // Query from Tenant A
    const callerA = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userA1Id,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const comparisonA = await callerA.getStaffComparison({
      startDate,
      endDate,
      sortBy: "name",
      sortOrder: "asc",
    });

    // Should see 2 staff from Tenant A
    expect(comparisonA.staff.length).toBe(2);
    expect(comparisonA.total).toBe(2);

    const namesA = comparisonA.staff.map((s) => s.firstName);
    expect(namesA).toContain("Alice");
    expect(namesA).toContain("Bob");

    // Query from Tenant B
    const callerB = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userB1Id,
          tenantId: tenantBId,
          role: "admin",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const comparisonB = await callerB.getStaffComparison({
      startDate,
      endDate,
      sortBy: "name",
      sortOrder: "asc",
    });

    // Should see 1 staff from Tenant B
    expect(comparisonB.staff.length).toBe(1);
    expect(comparisonB.total).toBe(1);
    expect(comparisonB.staff[0].firstName).toBe("Charlie");
  });

  it("should not expose department IDs across tenants", async () => {
    const startDate = "2025-01-06";
    const endDate = "2025-01-12";

    // Query from Tenant A with Tenant B's department ID
    const callerA = createCaller(
      staffStatisticsRouter,
      createMockContext({
        authContext: {
          userId: userA1Id,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const statsA = await callerA.getStaffUtilization({
      startDate,
      endDate,
      departmentId: deptBId, // Tenant B's department
    });

    // Should return no staff (department doesn't exist in Tenant A)
    expect(statsA.staff.length).toBe(0);
  });
});
