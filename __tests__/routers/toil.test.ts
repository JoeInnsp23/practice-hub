/**
 * TOIL Router Integration Tests
 *
 * Integration-level tests for the TOIL (Time Off In Lieu) tRPC router.
 * Tests verify TOIL accrual calculations, balance tracking, expiry logic, and multi-tenant isolation.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { toilRouter } from "@/app/server/routers/toil";
import { db } from "@/lib/db";
import { leaveBalances, toilAccrualHistory } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/toil.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof toilRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };
  let testUserId: string;
  let testTenantId: string;

  beforeEach(async () => {
    // Create test tenant and user for each test
    testTenantId = await createTestTenant();
    testUserId = await createTestUser(testTenantId, { role: "admin" });

    tracker.tenants?.push(testTenantId);
    tracker.users?.push(testUserId);

    // Create mock context with test tenant and user
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
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(tracker);
  });

  describe("accrueToil", () => {
    it("should accrue TOIL when logged hours exceed contracted hours", async () => {
      const weekEnding = new Date().toISOString().split("T")[0];

      const result = await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 40,
        contractedHours: 37.5,
      });

      expect(result.accrued).toBe(true);
      expect(result.hoursAccrued).toBe(2.5); // 40 - 37.5 = 2.5 hours overtime
      expect(result.accrualId).toBeDefined();
      expect(result.expiryDate).toBeDefined();

      // Verify accrual history record was created
      const [historyRecord] = await db
        .select()
        .from(toilAccrualHistory)
        .where(eq(toilAccrualHistory.id, result.accrualId))
        .limit(1);

      expect(historyRecord).toBeDefined();
      expect(historyRecord.hoursAccrued).toBe(2.5);
      expect(historyRecord.userId).toBe(testUserId);
      expect(historyRecord.tenantId).toBe(testTenantId);
    });

    it("should not accrue TOIL when logged hours equal contracted hours", async () => {
      const weekEnding = new Date().toISOString().split("T")[0];

      const result = await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 37.5,
        contractedHours: 37.5,
      });

      expect(result.accrued).toBe(false);
      expect(result.hoursAccrued).toBe(0);
      expect(result.message).toBe("No overtime hours to accrue");
    });

    it("should not accrue TOIL when logged hours are less than contracted", async () => {
      const weekEnding = new Date().toISOString().split("T")[0];

      const result = await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 30,
        contractedHours: 37.5,
      });

      expect(result.accrued).toBe(false);
      expect(result.hoursAccrued).toBe(0);
    });

    it("should update existing leave balance when accruing TOIL", async () => {
      const currentYear = new Date().getFullYear();
      const weekEnding = new Date().toISOString().split("T")[0];

      // Create initial leave balance
      await db.insert(leaveBalances).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        year: currentYear,
        annualEntitlement: 25,
        annualUsed: 0,
        sickUsed: 0,
        toilBalance: 5.0, // Existing 5 hours TOIL
        carriedOver: 0,
      });

      // Accrue 2.5 more hours
      await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 40,
        contractedHours: 37.5,
      });

      // Check updated balance
      const [updatedBalance] = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, testUserId),
            eq(leaveBalances.tenantId, testTenantId),
            eq(leaveBalances.year, currentYear),
          ),
        )
        .limit(1);

      expect(updatedBalance.toilBalance).toBe(7.5); // 5 + 2.5
    });

    it("should create new leave balance if none exists", async () => {
      const weekEnding = new Date().toISOString().split("T")[0];

      await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 40,
        contractedHours: 37.5,
      });

      const currentYear = new Date().getFullYear();
      const [balance] = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, testUserId),
            eq(leaveBalances.tenantId, testTenantId),
            eq(leaveBalances.year, currentYear),
          ),
        )
        .limit(1);

      expect(balance).toBeDefined();
      expect(balance.toilBalance).toBe(2.5);
      expect(balance.annualEntitlement).toBe(25); // UK standard
    });

    it("should set expiry date to 6 months from accrual", async () => {
      const weekEnding = new Date().toISOString().split("T")[0];

      const result = await caller.accrueToil({
        userId: testUserId,
        weekEnding,
        loggedHours: 40,
        contractedHours: 37.5,
      });

      const [accrual] = await db
        .select()
        .from(toilAccrualHistory)
        .where(eq(toilAccrualHistory.id, result.accrualId))
        .limit(1);

      if (!accrual.expiryDate) {
        throw new Error("Expected expiryDate to be defined");
      }
      const expiryDate = new Date(accrual.expiryDate);
      const weekEndingDate = new Date(weekEnding);
      const expectedExpiry = new Date(weekEndingDate);
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 6);

      expect(expiryDate.getMonth()).toBe(expectedExpiry.getMonth());
    });
  });

  describe("getBalance", () => {
    it("should return current TOIL balance for user", async () => {
      const currentYear = new Date().getFullYear();

      // Create leave balance
      await db.insert(leaveBalances).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        year: currentYear,
        annualEntitlement: 25,
        annualUsed: 0,
        sickUsed: 0,
        toilBalance: 14.5,
        carriedOver: 0,
      });

      const result = await caller.getBalance({
        userId: testUserId,
      });

      expect(result.balance).toBe(14.5);
      expect(result.balanceInDays).toBe("1.9"); // 14.5 / 7.5 = 1.9333... rounded to 1.9
      expect(result.userId).toBe(testUserId);
    });

    it("should return zero balance if no leave balance exists", async () => {
      const result = await caller.getBalance({
        userId: testUserId,
      });

      expect(result.balance).toBe(0);
      expect(result.balanceInDays).toBe("0.0");
    });

    it("should default to current user if userId not provided", async () => {
      const currentYear = new Date().getFullYear();

      await db.insert(leaveBalances).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        year: currentYear,
        annualEntitlement: 25,
        annualUsed: 0,
        sickUsed: 0,
        toilBalance: 7.5,
        carriedOver: 0,
      });

      const result = await caller.getBalance({});

      expect(result.userId).toBe(testUserId);
      expect(result.balance).toBe(7.5);
      expect(result.balanceInDays).toBe("1.0"); // 7.5 / 7.5 = 1.0
    });
  });

  describe("getHistory", () => {
    it("should return TOIL accrual history for user", async () => {
      const weekEnding1 = new Date();
      weekEnding1.setDate(weekEnding1.getDate() - 14);
      const weekEnding2 = new Date();
      weekEnding2.setDate(weekEnding2.getDate() - 7);

      // Create two accrual records
      await db.insert(toilAccrualHistory).values([
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          timesheetId: null,
          weekEnding: weekEnding1.toISOString().split("T")[0],
          hoursAccrued: 2.0,
          contractedHours: 37.5,
          loggedHours: 39.5,
          accrualDate: weekEnding1,
          expiryDate: new Date(
            weekEnding1.getTime() + 6 * 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0],
          expired: false,
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          timesheetId: null,
          weekEnding: weekEnding2.toISOString().split("T")[0],
          hoursAccrued: 3.5,
          contractedHours: 37.5,
          loggedHours: 41.0,
          accrualDate: weekEnding2,
          expiryDate: new Date(
            weekEnding2.getTime() + 6 * 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0],
          expired: false,
        },
      ]);

      const result = await caller.getHistory({
        userId: testUserId,
        limit: 10,
        offset: 0,
      });

      expect(result.history).toHaveLength(2);
      expect(result.history[0].hoursAccrued).toBe(3.5); // Most recent first (desc order)
      expect(result.history[1].hoursAccrued).toBe(2.0);
      expect(result.userId).toBe(testUserId);
    });

    it("should respect pagination limits", async () => {
      const weekEnding = new Date();

      // Create 5 accrual records
      for (let i = 0; i < 5; i++) {
        const date = new Date(weekEnding);
        date.setDate(date.getDate() - i * 7);

        const expiryDate = new Date(date);
        expiryDate.setMonth(expiryDate.getMonth() + 6);

        await db.insert(toilAccrualHistory).values({
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          timesheetId: null,
          weekEnding: date.toISOString().split("T")[0],
          hoursAccrued: 2.0 + i,
          contractedHours: 37.5,
          loggedHours: 39.5 + i,
          accrualDate: date,
          expiryDate: expiryDate.toISOString().split("T")[0],
          expired: false,
        });
      }

      const result = await caller.getHistory({
        userId: testUserId,
        limit: 3,
        offset: 0,
      });

      expect(result.history).toHaveLength(3);
    });
  });

  describe("getExpiringToil", () => {
    it("should return TOIL expiring within specified days", async () => {
      const today = new Date();
      const expiringDate = new Date(today);
      expiringDate.setDate(expiringDate.getDate() + 15); // Expires in 15 days

      await db.insert(toilAccrualHistory).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        timesheetId: null,
        weekEnding: today.toISOString().split("T")[0],
        hoursAccrued: 7.5,
        contractedHours: 37.5,
        loggedHours: 45.0,
        accrualDate: today,
        expiryDate: expiringDate.toISOString().split("T")[0],
        expired: false,
      });

      const result = await caller.getExpiringToil({
        userId: testUserId,
        daysAhead: 30,
      });

      expect(result.expiringToil).toHaveLength(1);
      expect(result.totalExpiringHours).toBe(7.5);
      expect(result.totalExpiringDays).toBe("1.0"); // 7.5 / 7.5 = 1.0
    });

    it("should not return already expired TOIL", async () => {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 10); // Already expired

      await db.insert(toilAccrualHistory).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        timesheetId: null,
        weekEnding: today.toISOString().split("T")[0],
        hoursAccrued: 7.5,
        contractedHours: 37.5,
        loggedHours: 45.0,
        accrualDate: today,
        expiryDate: pastDate.toISOString().split("T")[0],
        expired: false,
      });

      const result = await caller.getExpiringToil({
        userId: testUserId,
        daysAhead: 30,
      });

      expect(result.expiringToil).toHaveLength(0);
      expect(result.totalExpiringHours).toBe(0);
    });

    it("should not return TOIL expiring beyond the specified days", async () => {
      const today = new Date();
      const farFutureDate = new Date(today);
      farFutureDate.setDate(farFutureDate.getDate() + 60); // Expires in 60 days

      await db.insert(toilAccrualHistory).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        timesheetId: null,
        weekEnding: today.toISOString().split("T")[0],
        hoursAccrued: 7.5,
        contractedHours: 37.5,
        loggedHours: 45.0,
        accrualDate: today,
        expiryDate: farFutureDate.toISOString().split("T")[0],
        expired: false,
      });

      const result = await caller.getExpiringToil({
        userId: testUserId,
        daysAhead: 30, // Looking ahead only 30 days
      });

      expect(result.expiringToil).toHaveLength(0);
    });
  });

  describe("markExpiredToil", () => {
    it("should mark expired TOIL records as expired", async () => {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 10); // 10 days past expiry

      const [accrual] = await db
        .insert(toilAccrualHistory)
        .values({
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          timesheetId: null,
          weekEnding: today.toISOString().split("T")[0],
          hoursAccrued: 7.5,
          contractedHours: 37.5,
          loggedHours: 45.0,
          accrualDate: today,
          expiryDate: pastDate.toISOString().split("T")[0],
          expired: false,
        })
        .returning();

      const result = await caller.markExpiredToil();

      expect(result.markedExpired).toBe(1);
      expect(result.expiredRecords[0].hoursExpired).toBe(7.5);

      // Verify record was marked as expired
      const [updated] = await db
        .select()
        .from(toilAccrualHistory)
        .where(eq(toilAccrualHistory.id, accrual.id))
        .limit(1);

      expect(updated.expired).toBe(true);
    });

    it("should not mark future TOIL as expired", async () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30); // Expires in 30 days

      await db.insert(toilAccrualHistory).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId: testUserId,
        timesheetId: null,
        weekEnding: today.toISOString().split("T")[0],
        hoursAccrued: 7.5,
        contractedHours: 37.5,
        loggedHours: 45.0,
        accrualDate: today,
        expiryDate: futureDate.toISOString().split("T")[0],
        expired: false,
      });

      const result = await caller.markExpiredToil();

      expect(result.markedExpired).toBe(0);
    });

    it("should only mark TOIL for current tenant", async () => {
      // Create another tenant
      const otherTenantId = await createTestTenant();
      const otherUserId = await createTestUser(otherTenantId, {
        role: "admin",
      });
      tracker.tenants?.push(otherTenantId);
      tracker.users?.push(otherUserId);

      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 10);

      // Create expired TOIL for other tenant
      await db.insert(toilAccrualHistory).values({
        id: crypto.randomUUID(),
        tenantId: otherTenantId,
        userId: otherUserId,
        timesheetId: null,
        weekEnding: today.toISOString().split("T")[0],
        hoursAccrued: 7.5,
        contractedHours: 37.5,
        loggedHours: 45.0,
        accrualDate: today,
        expiryDate: pastDate.toISOString().split("T")[0],
        expired: false,
      });

      const result = await caller.markExpiredToil();

      // Should not mark other tenant's TOIL
      expect(result.markedExpired).toBe(0);
    });
  });

  describe("Multi-tenant isolation", () => {
    it("should only return TOIL balance for current tenant", async () => {
      // Create another tenant with a user
      const otherTenantId = await createTestTenant();
      const otherUserId = await createTestUser(otherTenantId, {
        role: "admin",
      });
      tracker.tenants?.push(otherTenantId);
      tracker.users?.push(otherUserId);

      const currentYear = new Date().getFullYear();

      // Create balances for both tenants
      await db.insert(leaveBalances).values([
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          year: currentYear,
          annualEntitlement: 25,
          annualUsed: 0,
          sickUsed: 0,
          toilBalance: 7.5,
          carriedOver: 0,
        },
        {
          id: crypto.randomUUID(),
          tenantId: otherTenantId,
          userId: otherUserId,
          year: currentYear,
          annualEntitlement: 25,
          annualUsed: 0,
          sickUsed: 0,
          toilBalance: 15.0, // Different balance
          carriedOver: 0,
        },
      ]);

      const result = await caller.getBalance({ userId: testUserId });

      // Should only see own tenant's balance
      expect(result.balance).toBe(7.5);
      expect(result.userId).toBe(testUserId);
    });

    it("should only return TOIL history for current tenant", async () => {
      // Create another tenant
      const otherTenantId = await createTestTenant();
      const otherUserId = await createTestUser(otherTenantId, {
        role: "admin",
      });
      tracker.tenants?.push(otherTenantId);
      tracker.users?.push(otherUserId);

      const today = new Date();

      // Create history for both tenants
      const expiryDate = new Date(today);
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      await db.insert(toilAccrualHistory).values([
        {
          id: crypto.randomUUID(),
          tenantId: testTenantId,
          userId: testUserId,
          timesheetId: null,
          weekEnding: today.toISOString().split("T")[0],
          hoursAccrued: 2.0,
          contractedHours: 37.5,
          loggedHours: 39.5,
          accrualDate: today,
          expiryDate: expiryDate.toISOString().split("T")[0],
          expired: false,
        },
        {
          id: crypto.randomUUID(),
          tenantId: otherTenantId,
          userId: otherUserId,
          timesheetId: null,
          weekEnding: today.toISOString().split("T")[0],
          hoursAccrued: 5.0,
          contractedHours: 37.5,
          loggedHours: 42.5,
          accrualDate: today,
          expiryDate: expiryDate.toISOString().split("T")[0],
          expired: false,
        },
      ]);

      const result = await caller.getHistory({ userId: testUserId, limit: 10 });

      // Should only see own tenant's history
      expect(result.history).toHaveLength(1);
      expect(result.history[0].hoursAccrued).toBe(2.0);
    });
  });
});
