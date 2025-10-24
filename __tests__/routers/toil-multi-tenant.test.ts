import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { staffCapacity, timeEntries, toilAccrualHistory } from "@/lib/db/schema";
import { toilRouter } from "@/app/server/routers/toil";
import { and, eq } from "drizzle-orm";
import type { Context } from "@/app/server/context";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("TOIL Multi-Tenant Isolation", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };

  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    // Create two separate tenants
    tenantAId = await createTestTenant();
    tenantBId = await createTestTenant();

    tracker.tenants?.push(tenantAId, tenantBId);

    // Create users in each tenant
    userAId = await createTestUser(tenantAId, { role: "staff" });
    userBId = await createTestUser(tenantBId, { role: "staff" });

    tracker.users?.push(userAId, userBId);

    // Create staff capacity for both users
    await db.insert(staffCapacity).values([
      {
        id: crypto.randomUUID(),
        tenantId: tenantAId,
        userId: userAId,
        weeklyHours: 37.5,
        effectiveFrom: "2025-01-01",
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenantBId,
        userId: userBId,
        weeklyHours: 40,
        effectiveFrom: "2025-01-01",
      },
    ]);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  it("should not accrue TOIL across tenants", async () => {
    // Create timesheet for Tenant A user
    const timesheetId = crypto.randomUUID();
    await db.insert(timeEntries).values({
      id: crypto.randomUUID(),
      tenantId: tenantAId,
      userId: userAId,
      date: "2025-01-06",
      hours: "45", // 7.5 hours overtime
      billable: true,
    });

    // Accrue TOIL for Tenant A
    const callerA = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          role: "staff",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    await callerA.accrueToil({
      userId: userAId,
      timesheetId,
      weekEnding: "2025-01-12",
      loggedHours: 45,
      contractedHours: 37.5,
    });

    // Verify TOIL only appears in Tenant A
    const toilA = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.tenantId, tenantAId));

    expect(toilA.length).toBe(1);
    expect(toilA[0].hoursAccrued).toBe(7.5);

    // Verify Tenant B has no TOIL records
    const toilB = await db
      .select()
      .from(toilAccrualHistory)
      .where(eq(toilAccrualHistory.tenantId, tenantBId));

    expect(toilB.length).toBe(0);

    // Attempt to query TOIL from Tenant B context
    const callerB = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userBId,
          tenantId: tenantBId,
          role: "staff",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const balanceB = await callerB.getBalance({});

    // Tenant B should see 0 hours
    expect(balanceB.balance).toBe(0);
    expect(balanceB.balanceInDays).toBe("0.0");
  });

  it("should not allow cross-tenant TOIL redemption", async () => {
    // Create TOIL in Tenant A
    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: tenantAId,
      userId: userAId,
      weekEnding: "2025-01-12",
      hoursAccrued: 15,
      expiryDate: "2026-01-12",
      expired: false,
    });

    // Try to query this TOIL from Tenant B context
    const callerB = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userBId,
          tenantId: tenantBId,
          role: "staff",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const balanceB = await callerB.getBalance({});

    // Tenant B should not see Tenant A's TOIL
    expect(balanceB.balance).toBe(0);

    const historyB = await callerB.getHistory({});

    // Tenant B should have no history
    expect(historyB.history.length).toBe(0);
  });

  it("should isolate expiry across tenants", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    // Create expired TOIL in both tenants
    await db.insert(toilAccrualHistory).values([
      {
        id: crypto.randomUUID(),
        tenantId: tenantAId,
        userId: userAId,
        weekEnding: "2024-12-01",
        hoursAccrued: 10,
        expiryDate: pastDate.toISOString().split("T")[0],
        expired: false,
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenantBId,
        userId: userBId,
        weekEnding: "2024-12-01",
        hoursAccrued: 15,
        expiryDate: pastDate.toISOString().split("T")[0],
        expired: false,
      },
    ]);

    // Run expiry for Tenant A only
    const callerA = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          role: "admin",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const resultA = await callerA.markExpiredToil();

    expect(resultA.markedExpired).toBe(1);
    expect(resultA.usersAffected).toBe(1);

    // Verify only Tenant A TOIL is expired
    const expiredA = await db
      .select()
      .from(toilAccrualHistory)
      .where(
        and(
          eq(toilAccrualHistory.tenantId, tenantAId),
          eq(toilAccrualHistory.expired, true),
        ),
      );

    expect(expiredA.length).toBe(1);

    // Verify Tenant B TOIL is unchanged
    const expiredB = await db
      .select()
      .from(toilAccrualHistory)
      .where(
        and(
          eq(toilAccrualHistory.tenantId, tenantBId),
          eq(toilAccrualHistory.expired, true),
        ),
      );

    expect(expiredB.length).toBe(0);

    // Now expire Tenant B
    const callerB = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userBId,
          tenantId: tenantBId,
          role: "admin",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const resultB = await callerB.markExpiredToil();

    expect(resultB.markedExpired).toBe(1);
    expect(resultB.usersAffected).toBe(1);
  });

  it("should not expose TOIL from other tenants in getExpiringToil", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    // Create expiring TOIL in both tenants
    await db.insert(toilAccrualHistory).values([
      {
        id: crypto.randomUUID(),
        tenantId: tenantAId,
        userId: userAId,
        weekEnding: "2025-01-01",
        hoursAccrued: 7.5,
        expiryDate: futureDate.toISOString().split("T")[0],
        expired: false,
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenantBId,
        userId: userBId,
        weekEnding: "2025-01-01",
        hoursAccrued: 10,
        expiryDate: futureDate.toISOString().split("T")[0],
        expired: false,
      },
    ]);

    // Query expiring TOIL from Tenant A
    const callerA = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userAId,
          tenantId: tenantAId,
          role: "staff",
          email: "usera@example.com",
          firstName: "User",
          lastName: "A",
        },
      }),
    );

    const expiringA = await callerA.getExpiringToil({ userId: userAId });

    // Should only see Tenant A TOIL
    expect(expiringA.expiringToil.length).toBe(1);
    expect(expiringA.totalExpiringHours).toBe(7.5);

    // Query from Tenant B
    const callerB = createCaller(
      toilRouter,
      createMockContext({
        authContext: {
          userId: userBId,
          tenantId: tenantBId,
          role: "staff",
          email: "userb@example.com",
          firstName: "User",
          lastName: "B",
        },
      }),
    );

    const expiringB = await callerB.getExpiringToil({ userId: userBId });

    // Should only see Tenant B TOIL
    expect(expiringB.expiringToil.length).toBe(1);
    expect(expiringB.totalExpiringHours).toBe(10);
  });
});
