import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const notificationsRouter = router({
  /**
   * List notifications for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      const query = db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.tenantId, tenantId),
            input.unreadOnly ? eq(notifications.isRead, false) : undefined,
          ),
        )
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return await query;
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.authContext.userId;
    const tenantId = ctx.authContext.tenantId;

    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isRead, false),
        ),
      );

    return { unreadCount: result.length };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId));

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only mark your own notifications as read",
        });
      }

      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.authContext.userId;
    const tenantId = ctx.authContext.tenantId;

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.isRead, false),
        ),
      );

    return { success: true };
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId));

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own notifications",
        });
      }

      await db
        .delete(notifications)
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Create notification (internal use - called by other routers)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        actionUrl: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const [notification] = await db
        .insert(notifications)
        .values({
          ...input,
          tenantId,
        })
        .returning();

      return notification;
    }),
});
