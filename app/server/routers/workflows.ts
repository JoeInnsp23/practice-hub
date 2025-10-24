import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  services,
  tasks,
  taskWorkflowInstances,
  workflowStages,
  workflows,
  workflowVersions,
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

// Helper: Create version snapshot
async function createVersionSnapshot(
  tx: any, // Transaction object
  workflowId: string,
  version: number,
  data: {
    name: string;
    description: string | null;
    type: string;
    trigger: string;
    estimatedDays: number | null;
    serviceId: string | null;
    config: any;
  },
  changeDescription: string,
  changeType: string,
  tenantId: string,
  userId: string,
) {
  // Get full stage data with checklist items
  const stages = await tx
    .select()
    .from(workflowStages)
    .where(eq(workflowStages.workflowId, workflowId))
    .orderBy(workflowStages.stageOrder);

  // Create snapshot with all stage data
  const stagesSnapshot = {
    stages: stages.map((stage: any) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      stageOrder: stage.stageOrder,
      isRequired: stage.isRequired,
      estimatedHours: stage.estimatedHours || "0",
      autoComplete: stage.autoComplete,
      requiresApproval: stage.requiresApproval,
      checklistItems: (stage.checklistItems as any[]) || [],
    })),
  };

  const [versionRecord] = await tx
    .insert(workflowVersions)
    .values({
      workflowId,
      tenantId,
      version,
      name: data.name,
      description: data.description,
      type: data.type,
      trigger: data.trigger,
      estimatedDays: data.estimatedDays,
      serviceId: data.serviceId,
      config: data.config,
      stagesSnapshot,
      changeDescription,
      changeType,
      isActive: false, // Not active until published
      createdById: userId,
    })
    .returning();

  return versionRecord;
}

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
        .leftJoin(services, eq(workflows.serviceId, services.id))
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
      if (workflow[0].serviceId) {
        const serviceResult = await db
          .select()
          .from(services)
          .where(eq(services.id, workflow[0].serviceId))
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

      return await db.transaction(async (tx) => {
        // 1. Create workflow with version 1
        const [newWorkflow] = await tx
          .insert(workflows)
          .values({
            tenantId,
            version: 1,
            name: input.name,
            description: input.description,
            type: input.type,
            trigger: input.trigger || "manual",
            serviceId: input.serviceId,
            isActive: input.isActive,
            estimatedDays: input.estimatedDays,
            config: input.config || {},
            createdById: userId,
          })
          .returning();

        // 2. Create stages if provided
        if (input.stages && input.stages.length > 0) {
          for (const stage of input.stages) {
            await tx.insert(workflowStages).values({
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

        // 3. Create initial version snapshot
        const versionRecord = await createVersionSnapshot(
          tx,
          newWorkflow.id,
          1,
          {
            name: input.name,
            description: input.description ?? null,
            type: input.type,
            trigger: input.trigger || "manual",
            estimatedDays: input.estimatedDays ?? null,
            serviceId: input.serviceId ?? null,
            config: input.config || {},
          },
          "Initial version",
          "created",
          tenantId,
          userId,
        );

        // 4. Mark version as active and update workflow
        await tx
          .update(workflowVersions)
          .set({ isActive: true, publishedAt: new Date() })
          .where(eq(workflowVersions.id, versionRecord.id));

        await tx
          .update(workflows)
          .set({ currentVersionId: versionRecord.id })
          .where(eq(workflows.id, newWorkflow.id));

        return { success: true, workflow: newWorkflow, version: versionRecord };
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: workflowSchema.partial(),
        changeDescription: z.string().optional(),
        publishImmediately: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      return await db.transaction(async (tx) => {
        // 1. Get current workflow
        const [workflow] = await tx
          .select()
          .from(workflows)
          .where(
            and(eq(workflows.id, input.id), eq(workflows.tenantId, tenantId)),
          )
          .limit(1);

        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        const newVersion = workflow.version + 1;

        // 2. Update workflow record
        const [updated] = await tx
          .update(workflows)
          .set({
            ...input.data,
            version: newVersion,
            updatedAt: new Date(),
          })
          .where(eq(workflows.id, input.id))
          .returning();

        // 3. Update stages if provided
        if (input.data.stages) {
          await tx
            .delete(workflowStages)
            .where(eq(workflowStages.workflowId, input.id));
          for (const stage of input.data.stages) {
            await tx.insert(workflowStages).values({
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

        // 4. Create new version snapshot
        const versionRecord = await createVersionSnapshot(
          tx,
          input.id,
          newVersion,
          {
            name: input.data.name || workflow.name,
            description: input.data.description ?? workflow.description,
            type: input.data.type || workflow.type,
            trigger: input.data.trigger || workflow.trigger || "manual",
            estimatedDays: input.data.estimatedDays ?? workflow.estimatedDays,
            serviceId:
              input.data.serviceId ?? workflow.serviceId,
            config: input.data.config || workflow.config,
          },
          input.changeDescription || "Updated workflow",
          "updated",
          tenantId,
          userId,
        );

        // 5. If publishImmediately, activate new version
        if (input.publishImmediately) {
          await tx
            .update(workflowVersions)
            .set({ isActive: false })
            .where(eq(workflowVersions.workflowId, input.id));

          await tx
            .update(workflowVersions)
            .set({ isActive: true, publishedAt: new Date() })
            .where(eq(workflowVersions.id, versionRecord.id));

          await tx
            .update(workflows)
            .set({ currentVersionId: versionRecord.id })
            .where(eq(workflows.id, input.id));
        }

        return { success: true, workflow: updated, version: versionRecord };
      });
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

  // NEW: List all versions for a workflow
  listVersions: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: workflowId }) => {
      const { tenantId } = ctx.authContext;

      const versions = await db
        .select()
        .from(workflowVersions)
        .where(
          and(
            eq(workflowVersions.workflowId, workflowId),
            eq(workflowVersions.tenantId, tenantId),
          ),
        )
        .orderBy(desc(workflowVersions.version));

      return versions;
    }),

  // NEW: Publish a specific version (make it active)
  publishVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        workflowId: z.string(),
        publishNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      return await db.transaction(async (tx) => {
        // Deactivate all versions for this workflow
        await tx
          .update(workflowVersions)
          .set({ isActive: false })
          .where(
            and(
              eq(workflowVersions.workflowId, input.workflowId),
              eq(workflowVersions.tenantId, tenantId),
            ),
          );

        // Activate selected version with optional notes
        await tx
          .update(workflowVersions)
          .set({
            isActive: true,
            publishedAt: new Date(),
            publishNotes: input.publishNotes || null,
          })
          .where(eq(workflowVersions.id, input.versionId));

        // Update workflow current version
        await tx
          .update(workflows)
          .set({ currentVersionId: input.versionId })
          .where(eq(workflows.id, input.workflowId));

        return { success: true };
      });
    }),

  // NEW: Get active task instances for a workflow (for upgrade UI)
  getActiveInstances: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: workflowId }) => {
      const { tenantId } = ctx.authContext;

      const instances = await db
        .select({
          instance: taskWorkflowInstances,
          task: tasks,
          version: workflowVersions,
        })
        .from(taskWorkflowInstances)
        .innerJoin(tasks, eq(taskWorkflowInstances.taskId, tasks.id))
        .innerJoin(
          workflowVersions,
          eq(taskWorkflowInstances.workflowVersionId, workflowVersions.id),
        )
        .where(
          and(
            eq(taskWorkflowInstances.workflowId, workflowId),
            eq(tasks.tenantId, tenantId),
            eq(taskWorkflowInstances.status, "active"),
          ),
        );

      return instances.map((row) => ({
        instanceId: row.instance.id,
        taskId: row.instance.taskId,
        taskTitle: row.task.title,
        currentVersion: row.version.version,
        versionId: row.instance.workflowVersionId,
        progress: row.task.progress || 0,
      }));
    }),

  // NEW: Migrate task instances to new version
  migrateInstances: protectedProcedure
    .input(
      z.object({
        instanceIds: z.array(z.string()),
        newVersionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      return await db.transaction(async (tx) => {
        // Get new version snapshot
        const [newVersion] = await tx
          .select()
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.id, input.newVersionId),
              eq(workflowVersions.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!newVersion) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Version not found",
          });
        }

        // Update each instance
        for (const instanceId of input.instanceIds) {
          const [instance] = await tx
            .select()
            .from(taskWorkflowInstances)
            .where(eq(taskWorkflowInstances.id, instanceId))
            .limit(1);

          if (instance) {
            await tx
              .update(taskWorkflowInstances)
              .set({
                workflowVersionId: input.newVersionId,
                version: newVersion.version,
                stagesSnapshot: newVersion.stagesSnapshot,
                upgradedFromVersionId: instance.workflowVersionId,
                upgradedAt: new Date(),
                upgradedById: userId,
                updatedAt: new Date(),
              })
              .where(eq(taskWorkflowInstances.id, instanceId));
          }
        }

        return { success: true, migratedCount: input.instanceIds.length };
      });
    }),

  // NEW: Compare two versions to see differences
  compareVersions: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        versionId1: z.string(),
        versionId2: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Fetch both versions
      const [version1, version2] = await Promise.all([
        db
          .select()
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.id, input.versionId1),
              eq(workflowVersions.workflowId, input.workflowId),
              eq(workflowVersions.tenantId, tenantId),
            ),
          )
          .limit(1),
        db
          .select()
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.id, input.versionId2),
              eq(workflowVersions.workflowId, input.workflowId),
              eq(workflowVersions.tenantId, tenantId),
            ),
          )
          .limit(1),
      ]);

      if (!version1[0] || !version2[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both versions not found",
        });
      }

      // Helper to compare stages
      const compareStages = (
        stages1: any[],
        stages2: any[],
      ): {
        added: any[];
        removed: any[];
        modified: Array<{ old: any; new: any; changes: string[] }>;
        unchanged: any[];
      } => {
        const added: any[] = [];
        const removed: any[] = [];
        const modified: Array<{ old: any; new: any; changes: string[] }> = [];
        const unchanged: any[] = [];

        const stages1Map = new Map(stages1.map((s) => [s.id, s]));
        const stages2Map = new Map(stages2.map((s) => [s.id, s]));

        // Find removed stages
        for (const stage1 of stages1) {
          if (!stages2Map.has(stage1.id)) {
            removed.push(stage1);
          }
        }

        // Find added and modified stages
        for (const stage2 of stages2) {
          const stage1 = stages1Map.get(stage2.id);

          if (!stage1) {
            added.push(stage2);
          } else {
            // Check for modifications
            const changes: string[] = [];

            if (stage1.name !== stage2.name) {
              changes.push("name");
            }
            if (stage1.description !== stage2.description) {
              changes.push("description");
            }
            if (stage1.stageOrder !== stage2.stageOrder) {
              changes.push("order");
            }
            if (stage1.isRequired !== stage2.isRequired) {
              changes.push("required");
            }
            if (stage1.estimatedHours !== stage2.estimatedHours) {
              changes.push("estimatedHours");
            }
            if (stage1.autoComplete !== stage2.autoComplete) {
              changes.push("autoComplete");
            }
            if (stage1.requiresApproval !== stage2.requiresApproval) {
              changes.push("requiresApproval");
            }

            // Compare checklist items
            const items1 = stage1.checklistItems || [];
            const items2 = stage2.checklistItems || [];

            if (JSON.stringify(items1) !== JSON.stringify(items2)) {
              changes.push("checklistItems");
            }

            if (changes.length > 0) {
              modified.push({ old: stage1, new: stage2, changes });
            } else {
              unchanged.push(stage2);
            }
          }
        }

        return { added, removed, modified, unchanged };
      };

      const v1Stages = (version1[0].stagesSnapshot as any)?.stages || [];
      const v2Stages = (version2[0].stagesSnapshot as any)?.stages || [];

      const stageDiff = compareStages(v1Stages, v2Stages);

      // Compare metadata
      const metadataChanges: string[] = [];
      if (version1[0].name !== version2[0].name) metadataChanges.push("name");
      if (version1[0].description !== version2[0].description)
        metadataChanges.push("description");
      if (version1[0].estimatedDays !== version2[0].estimatedDays)
        metadataChanges.push("estimatedDays");
      if (version1[0].trigger !== version2[0].trigger)
        metadataChanges.push("trigger");
      if (version1[0].serviceId !== version2[0].serviceId)
        metadataChanges.push("service");

      return {
        version1: version1[0],
        version2: version2[0],
        metadataChanges,
        stageDiff,
        summary: {
          stagesAdded: stageDiff.added.length,
          stagesRemoved: stageDiff.removed.length,
          stagesModified: stageDiff.modified.length,
          metadataChanged: metadataChanges.length > 0,
        },
      };
    }),

  // NEW: Rollback workflow to a previous version (creates new version)
  rollbackToVersion: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        targetVersionId: z.string(),
        publishImmediately: z.boolean().default(false),
        publishNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      return await db.transaction(async (tx) => {
        // 1. Get current workflow and target version
        const [workflow, targetVersion] = await Promise.all([
          tx
            .select()
            .from(workflows)
            .where(
              and(
                eq(workflows.id, input.workflowId),
                eq(workflows.tenantId, tenantId),
              ),
            )
            .limit(1),
          tx
            .select()
            .from(workflowVersions)
            .where(
              and(
                eq(workflowVersions.id, input.targetVersionId),
                eq(workflowVersions.workflowId, input.workflowId),
                eq(workflowVersions.tenantId, tenantId),
              ),
            )
            .limit(1),
        ]);

        if (!workflow[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        if (!targetVersion[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target version not found",
          });
        }

        const newVersion = workflow[0].version + 1;

        // 2. Update workflow with target version's data
        const [updatedWorkflow] = await tx
          .update(workflows)
          .set({
            name: targetVersion[0].name,
            description: targetVersion[0].description,
            type: targetVersion[0].type,
            trigger: targetVersion[0].trigger,
            estimatedDays: targetVersion[0].estimatedDays,
            serviceId: targetVersion[0].serviceId,
            config: targetVersion[0].config,
            version: newVersion,
            updatedAt: new Date(),
          })
          .where(eq(workflows.id, input.workflowId))
          .returning();

        // 3. Recreate stages from target version
        await tx
          .delete(workflowStages)
          .where(eq(workflowStages.workflowId, input.workflowId));

        const targetStages =
          (targetVersion[0].stagesSnapshot as any)?.stages || [];
        for (const stage of targetStages) {
          await tx.insert(workflowStages).values({
            id: stage.id, // Keep original IDs for consistency
            workflowId: input.workflowId,
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

        // 4. Create new version record (rollback creates new version for audit)
        const versionRecord = await createVersionSnapshot(
          tx,
          input.workflowId,
          newVersion,
          {
            name: targetVersion[0].name,
            description: targetVersion[0].description,
            type: targetVersion[0].type,
            trigger: targetVersion[0].trigger || "manual",
            estimatedDays: targetVersion[0].estimatedDays,
            serviceId: targetVersion[0].serviceId,
            config: targetVersion[0].config,
          },
          `Rolled back to version ${targetVersion[0].version}`,
          "rollback",
          tenantId,
          userId,
        );

        // 5. Add publish notes if provided
        if (input.publishNotes) {
          await tx
            .update(workflowVersions)
            .set({ publishNotes: input.publishNotes })
            .where(eq(workflowVersions.id, versionRecord.id));
        }

        // 6. If publishImmediately, activate new version
        if (input.publishImmediately) {
          await tx
            .update(workflowVersions)
            .set({ isActive: false })
            .where(eq(workflowVersions.workflowId, input.workflowId));

          await tx
            .update(workflowVersions)
            .set({ isActive: true, publishedAt: new Date() })
            .where(eq(workflowVersions.id, versionRecord.id));

          await tx
            .update(workflows)
            .set({ currentVersionId: versionRecord.id })
            .where(eq(workflows.id, input.workflowId));
        }

        return {
          success: true,
          workflow: updatedWorkflow,
          newVersion: versionRecord,
          rolledBackFrom: targetVersion[0].version,
        };
      });
    }),
});
