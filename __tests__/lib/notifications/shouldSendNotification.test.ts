/**
 * shouldSendNotification Helper Tests
 *
 * Integration-level tests for the notification preference checker helper.
 * Tests verify that user notification preferences are correctly enforced.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { shouldSendNotification } from "@/lib/notifications/check-preferences";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../../helpers/factories";

describe("lib/notifications/check-preferences.ts (Integration)", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
  };
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test tenant and user for each test
    tenantId = await createTestTenant();
    userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe("shouldSendNotification", () => {
    it("should return true when no user settings exist (default behavior)", async () => {
      // No settings created, should default to true
      const result = await shouldSendNotification(
        userId,
        "task_assigned",
        "in_app",
      );

      expect(result).toBe(true);
    });

    it("should return false when global email channel is disabled", async () => {
      // Create settings with email notifications disabled
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        emailNotifications: false,
        inAppNotifications: true,
        digestEmail: "daily",
        notifTaskAssigned: true, // Specific preference is true
        notifTaskMention: true,
        notifTaskReassigned: true,
        notifDeadlineApproaching: true,
        notifApprovalNeeded: true,
        notifClientMessage: true,
        theme: "system",
        language: "en",
        timezone: "Europe/London",
      });

      const result = await shouldSendNotification(
        userId,
        "task_assigned",
        "email",
      );

      expect(result).toBe(false);
    });

    it("should return false when global in_app channel is disabled", async () => {
      // Create settings with in-app notifications disabled
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        emailNotifications: true,
        inAppNotifications: false,
        digestEmail: "daily",
        notifTaskAssigned: true, // Specific preference is true
        notifTaskMention: true,
        notifTaskReassigned: true,
        notifDeadlineApproaching: true,
        notifApprovalNeeded: true,
        notifClientMessage: true,
        theme: "system",
        language: "en",
        timezone: "Europe/London",
      });

      const result = await shouldSendNotification(
        userId,
        "task_assigned",
        "in_app",
      );

      expect(result).toBe(false);
    });

    it("should return false when specific notification preference is disabled", async () => {
      // Create settings with task_mention disabled
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        digestEmail: "daily",
        notifTaskAssigned: true,
        notifTaskMention: false, // Disabled
        notifTaskReassigned: true,
        notifDeadlineApproaching: true,
        notifApprovalNeeded: true,
        notifClientMessage: true,
        theme: "system",
        language: "en",
        timezone: "Europe/London",
      });

      const result = await shouldSendNotification(
        userId,
        "task_mention",
        "in_app",
      );

      expect(result).toBe(false);
    });

    it("should return true when all checks pass (global and specific)", async () => {
      // Create settings with everything enabled
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        digestEmail: "daily",
        notifTaskAssigned: true,
        notifTaskMention: true,
        notifTaskReassigned: true,
        notifDeadlineApproaching: true,
        notifApprovalNeeded: true,
        notifClientMessage: true,
        theme: "system",
        language: "en",
        timezone: "Europe/London",
      });

      const result = await shouldSendNotification(
        userId,
        "task_assigned",
        "in_app",
      );

      expect(result).toBe(true);
    });

    it("should handle all 6 notification types correctly", async () => {
      // Create settings with mixed preferences
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        digestEmail: "daily",
        notifTaskAssigned: true,
        notifTaskMention: false,
        notifTaskReassigned: true,
        notifDeadlineApproaching: false,
        notifApprovalNeeded: true,
        notifClientMessage: false,
        theme: "system",
        language: "en",
        timezone: "Europe/London",
      });

      // Test each notification type
      expect(
        await shouldSendNotification(userId, "task_assigned", "in_app"),
      ).toBe(true);
      expect(
        await shouldSendNotification(userId, "task_mention", "in_app"),
      ).toBe(false);
      expect(
        await shouldSendNotification(userId, "task_reassigned", "in_app"),
      ).toBe(true);
      expect(
        await shouldSendNotification(userId, "deadline_approaching", "in_app"),
      ).toBe(false);
      expect(
        await shouldSendNotification(userId, "approval_needed", "in_app"),
      ).toBe(true);
      expect(
        await shouldSendNotification(userId, "client_message", "in_app"),
      ).toBe(false);
    });
  });
});
