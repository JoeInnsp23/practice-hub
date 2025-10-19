/**
 * Notifications Router Tests
 *
 * Tests for the notifications tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationsRouter } from "@/app/server/routers/notifications";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

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
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof notificationsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(notificationsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        notificationsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept pagination parameters", () => {
      expect(() => {
        notificationsRouter._def.procedures.list._def.inputs[0]?.parse({
          limit: 25,
          offset: 50,
        });
      }).not.toThrow();
    });

    it("should accept unreadOnly filter", () => {
      expect(() => {
        notificationsRouter._def.procedures.list._def.inputs[0]?.parse({
          unreadOnly: true,
        });
      }).not.toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        notificationsRouter._def.procedures.list._def.inputs[0]?.parse({
          limit: 150, // Exceeds max of 100
        });
      }).toThrow();
    });

    it("should validate limit min value", () => {
      expect(() => {
        notificationsRouter._def.procedures.list._def.inputs[0]?.parse({
          limit: 0, // Below minimum of 1
        });
      }).toThrow();
    });
  });

  describe("getUnreadCount", () => {
    it("should have no required input", () => {
      const procedure = notificationsRouter._def.procedures.getUnreadCount;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("markAsRead", () => {
    it("should validate required notificationId field", () => {
      const invalidInput = {
        // Missing notificationId
      };

      expect(() => {
        notificationsRouter._def.procedures.markAsRead._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid notification ID", () => {
      const validInput = {
        notificationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        notificationsRouter._def.procedures.markAsRead._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        notificationId: "not-a-uuid",
      };

      expect(() => {
        notificationsRouter._def.procedures.markAsRead._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("markAllAsRead", () => {
    it("should have no required input", () => {
      const procedure = notificationsRouter._def.procedures.markAllAsRead;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("delete", () => {
    it("should validate required notificationId field", () => {
      const invalidInput = {
        // Missing notificationId
      };

      expect(() => {
        notificationsRouter._def.procedures.delete._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid notification ID", () => {
      const validInput = {
        notificationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        notificationsRouter._def.procedures.delete._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing userId, type, title, message
        actionUrl: "/notifications/1",
      };

      expect(() => {
        notificationsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid notification data", () => {
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        type: "task_assigned",
        title: "New Task Assigned",
        message: "You have been assigned a new task",
      };

      expect(() => {
        notificationsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
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

      expect(() => {
        notificationsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
