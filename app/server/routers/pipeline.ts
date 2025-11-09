import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { PipelineStage } from "@/lib/constants/pipeline-stages";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  leads,
  proposals,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Deal type returned by getDeals
export type Deal = {
  id: string;
  type: "lead" | "proposal";
  stage: PipelineStage;
  title: string;
  companyName: string | null;
  contactName: string;
  email: string;
  phone: string | null;
  value: string | null; // Monthly total for proposals, estimated turnover for leads
  qualificationScore: number | null;
  assignedToId: string | null;
  assignedToName: string | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const pipelineStageEnum = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "converted",
  "lost",
]);

export const pipelineRouter = router({
  /**
   * Get all deals (leads + proposals) organized by stage for Kanban board
   */
  getDeals: protectedProcedure
    .input(
      z.object({
        assignedToId: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(), // ISO date string
        dateTo: z.string().optional(), // ISO date string
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build filter conditions
      const filters = [eq(leads.tenantId, tenantId)];
      if (input.assignedToId) {
        filters.push(eq(leads.assignedToId, input.assignedToId));
      }

      // Query leads
      const leadsData = await db
        .select({
          id: leads.id,
          status: leads.status,
          firstName: leads.firstName,
          lastName: leads.lastName,
          email: leads.email,
          phone: leads.phone,
          companyName: leads.companyName,
          estimatedTurnover: leads.estimatedTurnover,
          qualificationScore: leads.qualificationScore,
          assignedToId: leads.assignedToId,
          lastContactedAt: leads.lastContactedAt,
          nextFollowUpAt: leads.nextFollowUpAt,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
          assignedToFirstName: users.firstName,
          assignedToLastName: users.lastName,
        })
        .from(leads)
        .leftJoin(users, eq(leads.assignedToId, users.id))
        .where(and(...filters))
        .orderBy(desc(leads.createdAt));

      // Query proposals (with lead and client data)
      const proposalsFilters = [eq(proposals.tenantId, tenantId)];

      const proposalsData = await db
        .select({
          id: proposals.id,
          status: proposals.status,
          title: proposals.title,
          proposalNumber: proposals.proposalNumber,
          monthlyTotal: proposals.monthlyTotal,
          leadId: proposals.leadId,
          clientId: proposals.clientId,
          createdAt: proposals.createdAt,
          updatedAt: proposals.updatedAt,
          // Lead data
          leadFirstName: leads.firstName,
          leadLastName: leads.lastName,
          leadEmail: leads.email,
          leadPhone: leads.phone,
          leadCompanyName: leads.companyName,
          leadAssignedToId: leads.assignedToId,
          leadQualificationScore: leads.qualificationScore,
          // Client data (if converted)
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          // Assigned user
          assignedToFirstName: users.firstName,
          assignedToLastName: users.lastName,
        })
        .from(proposals)
        .leftJoin(leads, eq(proposals.leadId, leads.id))
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .leftJoin(users, eq(leads.assignedToId, users.id))
        .where(and(...proposalsFilters))
        .orderBy(desc(proposals.createdAt));

      // Transform leads to Deal format
      const leadDeals: Deal[] = leadsData.map((lead) => ({
        id: lead.id,
        type: "lead" as const,
        stage: lead.status as PipelineStage,
        title: `${lead.firstName} ${lead.lastName}`,
        companyName: lead.companyName,
        contactName: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        value: lead.estimatedTurnover,
        qualificationScore: lead.qualificationScore,
        assignedToId: lead.assignedToId,
        assignedToName:
          lead.assignedToFirstName && lead.assignedToLastName
            ? `${lead.assignedToFirstName} ${lead.assignedToLastName}`
            : null,
        lastContactedAt: lead.lastContactedAt,
        nextFollowUpAt: lead.nextFollowUpAt,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      }));

      // Transform proposals to Deal format
      const proposalDeals: Deal[] = proposalsData.map((proposal) => {
        // Determine contact info (from lead or client)
        const contactName =
          proposal.leadFirstName && proposal.leadLastName
            ? `${proposal.leadFirstName} ${proposal.leadLastName}`
            : proposal.clientName || "Unknown";
        const email = proposal.leadEmail || proposal.clientEmail || "";
        const phone = proposal.leadPhone || proposal.clientPhone;
        const companyName = proposal.leadCompanyName || proposal.clientName;

        // Map proposal status to pipeline stage
        let stage: PipelineStage;
        switch (proposal.status) {
          case "draft":
            stage = "proposal_sent";
            break;
          case "sent":
            stage = "proposal_sent";
            break;
          case "viewed":
            stage = "proposal_sent";
            break;
          case "signed":
            stage = "converted";
            break;
          case "rejected":
            stage = "lost";
            break;
          case "expired":
            stage = "lost";
            break;
          default:
            stage = "proposal_sent";
        }

        return {
          id: proposal.id,
          type: "proposal" as const,
          stage,
          title: proposal.title,
          companyName,
          contactName,
          email,
          phone,
          value: proposal.monthlyTotal,
          qualificationScore: proposal.leadQualificationScore,
          assignedToId: proposal.leadAssignedToId,
          assignedToName:
            proposal.assignedToFirstName && proposal.assignedToLastName
              ? `${proposal.assignedToFirstName} ${proposal.assignedToLastName}`
              : null,
          lastContactedAt: null,
          nextFollowUpAt: null,
          createdAt: proposal.createdAt,
          updatedAt: proposal.updatedAt,
        };
      });

      // Combine and apply filters
      let allDeals = [...leadDeals, ...proposalDeals];

      // Search filter
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        allDeals = allDeals.filter(
          (deal) =>
            deal.title.toLowerCase().includes(searchLower) ||
            deal.email.toLowerCase().includes(searchLower) ||
            deal.companyName?.toLowerCase().includes(searchLower),
        );
      }

      // Date range filter
      if (input.dateFrom) {
        const fromDate = new Date(input.dateFrom);
        allDeals = allDeals.filter((deal) => deal.createdAt >= fromDate);
      }
      if (input.dateTo) {
        const toDate = new Date(input.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        allDeals = allDeals.filter((deal) => deal.createdAt <= toDate);
      }

      // Value range filter
      if (input.minValue !== undefined) {
        const minValue = input.minValue;
        allDeals = allDeals.filter((deal) => {
          const value = Number.parseFloat(deal.value || "0");
          return value >= minValue;
        });
      }
      if (input.maxValue !== undefined) {
        const maxValue = input.maxValue;
        allDeals = allDeals.filter((deal) => {
          const value = Number.parseFloat(deal.value || "0");
          return value <= maxValue;
        });
      }

      // Group by stage
      const dealsByStage: Record<PipelineStage, Deal[]> = {
        new: [],
        contacted: [],
        qualified: [],
        proposal_sent: [],
        negotiating: [],
        converted: [],
        lost: [],
      };

      for (const deal of allDeals) {
        dealsByStage[deal.stage].push(deal);
      }

      return {
        dealsByStage,
        totalDeals: allDeals.length,
        totalValue: allDeals.reduce((sum, deal) => {
          const value = Number.parseFloat(deal.value || "0");
          return sum + value;
        }, 0),
      };
    }),

  /**
   * Update the stage of a deal (lead or proposal)
   */
  updateStage: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        dealType: z.enum(["lead", "proposal"]),
        newStage: pipelineStageEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      if (input.dealType === "lead") {
        // Update lead status
        const [existingLead] = await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, input.dealId), eq(leads.tenantId, tenantId)))
          .limit(1);

        if (!existingLead) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const [updatedLead] = await db
          .update(leads)
          .set({
            status: input.newStage,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.dealId))
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          module: "client-hub",
          entityType: "lead",
          entityId: input.dealId,
          action: "stage_changed",
          description: `Moved lead "${existingLead.firstName} ${existingLead.lastName}" from ${existingLead.status} to ${input.newStage}`,
          userId,
          userName: `${firstName} ${lastName}`,
          oldValues: { status: existingLead.status },
          newValues: { status: input.newStage },
        });

        return { success: true, deal: updatedLead };
      }

      // Update proposal status
      const [existingProposal] = await db
        .select()
        .from(proposals)
        .where(
          and(eq(proposals.id, input.dealId), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingProposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      // Map pipeline stage back to proposal status
      let proposalStatus:
        | "draft"
        | "sent"
        | "viewed"
        | "signed"
        | "rejected"
        | "expired";
      switch (input.newStage) {
        case "proposal_sent":
          proposalStatus = "sent";
          break;
        case "converted":
          proposalStatus = "signed";
          break;
        case "lost":
          proposalStatus = "rejected";
          break;
        default:
          proposalStatus = "sent";
      }

      const [updatedProposal] = await db
        .update(proposals)
        .set({
          status: proposalStatus,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, input.dealId))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        module: "client-hub",
        entityType: "proposal",
        entityId: input.dealId,
        action: "stage_changed",
        description: `Moved proposal "${existingProposal.title}" from ${existingProposal.status} to ${proposalStatus}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: { status: existingProposal.status },
        newValues: { status: proposalStatus },
      });

      return { success: true, deal: updatedProposal };
    }),
});
