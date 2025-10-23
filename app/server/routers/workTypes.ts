import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { workTypes, timeEntries } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const workTypesRouter = router({
  // List all work types for the tenant
  list: protectedProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().optional().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const where = input?.includeInactive
        ? eq(workTypes.tenantId, tenantId)
        : and(
            eq(workTypes.tenantId, tenantId),
            eq(workTypes.isActive, true),
          );

      const workTypesList = await db
        .select()
        .from(workTypes)
        .where(where)
        .orderBy(workTypes.sortOrder, workTypes.label);

      return { workTypes: workTypesList };
    }),

  // Get a single work type by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [workType] = await db
        .select()
        .from(workTypes)
        .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)));

      if (!workType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work type not found",
        });
      }

      return { workType };
    }),

  // Create a new work type (admin only)
  create: adminProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(1, "Code is required")
          .max(50, "Code must be 50 characters or less")
          .regex(/^[A-Z_]+$/, "Code must be uppercase letters and underscores only"),
        label: z.string().min(1, "Label is required").max(100),
        colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
        isBillable: z.boolean().default(true),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Check if code already exists for this tenant
      const [existingWorkType] = await db
        .select({ id: workTypes.id })
        .from(workTypes)
        .where(
          and(eq(workTypes.tenantId, tenantId), eq(workTypes.code, input.code)),
        );

      if (existingWorkType) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Work type with this code already exists",
        });
      }

      // Get the max sort order if not provided
      let sortOrder = input.sortOrder;
      if (sortOrder === undefined) {
        const [maxSortOrder] = await db
          .select({ max: sql<number>`COALESCE(MAX(${workTypes.sortOrder}), 0)` })
          .from(workTypes)
          .where(eq(workTypes.tenantId, tenantId));

        sortOrder = (maxSortOrder?.max || 0) + 1;
      }

      const [newWorkType] = await db
        .insert(workTypes)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          code: input.code,
          label: input.label,
          colorCode: input.colorCode,
          isBillable: input.isBillable,
          sortOrder,
          isActive: true,
        })
        .returning();

      return { workType: newWorkType };
    }),

  // Update a work type (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Label is required").max(100).optional(),
        colorCode: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code")
          .optional(),
        isBillable: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { id, ...updates } = input;

      // Verify work type exists and belongs to tenant
      const [existingWorkType] = await db
        .select({ id: workTypes.id })
        .from(workTypes)
        .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)));

      if (!existingWorkType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work type not found",
        });
      }

      const [updatedWorkType] = await db
        .update(workTypes)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)))
        .returning();

      return { workType: updatedWorkType };
    }),

  // Soft delete a work type (admin only)
  softDelete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Verify work type exists and belongs to tenant
      const [existingWorkType] = await db
        .select({ id: workTypes.id, code: workTypes.code })
        .from(workTypes)
        .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)));

      if (!existingWorkType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work type not found",
        });
      }

      // Check if work type is used in any time entries
      const [timeEntryCount] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, tenantId),
            eq(timeEntries.workType, existingWorkType.code),
          ),
        );

      if (timeEntryCount && timeEntryCount.count > 0) {
        // Soft delete - preserve historical data
        await db
          .update(workTypes)
          .set({ isActive: false, updatedAt: new Date() })
          .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)));

        return { success: true, message: "Work type deactivated (has time entries)" };
      }

      // Hard delete if no time entries
      await db
        .delete(workTypes)
        .where(and(eq(workTypes.id, id), eq(workTypes.tenantId, tenantId)));

      return { success: true, message: "Work type deleted" };
    }),

  // Reorder work types (admin only)
  reorder: adminProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          sortOrder: z.number().int().min(0),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify all work types exist and belong to tenant
      const ids = input.map((item) => item.id);
      const existingWorkTypes = await db
        .select({ id: workTypes.id })
        .from(workTypes)
        .where(
          and(
            eq(workTypes.tenantId, tenantId),
            sql`${workTypes.id} IN (${sql.join(
              ids.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );

      if (existingWorkTypes.length !== ids.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more work types not found",
        });
      }

      // Update sort orders
      await Promise.all(
        input.map((item) =>
          db
            .update(workTypes)
            .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
            .where(
              and(eq(workTypes.id, item.id), eq(workTypes.tenantId, tenantId)),
            ),
        ),
      );

      return { success: true };
    }),
});
