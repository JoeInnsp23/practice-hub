import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import {
  toilAccrualHistory,
  leaveBalances,
  users,
  staffCapacity,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const toilRouter = router({
  /**
   * Accrue TOIL hours from overtime
   * This will be called by timesheet approval logic (Epic 2)
   */
  accrueToil: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        timesheetId: z.string().optional(), // Optional until Epic 2 timesheets exist
        weekEnding: z.string(), // ISO date string for the week ending
        loggedHours: z.number().min(0),
        contractedHours: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Calculate TOIL accrued: overtime hours beyond contracted
      const toilHours = Math.max(0, input.loggedHours - input.contractedHours);

      // If no overtime, return early
      if (toilHours === 0) {
        return {
          accrued: false,
          hoursAccrued: 0,
          message: "No overtime hours to accrue",
        };
      }

      // Calculate expiry date (6 months from now)
      const expiryDate = new Date(input.weekEnding);
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      // Create TOIL accrual history record
      const [accrualRecord] = await db
        .insert(toilAccrualHistory)
        .values({
          tenantId,
          userId: input.userId,
          timesheetId: input.timesheetId ?? null,
          weekEnding: input.weekEnding,
          hoursAccrued: toilHours,
          accrualDate: new Date(),
          expiryDate: expiryDate.toISOString().split("T")[0],
          expired: false,
        })
        .returning();

      // Update leaveBalances.toilBalance
      const currentYear = new Date().getFullYear();

      // Try to update existing leave balance
      const [updatedBalance] = await db
        .update(leaveBalances)
        .set({
          toilBalance: sql`${leaveBalances.toilBalance} + ${toilHours}`,
        })
        .where(
          and(
            eq(leaveBalances.userId, input.userId),
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.year, currentYear),
          ),
        )
        .returning();

      // If no existing balance, create one
      if (!updatedBalance) {
        await db.insert(leaveBalances).values({
          id: crypto.randomUUID(),
          tenantId,
          userId: input.userId,
          year: currentYear,
          annualEntitlement: 25, // UK standard
          annualUsed: 0,
          sickUsed: 0,
          toilBalance: toilHours,
          carriedOver: 0,
        });
      }

      return {
        accrued: true,
        hoursAccrued: toilHours,
        accrualId: accrualRecord.id,
        expiryDate: accrualRecord.expiryDate,
        message: `Accrued ${toilHours} hours of TOIL`,
      };
    }),

  /**
   * Get user's current TOIL balance
   */
  getBalance: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // Optional: defaults to current user
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx.authContext;
      const userId = input.userId ?? currentUserId;
      const currentYear = new Date().getFullYear();

      const [balance] = await db
        .select({
          toilBalance: leaveBalances.toilBalance,
          year: leaveBalances.year,
        })
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, userId),
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.year, currentYear),
          ),
        )
        .limit(1);

      return {
        userId,
        balance: balance?.toilBalance ?? 0,
        balanceInDays: ((balance?.toilBalance ?? 0) / 7.5).toFixed(1), // Convert to days
      };
    }),

  /**
   * Get TOIL accrual history for a user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // Optional: defaults to current user
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx.authContext;
      const userId = input.userId ?? currentUserId;

      const history = await db
        .select({
          id: toilAccrualHistory.id,
          weekEnding: toilAccrualHistory.weekEnding,
          hoursAccrued: toilAccrualHistory.hoursAccrued,
          accrualDate: toilAccrualHistory.accrualDate,
          expiryDate: toilAccrualHistory.expiryDate,
          expired: toilAccrualHistory.expired,
          timesheetId: toilAccrualHistory.timesheetId,
        })
        .from(toilAccrualHistory)
        .where(
          and(
            eq(toilAccrualHistory.userId, userId),
            eq(toilAccrualHistory.tenantId, tenantId),
          ),
        )
        .orderBy(desc(toilAccrualHistory.accrualDate))
        .limit(input.limit)
        .offset(input.offset);

      return {
        history,
        userId,
      };
    }),

  /**
   * Check for expiring TOIL
   * Returns TOIL hours expiring within the next 30 days
   */
  getExpiringToil: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // Optional: defaults to current user
        daysAhead: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx.authContext;
      const userId = input.userId ?? currentUserId;

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const expiringToil = await db
        .select({
          id: toilAccrualHistory.id,
          weekEnding: toilAccrualHistory.weekEnding,
          hoursAccrued: toilAccrualHistory.hoursAccrued,
          expiryDate: toilAccrualHistory.expiryDate,
        })
        .from(toilAccrualHistory)
        .where(
          and(
            eq(toilAccrualHistory.userId, userId),
            eq(toilAccrualHistory.tenantId, tenantId),
            eq(toilAccrualHistory.expired, false),
            gte(
              toilAccrualHistory.expiryDate,
              today.toISOString().split("T")[0],
            ),
            lte(
              toilAccrualHistory.expiryDate,
              futureDate.toISOString().split("T")[0],
            ),
          ),
        )
        .orderBy(toilAccrualHistory.expiryDate);

      const totalExpiringHours = expiringToil.reduce(
        (sum, record) => sum + record.hoursAccrued,
        0,
      );

      return {
        expiringToil,
        totalExpiringHours,
        totalExpiringDays: (totalExpiringHours / 7.5).toFixed(1),
      };
    }),

  /**
   * Mark expired TOIL records and deduct balance
   * This would be called by a cron job (Task 4)
   */
  markExpiredToil: protectedProcedure.mutation(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;
    const today = new Date().toISOString().split("T")[0];

    // Find all expired TOIL records
    const expiredRecords = await db
      .update(toilAccrualHistory)
      .set({ expired: true })
      .where(
        and(
          eq(toilAccrualHistory.tenantId, tenantId),
          eq(toilAccrualHistory.expired, false),
          lte(toilAccrualHistory.expiryDate, today),
        ),
      )
      .returning();

    // Deduct expired hours from each user's balance
    const userHoursMap = new Map<string, number>();
    for (const record of expiredRecords) {
      const currentHours = userHoursMap.get(record.userId) || 0;
      userHoursMap.set(record.userId, currentHours + record.hoursAccrued);
    }

    // Update balances for each affected user
    const currentYear = new Date().getFullYear();
    for (const [userId, hoursToDeduct] of userHoursMap.entries()) {
      await db
        .update(leaveBalances)
        .set({
          toilBalance: sql`GREATEST(0, ${leaveBalances.toilBalance} - ${hoursToDeduct})`,
        })
        .where(
          and(
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.userId, userId),
            eq(leaveBalances.year, currentYear),
          ),
        );
    }

    return {
      markedExpired: expiredRecords.length,
      usersAffected: userHoursMap.size,
      expiredRecords: expiredRecords.map((r) => ({
        id: r.id,
        userId: r.userId,
        hoursExpired: r.hoursAccrued,
        expiryDate: r.expiryDate,
      })),
    };
  }),
});
