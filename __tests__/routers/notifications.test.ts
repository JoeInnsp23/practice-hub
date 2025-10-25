/**
 * Notifications Router Tests
 *
 * Tests for the notifications tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationsRouter } from "@/app/server/routers/notifications";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

describe("app/server/routers/notifications.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof notificationsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(notificationsRouter, ctx);
    vi.clearAllMocks();
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
      const validInput = {
        notificationId: "550e8400-e29b-41d4-a716-446655440000",
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
      const validInput = {
        notificationId: "550e8400-e29b-41d4-a716-446655440000",
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
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "task_assigned",
        title: "New Task Assigned",
        message: "You have been assigned a new task",
      };

      await expect(_caller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "client_message",
        title: "New Message",
        message: "You have a new message from a client",
        actionUrl: "/messages/thread-123",
        entityType: "message_thread",
        entityId: "660e8400-e29b-41d4-a716-446655440000",
        // metadata: { threadName: "Client Support" }, // Skip metadata - complex type
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
