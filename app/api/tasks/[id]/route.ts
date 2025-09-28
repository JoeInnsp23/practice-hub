import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Fetch task with full details using the view
    const result = await db.execute(
      sql`
        SELECT * FROM task_details_view
        WHERE id = ${taskId}
          AND tenant_id = ${authContext.tenantId}
      `
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = result.rows[0];

    // Format the response
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      clientId: task.client_id,
      clientName: task.client_name,
      assignedToId: task.assigned_to_id,
      assigneeName: task.assignee_name,
      reviewerId: task.reviewer_id,
      reviewerName: task.reviewer_name,
      dueDate: task.due_date,
      targetDate: task.target_date,
      completedAt: task.completed_at,
      estimatedHours: Number(task.estimated_hours || 0),
      actualHours: Number(task.actual_hours || 0),
      progress: task.progress || 0,
      category: task.category,
      tags: task.tags,
      workflowId: task.workflow_id,
      workflowName: task.workflow_name,
      parentTaskId: task.parent_task_id,
      parentTaskTitle: task.parent_task_title,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error("Task API: Failed to fetch task", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await req.json();

    // Verify task exists and belongs to tenant
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.tenantId, authContext.tenantId)
        )
      );

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update task in transaction
    const result = await db.transaction(async (tx) => {
      // Build update object
      const updateData: any = {
        updatedAt: new Date()
      };

      // Only update provided fields
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.clientId !== undefined) updateData.clientId = body.clientId;
      if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
      if (body.reviewerId !== undefined) updateData.reviewerId = body.reviewerId;
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
      if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
      if (body.actualHours !== undefined) updateData.actualHours = body.actualHours;
      if (body.progress !== undefined) updateData.progress = body.progress;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.tags !== undefined) updateData.tags = body.tags;

      // Handle status change to completed
      if (body.status === "completed" && existingTask.status !== "completed") {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }

      // Update the task
      const [updatedTask] = await tx
        .update(tasks)
        .set(updateData)
        .where(
          and(
            eq(tasks.id, taskId),
            eq(tasks.tenantId, authContext.tenantId)
          )
        )
        .returning();

      // Track changes for activity log
      const changes: any = {};
      const oldValues: any = {};

      Object.keys(body).forEach(key => {
        if (body[key] !== existingTask[key as keyof typeof existingTask]) {
          changes[key] = body[key];
          oldValues[key] = existingTask[key as keyof typeof existingTask];
        }
      });

      // Log the activity
      let action = "updated";
      let description = `Updated task "${updatedTask.title}"`;

      // Special handling for status changes
      if (changes.status) {
        if (changes.status === "completed") {
          action = "completed";
          description = `Completed task "${updatedTask.title}"`;
        } else if (oldValues.status === "pending" && changes.status === "in_progress") {
          action = "started";
          description = `Started working on task "${updatedTask.title}"`;
        }
      }

      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "task",
        entityId: taskId,
        action,
        description,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
        newValues: Object.keys(changes).length > 0 ? changes : null
      });

      return updatedTask;
    });

    return NextResponse.json({ success: true, task: result });
  } catch (error) {
    console.error("Task API: Failed to update task", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Verify task exists
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.tenantId, authContext.tenantId)
        )
      );

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Soft delete by setting status to cancelled
    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({
          status: "cancelled",
          updatedAt: new Date()
        })
        .where(
          and(
            eq(tasks.id, taskId),
            eq(tasks.tenantId, authContext.tenantId)
          )
        );

      // Log the activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "task",
        entityId: taskId,
        action: "cancelled",
        description: `Cancelled task "${existingTask.title}"`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task API: Failed to delete task", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}