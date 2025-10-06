import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  services,
  taskWorkflowInstances,
  workflowStages,
  workflows,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Generate schemas from Drizzle table definitions
const insertWorkflowSchema = createInsertSchema(workflows);
const insertWorkflowStageSchema = createInsertSchema(workflowStages);

// Schema for workflow stages
const workflowStageSchema = insertWorkflowStageSchema
  .omit({
    id: true,
    workflowId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
  });

// Schema for create/update operations (omit auto-generated fields)
const workflowSchema = insertWorkflowSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
  })
  .extend({
    stages: z.array(workflowStageSchema).optional(),
  });

export const workflowsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
          type: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build where conditions
      const conditions = [eq(workflows.tenantId, tenantId)];

      if (input?.isActive !== undefined) {
        conditions.push(eq(workflows.isActive, input.isActive));
      }

      const results = await db
        .select({
          workflow: workflows,
          service: services,
          stageCount: sql<number>`(
            SELECT COUNT(*)::int FROM workflow_stages
            WHERE workflow_id = workflows.id
          )`,
        })
        .from(workflows)
        .leftJoin(services, eq(workflows.serviceComponentId, services.id))
        .where(and(...conditions))
        .orderBy(desc(workflows.createdAt));

      return results.map((row) => ({
        ...row.workflow,
        service: row.service,
        stageCount: row.stageCount,
      }));
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const workflow = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)))
        .limit(1);

      if (!workflow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Get stages
      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, id))
        .orderBy(workflowStages.stageOrder);

      // Get service if exists
      let service = null;
      if (workflow[0].serviceComponentId) {
        const serviceResult = await db
          .select()
          .from(services)
          .where(eq(services.id, workflow[0].serviceComponentId))
          .limit(1);
        service = serviceResult[0];
      }

      return {
        ...workflow[0],
        stages,
        service,
      };
    }),

  create: protectedProcedure
    .input(workflowSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Create workflow
      const [newWorkflow] = await db
        .insert(workflows)
        .values({
          tenantId,
          name: input.name,
          description: input.description,
          type: input.type,
          trigger: input.trigger || "manual",
          serviceComponentId: input.serviceComponentId,
          isActive: input.isActive,
          estimatedDays: input.estimatedDays,
          config: {},
          createdById: userId,
        })
        .returning();

      // Create stages if provided
      if (input.stages && input.stages.length > 0) {
        for (const stage of input.stages) {
          await db.insert(workflowStages).values({
            workflowId: newWorkflow.id,
            name: stage.name,
            description: stage.description,
            stageOrder: stage.stageOrder,
            isRequired: stage.isRequired,
            estimatedHours: stage.estimatedHours,
            checklistItems: stage.checklistItems,
            autoComplete: stage.autoComplete,
            requiresApproval: stage.requiresApproval,
          });
        }
      }

      return { success: true, workflow: newWorkflow };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: workflowSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Check workflow exists and belongs to tenant
      const existingWorkflow = await db
        .select()
        .from(workflows)
        .where(
          and(eq(workflows.id, input.id), eq(workflows.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingWorkflow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Update workflow
      const [updatedWorkflow] = await db
        .update(workflows)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, input.id))
        .returning();

      // Update stages if provided
      if (input.data.stages) {
        // Delete existing stages
        await db
          .delete(workflowStages)
          .where(eq(workflowStages.workflowId, input.id));

        // Insert new stages
        for (const stage of input.data.stages) {
          await db.insert(workflowStages).values({
            workflowId: input.id,
            name: stage.name,
            description: stage.description,
            stageOrder: stage.stageOrder,
            isRequired: stage.isRequired,
            estimatedHours: stage.estimatedHours,
            checklistItems: stage.checklistItems,
            autoComplete: stage.autoComplete,
            requiresApproval: stage.requiresApproval,
          });
        }
      }

      return { success: true, workflow: updatedWorkflow };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Check workflow exists and belongs to tenant
      const existingWorkflow = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)))
        .limit(1);

      if (!existingWorkflow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Check if workflow is used by any tasks
      const tasksUsingWorkflow = await db
        .select()
        .from(taskWorkflowInstances)
        .where(eq(taskWorkflowInstances.workflowId, id))
        .limit(1);

      if (tasksUsingWorkflow.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete workflow that is in use by tasks",
        });
      }

      // Delete workflow (stages will be cascade deleted)
      await db.delete(workflows).where(eq(workflows.id, id));

      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Check workflow exists and belongs to tenant
      const existingWorkflow = await db
        .select()
        .from(workflows)
        .where(
          and(eq(workflows.id, input.id), eq(workflows.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingWorkflow[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // Update active status
      const [updatedWorkflow] = await db
        .update(workflows)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, input.id))
        .returning();

      return { success: true, workflow: updatedWorkflow };
    }),
});
