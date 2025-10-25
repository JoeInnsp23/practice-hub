import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/app/server";
import { db } from "@/lib/db";
import {
  leaveBalances,
  staffCapacity,
  tenants,
  timesheetSubmissions,
  toilAccrualHistory,
  users,
} from "@/lib/db/schema";
import { createMockContext, type TestContextWithAuth } from "../helpers/trpc";

// Mock email notifications to avoid API key errors in tests
vi.mock("@/lib/email/timesheet-notifications", () => ({
  sendTimesheetApprovalEmail: vi.fn().mockResolvedValue(undefined),
  sendTimesheetRejectionEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("Timesheet-TOIL Integration", () => {
  let testTenantId: string;
  let testUserId: string;
  let testManagerId: string;
  let testSubmissionId: string;

  beforeAll(async () => {
    // Create test tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: crypto.randomUUID(),
        name: "Test Tenant - Timesheet TOIL",
        slug: `test-timesheet-toil-${Date.now()}`,
      })
      .returning();
    testTenantId = tenant.id;

    // Create test user (staff member)
    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
        role: "staff",
      })
      .returning();
    testUserId = user.id;

    // Create test manager
    const [manager] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        email: `manager-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Manager",
        role: "manager",
      })
      .returning();
    testManagerId = manager.id;

    // Create staff capacity record (contracted 37.5 hours/week)
    await db.insert(staffCapacity).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weeklyHours: 37.5,
      effectiveFrom: "2025-01-01",
    });

    // Create leave balance record for TOIL tracking
    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      year: new Date().getFullYear(),
      annualEntitlement: 25,
      annualUsed: 0,
      toilBalance: 0, // Start with 0 TOIL
      sickUsed: 0,
      carriedOver: 0,
    });

    // Create timesheet submission with overtime (45 hours logged)
    const [submission] = await db
      .insert(timesheetSubmissions)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekStartDate: "2025-01-06",
        weekEndDate: "2025-01-12",
        totalHours: "45", // 45 hours logged (7.5 hours overtime)
        status: "pending",
      })
      .returning();
    testSubmissionId = submission.id;
  });

  it("should accrue TOIL when timesheet with overtime is approved", async () => {
    const managerContext = createMockContext({
      authContext: {
        userId: testManagerId,
        tenantId: testTenantId,
        role: "manager",
        email: `manager-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Manager",
      },
    });
    const managerCaller = appRouter.createCaller(managerContext);

    // Approve timesheet (45 hours logged, 37.5 contracted = 7.5 TOIL)
    await managerCaller.timesheets.approve({ submissionId: testSubmissionId });

    // Verify TOIL accrual history was created
    const accrualHistory = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.userId, testUserId));

    expect(accrualHistory.length).toBe(1);
    expect(accrualHistory[0].hoursAccrued).toBe(7.5);
    expect(accrualHistory[0].timesheetId).toBe(testSubmissionId);
    expect(accrualHistory[0].weekEnding).toBe("2025-01-12");

    // Verify leave balance was updated
    const balance = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(balance[0].toilBalance).toBe(7.5);
  });

  it("should NOT accrue TOIL when logged hours equal contracted hours", async () => {
    // Create another submission with exactly 37.5 hours
    const [submission] = await db
      .insert(timesheetSubmissions)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekStartDate: "2025-01-13",
        weekEndDate: "2025-01-19",
        totalHours: "37.5", // Exactly contracted hours
        status: "pending",
      })
      .returning();

    const managerContext = createMockContext({
      authContext: {
        userId: testManagerId,
        tenantId: testTenantId,
        role: "manager",
        email: `manager-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Manager",
      },
    });
    const managerCaller = appRouter.createCaller(managerContext);

    await managerCaller.timesheets.approve({ submissionId: submission.id });

    // Verify no new TOIL accrual (still only 1 record from previous test)
    const accrualHistory = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.userId, testUserId));

    expect(accrualHistory.length).toBe(1); // Still only the first one
  });

  it("should NOT accrue TOIL when logged hours are less than contracted hours", async () => {
    // Create another submission with 35 hours
    const [submission] = await db
      .insert(timesheetSubmissions)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekStartDate: "2025-01-20",
        weekEndDate: "2025-01-26",
        totalHours: "35", // Less than contracted hours
        status: "pending",
      })
      .returning();

    const managerContext = createMockContext({
      authContext: {
        userId: testManagerId,
        tenantId: testTenantId,
        role: "manager",
        email: `manager-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Manager",
      },
    });
    const managerCaller = appRouter.createCaller(managerContext);

    await managerCaller.timesheets.approve({ submissionId: submission.id });

    // Verify no new TOIL accrual (still only 1 record)
    const accrualHistory = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.userId, testUserId));

    expect(accrualHistory.length).toBe(1); // Still only the first one
  });

  it("should accrue TOIL for multiple submissions in bulk approve", async () => {
    // Create test user 2
    const [user2] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        email: `staff2-${Date.now()}@test.com`,
        firstName: "Test2",
        lastName: "Staff2",
        role: "staff",
      })
      .returning();

    // Create staff capacity for user 2
    await db.insert(staffCapacity).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: user2.id,
      weeklyHours: 40, // Different contracted hours
      effectiveFrom: "2025-01-01",
    });

    // Create leave balance for user 2
    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: user2.id,
      year: new Date().getFullYear(),
      annualEntitlement: 25,
      annualUsed: 0,
      toilBalance: 0,
      sickUsed: 0,
      carriedOver: 0,
    });

    // Create two submissions with overtime
    const [sub1] = await db
      .insert(timesheetSubmissions)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekStartDate: "2025-01-27",
        weekEndDate: "2025-02-02",
        totalHours: "42", // 4.5 hours overtime
        status: "pending",
      })
      .returning();

    const [sub2] = await db
      .insert(timesheetSubmissions)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: user2.id,
        weekStartDate: "2025-01-27",
        weekEndDate: "2025-02-02",
        totalHours: "45", // 5 hours overtime (40 contracted)
        status: "pending",
      })
      .returning();

    const managerContext = createMockContext({
      authContext: {
        userId: testManagerId,
        tenantId: testTenantId,
        role: "manager",
        email: `manager-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Manager",
      },
    });
    const managerCaller = appRouter.createCaller(managerContext);

    // Bulk approve both submissions
    await managerCaller.timesheets.bulkApprove({
      submissionIds: [sub1.id, sub2.id],
    });

    // Verify TOIL was accrued for both users
    const user1Accruals = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.userId, testUserId));

    const user2Accruals = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.userId, user2.id));

    expect(user1Accruals.length).toBe(2); // 1 from previous + 1 new
    expect(user2Accruals.length).toBe(1);
    expect(user2Accruals[0].hoursAccrued).toBe(5); // 45 - 40 = 5

    // Find the latest accrual for user 1
    const latestUser1Accrual = user1Accruals.find(
      (a) => a.timesheetId === sub1.id,
    );
    expect(latestUser1Accrual?.hoursAccrued).toBe(4.5); // 42 - 37.5 = 4.5
  });
});
