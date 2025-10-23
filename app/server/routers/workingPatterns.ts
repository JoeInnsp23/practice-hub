import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, workingPatterns } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const workingPatternsRouter = router({
  // List all working patterns for the tenant
  list: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const where = input?.userId
        ? and(
            eq(workingPatterns.tenantId, tenantId),
            eq(workingPatterns.userId, input.userId),
          )
        : eq(workingPatterns.tenantId, tenantId);

      const patternsList = await db
        .select({
          id: workingPatterns.id,
          userId: workingPatterns.userId,
          patternType: workingPatterns.patternType,
          contractedHours: workingPatterns.contractedHours,
          mondayHours: workingPatterns.mondayHours,
          tuesdayHours: workingPatterns.tuesdayHours,
          wednesdayHours: workingPatterns.wednesdayHours,
          thursdayHours: workingPatterns.thursdayHours,
          fridayHours: workingPatterns.fridayHours,
          saturdayHours: workingPatterns.saturdayHours,
          sundayHours: workingPatterns.sundayHours,
          effectiveFrom: workingPatterns.effectiveFrom,
          notes: workingPatterns.notes,
          createdAt: workingPatterns.createdAt,
          updatedAt: workingPatterns.updatedAt,
          userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          userEmail: users.email,
        })
        .from(workingPatterns)
        .innerJoin(users, eq(workingPatterns.userId, users.id))
        .where(where)
        .orderBy(desc(workingPatterns.effectiveFrom));

      return { workingPatterns: patternsList };
    }),

  // Get all working patterns for a specific user (with history)
  getByUser: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: userId }) => {
      const { tenantId } = ctx.authContext;

      // Verify user exists and belongs to tenant
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const patterns = await db
        .select({
          id: workingPatterns.id,
          userId: workingPatterns.userId,
          patternType: workingPatterns.patternType,
          contractedHours: workingPatterns.contractedHours,
          mondayHours: workingPatterns.mondayHours,
          tuesdayHours: workingPatterns.tuesdayHours,
          wednesdayHours: workingPatterns.wednesdayHours,
          thursdayHours: workingPatterns.thursdayHours,
          fridayHours: workingPatterns.fridayHours,
          saturdayHours: workingPatterns.saturdayHours,
          sundayHours: workingPatterns.sundayHours,
          effectiveFrom: workingPatterns.effectiveFrom,
          notes: workingPatterns.notes,
          createdAt: workingPatterns.createdAt,
        })
        .from(workingPatterns)
        .where(
          and(
            eq(workingPatterns.tenantId, tenantId),
            eq(workingPatterns.userId, userId),
          ),
        )
        .orderBy(desc(workingPatterns.effectiveFrom));

      return { patterns };
    }),

  // Get the currently active working pattern for a user
  getActive: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: userId }) => {
      const { tenantId } = ctx.authContext;

      // Verify user exists and belongs to tenant
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const today = new Date().toISOString().split("T")[0];

      // Get the most recent pattern that has effectiveFrom <= today
      const [activePattern] = await db
        .select({
          id: workingPatterns.id,
          userId: workingPatterns.userId,
          patternType: workingPatterns.patternType,
          contractedHours: workingPatterns.contractedHours,
          mondayHours: workingPatterns.mondayHours,
          tuesdayHours: workingPatterns.tuesdayHours,
          wednesdayHours: workingPatterns.wednesdayHours,
          thursdayHours: workingPatterns.thursdayHours,
          fridayHours: workingPatterns.fridayHours,
          saturdayHours: workingPatterns.saturdayHours,
          sundayHours: workingPatterns.sundayHours,
          effectiveFrom: workingPatterns.effectiveFrom,
          notes: workingPatterns.notes,
        })
        .from(workingPatterns)
        .where(
          and(
            eq(workingPatterns.tenantId, tenantId),
            eq(workingPatterns.userId, userId),
            lte(workingPatterns.effectiveFrom, today),
          ),
        )
        .orderBy(desc(workingPatterns.effectiveFrom))
        .limit(1);

      return { pattern: activePattern || null };
    }),

  // Create a new working pattern (admin only)
  create: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        patternType: z.enum([
          "full_time",
          "part_time",
          "compressed_hours",
          "job_share",
          "custom",
        ]),
        contractedHours: z.number().min(0).max(168), // Max 168 hours per week
        mondayHours: z.number().min(0).max(24).default(0),
        tuesdayHours: z.number().min(0).max(24).default(0),
        wednesdayHours: z.number().min(0).max(24).default(0),
        thursdayHours: z.number().min(0).max(24).default(0),
        fridayHours: z.number().min(0).max(24).default(0),
        saturdayHours: z.number().min(0).max(24).default(0),
        sundayHours: z.number().min(0).max(24).default(0),
        effectiveFrom: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify user exists and belongs to tenant
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found",
        });
      }

      // Validate that sum of day hours equals contracted hours
      const totalHours =
        input.mondayHours +
        input.tuesdayHours +
        input.wednesdayHours +
        input.thursdayHours +
        input.fridayHours +
        input.saturdayHours +
        input.sundayHours;

      if (Math.abs(totalHours - input.contractedHours) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Sum of day hours (${totalHours}) must equal contracted hours (${input.contractedHours})`,
        });
      }

      const [newPattern] = await db
        .insert(workingPatterns)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          userId: input.userId,
          patternType: input.patternType,
          contractedHours: input.contractedHours,
          mondayHours: input.mondayHours,
          tuesdayHours: input.tuesdayHours,
          wednesdayHours: input.wednesdayHours,
          thursdayHours: input.thursdayHours,
          fridayHours: input.fridayHours,
          saturdayHours: input.saturdayHours,
          sundayHours: input.sundayHours,
          effectiveFrom: input.effectiveFrom,
          notes: input.notes,
        })
        .returning();

      return { pattern: newPattern };
    }),

  // Update a working pattern (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        patternType: z
          .enum([
            "full_time",
            "part_time",
            "compressed_hours",
            "job_share",
            "custom",
          ])
          .optional(),
        contractedHours: z.number().min(0).max(168).optional(),
        mondayHours: z.number().min(0).max(24).optional(),
        tuesdayHours: z.number().min(0).max(24).optional(),
        wednesdayHours: z.number().min(0).max(24).optional(),
        thursdayHours: z.number().min(0).max(24).optional(),
        fridayHours: z.number().min(0).max(24).optional(),
        saturdayHours: z.number().min(0).max(24).optional(),
        sundayHours: z.number().min(0).max(24).optional(),
        effectiveFrom: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { id, ...updates } = input;

      // Verify pattern exists and belongs to tenant
      const [existingPattern] = await db
        .select()
        .from(workingPatterns)
        .where(
          and(
            eq(workingPatterns.id, id),
            eq(workingPatterns.tenantId, tenantId),
          ),
        );

      if (!existingPattern) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Working pattern not found",
        });
      }

      // If any day hours or contracted hours are being updated, validate the sum
      const updatedMondayHours = updates.mondayHours ?? existingPattern.mondayHours;
      const updatedTuesdayHours = updates.tuesdayHours ?? existingPattern.tuesdayHours;
      const updatedWednesdayHours =
        updates.wednesdayHours ?? existingPattern.wednesdayHours;
      const updatedThursdayHours =
        updates.thursdayHours ?? existingPattern.thursdayHours;
      const updatedFridayHours = updates.fridayHours ?? existingPattern.fridayHours;
      const updatedSaturdayHours =
        updates.saturdayHours ?? existingPattern.saturdayHours;
      const updatedSundayHours = updates.sundayHours ?? existingPattern.sundayHours;
      const updatedContractedHours =
        updates.contractedHours ?? existingPattern.contractedHours;

      const totalHours =
        updatedMondayHours +
        updatedTuesdayHours +
        updatedWednesdayHours +
        updatedThursdayHours +
        updatedFridayHours +
        updatedSaturdayHours +
        updatedSundayHours;

      if (Math.abs(totalHours - updatedContractedHours) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Sum of day hours (${totalHours}) must equal contracted hours (${updatedContractedHours})`,
        });
      }

      const [updatedPattern] = await db
        .update(workingPatterns)
        .set(updates)
        .where(
          and(
            eq(workingPatterns.id, id),
            eq(workingPatterns.tenantId, tenantId),
          ),
        )
        .returning();

      return { pattern: updatedPattern };
    }),

  // Delete a working pattern (admin only)
  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Verify pattern exists and belongs to tenant
      const [existingPattern] = await db
        .select({ id: workingPatterns.id })
        .from(workingPatterns)
        .where(
          and(
            eq(workingPatterns.id, id),
            eq(workingPatterns.tenantId, tenantId),
          ),
        );

      if (!existingPattern) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Working pattern not found",
        });
      }

      await db
        .delete(workingPatterns)
        .where(
          and(
            eq(workingPatterns.id, id),
            eq(workingPatterns.tenantId, tenantId),
          ),
        );

      return { success: true };
    }),
});
