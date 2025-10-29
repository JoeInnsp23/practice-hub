[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/workflow-triggers](../README.md) / detectStageCompletion

# Function: detectStageCompletion()

> **detectStageCompletion**(`stageProgress`, `stageId`, `checklistItems`): `boolean`

Defined in: [lib/email/workflow-triggers.ts:67](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/email/workflow-triggers.ts#L67)

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
