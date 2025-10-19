/**
 * Messages Router Tests
 *
 * Tests for the messages tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { messagesRouter } from "@/app/server/routers/messages";
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
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn(),
  },
}));

describe("app/server/routers/messages.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof messagesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(messagesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("listThreads", () => {
    it("should have no required input", () => {
      const procedure = messagesRouter._def.procedures.listThreads;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("getThread", () => {
    it("should accept valid thread ID", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.getThread._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        threadId: "not-a-uuid",
      };

      expect(() => {
        messagesRouter._def.procedures.getThread._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createDirectMessage", () => {
    it("should validate required participantIds field", () => {
      const invalidInput = {
        // Missing participantIds
      };

      expect(() => {
        messagesRouter._def.procedures.createDirectMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid participant list", () => {
      const validInput = {
        participantIds: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      expect(() => {
        messagesRouter._def.procedures.createDirectMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate minimum participant count", () => {
      const invalidInput = {
        participantIds: [], // Empty array not allowed
      };

      expect(() => {
        messagesRouter._def.procedures.createDirectMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate maximum participant count", () => {
      const invalidInput = {
        participantIds: Array(11).fill("550e8400-e29b-41d4-a716-446655440000"), // Exceeds max of 10
      };

      expect(() => {
        messagesRouter._def.procedures.createDirectMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createChannel", () => {
    it("should validate required name field", () => {
      const invalidInput = {
        // Missing name
        description: "Test channel",
      };

      expect(() => {
        messagesRouter._def.procedures.createChannel._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid channel data", () => {
      const validInput = {
        name: "General",
        description: "General team discussion",
      };

      expect(() => {
        messagesRouter._def.procedures.createChannel._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        name: "Private Team",
        description: "Private team channel",
        isPrivate: true,
        participantIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "660e8400-e29b-41d4-a716-446655440000",
        ],
      };

      expect(() => {
        messagesRouter._def.procedures.createChannel._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("createClientThread", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing clientId and clientPortalUserId
        initialMessage: "Hello",
      };

      expect(() => {
        messagesRouter._def.procedures.createClientThread._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client thread data", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        clientPortalUserId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.createClientThread._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional initial message", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        clientPortalUserId: "660e8400-e29b-41d4-a716-446655440000",
        initialMessage: "Welcome to the portal!",
      };

      expect(() => {
        messagesRouter._def.procedures.createClientThread._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("addParticipant", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing userId
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.addParticipant._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid participant data", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.addParticipant._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("removeParticipant", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.removeParticipant._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid removal data", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.removeParticipant._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("listMessages", () => {
    it("should validate required threadId field", () => {
      const invalidInput = {
        // Missing threadId
        limit: 50,
      };

      expect(() => {
        messagesRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid thread ID", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept pagination parameters", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 25,
        offset: 50,
      };

      expect(() => {
        messagesRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate limit max value", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 150, // Exceeds max of 100
      };

      expect(() => {
        messagesRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId and content
        type: "text",
      };

      expect(() => {
        messagesRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid message data", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Hello, world!",
      };

      expect(() => {
        messagesRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Check this file",
        type: "file" as const,
        metadata: { fileName: "document.pdf" },
        replyToId: "770e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate content minimum length", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "", // Empty string not allowed
      };

      expect(() => {
        messagesRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate content maximum length", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "x".repeat(5001), // Exceeds max of 5000
      };

      expect(() => {
        messagesRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("editMessage", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing messageId
        content: "Updated content",
      };

      expect(() => {
        messagesRouter._def.procedures.editMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid edit data", () => {
      const validInput = {
        messageId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Updated message content",
      };

      expect(() => {
        messagesRouter._def.procedures.editMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteMessage", () => {
    it("should accept valid message ID", () => {
      const validInput = {
        messageId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.deleteMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        messageId: "invalid-id",
      };

      expect(() => {
        messagesRouter._def.procedures.deleteMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("markAsRead", () => {
    it("should accept valid thread ID", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        messagesRouter._def.procedures.markAsRead._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getUnreadCount", () => {
    it("should have no required input", () => {
      const procedure = messagesRouter._def.procedures.getUnreadCount;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(messagesRouter._def.procedures);

      expect(procedures).toContain("listThreads");
      expect(procedures).toContain("getThread");
      expect(procedures).toContain("createDirectMessage");
      expect(procedures).toContain("createChannel");
      expect(procedures).toContain("createClientThread");
      expect(procedures).toContain("addParticipant");
      expect(procedures).toContain("removeParticipant");
      expect(procedures).toContain("listMessages");
      expect(procedures).toContain("sendMessage");
      expect(procedures).toContain("editMessage");
      expect(procedures).toContain("deleteMessage");
      expect(procedures).toContain("markAsRead");
      expect(procedures).toContain("getUnreadCount");
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(messagesRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
