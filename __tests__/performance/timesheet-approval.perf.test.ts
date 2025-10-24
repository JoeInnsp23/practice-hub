/**
 * Performance Tests for Timesheet Approval Workflow
 * Validates AC17 performance requirements:
 * - Page load <2s with 100 pending approvals
 * - Bulk actions complete <5s
 */

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { timesheetsRouter } from "@/app/server/routers/timesheets";
import { db } from "@/lib/db";
import {
  staffCapacity,
  timeEntries,
  timesheetSubmissions,
} from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

// Mock email notifications to avoid Resend API calls in tests
vi.mock("@/lib/email/timesheet-notifications", () => ({
  sendTimesheetApprovalEmail: vi.fn().mockResolvedValue(undefined),
  sendTimesheetRejectionEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("Timesheet Approval Performance Tests (AC17)", () => {
  let _ctx: Context;
  let managerCtx: Context;
  let _caller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;
  let managerCaller: ReturnType<typeof createCaller<typeof timesheetsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
  };

  let testTenantId: string;
  let testManagerId: string;
  const testStaffIds: string[] = [];
  const submissionIds: string[] = [];

  beforeAll(async () => {
    console.log("\n⏳ Setting up performance test environment...");

    // 1. Create test tenant
    testTenantId = await createTestTenant();
    tracker.tenants?.push(testTenantId);

    // 2. Create manager user
    testManagerId = await createTestUser(testTenantId, {
      role: "manager",
      firstName: "Manager",
      lastName: "Perf",
    });
    tracker.users?.push(testManagerId);

    // 3. Create manager context
    managerCtx = createMockContext({
      authContext: {
        userId: testManagerId,
        tenantId: testTenantId,
        organizationName: "Performance Test Firm",
        role: "manager",
        email: `manager-perf-${Date.now()}@example.com`,
        firstName: "Manager",
        lastName: "Perf",
      },
    });

    managerCaller = createCaller(timesheetsRouter, managerCtx);

    // 4. Create 100 staff users
    console.log(
      "⏳ Creating 100 staff members with pending timesheet submissions...",
    );
    for (let i = 0; i < 100; i++) {
      const userId = await createTestUser(testTenantId, {
        role: "staff",
        firstName: `Staff${i}`,
        lastName: `User${i}`,
      });
      testStaffIds.push(userId);
      tracker.users?.push(userId);

      // Create staff capacity
      await db.insert(staffCapacity).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        userId,
        weeklyHours: 37.5,
        effectiveFrom: "2025-01-01",
      });

      // Create time entries for the week
      const weekStartDate = "2025-01-06";
      for (let day = 0; day < 5; day++) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split("T")[0];

        await db.insert(timeEntries).values({
          tenantId: testTenantId,
          userId,
          date: dateStr,
          hours: "7.5",
          billable: true,
        });
      }

      // Create pending submission
      const [submission] = await db
        .insert(timesheetSubmissions)
        .values({
          tenantId: testTenantId,
          userId,
          weekStartDate: "2025-01-06",
          weekEndDate: "2025-01-12",
          status: "pending",
          totalHours: "37.5",
          submittedAt: new Date(),
        })
        .returning();
      submissionIds.push(submission.id);
    }

    console.log(
      `✓ Performance test setup complete: 100 staff, 100 pending submissions, tenant ${testTenantId}`,
    );
  });

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("AC17.1: Should load 100 pending approvals in < 2 seconds", async () => {
    console.log("\n📊 Testing Approvals Page Load Performance (AC17.1)...");

    // Start performance timer
    const startTime = performance.now();

    // Execute getPendingApprovals query (simulates page load)
    const result = await managerCaller.getPendingApprovals();

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000; // Convert to seconds

    // Log results
    console.log(`\n📊 Approvals Page Load Performance:`);
    console.log(`   Pending submissions: ${result.length}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per submission: ${(executionTime / result.length).toFixed(4)}s`,
    );
    console.log(
      `   Status: ${executionTime < 2 ? "✅ PASS" : "❌ FAIL"} (AC17 requirement: <2s)\n`,
    );

    // Assertions
    expect(result).toHaveLength(100);
    expect(executionTime).toBeLessThan(2.0); // AC17 requirement

    // Verify data structure
    expect(
      result.every((s: (typeof result)[0]) => s.status === "pending"),
    ).toBe(true);
    expect(
      result.every((s: (typeof result)[0]) => Number(s.totalHours) === 37.5),
    ).toBe(true); // Handle string or number
  }, 15000); // 15 second timeout

  it("AC17.2: Should bulk approve 50 submissions in < 5 seconds", async () => {
    console.log("\n📊 Testing Bulk Approval Performance (AC17.2)...");

    // Select first 50 submissions for bulk approval
    const submissionIdsToApprove = submissionIds.slice(0, 50);

    // Start performance timer
    const startTime = performance.now();

    // Execute bulk approval
    await managerCaller.bulkApprove({
      submissionIds: submissionIdsToApprove,
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    // Log results
    console.log(`\n⚡ Bulk Approval Performance:`);
    console.log(`   Submissions approved: ${submissionIdsToApprove.length}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per submission: ${(executionTime / submissionIdsToApprove.length).toFixed(4)}s`,
    );
    console.log(
      `   Status: ${executionTime < 5 ? "✅ PASS" : "❌ FAIL"} (AC17 requirement: <5s)\n`,
    );

    // Assertions
    expect(executionTime).toBeLessThan(5.0); // AC17 requirement

    // Verify approvals succeeded
    const approvedSubmissions = await db.query.timesheetSubmissions.findMany({
      where: (table, { inArray }) => inArray(table.id, submissionIdsToApprove),
    });

    expect(approvedSubmissions.every((s) => s.status === "approved")).toBe(
      true,
    );
    expect(
      approvedSubmissions.every((s) => s.reviewedBy === testManagerId),
    ).toBe(true);
    expect(approvedSubmissions.every((s) => s.reviewedAt !== null)).toBe(true);
  }, 15000); // 15 second timeout

  it("AC17.3: Should bulk reject 50 submissions in < 5 seconds", async () => {
    console.log("\n📊 Testing Bulk Rejection Performance (AC17.3)...");

    // Select last 50 submissions for bulk rejection
    const submissionIdsToReject = submissionIds.slice(50, 100);

    // Start performance timer
    const startTime = performance.now();

    // Execute bulk rejection
    await managerCaller.bulkReject({
      submissionIds: submissionIdsToReject,
      comments: "Performance test bulk rejection",
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    // Log results
    console.log(`\n⚡ Bulk Rejection Performance:`);
    console.log(`   Submissions rejected: ${submissionIdsToReject.length}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per submission: ${(executionTime / submissionIdsToReject.length).toFixed(4)}s`,
    );
    console.log(
      `   Status: ${executionTime < 5 ? "✅ PASS" : "❌ FAIL"} (AC17 requirement: <5s)\n`,
    );

    // Assertions
    expect(executionTime).toBeLessThan(5.0); // AC17 requirement

    // Verify rejections succeeded
    const rejectedSubmissions = await db.query.timesheetSubmissions.findMany({
      where: (table, { inArray }) => inArray(table.id, submissionIdsToReject),
    });

    expect(rejectedSubmissions.every((s) => s.status === "rejected")).toBe(
      true,
    );
    expect(
      rejectedSubmissions.every((s) => s.reviewedBy === testManagerId),
    ).toBe(true);
    expect(rejectedSubmissions.every((s) => s.reviewerComments !== null)).toBe(
      true,
    );
  }, 15000); // 15 second timeout
});
