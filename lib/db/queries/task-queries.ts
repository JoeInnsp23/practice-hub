import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
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
    sortBy?:
      | "title"
      | "clientName"
      | "status"
      | "priority"
      | "dueDate"
      | "assigneeName"
      | "progress";
    sortOrder?: "asc" | "desc";
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

  // Assignee filter (checks assignedTo, preparer, and reviewer)
  if (filters.assigneeId) {
    const assigneeCondition = or(
      eq(taskDetailsView.assignedToId, filters.assigneeId),
      eq(taskDetailsView.preparerId, filters.assigneeId),
      eq(taskDetailsView.reviewerId, filters.assigneeId),
    );
    if (assigneeCondition) {
      conditions.push(assigneeCondition);
    }
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

  // Build orderBy based on sortBy and sortOrder
  const orderByArray = [];
  const sortDirection = filters.sortOrder === "desc" ? desc : asc;

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "title":
        orderByArray.push(sortDirection(taskDetailsView.title));
        break;
      case "clientName":
        orderByArray.push(sortDirection(taskDetailsView.clientName));
        break;
      case "status":
        orderByArray.push(sortDirection(taskDetailsView.status));
        break;
      case "priority":
        // Sort by priority with custom order: critical/urgent > high > medium > low
        orderByArray.push(
          filters.sortOrder === "desc"
            ? sql`CASE
                WHEN ${taskDetailsView.priority} IN ('critical', 'urgent') THEN 1
                WHEN ${taskDetailsView.priority} = 'high' THEN 2
                WHEN ${taskDetailsView.priority} = 'medium' THEN 3
                WHEN ${taskDetailsView.priority} = 'low' THEN 4
                ELSE 5
              END`
            : sql`CASE
                WHEN ${taskDetailsView.priority} = 'low' THEN 1
                WHEN ${taskDetailsView.priority} = 'medium' THEN 2
                WHEN ${taskDetailsView.priority} = 'high' THEN 3
                WHEN ${taskDetailsView.priority} IN ('critical', 'urgent') THEN 4
                ELSE 5
              END`,
        );
        break;
      case "dueDate":
        orderByArray.push(sortDirection(taskDetailsView.dueDate));
        break;
      case "assigneeName":
        orderByArray.push(sortDirection(taskDetailsView.assigneeName));
        break;
      case "progress":
        orderByArray.push(sortDirection(taskDetailsView.progress));
        break;
    }
  } else {
    // Default sorting by created date (newest first)
    orderByArray.push(desc(taskDetailsView.createdAt));
  }

  const tasks = await db
    .select()
    .from(taskDetailsView)
    .where(and(...conditions))
    .orderBy(...orderByArray);

  return tasks;
}
