import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, proposalServices, proposals, tasks } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Date range input schema
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const analyticsRouter = router({
  /**
   * Get lead statistics (total, by source, by status)
   */
  getLeadStats: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(leads.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(leads.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(leads.createdAt, new Date(input.endDate)));
      }

      // Total leads
      const totalLeads = await db
        .select({ count: count() })
        .from(leads)
        .where(and(...filters));

      // Leads by status
      const leadsByStatus = await db
        .select({
          status: leads.status,
          count: sql<number>`count(*)::int`,
        })
        .from(leads)
        .where(and(...filters))
        .groupBy(leads.status);

      // Leads by source with conversion data
      const leadsBySource = await db
        .select({
          source: leads.source,
          count: sql<number>`count(*)::int`,
          convertedToProposal: sql<number>`count(DISTINCT CASE WHEN ${proposals.leadId} IS NOT NULL THEN ${leads.id} END)::int`,
        })
        .from(leads)
        .leftJoin(proposals, eq(proposals.leadId, leads.id))
        .where(and(...filters))
        .groupBy(leads.source);

      return {
        total: totalLeads[0]?.count || 0,
        byStatus: leadsByStatus,
        bySource: leadsBySource,
      };
    }),

  /**
   * Get proposal statistics (by status, time metrics)
   */
  getProposalStats: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Total proposals
      const totalProposals = await db
        .select({ count: count() })
        .from(proposals)
        .where(and(...filters));

      // Proposals by status
      const proposalsByStatus = await db
        .select({
          status: proposals.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.status);

      // Average time to sign (for signed proposals)
      const avgTimeToSign = await db
        .select({
          avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${proposals.signedAt} - ${proposals.createdAt})) / 86400)::decimal`,
        })
        .from(proposals)
        .where(and(...filters, eq(proposals.status, "signed")));

      return {
        total: totalProposals[0]?.count || 0,
        byStatus: proposalsByStatus,
        avgTimeToSign: avgTimeToSign[0]?.avgDays || 0,
      };
    }),

  /**
   * Get conversion metrics (lead → proposal → signed)
   */
  getConversionMetrics: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const leadFilters = [eq(leads.tenantId, tenantId)];
      const proposalFilters = [eq(proposals.tenantId, tenantId)];

      if (input?.startDate) {
        leadFilters.push(gte(leads.createdAt, new Date(input.startDate)));
        proposalFilters.push(
          gte(proposals.createdAt, new Date(input.startDate)),
        );
      }
      if (input?.endDate) {
        leadFilters.push(lte(leads.createdAt, new Date(input.endDate)));
        proposalFilters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Count leads
      const totalLeads = await db
        .select({ count: count() })
        .from(leads)
        .where(and(...leadFilters));

      // Count proposals
      const totalProposals = await db
        .select({ count: count() })
        .from(proposals)
        .where(and(...proposalFilters));

      // Count signed proposals
      const signedProposals = await db
        .select({ count: count() })
        .from(proposals)
        .where(and(...proposalFilters, eq(proposals.status, "signed")));

      const leadsCount = totalLeads[0]?.count || 0;
      const proposalsCount = totalProposals[0]?.count || 0;
      const signedCount = signedProposals[0]?.count || 0;

      // Calculate conversion rates
      const leadToProposalRate =
        leadsCount > 0 ? (proposalsCount / leadsCount) * 100 : 0;
      const proposalToSignedRate =
        proposalsCount > 0 ? (signedCount / proposalsCount) * 100 : 0;
      const overallConversionRate =
        leadsCount > 0 ? (signedCount / leadsCount) * 100 : 0;

      return {
        totalLeads: leadsCount,
        totalProposals: proposalsCount,
        signedProposals: signedCount,
        leadToProposalRate,
        proposalToSignedRate,
        overallConversionRate,
      };
    }),

  /**
   * Get pipeline metrics (total value, average deal size, deals by stage)
   */
  getPipelineMetrics: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const leadFilters = [eq(leads.tenantId, tenantId)];
      const proposalFilters = [eq(proposals.tenantId, tenantId)];

      if (input?.startDate) {
        leadFilters.push(gte(leads.createdAt, new Date(input.startDate)));
        proposalFilters.push(
          gte(proposals.createdAt, new Date(input.startDate)),
        );
      }
      if (input?.endDate) {
        leadFilters.push(lte(leads.createdAt, new Date(input.endDate)));
        proposalFilters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Leads by status (pipeline stages)
      const leadsByStage = await db
        .select({
          stage: leads.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(COALESCE(CAST(${leads.estimatedTurnover} AS DECIMAL), 0))::decimal`,
        })
        .from(leads)
        .where(and(...leadFilters))
        .groupBy(leads.status);

      // Proposals total value
      const proposalMetrics = await db
        .select({
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
        })
        .from(proposals)
        .where(
          and(
            ...proposalFilters,
            sql`${proposals.status} IN ('sent', 'viewed', 'signed')`,
          ),
        );

      const totalDeals =
        leadsByStage.reduce((sum, s) => sum + Number(s.count), 0) +
        Number(proposalMetrics[0]?.count || 0);

      const totalValue =
        leadsByStage.reduce((sum, s) => sum + Number(s.totalValue || 0), 0) +
        Number(proposalMetrics[0]?.totalValue || 0);

      const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

      return {
        totalDeals,
        totalValue,
        averageDealSize,
        leadsByStage,
        proposalCount: proposalMetrics[0]?.count || 0,
        proposalValue: proposalMetrics[0]?.totalValue || 0,
      };
    }),

  /**
   * Get Model A vs Model B comparison
   */
  getModelComparison: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Count by model
      const modelStats = await db
        .select({
          model: proposals.pricingModelUsed,
          count: sql<number>`count(*)::int`,
          avgMonthly: sql<number>`avg(${proposals.monthlyTotal})::decimal`,
          totalRevenue: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.pricingModelUsed);

      // Calculate savings (Model B should be lower priced)
      const modelA = modelStats.find((s) => s.model === "Model A");
      const modelB = modelStats.find((s) => s.model === "Model B");

      const avgSavingsB =
        modelA && modelB
          ? Number(modelA.avgMonthly) - Number(modelB.avgMonthly)
          : 0;

      return {
        byModel: modelStats,
        avgSavingsWhenModelB: avgSavingsB,
        totalProposals: modelStats.reduce((sum, s) => sum + Number(s.count), 0),
      };
    }),

  /**
   * Get service popularity (most selected services)
   */
  getServicePopularity: protectedProcedure
    .input(
      dateRangeSchema
        .extend({
          limit: z.number().min(1).max(50).optional().default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters - join with proposals to filter by tenant
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get most selected services
      const servicePopularity = await db
        .select({
          componentCode: proposalServices.componentCode,
          componentName: proposalServices.componentName,
          count: sql<number>`count(*)::int`,
          avgPrice: sql<number>`avg(${proposalServices.price})::decimal`,
          totalRevenue: sql<number>`sum(${proposalServices.price})::decimal`,
        })
        .from(proposalServices)
        .innerJoin(proposals, eq(proposalServices.proposalId, proposals.id))
        .where(and(...filters))
        .groupBy(proposalServices.componentCode, proposalServices.componentName)
        .orderBy(desc(sql`count(*)`))
        .limit(input?.limit || 10);

      // Calculate percentage of proposals including each service
      const totalProposals = await db
        .select({ count: count() })
        .from(proposals)
        .where(and(...filters));

      const total = totalProposals[0]?.count || 0;

      const servicesWithPercentage = servicePopularity.map((service) => ({
        ...service,
        percentage: total > 0 ? (Number(service.count) / total) * 100 : 0,
      }));

      return {
        services: servicesWithPercentage,
        totalProposals: total,
      };
    }),

  /**
   * Get discount analysis
   */
  getDiscountAnalysis: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get proposals with discounts in metadata
      const proposalsWithDiscounts = await db
        .select({
          id: proposals.id,
          metadata: proposals.metadata,
          monthlyTotal: proposals.monthlyTotal,
        })
        .from(proposals)
        .where(and(...filters));

      // Analyze discount types from metadata
      const discountStats: Record<
        string,
        { count: number; totalAmount: number; avgAmount: number }
      > = {
        volume: { count: 0, totalAmount: 0, avgAmount: 0 },
        rush: { count: 0, totalAmount: 0, avgAmount: 0 },
        newClient: { count: 0, totalAmount: 0, avgAmount: 0 },
        other: { count: 0, totalAmount: 0, avgAmount: 0 },
      };

      for (const proposal of proposalsWithDiscounts) {
        const metadata = proposal.metadata as Record<string, unknown> | null;
        if (metadata && typeof metadata === "object") {
          // Check for discount fields in metadata
          if (metadata.volumeDiscount) {
            discountStats.volume.count++;
            discountStats.volume.totalAmount += Number(
              metadata.volumeDiscountAmount || 0,
            );
          }
          if (metadata.rushDiscount) {
            discountStats.rush.count++;
            discountStats.rush.totalAmount += Number(
              metadata.rushDiscountAmount || 0,
            );
          }
          if (metadata.newClientDiscount) {
            discountStats.newClient.count++;
            discountStats.newClient.totalAmount += Number(
              metadata.newClientDiscountAmount || 0,
            );
          }
        }
      }

      // Calculate averages
      for (const type of Object.keys(discountStats)) {
        const stats = discountStats[type];
        stats.avgAmount = stats.count > 0 ? stats.totalAmount / stats.count : 0;
      }

      return {
        byType: Object.entries(discountStats).map(([type, stats]) => ({
          type,
          ...stats,
        })),
        totalProposalsWithDiscounts: proposalsWithDiscounts.filter(
          (p) => p.metadata && typeof p.metadata === "object",
        ).length,
        totalProposals: proposalsWithDiscounts.length,
      };
    }),

  /**
   * Get task metrics (completion rates, overdue)
   */
  getTaskMetrics: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    // Total tasks
    const totalTasks = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.tenantId, tenantId));

    // Tasks by status
    const tasksByStatus = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(eq(tasks.tenantId, tenantId))
      .groupBy(tasks.status);

    // Overdue tasks
    const overdueTasks = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.tenantId, tenantId),
          sql`${tasks.status} != 'done'`,
          sql`${tasks.dueDate} < NOW()`,
        ),
      );

    // Tasks due this week
    const tasksThisWeek = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.tenantId, tenantId),
          sql`${tasks.status} != 'done'`,
          sql`${tasks.dueDate} >= NOW()`,
          sql`${tasks.dueDate} <= NOW() + INTERVAL '7 days'`,
        ),
      );

    return {
      total: totalTasks[0]?.count || 0,
      byStatus: tasksByStatus,
      overdue: overdueTasks[0]?.count || 0,
      dueThisWeek: tasksThisWeek[0]?.count || 0,
    };
  }),

  /**
   * Get complexity distribution (bookkeeping)
   */
  getComplexityDistribution: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get all proposals with metadata
      const proposalsWithMetadata = await db
        .select({
          id: proposals.id,
          metadata: proposals.metadata,
          monthlyTotal: proposals.monthlyTotal,
        })
        .from(proposals)
        .where(and(...filters));

      // Analyze complexity from metadata
      const complexityStats: Record<
        string,
        { count: number; totalValue: number; avgValue: number }
      > = {
        clean: { count: 0, totalValue: 0, avgValue: 0 },
        average: { count: 0, totalValue: 0, avgValue: 0 },
        complex: { count: 0, totalValue: 0, avgValue: 0 },
        disaster: { count: 0, totalValue: 0, avgValue: 0 },
        unknown: { count: 0, totalValue: 0, avgValue: 0 },
      };

      for (const proposal of proposalsWithMetadata) {
        const metadata = proposal.metadata as Record<string, unknown> | null;
        const monthlyValue = Number(proposal.monthlyTotal);

        // Extract complexity level from metadata
        let complexity = "unknown";
        if (metadata && typeof metadata === "object") {
          // Check for bookkeepingComplexity field
          if (
            typeof metadata.bookkeepingComplexity === "string" &&
            metadata.bookkeepingComplexity
          ) {
            complexity = metadata.bookkeepingComplexity.toLowerCase();
          }
          // Check for complexity field
          else if (
            typeof metadata.complexity === "string" &&
            metadata.complexity
          ) {
            complexity = metadata.complexity.toLowerCase();
          }
        }

        // Normalize complexity values
        if (complexity === "clean" || complexity === "low") {
          complexityStats.clean.count++;
          complexityStats.clean.totalValue += monthlyValue;
        } else if (complexity === "average" || complexity === "medium") {
          complexityStats.average.count++;
          complexityStats.average.totalValue += monthlyValue;
        } else if (complexity === "complex" || complexity === "high") {
          complexityStats.complex.count++;
          complexityStats.complex.totalValue += monthlyValue;
        } else if (complexity === "disaster" || complexity === "critical") {
          complexityStats.disaster.count++;
          complexityStats.disaster.totalValue += monthlyValue;
        } else {
          complexityStats.unknown.count++;
          complexityStats.unknown.totalValue += monthlyValue;
        }
      }

      // Calculate averages
      for (const level of Object.keys(complexityStats)) {
        const stats = complexityStats[level];
        stats.avgValue = stats.count > 0 ? stats.totalValue / stats.count : 0;
      }

      // Filter out levels with no data (except unknown)
      const distribution = Object.entries(complexityStats)
        .filter(([level, stats]) => level === "unknown" || stats.count > 0)
        .map(([level, stats]) => ({
          complexity: level.charAt(0).toUpperCase() + level.slice(1),
          count: stats.count,
          totalValue: stats.totalValue,
          avgValue: stats.avgValue,
        }));

      return {
        distribution,
        totalProposals: proposalsWithMetadata.length,
      };
    }),

  /**
   * Get sales funnel metrics (conversion rates between stages)
   */
  getSalesFunnelMetrics: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get proposals grouped by sales stage
      const proposalsByStage = await db
        .select({
          stage: proposals.salesStage,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.salesStage);

      // Define stage order for funnel
      const stageOrder = [
        "enquiry",
        "qualified",
        "proposal_sent",
        "follow_up",
        "won",
        "lost",
        "dormant",
      ];

      // Build funnel data with conversion rates
      const funnelData = stageOrder.map((stage, index) => {
        const stageData = proposalsByStage.find((s) => s.stage === stage);
        const count = Number(stageData?.count || 0);
        const value = Number(stageData?.totalValue || 0);

        // Calculate conversion rate from previous stage
        let conversionRate = 100; // First stage is 100%
        if (index > 0) {
          const previousStage = stageOrder[index - 1];
          const previousData = proposalsByStage.find(
            (s) => s.stage === previousStage,
          );
          const previousCount = Number(previousData?.count || 0);
          conversionRate =
            previousCount > 0 ? (count / previousCount) * 100 : 0;
        }

        return {
          stage,
          count,
          value,
          conversionRate: Number(conversionRate.toFixed(2)),
        };
      });

      // Calculate overall metrics
      const totalProposals = proposalsByStage.reduce(
        (sum, s) => sum + Number(s.count),
        0,
      );
      const wonCount = Number(
        proposalsByStage.find((s) => s.stage === "won")?.count || 0,
      );
      const lostCount = Number(
        proposalsByStage.find((s) => s.stage === "lost")?.count || 0,
      );
      const closedCount = wonCount + lostCount;
      const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

      return {
        funnel: funnelData,
        totalProposals,
        wonCount,
        lostCount,
        winRate: Number(winRate.toFixed(2)),
      };
    }),

  /**
   * Get pipeline velocity metrics (time-in-stage analytics)
   */
  getPipelineVelocityMetrics: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build date filters
      const filters = [eq(proposals.tenantId, tenantId)];
      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get all activity logs for sales stage changes
      const stageChangeActivities = await db
        .select({
          proposalId: activityLogs.entityId,
          action: activityLogs.action,
          oldStage: sql<string>`${activityLogs.oldValues}->>'salesStage'`,
          newStage: sql<string>`${activityLogs.newValues}->>'salesStage'`,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .innerJoin(proposals, eq(activityLogs.entityId, proposals.id))
        .where(
          and(
            ...filters,
            eq(activityLogs.tenantId, tenantId),
            eq(activityLogs.entityType, "proposal"),
            sql`${activityLogs.action} IN ('sales_stage_updated', 'sales_stage_automated')`,
          ),
        )
        .orderBy(activityLogs.createdAt);

      // Calculate average time in each stage
      interface StageMetrics {
        stage: string;
        count: number;
        totalDays: number;
        avgDays: number;
        minDays: number;
        maxDays: number;
      }

      const stageMetrics: Record<string, StageMetrics> = {
        enquiry: {
          stage: "enquiry",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        qualified: {
          stage: "qualified",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        proposal_sent: {
          stage: "proposal_sent",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        follow_up: {
          stage: "follow_up",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        won: {
          stage: "won",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        lost: {
          stage: "lost",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
        dormant: {
          stage: "dormant",
          count: 0,
          totalDays: 0,
          avgDays: 0,
          minDays: Number.POSITIVE_INFINITY,
          maxDays: 0,
        },
      };

      // Group activities by proposal
      const proposalActivities: Record<string, typeof stageChangeActivities> =
        {};
      for (const activity of stageChangeActivities) {
        if (!proposalActivities[activity.proposalId]) {
          proposalActivities[activity.proposalId] = [];
        }
        proposalActivities[activity.proposalId].push(activity);
      }

      // Calculate time in each stage for each proposal
      for (const [_proposalId, activities] of Object.entries(
        proposalActivities,
      )) {
        // Sort by date
        const sortedActivities = activities.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        // Calculate duration for each stage transition
        for (let i = 0; i < sortedActivities.length; i++) {
          const currentActivity = sortedActivities[i];
          const previousActivity = sortedActivities[i - 1];
          const oldStage = currentActivity.oldStage;

          if (oldStage && stageMetrics[oldStage]) {
            const endTime = new Date(currentActivity.createdAt).getTime();
            const startTime = previousActivity
              ? new Date(previousActivity.createdAt).getTime()
              : new Date(currentActivity.createdAt).getTime(); // Fallback

            const durationDays = Math.floor(
              (endTime - startTime) / (1000 * 60 * 60 * 24),
            );

            if (durationDays >= 0) {
              stageMetrics[oldStage].count++;
              stageMetrics[oldStage].totalDays += durationDays;
              stageMetrics[oldStage].minDays = Math.min(
                stageMetrics[oldStage].minDays,
                durationDays,
              );
              stageMetrics[oldStage].maxDays = Math.max(
                stageMetrics[oldStage].maxDays,
                durationDays,
              );
            }
          }
        }
      }

      // Calculate averages and clean up infinity values
      const velocityData = Object.values(stageMetrics).map((metrics) => {
        const avgDays =
          metrics.count > 0 ? metrics.totalDays / metrics.count : 0;
        const minDays =
          metrics.minDays === Number.POSITIVE_INFINITY ? 0 : metrics.minDays;

        return {
          stage: metrics.stage,
          count: metrics.count,
          avgDays: Number(avgDays.toFixed(1)),
          minDays,
          maxDays: metrics.maxDays,
        };
      });

      // Calculate overall pipeline velocity (total time from enquiry to won)
      const wonProposals = velocityData.find((v) => v.stage === "won");
      const avgTimeToWin = wonProposals?.avgDays || 0;

      return {
        velocityByStage: velocityData,
        avgTimeToWin: Number(avgTimeToWin.toFixed(1)),
        totalTransitions: stageChangeActivities.length,
      };
    }),

  /**
   * Get win/loss statistics
   */
  getWinLossStats: protectedProcedure
    .input(
      z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          assignedToId: z.string().optional(),
          clientId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const filters = [
        eq(proposals.tenantId, tenantId),
        sql`${proposals.salesStage} IN ('won', 'lost')`,
      ];

      if (input?.from) {
        filters.push(gte(proposals.createdAt, new Date(input.from)));
      }
      if (input?.to) {
        filters.push(lte(proposals.createdAt, new Date(input.to)));
      }
      if (input?.assignedToId) {
        filters.push(eq(proposals.assignedToId, input.assignedToId));
      }
      if (input?.clientId) {
        filters.push(eq(proposals.clientId, input.clientId));
      }

      const stats = await db
        .select({
          stage: proposals.salesStage,
          count: sql<number>`count(*)::int`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.salesStage);

      const won = stats.find((s) => s.stage === "won")?.count || 0;
      const lost = stats.find((s) => s.stage === "lost")?.count || 0;
      const total = won + lost;

      return {
        totalClosed: total,
        won,
        lost,
        winRate: total > 0 ? Number(((won / total) * 100).toFixed(2)) : 0,
        lossRate: total > 0 ? Number(((lost / total) * 100).toFixed(2)) : 0,
      };
    }),

  /**
   * Get pipeline value by sales stage
   */
  getPipelineValueByStage: protectedProcedure
    .input(
      z
        .object({
          asOf: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Get active pipeline (exclude won and lost)
      const filters = [
        eq(proposals.tenantId, tenantId),
        sql`${proposals.salesStage} NOT IN ('won', 'lost')`,
      ];

      if (input?.asOf) {
        filters.push(lte(proposals.createdAt, new Date(input.asOf)));
      }

      const stageData = await db
        .select({
          stage: proposals.salesStage,
          count: sql<number>`count(*)::int`,
          value: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.salesStage);

      const totalValue = stageData.reduce(
        (sum, stage) => sum + Number(stage.value || 0),
        0,
      );

      return {
        stages: stageData.map((stage) => ({
          stage: stage.stage,
          count: stage.count,
          value: Number(stage.value || 0),
        })),
        totalValue,
      };
    }),

  /**
   * Get average deal size metrics
   */
  getAverageDealSize: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const filters = [eq(proposals.tenantId, tenantId)];

      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Overall averages
      const avgStats = await db
        .select({
          avgMonthly: sql<number>`avg(${proposals.monthlyTotal})::decimal`,
          avgAnnual: sql<number>`avg(${proposals.annualTotal})::decimal`,
          count: sql<number>`count(*)::int`,
        })
        .from(proposals)
        .where(and(...filters));

      // Average by stage
      const byStage = await db
        .select({
          stage: proposals.salesStage,
          avgSize: sql<number>`avg(${proposals.monthlyTotal})::decimal`,
          count: sql<number>`count(*)::int`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.salesStage);

      return {
        avgMonthly: Number(avgStats[0]?.avgMonthly || 0),
        avgAnnual: Number(avgStats[0]?.avgAnnual || 0),
        totalProposals: avgStats[0]?.count || 0,
        byStage: byStage.map((stage) => ({
          stage: stage.stage,
          avgSize: Number(stage.avgSize || 0),
          count: stage.count,
        })),
      };
    }),

  /**
   * Get sales cycle duration metrics
   */
  getSalesCycleDuration: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const filters = [
        eq(proposals.tenantId, tenantId),
        eq(proposals.salesStage, "won"),
        sql`${proposals.signedAt} IS NOT NULL`,
      ];

      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      // Get all won proposals with days to close
      const wonProposals = await db
        .select({
          id: proposals.id,
          daysToWon: sql<number>`EXTRACT(EPOCH FROM (${proposals.signedAt} - ${proposals.createdAt})) / 86400`,
          month: sql<string>`TO_CHAR(${proposals.createdAt}, 'YYYY-MM')`,
        })
        .from(proposals)
        .where(and(...filters));

      if (wonProposals.length === 0) {
        return {
          avgDaysToWon: 0,
          medianDays: 0,
          minDays: 0,
          maxDays: 0,
          byMonth: [],
        };
      }

      // Calculate statistics
      const days = wonProposals
        .map((p) => Number(p.daysToWon))
        .sort((a, b) => a - b);
      const avgDaysToWon = days.reduce((sum, d) => sum + d, 0) / days.length;
      const medianDays = days[Math.floor(days.length / 2)];
      const minDays = days[0];
      const maxDays = days[days.length - 1];

      // Group by month
      const monthlyData: Record<string, { total: number; count: number }> = {};
      for (const proposal of wonProposals) {
        const month = proposal.month;
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0 };
        }
        monthlyData[month].total += Number(proposal.daysToWon);
        monthlyData[month].count++;
      }

      const byMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          avgDays: Number((data.total / data.count).toFixed(1)),
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        avgDaysToWon: Number(avgDaysToWon.toFixed(1)),
        medianDays: Number(medianDays.toFixed(1)),
        minDays: Number(minDays.toFixed(1)),
        maxDays: Number(maxDays.toFixed(1)),
        byMonth,
      };
    }),

  /**
   * Get monthly trend data
   */
  getMonthlyTrend: protectedProcedure
    .input(
      z
        .object({
          months: z.number().min(1).max(24).optional().default(12),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const months = input?.months || 12;

      // Calculate date range
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const monthlyData = await db
        .select({
          month: sql<string>`TO_CHAR(${proposals.createdAt}, 'YYYY-MM')`,
          proposals: sql<number>`count(*)::int`,
          won: sql<number>`count(CASE WHEN ${proposals.salesStage} = 'won' THEN 1 END)::int`,
          lost: sql<number>`count(CASE WHEN ${proposals.salesStage} = 'lost' THEN 1 END)::int`,
          revenue: sql<number>`sum(CASE WHEN ${proposals.salesStage} = 'won' THEN ${proposals.monthlyTotal} ELSE 0 END)::decimal`,
        })
        .from(proposals)
        .where(
          and(
            eq(proposals.tenantId, tenantId),
            gte(proposals.createdAt, startDate),
          ),
        )
        .groupBy(sql`TO_CHAR(${proposals.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${proposals.createdAt}, 'YYYY-MM')`);

      return {
        trend: monthlyData.map((month) => ({
          month: month.month,
          proposals: month.proposals,
          won: month.won,
          lost: month.lost,
          revenue: Number(month.revenue || 0),
        })),
      };
    }),

  /**
   * Get loss reasons breakdown
   */
  getLossReasons: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const filters = [
        eq(proposals.tenantId, tenantId),
        eq(proposals.salesStage, "lost"),
      ];

      if (input?.startDate) {
        filters.push(gte(proposals.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        filters.push(lte(proposals.createdAt, new Date(input.endDate)));
      }

      const lossData = await db
        .select({
          reason: proposals.lossReason,
          count: sql<number>`count(*)::int`,
        })
        .from(proposals)
        .where(and(...filters))
        .groupBy(proposals.lossReason);

      const totalLost = lossData.reduce((sum, r) => sum + r.count, 0);

      const reasons = lossData
        .map((r) => ({
          reason: r.reason || "Not specified",
          count: r.count,
          percentage:
            totalLost > 0
              ? Number(((r.count / totalLost) * 100).toFixed(1))
              : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        reasons,
        totalLost,
      };
    }),
});
