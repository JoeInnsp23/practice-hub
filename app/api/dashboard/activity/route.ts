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

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;
    const offset = Number(searchParams.get("offset")) || 0;
    const entityType = searchParams.get("entityType");

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
      WHERE tenant_id = ${authContext.tenantId}
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
        WHERE tenant_id = ${authContext.tenantId}
          AND entity_type = ${entityType}
      `;
    }

    // Add pagination
    query = sql`${query} LIMIT ${limit} OFFSET ${offset}`;

    const activities = await db.execute(query);

    // Format the activities for the frontend
    const formattedActivities = activities.rows.map((activity: any) => ({
      id: activity.id,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      entityName: activity.entity_name,
      action: activity.action,
      description: activity.description || generateDescription(activity),
      userName: activity.user_display_name || activity.user_name || "System",
      userEmail: activity.user_email,
      createdAt: activity.created_at,
      // Generate icon and color based on entity type and action
      icon: getActivityIcon(activity.entity_type, activity.action),
      color: getActivityColor(activity.action)
    }));

    // Get total count for pagination
    const countResult = await db.execute(
      sql`
        SELECT COUNT(*) as total
        FROM activity_feed_view
        WHERE tenant_id = ${authContext.tenantId}
        ${entityType && entityType !== "all" ? sql`AND entity_type = ${entityType}` : sql``}
      `
    );

    const total = Number(countResult.rows[0]?.total || 0);

    return NextResponse.json({
      activities: formattedActivities,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Activity Feed API: Failed to fetch activities", error);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 },
    );
  }
}

// Helper function to generate description if not provided
function generateDescription(activity: any): string {
  const entityName = activity.entity_name || `${activity.entity_type} #${activity.entity_id?.substring(0, 8)}`;
  const action = activity.action?.replace(/_/g, " ");

  switch (activity.action) {
    case "created":
      return `Created ${activity.entity_type} "${entityName}"`;
    case "updated":
      return `Updated ${activity.entity_type} "${entityName}"`;
    case "deleted":
      return `Deleted ${activity.entity_type} "${entityName}"`;
    case "status_changed":
      return `Changed status of ${activity.entity_type} "${entityName}"`;
    case "assigned":
      return `Assigned ${activity.entity_type} "${entityName}"`;
    case "completed":
      return `Completed ${activity.entity_type} "${entityName}"`;
    default:
      return `${action} ${activity.entity_type} "${entityName}"`;
  }
}

// Helper function to determine activity icon
function getActivityIcon(entityType: string, action: string): string {
  // Map entity types and actions to icon names
  if (entityType === "task") {
    switch (action) {
      case "completed": return "CheckCircle";
      case "created": return "PlusCircle";
      default: return "ListTodo";
    }
  }
  if (entityType === "client") return "Users";
  if (entityType === "invoice") return "Receipt";
  if (entityType === "compliance") return "Shield";
  if (entityType === "document") return "FileText";
  return "Activity";
}

// Helper function to determine activity color
function getActivityColor(action: string): string {
  switch (action) {
    case "completed":
    case "paid":
      return "success";
    case "created":
      return "primary";
    case "deleted":
      return "destructive";
    case "overdue":
      return "warning";
    default:
      return "default";
  }
}