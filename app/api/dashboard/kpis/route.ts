import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query the dashboard KPI view for aggregated metrics
    const kpis = await db.execute(
      sql`SELECT * FROM dashboard_kpi_view WHERE tenant_id = ${authContext.tenantId}`
    );

    // Extract the first row (should only be one row per tenant)
    const kpiData = kpis.rows[0] || {
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
    const formattedKpis = {
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

      // Calculate derived metrics
      utilizationRate: kpiData.total_hours_30d > 0
        ? (Number(kpiData.billable_hours_30d) / Number(kpiData.total_hours_30d)) * 100
        : 0,
      collectionRate: kpiData.total_revenue > 0
        ? (Number(kpiData.collected_revenue) / Number(kpiData.total_revenue)) * 100
        : 0
    };

    return NextResponse.json({ kpis: formattedKpis });
  } catch (error) {
    console.error("Dashboard KPIs API: Failed to fetch KPIs", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard KPIs" },
      { status: 500 },
    );
  }
}