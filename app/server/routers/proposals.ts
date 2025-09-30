import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  proposals,
  proposalServices,
  proposalSignatures,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

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
          config: z.record(z.any()).optional(),
        }),
      )
      .optional(),
  });

const proposalServiceSchema = z.object({
  componentCode: z.string(),
  componentName: z.string(),
  calculation: z.string().optional(),
  price: z.number(),
  config: z.record(z.any()).optional(),
});

export const proposalsRouter = router({
  // List all proposals
  list: protectedProcedure
    .input(
      z
        .object({
          clientId: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build query with client information
      let query = db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          status: proposals.status,
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
        .where(eq(proposals.tenantId, tenantId))
        .$dynamic();

      // Apply filters
      if (input?.clientId) {
        query = query.where(eq(proposals.clientId, input.clientId));
      }
      if (input?.status) {
        query = query.where(eq(proposals.status, input.status));
      }
      if (input?.search) {
        query = query.where(
          sql`(
            ${proposals.title} ILIKE ${`%${input.search}%`} OR
            ${proposals.proposalNumber} ILIKE ${`%${input.search}%`}
          )`,
        );
      }

      const proposalsList = await query.orderBy(desc(proposals.createdAt));

      return { proposals: proposalsList };
    }),

  // Get proposal by ID
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input: id }) => {
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
        const lastNum = Number.parseInt(lastProposal[0].proposalNumber.split("-")[1]);
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
            validUntil: input.validUntil,
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
        .where(and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)))
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Update proposal
        const [updatedProposal] = await tx
          .update(proposals)
          .set({
            ...input.data,
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

        // Log activity
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

        return updatedProposal;
      });

      return { success: true, proposal: result };
    }),

  // Delete/archive proposal
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input: id }) => {
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
        status: "archived",
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

      // Check proposal exists
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)))
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Update proposal status
      const [updatedProposal] = await db
        .update(proposals)
        .set({
          status: "sent",
          sentAt: new Date(),
          validUntil: new Date(input.validUntil),
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, input.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "proposal",
        entityId: input.id,
        action: "sent",
        description: `Sent proposal "${existingProposal.title}" to client`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      // TODO: Send email notification to client
      // TODO: Generate PDF if not already generated

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
          and(eq(proposals.id, input.proposalId), eq(proposals.tenantId, tenantId)),
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
        // Add signature record
        const [signature] = await tx
          .insert(proposalSignatures)
          .values({
            tenantId,
            proposalId: input.proposalId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            signatureData: input.signatureData,
            ipAddress: input.ipAddress,
            signedAt: new Date(),
          })
          .returning();

        // Update proposal status
        await tx
          .update(proposals)
          .set({
            status: "signed",
            signedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, input.proposalId));

        return signature;
      });

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
});
