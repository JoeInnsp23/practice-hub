import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, ilike, isNull, or, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { getTasksList } from "@/lib/db/queries/task-queries";
import {
  activityLogs,
  clients,
  clientServices,
  notifications,
  services,
  taskAssignmentHistory,
  taskNotes,
  tasks,
  taskTemplates,
  taskWorkflowInstances,
  users,
  workflowStages,
  workflows,
  workflowVersions,
} from "@/lib/db/schema";
import {
  calculateDueDate,
  calculateNextPeriod,
  calculatePeriodEndDate,
  replacePlaceholders,
  type PlaceholderData,
} from "@/lib/services/template-placeholders";
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

// Helper function for task generation from template (STORY-3.2)
async function generateTaskFromTemplateInternal(params: {
  templateId: string;
  clientId: string;
  serviceId?: string;
  activationDate?: Date;
  tenantId: string;
  userId: string;
}): Promise<{ success: boolean; taskId?: string; skipped?: boolean; reason?: string }> {
  // Fetch template
  const template = await db
    .select()
    .from(taskTemplates)
    .where(
      and(
        eq(taskTemplates.id, params.templateId),
        eq(taskTemplates.tenantId, params.tenantId),
        eq(taskTemplates.isActive, true),
      ),
    )
    .limit(1);

  if (template.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Template not found",
    });
  }

  // Fetch client and service for placeholder data
  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, params.clientId), eq(clients.tenantId, params.tenantId)))
    .limit(1);

  if (client.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Client not found",
    });
  }

  // Use serviceId from params or from template
  const serviceId = params.serviceId || template[0].serviceId;

  const service = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, params.tenantId)))
    .limit(1);

  if (service.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Service not found",
    });
  }

  // Build placeholder data
  const activationDate = params.activationDate || new Date();

  // Calculate tax year from activation date
  const taxYearStart =
    activationDate.getMonth() >= 3
      ? activationDate.getFullYear()
      : activationDate.getFullYear() - 1;
  const taxYear = `${taxYearStart}/${(taxYearStart + 1).toString().slice(2)}`;

  // Calculate period (quarter)
  const quarter = Math.ceil((activationDate.getMonth() + 1) / 3);
  const period = `Q${quarter} ${activationDate.getFullYear()}`;

  // Calculate period end date based on recurring frequency
  const periodEndDate = template[0].recurringFrequency
    ? calculatePeriodEndDate(
        activationDate,
        template[0].recurringFrequency,
        template[0].recurringDayOfMonth || undefined,
      )
    : undefined;

  const placeholderData: PlaceholderData = {
    clientName: client[0].companyName,
    serviceName: service[0].name,
    companyNumber: client[0].companiesHouseNumber || undefined,
    period,
    periodEndDate,
    taxYear,
    activationDate,
  };

  // Replace placeholders
  const taskName = replacePlaceholders(template[0].namePattern, placeholderData);
  const taskDescription = template[0].descriptionPattern
    ? replacePlaceholders(template[0].descriptionPattern, placeholderData)
    : undefined;

  // Calculate due date
  const dueDate = calculateDueDate(
    activationDate,
    template[0].dueDateOffsetDays,
    template[0].dueDateOffsetMonths,
  );

  // Calculate target date (7 days before due date)
  const targetDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check for duplicate (same client, service, task name)
  const existingTask = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, params.tenantId),
        eq(tasks.clientId, params.clientId),
        eq(tasks.serviceId, serviceId),
        eq(tasks.title, taskName),
      ),
    )
    .limit(1);

  if (existingTask.length > 0) {
    return {
      success: false,
      skipped: true,
      reason: "Duplicate task exists",
      taskId: existingTask[0].id,
    };
  }

  // Determine assignee (client manager or null)
  const assignedTo = client[0].assignedToId || null;

  // Create task
  const taskId = crypto.randomUUID();
  await db.insert(tasks).values({
    id: taskId,
    tenantId: params.tenantId,
    clientId: params.clientId,
    serviceId,
    title: taskName,
    description: taskDescription,
    priority: template[0].priority,
    taskType: template[0].taskType || undefined,
    estimatedHours: template[0].estimatedHours
      ? template[0].estimatedHours.toString()
      : undefined,
    periodEndDate,
    dueDate,
    targetDate,
    assignedToId: assignedTo,
    createdById: params.userId,
    status: "pending",
    isRecurring: template[0].isRecurring,
    recurringFrequency: template[0].recurringFrequency || undefined,
    recurringDayOfMonth: template[0].recurringDayOfMonth || undefined,
    autoGenerated: true,
    templateId: params.templateId,
    generatedAt: new Date(),
  });

  // Send notification to assignee if assigned
  if (assignedTo) {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      userId: assignedTo,
      type: "task_assigned",
      title: "New task generated",
      message: `Task "${taskName}" has been automatically assigned to you`,
      link: `/client-hub/tasks/${taskId}`,
      read: false,
    });
  }

  return { success: true, taskId };
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
      const tasksList = (result.rows as Array<Record<string, unknown>>).map(
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

      if (!result.rows || result.rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      const task = result.rows[0] as Record<string, unknown>;

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

      // AUTO-GENERATE NEXT RECURRING TASK (STORY-3.2)
      // If task was just completed AND it's a recurring auto-generated task, generate next period
      if (
        input.data.status === "completed" &&
        existingTask[0].status !== "completed" &&
        updatedTask.isRecurring &&
        updatedTask.autoGenerated &&
        updatedTask.templateId &&
        updatedTask.periodEndDate &&
        updatedTask.recurringFrequency
      ) {
        try {
          // Calculate next period's activation date (day after current period ends)
          const nextActivationDate = calculateNextPeriod(
            updatedTask.periodEndDate,
            updatedTask.recurringFrequency,
          );

          // Generate next period's task
          await generateTaskFromTemplateInternal({
            templateId: updatedTask.templateId,
            clientId: updatedTask.clientId!,
            serviceId: updatedTask.serviceId || undefined,
            activationDate: nextActivationDate,
            tenantId,
            userId,
          });

          // Log auto-generation activity
          await db.insert(activityLogs).values({
            tenantId,
            entityType: "task",
            entityId: input.id,
            action: "auto_generated_next_period",
            description: `Auto-generated next ${updatedTask.recurringFrequency} task for "${updatedTask.title}"`,
            userId,
            userName: `${firstName} ${lastName}`,
          });
        } catch (error) {
          // Log error but don't fail the update
          console.error("Failed to auto-generate next recurring task:", error);
        }
      }

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

      return await db.transaction(async (tx) => {
        // Check task exists
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, tenantId)))
          .limit(1);

        if (!task) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        }

        // Check workflow exists
        const [workflow] = await tx
          .select()
          .from(workflows)
          .where(
            and(
              eq(workflows.id, input.workflowId),
              eq(workflows.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }

        // Get ACTIVE version (snapshot)
        const [activeVersion] = await tx
          .select()
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.workflowId, input.workflowId),
              eq(workflowVersions.isActive, true),
            ),
          )
          .limit(1);

        if (!activeVersion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active version found" });
        }

        // Update task
        await tx
          .update(tasks)
          .set({ workflowId: input.workflowId })
          .where(eq(tasks.id, input.taskId));

        // Create instance with version snapshot
        const stagesSnapshot = activeVersion.stagesSnapshot as any;
        const firstStageId = stagesSnapshot?.stages?.[0]?.id || null;

        const [instance] = await tx
          .insert(taskWorkflowInstances)
          .values({
            taskId: input.taskId,
            workflowId: input.workflowId,
            workflowVersionId: activeVersion.id,
            version: activeVersion.version,
            stagesSnapshot: activeVersion.stagesSnapshot,
            currentStageId: firstStageId,
            status: "active",
            stageProgress: {},
          })
          .returning();

        return { success: true, instance };
      });
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

  // BULK OPERATIONS

  // Bulk update status for multiple tasks
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1, "At least one task ID required"),
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

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all tasks exist and belong to tenant
        const existingTasks = await tx
          .select()
          .from(tasks)
          .where(
            and(
              inArray(tasks.id, input.taskIds),
              eq(tasks.tenantId, tenantId),
            ),
          );

        if (existingTasks.length !== input.taskIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more tasks not found",
          });
        }

        // Update all tasks
        const updatedTasks = await tx
          .update(tasks)
          .set({
            status: input.status,
            completedAt:
              input.status === "completed" ? new Date() : undefined,
            progress: input.status === "completed" ? 100 : undefined,
            updatedAt: new Date(),
          })
          .where(inArray(tasks.id, input.taskIds))
          .returning();

        // Log activity for each task
        for (const task of updatedTasks) {
          await tx.insert(activityLogs).values({
            tenantId,
            entityType: "task",
            entityId: task.id,
            action: "bulk_status_update",
            description: `Bulk updated task status to ${input.status}`,
            userId,
            userName: `${firstName} ${lastName}`,
            newValues: { status: input.status },
          });
        }

        return { count: updatedTasks.length, tasks: updatedTasks };
      });

      return { success: true, ...result };
    }),

  // Bulk assign tasks to a user
  bulkAssign: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1, "At least one task ID required"),
        assigneeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all tasks exist and belong to tenant
        const existingTasks = await tx
          .select()
          .from(tasks)
          .where(
            and(
              inArray(tasks.id, input.taskIds),
              eq(tasks.tenantId, tenantId),
            ),
          );

        if (existingTasks.length !== input.taskIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more tasks not found",
          });
        }

        // Update all tasks
        const updatedTasks = await tx
          .update(tasks)
          .set({
            assignedToId: input.assigneeId,
            updatedAt: new Date(),
          })
          .where(inArray(tasks.id, input.taskIds))
          .returning();

        // Log activity for each task
        for (const task of updatedTasks) {
          await tx.insert(activityLogs).values({
            tenantId,
            entityType: "task",
            entityId: task.id,
            action: "bulk_assign",
            description: `Bulk assigned task to user`,
            userId,
            userName: `${firstName} ${lastName}`,
            newValues: { assignedToId: input.assigneeId },
          });
        }

        return { count: updatedTasks.length, tasks: updatedTasks };
      });

      return { success: true, ...result };
    }),

  // Bulk delete/archive multiple tasks
  bulkDelete: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).min(1, "At least one task ID required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all tasks exist and belong to tenant
        const existingTasks = await tx
          .select()
          .from(tasks)
          .where(
            and(
              inArray(tasks.id, input.taskIds),
              eq(tasks.tenantId, tenantId),
            ),
          );

        if (existingTasks.length !== input.taskIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more tasks not found",
          });
        }

        // Log activity for each task before deletion
        for (const task of existingTasks) {
          await tx.insert(activityLogs).values({
            tenantId,
            entityType: "task",
            entityId: task.id,
            action: "bulk_delete",
            description: `Bulk deleted task "${task.title}"`,
            userId,
            userName: `${firstName} ${lastName}`,
          });
        }

        // Delete all tasks
        await tx.delete(tasks).where(inArray(tasks.id, input.taskIds));

        return { count: existingTasks.length };
      });

      return { success: true, ...result };
    }),

  // Task Notes Procedures

  createNote: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        note: z.string().min(1).max(10000),
        isInternal: z.boolean().default(false),
        mentionedUsers: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Verify task exists and belongs to tenant
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Create task note
      const [taskNote] = await db
        .insert(taskNotes)
        .values({
          tenantId,
          taskId: input.taskId,
          userId,
          note: input.note,
          isInternal: input.isInternal,
          mentionedUsers: input.mentionedUsers,
        })
        .returning();

      // Create notifications for mentioned users
      for (const mentionedUserId of input.mentionedUsers) {
        await db.insert(notifications).values({
          tenantId,
          userId: mentionedUserId,
          type: "task_mention",
          title: "You were mentioned in a task",
          message: `${firstName || ""} ${lastName || ""} mentioned you in task comments`,
          actionUrl: `/client-hub/tasks/${input.taskId}`,
          entityType: "task",
          entityId: task.id,
          isRead: false,
        });
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "task",
        entityId: task.id,
        action: "note_added",
        description: `Added a ${input.isInternal ? "internal " : ""}comment to task "${task.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true, noteId: taskNote.id };
    }),

  getNotes: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify task exists and belongs to tenant
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Get notes with author information
      const notes = await db
        .select({
          id: taskNotes.id,
          note: taskNotes.note,
          isInternal: taskNotes.isInternal,
          mentionedUsers: taskNotes.mentionedUsers,
          createdAt: taskNotes.createdAt,
          updatedAt: taskNotes.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(taskNotes)
        .innerJoin(users, eq(taskNotes.userId, users.id))
        .where(
          and(
            eq(taskNotes.tenantId, tenantId),
            eq(taskNotes.taskId, input.taskId),
            isNull(taskNotes.deletedAt), // Exclude soft-deleted notes
          ),
        )
        .orderBy(desc(taskNotes.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return notes;
    }),

  updateNote: protectedProcedure
    .input(
      z.object({
        noteId: z.string().uuid(),
        note: z.string().min(1).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, role } = ctx.authContext;

      // Verify note exists and belongs to tenant
      const [existingNote] = await db
        .select()
        .from(taskNotes)
        .where(
          and(eq(taskNotes.id, input.noteId), eq(taskNotes.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      // Check authorization (owner or admin)
      const isOwner = existingNote.userId === userId;
      const isAdmin = role === "admin" || role === "org:admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this note",
        });
      }

      // Update note
      await db
        .update(taskNotes)
        .set({
          note: input.note,
          updatedAt: new Date(),
        })
        .where(eq(taskNotes.id, input.noteId));

      return { success: true };
    }),

  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, role } = ctx.authContext;

      // Verify note exists and belongs to tenant
      const [existingNote] = await db
        .select()
        .from(taskNotes)
        .where(
          and(eq(taskNotes.id, input.noteId), eq(taskNotes.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      // Check authorization (owner or admin)
      const isOwner = existingNote.userId === userId;
      const isAdmin = role === "admin" || role === "org:admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this note",
        });
      }

      // Soft delete
      await db
        .update(taskNotes)
        .set({ deletedAt: new Date() })
        .where(eq(taskNotes.id, input.noteId));

      return { success: true };
    }),

  getNoteCount: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const [result] = await db
        .select({ count: count() })
        .from(taskNotes)
        .where(
          and(
            eq(taskNotes.tenantId, tenantId),
            eq(taskNotes.taskId, input.taskId),
            isNull(taskNotes.deletedAt),
          ),
        );

      return result?.count || 0;
    }),

  getMentionableUsers: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const mentionableUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(
              ilike(users.firstName, `%${input.query}%`),
              ilike(users.lastName, `%${input.query}%`),
              ilike(users.email, `%${input.query}%`),
            ),
          ),
        )
        .limit(10);

      return mentionableUsers;
    }),

  // Reassign task to new user
  reassign: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        toUserId: z.string(),
        assignmentType: z.enum(["preparer", "reviewer", "assigned_to"]),
        changeReason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get current task
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.taskId), eq(tasks.tenantId, tenantId)))
        .limit(1);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Get current assignee ID based on assignment type
      const currentAssigneeId =
        input.assignmentType === "preparer"
          ? task.preparerId
          : input.assignmentType === "reviewer"
            ? task.reviewerId
            : task.assignedToId;

      // Prevent self-reassignment
      if (currentAssigneeId === input.toUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reassign to current assignee",
        });
      }

      // Update task assignment
      const updateField =
        input.assignmentType === "preparer"
          ? { preparerId: input.toUserId }
          : input.assignmentType === "reviewer"
            ? { reviewerId: input.toUserId }
            : { assignedToId: input.toUserId };

      await db.transaction(async (tx) => {
        // Update task
        await tx
          .update(tasks)
          .set({ ...updateField, updatedAt: new Date() })
          .where(eq(tasks.id, input.taskId));

        // Create assignment history record
        await tx.insert(taskAssignmentHistory).values({
          tenantId,
          taskId: input.taskId,
          fromUserId: currentAssigneeId,
          toUserId: input.toUserId,
          changedBy: userId,
          changeReason: input.changeReason,
          assignmentType: input.assignmentType,
        });

        // Send notification to old assignee
        if (currentAssigneeId) {
          await tx.insert(notifications).values({
            tenantId,
            userId: currentAssigneeId,
            type: "task_reassigned",
            title: "Task reassigned",
            message: `Task "${task.title}" has been reassigned`,
            actionUrl: `/client-hub/tasks/${input.taskId}`,
            entityType: "task",
            entityId: input.taskId,
          });
        }

        // Send notification to new assignee
        await tx.insert(notifications).values({
          tenantId,
          userId: input.toUserId,
          type: "task_assigned",
          title: "Task assigned to you",
          message: `Task "${task.title}" has been assigned to you by ${firstName} ${lastName}`,
          actionUrl: `/client-hub/tasks/${input.taskId}`,
          entityType: "task",
          entityId: input.taskId,
        });
      });

      return { success: true };
    }),

  // Bulk reassign tasks
  bulkReassign: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string().uuid()),
        toUserId: z.string(),
        assignmentType: z.enum(["preparer", "reviewer", "assigned_to"]),
        changeReason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      await db.transaction(async (tx) => {
        for (const taskId of input.taskIds) {
          // Get current task
          const [task] = await tx
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
            .limit(1);

          if (!task) continue; // Skip if task not found

          // Get current assignee
          const currentAssigneeId =
            input.assignmentType === "preparer"
              ? task.preparerId
              : input.assignmentType === "reviewer"
                ? task.reviewerId
                : task.assignedToId;

          // Skip if already assigned to target user
          if (currentAssigneeId === input.toUserId) continue;

          // Update task assignment
          const updateField =
            input.assignmentType === "preparer"
              ? { preparerId: input.toUserId }
              : input.assignmentType === "reviewer"
                ? { reviewerId: input.toUserId }
                : { assignedToId: input.toUserId };

          await tx
            .update(tasks)
            .set({ ...updateField, updatedAt: new Date() })
            .where(eq(tasks.id, taskId));

          // Create assignment history record
          await tx.insert(taskAssignmentHistory).values({
            tenantId,
            taskId,
            fromUserId: currentAssigneeId,
            toUserId: input.toUserId,
            changedBy: userId,
            changeReason: input.changeReason,
            assignmentType: input.assignmentType,
          });

          // Send notifications (old assignee)
          if (currentAssigneeId) {
            await tx.insert(notifications).values({
              tenantId,
              userId: currentAssigneeId,
              type: "task_reassigned",
              title: "Task reassigned",
              message: `Task "${task.title}" has been reassigned`,
              actionUrl: `/client-hub/tasks/${taskId}`,
              entityType: "task",
              entityId: taskId,
            });
          }

          // Send notification (new assignee)
          await tx.insert(notifications).values({
            tenantId,
            userId: input.toUserId,
            type: "task_assigned",
            title: "Task assigned to you",
            message: `Task "${task.title}" has been assigned to you by ${firstName} ${lastName}`,
            actionUrl: `/client-hub/tasks/${taskId}`,
            entityType: "task",
            entityId: taskId,
          });
        }
      });

      return { success: true, count: input.taskIds.length };
    }),

  // Get assignment history for task
  getAssignmentHistory: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const history = await db
        .select({
          id: taskAssignmentHistory.id,
          changedAt: taskAssignmentHistory.changedAt,
          assignmentType: taskAssignmentHistory.assignmentType,
          changeReason: taskAssignmentHistory.changeReason,
          fromUser: {
            id: sql<string | null>`from_user.id`,
            firstName: sql<string | null>`from_user.first_name`,
            lastName: sql<string | null>`from_user.last_name`,
          },
          toUser: {
            id: sql<string>`to_user.id`,
            firstName: sql<string>`to_user.first_name`,
            lastName: sql<string>`to_user.last_name`,
          },
          changedBy: {
            id: sql<string>`changed_by_user.id`,
            firstName: sql<string>`changed_by_user.first_name`,
            lastName: sql<string>`changed_by_user.last_name`,
          },
        })
        .from(taskAssignmentHistory)
        .leftJoin(
          sql`${users} as from_user`,
          eq(taskAssignmentHistory.fromUserId, sql`from_user.id`),
        )
        .innerJoin(
          sql`${users} as to_user`,
          eq(taskAssignmentHistory.toUserId, sql`to_user.id`),
        )
        .innerJoin(
          sql`${users} as changed_by_user`,
          eq(taskAssignmentHistory.changedBy, sql`changed_by_user.id`),
        )
        .where(
          and(
            eq(taskAssignmentHistory.tenantId, tenantId),
            eq(taskAssignmentHistory.taskId, input.taskId),
          ),
        )
        .orderBy(desc(taskAssignmentHistory.changedAt));

      return history;
    }),

  // ==========================================
  // AUTO TASK GENERATION (STORY-3.2)
  // ==========================================

  // Generate tasks from template
  generateFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        clientId: z.string().uuid(),
        serviceId: z.string().uuid().optional(),
        activationDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      return await generateTaskFromTemplateInternal({
        templateId: input.templateId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        activationDate: input.activationDate ? new Date(input.activationDate) : undefined,
        tenantId,
        userId,
      });
    }),

  // Preview task generation
  previewGeneration: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        clientId: z.string().uuid(),
        activationDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Fetch templates for service
      const templates = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.tenantId, tenantId),
            eq(taskTemplates.serviceId, input.serviceId),
            eq(taskTemplates.isActive, true),
          ),
        );

      if (templates.length === 0) {
        return { tasks: [] };
      }

      // Fetch client and service for placeholder data
      const client = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.tenantId, tenantId)))
        .limit(1);

      const service = await db
        .select()
        .from(services)
        .where(and(eq(services.id, input.serviceId), eq(services.tenantId, tenantId)))
        .limit(1);

      if (client.length === 0 || service.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client or service not found",
        });
      }

      // Build placeholder data
      const activationDate = input.activationDate
        ? new Date(input.activationDate)
        : new Date();

      const taxYearStart =
        activationDate.getMonth() >= 3
          ? activationDate.getFullYear()
          : activationDate.getFullYear() - 1;
      const taxYear = `${taxYearStart}/${(taxYearStart + 1).toString().slice(2)}`;

      const quarter = Math.ceil((activationDate.getMonth() + 1) / 3);
      const period = `Q${quarter} ${activationDate.getFullYear()}`;

      const placeholderData: PlaceholderData = {
        clientName: client[0].companyName,
        serviceName: service[0].name,
        companyNumber: client[0].companiesHouseNumber || undefined,
        period,
        taxYear,
        activationDate,
      };

      // Generate preview for each template
      const previewTasks = templates.map((template) => {
        const taskName = replacePlaceholders(
          template.namePattern,
          placeholderData,
        );
        const taskDescription = template.descriptionPattern
          ? replacePlaceholders(template.descriptionPattern, placeholderData)
          : undefined;

        const dueDate = calculateDueDate(
          activationDate,
          template.dueDateOffsetDays,
          template.dueDateOffsetMonths,
        );

        const targetDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        return {
          templateId: template.id,
          taskName,
          taskDescription,
          estimatedHours: template.estimatedHours,
          priority: template.priority,
          taskType: template.taskType,
          dueDate: dueDate.toISOString(),
          targetDate: targetDate.toISOString(),
        };
      });

      return { tasks: previewTasks };
    }),

  // Generate FIRST period of a recurring task (subsequent periods auto-generate on completion)
  // NOTE: This is used when a recurring service is first activated
  generateRecurringTask: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        clientId: z.string().uuid(),
        serviceId: z.string().uuid().optional(),
        startDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Fetch template to verify it's recurring
      const template = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, input.templateId),
            eq(taskTemplates.tenantId, tenantId),
            eq(taskTemplates.isActive, true),
            eq(taskTemplates.isRecurring, true),
          ),
        )
        .limit(1);

      if (template.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring template not found",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date();

      // Generate ONLY the first period
      // Subsequent periods will auto-generate when this one is completed
      const result = await generateTaskFromTemplateInternal({
        templateId: input.templateId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        activationDate: startDate,
        tenantId,
        userId,
      });

      return result;
    }),

  // Bulk generate tasks for multiple clients
  generateBulk: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        clientIds: z.array(z.string().uuid()).optional(), // If not provided, generate for all clients with this service
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Fetch templates for service
      const templates = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.tenantId, tenantId),
            eq(taskTemplates.serviceId, input.serviceId),
            eq(taskTemplates.isActive, true),
          ),
        );

      if (templates.length === 0) {
        return {
          success: true,
          generated: 0,
          skipped: 0,
          message: "No templates found for this service",
        };
      }

      // Get client IDs (either from input or all clients with this service)
      let clientIds = input.clientIds;
      if (!clientIds) {
        // Fetch all clients with this service active
        const clientServicesResult = await db
          .select({ clientId: clientServices.clientId })
          .from(clientServices)
          .where(
            and(
              eq(clientServices.tenantId, tenantId),
              eq(clientServices.serviceId, input.serviceId),
              eq(clientServices.isActive, true),
            ),
          );

        clientIds = clientServicesResult.map((cs) => cs.clientId);
      }

      let generated = 0;
      let skipped = 0;

      // Generate tasks for each client and each template
      for (const clientId of clientIds) {
        for (const template of templates) {
          const result = await generateTaskFromTemplateInternal({
            templateId: template.id,
            clientId,
            serviceId: input.serviceId,
            tenantId,
            userId,
          });

          if (result.success) {
            generated++;
          } else if (result.skipped) {
            skipped++;
          }
        }
      }

      return {
        success: true,
        generated,
        skipped,
        message: `Generated ${generated} tasks, skipped ${skipped} duplicates`,
      };
    }),
});
