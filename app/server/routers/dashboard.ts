import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = router({
  kpis: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    // Query the dashboard KPI view for aggregated metrics
    const kpisResult = await db.execute(
      sql`SELECT * FROM dashboard_kpi_view WHERE tenant_id = ${tenantId}`
    );

    // Extract the first row (should only be one row per tenant)
    const kpiData = kpisResult.rows[0] || {
      total_revenue: 0,
      collected_revenue: 0,
      outstanding_revenue: 0,
      active_clients: 0,
      new_clients_30d: 0,
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks_30d: 0,
      overdue_tasks: 0,
      total_hours_30d: 0,
      billable_hours_30d: 0,
      upcoming_compliance_30d: 0,
      overdue_compliance: 0
    };

    // Transform to camelCase for frontend
    const kpis = {
      totalRevenue: Number(kpiData.total_revenue || 0),
      collectedRevenue: Number(kpiData.collected_revenue || 0),
      outstandingRevenue: Number(kpiData.outstanding_revenue || 0),
      activeClients: Number(kpiData.active_clients || 0),
      newClients30d: Number(kpiData.new_clients_30d || 0),
      pendingTasks: Number(kpiData.pending_tasks || 0),
      inProgressTasks: Number(kpiData.in_progress_tasks || 0),
      completedTasks30d: Number(kpiData.completed_tasks_30d || 0),
      overdueTasks: Number(kpiData.overdue_tasks || 0),
      totalHours30d: Number(kpiData.total_hours_30d || 0),
      billableHours30d: Number(kpiData.billable_hours_30d || 0),
      upcomingCompliance30d: Number(kpiData.upcoming_compliance_30d || 0),
      overdueCompliance: Number(kpiData.overdue_compliance || 0),
      utilizationRate: kpiData.total_hours_30d > 0
        ? (Number(kpiData.billable_hours_30d) / Number(kpiData.total_hours_30d)) * 100
        : 0,
      collectionRate: kpiData.total_revenue > 0
        ? (Number(kpiData.collected_revenue) / Number(kpiData.total_revenue)) * 100
        : 0
    };

    return { kpis };
  }),

  activity: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      entityType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { limit, offset, entityType } = input;

      // Build the query with optional entity type filter
      let query = sql`
        SELECT
          id,
          entity_type,
          entity_id,
          entity_name,
          action,
          description,
          user_name,
          user_display_name,
          user_email,
          created_at
        FROM activity_feed_view
        WHERE tenant_id = ${tenantId}
      `;

      if (entityType && entityType !== "all") {
        query = sql`
          SELECT
            id,
            entity_type,
            entity_id,
            entity_name,
            action,
            description,
            user_name,
            user_display_name,
            user_email,
            created_at
          FROM activity_feed_view
          WHERE tenant_id = ${tenantId}
            AND entity_type = ${entityType}
        `;
      }

      // Add ordering and pagination
      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await db.execute(query);

      // Format activities
      const activities = result.rows.map((activity: any) => ({
        id: activity.id,
        entityType: activity.entity_type,
        entityId: activity.entity_id,
        entityName: activity.entity_name,
        action: activity.action,
        description: activity.description,
        userName: activity.user_name,
        userDisplayName: activity.user_display_name,
        userEmail: activity.user_email,
        createdAt: activity.created_at,
      }));

      return { activities };
    }),
});