import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  leads,
  proposalNotes,
  proposalServices,
  proposalSignatures,
  proposals,
  proposalVersions,
  users,
} from "@/lib/db/schema";
import { docusealClient } from "@/lib/docuseal/client";
import { sendSigningInvitation } from "@/lib/docuseal/email-handler";
import { getProposalSignatureFields } from "@/lib/docuseal/uk-compliance-fields";
import {
  sendSignedConfirmationEmail,
  sendTeamNotificationEmail,
} from "@/lib/email/send-proposal-email";
import { generateProposalPdf } from "@/lib/pdf/generate-proposal-pdf";
import { checkSigningRateLimit, getClientIp } from "@/lib/rate-limit/signing";
import { getProposalSignedPdfUrl } from "@/lib/s3/signed-pdf-access";
import {
  getAutomationReason,
  getAutoSalesStage,
} from "@/lib/utils/sales-stage-automation";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Status enum for filtering
const proposalStatusEnum = z.enum([
  "draft",
  "sent",
  "viewed",
  "signed",
  "rejected",
  "expired",
]);

// Sales Stage enum for filtering
const salesStageEnum = z.enum([
  "enquiry",
  "qualified",
  "proposal_sent",
  "follow_up",
  "won",
  "lost",
  "dormant",
]);

// Generate schema from Drizzle table definition
const insertProposalSchema = createInsertSchema(proposals, {
  validUntil: z.string().optional(),
  sentAt: z.string().optional(),
  viewedAt: z.string().optional(),
  signedAt: z.string().optional(),
});

// Schema for create/update operations
const proposalSchema = insertProposalSchema
  .omit({
    id: true,
    tenantId: true,
    proposalNumber: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
  })
  .extend({
    services: z
      .array(
        z.object({
          componentCode: z.string(),
          componentName: z.string(),
          calculation: z.string().optional(),
          price: z.number(),
          config: z.record(z.string(), z.any()).optional(),
        }),
      )
      .optional(),
  });

const _proposalServiceSchema = z.object({
  componentCode: z.string(),
  componentName: z.string(),
  calculation: z.string().optional(),
  price: z.number(),
  config: z.record(z.string(), z.any()).optional(),
});

