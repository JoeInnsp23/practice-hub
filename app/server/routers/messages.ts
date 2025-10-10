import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  calendarEventAttendees,
  calendarEvents,
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
   * List all threads for the current user
   */
  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.authContext.userId;
    const tenantId = ctx.authContext.tenantId;

    // Get threads where user is a participant
    const userThreads = await db
      .select({
        thread: messageThreads,
        participant: messageThreadParticipants,
        lastMessage: {
          id: messages.id,
          content: messages.content,
          userId: messages.userId,
          createdAt: messages.createdAt,
        },
        unreadCount: sql<number>`
          COUNT(CASE
            WHEN ${messages.createdAt} > ${messageThreadParticipants.lastReadAt}
            OR ${messageThreadParticipants.lastReadAt} IS NULL
            THEN 1
          END)
        `.as("unread_count"),
      })
      .from(messageThreads)
      .innerJoin(
        messageThreadParticipants,
        and(
          eq(messageThreads.id, messageThreadParticipants.threadId),
          eq(messageThreadParticipants.userId, userId),
        ),
      )
      .leftJoin(messages, eq(messages.threadId, messageThreads.id))
      .where(eq(messageThreads.tenantId, tenantId))
      .groupBy(
        messageThreads.id,
        messageThreadParticipants.id,
        messages.id,
        messages.content,
        messages.userId,
        messages.createdAt,
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

      // Add participants
      await db.insert(messageThreadParticipants).values(
        allParticipants.map((participantId) => ({
          threadId: thread.id,
          userId: participantId,
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

      // Add creator as admin
      await db.insert(messageThreadParticipants).values({
        threadId: channel.id,
        userId: userId,
        role: "admin",
      });

      // Add other participants if provided
      if (input.participantIds && input.participantIds.length > 0) {
        await db.insert(messageThreadParticipants).values(
          input.participantIds.map((participantId) => ({
            threadId: channel.id,
            userId: participantId,
            role: "member",
          })),
        );
      }

      return channel;
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

      // Add participant
      const [participant] = await db
        .insert(messageThreadParticipants)
        .values({
          threadId: input.threadId,
          userId: input.userId,
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
   * List messages in a thread
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

      // Verify user is participant
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

      // Get messages with sender info
      const threadMessages = await db
        .select({
          message: messages,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            image: users.image,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
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
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        content: z.string().min(1).max(5000),
        type: z.enum(["text", "file", "system"]).default("text"),
        metadata: z.record(z.any()).optional(),
        replyToId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify user is participant
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

      // Create message
      const [message] = await db
        .insert(messages)
        .values({
          threadId: input.threadId,
          userId,
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
