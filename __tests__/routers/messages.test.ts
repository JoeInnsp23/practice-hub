/**
 * Messages Router Tests
 *
 * Tests for the messages tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { messagesRouter } from "@/app/server/routers/messages";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Use vi.hoisted with dynamic import to create db mock before vi.mock processes
const mockedDb = await vi.hoisted(async () => {
  const { createDbMock } = await import("../helpers/db-mock");
  return createDbMock();
});

// Mock the database with proper thenable pattern
vi.mock("@/lib/db", () => ({
  db: mockedDb,
}));

describe("app/server/routers/messages.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof messagesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(messagesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("listThreads", () => {
    it("should have no required input", () => {
      const procedure = messagesRouter._def.procedures.listThreads;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getThread", () => {
    it("should accept valid thread ID", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getThread(validInput)).resolves.not.toThrow();
    });

    it("should validate UUID format", async () => {
      const invalidInput = {
        threadId: "not-a-uuid",
      };

      await expect(
        _caller.getThread(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("createDirectMessage", () => {
    it("should validate required participantIds field", async () => {
      const invalidInput = {
        // Missing participantIds
      };

      await expect(
        _caller.createDirectMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid participant list", async () => {
      const validInput = {
        participantIds: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      await expect(
        _caller.createDirectMessage(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate minimum participant count", async () => {
      const invalidInput = {
        participantIds: [], // Empty array not allowed
      };

      await expect(
        _caller.createDirectMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate maximum participant count", async () => {
      const invalidInput = {
        participantIds: Array(11).fill("550e8400-e29b-41d4-a716-446655440000"), // Exceeds max of 10
      };

      await expect(
        _caller.createDirectMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("createChannel", () => {
    it("should validate required name field", async () => {
      const invalidInput = {
        // Missing name
        description: "Test channel",
      };

      await expect(
        _caller.createChannel(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid channel data", async () => {
      const validInput = {
        name: "General",
        description: "General team discussion",
      };

      await expect(_caller.createChannel(validInput)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      const validInput = {
        name: "Private Team",
        description: "Private team channel",
        isPrivate: true,
        participantIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "660e8400-e29b-41d4-a716-446655440000",
        ],
      };

      await expect(_caller.createChannel(validInput)).resolves.not.toThrow();
    });
  });

  describe("createClientThread", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing clientId and clientPortalUserId
        initialMessage: "Hello",
      };

      await expect(
        _caller.createClientThread(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client thread data", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        clientPortalUserId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.createClientThread(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept optional initial message", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        clientPortalUserId: "660e8400-e29b-41d4-a716-446655440000",
        initialMessage: "Welcome to the portal!",
      };

      await expect(
        _caller.createClientThread(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("addParticipant", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing userId
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.addParticipant(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid participant data", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.addParticipant(validInput)).resolves.not.toThrow();
    });
  });

  describe("removeParticipant", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.removeParticipant(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid removal data", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.removeParticipant(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("listMessages", () => {
    it("should validate required threadId field", async () => {
      const invalidInput = {
        // Missing threadId
        limit: 50,
      };

      await expect(
        _caller.listMessages(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid thread ID", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.listMessages(validInput)).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 25,
        offset: 50,
      };

      await expect(_caller.listMessages(validInput)).resolves.not.toThrow();
    });

    it("should validate limit max value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 150, // Exceeds max of 100
      };

      await expect(
        _caller.listMessages(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and content
        type: "text",
      };

      await expect(
        _caller.sendMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid message data", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Hello, world!",
      };

      await expect(_caller.sendMessage(validInput)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Check this file",
        type: "file" as const,
        metadata: { fileName: "document.pdf" },
        replyToId: "770e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.sendMessage(validInput)).resolves.not.toThrow();
    });

    it("should validate content minimum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "", // Empty string not allowed
      };

      await expect(
        _caller.sendMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate content maximum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        content: "x".repeat(5001), // Exceeds max of 5000
      };

      await expect(
        _caller.sendMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("editMessage", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing messageId
        content: "Updated content",
      };

      await expect(
        _caller.editMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid edit data", async () => {
      const validInput = {
        messageId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Updated message content",
      };

      await expect(_caller.editMessage(validInput)).resolves.not.toThrow();
    });
  });

  describe("deleteMessage", () => {
    it("should accept valid message ID", async () => {
      const validInput = {
        messageId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.deleteMessage(validInput)).resolves.not.toThrow();
    });

    it("should validate UUID format", async () => {
      const invalidInput = {
        messageId: "invalid-id",
      };

      await expect(
        _caller.deleteMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("markAsRead", () => {
    it("should accept valid thread ID", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.markAsRead(validInput)).resolves.not.toThrow();
    });
  });

  describe("getUnreadCount", () => {
    it("should have no required input", () => {
      const procedure = messagesRouter._def.procedures.getUnreadCount;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
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
