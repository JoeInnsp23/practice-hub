import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  leads,
  proposalServices,
  proposals,
  tasks,
} from "@/lib/db/schema";
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

      // Leads by source
      const leadsBySource = await db
        .select({
          source: leads.source,
          count: sql<number>`count(*)::int`,
        })
        .from(leads)
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
        .where(
          and(...filters, eq(proposals.status, "signed")),
        );

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

      const avgSavingsB = modelA && modelB
        ? Number(modelA.avgMonthly) - Number(modelB.avgMonthly)
        : 0;

      return {
        byModel: modelStats,
        avgSavingsWhenModelB: avgSavingsB,
        totalProposals: modelStats.reduce(
          (sum, s) => sum + Number(s.count),
          0,
        ),
      };
    }),

  /**
   * Get service popularity (most selected services)
   */
  getServicePopularity: protectedProcedure
    .input(
      dateRangeSchema.extend({
        limit: z.number().min(1).max(50).optional().default(10),
      }).optional(),
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
        .groupBy(
          proposalServices.componentCode,
          proposalServices.componentName,
        )
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
});
