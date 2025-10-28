[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/workflow-triggers](../README.md) / triggerWorkflowEmails

# Function: triggerWorkflowEmails()

> **triggerWorkflowEmails**(`workflowId`, `stageId`, `tenantId`, `taskId`): `Promise`\<`void`\>

Defined in: [lib/email/workflow-triggers.ts:400](https://github.com/JoeInnsp23/practice-hub/blob/1b8bd13aeadf8575f2cd867559ed019b2cd3640f/lib/email/workflow-triggers.ts#L400)

Triggers workflow email rules when a stage completes

This is the main entry point called from the tasks router when a workflow
stage completes (all checklist items marked complete).

Flow:
1. Query workflowEmailRules for matching rules (by workflowId and stageId)
2. For each rule:
   a. Fetch email template
   b. Resolve recipient email
   c. Gather template variables
   d. Render template with variables
   e. Queue email in emailQueue with delay

## Parameters

### workflowId

`string`

Workflow ID

### stageId

Stage ID that completed (null = workflow complete)

`string` | `null`

### tenantId

`string`

Tenant ID for multi-tenant isolation

### taskId

`string`

Task ID

## Returns

`Promise`\<`void`\>
