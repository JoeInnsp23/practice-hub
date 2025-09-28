import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { compliance, activityLogs } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const complianceSchema = z.object({
  title: z.string(),
  type: z.enum(["filing", "payment", "renewal", "audit", "reporting", "other"]),
  description: z.string().optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string(),
  frequency: z.enum(["once", "monthly", "quarterly", "annually"]),
  status: z.enum(["pending", "in-progress", "completed", "overdue", "cancelled"]),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const complianceRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      clientId: z.string().optional(),
      assigneeId: z.string().optional(),
      overdue: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, type, status, clientId, assigneeId, overdue } = input;

      // Build conditions
      let conditions = [eq(compliance.tenantId, tenantId)];

      if (search) {
        conditions.push(
          or(
            ilike(compliance.title, `%${search}%`),
            ilike(compliance.description, `%${search}%`)
          )!
        );
      }

      if (type && type !== "all") {
        conditions.push(eq(compliance.type, type as any));
      }

      if (status && status !== "all") {
        conditions.push(eq(compliance.status, status as any));
      }

      if (clientId) {
        conditions.push(eq(compliance.clientId, clientId));
      }

      if (assigneeId) {
        conditions.push(eq(compliance.assignedToId, assigneeId));
      }

      if (overdue) {
        conditions.push(
          and(
            sql`${compliance.dueDate} < CURRENT_DATE`,
            sql`${compliance.status} NOT IN ('completed', 'cancelled')`
          )!
        );
      }

      const complianceList = await db
        .select()
        .from(compliance)
        .where(and(...conditions))
        .orderBy(compliance.dueDate, desc(compliance.createdAt));

      return { compliance: complianceList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const item = await db
        .select()
        .from(compliance)
        .where(and(eq(compliance.id, id), eq(compliance.tenantId, tenantId)))
        .limit(1);

      if (!item[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compliance item not found"
        });
      }

      return item[0];
    }),

  create: protectedProcedure
    .input(complianceSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Create compliance item
      const [newItem] = await db
        .insert(compliance)
        .values({
          tenantId,
          title: input.title,
          type: input.type,
          description: input.description,
          clientId: input.clientId,
          assignedToId: input.assignedToId || userId,
          dueDate: input.dueDate,
          frequency: input.frequency,
          status: input.status,
          completedDate: input.completedDate,
          notes: input.notes,
          tags: input.tags,
          createdBy: userId,
        })
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "compliance",
        entityId: newItem.id,
        action: "created",
        description: `Created compliance item "${input.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: { title: input.title, type: input.type, dueDate: input.dueDate }
      });

      return { success: true, compliance: newItem };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: complianceSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check item exists and belongs to tenant
      const existingItem = await db
        .select()
        .from(compliance)
        .where(and(eq(compliance.id, input.id), eq(compliance.tenantId, tenantId)))
        .limit(1);

      if (!existingItem[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compliance item not found"
        });
      }

      // Update item
      const updateData: any = {
        ...input.data,
        updatedAt: new Date(),
      };

      // Update completed date if status changed to completed
      if (input.data.status === "completed" && existingItem[0].status !== "completed") {
        updateData.completedDate = new Date().toISOString();
      }

      const [updatedItem] = await db
        .update(compliance)
        .set(updateData)
        .where(eq(compliance.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "compliance",
        entityId: input.id,
        action: "updated",
        description: `Updated compliance item "${updatedItem.title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingItem[0],
        newValues: input.data,
      });

      return { success: true, compliance: updatedItem };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check item exists and belongs to tenant
      const existingItem = await db
        .select()
        .from(compliance)
        .where(and(eq(compliance.id, id), eq(compliance.tenantId, tenantId)))
        .limit(1);

      if (!existingItem[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compliance item not found"
        });
      }

      // Delete the item
      await db.delete(compliance).where(eq(compliance.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "compliance",
        entityId: id,
        action: "deleted",
        description: `Deleted compliance item "${existingItem[0].title}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["pending", "in-progress", "completed", "overdue", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return complianceRouter.createCaller(ctx).update({
        id: input.id,
        data: { status: input.status }
      });
    }),
});