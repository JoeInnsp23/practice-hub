import * as Sentry from "@sentry/nextjs";
import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { announcements } from "@/lib/db/schema";
import { adminProcedure, router, protectedProcedure } from "../trpc";

// Validation schemas
const announcementCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  icon: z.string().min(1, "Icon is required"),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  priority: z.enum(["info", "warning", "critical"]).default("info"),
  isPinned: z.boolean().default(false),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
});

const announcementUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  icon: z.string().optional(),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  priority: z.enum(["info", "warning", "critical"]).optional(),
  isPinned: z.boolean().optional(),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const announcementsRouter = router({
  /**
   * Public query - Get active, visible announcements for Practice Hub
   * Returns announcements that:
   * - Are active (isActive = true)
   * - Are within schedule window (now >= startsAt AND now <= endsAt)
   * - Ordered by: pinned first, then priority (critical > warning > info), then newest first
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const now = new Date();

        const conditions = [
          eq(announcements.tenantId, ctx.authContext.tenantId),
          eq(announcements.isActive, true),
        ];

        // Schedule window filtering
        // Show if: (startsAt is null OR startsAt <= now) AND (endsAt is null OR endsAt >= now)
        const scheduleConditions = and(
          or(
            eq(announcements.startsAt, null),
            lte(announcements.startsAt, now),
          ),
          or(eq(announcements.endsAt, null), gte(announcements.endsAt, now)),
        );

        const activeAnnouncements = await ctx.db
          .select()
          .from(announcements)
          .where(and(...conditions, scheduleConditions))
          .orderBy(
            desc(announcements.isPinned), // Pinned first
            sql`CASE
              WHEN ${announcements.priority} = 'critical' THEN 1
              WHEN ${announcements.priority} = 'warning' THEN 2
              WHEN ${announcements.priority} = 'info' THEN 3
              ELSE 4
            END`, // Priority second (critical > warning > info)
            desc(announcements.createdAt), // Newest third
          )
          .limit(input.limit);

        return activeAnnouncements;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.list",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin query - Get all announcements with optional filters
   */
  adminList: adminProcedure
    .input(
      z.object({
        active: z.boolean().optional(),
        priority: z.enum(["info", "warning", "critical"]).optional(),
        sortBy: z
          .enum(["priority", "title", "publishedAt", "startsAt", "endsAt"])
          .optional()
          .default("publishedAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const conditions = [
          eq(announcements.tenantId, ctx.authContext.tenantId),
        ];

        // Apply filters
        if (input.active !== undefined) {
          conditions.push(eq(announcements.isActive, input.active));
        }
        if (input.priority) {
          conditions.push(eq(announcements.priority, input.priority));
        }

        // Build orderBy array based on sortBy and sortOrder
        const orderByArray = [];

        // Always sort pinned items first
        orderByArray.push(desc(announcements.isPinned));

        // Apply custom sorting based on input
        const sortDirection = input.sortOrder === "asc" ? asc : desc;

        switch (input.sortBy) {
          case "priority":
            // For priority, use CASE statement for custom ordering
            orderByArray.push(
              input.sortOrder === "asc"
                ? sql`CASE
                    WHEN ${announcements.priority} = 'info' THEN 1
                    WHEN ${announcements.priority} = 'warning' THEN 2
                    WHEN ${announcements.priority} = 'critical' THEN 3
                    ELSE 4
                  END`
                : sql`CASE
                    WHEN ${announcements.priority} = 'critical' THEN 1
                    WHEN ${announcements.priority} = 'warning' THEN 2
                    WHEN ${announcements.priority} = 'info' THEN 3
                    ELSE 4
                  END`
            );
            break;
          case "title":
            orderByArray.push(sortDirection(announcements.title));
            break;
          case "publishedAt":
            orderByArray.push(sortDirection(announcements.publishedAt));
            break;
          case "startsAt":
            orderByArray.push(sortDirection(announcements.startsAt));
            break;
          case "endsAt":
            orderByArray.push(sortDirection(announcements.endsAt));
            break;
        }

        // Add secondary sort by createdAt for stability
        orderByArray.push(desc(announcements.createdAt));

        const allAnnouncements = await ctx.db
          .select()
          .from(announcements)
          .where(and(...conditions))
          .orderBy(...orderByArray);

        return allAnnouncements;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.adminList",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin mutation - Create new announcement
   */
  create: adminProcedure
    .input(announcementCreateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [newAnnouncement] = await ctx.db
          .insert(announcements)
          .values({
            tenantId: ctx.authContext.tenantId,
            createdById: ctx.authContext.userId,
            title: input.title,
            content: input.content,
            icon: input.icon,
            iconColor: input.iconColor,
            priority: input.priority,
            isPinned: input.isPinned,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            isActive: true,
            publishedAt: new Date(),
          })
          .returning();

        return newAnnouncement;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.create",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
            title: input.title,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin mutation - Update existing announcement
   */
  update: adminProcedure
    .input(announcementUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // Remove undefined values
        const cleanedData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined),
        );

        const [updatedAnnouncement] = await ctx.db
          .update(announcements)
          .set({
            ...cleanedData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(announcements.id, id),
              eq(announcements.tenantId, ctx.authContext.tenantId),
            ),
          )
          .returning();

        if (!updatedAnnouncement) {
          throw new Error("Announcement not found");
        }

        return updatedAnnouncement;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.update",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
            announcementId: input.id,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin mutation - Delete announcement
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [deletedAnnouncement] = await ctx.db
          .delete(announcements)
          .where(
            and(
              eq(announcements.id, input.id),
              eq(announcements.tenantId, ctx.authContext.tenantId),
            ),
          )
          .returning();

        if (!deletedAnnouncement) {
          throw new Error("Announcement not found");
        }

        return { success: true };
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.delete",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
            announcementId: input.id,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin mutation - Toggle active status
   */
  toggleActive: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [toggledAnnouncement] = await ctx.db
          .update(announcements)
          .set({
            isActive: input.isActive,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(announcements.id, input.id),
              eq(announcements.tenantId, ctx.authContext.tenantId),
            ),
          )
          .returning();

        if (!toggledAnnouncement) {
          throw new Error("Announcement not found");
        }

        return toggledAnnouncement;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.toggleActive",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
            announcementId: input.id,
            isActive: input.isActive,
          },
        });
        throw error;
      }
    }),

  /**
   * Admin mutation - Pin/unpin announcement
   */
  pin: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [pinnedAnnouncement] = await ctx.db
          .update(announcements)
          .set({
            isPinned: input.isPinned,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(announcements.id, input.id),
              eq(announcements.tenantId, ctx.authContext.tenantId),
            ),
          )
          .returning();

        if (!pinnedAnnouncement) {
          throw new Error("Announcement not found");
        }

        return pinnedAnnouncement;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "announcements.pin",
            router: "announcements",
          },
          extra: {
            tenantId: ctx.authContext.tenantId,
            userId: ctx.authContext.userId,
            announcementId: input.id,
            isPinned: input.isPinned,
          },
        });
        throw error;
      }
    }),
});