export const proposalsRouter = router({
  // List all proposals
  list: protectedProcedure
    .input(
      z
        .object({
          clientId: z.string().optional(),
          status: proposalStatusEnum.optional(),
          salesStage: salesStageEnum.optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build query with client information
      // Build filter conditions
      const conditions = [eq(proposals.tenantId, tenantId)];

      if (input?.clientId) {
        conditions.push(eq(proposals.clientId, input.clientId));
      }
      if (input?.status) {
        conditions.push(eq(proposals.status, input.status));
      }
      if (input?.salesStage) {
        conditions.push(eq(proposals.salesStage, input.salesStage));
      }
      if (input?.search) {
        conditions.push(
          sql`(
            ${proposals.title} ILIKE ${`%${input.search}%`} OR
            ${proposals.proposalNumber} ILIKE ${`%${input.search}%`}
          )`,
        );
      }

      const proposalsList = await db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          status: proposals.status,
          salesStage: proposals.salesStage,
          pricingModelUsed: proposals.pricingModelUsed,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          signedAt: proposals.signedAt,
          createdAt: proposals.createdAt,
          updatedAt: proposals.updatedAt,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(and(...conditions))
        .orderBy(desc(proposals.createdAt));

      return { proposals: proposalsList };
    }),

  // List proposals grouped by sales stage with aggregated metrics
  listByStage: protectedProcedure
    .input(
      z
        .object({
          stages: z.array(salesStageEnum).optional(),
          assignedToId: z.string().optional(),
          dateFrom: z.string().optional(), // ISO date string
          dateTo: z.string().optional(),
          minValue: z.number().optional(),
          maxValue: z.number().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build base query
      const query = db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          status: proposals.status,
          salesStage: proposals.salesStage,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          validUntil: proposals.validUntil,
          createdAt: proposals.createdAt,
          assignedToId: proposals.assignedToId,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id));

      // Build filter conditions
      const conditions = [eq(proposals.tenantId, tenantId)];

      if (input?.stages && input.stages.length > 0) {
        conditions.push(inArray(proposals.salesStage, input.stages));
      }

      if (input?.assignedToId) {
        conditions.push(eq(proposals.assignedToId, input.assignedToId));
      }

      if (input?.dateFrom) {
        conditions.push(
          sql`${proposals.createdAt} >= ${new Date(input.dateFrom)}`,
        );
      }

      if (input?.dateTo) {
        conditions.push(
          sql`${proposals.createdAt} <= ${new Date(input.dateTo)}`,
        );
      }

      if (input?.minValue !== undefined) {
        conditions.push(
          sql`CAST(${proposals.monthlyTotal} AS DECIMAL) >= ${input.minValue}`,
        );
      }

      if (input?.maxValue !== undefined) {
        conditions.push(
          sql`CAST(${proposals.monthlyTotal} AS DECIMAL) <= ${input.maxValue}`,
        );
      }

      if (input?.search) {
        conditions.push(
          sql`(
            ${proposals.title} ILIKE ${`%${input.search}%`} OR
            ${proposals.proposalNumber} ILIKE ${`%${input.search}%`} OR
            ${clients.name} ILIKE ${`%${input.search}%`}
          )`,
        );
      }

      const allProposals = await query
        .where(and(...conditions))
        .orderBy(desc(proposals.createdAt));

      // Group by stage
      type ProposalType = (typeof allProposals)[number];
      type SalesStage =
        | "enquiry"
        | "qualified"
        | "proposal_sent"
        | "follow_up"
        | "won"
        | "lost"
        | "dormant";

      const proposalsByStage: Record<SalesStage, ProposalType[]> = {
        enquiry: [],
        qualified: [],
        proposal_sent: [],
        follow_up: [],
        won: [],
        lost: [],
        dormant: [],
      };

      for (const proposal of allProposals) {
        const stage = proposal.salesStage as SalesStage;
        if (stage && proposalsByStage[stage]) {
          proposalsByStage[stage].push(proposal);
        }
      }

      // Calculate aggregated metrics per stage
      const stageMetrics = Object.entries(proposalsByStage).map(
        ([stage, stageProposals]) => ({
          stage: stage as SalesStage,
          count: stageProposals.length,
          totalValue: stageProposals.reduce(
            (sum, p) => sum + Number.parseFloat(p.monthlyTotal || "0"),
            0,
          ),
        }),
      );

      return {
        proposalsByStage,
        stageMetrics,
        totalProposals: allProposals.length,
        totalPipelineValue: allProposals.reduce(
          (sum, p) => sum + Number.parseFloat(p.monthlyTotal || "0"),
          0,
        ),
      };
    }),

  // Get proposal by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Get proposal with client information
      const [proposal] = await db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          status: proposals.status,
          salesStage: proposals.salesStage,
          pricingModelUsed: proposals.pricingModelUsed,
          turnover: proposals.turnover,
          industry: proposals.industry,
          monthlyTransactions: proposals.monthlyTransactions,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          notes: proposals.notes,
          termsAndConditions: proposals.termsAndConditions,
          pdfUrl: proposals.pdfUrl,
          signedPdfUrl: proposals.signedPdfUrl,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          signedAt: proposals.signedAt,
          createdAt: proposals.createdAt,
          updatedAt: proposals.updatedAt,
          createdById: proposals.createdById,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Get proposal services
      const services = await db
        .select()
        .from(proposalServices)
        .where(eq(proposalServices.proposalId, id));

      return { ...proposal, services };
    }),

  // Create new proposal
  create: protectedProcedure
    .input(proposalSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Generate proposal number
      const lastProposal = await db
        .select({ proposalNumber: proposals.proposalNumber })
        .from(proposals)
        .where(eq(proposals.tenantId, tenantId))
        .orderBy(desc(proposals.createdAt))
        .limit(1);

      let proposalNumber = "PROP-0001";
      if (lastProposal[0]?.proposalNumber) {
        const lastNum = Number.parseInt(
          lastProposal[0].proposalNumber.split("-")[1],
          10,
        );
        proposalNumber = `PROP-${String(lastNum + 1).padStart(4, "0")}`;
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create proposal
        const [newProposal] = await tx
          .insert(proposals)
          .values({
            tenantId,
            proposalNumber,
            title: input.title,
            clientId: input.clientId,
            status: input.status || "draft",
            pricingModelUsed: input.pricingModelUsed,
            turnover: input.turnover,
            industry: input.industry,
            monthlyTransactions: input.monthlyTransactions,
            monthlyTotal: input.monthlyTotal,
            annualTotal: input.annualTotal,
            notes: input.notes,
            termsAndConditions: input.termsAndConditions,
            validUntil: input.validUntil
              ? new Date(input.validUntil)
              : undefined,
            createdById: userId,
          })
          .returning();

        // Add services if provided
        if (input.services && input.services.length > 0) {
          await tx.insert(proposalServices).values(
            input.services.map((service) => ({
              tenantId,
              proposalId: newProposal.id,
              componentCode: service.componentCode,
              componentName: service.componentName,
              calculation: service.calculation,
              price: String(service.price),
              config: service.config,
            })),
          );
        }

        // Log activity
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: newProposal.id,
          action: "created",
          description: `Created proposal "${input.title}"`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            title: input.title,
            status: input.status || "draft",
            monthlyTotal: input.monthlyTotal,
          },
        });

        return newProposal;
      });

      return { success: true, proposal: result };
    }),

  // Create proposal from lead
  createFromLead: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get lead data
      const [lead] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, input.leadId), eq(leads.tenantId, tenantId)))
        .limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Generate proposal number
      const lastProposal = await db
        .select({ proposalNumber: proposals.proposalNumber })
        .from(proposals)
        .where(eq(proposals.tenantId, tenantId))
        .orderBy(desc(proposals.createdAt))
        .limit(1);

      let proposalNumber = "PROP-0001";
      if (lastProposal[0]?.proposalNumber) {
        const lastNum = Number.parseInt(
          lastProposal[0].proposalNumber.split("-")[1],
          10,
        );
        proposalNumber = `PROP-${String(lastNum + 1).padStart(4, "0")}`;
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create proposal with lead data pre-filled
        const [newProposal] = await tx
          .insert(proposals)
          .values({
            tenantId,
            leadId: input.leadId,
            proposalNumber,
            title: `Proposal for ${lead.companyName || `${lead.firstName} ${lead.lastName}`}`,
            clientId: null, // Will be set when client is created
            status: "draft",
            pricingModelUsed: "model_b", // Default
            turnover: lead.estimatedTurnover || null,
            industry: lead.industry || null,
            monthlyTotal: "0",
            annualTotal: "0",
            createdById: userId,
          })
          .returning();

        // Update lead status to proposal_sent
        await tx
          .update(leads)
          .set({
            status: "proposal_sent",
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.leadId));

        // Log activity for lead
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "lead",
          entityId: input.leadId,
          action: "proposal_created",
          description: `Created proposal ${proposalNumber} from lead`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            proposalId: newProposal.id,
            proposalNumber,
          },
        });

        // Log activity for proposal
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: newProposal.id,
          action: "created",
          description: `Created from lead "${lead.companyName || `${lead.firstName} ${lead.lastName}`}"`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            leadId: input.leadId,
            title: newProposal.title,
            status: "draft",
          },
        });

        return newProposal;
      });

      return { success: true, proposal: result };
    }),

  // Update proposal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: proposalSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(
          and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Check if status is changing and auto-update sales stage if needed
        let autoSalesStage = null;
        if (
          input.data.status &&
          input.data.status !== existingProposal.status
        ) {
          autoSalesStage = getAutoSalesStage(
            input.data.status as
              | "draft"
              | "sent"
              | "viewed"
              | "signed"
              | "rejected"
              | "expired",
            existingProposal.salesStage as
              | "enquiry"
              | "qualified"
              | "proposal_sent"
              | "follow_up"
              | "won"
              | "lost"
              | "dormant",
          );
        }

        // Update proposal (include auto sales stage if applicable)
        const [updatedProposal] = await tx
          .update(proposals)
          .set({
            ...input.data,
            ...(autoSalesStage && { salesStage: autoSalesStage }),
            validUntil: input.data.validUntil
              ? new Date(input.data.validUntil)
              : undefined,
            sentAt: input.data.sentAt ? new Date(input.data.sentAt) : undefined,
            viewedAt: input.data.viewedAt
              ? new Date(input.data.viewedAt)
              : undefined,
            signedAt: input.data.signedAt
              ? new Date(input.data.signedAt)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, input.id))
          .returning();

        // Update services if provided
        if (input.data.services) {
          // Delete existing services
          await tx
            .delete(proposalServices)
            .where(eq(proposalServices.proposalId, input.id));

          // Insert new services
          if (input.data.services.length > 0) {
            await tx.insert(proposalServices).values(
              input.data.services.map((service) => ({
                tenantId,
                proposalId: input.id,
                componentCode: service.componentCode,
                componentName: service.componentName,
                calculation: service.calculation,
                price: String(service.price),
                config: service.config,
              })),
            );
          }
        }

        // Log activity for proposal update
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: input.id,
          action: "updated",
          description: `Updated proposal "${updatedProposal.title}"`,
          userId,
          userName: `${firstName} ${lastName}`,
          oldValues: existingProposal,
          newValues: input.data,
        });

        // Log automation if sales stage was auto-updated
        if (autoSalesStage && input.data.status) {
          await tx.insert(activityLogs).values({
            tenantId,
            entityType: "proposal",
            entityId: input.id,
            action: "sales_stage_automated",
            description: getAutomationReason(
              input.data.status as
                | "draft"
                | "sent"
                | "viewed"
                | "signed"
                | "rejected"
                | "expired",
              autoSalesStage,
            ),
            userId,
            userName: "System",
            oldValues: { salesStage: existingProposal.salesStage },
            newValues: { salesStage: autoSalesStage },
          });
        }

        return updatedProposal;
      });

      return { success: true, proposal: result };
    }),

  // Update sales stage
  updateSalesStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        salesStage: salesStageEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(
          and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      try {
        // Update sales stage
        const [updatedProposal] = await db
          .update(proposals)
          .set({
            salesStage: input.salesStage,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, input.id))
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: input.id,
          action: "sales_stage_updated",
          description: `Updated proposal "${existingProposal.title}" sales stage from ${existingProposal.salesStage} to ${input.salesStage}`,
          userId,
          userName: `${firstName} ${lastName}`,
          oldValues: { salesStage: existingProposal.salesStage },
          newValues: { salesStage: input.salesStage },
        });

        return { success: true, proposal: updatedProposal };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "update_sales_stage" },
          extra: { proposalId: input.id, newStage: input.salesStage },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update sales stage",
        });
      }
    }),

  // Delete/archive proposal
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Archive proposal instead of hard delete
      await db
        .update(proposals)
        .set({
          status: "rejected", // Using rejected as archived status
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, id));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: id,
        action: "archived",
        description: `Archived proposal "${existingProposal.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Send proposal to client
  send: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        validUntil: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check proposal exists and get client information
      const [existingProposal] = await db
        .select({
          id: proposals.id,
          title: proposals.title,
          status: proposals.status,
          clientId: proposals.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          pdfUrl: proposals.pdfUrl,
          proposalNumber: proposals.proposalNumber,
          docusealTemplateId: proposals.docusealTemplateId,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(
          and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Verify client information exists
      if (!existingProposal.clientName || !existingProposal.clientEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Client name and email are required to send proposal",
        });
      }

      // Generate PDF if not already generated
      let pdfUrl = existingProposal.pdfUrl;
      if (!pdfUrl) {
        const result = await generateProposalPdf({
          proposalId: input.id,
          companyName: "Innspired Accountancy",
          preparedBy: "Joseph Stephenson-Mouzo, Managing Director",
        });
        pdfUrl = result.pdfUrl;
      }

      // Create or get DocuSeal template
      let templateId: string = existingProposal.docusealTemplateId || "";

      if (!templateId) {
        try {
          const template = await docusealClient.createTemplate({
            name: `Proposal ${existingProposal.proposalNumber} - ${existingProposal.clientName}`,
            fields: getProposalSignatureFields({
              companyName: existingProposal.clientName || undefined,
              clientName: existingProposal.clientName || undefined,
            }),
          });
          templateId = template.id;
        } catch (error) {
          Sentry.captureException(error, {
            tags: { operation: "create_docuseal_template" },
            extra: {
              proposalId: input.id,
              proposalNumber: existingProposal.proposalNumber,
            },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create signature template",
          });
        }
      }

      // Ensure we have a templateId at this point
      if (!templateId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to obtain template ID",
        });
      }

      // Create DocuSeal submission for signing
      let submissionId: string;
      try {
        const submission = await docusealClient.createSubmission({
          template_id: templateId,
          send_email: false, // We'll send via Resend
          submitters: [
            {
              email: existingProposal.clientEmail,
              name: existingProposal.clientName,
              role: "Client",
            },
          ],
          metadata: {
            proposal_id: input.id,
            proposal_number: existingProposal.proposalNumber,
            tenant_id: tenantId,
          },
        });
        submissionId = submission.id;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "create_docuseal_submission" },
          extra: { proposalId: input.id, templateId },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create signature submission",
        });
      }

      // Update proposal status and DocuSeal IDs
      const [updatedProposal] = await db
        .update(proposals)
        .set({
          status: "sent",
          sentAt: new Date(),
          validUntil: new Date(input.validUntil),
          pdfUrl,
          docusealTemplateId: templateId,
          docusealSubmissionId: submissionId,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, input.id))
        .returning();

      // Send signing invitation email via Resend
      const embeddedSigningUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/sign/${input.id}`;

      try {
        await sendSigningInvitation({
          proposalId: input.id,
          proposalNumber: existingProposal.proposalNumber,
          recipientEmail: existingProposal.clientEmail,
          recipientName: existingProposal.clientName,
          embeddedSigningUrl,
        });
      } catch (emailError) {
        Sentry.captureException(emailError, {
          tags: { operation: "send_signing_invitation_email" },
          extra: {
            proposalId: input.id,
            recipientEmail: existingProposal.clientEmail,
          },
        });
        // Don't fail the mutation if email fails, just log it
        // The proposal is still marked as sent
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: input.id,
        action: "sent",
        description: `Sent proposal "${existingProposal.title}" to ${existingProposal.clientEmail}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          status: "sent",
          sentAt: new Date(),
          pdfUrl,
        },
      });

      return { success: true, proposal: updatedProposal };
    }),

  // Track proposal view
  trackView: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Update viewed timestamp if not already viewed
      if (!existingProposal.viewedAt) {
        await db
          .update(proposals)
          .set({
            viewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, id));
      }

      return { success: true };
    }),

  // Add signature to proposal
  addSignature: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        signerName: z.string(),
        signerEmail: z.string(),
        signatureData: z.string(), // Base64 signature image or DocuSeal signature ID
        ipAddress: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      const signedAt = new Date();

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Add signature record
        const [signature] = await tx
          .insert(proposalSignatures)
          .values({
            tenantId,
            proposalId: input.proposalId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            signatureData: input.signatureData,
            signatureMethod: "canvas",
            auditTrail: {
              signedAt: signedAt.toISOString(),
              signerName: input.signerName,
              signerEmail: input.signerEmail,
              ipAddress: input.ipAddress,
              method: "manual_signature",
            },
            ipAddress: input.ipAddress,
            signedAt,
          })
          .returning();

        // Update proposal status
        await tx
          .update(proposals)
          .set({
            status: "signed",
            signedAt,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, input.proposalId));

        return signature;
      });

      // Send confirmation email to client
      try {
        await sendSignedConfirmationEmail({
          proposalId: input.proposalId,
          signerName: input.signerName,
          signerEmail: input.signerEmail,
          signedAt,
        });
      } catch (emailError) {
        Sentry.captureException(emailError, {
          tags: { operation: "send_client_confirmation_email" },
          extra: {
            proposalId: input.proposalId,
            signerEmail: input.signerEmail,
          },
        });
        // Don't fail the mutation if email fails
      }

      // Send notification to internal team
      try {
        await sendTeamNotificationEmail({
          proposalId: input.proposalId,
          signerName: input.signerName,
          signerEmail: input.signerEmail,
          signedAt,
        });
      } catch (emailError) {
        Sentry.captureException(emailError, {
          tags: { operation: "send_team_notification_email" },
          extra: {
            proposalId: input.proposalId,
            signerEmail: input.signerEmail,
          },
        });
        // Don't fail the mutation if email fails
      }

      return { success: true, signature: result };
    }),

  // Get proposal statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const stats = await db
      .select({
        status: proposals.status,
        count: sql<number>`count(*)::int`,
        totalValue: sql<number>`sum(${proposals.monthlyTotal})::decimal`,
      })
      .from(proposals)
      .where(eq(proposals.tenantId, tenantId))
      .groupBy(proposals.status);

    return { stats };
  }),

  // Generate PDF for proposal
  generatePdf: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: proposalId }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Verify proposal exists and belongs to tenant
      const proposal = await db.query.proposals.findFirst({
        where: and(
          eq(proposals.id, proposalId),
          eq(proposals.tenantId, tenantId),
        ),
      });

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Generate PDF
      const { pdfUrl } = await generateProposalPdf({
        proposalId,
        companyName: "Innspired Accountancy",
        preparedBy: "Joseph Stephenson-Mouzo, Managing Director",
      });

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: proposalId,
        action: "pdf_generated",
        description: `Generated PDF for proposal "${proposal.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          pdfUrl,
        },
      });

      return { success: true, pdfUrl };
    }),

  // PROPOSAL VERSIONING

  // Create a version snapshot of current proposal
  createVersion: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        changeDescription: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get current proposal with services
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Get proposal services
      const services = await db
        .select()
        .from(proposalServices)
        .where(eq(proposalServices.proposalId, input.proposalId));

      // Get user details for version metadata
      const [user] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const createdByName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : `${firstName} ${lastName}`.trim();

      // Create version snapshot
      const [version] = await db
        .insert(proposalVersions)
        .values({
          tenantId,
          proposalId: input.proposalId,
          version: proposal.version || 1,
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
          status: proposal.status,
          turnover: proposal.turnover,
          industry: proposal.industry,
          monthlyTransactions: proposal.monthlyTransactions,
          pricingModelUsed: proposal.pricingModelUsed,
          monthlyTotal: proposal.monthlyTotal,
          annualTotal: proposal.annualTotal,
          services: services.map((s) => ({
            componentCode: s.componentCode,
            componentName: s.componentName,
            calculation: s.calculation,
            price: s.price,
            config: s.config,
          })),
          customTerms: proposal.customTerms,
          termsAndConditions: proposal.termsAndConditions,
          notes: proposal.notes,
          pdfUrl: proposal.pdfUrl,
          changeDescription: input.changeDescription,
          createdById: userId,
          createdByName,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: input.proposalId,
        action: "version_created",
        description: `Created version ${proposal.version || 1} snapshot${input.changeDescription ? `: ${input.changeDescription}` : ""}`,
        userId,
        userName: createdByName,
        newValues: {
          versionId: version.id,
          version: version.version,
        },
      });

      return { success: true, version };
    }),

  // Update proposal with automatic versioning
  updateWithVersion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        changeDescription: z.string().optional(),
        data: proposalSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get current proposal with services
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(
          and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      const currentVersion = existingProposal.version || 1;
      const newVersion = currentVersion + 1;

      // Get current services
      const currentServices = await db
        .select()
        .from(proposalServices)
        .where(eq(proposalServices.proposalId, input.id));

      // Get user details
      const [user] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const createdByName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : `${firstName} ${lastName}`.trim();

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // 1. Create version snapshot of CURRENT state (before update)
        await tx.insert(proposalVersions).values({
          tenantId,
          proposalId: input.id,
          version: currentVersion,
          proposalNumber: existingProposal.proposalNumber,
          title: existingProposal.title,
          status: existingProposal.status,
          turnover: existingProposal.turnover,
          industry: existingProposal.industry,
          monthlyTransactions: existingProposal.monthlyTransactions,
          pricingModelUsed: existingProposal.pricingModelUsed,
          monthlyTotal: existingProposal.monthlyTotal,
          annualTotal: existingProposal.annualTotal,
          services: currentServices.map((s) => ({
            componentCode: s.componentCode,
            componentName: s.componentName,
            calculation: s.calculation,
            price: s.price,
            config: s.config,
          })),
          customTerms: existingProposal.customTerms,
          termsAndConditions: existingProposal.termsAndConditions,
          notes: existingProposal.notes,
          pdfUrl: existingProposal.pdfUrl,
          changeDescription: input.changeDescription || "Proposal updated",
          createdById: userId,
          createdByName,
        });

        // 2. Update proposal with new data
        const [updatedProposal] = await tx
          .update(proposals)
          .set({
            ...input.data,
            version: newVersion,
            validUntil: input.data.validUntil
              ? new Date(input.data.validUntil)
              : undefined,
            sentAt: input.data.sentAt ? new Date(input.data.sentAt) : undefined,
            viewedAt: input.data.viewedAt
              ? new Date(input.data.viewedAt)
              : undefined,
            signedAt: input.data.signedAt
              ? new Date(input.data.signedAt)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, input.id))
          .returning();

        // 3. Update services if provided
        if (input.data.services) {
          // Delete existing services
          await tx
            .delete(proposalServices)
            .where(eq(proposalServices.proposalId, input.id));

          // Insert new services
          if (input.data.services.length > 0) {
            await tx.insert(proposalServices).values(
              input.data.services.map((service) => ({
                tenantId,
                proposalId: input.id,
                componentCode: service.componentCode,
                componentName: service.componentName,
                calculation: service.calculation,
                price: String(service.price),
                config: service.config,
              })),
            );
          }
        }

        // 4. Log activity
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: input.id,
          action: "updated",
          description: `Updated proposal to version ${newVersion}${input.changeDescription ? `: ${input.changeDescription}` : ""}`,
          userId,
          userName: createdByName,
          oldValues: { version: currentVersion },
          newValues: { version: newVersion, ...input.data },
        });

        return updatedProposal;
      });

      // 5. Regenerate PDF if services changed
      if (input.data.services && input.data.services.length > 0) {
        try {
          await generateProposalPdf({
            proposalId: input.id,
            companyName: "Innspired Accountancy",
            preparedBy: "Joseph Stephenson-Mouzo, Managing Director",
          });
        } catch (pdfError) {
          // Log but don't fail the mutation
          Sentry.captureException(pdfError, {
            tags: { operation: "regenerate_proposal_pdf" },
            extra: { proposalId: input.id, version: newVersion },
          });
        }
      }

      return { success: true, proposal: result, newVersion };
    }),

  // Get version history for a proposal
  getVersionHistory: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: proposalId }) => {
      const { tenantId } = ctx.authContext;

      // Verify proposal exists
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(
          and(eq(proposals.id, proposalId), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Get all versions
      const versions = await db
        .select()
        .from(proposalVersions)
        .where(eq(proposalVersions.proposalId, proposalId))
        .orderBy(desc(proposalVersions.version));

      return { versions, currentVersion: proposal.version || 1 };
    }),

  // Get specific version by ID
  getVersionById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: versionId }) => {
      const { tenantId } = ctx.authContext;

      const [version] = await db
        .select()
        .from(proposalVersions)
        .where(
          and(
            eq(proposalVersions.id, versionId),
            eq(proposalVersions.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }

      return { version };
    }),

  // PUBLIC ENDPOINTS FOR E-SIGNATURE

  // Get proposal for signature (public - no auth required)
  getProposalForSignature: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      // RATE LIMITING: 20 req/10s per IP+proposalId
      const headers = await import("next/headers").then((mod) => mod.headers());
      const ip = getClientIp(headers);
      await checkSigningRateLimit(ip, id, {
        maxRequests: 20,
        windowMs: 10000, // 10 seconds
      });

      // Get proposal with client information (no tenant filter for public access)
      const [proposal] = await db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          status: proposals.status,
          pricingModelUsed: proposals.pricingModelUsed,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          notes: proposals.notes,
          termsAndConditions: proposals.termsAndConditions,
          pdfUrl: proposals.pdfUrl,
          docusealSubmissionId: proposals.docusealSubmissionId,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          signedAt: proposals.signedAt,
          tenantId: proposals.tenantId,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(eq(proposals.id, id))
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Don't allow signing if already signed
      if (proposal.status === "signed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This proposal has already been signed",
        });
      }

      // Check if proposal is expired
      if (proposal.validUntil && new Date() > proposal.validUntil) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This proposal has expired",
        });
      }

      // Get proposal services
      const services = await db
        .select()
        .from(proposalServices)
        .where(eq(proposalServices.proposalId, id));

      return { ...proposal, services };
    }),

  // Submit signature (public - no auth required)
  submitSignature: publicProcedure
    .input(
      z.object({
        proposalId: z.string(),
        signerName: z.string(),
        signerEmail: z.string(),
        signatureData: z.string(),
        ipAddress: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // RATE LIMITING: 5 req/10s per IP+proposalId
      const headers = await import("next/headers").then((mod) => mod.headers());
      const ip = getClientIp(headers);
      await checkSigningRateLimit(ip, input.proposalId, {
        maxRequests: 5,
        windowMs: 10000, // 10 seconds
      });

      // Get proposal first (includes tenant ID)
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, input.proposalId))
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Check if already signed
      if (existingProposal.status === "signed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This proposal has already been signed",
        });
      }

      // Check if expired
      if (
        existingProposal.validUntil &&
        new Date() > existingProposal.validUntil
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This proposal has expired",
        });
      }

      const signedAt = new Date();
      const { tenantId } = existingProposal;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Add signature record
        const [signature] = await tx
          .insert(proposalSignatures)
          .values({
            tenantId,
            proposalId: input.proposalId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            signatureData: input.signatureData,
            signatureMethod: "canvas",
            auditTrail: {
              signedAt: signedAt.toISOString(),
              signerName: input.signerName,
              signerEmail: input.signerEmail,
              ipAddress: input.ipAddress,
              method: "manual_signature",
            },
            ipAddress: input.ipAddress,
            signedAt,
          })
          .returning();

        // Update proposal status
        await tx
          .update(proposals)
          .set({
            status: "signed",
            signedAt,
          })
          .where(eq(proposals.id, input.proposalId));

        // Log activity (no userId since this is public)
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "proposal",
          entityId: input.proposalId,
          action: "proposal_signed",
          description: `Proposal signed by ${input.signerName} (${input.signerEmail})`,
          userId: null, // No user ID for public signature
          userName: input.signerName,
          newValues: {
            status: "signed",
            signedAt: signedAt.toISOString(),
            signerName: input.signerName,
            signerEmail: input.signerEmail,
          },
        });

        return signature;
      });

      // Send confirmation emails to client and team
      try {
        await Promise.all([
          sendSignedConfirmationEmail({
            proposalId: input.proposalId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            signedAt,
          }),
          sendTeamNotificationEmail({
            proposalId: input.proposalId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            signedAt,
          }),
        ]);
      } catch (emailError) {
        // Log error but don't fail the signature process
        Sentry.captureException(emailError, {
          tags: { operation: "send_proposal_signed_emails" },
          extra: {
            proposalId: input.proposalId,
            signerEmail: input.signerEmail,
          },
        });
      }

      return { success: true, signature: result };
    }),

  /**
   * Get time-limited presigned URL for signed proposal PDF
   * Used by staff to securely access signed proposals
   */
  getSignedPdfUrl: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().uuid(),
        ttlSeconds: z
          .number()
          .default(48 * 60 * 60)
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { proposalId, ttlSeconds = 48 * 60 * 60 } = input;
      const { tenantId } = ctx.authContext;

      // Verify tenant isolation and proposal exists
      const [proposal] = await db
        .select({ tenantId: proposals.tenantId, status: proposals.status })
        .from(proposals)
        .where(eq(proposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      if (proposal.tenantId !== tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      if (proposal.status !== "signed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Proposal not signed yet",
        });
      }

      // Generate presigned URL
      const presignedUrl = await getProposalSignedPdfUrl(
        proposalId,
        ttlSeconds,
      );

      if (!presignedUrl) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Signed PDF not available",
        });
      }

      return {
        url: presignedUrl,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      };
    }),

  // ==========================================
  // PROPOSAL NOTES PROCEDURES (GAP-003)
  // ==========================================

  createNote: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().uuid(),
        note: z.string().min(1).max(10000),
        isInternal: z.boolean().default(false),
        mentionedUsers: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Verify proposal exists and belongs to tenant
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Create proposal note
      const [proposalNote] = await db
        .insert(proposalNotes)
        .values({
          tenantId,
          proposalId: input.proposalId,
          userId,
          note: input.note,
          isInternal: input.isInternal,
          mentionedUsers: input.mentionedUsers,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: input.proposalId,
        action: "note_added",
        description: `${firstName} ${lastName} added a ${input.isInternal ? "staff-only " : ""}note`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: { noteId: proposalNote.id, isInternal: input.isInternal },
      });

      return proposalNote;
    }),

  getNotes: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify proposal exists and belongs to tenant
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Get notes with author information
      const notes = await db
        .select({
          id: proposalNotes.id,
          note: proposalNotes.note,
          isInternal: proposalNotes.isInternal,
          mentionedUsers: proposalNotes.mentionedUsers,
          createdAt: proposalNotes.createdAt,
          updatedAt: proposalNotes.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(proposalNotes)
        .innerJoin(users, eq(proposalNotes.userId, users.id))
        .where(
          and(
            eq(proposalNotes.tenantId, tenantId),
            eq(proposalNotes.proposalId, input.proposalId),
            sql`${proposalNotes.deletedAt} IS NULL`, // Exclude soft-deleted notes
          ),
        )
        .orderBy(desc(proposalNotes.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return notes;
    }),

  getNoteCount: protectedProcedure
    .input(z.object({ proposalId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const [result] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(proposalNotes)
        .where(
          and(
            eq(proposalNotes.tenantId, tenantId),
            eq(proposalNotes.proposalId, input.proposalId),
            sql`${proposalNotes.deletedAt} IS NULL`,
          ),
        );

      return result.count;
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
        .from(proposalNotes)
        .where(
          and(
            eq(proposalNotes.id, input.noteId),
            eq(proposalNotes.tenantId, tenantId),
          ),
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
          message: "You do not have permission to update this note",
        });
      }

      // Update note
      const [updatedNote] = await db
        .update(proposalNotes)
        .set({ note: input.note, updatedAt: new Date() })
        .where(eq(proposalNotes.id, input.noteId))
        .returning();

      return updatedNote;
    }),

  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, role } = ctx.authContext;

      // Verify note exists and belongs to tenant
      const [existingNote] = await db
        .select()
        .from(proposalNotes)
        .where(
          and(
            eq(proposalNotes.id, input.noteId),
            eq(proposalNotes.tenantId, tenantId),
          ),
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
        .update(proposalNotes)
        .set({ deletedAt: new Date() })
        .where(eq(proposalNotes.id, input.noteId));

      return { success: true };
    }),
});
