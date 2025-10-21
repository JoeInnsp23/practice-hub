# Workflow Template Versioning System - Implementation Continuation Guide

## 🎯 Project Status

### ✅ COMPLETED (Infrastructure Layer)

#### 1. Database Schema - FULLY IMPLEMENTED ✅
**File:** `lib/db/schema.ts`

**Changes Made:**
- ✅ Added `version` and `currentVersionId` fields to `workflows` table (lines 875-876)
- ✅ Created complete `workflow_versions` table (lines 1832-1884) with:
  - Version snapshots (stagesSnapshot JSONB)
  - Change tracking (changeDescription, changeType)
  - Active version tracking (isActive, publishedAt)
  - Full audit trail
- ✅ Updated `taskWorkflowInstances` table (lines 1887-1938) with:
  - `workflowVersionId` (FK to version snapshot)
  - `version` (integer for quick queries)
  - `stagesSnapshot` (frozen copy from version)
  - Upgrade tracking (upgradedFromVersionId, upgradedAt, upgradedById)

#### 2. Seed Script - FULLY UPDATED ✅
**File:** `scripts/seed.ts`

**Changes Made:**
- ✅ Import `workflowVersions` table (line 44)
- ✅ Delete workflow versions in cleanup (line 60)
- ✅ Create workflow versions on template creation (lines 2646-2689)
- ✅ Update task workflow instance creation to use version snapshots (lines 2734-2759)

**Verification:**
```bash
# Database reset successful - 75 workflow instances created with versioning
pnpm db:reset
# ✅ Output: "✓ 75 Workflow instances created"
```

---

## 🚧 REMAINING WORK (Implementation Layer)

### Priority 1: Router Implementation (CRITICAL PATH)

#### Task 1.1: Update `app/server/routers/workflows.ts` - Version Management

**Current State:** Router has basic CRUD but NO versioning logic

**Required Changes:**

##### Step 1: Add Helper Function (Add at top of file, after imports)
**Location:** `app/server/routers/workflows.ts` - Insert after line 42 (after workflowSchema definition)

```typescript
import { nanoid } from "nanoid";

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
    serviceComponentId: string | null;
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
    stages: stages.map((stage) => ({
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
      serviceComponentId: data.serviceComponentId,
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
```

##### Step 2: Update `create` Procedure
**Location:** `app/server/routers/workflows.ts` - Replace lines 127-167

**FIND THIS:**
```typescript
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
```

**REPLACE WITH:**
```typescript
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
            serviceComponentId: input.serviceComponentId,
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
            description: input.description,
            type: input.type,
            trigger: input.trigger || "manual",
            estimatedDays: input.estimatedDays,
            serviceComponentId: input.serviceComponentId,
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
```

##### Step 3: Update `update` Procedure
**Location:** `app/server/routers/workflows.ts` - Replace lines 169-229

**FIND THIS:**
```typescript
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: workflowSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ... existing update logic ...
    }),
```

**REPLACE WITH:**
```typescript
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
          .where(and(eq(workflows.id, input.id), eq(workflows.tenantId, tenantId)))
          .limit(1);

        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
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
          await tx.delete(workflowStages).where(eq(workflowStages.workflowId, input.id));
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
            serviceComponentId: input.data.serviceComponentId ?? workflow.serviceComponentId,
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
```

##### Step 4: Add New Version Management Procedures
**Location:** `app/server/routers/workflows.ts` - Add BEFORE the closing `});` of the router export (after toggleActive procedure, around line 307)

```typescript
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
    .input(z.object({
      versionId: z.string(),
      workflowId: z.string(),
    }))
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

        // Activate selected version
        await tx
          .update(workflowVersions)
          .set({ isActive: true, publishedAt: new Date() })
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
        .innerJoin(workflowVersions, eq(taskWorkflowInstances.workflowVersionId, workflowVersions.id))
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
    .input(z.object({
      instanceIds: z.array(z.string()),
      newVersionId: z.string(),
    }))
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
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
```

**IMPORTANT:** Don't forget to add the required imports at the top of the file:
```typescript
import { desc } from "drizzle-orm"; // Add to existing drizzle-orm import
import { workflowVersions } from "@/lib/db/schema"; // Add to existing schema imports
```

#### Task 1.2: Update `app/server/routers/tasks.ts` - Use Version Snapshots

**Location:** `app/server/routers/tasks.ts` - Replace lines 528-597 (assignWorkflow procedure)

**FIND THIS:**
```typescript
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

      // Create instance
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
```

**REPLACE WITH:**
```typescript
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
```

