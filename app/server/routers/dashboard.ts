import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getActivityFeed,
  getDashboardKpis,
} from "@/lib/db/queries/dashboard-queries";
import { protectedProcedure, router } from "../trpc";

export const dashboardRouter = router({
  kpis: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { tenantId } = ctx.authContext;

      // Query the dashboard KPI view using typed query function
      const kpiData = await getDashboardKpis(tenantId);

      // If no data found (new tenant), return zeros
      if (!kpiData) {
        return {
          kpis: {
            totalRevenue: 0,
            collectedRevenue: 0,
            outstandingRevenue: 0,
            activeClients: 0,
            newClients30d: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            completedTasks30d: 0,
            overdueTasks: 0,
            totalHours30d: 0,
            billableHours30d: 0,
            upcomingCompliance30d: 0,
            overdueCompliance: 0,
            utilizationRate: 0,
            collectionRate: 0,
          },
        };
      }

      // Transform to camelCase for frontend
      const kpis = {
        totalRevenue: Number(kpiData.totalRevenue || 0),
        collectedRevenue: Number(kpiData.collectedRevenue || 0),
        outstandingRevenue: Number(kpiData.outstandingRevenue || 0),
        activeClients: Number(kpiData.activeClients || 0),
        newClients30d: Number(kpiData.newClients30d || 0),
        pendingTasks: Number(kpiData.pendingTasks || 0),
        inProgressTasks: Number(kpiData.inProgressTasks || 0),
        completedTasks30d: Number(kpiData.completedTasks30d || 0),
        overdueTasks: Number(kpiData.overdueTasks || 0),
        totalHours30d: Number(kpiData.totalHours30d || 0),
        billableHours30d: Number(kpiData.billableHours30d || 0),
        upcomingCompliance30d: Number(kpiData.upcomingCompliance30d || 0),
        overdueCompliance: Number(kpiData.overdueCompliance || 0),
        utilizationRate:
          Number(kpiData.totalHours30d || 0) > 0
            ? (Number(kpiData.billableHours30d) /
                Number(kpiData.totalHours30d)) *
              100
            : 0,
        collectionRate:
          Number(kpiData.totalRevenue || 0) > 0
            ? (Number(kpiData.collectedRevenue) /
                Number(kpiData.totalRevenue)) *
              100
            : 0,
      };

      return { kpis };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "getDashboardKpis" },
        extra: { tenantId: ctx.authContext.tenantId },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard KPIs",
        cause: error,
      });
    }
  }),

  activity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        entityType: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { tenantId } = ctx.authContext;
        const { limit, offset, entityType } = input;

        // Use typed query function from dashboard-queries
        const result = await getActivityFeed(tenantId, {
          limit,
          offset,
          entityType,
        });

        // Format activities to camelCase
        const activities = result.map((activity) => ({
          id: activity.id,
          entityType: activity.entityType ?? null,
          entityId: activity.entityId ?? null,
          entityName: activity.entityName ?? null,
          action: activity.action ?? null,
          description: activity.description ?? null,
          userName: activity.userName ?? null,
          userDisplayName: activity.userDisplayName ?? null,
          userEmail: activity.userEmail ?? null,
          createdAt: activity.createdAt,
        }));

        return { activities };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "getDashboardActivity" },
          extra: { tenantId: ctx.authContext.tenantId, limit: input.limit },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard activities",
          cause: error,
        });
      }
    }),
});
