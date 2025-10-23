import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientRevenueView,
  clients,
  clientServices,
  dashboardKpiView,
  invoices,
  monthlyRevenueView,
  services,
} from "@/lib/db/schema";

/**
 * Fetch dashboard KPIs for reports page
 * Returns aggregated metrics from the dashboard_kpi_view
 */
export async function getReportsDashboardKpis(tenantId: string) {
  const result = await db
    .select()
    .from(dashboardKpiView)
    .where(eq(dashboardKpiView.tenantId, tenantId))
    .limit(1);

  return result[0] || null;
}

/**
 * Fetch monthly revenue data for charts
 * Returns last N months of revenue data
 */
export async function getMonthlyRevenue(
  tenantId: string,
  options: {
    months?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  let query = db
    .select()
    .from(monthlyRevenueView)
    .where(eq(monthlyRevenueView.tenantId, tenantId))
    .$dynamic();

  // Add date range filters if specified
  if (options.startDate) {
    query = query.where(gte(monthlyRevenueView.month, options.startDate));
  }

  if (options.endDate) {
    query = query.where(lte(monthlyRevenueView.month, options.endDate));
  }

  // Add ordering and limit
  const revenue = await query
    .orderBy(desc(monthlyRevenueView.month))
    .limit(options.months || 12);

  // Return in chronological order (oldest first)
  return revenue.reverse();
}

/**
 * Fetch client revenue breakdown for charts
 * Returns top N clients by revenue
 */
export async function getClientRevenue(
  tenantId: string,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  // If no date range specified, use the pre-aggregated view for better performance
  if (!options.startDate && !options.endDate) {
    const query = db
      .select()
      .from(clientRevenueView)
      .where(eq(clientRevenueView.tenantId, tenantId))
      .orderBy(desc(clientRevenueView.totalPaid))
      .limit(options.limit || 10);

    return await query;
  }

  // With date range, query invoices directly and aggregate
  let query = db
    .select({
      tenantId: invoices.tenantId,
      clientId: invoices.clientId,
      clientName: clients.name,
      clientCode: clients.clientCode,
      totalInvoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`.as(
        "total_invoiced",
      ),
      totalPaid: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`.as(
        "total_paid",
      ),
      outstanding: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`.as(
        "outstanding",
      ),
      invoiceCount: sql<number>`COUNT(${invoices.id})`.as("invoice_count"),
      firstInvoiceDate: sql<Date | null>`MIN(${invoices.issueDate})`.as(
        "first_invoice_date",
      ),
      lastInvoiceDate: sql<Date | null>`MAX(${invoices.issueDate})`.as(
        "last_invoice_date",
      ),
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        sql`${invoices.status} IN ('sent', 'paid', 'overdue')`,
      ),
    )
    .$dynamic();

  // Apply date range filters
  if (options.startDate) {
    query = query.where(gte(invoices.issueDate, options.startDate));
  }

  if (options.endDate) {
    query = query.where(lte(invoices.issueDate, options.endDate));
  }

  // Group by client and order by revenue
  const result = await query
    .groupBy(
      invoices.tenantId,
      invoices.clientId,
      clients.name,
      clients.clientCode,
    )
    .orderBy(desc(sql`total_paid`))
    .limit(options.limit || 10);

  return result;
}

/**
 * Fetch service performance data
 * Returns revenue and client count by service
 */
export async function getServicePerformance(
  tenantId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  },
) {
  // Build base query for service revenue from invoices
  // This aggregates invoice items by service
  let query = db
    .select({
      serviceId: clientServices.serviceId,
      serviceName: services.name,
      serviceCode: services.code,
      serviceCategory: services.category,
      totalRevenue: sql<number>`COALESCE(SUM(CASE
        WHEN ${invoices.status} = 'paid'
        THEN ${clientServices.customRate} * ${clientServices.quantity}
        ELSE 0
      END), 0)`.as("total_revenue"),
      activeClients: sql<number>`COUNT(DISTINCT ${clientServices.clientId})`.as(
        "active_clients",
      ),
      totalClients: sql<number>`COUNT(DISTINCT ${clientServices.clientId})`.as(
        "total_clients",
      ),
    })
    .from(clientServices)
    .leftJoin(services, eq(clientServices.serviceId, services.id))
    .leftJoin(invoices, eq(invoices.clientId, clientServices.clientId))
    .$dynamic();

  // Build where conditions
  const whereConditions = [
    eq(clientServices.tenantId, tenantId),
    eq(clientServices.status, "active"),
  ];

  // Add date range filters if specified
  if (options?.startDate) {
    whereConditions.push(gte(invoices.issueDate, options.startDate));
  }

  if (options?.endDate) {
    whereConditions.push(lte(invoices.issueDate, options.endDate));
  }

  const serviceRevenueQuery = query
    .where(and(...whereConditions))
    .groupBy(
      clientServices.serviceId,
      services.name,
      services.code,
      services.category,
    )
    .orderBy(desc(sql`total_revenue`));

  return await serviceRevenueQuery;
}

/**
 * Calculate date ranges for common periods
 */
export function calculateDateRange(period: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (period) {
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate.setDate(0); // Last day of previous month
      break;
    case "this_quarter": {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    }
    case "last_quarter": {
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterYear =
        lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3;
      startDate = new Date(lastQuarterYear, lastQuarterMonth, 1);
      endDate.setMonth(endDate.getMonth(), 0); // Last day of last quarter
      break;
    }
    case "this_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "last_year":
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    case "last_30_days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "last_90_days":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "last_365_days":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      // Default to last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }

  return { startDate, endDate };
}
