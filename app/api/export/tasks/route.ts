import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/auth";
import { sql } from "drizzle-orm";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const clientId = searchParams.get("clientId");

    // Build query
    let query = sql`
      SELECT
        t.task_code,
        t.title,
        t.description,
        c.name as client_name,
        c.client_code,
        s.name as service_name,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee,
        CONCAT(u2.first_name, ' ', u2.last_name) as reviewer,
        t.status,
        t.priority,
        t.progress,
        t.estimated_hours,
        t.actual_hours,
        t.target_date,
        t.start_date,
        t.completed_date,
        t.tags,
        t.notes,
        t.created_at
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN users u1 ON t.assigned_to_id = u1.id
      LEFT JOIN users u2 ON t.reviewer_id = u2.id
      WHERE t.tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(sql`t.status = ${status}`);
    }
    if (priority && priority !== "all") {
      conditions.push(sql`t.priority = ${priority}`);
    }
    if (assigneeId) {
      conditions.push(sql`t.assigned_to_id = ${assigneeId}`);
    }
    if (clientId) {
      conditions.push(sql`t.client_id = ${clientId}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY t.created_at DESC`;

    const result = await db.execute(query);
    const tasks = result.rows;

    // Format the data
    const exportData = tasks.map((task: any) => ({
      "Task Code": task.task_code,
      "Title": task.title,
      "Description": task.description || "",
      "Client": task.client_name || "",
      "Client Code": task.client_code || "",
      "Service": task.service_name || "",
      "Assignee": task.assignee || "",
      "Reviewer": task.reviewer || "",
      "Status": task.status,
      "Priority": task.priority,
      "Progress %": task.progress || 0,
      "Estimated Hours": task.estimated_hours || "",
      "Actual Hours": task.actual_hours || "",
      "Target Date": task.target_date || "",
      "Start Date": task.start_date || "",
      "Completed Date": task.completed_date || "",
      "Tags": task.tags ? task.tags.join(", ") : "",
      "Notes": task.notes || "",
      "Created Date": task.created_at ? new Date(task.created_at).toLocaleDateString() : "",
    }));

    if (format === "json") {
      // Return JSON
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="tasks_export_${Date.now()}.json"`,
        },
      });
    } else {
      // Return CSV
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="tasks_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export API: Failed to export tasks", error);
    return NextResponse.json(
      { error: "Failed to export tasks" },
      { status: 500 }
    );
  }
}