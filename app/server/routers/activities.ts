import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const activitiesRouter = router({
  /**
   * Get recent activities across all entities (for activity feed widget)
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const activities = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.tenantId, tenantId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit);

      return {
        activities,
        total: activities.length,
      };
    }),

  /**
   * List all activities for a specific entity (lead, proposal, client, etc.)
   */
  list: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const activities = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, tenantId),
            eq(activityLogs.entityType, input.entityType),
            eq(activityLogs.entityId, input.entityId),
          ),
        )
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit);

      return {
        activities,
        total: activities.length,
      };
    }),

  /**
   * Create a manual activity log entry
   */
  create: protectedProcedure
    .input(
      z.object({
        module: z.enum([
          "admin-hub",
          "client-hub",
          "practice-hub",
          "proposal-hub",
          "employee-hub",
          "social-hub",
          "client-portal",
          "system",
        ] as const),
        entityType: z.string(),
        entityId: z.string(),
        action: z.string(),
        description: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [activity] = await db
        .insert(activityLogs)
        .values({
          tenantId,
          module: input.module,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          description: input.description,
          userId,
          userName: `${firstName} ${lastName}`,
          metadata: input.metadata,
        })
        .returning();

      return { success: true, activity };
    }),

  /**
   * Get activity counts by action type for an entity
   */
  getActivityCounts: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const activities = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, tenantId),
            eq(activityLogs.entityType, input.entityType),
            eq(activityLogs.entityId, input.entityId),
          ),
        );

      // Count by action type
      const counts: Record<string, number> = {};
      for (const activity of activities) {
        counts[activity.action] = (counts[activity.action] || 0) + 1;
      }

      return {
        total: activities.length,
        byAction: counts,
      };
    }),

  /**
   * Get user activity history with search, filters, and pagination
   * Users can only view their own activity unless they are admins
   */
  getUserActivityHistory: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        search: z.string().optional(),
        module: z
          .enum([
            "admin-hub",
            "client-hub",
            "practice-hub",
            "proposal-hub",
            "employee-hub",
            "social-hub",
            "client-portal",
            "system",
          ] as const)
          .optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, role, userId: currentUserId } = ctx.authContext;

      // Only admins can view other users' activity
      if (input.userId !== currentUserId && role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own activity history",
        });
      }

      // Build conditions
      const conditions = [
        eq(activityLogs.tenantId, tenantId),
        eq(activityLogs.userId, input.userId),
      ];

      if (input.search) {
        const searchCondition = or(
          ilike(activityLogs.description, `%${input.search}%`),
          ilike(activityLogs.action, `%${input.search}%`),
          ilike(activityLogs.entityType, `%${input.search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      if (input.module) {
        conditions.push(eq(activityLogs.module, input.module));
      }

      if (input.entityType) {
        conditions.push(eq(activityLogs.entityType, input.entityType));
      }

      if (input.action) {
        conditions.push(eq(activityLogs.action, input.action));
      }

      if (input.dateFrom) {
        conditions.push(gte(activityLogs.createdAt, new Date(input.dateFrom)));
      }

      if (input.dateTo) {
        conditions.push(lte(activityLogs.createdAt, new Date(input.dateTo)));
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLogs)
        .where(and(...conditions));

      // Get paginated activities
      const activities = await db
        .select()
        .from(activityLogs)
        .where(and(...conditions))
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        activities,
        total: count,
        limit: input.limit,
        offset: input.offset,
        hasMore: input.offset + input.limit < count,
      };
    }),
});
