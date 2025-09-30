import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  leads,
  onboardingSessions,
  onboardingTasks,
  proposals,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Onboarding task template - 17 standard tasks
const ONBOARDING_TEMPLATE_TASKS = [
  {
    sequence: 10,
    taskName: "Ensure Client is Setup in Bright Manager",
    description:
      "Check client is in Bright Manager with appropriate client information, services and pricing filled in",
    required: true,
    days: 0,
    progressWeight: 5,
  },
  {
    sequence: 20,
    taskName: "Request client ID documents",
    description: "Request passport/driving license and proof of address",
    required: true,
    days: 0,
    progressWeight: 5,
  },
  {
    sequence: 25,
    taskName: "Receive and Save client ID documents",
    description: "Save client ID documents to client AML folder on OneDrive",
    required: true,
    days: 2,
    progressWeight: 5,
  },
  {
    sequence: 30,
    taskName: "Complete AML ID check",
    description:
      "Verify identity documents and complete AML compliance check",
    required: true,
    days: 4,
    progressWeight: 6,
  },
  {
    sequence: 40,
    taskName: "Perform client risk assessment and grading",
    description:
      "Assess client risk factors and determine risk level (Low/Medium/High), also a assign client a grade based off current communication quality",
    required: true,
    days: 4,
    progressWeight: 6,
  },
  {
    sequence: 50,
    taskName: "Send Letter of Engagement",
    description:
      "Send LoE detailing scope of work, from Bright Manager and ensure it is signed",
    required: true,
    days: 4,
    progressWeight: 8,
  },
  {
    sequence: 51,
    taskName: "Assign Client Manager",
    description:
      "Discuss internally to decide which person will take on the new client",
    required: true,
    days: 4,
    progressWeight: 5,
  },
  {
    sequence: 55,
    taskName: "Confirm Signing of LoE",
    description:
      "Confirm the signing of Letter of Engagement before proceeding",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 60,
    taskName: "Request previous accountant clearance",
    description: "Contact previous accountant for professional clearance",
    required: false,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 70,
    taskName: "Request and confirm relevant UTRs",
    description: "Ask client for all applicable UTRs, or register if needed",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 80,
    taskName: "Request Agent Authorisation Codes",
    description: "Obtain codes for HMRC agent services",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 90,
    taskName: "Setup GoCardless Direct Debit",
    description: "Setup client on GoCardless and send DD mandate",
    required: true,
    days: 7,
    progressWeight: 10,
  },
  {
    sequence: 95,
    taskName: "Confirm information received",
    description:
      "Confirm all outstanding information received before proceeding (Professional Clearance, UTRs, Authorisation codes etc)",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 100,
    taskName: "Register for necessary taxes",
    description:
      "Register for applicable taxes (VAT, PAYE, etc.) Check with client manager for which period the taxes should fall under",
    required: false,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 110,
    taskName: "Register for additional HMRC services",
    description:
      "Register for additional services such as Income Tax record, MTD for IT, CIS etc",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 120,
    taskName: "Set up tasks for recurring services",
    description: "Create recurring tasks for ongoing services",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 130,
    taskName: "Change client status to Active",
    description: "Update client status when onboarding is complete",
    required: true,
    days: 10,
    progressWeight: 10,
  },
];

// Generate schema from Drizzle table definition
const insertLeadSchema = createInsertSchema(leads, {
  lastContactedAt: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  convertedAt: z.string().optional(),
});

// Schema for create/update operations
const leadSchema = insertLeadSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    convertedToClientId: true,
    convertedAt: true,
  });

