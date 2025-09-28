import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeEntries, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, gte, lte, between, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const clientId = searchParams.get("clientId");
    const taskId = searchParams.get("taskId");
    const billable = searchParams.get("billable");
    const status = searchParams.get("status");

    // Build query using time entries view
    let query = sql`
      SELECT * FROM time_entries_view
      WHERE tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];

    // Date range filter (required for performance)
    if (startDate && endDate) {
      conditions.push(sql`date BETWEEN ${startDate} AND ${endDate}`);
    } else if (startDate) {
      conditions.push(sql`date >= ${startDate}`);
    } else if (endDate) {
      conditions.push(sql`date <= ${endDate}`);
    } else {
      // Default to last 30 days if no date range specified
      conditions.push(sql`date >= CURRENT_DATE - INTERVAL '30 days'`);
    }

    if (userId) {
      conditions.push(sql`user_id = ${userId}`);
    }
    if (clientId) {
      conditions.push(sql`client_id = ${clientId}`);
    }
    if (taskId) {
      conditions.push(sql`task_id = ${taskId}`);
    }
    if (billable !== null && billable !== undefined) {
      conditions.push(sql`billable = ${billable === "true"}`);
    }
    if (status && status !== "all") {
      conditions.push(sql`status = ${status}`);
    }

    // Combine conditions
    if (conditions.length > 0) {
      query = sql`
        SELECT * FROM time_entries_view
        WHERE tenant_id = ${authContext.tenantId}
          AND ${sql.join(conditions, sql` AND `)}
      `;
    }

    // Add ordering
    query = sql`${query} ORDER BY date DESC, start_time DESC`;

    const result = await db.execute(query);

    // Format the response
    const entriesList = result.rows.map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      userName: entry.user_name,
      userEmail: entry.user_email,
      clientId: entry.client_id,
      clientName: entry.client_name,
      clientCode: entry.client_code,
      taskId: entry.task_id,
      taskTitle: entry.task_title,
      serviceId: entry.service_id,
      serviceName: entry.service_name,
      serviceCode: entry.service_code,
      date: entry.date,
      startTime: entry.start_time,
      endTime: entry.end_time,
      hours: Number(entry.hours || 0),
      workType: entry.work_type,
      billable: entry.billable,
      billed: entry.billed,
      rate: entry.rate ? Number(entry.rate) : null,
      amount: entry.amount ? Number(entry.amount) : null,
      description: entry.description,
      notes: entry.notes,
      status: entry.status,
      approvedById: entry.approved_by_id,
      approverName: entry.approver_name,
      approvedAt: entry.approved_at,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    }));

    // Calculate totals
    const totals = {
      totalHours: entriesList.reduce((sum, entry) => sum + entry.hours, 0),
      billableHours: entriesList.filter(e => e.billable).reduce((sum, entry) => sum + entry.hours, 0),
      nonBillableHours: entriesList.filter(e => !e.billable).reduce((sum, entry) => sum + entry.hours, 0),
      totalAmount: entriesList.filter(e => e.billable).reduce((sum, entry) => sum + (entry.amount || 0), 0)
    };

    return NextResponse.json({
      entries: entriesList,
      totals
    });
  } catch (error) {
    console.error("Time Entries API: Failed to fetch entries", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
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

    // Validate required fields
    if (!body.date || body.hours === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: date, hours" },
        { status: 400 },
      );
    }

    // Validate hours
    if (body.hours <= 0 || body.hours > 24) {
      return NextResponse.json(
        { error: "Hours must be between 0 and 24" },
        { status: 400 },
      );
    }

    // Create time entry in transaction
    const result = await db.transaction(async (tx) => {
      // Calculate amount if billable and rate provided
      let amount = null;
      if (body.billable && body.rate) {
        amount = body.hours * body.rate;
      }

      // Create the time entry
      const [newEntry] = await tx
        .insert(timeEntries)
        .values({
          tenantId: authContext.tenantId,
          userId: body.userId || authContext.userId,
          clientId: body.clientId,
          taskId: body.taskId,
          serviceId: body.serviceId,
          date: body.date,
          startTime: body.startTime,
          endTime: body.endTime,
          hours: body.hours,
          workType: body.workType || "work",
          billable: body.billable !== false, // Default to true
          billed: false,
          rate: body.rate,
          amount,
          description: body.description,
          notes: body.notes,
          status: body.status || "draft"
        })
        .returning();

      // Log the activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "time_entry",
        entityId: newEntry.id,
        action: "created",
        description: `Logged ${body.hours} hours for ${body.date}`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        newValues: {
          date: body.date,
          hours: body.hours,
          billable: body.billable
        }
      });

      return newEntry;
    });

    return NextResponse.json({ success: true, entry: result });
  } catch (error) {
    console.error("Time Entries API: Failed to create entry", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 },
    );
  }
}

// Bulk operations endpoint
export async function PATCH(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, entryIds } = body;

    if (!action || !entryIds || !Array.isArray(entryIds)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Handle different bulk actions
    switch (action) {
      case "submit":
        // Submit entries for approval
        await db.transaction(async (tx) => {
          await tx
            .update(timeEntries)
            .set({
              status: "submitted",
              submittedAt: new Date(),
              updatedAt: new Date()
            })
            .where(
              and(
                sql`id = ANY(${entryIds})`,
                eq(timeEntries.tenantId, authContext.tenantId),
                eq(timeEntries.status, "draft")
              )
            );

          await tx.insert(activityLogs).values({
            tenantId: authContext.tenantId,
            entityType: "time_entry",
            entityId: entryIds[0],
            action: "bulk_submitted",
            description: `Submitted ${entryIds.length} time entries for approval`,
            userId: authContext.userId,
            userName: `${authContext.firstName} ${authContext.lastName}`,
            metadata: { entryIds }
          });
        });
        break;

      case "approve":
        // Approve entries (requires admin/manager role)
        if (!["admin", "accountant"].includes(authContext.role)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.transaction(async (tx) => {
          await tx
            .update(timeEntries)
            .set({
              status: "approved",
              approvedById: authContext.userId,
              approvedAt: new Date(),
              updatedAt: new Date()
            })
            .where(
              and(
                sql`id = ANY(${entryIds})`,
                eq(timeEntries.tenantId, authContext.tenantId),
                eq(timeEntries.status, "submitted")
              )
            );

          await tx.insert(activityLogs).values({
            tenantId: authContext.tenantId,
            entityType: "time_entry",
            entityId: entryIds[0],
            action: "bulk_approved",
            description: `Approved ${entryIds.length} time entries`,
            userId: authContext.userId,
            userName: `${authContext.firstName} ${authContext.lastName}`,
            metadata: { entryIds }
          });
        });
        break;

      case "reject":
        // Reject entries (requires admin/manager role)
        if (!["admin", "accountant"].includes(authContext.role)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.transaction(async (tx) => {
          await tx
            .update(timeEntries)
            .set({
              status: "rejected",
              updatedAt: new Date()
            })
            .where(
              and(
                sql`id = ANY(${entryIds})`,
                eq(timeEntries.tenantId, authContext.tenantId),
                eq(timeEntries.status, "submitted")
              )
            );

          await tx.insert(activityLogs).values({
            tenantId: authContext.tenantId,
            entityType: "time_entry",
            entityId: entryIds[0],
            action: "bulk_rejected",
            description: `Rejected ${entryIds.length} time entries`,
            userId: authContext.userId,
            userName: `${authContext.firstName} ${authContext.lastName}`,
            metadata: { entryIds, reason: body.reason }
          });
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Time Entries API: Failed to perform bulk action", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 },
    );
  }
}