import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, clients, invoiceItems, invoices } from "@/lib/db/schema";
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice-pdf";
import { protectedProcedure, router } from "../trpc";

// Status enum for filtering
const _invoiceStatusEnum = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

// Generate schemas from Drizzle table definitions
const insertInvoiceItemSchema = createInsertSchema(invoiceItems);
const insertInvoiceSchema = createInsertSchema(invoices, {
  issueDate: z.string(),
  dueDate: z.string(),
  paidDate: z.string().optional(),
});

// Schema for invoice items
const invoiceItemSchema = insertInvoiceItemSchema.omit({
  id: true,
  invoiceId: true,
  createdAt: true,
});

// Schema for create/update operations (omit auto-generated fields)
const invoiceSchema = insertInvoiceSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
  })
  .extend({
    items: z.array(invoiceItemSchema).optional(),
  });

export const invoicesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .union([
            z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
            z.literal("all"),
          ])
          .optional(),
        clientId: z.string().optional(),
        overdue: z.boolean().optional(),
        sortBy: z
          .enum([
            "invoiceNumber",
            "clientId",
            "issueDate",
            "dueDate",
            "total",
            "status",
          ])
          .optional(),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, status, clientId, overdue, sortBy, sortOrder } = input;

      // Build base query
      const conditions = [eq(invoices.tenantId, tenantId)];

      if (search) {
        conditions.push(ilike(invoices.invoiceNumber, `%${search}%`));
      }

      if (status && status !== "all") {
        conditions.push(eq(invoices.status, status));
      }

      if (clientId) {
        conditions.push(eq(invoices.clientId, clientId));
      }

      if (overdue) {
        const overdueCondition = and(
          eq(invoices.status, "sent"),
          sql`${invoices.dueDate} < CURRENT_DATE`,
        );
        if (overdueCondition) conditions.push(overdueCondition);
      }

      // Build orderBy based on sortBy and sortOrder
      const orderByArray = [];
      const sortDirection = sortOrder === "desc" ? desc : asc;

      if (sortBy) {
        switch (sortBy) {
          case "invoiceNumber":
            orderByArray.push(sortDirection(invoices.invoiceNumber));
            break;
          case "clientId":
            orderByArray.push(sortDirection(invoices.clientId));
            break;
          case "issueDate":
            orderByArray.push(sortDirection(invoices.issueDate));
            break;
          case "dueDate":
            orderByArray.push(sortDirection(invoices.dueDate));
            break;
          case "total":
            orderByArray.push(sortDirection(invoices.total));
            break;
          case "status":
            orderByArray.push(sortDirection(invoices.status));
            break;
        }
      } else {
        // Default sorting by created date (newest first)
        orderByArray.push(desc(invoices.createdAt));
      }

      const invoicesList = await db
        .select({
          id: invoices.id,
          tenantId: invoices.tenantId,
          invoiceNumber: invoices.invoiceNumber,
          clientId: invoices.clientId,
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
          purchaseOrderNumber: invoices.purchaseOrderNumber,
          metadata: invoices.metadata,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          createdById: invoices.createdById,
        })
        .from(invoices)
        .where(and(...conditions))
        .orderBy(...orderByArray);

      return { invoices: invoicesList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [invoice] = await db
        .select({
          id: invoices.id,
          tenantId: invoices.tenantId,
          invoiceNumber: invoices.invoiceNumber,
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
          purchaseOrderNumber: invoices.purchaseOrderNumber,
          createdAt: invoices.createdAt,
          clientId: invoices.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
        })
        .from(invoices)
        .innerJoin(clients, eq(invoices.clientId, clients.id))
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Get invoice items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      return { ...invoice, items };
    }),

  create: protectedProcedure
    .input(invoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start a transaction
      const result = await db.transaction(async (tx) => {
        // Create the invoice
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            tenantId,
            invoiceNumber: input.invoiceNumber,
            clientId: input.clientId,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            paidDate: input.paidDate,
            status: input.status,
            subtotal: input.subtotal,
            taxRate: input.taxRate,
            taxAmount: input.taxAmount,
            discount: input.discount,
            total: input.total,
            amountPaid: input.amountPaid,
            currency: input.currency,
            notes: input.notes,
            terms: input.terms,
            purchaseOrderNumber: input.purchaseOrderNumber,
            metadata: input.metadata,
            createdById: userId,
          })
          .returning();

        // Add invoice items if provided
        if (input.items && input.items.length > 0) {
          await tx.insert(invoiceItems).values(
            input.items.map((item) => ({
              invoiceId: newInvoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            })),
          );
        }

        // Log the activity
        await tx.insert(activityLogs).values({
          tenantId,
          module: "practice-hub",
          entityType: "invoice",
          entityId: newInvoice.id,
          action: "created",
          description: `Created invoice ${input.invoiceNumber}`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            invoiceNumber: input.invoiceNumber,
            total: input.total,
          },
        });

        return newInvoice;
      });

      return { success: true, invoice: result };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: invoiceSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check invoice exists and belongs to tenant
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.tenantId, tenantId)))
        .limit(1);

      if (!existingInvoice[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Update invoice
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        module: "practice-hub",
        entityType: "invoice",
        entityId: input.id,
        action: "updated",
        description: `Updated invoice ${updatedInvoice.invoiceNumber}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingInvoice[0],
        newValues: input.data,
      });

      return { success: true, invoice: updatedInvoice };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check invoice exists and belongs to tenant
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.tenantId, tenantId)))
        .limit(1);

      if (!existingInvoice[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Update invoice status
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        module: "practice-hub",
        entityType: "invoice",
        entityId: input.id,
        action: "updated",
        description: `Updated invoice ${updatedInvoice.invoiceNumber} status`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingInvoice[0],
        newValues: { status: input.status },
      });

      return { success: true, invoice: updatedInvoice };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check invoice exists and belongs to tenant
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
        .limit(1);

      if (!existingInvoice[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Delete invoice items first
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // Delete the invoice
      await db.delete(invoices).where(eq(invoices.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        module: "practice-hub",
        entityType: "invoice",
        entityId: id,
        action: "deleted",
        description: `Deleted invoice ${existingInvoice[0].invoiceNumber}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // BULK OPERATIONS

  // Bulk update status for multiple invoices
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        invoiceIds: z
          .array(z.string())
          .min(1, "At least one invoice ID required"),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all invoices exist and belong to tenant
        const existingInvoices = await tx
          .select()
          .from(invoices)
          .where(
            and(
              inArray(invoices.id, input.invoiceIds),
              eq(invoices.tenantId, tenantId),
            ),
          );

        if (existingInvoices.length !== input.invoiceIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more invoices not found",
          });
        }

        // Update all invoices
        const updatedInvoices = await tx
          .update(invoices)
          .set({
            status: input.status,
            paidDate: input.status === "paid" ? sql`CURRENT_DATE` : undefined,
            updatedAt: new Date(),
          })
          .where(inArray(invoices.id, input.invoiceIds))
          .returning();

        // Log activity for each invoice
        for (const invoice of updatedInvoices) {
          await tx.insert(activityLogs).values({
            tenantId,
            module: "practice-hub",
            entityType: "invoice",
            entityId: invoice.id,
            action: "bulk_status_update",
            description: `Bulk updated invoice status to ${input.status}`,
            userId,
            userName: `${firstName} ${lastName}`,
            newValues: { status: input.status },
          });
        }

        return { count: updatedInvoices.length, invoices: updatedInvoices };
      });

      return { success: true, ...result };
    }),

  // Bulk send email reminders for multiple invoices
  bulkSendEmails: protectedProcedure
    .input(
      z.object({
        invoiceIds: z
          .array(z.string())
          .min(1, "At least one invoice ID required"),
        emailType: z.enum(["reminder", "overdue", "thank_you"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all invoices exist and belong to tenant
        const existingInvoices = await tx
          .select({
            invoice: invoices,
            client: clients,
          })
          .from(invoices)
          .innerJoin(clients, eq(invoices.clientId, clients.id))
          .where(
            and(
              inArray(invoices.id, input.invoiceIds),
              eq(invoices.tenantId, tenantId),
            ),
          );

        if (existingInvoices.length !== input.invoiceIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more invoices not found",
          });
        }

        // Track progress
        const emailsSent: string[] = [];
        const emailsFailed: string[] = [];

        // Send emails (would integrate with actual email service)
        for (const { invoice, client } of existingInvoices) {
          try {
            // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
            // await emailService.send({
            //   to: client.email,
            //   subject: `Invoice ${invoice.invoiceNumber} Reminder`,
            //   template: input.emailType || 'reminder',
            //   data: { invoice, client }
            // });

            emailsSent.push(invoice.id);

            // Log activity
            await tx.insert(activityLogs).values({
              tenantId,
              module: "practice-hub",
              entityType: "invoice",
              entityId: invoice.id,
              action: "bulk_email_sent",
              description: `Bulk sent ${input.emailType || "reminder"} email for invoice ${invoice.invoiceNumber}`,
              userId,
              userName: `${firstName} ${lastName}`,
              metadata: {
                emailType: input.emailType || "reminder",
                recipientEmail: client.email,
              },
            });
          } catch (error) {
            emailsFailed.push(invoice.id);
            // Log failure
            await tx.insert(activityLogs).values({
              tenantId,
              module: "practice-hub",
              entityType: "invoice",
              entityId: invoice.id,
              action: "bulk_email_failed",
              description: `Failed to send email for invoice ${invoice.invoiceNumber}`,
              userId,
              userName: `${firstName} ${lastName}`,
              metadata: {
                error: error instanceof Error ? error.message : "Unknown error",
              },
            });
          }
        }

        return {
          count: emailsSent.length,
          sent: emailsSent.length,
          failed: emailsFailed.length,
          failedIds: emailsFailed,
        };
      });

      return { success: true, ...result };
    }),

  // Bulk delete multiple invoices
  bulkDelete: protectedProcedure
    .input(
      z.object({
        invoiceIds: z
          .array(z.string())
          .min(1, "At least one invoice ID required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Verify all invoices exist and belong to tenant
        const existingInvoices = await tx
          .select()
          .from(invoices)
          .where(
            and(
              inArray(invoices.id, input.invoiceIds),
              eq(invoices.tenantId, tenantId),
            ),
          );

        if (existingInvoices.length !== input.invoiceIds.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more invoices not found",
          });
        }

        // Log activity for each invoice before deletion
        for (const invoice of existingInvoices) {
          await tx.insert(activityLogs).values({
            tenantId,
            module: "practice-hub",
            entityType: "invoice",
            entityId: invoice.id,
            action: "bulk_delete",
            description: `Bulk deleted invoice ${invoice.invoiceNumber}`,
            userId,
            userName: `${firstName} ${lastName}`,
          });
        }

        // Delete invoice items first (cascade)
        await tx
          .delete(invoiceItems)
          .where(inArray(invoiceItems.invoiceId, input.invoiceIds));

        // Delete all invoices
        await tx.delete(invoices).where(inArray(invoices.id, input.invoiceIds));

        return { count: existingInvoices.length };
      });

      return { success: true, ...result };
    }),

  // Generate PDF for an invoice
  generatePdf: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: invoiceId }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Verify invoice exists and belongs to tenant
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)),
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Generate PDF
      const { pdfUrl } = await generateInvoicePdf({
        invoiceId,
        companyName: "Innspired Accountancy",
        companyAddress: "123 Business Street, London, UK",
        companyEmail: "accounts@innspired.co.uk",
        companyPhone: "+44 20 1234 5678",
      });

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        module: "practice-hub",
        entityType: "invoice",
        entityId: invoiceId,
        action: "pdf_generated",
        description: `Generated PDF for invoice #${invoice.invoiceNumber}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          pdfUrl,
        },
      });

      return { success: true, pdfUrl };
    }),
});
