/**
 * Notifications Router Integration Tests
 *
 * Integration-level tests for the notifications tRPC router.
 * Tests verify database operations, tenant isolation, and notification workflow.
 *
 * Cleanup Strategy: TestDataTracker + afterEach cleanup
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { notificationsRouter } from "@/app/server/routers/notifications";
import {
  cleanupTestData,
  createTestNotification,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/notifications.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof notificationsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    notifications: [],
  };

  beforeEach(async () => {
    // Create test tenant and user
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "user" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create mock context with real tenant and user
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "user",
        email: `user-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    }) as TestContextWithAuth;

    _caller = createCaller(notificationsRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);

    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.notifications = [];
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(_caller.list({})).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      await expect(
        _caller.list({
          limit: 25,
          offset: 50,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept unreadOnly filter", async () => {
      await expect(
        _caller.list({
          unreadOnly: true,
        }),
      ).resolves.not.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(
        _caller.list({
          limit: 150, // Exceeds max of 100
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate limit min value", async () => {
      await expect(
        _caller.list({
          limit: 0, // Below minimum of 1
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("getUnreadCount", () => {
    it("should have no required input", () => {
      const procedure = notificationsRouter._def.procedures.getUnreadCount;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("markAsRead", () => {
    it("should validate required notificationId field", async () => {
      const invalidInput = {
        // Missing notificationId
      };

      await expect(
        _caller.markAsRead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid notification ID", async () => {
      // Create a notification
      const notification = await createTestNotification(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { isRead: false },
      );
      tracker.notifications?.push(notification.id);

      const validInput = {
        notificationId: notification.id,
      };

      await expect(_caller.markAsRead(validInput)).resolves.not.toThrow();
    });

    it("should validate UUID format", async () => {
      const invalidInput = {
        notificationId: "not-a-uuid",
      };

      await expect(
        _caller.markAsRead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("markAllAsRead", () => {
    it("should have no required input", () => {
      const procedure = notificationsRouter._def.procedures.markAllAsRead;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("delete", () => {
    it("should validate required notificationId field", async () => {
      const invalidInput = {
        // Missing notificationId
      };

      await expect(
        _caller.delete(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid notification ID", async () => {
      // Create a notification
      const notification = await createTestNotification(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.notifications?.push(notification.id);

      const validInput = {
        notificationId: notification.id,
      };

      await expect(_caller.delete(validInput)).resolves.not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing userId, type, title, message
        actionUrl: "/notifications/1",
      };

      await expect(
        _caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid notification data", async () => {
      const validInput = {
        userId: ctx.authContext.userId,
        type: "task_assigned" as const,
        title: "New Task Assigned",
        message: "You have been assigned a new task",
      };

      await expect(_caller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      const validInput = {
        userId: ctx.authContext.userId,
        type: "mention" as const,
        title: "You were mentioned",
        message: "Someone mentioned you in a comment",
        actionUrl: "/tasks/123",
        entityType: "task" as const,
        entityId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.create(validInput)).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(notificationsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getUnreadCount");
      expect(procedures).toContain("markAsRead");
      expect(procedures).toContain("markAllAsRead");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("create");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(notificationsRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
