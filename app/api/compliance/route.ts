import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compliance } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const overdue = searchParams.get("overdue");

    // Build query using compliance details view
    let query = sql`
      SELECT * FROM compliance_details_view
      WHERE tenant_id = ${authContext.tenantId}
    `;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(sql`status = ${status}`);
    }
    if (clientId) {
      conditions.push(sql`client_id = ${clientId}`);
    }
    if (overdue === "true") {
      conditions.push(sql`is_overdue = true`);
    }

    if (conditions.length > 0) {
      query = sql`
        SELECT * FROM compliance_details_view
        WHERE tenant_id = ${authContext.tenantId}
          AND ${sql.join(conditions, sql` AND `)}
      `;
    }

    query = sql`${query} ORDER BY due_date ASC`;

    const result = await db.execute(query);

    const complianceItems = result.rows.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description,
      clientId: item.client_id,
      clientName: item.client_name,
      clientCode: item.client_code,
      assignedToId: item.assigned_to_id,
      assigneeName: item.assignee_name,
      dueDate: item.due_date,
      completedDate: item.completed_date,
      reminderDate: item.reminder_date,
      status: item.status,
      priority: item.priority,
      isOverdue: item.is_overdue,
      notes: item.notes,
      attachments: item.attachments,
      createdAt: item.created_at
    }));

    return NextResponse.json({ compliance: complianceItems });
  } catch (error) {
    console.error("Compliance API: Failed to fetch compliance items", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance items" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.type || !body.clientId || !body.dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [newCompliance] = await db
      .insert(compliance)
      .values({
        tenantId: authContext.tenantId,
        title: body.title,
        type: body.type,
        description: body.description,
        clientId: body.clientId,
        assignedToId: body.assignedToId,
        dueDate: new Date(body.dueDate),
        reminderDate: body.reminderDate ? new Date(body.reminderDate) : null,
        status: body.status || "pending",
        priority: body.priority || "medium",
        notes: body.notes,
        attachments: body.attachments,
        createdById: authContext.userId
      })
      .returning();

    return NextResponse.json({ success: true, compliance: newCompliance });
  } catch (error) {
    console.error("Compliance API: Failed to create compliance item", error);
    return NextResponse.json(
      { error: "Failed to create compliance item" },
      { status: 500 },
    );
  }
}