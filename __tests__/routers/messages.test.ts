/**
 * Messages Router Tests
 *
 * Tests for the messages tRPC router
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { messagesRouter } from "@/app/server/routers/messages";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";
import {
  type TestDataTracker,
  cleanupTestData,
  createTestClient,
  createTestMessage,
  createTestMessageThread,
  createTestMessageThreadParticipant,
  createTestTenant,
  createTestUser,
} from "../helpers/factories";

describe("app/server/routers/messages.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof messagesRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    messageThreads: [],
    messageThreadParticipants: [],
    messages: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(messagesRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.messageThreads = [];
    tracker.messageThreadParticipants = [];
    tracker.messages = [];
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add current user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const participantUser = await createTestUser(tenantId);
      tracker.users?.push(participantUser);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        participantIds: [participantUser],
      };

      const result = await _caller.createDirectMessage(validInput);
      tracker.messageThreads?.push(result.threadId);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        name: "General",
        description: "General team discussion",
      };

      const result = await _caller.createChannel(validInput);
      tracker.messageThreads?.push(result.threadId);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const participant1 = await createTestUser(tenantId);
      tracker.users?.push(participant1);

      const participant2 = await createTestUser(tenantId);
      tracker.users?.push(participant2);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        name: "Private Team",
        description: "Private team channel",
        isPrivate: true,
        participantIds: [participant1, participant2],
      };

      const result = await _caller.createChannel(validInput);
      tracker.messageThreads?.push(result.threadId);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
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

    it.skip("should accept valid client thread data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId);
      tracker.clients?.push(client.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        clientId: client.id,
        clientPortalUserId: userId, // Use userId for client portal user
      };

      const result = await _caller.createClientThread(validInput);
      tracker.messageThreads?.push(result.threadId);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it.skip("should accept optional initial message", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId);
      tracker.clients?.push(client.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        clientId: client.id,
        clientPortalUserId: userId,
        initialMessage: "Welcome to the portal!",
      };

      const result = await _caller.createClientThread(validInput);
      tracker.messageThreads?.push(result.threadId);
      if (result.messageId) {
        tracker.messages?.push(result.messageId);
      }

      await expect(Promise.resolve(result)).resolves.not.toThrow();
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const newParticipant = await createTestUser(tenantId);
      tracker.users?.push(newParticipant);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add creator as participant with admin role
      const creatorParticipant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
        { role: "admin" }, // Need admin role to add participants
      );
      tracker.messageThreadParticipants?.push(creatorParticipant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
        userId: newParticipant,
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const participantToRemove = await createTestUser(tenantId);
      tracker.users?.push(participantToRemove);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add both users as participants (creator as admin)
      const creatorParticipant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
        { role: "admin" }, // Need admin role to remove other participants
      );
      tracker.messageThreadParticipants?.push(creatorParticipant.id);

      const targetParticipant = await createTestMessageThreadParticipant(
        thread.id,
        participantToRemove,
      );
      tracker.messageThreadParticipants?.push(targetParticipant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
        userId: participantToRemove,
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
      };

      await expect(_caller.listMessages(validInput)).resolves.not.toThrow();
    });

    it("should accept pagination parameters", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
        content: "Hello, world!",
      };

      const result = await _caller.sendMessage(validInput);
      tracker.messages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Create a message to reply to
      const replyToMessage = await createTestMessage(
        userId, // senderId - must match current user
        thread.id,
      );
      tracker.messages?.push(replyToMessage.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
        content: "Check this file",
        type: "file" as const,
        metadata: { fileName: "document.pdf" },
        replyToId: replyToMessage.id,
      };

      const result = await _caller.sendMessage(validInput);
      tracker.messages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Create a message to edit
      const message = await createTestMessage(userId, thread.id);
      tracker.messages?.push(message.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        messageId: message.id,
        content: "Updated message content",
      };

      await expect(_caller.editMessage(validInput)).resolves.not.toThrow();
    });
  });

  describe("deleteMessage", () => {
    it("should accept valid message ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Create a message to delete
      const message = await createTestMessage(userId, thread.id);
      tracker.messages?.push(message.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        messageId: message.id,
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
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const thread = await createTestMessageThread(tenantId, userId);
      tracker.messageThreads?.push(thread.id);

      // Add user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        userId,
      );
      tracker.messageThreadParticipants?.push(participant.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        threadId: thread.id,
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
