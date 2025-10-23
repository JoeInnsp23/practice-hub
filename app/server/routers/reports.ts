import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  calculateDateRange,
  getClientRevenue,
  getMonthlyRevenue,
  getReportsDashboardKpis,
  getServicePerformance,
} from "@/lib/db/queries/reports-queries";
import { protectedProcedure, router } from "../trpc";

export const reportsRouter = router({
  /**
   * Get dashboard KPIs for reports page
   * AC1: Dashboard KPIs Query
   */
  getDashboardKpis: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { tenantId } = ctx.authContext;

      const kpiData = await getReportsDashboardKpis(tenantId);

      // If no data found (new tenant), return zeros
      if (!kpiData) {
        return {
          totalRevenue: 0,
          collectedRevenue: 0,
          outstandingRevenue: 0,
          activeClients: 0,
          newClients30d: 0,
          activeTasks: 0, // Alias for in_progress_tasks
          overdueTasks: 0,
          totalHours30d: 0,
          billableHours30d: 0,
          utilizationRate: 0,
          collectionRate: 0,
        };
      }

      // Transform to camelCase and calculate derived metrics
      const totalRevenue = Number(kpiData.totalRevenue || 0);
      const collectedRevenue = Number(kpiData.collectedRevenue || 0);
      const totalHours = Number(kpiData.totalHours30d || 0);
      const billableHours = Number(kpiData.billableHours30d || 0);

      return {
        totalRevenue,
        collectedRevenue,
        outstandingRevenue: Number(kpiData.outstandingRevenue || 0),
        activeClients: Number(kpiData.activeClients || 0),
        newClients30d: Number(kpiData.newClients30d || 0),
        activeTasks: Number(kpiData.inProgressTasks || 0), // Active = in progress
        overdueTasks: Number(kpiData.overdueTasks || 0),
        totalHours30d: totalHours,
        billableHours30d: billableHours,
        utilizationRate:
          totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
        collectionRate:
          totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "reports_getDashboardKpis" },
        extra: { tenantId: ctx.authContext.tenantId },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard KPIs",
        cause: error,
      });
    }
  }),

  /**
   * Get monthly revenue data for charts
   * AC2: Monthly Revenue Chart
   * AC5: Date Range Filtering
   */
  getMonthlyRevenue: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(12),
        period: z
          .enum([
            "this_month",
            "last_month",
            "this_quarter",
            "last_quarter",
            "this_year",
            "last_year",
            "last_30_days",
            "last_90_days",
            "last_365_days",
            "custom",
          ])
          .optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { tenantId } = ctx.authContext;
        const { months, period, startDate, endDate } = input;

        // Calculate date range if period is specified
        let dateRange:
          | { startDate: Date; endDate: Date }
          | { startDate?: Date; endDate?: Date } = {};

        if (period && period !== "custom") {
          dateRange = calculateDateRange(period);
        } else if (startDate && endDate) {
          dateRange = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          };
        }

        const revenueData = await getMonthlyRevenue(tenantId, {
          months,
          ...dateRange,
        });

        // Transform to frontend format
        return revenueData.map((item) => ({
          month: item.month?.toISOString() || "",
          invoiced: Number(item.invoiced || 0),
          collected: Number(item.collected || 0),
          invoiceCount: Number(item.invoiceCount || 0),
          uniqueClients: Number(item.uniqueClients || 0),
        }));
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "reports_getMonthlyRevenue" },
          extra: {
            tenantId: ctx.authContext.tenantId,
            input,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch monthly revenue data",
          cause: error,
        });
      }
    }),

  /**
   * Get client revenue breakdown for charts
   * AC3: Client Breakdown Chart
   * AC5: Date Range Filtering
   */
  getClientRevenue: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        period: z
          .enum([
            "this_month",
            "last_month",
            "this_quarter",
            "last_quarter",
            "this_year",
            "last_year",
            "last_30_days",
            "last_90_days",
            "last_365_days",
            "custom",
          ])
          .optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { tenantId } = ctx.authContext;
        const { limit, period, startDate, endDate } = input;

        // Calculate date range if period is specified
        let dateRange:
          | { startDate: Date; endDate: Date }
          | { startDate?: Date; endDate?: Date } = {};

        if (period && period !== "custom") {
          dateRange = calculateDateRange(period);
        } else if (startDate && endDate) {
          dateRange = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          };
        }

        const clientData = await getClientRevenue(tenantId, {
          limit,
          ...dateRange,
        });

        // Transform to frontend format
        return clientData.map((item) => ({
          clientId: item.clientId,
          clientName: item.clientName || "Unknown",
          clientCode: item.clientCode || "",
          totalInvoiced: Number(item.totalInvoiced || 0),
          totalPaid: Number(item.totalPaid || 0),
          outstanding: Number(item.outstanding || 0),
          invoiceCount: Number(item.invoiceCount || 0),
        }));
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "reports_getClientRevenue" },
          extra: {
            tenantId: ctx.authContext.tenantId,
            input,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch client revenue data",
          cause: error,
        });
      }
    }),

  /**
   * Get service performance report
   * AC4: Service Performance Report
   */
  getServicePerformance: protectedProcedure
    .input(
      z
        .object({
          period: z
            .enum([
              "this_month",
              "last_month",
              "this_quarter",
              "last_quarter",
              "this_year",
              "last_year",
              "last_30_days",
              "last_90_days",
              "last_365_days",
              "custom",
            ])
            .optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { tenantId } = ctx.authContext;

        // Calculate date range if period is specified
        let dateRange:
          | { startDate: Date; endDate: Date }
          | { startDate?: Date; endDate?: Date } = {};

        if (input?.period && input.period !== "custom") {
          dateRange = calculateDateRange(input.period);
        } else if (input?.startDate && input?.endDate) {
          dateRange = {
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
          };
        }

        const serviceData = await getServicePerformance(tenantId, dateRange);

        // Transform to frontend format
        return serviceData.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName || "Unknown Service",
          serviceCode: item.serviceCode || "",
          serviceCategory: item.serviceCategory || "",
          totalRevenue: Number(item.totalRevenue || 0),
          activeClients: Number(item.activeClients || 0),
          totalClients: Number(item.totalClients || 0),
        }));
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "reports_getServicePerformance" },
          extra: {
            tenantId: ctx.authContext.tenantId,
            input,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch service performance data",
          cause: error,
        });
      }
    }),
});
