import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, or, ilike, desc, sql, inArray, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const clientId = searchParams.get("clientId");
    const overdue = searchParams.get("overdue");

    // Build query using the task details view
    let query = sql`
      SELECT * FROM task_details_view
      WHERE tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (search) {
      conditions.push(sql`(
        title ILIKE ${`%${search}%`} OR
        description ILIKE ${`%${search}%`}
      )`);
    }
    if (status && status !== "all") {
      conditions.push(sql`status = ${status}`);
    }
    if (priority && priority !== "all") {
      conditions.push(sql`priority = ${priority}`);
    }
    if (assigneeId) {
      conditions.push(sql`assigned_to_id = ${assigneeId}`);
    }
    if (clientId) {
      conditions.push(sql`client_id = ${clientId}`);
    }
    if (overdue === "true") {
      conditions.push(sql`due_date < CURRENT_TIMESTAMP AND status NOT IN ('completed', 'cancelled')`);
    }

    // Combine conditions
    if (conditions.length > 0) {
      query = sql`
        SELECT * FROM task_details_view
        WHERE tenant_id = ${authContext.tenantId}
          AND ${sql.join(conditions, sql` AND `)}
      `;
    }

    // Add ordering
    query = sql`${query} ORDER BY
      CASE
        WHEN status = 'in_progress' THEN 1
        WHEN status = 'pending' THEN 2
        WHEN status = 'completed' THEN 3
        ELSE 4
      END,
      priority DESC,
      due_date ASC NULLS LAST`;

    const result = await db.execute(query);

    // Format the response
    const tasksList = result.rows.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      clientId: task.client_id,
      clientName: task.client_name,
      clientCode: task.client_code,
      assignedToId: task.assigned_to_id,
      assigneeName: task.assignee_name,
      assigneeEmail: task.assignee_email,
      reviewerId: task.reviewer_id,
      reviewerName: task.reviewer_name,
      createdById: task.created_by_id,
      creatorName: task.creator_name,
      dueDate: task.due_date,
      targetDate: task.target_date,
      completedAt: task.completed_at,
      estimatedHours: Number(task.estimated_hours || 0),
      actualHours: Number(task.actual_hours || 0),
      progress: task.progress || 0,
      taskType: task.task_type,
      category: task.category,
      tags: task.tags,
      parentTaskId: task.parent_task_id,
      parentTaskTitle: task.parent_task_title,
      workflowId: task.workflow_id,
      workflowName: task.workflow_name,
      isRecurring: task.is_recurring,
      recurringPattern: task.recurring_pattern,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    return NextResponse.json({ tasks: tasksList });
  } catch (error) {
    console.error("Tasks API: Failed to fetch tasks", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
    if (!body.title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 },
      );
    }

    // Create task in transaction
    const result = await db.transaction(async (tx) => {
      // Create the task
      const [newTask] = await tx
        .insert(tasks)
        .values({
          tenantId: authContext.tenantId,
          title: body.title,
          description: body.description,
          status: body.status || "pending",
          priority: body.priority || "medium",
          clientId: body.clientId,
          assignedToId: body.assignedToId,
          reviewerId: body.reviewerId,
          createdById: authContext.userId,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
          estimatedHours: body.estimatedHours,
          progress: body.progress || 0,
          taskType: body.taskType,
          category: body.category,
          tags: body.tags,
          parentTaskId: body.parentTaskId,
          workflowId: body.workflowId,
          isRecurring: body.isRecurring || false,
          recurringPattern: body.recurringPattern
        })
        .returning();

      // Log the activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "task",
        entityId: newTask.id,
        action: "created",
        description: `Created task "${body.title}"`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        newValues: {
          title: body.title,
          status: body.status || "pending",
          priority: body.priority || "medium"
        }
      });

      return newTask;
    });

    return NextResponse.json({ success: true, task: result });
  } catch (error) {
    console.error("Tasks API: Failed to create task", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

// Bulk update endpoint for multiple tasks
export async function PATCH(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    if (!body.taskIds || !Array.isArray(body.taskIds) || body.taskIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid taskIds array" },
        { status: 400 },
      );
    }

    if (!body.updates) {
      return NextResponse.json(
        { error: "Missing updates object" },
        { status: 400 },
      );
    }

    // Perform bulk update in transaction
    const result = await db.transaction(async (tx) => {
      // Verify all tasks belong to tenant
      const existingTasks = await tx
        .select()
        .from(tasks)
        .where(
          and(
            inArray(tasks.id, body.taskIds),
            eq(tasks.tenantId, authContext.tenantId)
          )
        );

      if (existingTasks.length !== body.taskIds.length) {
        throw new Error("Some tasks not found or unauthorized");
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date()
      };

      // Only include fields that are being updated
      if (body.updates.status !== undefined) updateData.status = body.updates.status;
      if (body.updates.priority !== undefined) updateData.priority = body.updates.priority;
      if (body.updates.assignedToId !== undefined) updateData.assignedToId = body.updates.assignedToId;
      if (body.updates.reviewerId !== undefined) updateData.reviewerId = body.updates.reviewerId;
      if (body.updates.dueDate !== undefined) updateData.dueDate = body.updates.dueDate ? new Date(body.updates.dueDate) : null;

      // Update tasks
      const updatedTasks = await tx
        .update(tasks)
        .set(updateData)
        .where(
          and(
            inArray(tasks.id, body.taskIds),
            eq(tasks.tenantId, authContext.tenantId)
          )
        )
        .returning();

      // Log bulk activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "task",
        entityId: body.taskIds[0], // Use first task ID for reference
        action: "bulk_updated",
        description: `Updated ${body.taskIds.length} tasks`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        newValues: body.updates,
        metadata: { taskIds: body.taskIds }
      });

      return updatedTasks;
    });

    return NextResponse.json({ success: true, tasks: result });
  } catch (error) {
    console.error("Tasks API: Failed to bulk update tasks", error);
    return NextResponse.json(
      { error: "Failed to update tasks" },
      { status: 500 },
    );
  }
}