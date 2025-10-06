import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { getTasksList } from "@/lib/db/queries/task-queries";
import {
  activityLogs,
  tasks,
  taskWorkflowInstances,
  workflowStages,
  workflows,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Type definitions for JSON fields
interface ChecklistItem {
  id: string;
  text: string;
  completed?: boolean;
  completedBy?: string | null;
  completedAt?: string | null;
}

interface StageProgressItem {
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

interface StageProgress {
  [stageId: string]: {
    checklistItems: {
      [itemId: string]: StageProgressItem;
    };
  };
}

// Generate schema from Drizzle table definition
const insertTaskSchema = createInsertSchema(tasks, {
  targetDate: z.string().optional(),
  dueDate: z.string().optional(),
});

// Schema for create/update operations (omit auto-generated fields)
const taskSchema = insertTaskSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export const tasksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        clientId: z.string().optional(),
        overdue: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Use typed query function
      const tasks = await getTasksList(tenantId, input);

      return { tasks };
    }),

  // Note: Keeping original ordering logic for reference
  // If custom ordering is needed, it can be added to getTasksList function
  listOld: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        clientId: z.string().optional(),
        overdue: z.boolean().optional(),
      }),
    )
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
        conditions.push(
          sql`target_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')`,
        );
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
      const tasksList = (result as Array<Record<string, unknown>>).map(
        (task) => ({
          id: task.id as string,
          title: task.title as string,
          description: task.description as string | null,
          status: task.status as string | null,
          priority: task.priority as string | null,
          dueDate: task.due_date as string | Date | null,
          targetDate: task.target_date as string | Date | null,
          assignee: task.assignee_name
            ? {
                name: task.assignee_name as string,
              }
            : undefined,
          reviewer: task.reviewer_name
            ? {
                name: task.reviewer_name as string,
              }
            : undefined,
          client: task.client_name as string | null,
          clientId: task.client_id as string | null,
          clientCode: task.client_code as string | null,
          assignedToId: task.assigned_to_id as string | null,
          reviewerId: task.reviewer_id as string | null,
          estimatedHours: task.estimated_hours as number | string | null,
          actualHours: task.actual_hours as number | string | null,
          progress: (task.progress as number | null) ?? 0,
          tags: task.tags as string[] | null,
          completedAt: task.completed_at as string | Date | null,
          createdAt: task.created_at as string | Date,
          updatedAt: task.updated_at as string | Date,
        }),
      );

      return { tasks: tasksList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Use the task details view to get task with client and service data
      const query = sql`
        SELECT * FROM task_details_view
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      const result = await db.execute(query);

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      const task = result[0] as Record<string, unknown>;

      // Get workflow instance if exists
      let workflowInstance = null;
      if (task.workflow_id) {
        const workflowId = task.workflow_id as string;
        const instance = await db
          .select()
          .from(taskWorkflowInstances)
          .where(eq(taskWorkflowInstances.taskId, id))
          .limit(1);

        if (instance[0]) {
          const workflow = await db
            .select()
            .from(workflows)
            .where(eq(workflows.id, workflowId))
            .limit(1);

          const stages = await db
            .select()
            .from(workflowStages)
            .where(eq(workflowStages.workflowId, workflowId))
            .orderBy(workflowStages.stageOrder);

          workflowInstance = {
            id: instance[0].id,
            name: workflow[0]?.name || "Unknown Workflow",
            template: {
              stages: stages.map((stage) => ({
                id: stage.id,
                name: stage.name,
                description: stage.description,
                is_required: stage.isRequired,
                checklist_items: (
                  (stage.checklistItems as ChecklistItem[]) || []
                ).map((item: ChecklistItem) => {
                  const progress = (
                    instance[0].stageProgress as StageProgress
                  )?.[stage.id]?.checklistItems?.[item.id];
                  return {
                    id: item.id,
                    text: item.text,
                    completed: progress?.completed || false,
                    completedBy: progress?.completedBy,
                    completedAt: progress?.completedAt,
                  };
                }),
              })),
            },
          };
        }
      }

      // Format the response to match the component's expectations
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        targetDate: task.target_date,
        startDate: task.start_date,
        completedDate: task.completed_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        progress: task.progress || 0,
        tags: task.tags || [],
        notes: task.notes,
        task_type: task.task_type,
        assignee: task.assignee_name
          ? {
              id: task.assigned_to_id,
              name: task.assignee_name,
            }
          : null,
        reviewer: task.reviewer_name
          ? {
              id: task.reviewer_id,
              name: task.reviewer_name,
            }
          : null,
        client: {
          id: task.client_id,
          name: task.client_name || "No Client",
          code: task.client_code || "",
        },
        service: task.service_name
          ? {
              id: task.service_id,
              name: task.service_name,
            }
          : null,
        workflowInstance,
        timeEntries: [], // Will be implemented later if needed
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      };
    }),

  create: protectedProcedure
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Create the task
      const [newTask] = await db
        .insert(tasks)
        .values({
          tenantId,
          title: input.title,
          description: input.description,
          status: input.status || "pending",
          priority: input.priority || "medium",
          clientId: input.clientId,
          assignedToId: input.assignedToId || userId,
          reviewerId: input.reviewerId,
          createdById: userId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
          estimatedHours: input.estimatedHours,
          actualHours: input.actualHours,
          progress: input.progress || 0,
          taskType: input.taskType,
          category: input.category,
          tags: input.tags,
          parentTaskId: input.parentTaskId,
          workflowId: input.workflowId,
          isRecurring: input.isRecurring || false,
          recurringPattern: input.recurringPattern,
          metadata: input.metadata,
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
        newValues: {
          title: input.title,
          status: input.status,
          priority: input.priority,
        },
      });

      return { success: true, task: newTask };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: taskSchema.partial(),
      }),
    )
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
          message: "Task not found",
        });
      }

      // Update task
      const updateData: Record<string, unknown> = {
        ...input.data,
        updatedAt: new Date(),
      };

      // Update completed date if status changed to completed
      if (
        input.data.status === "completed" &&
        existingTask[0].status !== "completed"
      ) {
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
          message: "Task not found",
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
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "pending",
          "in_progress",
          "review",
          "completed",
          "cancelled",
          "blocked",
          "records_received",
          "queries_sent",
          "queries_received",
        ]),
      }),
    )
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
          message: "Task not found",
        });
      }

      // Update task status
      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: input.status,
          completedAt:
            input.status === "completed"
              ? new Date()
              : existingTask[0].completedAt,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: input.id,
        action: "updated",
        description: `Updated task status to ${input.status}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingTask[0],
        newValues: { status: input.status },
      });

      return { success: true, task: updatedTask };
    }),

  // Workflow instance management
  assignWorkflow: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        workflowId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Check task exists
      const task = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Check workflow exists
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!workflow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Update task with workflow ID
      await db
        .update(tasks)
        .set({ workflowId: input.workflowId })
        .where(eq(tasks.id, input.taskId));

      // Get workflow stages
      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, input.workflowId))
        .orderBy(workflowStages.stageOrder);

      // Create workflow instance
      const [instance] = await db
        .insert(taskWorkflowInstances)
        .values({
          taskId: input.taskId,
          workflowId: input.workflowId,
          currentStageId: stages[0]?.id || null,
          status: "active",
          stageProgress: {},
        })
        .returning();

      return { success: true, instance };
    }),

  getWorkflowInstance: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: taskId }) => {
      const { tenantId } = ctx.authContext;

      // Get task to verify it belongs to tenant
      const task = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      if (!task[0].workflowId) {
        return null;
      }

      // Get workflow instance
      const instance = await db
        .select()
        .from(taskWorkflowInstances)
        .where(eq(taskWorkflowInstances.taskId, taskId))
        .limit(1);

      if (!instance[0]) {
        return null;
      }

      // Get workflow with stages
      const workflow = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, task[0].workflowId))
        .limit(1);

      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, task[0].workflowId))
        .orderBy(workflowStages.stageOrder);

      return {
        instance: instance[0],
        workflow: workflow[0],
        stages,
      };
    }),

  updateChecklistItem: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        stageId: z.string(),
        itemId: z.string(),
        completed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get workflow instance
      const instance = await db
        .select()
        .from(taskWorkflowInstances)
        .where(eq(taskWorkflowInstances.taskId, input.taskId))
        .limit(1);

      if (!instance[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow instance not found",
        });
      }

      // Update stage progress
      const stageProgress = (instance[0].stageProgress as StageProgress) || {};
      if (!stageProgress[input.stageId]) {
        stageProgress[input.stageId] = {
          checklistItems: {},
        };
      }
      stageProgress[input.stageId].checklistItems[input.itemId] = {
        completed: input.completed,
        completedBy: input.completed ? `${firstName} ${lastName}` : null,
        completedAt: input.completed ? new Date().toISOString() : null,
      };

      // Update instance
      await db
        .update(taskWorkflowInstances)
        .set({
          stageProgress,
          updatedAt: new Date(),
        })
        .where(eq(taskWorkflowInstances.taskId, input.taskId));

      // Calculate and update task progress
      const _workflow = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, instance[0].workflowId))
        .limit(1);

      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, instance[0].workflowId));

      let totalItems = 0;
      let completedItems = 0;

      for (const stage of stages) {
        const checklistItems = (stage.checklistItems as ChecklistItem[]) || [];
        totalItems += checklistItems.length;

        const stageProgressData = stageProgress[stage.id];
        if (stageProgressData) {
          for (const item of checklistItems) {
            if (stageProgressData.checklistItems[item.id]?.completed) {
              completedItems++;
            }
          }
        }
      }

      const progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Update task progress
      await db
        .update(tasks)
        .set({ progress })
        .where(eq(tasks.id, input.taskId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: input.taskId,
        action: "checklist_updated",
        description: `Updated checklist item in workflow`,
        userId,
        userName: `${firstName} ${lastName}`,
        metadata: {
          stageId: input.stageId,
          itemId: input.itemId,
          completed: input.completed,
        },
      });

      return { success: true, progress };
    }),
});
