/**
 * Workflow Email Triggers
 *
 * Triggers automated emails when workflow stages complete (FR32: AC3).
 * Integrates with workflowEmailRules to send templated emails to stakeholders.
 *
 * Flow:
 * 1. Detect when workflow stage completes (all checklist items checked)
 * 2. Query workflowEmailRules for matching rules
 * 3. Resolve recipients based on recipientType
 * 4. Gather template variables from workflow/task/client/staff data
 * 5. Render email template with variables
 * 6. Queue email in emailQueue with sendDelayHours offset
 */

import * as Sentry from "@sentry/nextjs";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  emailQueue,
  emailTemplates,
  tasks,
  tenants,
  users,
  workflowEmailRules,
  workflowStages,
  workflows,
} from "@/lib/db/schema";
import { renderTemplate, type TemplateVariables } from "./template-renderer";

/**
 * Stage progress data structure from taskWorkflowInstances.stageProgress
 */
interface ChecklistItemProgress {
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

interface StageProgressData {
  checklistItems: Record<string, ChecklistItemProgress>;
}

type StageProgress = Record<string, StageProgressData>;

/**
 * Checklist item structure from workflowStages.checklistItems
 */
interface ChecklistItem {
  id: string;
  text: string;
  isRequired?: boolean;
}

/**
 * Detects if a workflow stage has just been completed
 *
 * A stage is considered complete when ALL checklist items are marked completed.
 * This function checks if all items in the stage are now complete.
 *
 * @param stageProgress - Current stage progress from taskWorkflowInstances
 * @param stageId - Stage ID to check
 * @param checklistItems - Checklist items for this stage from workflowStages
 * @returns True if stage just completed
 */
export function detectStageCompletion(
  stageProgress: StageProgress,
  stageId: string,
  checklistItems: ChecklistItem[],
): boolean {
  // If no checklist items, stage is always complete
  if (!checklistItems || checklistItems.length === 0) {
    return true;
  }

  const stageProgressData = stageProgress[stageId];

  // If no progress data exists, stage is not complete
  if (!stageProgressData) {
    return false;
  }

  // Check if all checklist items are completed
  for (const item of checklistItems) {
    const itemProgress = stageProgressData.checklistItems[item.id];
    if (!itemProgress || !itemProgress.completed) {
      return false; // Found incomplete item
    }
  }

  return true; // All items completed
}

/**
 * Resolves recipient email address based on recipientType
 *
 * Recipient types (FR32: AC4):
 * - "client": Client's primary email
 * - "assigned_staff": Staff member assigned to the task
 * - "client_manager": Client's account manager
 * - "custom_email": Custom email address from rule.customRecipientEmail
 *
 * @param recipientType - Type of recipient
 * @param customEmail - Custom email (used if recipientType = "custom_email")
 * @param taskData - Task data including clientId, assignedTo
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns Recipient email and name, or null if not resolvable
 */
async function resolveRecipient(
  recipientType: string,
  customEmail: string | null,
  taskData: {
    clientId: string | null;
    assignedTo: string | null;
  },
  tenantId: string,
): Promise<{ email: string; name: string | null } | null> {
  try {
    switch (recipientType) {
      case "client": {
        if (!taskData.clientId) {
          return null; // No client associated
        }

        const client = await db
          .select({
            email: clients.email,
            name: clients.name,
          })
          .from(clients)
          .where(
            and(
              eq(clients.id, taskData.clientId),
              eq(clients.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!client[0] || !client[0].email) {
          return null; // Client not found or no email
        }

        return {
          email: client[0].email,
          name: client[0].name,
        };
      }

      case "assigned_staff": {
        if (!taskData.assignedTo) {
          return null; // No staff assigned
        }

        const staff = await db
          .select({
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(
            and(
              eq(users.id, taskData.assignedTo),
              eq(users.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!staff[0] || !staff[0].email) {
          return null; // Staff not found or no email
        }

        return {
          email: staff[0].email,
          name: `${staff[0].firstName} ${staff[0].lastName}`,
        };
      }

      case "client_manager": {
        if (!taskData.clientId) {
          return null; // No client associated
        }

        // Get client's account manager
        const client = await db
          .select({
            accountManagerId: clients.accountManagerId,
          })
          .from(clients)
          .where(
            and(
              eq(clients.id, taskData.clientId),
              eq(clients.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!client[0] || !client[0].accountManagerId) {
          return null; // Client not found or no account manager
        }

        const manager = await db
          .select({
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(
            and(
              eq(users.id, client[0].accountManagerId),
              eq(users.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!manager[0] || !manager[0].email) {
          return null; // Manager not found or no email
        }

        return {
          email: manager[0].email,
          name: `${manager[0].firstName} ${manager[0].lastName}`,
        };
      }

      case "custom_email": {
        if (!customEmail) {
          return null; // No custom email provided
        }

        return {
          email: customEmail,
          name: null, // Custom emails don't have names
        };
      }

      default:
        return null; // Unknown recipient type
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "resolve_recipient" },
      extra: { recipientType, taskData },
    });
    return null;
  }
}

/**
 * Gathers template variables from workflow/task/client/staff data
 *
 * Supported variables (FR32: AC5):
 * - {client_name} - Client's business name
 * - {task_name} - Task title
 * - {due_date} - Task due date
 * - {staff_name} - Assigned staff member's name
 * - {company_name} - Tenant's company name
 * - {workflow_name} - Workflow name
 * - {stage_name} - Workflow stage name
 *
 * @param taskId - Task ID
 * @param workflowId - Workflow ID
 * @param stageId - Stage ID (optional)
 * @param tenantId - Tenant ID
 * @returns Template variables object
 */
async function gatherTemplateVariables(
  taskId: string,
  workflowId: string,
  stageId: string | null,
  tenantId: string,
): Promise<TemplateVariables> {
  try {
    // Fetch task data with related client and staff
    const task = await db
      .select({
        title: tasks.title,
        dueDate: tasks.dueDate,
        clientId: tasks.clientId,
        assignedTo: tasks.assignedToId,
      })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
      .limit(1);

    // Fetch workflow data
    const workflow = await db
      .select({
        name: workflows.name,
      })
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    // Fetch stage data (if stageId provided)
    let stageName: string | null = null;
    if (stageId) {
      const stage = await db
        .select({
          name: workflowStages.name,
        })
        .from(workflowStages)
        .where(eq(workflowStages.id, stageId))
        .limit(1);

      stageName = stage[0]?.name || null;
    }

    // Fetch client data (if clientId exists)
    let clientName: string | null = null;
    if (task[0]?.clientId) {
      const client = await db
        .select({
          name: clients.name,
        })
        .from(clients)
        .where(eq(clients.id, task[0].clientId))
        .limit(1);

      clientName = client[0]?.name || null;
    }

    // Fetch assigned staff data (if assignedTo exists)
    let staffName: string | null = null;
    if (task[0]?.assignedTo) {
      const staff = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, task[0].assignedTo))
        .limit(1);

      staffName = staff[0]
        ? `${staff[0].firstName} ${staff[0].lastName}`
        : null;
    }

    // Fetch tenant company name
    const tenant = await db
      .select({
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    // Format due date if exists
    const dueDate = task[0]?.dueDate
      ? new Date(task[0].dueDate).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

    return {
      client_name: clientName,
      task_name: task[0]?.title || null,
      due_date: dueDate,
      staff_name: staffName,
      company_name: tenant[0]?.name || null,
      workflow_name: workflow[0]?.name || null,
      stage_name: stageName,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "gather_template_variables" },
      extra: { taskId, workflowId, stageId },
    });

    // Return empty variables on error
    return {};
  }
}

/**
 * Triggers workflow email rules when a stage completes
 *
 * This is the main entry point called from the tasks router when a workflow
 * stage completes (all checklist items marked complete).
 *
 * Flow:
 * 1. Query workflowEmailRules for matching rules (by workflowId and stageId)
 * 2. For each rule:
 *    a. Fetch email template
 *    b. Resolve recipient email
 *    c. Gather template variables
 *    d. Render template with variables
 *    e. Queue email in emailQueue with delay
 *
 * @param workflowId - Workflow ID
 * @param stageId - Stage ID that completed (null = workflow complete)
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param taskId - Task ID
 */
export async function triggerWorkflowEmails(
  workflowId: string,
  stageId: string | null,
  tenantId: string,
  taskId: string,
): Promise<void> {
  try {
    // 1. Query workflowEmailRules for matching rules
    // Match both stage-specific rules (stageId = X) AND any-stage rules (stageId IS NULL)
    const rules = await db
      .select()
      .from(workflowEmailRules)
      .where(
        and(
          eq(workflowEmailRules.tenantId, tenantId),
          eq(workflowEmailRules.workflowId, workflowId),
          eq(workflowEmailRules.isActive, true),
          or(
            stageId ? eq(workflowEmailRules.stageId, stageId) : undefined,
            isNull(workflowEmailRules.stageId), // Any-stage rules
          ),
        ),
      );

    if (rules.length === 0) {
      // No rules configured - this is normal, not an error
      return;
    }

    // Fetch task data once (needed for recipient resolution)
    const task = await db
      .select({
        clientId: tasks.clientId,
        assignedTo: tasks.assignedToId,
      })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
      .limit(1);

    if (!task[0]) {
      throw new Error("Task not found");
    }

    const taskData = {
      clientId: task[0].clientId,
      assignedTo: task[0].assignedTo,
    };

    // 2. Process each rule
    for (const rule of rules) {
      try {
        // a. Fetch email template
        const template = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.id, rule.emailTemplateId))
          .limit(1);

        if (!template[0] || !template[0].isActive) {
          console.warn(
            `[Workflow Email] Template ${rule.emailTemplateId} not found or inactive, skipping rule ${rule.id}`,
          );
          continue; // Skip this rule
        }

        // b. Resolve recipient email
        const recipient = await resolveRecipient(
          rule.recipientType,
          rule.customRecipientEmail,
          taskData,
          tenantId,
        );

        if (!recipient || !recipient.email) {
          console.warn(
            `[Workflow Email] Could not resolve recipient for rule ${rule.id} (type: ${rule.recipientType}), skipping`,
          );
          continue; // Skip this rule
        }

        // c. Gather template variables
        const variables = await gatherTemplateVariables(
          taskId,
          workflowId,
          stageId,
          tenantId,
        );

        // d. Render template with variables
        const renderedSubject = renderTemplate(template[0].subject, variables);
        const renderedBodyHtml = renderTemplate(
          template[0].bodyHtml,
          variables,
        );
        const renderedBodyText = template[0].bodyText
          ? renderTemplate(template[0].bodyText, variables)
          : null;

        // e. Calculate sendAt with delay
        const sendAt = new Date();
        sendAt.setHours(sendAt.getHours() + rule.sendDelayHours);

        // f. Queue email in emailQueue
        await db.insert(emailQueue).values({
          tenantId,
          emailTemplateId: rule.emailTemplateId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject: renderedSubject,
          bodyHtml: renderedBodyHtml,
          bodyText: renderedBodyText,
          variables: variables as unknown as Record<string, unknown>, // Type assertion for jsonb
          status: "pending",
          sendAt,
          attempts: 0,
          maxAttempts: 3,
        });

        console.log(
          `[Workflow Email] Queued email for workflow ${workflowId} stage ${stageId || "any"} to ${recipient.email} (send at: ${sendAt.toISOString()})`,
        );
      } catch (error) {
        // Log error for this rule but continue processing other rules
        Sentry.captureException(error, {
          tags: { operation: "process_workflow_email_rule" },
          extra: { ruleId: rule.id, workflowId, stageId },
        });
        console.error(
          `[Workflow Email] Error processing rule ${rule.id}:`,
          error,
        );
      }
    }
  } catch (error) {
    // Log error but don't throw - we don't want email errors to block workflow progression
    Sentry.captureException(error, {
      tags: { operation: "trigger_workflow_emails" },
      extra: { workflowId, stageId, taskId },
    });
    console.error("[Workflow Email] Error triggering workflow emails:", error);
  }
}
