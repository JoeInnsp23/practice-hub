import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  calendarEventAttendees,
  calendarEvents,
  clientPortalAccess,
  clientPortalUsers,
  clients,
  messageThreadParticipants,
  messageThreads,
  messages,
  users,
} from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const messagesRouter = router({
  // ============================================================================
  // Thread Operations
  // ============================================================================

  /**
   * List all threads for the current user (staff only)
   */
  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.authContext.userId;
    const tenantId = ctx.authContext.tenantId;

    // Get threads where user is a participant (polymorphic support)
    const userThreads = await db
      .select({
        thread: messageThreads,
        participant: messageThreadParticipants,
        lastMessage: {
          id: messages.id,
          content: messages.content,
          senderType: messages.senderType,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        },
        unreadCount: sql<number>`
          COUNT(CASE
            WHEN ${messages.createdAt} > ${messageThreadParticipants.lastReadAt}
            OR ${messageThreadParticipants.lastReadAt} IS NULL
            THEN 1
          END)
        `.as("unread_count"),
        client: {
          id: clients.id,
          name: clients.name,
        },
      })
      .from(messageThreads)
      .innerJoin(
        messageThreadParticipants,
        and(
          eq(messageThreads.id, messageThreadParticipants.threadId),
          or(
            // Support both legacy and new polymorphic fields
            eq(messageThreadParticipants.userId, userId),
            and(
              eq(messageThreadParticipants.participantType, "staff"),
              eq(messageThreadParticipants.participantId, userId),
            ),
          ),
        ),
      )
      .leftJoin(messages, eq(messages.threadId, messageThreads.id))
      .leftJoin(clients, eq(messageThreads.clientId, clients.id))
      .where(eq(messageThreads.tenantId, tenantId))
      .groupBy(
        messageThreads.id,
        messageThreadParticipants.id,
        messages.id,
        messages.content,
        messages.senderType,
        messages.senderId,
        messages.createdAt,
        clients.id,
        clients.name,
      )
      .orderBy(desc(messageThreads.lastMessageAt));

    return userThreads;
  }),

  /**
   * Get thread details with participants
   */
  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Get thread
      const [thread] = await db
        .select()
        .from(messageThreads)
        .where(
          and(
            eq(messageThreads.id, input.threadId),
            eq(messageThreads.tenantId, tenantId),
          ),
        );

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Verify user is a participant
      const [participant] = await db
        .select()
        .from(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            eq(messageThreadParticipants.userId, userId),
          ),
        );

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this thread",
        });
      }

      // Get all participants with user details
      const participants = await db
        .select({
          id: messageThreadParticipants.id,
          userId: messageThreadParticipants.userId,
          role: messageThreadParticipants.role,
          joinedAt: messageThreadParticipants.joinedAt,
          lastReadAt: messageThreadParticipants.lastReadAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            image: users.image,
          },
        })
        .from(messageThreadParticipants)
        .innerJoin(users, eq(messageThreadParticipants.userId, users.id))
        .where(eq(messageThreadParticipants.threadId, input.threadId));

      // Get client info if it's a client thread
      let client = null;
      if (thread.clientId) {
        const [clientData] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, thread.clientId));
        client = clientData;
      }

      return {
        ...thread,
        participants,
        client,
      };
    }),

  /**
   * Create a direct message thread
   */
  createDirectMessage: protectedProcedure
    .input(
      z.object({
        participantIds: z.array(z.string()).min(1).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Check if DM already exists between these users
      const allParticipants = [...new Set([userId, ...input.participantIds])];

      if (allParticipants.length === 2) {
        // For 1-on-1 DMs, check if thread already exists
        const existingThreads = await db
          .select({ threadId: messageThreadParticipants.threadId })
          .from(messageThreadParticipants)
          .where(inArray(messageThreadParticipants.userId, allParticipants))
          .groupBy(messageThreadParticipants.threadId)
          .having(sql`COUNT(DISTINCT ${messageThreadParticipants.userId}) = 2`);

        if (existingThreads.length > 0) {
          // Return existing thread
          const [thread] = await db
            .select()
            .from(messageThreads)
            .where(
              and(
                eq(messageThreads.id, existingThreads[0].threadId),
                eq(messageThreads.type, "direct"),
              ),
            );

          if (thread) {
            return thread;
          }
        }
      }

      // Create new thread
      const [thread] = await db
        .insert(messageThreads)
        .values({
          tenantId,
          type: "direct",
          name: null,
          createdBy: userId,
        })
        .returning();

      // Add participants with polymorphic fields
      await db.insert(messageThreadParticipants).values(
        allParticipants.map((participantId) => ({
          threadId: thread.id,
          participantType: "staff",
          participantId: participantId,
          userId: participantId, // Legacy field
          role: "member",
        })),
      );

      return thread;
    }),

  /**
   * Create a team channel
   */
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
        participantIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Create channel
      const [channel] = await db
        .insert(messageThreads)
        .values({
          tenantId,
          type: "team_channel",
          name: input.name,
          description: input.description,
          isPrivate: input.isPrivate,
          createdBy: userId,
        })
        .returning();

      // Add creator as admin with polymorphic fields
      await db.insert(messageThreadParticipants).values({
        threadId: channel.id,
        participantType: "staff",
        participantId: userId,
        userId: userId, // Legacy field
        role: "admin",
      });

      // Add other participants if provided
      if (input.participantIds && input.participantIds.length > 0) {
        await db.insert(messageThreadParticipants).values(
          input.participantIds.map((participantId) => ({
            threadId: channel.id,
            participantType: "staff",
            participantId: participantId,
            userId: participantId, // Legacy field
            role: "member",
          })),
        );
      }

      return channel;
    }),

  /**
   * Create a client thread (staff to client communication)
   */
  createClientThread: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        clientPortalUserId: z.string().uuid(),
        initialMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify client exists and belongs to tenant
      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, input.clientId),
            eq(clients.tenantId, tenantId),
          ),
        );

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Verify client portal user exists and has access to this client
      const [portalUserAccess] = await db
        .select({
          portalUser: clientPortalUsers,
        })
        .from(clientPortalUsers)
        .innerJoin(
          clientPortalAccess,
          and(
            eq(clientPortalAccess.portalUserId, clientPortalUsers.id),
            eq(clientPortalAccess.clientId, input.clientId),
            eq(clientPortalAccess.isActive, true),
          ),
        )
        .where(
          and(
            eq(clientPortalUsers.id, input.clientPortalUserId),
            eq(clientPortalUsers.tenantId, tenantId),
          ),
        );

      if (!portalUserAccess) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client portal user not found or does not have access to this client",
        });
      }

      // Check if thread already exists for this client and portal user
      const existingThreads = await db
        .select({
          thread: messageThreads,
        })
        .from(messageThreads)
        .innerJoin(
          messageThreadParticipants,
          and(
            eq(messageThreads.id, messageThreadParticipants.threadId),
            eq(messageThreadParticipants.participantType, "client_portal"),
            eq(messageThreadParticipants.participantId, input.clientPortalUserId),
          ),
        )
        .where(
          and(
            eq(messageThreads.tenantId, tenantId),
            eq(messageThreads.clientId, input.clientId),
            eq(messageThreads.type, "client"),
          ),
        );

      // If thread exists, return it
      if (existingThreads.length > 0) {
        const thread = existingThreads[0].thread;

        // Send initial message if provided
        if (input.initialMessage) {
          await db.insert(messages).values({
            threadId: thread.id,
            senderType: "staff",
            senderId: userId,
            userId, // Legacy field
            content: input.initialMessage,
            type: "text",
          });

          // Update thread's lastMessageAt
          await db
            .update(messageThreads)
            .set({ lastMessageAt: new Date() })
            .where(eq(messageThreads.id, thread.id));
        }

        return thread;
      }

      // Create new client thread
      const [thread] = await db
        .insert(messageThreads)
        .values({
          tenantId,
          type: "client",
          clientId: input.clientId,
          name: `Chat with ${client.name}`,
          createdBy: userId,
        })
        .returning();

      // Add staff user as participant
      await db.insert(messageThreadParticipants).values({
        threadId: thread.id,
        participantType: "staff",
        participantId: userId,
        userId, // Legacy field for backward compatibility
        role: "admin",
      });

      // Add client portal user as participant
      await db.insert(messageThreadParticipants).values({
        threadId: thread.id,
        participantType: "client_portal",
        participantId: input.clientPortalUserId,
        role: "member",
      });

      // Send initial message if provided
      if (input.initialMessage) {
        await db.insert(messages).values({
          threadId: thread.id,
          senderType: "staff",
          senderId: userId,
          userId, // Legacy field
          content: input.initialMessage,
          type: "text",
        });

        // Update thread's lastMessageAt
        await db
          .update(messageThreads)
          .set({ lastMessageAt: new Date() })
          .where(eq(messageThreads.id, thread.id));
      }

      return thread;
    }),

  /**
   * Add participant to thread
   */
  addParticipant: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify thread exists and user is admin
      const [thread] = await db
        .select()
        .from(messageThreads)
        .where(
          and(
            eq(messageThreads.id, input.threadId),
            eq(messageThreads.tenantId, tenantId),
          ),
        );

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Check if current user is admin of thread
      const [currentParticipant] = await db
        .select()
        .from(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            eq(messageThreadParticipants.userId, currentUserId),
          ),
        );

      if (!currentParticipant || currentParticipant.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can add participants",
        });
      }

      // Add participant with polymorphic fields
      const [participant] = await db
        .insert(messageThreadParticipants)
        .values({
          threadId: input.threadId,
          participantType: "staff",
          participantId: input.userId,
          userId: input.userId, // Legacy field
          role: "member",
        })
        .returning();

      return participant;
    }),

  /**
   * Remove participant from thread
   */
  removeParticipant: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.authContext.userId;

      // Check if current user is admin or removing themselves
      const [currentParticipant] = await db
        .select()
        .from(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            eq(messageThreadParticipants.userId, currentUserId),
          ),
        );

      if (
        !currentParticipant ||
        (currentParticipant.role !== "admin" &&
          input.userId !== currentUserId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove this participant",
        });
      }

      // Remove participant
      await db
        .delete(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            eq(messageThreadParticipants.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  // ============================================================================
  // Message Operations
  // ============================================================================

  /**
   * List messages in a thread (polymorphic sender support)
   */
  listMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify user is participant (support both legacy and polymorphic fields)
      const [participant] = await db
        .select()
        .from(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            or(
              eq(messageThreadParticipants.userId, userId),
              and(
                eq(messageThreadParticipants.participantType, "staff"),
                eq(messageThreadParticipants.participantId, userId),
              ),
            ),
          ),
        );

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this thread",
        });
      }

      // Get messages with polymorphic sender info (staff OR client portal users)
      const threadMessages = await db
        .select({
          message: messages,
          // Staff sender
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            image: users.image,
          },
          // Client portal sender
          portalSender: {
            id: clientPortalUsers.id,
            firstName: clientPortalUsers.firstName,
            lastName: clientPortalUsers.lastName,
            email: clientPortalUsers.email,
          },
        })
        .from(messages)
        .leftJoin(
          users,
          and(
            or(
              eq(messages.userId, users.id), // Legacy field
              and(
                eq(messages.senderType, "staff"),
                eq(messages.senderId, users.id),
              ),
            ),
          ),
        )
        .leftJoin(
          clientPortalUsers,
          and(
            eq(messages.senderType, "client_portal"),
            eq(messages.senderId, clientPortalUsers.id),
          ),
        )
        .where(
          and(
            eq(messages.threadId, input.threadId),
            eq(messages.isDeleted, false),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return threadMessages;
    }),

  /**
   * Send a message (polymorphic sender support)
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        content: z.string().min(1).max(5000),
        type: z.enum(["text", "file", "system"]).default("text"),
        metadata: z.record(z.string(), z.any()).optional(),
        replyToId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify user is participant (support both legacy and polymorphic fields)
      const [participant] = await db
        .select()
        .from(messageThreadParticipants)
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            or(
              eq(messageThreadParticipants.userId, userId),
              and(
                eq(messageThreadParticipants.participantType, "staff"),
                eq(messageThreadParticipants.participantId, userId),
              ),
            ),
          ),
        );

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this thread",
        });
      }

      // Create message with polymorphic sender fields
      const [message] = await db
        .insert(messages)
        .values({
          threadId: input.threadId,
          senderType: "staff",
          senderId: userId,
          userId, // Legacy field for backward compatibility
          content: input.content,
          type: input.type,
          metadata: input.metadata,
          replyToId: input.replyToId,
        })
        .returning();

      // Update thread's lastMessageAt
      await db
        .update(messageThreads)
        .set({ lastMessageAt: new Date() })
        .where(eq(messageThreads.id, input.threadId));

      return message;
    }),

  /**
   * Edit a message
   */
  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        content: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify message exists and user is sender
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, input.messageId));

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      if (message.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own messages",
        });
      }

      // Update message
      const [updatedMessage] = await db
        .update(messages)
        .set({
          content: input.content,
          isEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, input.messageId))
        .returning();

      return updatedMessage;
    }),

  /**
   * Delete a message
   */
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify message exists and user is sender
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, input.messageId));

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      if (message.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own messages",
        });
      }

      // Soft delete message
      await db
        .update(messages)
        .set({
          isDeleted: true,
          content: "[Message deleted]",
        })
        .where(eq(messages.id, input.messageId));

      return { success: true };
    }),

  /**
   * Mark thread as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Update lastReadAt
      await db
        .update(messageThreadParticipants)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(messageThreadParticipants.threadId, input.threadId),
            eq(messageThreadParticipants.userId, userId),
          ),
        );

      return { success: true };
    }),

  /**
   * Get unread message count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.authContext.userId;

    const result = await db
      .select({
        unreadCount: sql<number>`
          COUNT(CASE
            WHEN ${messages.createdAt} > ${messageThreadParticipants.lastReadAt}
            OR ${messageThreadParticipants.lastReadAt} IS NULL
            THEN 1
          END)
        `,
      })
      .from(messageThreadParticipants)
      .leftJoin(messages, eq(messages.threadId, messageThreadParticipants.threadId))
      .where(eq(messageThreadParticipants.userId, userId));

    return { unreadCount: Number(result[0]?.unreadCount || 0) };
  }),
});