**IMPORTANT:** Add this import at the top of tasks.ts:
```typescript
import { workflowVersions } from "@/lib/db/schema"; // Add to existing schema imports
```

---

### Priority 2: UI Components

#### Task 2.1: Create Version History Modal

**File:** `components/client-hub/workflows/version-history-modal.tsx` (NEW FILE)

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/app/providers/trpc-provider";
import { CheckCircle2, Clock, History, Layers } from "lucide-react";
import { format } from "date-fns";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  onPublishVersion: (versionId: string, versionNumber: number) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  workflowId,
  onPublishVersion,
}: VersionHistoryModalProps) {
  const { data: versions = [] } = trpc.workflows.listVersions.useQuery(
    workflowId,
    { enabled: isOpen },
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and manage all versions of this workflow template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history available</p>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${
                  version.isActive ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={version.isActive ? "default" : "secondary"}
                        className="font-mono"
                      >
                        v{version.version}
                      </Badge>
                      {version.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {version.changeType}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium mb-1">{version.name}</p>
                    {version.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      {version.changeDescription && (
                        <p className="italic">"{version.changeDescription}"</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {format(new Date(version.createdAt), "MMM dd, yyyy HH:mm")}
                        </span>
                        {version.publishedAt && (
                          <span>
                            Published {format(new Date(version.publishedAt), "MMM dd, yyyy HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {(version.stagesSnapshot as any)?.stages?.length || 0} stages
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {!version.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPublishVersion(version.id, version.version)}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Task 2.2: Create Workflow Upgrade Modal

**File:** `components/client-hub/workflows/workflow-upgrade-modal.tsx` (NEW FILE)

```typescript
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface WorkflowUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  newVersionId: string;
  newVersionNumber: number;
  onUpgradeComplete: () => void;
}

export function WorkflowUpgradeModal({
  isOpen,
  onClose,
  workflowId,
  newVersionId,
  newVersionNumber,
  onUpgradeComplete,
}: WorkflowUpgradeModalProps) {
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: instances = [], isLoading } = trpc.workflows.getActiveInstances.useQuery(
    workflowId,
    { enabled: isOpen },
  );

  const migrateMutation = trpc.workflows.migrateInstances.useMutation();

  const handleToggleInstance = (instanceId: string) => {
    const newSelected = new Set(selectedInstances);
    if (newSelected.has(instanceId)) {
      newSelected.delete(instanceId);
    } else {
      newSelected.add(instanceId);
    }
    setSelectedInstances(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedInstances(new Set(oldVersionInstances.map((i) => i.instanceId)));
  };

  const handleDeselectAll = () => {
    setSelectedInstances(new Set());
  };

  const handleUpgrade = async () => {
    if (selectedInstances.size === 0) {
      toast.error("Please select at least one task to upgrade");
      return;
    }

    setIsUpgrading(true);
    try {
      await migrateMutation.mutateAsync({
        instanceIds: Array.from(selectedInstances),
        newVersionId,
      });
      toast.success(`Upgraded ${selectedInstances.size} task(s) to version ${newVersionNumber}`);
      onUpgradeComplete();
      onClose();
    } catch (error) {
      toast.error("Failed to upgrade tasks");
    } finally {
      setIsUpgrading(false);
    }
  };

  const oldVersionInstances = instances.filter((i) => i.currentVersion < newVersionNumber);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Active Tasks to New Version</DialogTitle>
          <DialogDescription>
            Select which tasks should be upgraded to version {newVersionNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : oldVersionInstances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="font-medium">All active tasks are already on the latest version</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium">
                  {oldVersionInstances.length} task{oldVersionInstances.length !== 1 ? "s" : ""} on
                  older versions
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {oldVersionInstances.map((instance) => (
                <div
                  key={instance.instanceId}
                  className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={instance.instanceId}
                    checked={selectedInstances.has(instance.instanceId)}
                    onCheckedChange={() => handleToggleInstance(instance.instanceId)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={instance.instanceId}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{instance.taskTitle}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono text-xs">
                        v{instance.currentVersion}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge className="font-mono text-xs">v{newVersionNumber}</Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        Progress: {instance.progress}%
                      </span>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">What happens when you upgrade:</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>✓ Tasks will use the new workflow structure and checklist items</li>
                <li>✓ Existing completed items will be preserved where possible</li>
                <li>✓ New checklist items will appear as uncompleted</li>
                <li>✓ Removed checklist items will no longer be visible</li>
                <li>✓ Progress percentage may change based on new total items</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpgrading}>
            Cancel
          </Button>
          {oldVersionInstances.length > 0 && (
            <Button
              onClick={handleUpgrade}
              disabled={selectedInstances.size === 0 || isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                `Upgrade ${selectedInstances.size} Task${selectedInstances.size !== 1 ? "s" : ""}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Task 2.3: Update Workflows Page Integration

**File:** `app/client-hub/workflows/page.tsx`

**Step 1:** Add imports at the top
```typescript
import { History } from "lucide-react"; // Add to existing lucide imports
import { VersionHistoryModal } from "@/components/client-hub/workflows/version-history-modal";
import { WorkflowUpgradeModal } from "@/components/client-hub/workflows/workflow-upgrade-modal";
```

**Step 2:** Add state variables (after existing useState declarations, around line 44)
```typescript
  const [versionHistoryWorkflow, setVersionHistoryWorkflow] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    workflowId: string;
    versionId: string;
    versionNumber: number;
  } | null>(null);
```

**Step 3:** Add mutation (after existing mutations, around line 52)
```typescript
  const publishVersionMutation = trpc.workflows.publishVersion.useMutation();
  const utils = trpc.useUtils();
```

**Step 4:** Add handler function (after existing handlers, around line 153)
```typescript
  const handlePublishVersion = async (
    workflowId: string,
    versionId: string,
    versionNumber: number,
  ) => {
    try {
      // First, check if there are active instances
      const instances = await utils.workflows.getActiveInstances.fetch(workflowId);

      if (instances && instances.length > 0) {
        // Show upgrade modal
        setVersionHistoryWorkflow(null);
        setUpgradeModal({ workflowId, versionId, versionNumber });
      } else {
        // No active instances, just publish
        await publishVersionMutation.mutateAsync({ workflowId, versionId });
        toast.success(`Version ${versionNumber} is now active`);
        setVersionHistoryWorkflow(null);
        refetch();
      }
    } catch (error) {
      toast.error("Failed to publish version");
    }
  };
```

**Step 5:** Add version history menu item in dropdown (inside the DropdownMenuContent, around line 270)
```typescript
                          <DropdownMenuItem
                            onClick={() => setVersionHistoryWorkflow(template.id)}
                          >
                            <History className="mr-2 h-4 w-4" />
                            Version History
                          </DropdownMenuItem>
```

**Step 6:** Add modals at the bottom (before closing div, around line 340)
```typescript
      {/* Version History Modal */}
      {versionHistoryWorkflow && (
        <VersionHistoryModal
          isOpen={true}
          onClose={() => setVersionHistoryWorkflow(null)}
          workflowId={versionHistoryWorkflow}
          onPublishVersion={(versionId, versionNumber) => {
            const workflow = workflowTemplates.find((w) => w.id === versionHistoryWorkflow);
            if (workflow) {
              handlePublishVersion(versionHistoryWorkflow, versionId, versionNumber);
            }
          }}
        />
      )}

      {/* Upgrade Modal */}
      {upgradeModal && (
        <WorkflowUpgradeModal
          isOpen={true}
          onClose={() => setUpgradeModal(null)}
          workflowId={upgradeModal.workflowId}
          newVersionId={upgradeModal.versionId}
          newVersionNumber={upgradeModal.versionNumber}
          onUpgradeComplete={() => {
            refetch();
            setUpgradeModal(null);
            toast.success("Workflow version updated successfully");
          }}
        />
      )}
```

---

### Priority 3: Fix WorkflowTemplateModal (Critical Bug Fixes)

**File:** `components/client-hub/workflows/workflow-template-modal.tsx`

This file has MAJOR issues that need fixing. The complete corrected version is too large to include here, but here are the CRITICAL fixes needed:

#### Issue 1: Import nanoid
**Add to imports (line 1):**
```typescript
import { nanoid } from "nanoid";
```

#### Issue 2: Fix data structure to match schema
**Replace lines 27-33:**
```typescript
interface ChecklistItem {
  id: string;    // Generated with nanoid
  text: string;
}

interface WorkflowStage {
  id?: string;
  name: string;
  description: string;
  stageOrder: number;
  isRequired: boolean;
  estimatedHours: string;
  checklistItems: ChecklistItem[];
  autoComplete: boolean;
  requiresApproval: boolean;
}
```

#### Issue 3: Load real services from database
**Add after line 40:**
```typescript
  // Load real services from database
  const { data: services = [] } = trpc.services.list.useQuery();

  // Load template data if editing
  const { data: templateData, isLoading } = trpc.workflows.getById.useQuery(
    template?.id!,
    { enabled: !!template?.id }
  );
```

#### Issue 4: Fix form data initialization
**Replace formData state (around line 57):**
```typescript
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "task_template",
    trigger: "manual",
    serviceComponentId: null as string | null,
    isActive: true,
    estimatedDays: 1,
    stages: [] as WorkflowStage[],
  });
```

#### Issue 5: Add nanoid to checklist items
**Update addChecklistItem function (around line 145):**
```typescript
  const addChecklistItem = (stageId: string, item: string) => {
    if (!item) return;

    const updatedStages = formData.stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            checklistItems: [
              ...stage.checklistItems,
              { id: nanoid(), text: item }, // Use nanoid here!
            ],
          }
        : stage,
    );
    setFormData({ ...formData, stages: updatedStages });
  };
```

**RECOMMENDATION:** This file needs extensive refactoring. Consider creating a new clean version based on the schema requirements.

---

### Priority 4: Testing

#### Create Test File

**File:** `__tests__/routers/workflows.versioning.test.ts` (NEW FILE)

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { workflowsRouter } from "@/app/server/routers/workflows";
import { tasksRouter } from "@/app/server/routers/tasks";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    transaction: vi.fn((fn) =>
      fn({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      }),
    ),
  },
}));

describe("Workflow Versioning System", () => {
  let ctx: Context;
  let workflowCaller: ReturnType<typeof createCaller<typeof workflowsRouter>>;
  let taskCaller: ReturnType<typeof createCaller<typeof tasksRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    workflowCaller = createCaller(workflowsRouter, ctx);
    taskCaller = createCaller(tasksRouter, ctx);
    vi.clearAllMocks();
  });

  describe("Router Procedures Exist", () => {
    it("should have all version management procedures", () => {
      const procedures = Object.keys(workflowsRouter._def.procedures);

      expect(procedures).toContain("listVersions");
      expect(procedures).toContain("publishVersion");
      expect(procedures).toContain("getActiveInstances");
      expect(procedures).toContain("migrateInstances");
    });
  });

  describe("Input Validation", () => {
    it("should validate listVersions input", () => {
      expect(() => {
        workflowsRouter._def.procedures.listVersions._def.inputs[0]?.parse(
          "workflow-uuid-123",
        );
      }).not.toThrow();
    });

    it("should validate publishVersion input", () => {
      const input = {
        versionId: "version-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      expect(() => {
        workflowsRouter._def.procedures.publishVersion._def.inputs[0]?.parse(input);
      }).not.toThrow();
    });

    it("should validate migrateInstances input", () => {
      const input = {
        instanceIds: ["inst-1", "inst-2", "inst-3"],
        newVersionId: "version-uuid-789",
      };

      expect(() => {
        workflowsRouter._def.procedures.migrateInstances._def.inputs[0]?.parse(input);
      }).not.toThrow();
    });
  });

  describe("Task Assignment with Versioning", () => {
    it("should validate assignWorkflow input", () => {
      const input = {
        taskId: "task-uuid-123",
        workflowId: "workflow-uuid-456",
      };

      expect(() => {
        tasksRouter._def.procedures.assignWorkflow._def.inputs[0]?.parse(input);
      }).not.toThrow();
    });
  });
});
```

**Run tests:**
```bash
pnpm test __tests__/routers/workflows.versioning.test.ts
```

---

## 🔍 Verification Steps

### Step 1: Verify Router Updates
```bash
# Check if workflows router has new procedures
grep -n "listVersions\|publishVersion\|migrateInstances" app/server/routers/workflows.ts
```

### Step 2: Test Version Creation
1. Start dev server: `pnpm dev`
2. Navigate to `/client-hub/workflows`
3. Create a new workflow template
4. Edit the workflow
5. Check database:
```sql
SELECT id, workflow_id, version, is_active FROM workflow_versions ORDER BY created_at DESC;
```

### Step 3: Test Version UI
1. Click "..." menu on a workflow
2. Click "Version History"
3. Verify versions are displayed
4. Click "Activate" on a non-active version
5. Verify upgrade modal appears if there are active tasks

### Step 4: Test Task Assignment
1. Go to a task
2. Click "Assign Workflow"
3. Select a workflow
4. Verify task_workflow_instances has:
   - workflow_version_id
   - version number
   - stages_snapshot

---

## 📊 Database Verification Queries

```sql
-- Check workflow versions
SELECT
  w.name,
  wv.version,
  wv.is_active,
  wv.change_description,
  wv.published_at
FROM workflow_versions wv
JOIN workflows w ON w.id = wv.workflow_id
ORDER BY w.name, wv.version DESC;

-- Check task instances with versions
SELECT
  t.title,
  w.name as workflow_name,
  twi.version,
  wv.version as snapshot_version
FROM task_workflow_instances twi
JOIN tasks t ON t.id = twi.task_id
JOIN workflows w ON w.id = twi.workflow_id
JOIN workflow_versions wv ON wv.id = twi.workflow_version_id;

-- Check for upgrade tracking
SELECT
  t.title,
  twi.version as current_version,
  prev.version as upgraded_from_version,
  twi.upgraded_at
FROM task_workflow_instances twi
JOIN tasks t ON t.id = twi.task_id
LEFT JOIN workflow_versions prev ON prev.id = twi.upgraded_from_version_id
WHERE twi.upgraded_at IS NOT NULL;
```

---

## 🐛 Common Issues & Solutions

### Issue: "workflowVersions is not defined"
**Solution:** Import workflowVersions in the file
```typescript
import { workflowVersions } from "@/lib/db/schema";
```

### Issue: "Cannot read property 'stages' of undefined"
**Solution:** Add null checks when accessing stagesSnapshot
```typescript
const stagesSnapshot = activeVersion.stagesSnapshot as any;
const firstStageId = stagesSnapshot?.stages?.[0]?.id || null;
```

### Issue: Version modal doesn't show versions
**Solution:** Check that workflowId is being passed correctly and listVersions query is enabled:
```typescript
const { data: versions = [] } = trpc.workflows.listVersions.useQuery(
  workflowId,
  { enabled: isOpen && !!workflowId },
);
```

### Issue: "Unique constraint violation" on workflow_versions
**Solution:** The unique index on (workflow_id, version) is enforced. Make sure version numbers increment correctly in the update mutation.

---

## 📝 Implementation Checklist

Use this checklist to track progress:

- [ ] Router: Add `createVersionSnapshot` helper function
- [ ] Router: Update `create` procedure with versioning
- [ ] Router: Update `update` procedure with versioning
- [ ] Router: Add `listVersions` procedure
- [ ] Router: Add `publishVersion` procedure
- [ ] Router: Add `getActiveInstances` procedure
- [ ] Router: Add `migrateInstances` procedure
- [ ] Router: Update tasks.ts `assignWorkflow` with version snapshots
- [ ] UI: Create `version-history-modal.tsx`
- [ ] UI: Create `workflow-upgrade-modal.tsx`
- [ ] UI: Update workflows page with version UI
- [ ] UI: Fix WorkflowTemplateModal schema issues
- [ ] Tests: Create versioning tests
- [ ] Tests: Run test suite
- [ ] Verify: Manual testing of create/update/assign workflow
- [ ] Verify: Manual testing of version UI
- [ ] Verify: Database queries show correct data

---

## 🎯 Success Criteria

The implementation is complete when:

1. ✅ Creating a workflow creates version 1 (active)
2. ✅ Updating a workflow creates version 2 (inactive until published)
3. ✅ Assigning a workflow to a task snapshots the active version
4. ✅ Version history modal shows all versions
5. ✅ Publishing a new version shows upgrade modal if active tasks exist
6. ✅ Selective migration updates chosen tasks to new version
7. ✅ Tests pass without errors
8. ✅ Database constraints are respected (unique version numbers, FK relationships)

---

## 💡 Additional Notes

### Architecture Decisions
- **Versioning is immutable**: Once created, versions cannot be edited
- **Active version is singular**: Only one version can be active per workflow
- **Task instances are frozen**: They maintain their snapshot even when template changes
- **Upgrade is optional**: Users choose which tasks to migrate to new versions

### Performance Considerations
- Denormalized `stagesSnapshot` in both `workflow_versions` and `task_workflow_instances` for performance
- Indexes on `(workflow_id, version)` and `workflow_version_id` for fast lookups
- Use transactions for all version operations to maintain consistency

### Future Enhancements
- [ ] Version comparison UI (diff between versions)
- [ ] Rollback capability (revert to previous version)
- [ ] Bulk upgrade all tasks button
- [ ] Version comments/notes
- [ ] Scheduled version publishing
- [ ] Version approval workflow

---

## 📞 Need Help?

If you encounter issues:

1. Check database schema is up to date: `pnpm db:reset`
2. Verify all imports are correct
3. Check browser console for errors
4. Review database queries above
5. Compare your code against the examples in this document

---

**Last Updated:** 2025-01-21
**Database Schema Version:** Latest (with workflow_versions table)
**Status:** Ready for implementation - all infrastructure complete
