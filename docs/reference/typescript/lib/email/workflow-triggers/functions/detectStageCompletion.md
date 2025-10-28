[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/workflow-triggers](../README.md) / detectStageCompletion

# Function: detectStageCompletion()

> **detectStageCompletion**(`stageProgress`, `stageId`, `checklistItems`): `boolean`

Defined in: [lib/email/workflow-triggers.ts:67](https://github.com/JoeInnsp23/practice-hub/blob/e0eeb99bc1dd61707be1ca896330969c20a59d27/lib/email/workflow-triggers.ts#L67)

Detects if a workflow stage has just been completed

A stage is considered complete when ALL checklist items are marked completed.
This function checks if all items in the stage are now complete.

## Parameters

### stageProgress

`StageProgress`

Current stage progress from taskWorkflowInstances

### stageId

`string`

Stage ID to check

### checklistItems

`ChecklistItem`[]

Checklist items for this stage from workflowStages

## Returns

`boolean`

True if stage just completed
