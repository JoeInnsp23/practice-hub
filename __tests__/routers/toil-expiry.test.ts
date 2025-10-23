import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  leaveBalances,
  toilAccrualHistory,
} from "@/lib/db/schema";
import { toilRouter } from "@/app/server/routers/toil";
import { eq } from "drizzle-orm";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

describe("TOIL Expiry Policy", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof toilRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };
  let testUserId: string;
  let testTenantId: string;

  beforeEach(async () => {
    // Create test tenant and user
    testTenantId = await createTestTenant();
    testUserId = await createTestUser(testTenantId, { role: "admin" });

    tracker.tenants?.push(testTenantId);
    tracker.users?.push(testUserId);

    ctx = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    caller = createCaller(toilRouter, ctx);

    // Create leave balance
    await db.insert(leaveBalances).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      year: new Date().getFullYear(),
      annualEntitlement: 25,
      annualUsed: 0,
      sickUsed: 0,
      toilBalance: 30, // 30 hours = 4 days
      carriedOver: 0,
    });
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  it("should identify TOIL expiring within 30 days", async () => {
    // Create TOIL that expires in 15 days
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + 15);

    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weekEnding: "2025-01-15",
      hoursAccrued: 7.5,
      expiryDate: expiryDate.toISOString().split("T")[0],
      expired: false,
    });

    const result = await caller.getExpiringToil({ userId: testUserId });

    expect(result.expiringToil.length).toBe(1);
    expect(result.totalExpiringHours).toBe(7.5);
    expect(result.totalExpiringDays).toBe("1.0");
  });

  it("should not include TOIL expiring beyond 30 days", async () => {
    // Create TOIL that expires in 45 days
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + 45);

    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weekEnding: "2025-01-15",
      hoursAccrued: 7.5,
      expiryDate: expiryDate.toISOString().split("T")[0],
      expired: false,
    });

    const result = await caller.getExpiringToil({ userId: testUserId });

    expect(result.expiringToil.length).toBe(0);
    expect(result.totalExpiringHours).toBe(0);
  });

  it("should mark expired TOIL and deduct from balance", async () => {
    // Create expired TOIL (expiry date in the past)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weekEnding: "2024-12-15",
      hoursAccrued: 10, // 10 hours expired
      expiryDate: pastDate.toISOString().split("T")[0],
      expired: false,
    });

    // Get initial balance
    const [initialBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(initialBalance.toilBalance).toBe(30);

    // Mark expired TOIL
    const result = await caller.markExpiredToil();

    expect(result.markedExpired).toBe(1);
    expect(result.usersAffected).toBe(1);
    expect(result.expiredRecords[0].hoursExpired).toBe(10);

    // Verify balance was deducted
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(20); // 30 - 10 = 20
  });

  it("should handle multiple expired TOIL records for same user", async () => {
    const pastDate1 = new Date();
    pastDate1.setDate(pastDate1.getDate() - 10);

    const pastDate2 = new Date();
    pastDate2.setDate(pastDate2.getDate() - 20);

    // Create 2 expired TOIL records
    await db.insert(toilAccrualHistory).values([
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekEnding: "2024-12-01",
        hoursAccrued: 7.5,
        expiryDate: pastDate1.toISOString().split("T")[0],
        expired: false,
      },
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekEnding: "2024-11-15",
        hoursAccrued: 5.0,
        expiryDate: pastDate2.toISOString().split("T")[0],
        expired: false,
      },
    ]);

    // Mark expired TOIL
    const result = await caller.markExpiredToil();

    expect(result.markedExpired).toBe(2);
    expect(result.usersAffected).toBe(1);

    // Verify total hours deducted (7.5 + 5.0 = 12.5)
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(17.5); // 30 - 12.5 = 17.5
  });

  it("should not deduct balance below zero", async () => {
    // Set balance to only 5 hours
    await db
      .update(leaveBalances)
      .set({ toilBalance: 5 })
      .where(eq(leaveBalances.userId, testUserId));

    // Create expired TOIL of 10 hours (more than available)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weekEnding: "2024-12-15",
      hoursAccrued: 10,
      expiryDate: pastDate.toISOString().split("T")[0],
      expired: false,
    });

    // Mark expired TOIL
    await caller.markExpiredToil();

    // Verify balance doesn't go below 0
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(0); // GREATEST(0, 5 - 10) = 0
  });

  it("should not mark already expired TOIL records", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    // Create TOIL that is already marked as expired
    await db.insert(toilAccrualHistory).values({
      id: crypto.randomUUID(),
      tenantId: testTenantId,
      userId: testUserId,
      weekEnding: "2024-12-15",
      hoursAccrued: 10,
      expiryDate: pastDate.toISOString().split("T")[0],
      expired: true, // Already expired
    });

    // Get initial balance
    const [initialBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    // Mark expired TOIL
    const result = await caller.markExpiredToil();

    expect(result.markedExpired).toBe(0); // Should not mark already expired records

    // Verify balance was not changed
    const [updatedBalance] = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.userId, testUserId))
      .limit(1);

    expect(updatedBalance.toilBalance).toBe(initialBalance.toilBalance);
  });

  it("should correctly calculate expiring TOIL for multiple records", async () => {
    const today = new Date();

    // Create multiple TOIL records with different expiry dates
    const expiry1 = new Date(today);
    expiry1.setDate(expiry1.getDate() + 10);

    const expiry2 = new Date(today);
    expiry2.setDate(expiry2.getDate() + 25);

    const expiry3 = new Date(today);
    expiry3.setDate(expiry3.getDate() + 40); // Beyond 30 days

    await db.insert(toilAccrualHistory).values([
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekEnding: "2025-01-01",
        hoursAccrued: 5.0,
        expiryDate: expiry1.toISOString().split("T")[0],
        expired: false,
      },
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekEnding: "2025-01-08",
        hoursAccrued: 7.5,
        expiryDate: expiry2.toISOString().split("T")[0],
        expired: false,
      },
      {
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        weekEnding: "2025-01-15",
        hoursAccrued: 10.0,
        expiryDate: expiry3.toISOString().split("T")[0],
        expired: false,
      },
    ]);

    const result = await caller.getExpiringToil({ userId: testUserId });

    // Should only include first 2 (within 30 days)
    expect(result.expiringToil.length).toBe(2);
    expect(result.totalExpiringHours).toBe(12.5); // 5.0 + 7.5
    expect(result.totalExpiringDays).toBe("1.7"); // 12.5 / 7.5 = 1.666...
  });
});
