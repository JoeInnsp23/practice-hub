import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const activitiesRouter = router({
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
});
