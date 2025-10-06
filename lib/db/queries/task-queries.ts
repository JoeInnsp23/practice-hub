import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { taskDetailsView } from "@/lib/db/schema";

/**
 * Fetch tasks list with filters
 * Uses task_details_view for joined data
 */
export async function getTasksList(
  tenantId: string,
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    clientId?: string;
    overdue?: boolean;
  },
) {
  const conditions = [eq(taskDetailsView.tenantId, tenantId)];

  // Search filter (title or description)
  if (filters.search) {
    const searchCondition = or(
      ilike(taskDetailsView.title, `%${filters.search}%`),
      ilike(taskDetailsView.description, `%${filters.search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(taskDetailsView.status, filters.status));
  }

  // Priority filter
  if (filters.priority && filters.priority !== "all") {
    conditions.push(eq(taskDetailsView.priority, filters.priority));
  }

  // Assignee filter
  if (filters.assigneeId) {
    conditions.push(eq(taskDetailsView.assignedToId, filters.assigneeId));
  }

  // Client filter
  if (filters.clientId) {
    conditions.push(eq(taskDetailsView.clientId, filters.clientId));
  }

  // Overdue filter
  if (filters.overdue) {
    conditions.push(
      sql`${taskDetailsView.dueDate} < CURRENT_DATE AND ${taskDetailsView.status} NOT IN ('completed', 'cancelled')`,
    );
  }

  const tasks = await db
    .select()
    .from(taskDetailsView)
    .where(and(...conditions))
    .orderBy(taskDetailsView.createdAt);

  return tasks;
}
