import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clients,
  clientPortalAccess,
  proposals,
  proposalServices,
  invoices,
  documents,
  users,
} from "@/lib/db/schema";
import { docusealClient } from "@/lib/docuseal/client";
import { clientPortalProcedure, router } from "../trpc";

export const clientPortalRouter = router({
  // Get all clients current portal user has access to
  getMyClients: clientPortalProcedure.query(async ({ ctx }) => {
    const { portalUserId, tenantId } = ctx.clientPortalAuthContext;

    const clientAccessList = await db
      .select({
        clientId: clientPortalAccess.clientId,
        clientName: clients.name,
        role: clientPortalAccess.role,
        isActive: clientPortalAccess.isActive,
      })
      .from(clientPortalAccess)
      .innerJoin(clients, eq(clientPortalAccess.clientId, clients.id))
      .where(
        and(
          eq(clientPortalAccess.portalUserId, portalUserId),
          eq(clientPortalAccess.tenantId, tenantId),
          eq(clientPortalAccess.isActive, true),
        ),
      );

    return clientAccessList;
  }),

  // Get proposals for selected client
  getProposals: clientPortalProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        status: z.enum(["sent", "viewed", "signed", "expired"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      // Verify user has access to this client
      const hasAccess = clientAccess.find((c) => c.clientId === input.clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this client",
        });
      }

      // Only show sent, viewed, signed, or expired proposals (not drafts)
      let query = db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          status: proposals.status,
          pricingModelUsed: proposals.pricingModelUsed,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          signedAt: proposals.signedAt,
          docusealSignedPdfUrl: proposals.docusealSignedPdfUrl,
          createdAt: proposals.createdAt,
        })
        .from(proposals)
        .where(
          and(
            eq(proposals.tenantId, tenantId),
            eq(proposals.clientId, input.clientId),
          ),
        )
        .$dynamic();

      // Filter by status if provided
      if (input.status) {
        query = query.where(eq(proposals.status, input.status));
      }

      const results = await query;

      // Filter out drafts on the client side as extra safety
      return results.filter((p) => p.status !== "draft");
    }),

  // Get proposal by ID
  getProposalById: clientPortalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      const proposal = await db
        .select({
          id: proposals.id,
          proposalNumber: proposals.proposalNumber,
          title: proposals.title,
          clientId: proposals.clientId,
          clientName: clients.name,
          status: proposals.status,
          pricingModelUsed: proposals.pricingModelUsed,
          turnover: proposals.turnover,
          industry: proposals.industry,
          monthlyTotal: proposals.monthlyTotal,
          annualTotal: proposals.annualTotal,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          signedAt: proposals.signedAt,
          docusealSubmissionId: proposals.docusealSubmissionId,
          docusealSignedPdfUrl: proposals.docusealSignedPdfUrl,
          notes: proposals.notes,
          createdAt: proposals.createdAt,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(
          and(eq(proposals.id, input.id), eq(proposals.tenantId, tenantId)),
        )
        .limit(1);

      if (proposal.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      // Verify user has access to this proposal's client
      if (!proposal[0].clientId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This proposal is not assigned to a client",
        });
      }

      const hasAccess = clientAccess.find((c) => c.clientId === proposal[0].clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this proposal",
        });
      }

      // Don't show draft proposals
      if (proposal[0].status === "draft") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This proposal is not yet available",
        });
      }

      // Get proposal services
      const services = await db
        .select({
          id: proposalServices.id,
          name: proposalServices.componentName,
          code: proposalServices.componentCode,
          calculation: proposalServices.calculation,
          price: proposalServices.price,
        })
        .from(proposalServices)
        .where(eq(proposalServices.proposalId, proposal[0].id))
        .orderBy(proposalServices.sortOrder);

      return { ...proposal[0], services };
    }),

  // Get invoices for selected client
  getInvoices: clientPortalProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        status: z.enum(["sent", "paid", "overdue", "cancelled"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      // Verify user has access to this client
      const hasAccess = clientAccess.find((c) => c.clientId === input.clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this client",
        });
      }

      // Only show sent or paid invoices (not drafts)
      let query = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          paidDate: invoices.paidDate,
          subtotal: invoices.subtotal,
          taxAmount: invoices.taxAmount,
          total: invoices.total,
          amountPaid: invoices.amountPaid,
          status: invoices.status,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.tenantId, tenantId),
            eq(invoices.clientId, input.clientId),
          ),
        )
        .$dynamic();

      // Filter by status if provided
      if (input.status) {
        query = query.where(eq(invoices.status, input.status));
      }

      const results = await query;

      // Filter out drafts on the client side as extra safety
      return results.filter((inv) => inv.status !== "draft");
    }),

  // Get invoice by ID
  getInvoiceById: clientPortalProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      const invoice = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          clientId: invoices.clientId,
          clientName: clients.name,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          paidDate: invoices.paidDate,
          subtotal: invoices.subtotal,
          taxRate: invoices.taxRate,
          taxAmount: invoices.taxAmount,
          discount: invoices.discount,
          total: invoices.total,
          amountPaid: invoices.amountPaid,
          status: invoices.status,
          currency: invoices.currency,
          notes: invoices.notes,
          terms: invoices.terms,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(
          and(eq(invoices.id, input.id), eq(invoices.tenantId, tenantId)),
        )
        .limit(1);

      if (invoice.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      // Verify user has access to this invoice's client
      const hasAccess = clientAccess.find((c) => c.clientId === invoice[0].clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this invoice",
        });
      }

      // Don't show draft invoices
      if (invoice[0].status === "draft") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invoice is not yet available",
        });
      }

      return invoice[0];
    }),

  // Get documents for selected client
  getDocuments: clientPortalProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      // Verify user has access to this client
      const hasAccess = clientAccess.find((c) => c.clientId === input.clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this client",
        });
      }

      const documentsList = await db
        .select({
          id: documents.id,
          name: documents.name,
          type: documents.type,
          url: documents.url,
          size: documents.size,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(documents.clientId, input.clientId),
          ),
        )
        .orderBy(documents.createdAt);

      return documentsList;
    }),

  // Get documents requiring signature for selected client
  getDocumentsToSign: clientPortalProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      // Verify user has access to this client
      const hasAccess = clientAccess.find((c) => c.clientId === input.clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this client",
        });
      }

      // Get documents requiring signature
      const results = await db
        .select({
          id: documents.id,
          name: documents.name,
          description: documents.description,
          size: documents.size,
          mimeType: documents.mimeType,
          url: documents.url,
          requiresSignature: documents.requiresSignature,
          signatureStatus: documents.signatureStatus,
          docusealSubmissionId: documents.docusealSubmissionId,
          createdAt: documents.createdAt,
          uploadedBy: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedById, users.id))
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(documents.clientId, input.clientId),
            eq(documents.requiresSignature, true),
            eq(documents.signatureStatus, "pending"),
          ),
        )
        .orderBy(documents.createdAt);

      // Get client details for signing URL
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.clientId))
        .limit(1);

      // Add signing URLs to results
      return results.map((doc) => ({
        ...doc,
        signingUrl: doc.docusealSubmissionId
          ? docusealClient.getEmbedUrl(doc.docusealSubmissionId, client?.email || "")
          : null,
      }));
    }),

  // Get signed documents for selected client
  getSignedDocuments: clientPortalProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { portalUserId, tenantId, clientAccess } = ctx.clientPortalAuthContext;

      // Verify user has access to this client
      const hasAccess = clientAccess.find((c) => c.clientId === input.clientId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this client",
        });
      }

      // Get signed documents
      const results = await db
        .select({
          id: documents.id,
          name: documents.name,
          description: documents.description,
          size: documents.size,
          mimeType: documents.mimeType,
          signedPdfUrl: documents.signedPdfUrl,
          signedAt: documents.signedAt,
          signedBy: documents.signedBy,
          createdAt: documents.createdAt,
          uploadedBy: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedById, users.id))
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(documents.clientId, input.clientId),
            eq(documents.requiresSignature, true),
            eq(documents.signatureStatus, "signed"),
          ),
        )
        .orderBy(documents.signedAt);

      return results;
    }),
});
