import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dashboardKpiView, activityFeedView } from "@/lib/db/schema";

/**
 * Fetch dashboard KPIs for a given tenant
 * Returns aggregated metrics from the dashboard_kpi_view
 */
export async function getDashboardKpis(tenantId: string) {
  const result = await db
    .select()
    .from(dashboardKpiView)
    .where(eq(dashboardKpiView.tenantId, tenantId))
    .limit(1);

  return result[0] || null;
}

/**
 * Fetch activity feed for a given tenant
 * Supports filtering by entity type and pagination
 */
export async function getActivityFeed(
  tenantId: string,
  options: {
    limit: number;
    offset: number;
    entityType?: string;
  },
) {
  let query = db
    .select()
    .from(activityFeedView)
    .where(eq(activityFeedView.tenantId, tenantId))
    .$dynamic();

  // Add entity type filter if specified
  if (options.entityType && options.entityType !== "all") {
    query = query.where(eq(activityFeedView.entityType, options.entityType));
  }

  // Add ordering and pagination
  const activities = await query
    .orderBy(desc(activityFeedView.createdAt))
    .limit(options.limit)
    .offset(options.offset);

  return activities;
}