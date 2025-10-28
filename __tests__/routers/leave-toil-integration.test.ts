import { eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "@/app/server";
import { db } from "@/lib/db";
import { leaveBalances, leaveRequests, tenants, users } from "@/lib/db/schema";
import { createMockContext } from "../helpers/trpc";

describe("Leave-TOIL Redemption Integration", () => {
  let testTenantId: string;
  let testUserId: string;
  let testAdminId: string;

  beforeAll(async () => {
    // Create test tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: crypto.randomUUID(),
        name: "Test Tenant - Leave TOIL",
        slug: `test-leave-toil-${Date.now()}`,
      })
      .returning();
    testTenantId = tenant.id;

    // Create test user (staff member with TOIL balance)
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

    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        email: `admin-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Admin",
        role: "admin",
      })
      .returning();
    testAdminId = admin.id;

    // Create leave balance with TOIL
    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      year: new Date().getFullYear(),
      annualEntitlement: 25,
      annualUsed: 0,
      sickUsed: 0,
      toilBalance: 15, // 15 hours = 2 days of TOIL
      carriedOver: 0,
    });
  });

  it("should reject TOIL leave request when user has insufficient balance", async () => {
    const userContext = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        role: "staff",
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
      },
    });
    const userCaller = appRouter.createCaller(userContext);

    // Request 3 days (22.5 hours) when user only has 15 hours
    // Use a Monday-Wednesday to ensure 3 working days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14); // 2 weeks from now
    // Find next Monday
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const monday = new Date(futureDate);
    const wednesday = new Date(futureDate);
    wednesday.setDate(wednesday.getDate() + 2); // Monday + 2 = Wednesday (3 working days)

    await expect(
      userCaller.leave.request({
        leaveType: "toil",
        startDate: monday.toISOString().split("T")[0],
        endDate: wednesday.toISOString().split("T")[0],
        notes: "TOIL leave - 3 days",
      }),
    ).rejects.toThrow(/Insufficient TOIL balance/);
  });

  it("should reject TOIL leave request when user has zero balance", async () => {
    // Create user with zero TOIL
    const [userNoToil] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        email: `notoil-${Date.now()}@test.com`,
        firstName: "No",
        lastName: "Toil",
        role: "staff",
      })
      .returning();

    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: userNoToil.id,
      year: new Date().getFullYear(),
      annualEntitlement: 25,
      annualUsed: 0,
      sickUsed: 0,
      toilBalance: 0, // No TOIL
      carriedOver: 0,
    });

    const userContext = createMockContext({
      authContext: {
        userId: userNoToil.id,
        tenantId: testTenantId,
        role: "staff",
        email: userNoToil.email,
        firstName: "No",
        lastName: "Toil",
      },
    });
    const userCaller = appRouter.createCaller(userContext);

    // Use a guaranteed weekday (Monday) to avoid weekend validation errors
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14); // 14 days from now
    // Find next Monday
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const tomorrow = new Date(futureDate);

    await expect(
      userCaller.leave.request({
        leaveType: "toil",
        startDate: tomorrow.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        notes: "TOIL leave",
      }),
    ).rejects.toThrow(/no TOIL balance available/);
  });

  it("should allow TOIL leave request when user has sufficient balance", async () => {
    const userContext = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        role: "staff",
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
      },
    });
    const userCaller = appRouter.createCaller(userContext);

    // 1 day of TOIL leave (7.5 hours, user has 15 hours)
    // Use a date far enough in the future to avoid conflicts
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    // Find next Monday
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }

    const result = await userCaller.leave.request({
      leaveType: "toil",
      startDate: futureDate.toISOString().split("T")[0],
      endDate: futureDate.toISOString().split("T")[0],
      notes: "TOIL leave - 1 day",
    });

    expect(result.success).toBe(true);
    expect(result.request.leaveType).toBe("toil");
    expect(result.request.status).toBe("pending");
    expect(result.request.daysCount).toBe(1);
  });

  it("should deduct TOIL balance when admin approves TOIL leave", async () => {
    // Create a pending TOIL leave request
    const [request] = await db
      .insert(leaveRequests)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        leaveType: "toil",
        startDate: "2025-02-10",
        endDate: "2025-02-10",
        daysCount: 1, // 1 day = 7.5 hours
        status: "pending",
        notes: "TOIL leave for approval test",
      })
      .returning();

    // Get initial balance
    const [initialBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    const adminContext = createMockContext({
      authContext: {
        userId: testAdminId,
        tenantId: testTenantId,
        role: "admin",
        email: `admin-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Admin",
      },
    });
    const adminCaller = appRouter.createCaller(adminContext);

    // Approve the request
    await adminCaller.leave.approve({
      requestId: request.id,
      reviewerComments: "Approved",
    });

    // Verify TOIL balance was deducted
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(
      initialBalance.toilBalance - 7.5, // 1 day = 7.5 hours
    );
  });

  it("should restore TOIL balance when user cancels approved TOIL leave", async () => {
    // Create an approved TOIL leave request
    const [request] = await db
      .insert(leaveRequests)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        leaveType: "toil",
        startDate: "2025-03-10",
        endDate: "2025-03-10",
        daysCount: 1, // 1 day = 7.5 hours
        status: "approved",
        notes: "TOIL leave for cancellation test",
      })
      .returning();

    // Manually deduct TOIL balance (simulating approval)
    await db
      .update(leaveBalances)
      .set({
        toilBalance: sql`${leaveBalances.toilBalance} - 7.5`,
      })
      .where(eq(leaveBalances.userId, testUserId));

    // Get balance after deduction
    const [balanceAfterApproval] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    const userContext = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        role: "staff",
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
      },
    });
    const userCaller = appRouter.createCaller(userContext);

    // Cancel the request
    await userCaller.leave.cancel({
      requestId: request.id,
    });

    // Verify TOIL balance was restored
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(
      balanceAfterApproval.toilBalance + 7.5, // Restored 1 day = 7.5 hours
    );
  });

  it("should handle multi-day TOIL leave correctly", async () => {
    const userContext = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        role: "staff",
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
      },
    });
    const userCaller = appRouter.createCaller(userContext);

    // Request 2 days of TOIL (Monday to Tuesday = 2 working days = 15 hours)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60); // 60 days from now
    // Find next Monday
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const monday = new Date(futureDate);
    const tuesday = new Date(futureDate);
    tuesday.setDate(tuesday.getDate() + 1); // Monday + 1 = Tuesday

    // Get current balance
    const [currentBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    // Should succeed if user has >= 15 hours (user currently has 15 hours)
    if (currentBalance.toilBalance >= 15) {
      const result = await userCaller.leave.request({
        leaveType: "toil",
        startDate: monday.toISOString().split("T")[0],
        endDate: tuesday.toISOString().split("T")[0],
        notes: "2-day TOIL leave",
      });

      expect(result.success).toBe(true);
      expect(result.request.daysCount).toBe(2);
    } else {
      // Should fail if insufficient balance
      await expect(
        userCaller.leave.request({
          leaveType: "toil",
          startDate: monday.toISOString().split("T")[0],
          endDate: tuesday.toISOString().split("T")[0],
          notes: "2-day TOIL leave",
        }),
      ).rejects.toThrow(/Insufficient TOIL balance/);
    }
  });
});
