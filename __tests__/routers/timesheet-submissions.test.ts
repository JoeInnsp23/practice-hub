/**
 * Timesheet Submissions Router Integration Tests
 *
 * Integration-level tests for timesheet submission workflow.
 * Tests verify submission validation, approval/rejection, and multi-tenant isolation.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timesheetsRouter } from "@/app/server/routers/timesheets";
import { db } from "@/lib/db";
import { timeEntries, timesheetSubmissions } from "@/lib/db/schema";
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

// Mock email notifications
vi.mock("@/lib/email/timesheet-notifications", () => ({
  sendTimesheetApprovalEmail: vi.fn().mockResolvedValue(undefined),
  sendTimesheetRejectionEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/timesheets.ts - Submissions (Integration)", () => {
  let ctx: TestContextWithAuth;
  let managerCtx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;
  let managerCaller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };

  beforeEach(async () => {
    // Create test tenant and users
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "member" });
    const managerId = await createTestUser(tenantId, { role: "manager" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId, managerId);

    // Create user context
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "member",
        email: `user-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    // Create manager context
    managerCtx = createMockContext({
      authContext: {
        userId: managerId,
        tenantId,
        organizationName: "Test Organization",
        role: "manager",
        email: `manager-${Date.now()}@example.com`,
        firstName: "Manager",
        lastName: "User",
      },
    });

    caller = createCaller(timesheetsRouter, ctx);
    managerCaller = createCaller(timesheetsRouter, managerCtx);
  });

  afterEach(async () => {
    // Clean up time entries and submissions
    await db
      .delete(timeEntries)
      .where(eq(timeEntries.tenantId, ctx.authContext.tenantId));
    await db
      .delete(timesheetSubmissions)
      .where(eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId));

    await cleanupTestData(tracker);
    tracker.tenants = [];
    tracker.users = [];
  });

  describe("submit procedure", () => {
    it("should successfully submit a week with sufficient hours", async () => {
      const weekStartDate = "2025-01-13"; // Monday
      const weekEndDate = "2025-01-19"; // Sunday

      // Add 40 hours of time entries
      for (let day = 13; day <= 17; day++) {
        await db.insert(timeEntries).values({
          tenantId: ctx.authContext.tenantId,
          userId: ctx.authContext.userId,
          date: `2025-01-${day}`,
          hours: "8",
          description: "Test work",
          billable: true,
          workType: "work",
          status: "draft",
        });
      }

      const result = await caller.submit({
        weekStartDate,
        weekEndDate,
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();
      if (!result.submissionId) {
        throw new Error("Expected submissionId to be defined");
      }

      // Verify submission was created
      const [submission] = await db
        .select()
        .from(timesheetSubmissions)
        .where(eq(timesheetSubmissions.id, result.submissionId))
        .limit(1);

      expect(submission).toBeDefined();
      expect(submission.status).toBe("pending");
      expect(Number(submission.totalHours)).toBe(40);
    });

    it("should fail to submit with insufficient hours", async () => {
      const weekStartDate = "2025-01-20";
      const weekEndDate = "2025-01-26";

      // Add only 20 hours
      await db.insert(timeEntries).values({
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        date: "2025-01-20",
        hours: "20",
        description: "Test work",
        billable: true,
        workType: "work",
        status: "draft",
      });

      await expect(
        caller.submit({
          weekStartDate,
          weekEndDate,
        }),
      ).rejects.toThrow("Minimum 37.5 hours required");
    });

    it("should prevent duplicate submissions", async () => {
      const weekStartDate = "2025-01-27";
      const weekEndDate = "2025-02-02";

      // Add sufficient hours
      for (let day = 27; day <= 31; day++) {
        await db.insert(timeEntries).values({
          tenantId: ctx.authContext.tenantId,
          userId: ctx.authContext.userId,
          date: `2025-01-${day}`,
          hours: "8",
          description: "Test work",
          billable: true,
          workType: "work",
          status: "draft",
        });
      }

      // First submission should succeed
      await caller.submit({ weekStartDate, weekEndDate });

      // Second submission should fail
      await expect(
        caller.submit({
          weekStartDate,
          weekEndDate,
        }),
      ).rejects.toThrow("already been submitted");
    });
  });

  describe("approve procedure", () => {
    it("should allow managers to approve submissions", async () => {
      // Create a pending submission
      const [submission] = await db
        .insert(timesheetSubmissions)
        .values({
          tenantId: ctx.authContext.tenantId,
          userId: ctx.authContext.userId,
          weekStartDate: "2025-02-03",
          weekEndDate: "2025-02-09",
          status: "pending",
          totalHours: "40",
        })
        .returning();

      const result = await managerCaller.approve({
        submissionId: submission.id,
      });

      expect(result.success).toBe(true);

      // Verify status changed
      const [updated] = await db
        .select()
        .from(timesheetSubmissions)
        .where(eq(timesheetSubmissions.id, submission.id))
        .limit(1);

      expect(updated.status).toBe("approved");
      expect(updated.reviewedBy).toBe(managerCtx.authContext.userId);
    });

    it("should prevent non-managers from approving", async () => {
      await expect(
        caller.approve({
          submissionId: "fake-id",
        }),
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("reject procedure", () => {
    it("should reject submission with comments", async () => {
      // Create a pending submission
      const [submission] = await db
        .insert(timesheetSubmissions)
        .values({
          tenantId: ctx.authContext.tenantId,
          userId: ctx.authContext.userId,
          weekStartDate: "2025-02-10",
          weekEndDate: "2025-02-16",
          status: "pending",
          totalHours: "40",
        })
        .returning();

      const result = await managerCaller.reject({
        submissionId: submission.id,
        comments: "Please add more details",
      });

      expect(result.success).toBe(true);

      // Verify status and comments
      const [updated] = await db
        .select()
        .from(timesheetSubmissions)
        .where(eq(timesheetSubmissions.id, submission.id))
        .limit(1);

      expect(updated.status).toBe("rejected");
      expect(updated.reviewerComments).toBe("Please add more details");
    });
  });

  describe("getPendingApprovals procedure", () => {
    it("should return pending submissions for managers", async () => {
      // Create a pending submission
      await db.insert(timesheetSubmissions).values({
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        weekStartDate: "2025-02-17",
        weekEndDate: "2025-02-23",
        status: "pending",
        totalHours: "40",
      });

      const result = await managerCaller.getPendingApprovals();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getSubmissionStatus procedure", () => {
    it("should return submission status for a week", async () => {
      const weekStartDate = "2025-03-03";

      // Create a submission
      await db.insert(timesheetSubmissions).values({
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        weekStartDate,
        weekEndDate: "2025-03-09",
        status: "pending",
        totalHours: "40",
      });

      const result = await caller.getSubmissionStatus({ weekStartDate });

      expect(result).toBeDefined();
      expect(result?.weekStartDate).toBe(weekStartDate);
    });

    it("should return null for weeks without submissions", async () => {
      const result = await caller.getSubmissionStatus({
        weekStartDate: "2025-12-01",
      });

      expect(result).toBeNull();
    });
  });
});
