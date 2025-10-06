import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, timeEntries } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertTimeEntrySchema = createInsertSchema(timeEntries, {
  date: z.string(),
});

// Schema for create/update operations (omit auto-generated fields)
const timeEntrySchema = insertTimeEntrySchema.omit({
  id: true,
  tenantId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const timesheetsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.string().optional(),
        clientId: z.string().optional(),
        billable: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { startDate, endDate, userId, clientId, billable } = input;

      // Build conditions
      const conditions = [eq(timeEntries.tenantId, tenantId)];

      if (startDate) {
        conditions.push(gte(timeEntries.date, startDate));
      }

      if (endDate) {
        conditions.push(lte(timeEntries.date, endDate));
      }

      if (userId) {
        conditions.push(eq(timeEntries.userId, userId));
      }

      if (clientId) {
        conditions.push(eq(timeEntries.clientId, clientId));
      }

      if (billable !== undefined) {
        conditions.push(eq(timeEntries.billable, billable));
      }

      const entries = await db
        .select()
        .from(timeEntries)
        .where(and(...conditions))
        .orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));

      return { timeEntries: entries };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const entry = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.id, id), eq(timeEntries.tenantId, tenantId)))
        .limit(1);

      if (!entry[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time entry not found",
        });
      }

      return entry[0];
    }),

  create: protectedProcedure
    .input(timeEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Create the time entry
      const [newEntry] = await db
        .insert(timeEntries)
        .values({
          tenantId,
          userId,
          date: input.date,
          clientId: input.clientId,
          serviceComponentId: input.serviceComponentId,
          taskId: input.taskId,
          description: input.description,
          hours: input.hours,
          billable: input.billable,
          rate: input.rate,
          startTime: input.startTime,
          endTime: input.endTime,
          status: input.status,
          notes: input.notes,
          metadata: input.metadata,
        })
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "timeEntry",
        entityId: newEntry.id,
        action: "created",
        description: `Logged ${input.hours}h for ${input.description}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          hours: input.hours,
          billable: input.billable,
        },
      });

      return { success: true, timeEntry: newEntry };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: timeEntrySchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check entry exists and belongs to tenant
      const existingEntry = await db
        .select()
        .from(timeEntries)
        .where(
          and(eq(timeEntries.id, input.id), eq(timeEntries.tenantId, tenantId)),
        )
        .limit(1);

      if (!existingEntry[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time entry not found",
        });
      }

      // Update entry
      const [updatedEntry] = await db
        .update(timeEntries)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(timeEntries.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "timeEntry",
        entityId: input.id,
        action: "updated",
        description: `Updated time entry`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingEntry[0],
        newValues: input.data,
      });

      return { success: true, timeEntry: updatedEntry };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check entry exists and belongs to tenant
      const existingEntry = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.id, id), eq(timeEntries.tenantId, tenantId)))
        .limit(1);

      if (!existingEntry[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time entry not found",
        });
      }

      // Delete the entry
      await db.delete(timeEntries).where(eq(timeEntries.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "timeEntry",
        entityId: id,
        action: "deleted",
        description: `Deleted time entry (${existingEntry[0].hours}h)`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  summary: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { startDate, endDate, userId } = input;

      // Get summary statistics
      const result = await db.execute(sql`
        SELECT
          COUNT(*) as total_entries,
          SUM(CAST(hours AS DECIMAL)) as total_hours,
          SUM(CASE WHEN billable THEN CAST(hours AS DECIMAL) ELSE 0 END) as billable_hours,
          SUM(CASE WHEN NOT billable THEN CAST(hours AS DECIMAL) ELSE 0 END) as non_billable_hours,
          COUNT(DISTINCT date) as days_worked,
          COUNT(DISTINCT client_id) as unique_clients
        FROM time_entries
        WHERE tenant_id = ${tenantId}
          AND date BETWEEN ${startDate} AND ${endDate}
          ${userId ? sql`AND user_id = ${userId}` : sql``}
      `);

      const summary = result.rows[0] || {
        total_entries: 0,
        total_hours: 0,
        billable_hours: 0,
        non_billable_hours: 0,
        days_worked: 0,
        unique_clients: 0,
      };

      return {
        totalEntries: Number(summary.total_entries),
        totalHours: Number(summary.total_hours),
        billableHours: Number(summary.billable_hours),
        nonBillableHours: Number(summary.non_billable_hours),
        daysWorked: Number(summary.days_worked),
        uniqueClients: Number(summary.unique_clients),
      };
    }),
});
