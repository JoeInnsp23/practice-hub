import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { invoices, invoiceItems, activityLogs } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  rate: z.number(),
  amount: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  clientId: z.string(),
  serviceId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"]),
  subtotal: z.number(),
  taxRate: z.number().optional(),
  taxAmount: z.number().optional(),
  discountAmount: z.number().optional(),
  totalAmount: z.number(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export const invoicesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      clientId: z.string().optional(),
      overdue: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, status, clientId, overdue } = input;

      // Build base query
      let conditions = [eq(invoices.tenantId, tenantId)];

      if (search) {
        conditions.push(
          or(
            ilike(invoices.invoiceNumber, `%${search}%`)
          )!
        );
      }

      if (status && status !== "all") {
        conditions.push(eq(invoices.status, status as any));
      }

      if (clientId) {
        conditions.push(eq(invoices.clientId, clientId));
      }

      if (overdue) {
        conditions.push(
          and(
            eq(invoices.status, "sent"),
            sql`${invoices.dueDate} < CURRENT_DATE`
          )!
        );
      }

      const invoicesList = await db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt));

      return { invoices: invoicesList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const invoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
        .limit(1);

      if (!invoice[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found"
        });
      }

      // Get invoice items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      return { ...invoice[0], items };
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
            serviceId: input.serviceId,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            status: input.status,
            subtotal: input.subtotal,
            taxRate: input.taxRate,
            taxAmount: input.taxAmount,
            discountAmount: input.discountAmount,
            totalAmount: input.totalAmount,
            notes: input.notes,
            createdBy: userId,
          })
          .returning();

        // Add invoice items if provided
        if (input.items && input.items.length > 0) {
          await tx.insert(invoiceItems).values(
            input.items.map(item => ({
              invoiceId: newInvoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            }))
          );
        }

        // Log the activity
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "invoice",
          entityId: newInvoice.id,
          action: "created",
          description: `Created invoice ${input.invoiceNumber}`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: { invoiceNumber: input.invoiceNumber, totalAmount: input.totalAmount }
        });

        return newInvoice;
      });

      return { success: true, invoice: result };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: invoiceSchema.partial(),
    }))
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
          message: "Invoice not found"
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
    .input(z.object({
      id: z.string(),
      status: z.enum(["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return invoicesRouter.createCaller(ctx).update({
        id: input.id,
        data: { status: input.status }
      });
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
          message: "Invoice not found"
        });
      }

      // Delete invoice items first
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // Delete the invoice
      await db.delete(invoices).where(eq(invoices.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "invoice",
        entityId: id,
        action: "deleted",
        description: `Deleted invoice ${existingInvoice[0].invoiceNumber}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),
});