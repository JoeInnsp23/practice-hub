/**
 * Email Templates tRPC Router
 *
 * CRUD operations for managing email templates.
 * Implements FR32: AC9, AC10, AC11
 */

import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, emailQueue, emailTemplates } from "@/lib/db/schema";
import { queueEmail } from "@/lib/email/queue-processor";
import {
  renderTemplate,
  SUPPORTED_VARIABLES,
  validateTemplate,
} from "@/lib/email/template-renderer";
import { adminProcedure, protectedProcedure, router } from "../trpc";

/**
 * Template types (FR32: AC2)
 */
const TEMPLATE_TYPES = [
  "workflow_stage_complete",
  "task_assigned",
  "task_due_soon",
  "task_overdue",
  "client_created",
  "client_status_changed",
] as const;

// Helper function to log template activities
async function logTemplateActivity(params: {
  action: string;
  templateId: string;
  tenantId: string;
  userId: string;
  userName: string;
  description: string;
}) {
  await db.insert(activityLogs).values({
    tenantId: params.tenantId,
    entityType: "email_template",
    entityId: params.templateId,
    action: params.action,
    description: params.description,
    userId: params.userId,
    userName: params.userName || null,
    metadata: null,
  });
}

export const emailTemplatesRouter = router({
  /**
   * List email templates (FR32: AC11)
   *
   * Supports filtering by template type and active status
   */
  list: protectedProcedure
    .input(
      z.object({
        templateType: z.enum(TEMPLATE_TYPES).optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build where conditions
      const conditions = [eq(emailTemplates.tenantId, tenantId)];

      if (input.templateType) {
        conditions.push(eq(emailTemplates.templateType, input.templateType));
      }

      if (input.isActive !== undefined) {
        conditions.push(eq(emailTemplates.isActive, input.isActive));
      }

      if (input.search) {
        conditions.push(
          sql`(${emailTemplates.templateName} ILIKE ${`%${input.search}%`} OR ${emailTemplates.subject} ILIKE ${`%${input.search}%`})`,
        );
      }

      const templates = await db.query.emailTemplates.findMany({
        where: and(...conditions),
        orderBy: (emailTemplates, { desc }) => [desc(emailTemplates.createdAt)],
      });

      return { templates };
    }),

  /**
   * Get single template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const template = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, input.id),
          eq(emailTemplates.tenantId, tenantId),
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      return { template };
    }),

  /**
   * Create email template (FR32: AC11)
   *
   * Validates template variables and creates activity log
   */
  create: adminProcedure
    .input(
      z.object({
        templateName: z.string().min(1, "Template name is required"),
        templateType: z.enum(TEMPLATE_TYPES),
        subject: z.string().min(1, "Subject is required"),
        bodyHtml: z.string().min(1, "HTML body is required"),
        bodyText: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, email } = ctx.authContext;

      // Validate template variables
      const validation = validateTemplate(
        input.bodyHtml,
        SUPPORTED_VARIABLES as unknown as string[],
      );
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid template variables: ${validation.errors.join(", ")}`,
        });
      }

      // Create template
      const [template] = await db
        .insert(emailTemplates)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          templateName: input.templateName,
          templateType: input.templateType,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText || null,
          variables: input.variables || null,
          isActive: input.isActive,
        })
        .returning();

      // Log activity
      await logTemplateActivity({
        action: "email_template.created",
        templateId: template.id,
        tenantId,
        userId,
        userName: email,
        description: `Created email template: ${template.templateName}`,
      });

      return { template };
    }),

  /**
   * Update email template (FR32: AC11)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        templateName: z.string().min(1).optional(),
        templateType: z.enum(TEMPLATE_TYPES).optional(),
        subject: z.string().min(1).optional(),
        bodyHtml: z.string().min(1).optional(),
        bodyText: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, email } = ctx.authContext;

      // Verify template exists and belongs to tenant
      const existing = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, input.id),
          eq(emailTemplates.tenantId, tenantId),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      // Validate template variables if bodyHtml is being updated
      if (input.bodyHtml) {
        const validation = validateTemplate(
          input.bodyHtml,
          SUPPORTED_VARIABLES as unknown as string[],
        );
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid template variables: ${validation.errors.join(", ")}`,
          });
        }
      }

      // Update template
      const [updated] = await db
        .update(emailTemplates)
        .set({
          templateName: input.templateName,
          templateType: input.templateType,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          variables: input.variables,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, input.id))
        .returning();

      // Log activity
      await logTemplateActivity({
        action: "email_template.updated",
        templateId: updated.id,
        tenantId,
        userId,
        userName: email,
        description: `Updated email template: ${updated.templateName}`,
      });

      return { template: updated };
    }),

  /**
   * Delete email template
   *
   * Prevents deletion if template has pending emails in queue
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, email } = ctx.authContext;

      // Verify template exists
      const template = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, input.id),
          eq(emailTemplates.tenantId, tenantId),
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      // Check for pending emails using this template
      const pendingEmails = await db.query.emailQueue.findFirst({
        where: and(
          eq(emailQueue.emailTemplateId, input.id),
          eq(emailQueue.status, "pending"),
        ),
      });

      if (pendingEmails) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot delete template with pending emails. Wait for emails to send or cancel them first.",
        });
      }

      // Delete template (or soft delete by setting isActive = false)
      await db
        .update(emailTemplates)
        .set({ isActive: false })
        .where(eq(emailTemplates.id, input.id));

      // Log activity
      await logTemplateActivity({
        action: "email_template.deleted",
        templateId: template.id,
        tenantId,
        userId,
        userName: email,
        description: `Deleted email template: ${template.templateName}`,
      });

      return { success: true };
    }),

  /**
   * Preview email template with sample data (FR32: AC10)
   *
   * Renders template with sample variable values
   */
  preview: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        bodyHtml: z.string(),
        subject: z.string(),
        sampleData: z.record(z.string(), z.string()).default({
          client_name: "ABC Manufacturing Ltd",
          task_name: "VAT Return Q3 2025",
          due_date: "2025-11-15",
          staff_name: "Sarah Johnson",
          company_name: "Practice Hub Demo",
          workflow_name: "Quarterly VAT Filing",
          stage_name: "Review & Approval",
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // If ID provided, verify access
      if (input.id) {
        const template = await db.query.emailTemplates.findFirst({
          where: and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.tenantId, tenantId),
          ),
        });

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email template not found",
          });
        }
      }

      // Render template with sample data
      const renderedSubject = renderTemplate(input.subject, input.sampleData);
      const renderedBody = renderTemplate(input.bodyHtml, input.sampleData);

      return {
        subject: renderedSubject,
        bodyHtml: renderedBody,
      };
    }),

  /**
   * Send test email (FR32: AC11)
   *
   * Sends a test email to specified recipient using template
   */
  sendTest: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recipientEmail: z.string().email(),
        sampleData: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, email: senderEmail } = ctx.authContext;

      // Get template
      const template = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, input.id),
          eq(emailTemplates.tenantId, tenantId),
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email template not found",
        });
      }

      // Use provided sample data or defaults
      const sampleData = input.sampleData || {
        client_name: "ABC Manufacturing Ltd",
        task_name: "VAT Return Q3 2025",
        due_date: "2025-11-15",
        staff_name: senderEmail,
        company_name: "Practice Hub Demo",
        workflow_name: "Quarterly VAT Filing",
        stage_name: "Review & Approval",
      };

      // Render template
      const subject = renderTemplate(template.subject, sampleData);
      const bodyHtml = renderTemplate(template.bodyHtml, sampleData);
      const bodyText = template.bodyText
        ? renderTemplate(template.bodyText, sampleData)
        : null;

      // Queue test email for immediate sending
      await queueEmail({
        tenantId,
        emailTemplateId: template.id,
        recipientEmail: input.recipientEmail,
        recipientName: null,
        subject: `[TEST] ${subject}`,
        bodyHtml,
        bodyText,
        variables: sampleData,
        sendAt: new Date(), // Send immediately
      });

      // Log activity
      await logTemplateActivity({
        action: "email_template.test_sent",
        templateId: template.id,
        tenantId,
        userId,
        userName: senderEmail,
        description: `Sent test email to ${input.recipientEmail}`,
      });

      return { success: true };
    }),

  /**
   * Get supported template variables
   *
   * Returns list of available variables for template editor UI
   */
  getSupportedVariables: protectedProcedure.query(() => {
    return {
      variables: SUPPORTED_VARIABLES.map((variable) => ({
        name: variable,
        placeholder: `{${variable}}`,
        description: getVariableDescription(variable),
      })),
    };
  }),

  /**
   * Get template types
   *
   * Returns list of available template types for dropdown
   */
  getTemplateTypes: protectedProcedure.query(() => {
    return {
      types: TEMPLATE_TYPES.map((type) => ({
        value: type,
        label: formatTemplateType(type),
        description: getTemplateTypeDescription(type),
      })),
    };
  }),
});

/**
 * Helper: Get variable description for UI
 */
function getVariableDescription(variable: string): string {
  const descriptions: Record<string, string> = {
    client_name: "Client's business name (e.g., ABC Ltd)",
    task_name: "Task title or name",
    due_date: "Task or workflow due date",
    staff_name: "Assigned staff member's name",
    company_name: "Your practice's company name",
    workflow_name: "Workflow name",
    stage_name: "Current workflow stage name",
  };
  return descriptions[variable] || variable;
}

/**
 * Helper: Format template type for display
 */
function formatTemplateType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Helper: Get template type description
 */
function getTemplateTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    workflow_stage_complete: "Triggered when a workflow stage is completed",
    task_assigned: "Triggered when a task is assigned to a staff member",
    task_due_soon: "Triggered when a task is approaching its due date",
    task_overdue: "Triggered when a task becomes overdue",
    client_created: "Triggered when a new client is created",
    client_status_changed: "Triggered when a client's status changes",
  };
  return descriptions[type] || type;
}
