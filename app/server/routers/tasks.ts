import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { tasks, activityLogs } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const taskSchema = z.object({
  taskCode: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  assignedToId: z.string().optional(),
  reviewerId: z.string().optional(),
  status: z.enum(["pending", "in_progress", "review", "completed", "cancelled", "blocked", "records_received", "queries_sent", "queries_received"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  progress: z.number().min(0).max(100).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  targetDate: z.string().optional(),
  startDate: z.string().optional(),
  completedDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeId: z.string().optional(),
      clientId: z.string().optional(),
      overdue: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, status, priority, assigneeId, clientId, overdue } = input;

      // Build query using the task details view
      let query = sql`
        SELECT * FROM task_details_view
        WHERE tenant_id = ${tenantId}
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
      if (overdue) {
        conditions.push(sql`target_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')`);
      }

      // Combine conditions
      if (conditions.length > 0) {
        query = sql`
          SELECT * FROM task_details_view
          WHERE tenant_id = ${tenantId}
            AND ${sql.join(conditions, sql` AND `)}
        `;
      }

      // Add ordering
      query = sql`${query} ORDER BY
        CASE
          WHEN status = 'in_progress' THEN 1
          WHEN status = 'review' THEN 2
          WHEN status = 'queries_sent' THEN 3
          WHEN status = 'queries_received' THEN 4
          WHEN status = 'records_received' THEN 5
          WHEN status = 'pending' THEN 6
          WHEN status = 'blocked' THEN 7
          WHEN status = 'completed' THEN 8
          WHEN status = 'cancelled' THEN 9
          ELSE 10
        END,
        priority DESC,
        created_at DESC`;

      const result = await db.execute(query);

      // Format the response
      const tasksList = result.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        targetDate: task.target_date,
        assignee: task.assignee_name ? {
          name: task.assignee_name,
        } : undefined,
        reviewer: task.reviewer_name ? {
          name: task.reviewer_name,
        } : undefined,
        client: task.client_name,
        clientId: task.client_id,
        clientCode: task.client_code,
        assignedToId: task.assigned_to_id,
        reviewerId: task.reviewer_id,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        progress: task.progress,
        tags: task.tags,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));

      return { tasks: tasksList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const task = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found"
        });
      }

      return task[0];
    }),

  create: protectedProcedure
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Generate task code if not provided
      const taskCode = input.taskCode || `TASK-${Date.now()}`;

      // Create the task
      const [newTask] = await db
        .insert(tasks)
        .values({
          tenantId,
          taskCode,
          title: input.title,
          description: input.description,
          clientId: input.clientId,
          serviceId: input.serviceId,
          assignedToId: input.assignedToId || userId,
          reviewerId: input.reviewerId,
          status: input.status,
          priority: input.priority,
          progress: input.progress || 0,
          estimatedHours: input.estimatedHours,
          actualHours: input.actualHours,
          targetDate: input.targetDate,
          startDate: input.startDate,
          completedDate: input.completedDate,
          tags: input.tags,
          notes: input.notes,
          createdBy: userId,
        })
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: newTask.id,
        action: "created",
        description: `Created new task "${input.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: { title: input.title, status: input.status, priority: input.priority }
      });

      return { success: true, task: newTask };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: taskSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check task exists and belongs to tenant
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!existingTask[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found"
        });
      }

      // Update task
      const updateData: any = {
        ...input.data,
        updatedAt: new Date(),
      };

      // Update completed date if status changed to completed
      if (input.data.status === "completed" && existingTask[0].status !== "completed") {
        updateData.completedDate = new Date().toISOString();
        updateData.progress = 100;
      }

      const [updatedTask] = await db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: input.id,
        action: "updated",
        description: `Updated task "${updatedTask.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingTask[0],
        newValues: input.data,
      });

      return { success: true, task: updatedTask };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check task exists and belongs to tenant
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!existingTask[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found"
        });
      }

      // Delete the task
      await db.delete(tasks).where(eq(tasks.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: id,
        action: "deleted",
        description: `Deleted task "${existingTask[0].title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["pending", "in_progress", "review", "completed", "cancelled", "blocked", "records_received", "queries_sent", "queries_received"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return tasksRouter.createCaller(ctx).update({
        id: input.id,
        data: { status: input.status }
      });
    }),
});