export const leadsRouter = router({
  // List all leads
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
          assignedToId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build query
      let query = db
        .select({
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          email: leads.email,
          phone: leads.phone,
          mobile: leads.mobile,
          companyName: leads.companyName,
          position: leads.position,
          status: leads.status,
          source: leads.source,
          industry: leads.industry,
          estimatedTurnover: leads.estimatedTurnover,
          estimatedEmployees: leads.estimatedEmployees,
          qualificationScore: leads.qualificationScore,
          lastContactedAt: leads.lastContactedAt,
          nextFollowUpAt: leads.nextFollowUpAt,
          assignedToId: leads.assignedToId,
          convertedToClientId: leads.convertedToClientId,
          convertedAt: leads.convertedAt,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
        })
        .from(leads)
        .where(eq(leads.tenantId, tenantId))
        .$dynamic();

      // Apply filters
      if (input?.status) {
        query = query.where(eq(leads.status, input.status));
      }
      if (input?.assignedToId) {
        query = query.where(eq(leads.assignedToId, input.assignedToId));
      }
      if (input?.search) {
        query = query.where(
          or(
            ilike(leads.firstName, `%${input.search}%`),
            ilike(leads.lastName, `%${input.search}%`),
            ilike(leads.email, `%${input.search}%`),
            ilike(leads.companyName, `%${input.search}%`),
          ),
        );
      }

      const leadsList = await query.orderBy(desc(leads.createdAt));

      return { leads: leadsList };
    }),

  // Get lead by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [lead] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
        .limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Get related proposals if any
      const relatedProposals = await db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          status: proposals.status,
          monthlyTotal: proposals.monthlyTotal,
          createdAt: proposals.createdAt,
        })
        .from(proposals)
        .where(
          and(eq(proposals.leadId, id), eq(proposals.tenantId, tenantId)),
        )
        .orderBy(desc(proposals.createdAt));

      // Get converted client if exists
      let convertedClient = null;
      if (lead.convertedToClientId) {
        const [client] = await db
          .select({
            id: clients.id,
            name: clients.name,
            email: clients.email,
            status: clients.status,
          })
          .from(clients)
          .where(eq(clients.id, lead.convertedToClientId))
          .limit(1);
        convertedClient = client || null;
      }

      return {
        ...lead,
        proposals: relatedProposals,
        convertedClient,
      };
    }),

  // Create new lead
  create: protectedProcedure
    .input(leadSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [newLead] = await db
        .insert(leads)
        .values({
          ...input,
          tenantId,
          createdBy: userId,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "lead",
        entityId: newLead.id,
        action: "created",
        description: `Created new lead "${input.firstName} ${input.lastName}" from ${input.companyName || "Unknown Company"}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          name: `${input.firstName} ${input.lastName}`,
          company: input.companyName,
          status: input.status || "new",
        },
      });

      return { success: true, lead: newLead };
    }),

  // Update lead
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: leadSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check lead exists
      const [existingLead] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, input.id), eq(leads.tenantId, tenantId)))
        .limit(1);

      if (!existingLead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Update lead
      const [updatedLead] = await db
        .update(leads)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "lead",
        entityId: input.id,
        action: "updated",
        description: `Updated lead "${updatedLead.firstName} ${updatedLead.lastName}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingLead,
        newValues: input.data,
      });

      return { success: true, lead: updatedLead };
    }),

  // Delete/archive lead (soft delete - mark as lost)
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check lead exists
      const [existingLead] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
        .limit(1);

      if (!existingLead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Mark as lost instead of hard delete
      await db
        .update(leads)
        .set({
          status: "lost",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "lead",
        entityId: id,
        action: "archived",
        description: `Marked lead "${existingLead.firstName} ${existingLead.lastName}" as lost`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Convert lead to client
  convertToClient: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        clientData: z.object({
          clientCode: z.string(),
          type: z.string(),
          registrationNumber: z.string().optional(),
          vatNumber: z.string().optional(),
          incorporationDate: z.string().optional(),
          yearEnd: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get lead
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

      // Check if already converted
      if (lead.convertedToClientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lead has already been converted to a client",
        });
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create client
        const [newClient] = await tx
          .insert(clients)
          .values({
            tenantId,
            clientCode: input.clientData.clientCode,
            name: lead.companyName || `${lead.firstName} ${lead.lastName}`,
            type: input.clientData.type,
            status: "onboarding",
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            registrationNumber: input.clientData.registrationNumber,
            vatNumber: input.clientData.vatNumber,
            incorporationDate: input.clientData.incorporationDate,
            yearEnd: input.clientData.yearEnd,
            addressLine1: input.clientData.addressLine1,
            addressLine2: input.clientData.addressLine2,
            city: input.clientData.city,
            state: input.clientData.state,
            postalCode: input.clientData.postalCode,
            country: input.clientData.country,
            accountManagerId: lead.assignedToId || userId,
            createdBy: userId,
          })
          .returning();

        // Update lead with conversion info
        await tx
          .update(leads)
          .set({
            status: "converted",
            convertedToClientId: newClient.id,
            convertedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.leadId));

        // Update any proposals linked to this lead to also link to new client
        await tx
          .update(proposals)
          .set({
            clientId: newClient.id,
            updatedAt: new Date(),
          })
          .where(eq(proposals.leadId, input.leadId));

        // Log activity for lead
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "lead",
          entityId: input.leadId,
          action: "converted",
          description: `Converted lead "${lead.firstName} ${lead.lastName}" to client`,
          userId,
          userName: `${firstName} ${lastName}`,
        });

        // Log activity for client
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "client",
          entityId: newClient.id,
          action: "created",
          description: `Created client from lead "${lead.firstName} ${lead.lastName}"`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            name: newClient.name,
            status: "onboarding",
            source: "lead_conversion",
          },
        });

        // Create onboarding session for new client
        const startDate = new Date();
        const targetCompletion = new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ); // 14 days from now

        const [onboardingSession] = await tx
          .insert(onboardingSessions)
          .values({
            tenantId,
            clientId: newClient.id,
            startDate,
            targetCompletionDate: targetCompletion,
            assignedToId: newClient.accountManagerId,
            priority: "medium",
            status: "not_started",
            progress: 0,
          })
          .returning();

        // Create all onboarding tasks
        const tasksToInsert = ONBOARDING_TEMPLATE_TASKS.map((template) => ({
          tenantId,
          sessionId: onboardingSession.id,
          taskName: template.taskName,
          description: template.description,
          required: template.required,
          sequence: template.sequence,
          days: template.days,
          progressWeight: template.progressWeight,
          assignedToId: newClient.accountManagerId,
          dueDate: new Date(
            startDate.getTime() + template.days * 24 * 60 * 60 * 1000,
          ),
          done: false,
        }));

        await tx.insert(onboardingTasks).values(tasksToInsert);

        return { lead, client: newClient };
      });

      return {
        success: true,
        client: result.client,
        lead: result.lead,
      };
    }),

  // Get lead statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const stats = await db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
        avgQualificationScore: sql<number>`avg(${leads.qualificationScore})::decimal`,
      })
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .groupBy(leads.status);

    return { stats };
  }),
});
