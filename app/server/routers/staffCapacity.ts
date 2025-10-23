import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { staffCapacity, timeEntries, users } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertStaffCapacitySchema = createInsertSchema(staffCapacity);

// Schema for create/update operations (omit auto-generated fields)
const capacitySchema = insertStaffCapacitySchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

// Utilization calculation types
const _utilizationSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weeklyHours: z.number(),
  actualHours: z.number(),
  utilizationPercent: z.number(),
  status: z.enum(["overallocated", "optimal", "underutilized"]),
});

export const staffCapacityRouter = router({
  // List all capacity records
  list: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { userId } = input;

      const conditions = [eq(staffCapacity.tenantId, tenantId)];

      if (userId) {
        conditions.push(eq(staffCapacity.userId, userId));
      }

      const capacityRecords = await db
        .select({
          id: staffCapacity.id,
          userId: staffCapacity.userId,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email,
          effectiveFrom: staffCapacity.effectiveFrom,
          weeklyHours: staffCapacity.weeklyHours,
          notes: staffCapacity.notes,
          createdAt: staffCapacity.createdAt,
          updatedAt: staffCapacity.updatedAt,
        })
        .from(staffCapacity)
        .innerJoin(users, eq(staffCapacity.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(staffCapacity.effectiveFrom));

      return { capacityRecords };
    }),

  // Get capacity record by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [record] = await db
        .select()
        .from(staffCapacity)
        .where(
          and(eq(staffCapacity.id, id), eq(staffCapacity.tenantId, tenantId)),
        )
        .limit(1);

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Capacity record not found",
        });
      }

      return { capacity: record };
    }),

  // Create new capacity record
  create: protectedProcedure
    .input(capacitySchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify user exists and belongs to tenant
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // VALIDATION: Check for conflicting capacity records
      // Business rule: No two capacity records for the same user can have
      // the same effectiveFrom date to prevent ambiguity
      const [existingCapacity] = await db
        .select()
        .from(staffCapacity)
        .where(
          and(
            eq(staffCapacity.userId, input.userId),
            eq(staffCapacity.tenantId, tenantId),
            eq(staffCapacity.effectiveFrom, input.effectiveFrom),
          ),
        )
        .limit(1);

      if (existingCapacity) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A capacity record already exists for this user with effective date ${input.effectiveFrom}. Please use a different date or update the existing record.`,
        });
      }

      const [newCapacity] = await db
        .insert(staffCapacity)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          ...input,
        })
        .returning();

      return { capacity: newCapacity };
    }),

  // Update existing capacity record
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: capacitySchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const [updated] = await db
        .update(staffCapacity)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(staffCapacity.id, input.id),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Capacity record not found",
        });
      }

      return { capacity: updated };
    }),

  // Delete capacity record
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [deleted] = await db
        .delete(staffCapacity)
        .where(
          and(eq(staffCapacity.id, id), eq(staffCapacity.tenantId, tenantId)),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Capacity record not found",
        });
      }

      return { success: true };
    }),

  // Get capacity history for a user
  getHistory: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: userId }) => {
      const { tenantId } = ctx.authContext;

      const history = await db
        .select({
          id: staffCapacity.id,
          effectiveFrom: staffCapacity.effectiveFrom,
          weeklyHours: staffCapacity.weeklyHours,
          notes: staffCapacity.notes,
          createdAt: staffCapacity.createdAt,
        })
        .from(staffCapacity)
        .where(
          and(
            eq(staffCapacity.userId, userId),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .orderBy(desc(staffCapacity.effectiveFrom));

      return { history };
    }),

  // Get current utilization for all staff or specific user
  getUtilization: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        weekStartDate: z.string().optional(), // ISO date string for week start
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Calculate week start and end
      const weekStart = input.weekStartDate
        ? new Date(input.weekStartDate)
        : getWeekStart(new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get all active users with their current capacity
      const userConditions = [
        eq(users.tenantId, tenantId),
        eq(users.isActive, true),
      ];

      if (input.userId) {
        userConditions.push(eq(users.id, input.userId));
      }

      const activeUsers = await db
        .select({
          userId: users.id,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email,
        })
        .from(users)
        .where(and(...userConditions));

      // PERFORMANCE NOTE: N+1 Query Pattern
      // This uses Promise.all with individual queries per user (2 queries per user):
      // 1. Capacity record lookup
      // 2. Time entries aggregation
      //
      // Scale Analysis:
      // - 10 staff: 20 queries (~100-200ms)
      // - 20 staff: 40 queries (~200-400ms)
      // - 50 staff: 100 queries (~500ms-1s)
      //
      // This is ACCEPTABLE for expected practice sizes (<50 staff).
      // For larger organizations (>50 staff), consider:
      // - Batch query with window functions
      // - Materialized views for common date ranges
      // - Caching with TTL
      //
      // Current decision: Optimize when needed (YAGNI principle)
      // Get current capacity for each user (most recent effective_from)
      const utilizationData = await Promise.all(
        activeUsers.map(async (user) => {
          // Get most recent capacity record
          const [capacity] = await db
            .select({
              weeklyHours: staffCapacity.weeklyHours,
              effectiveFrom: staffCapacity.effectiveFrom,
            })
            .from(staffCapacity)
            .where(
              and(
                eq(staffCapacity.userId, user.userId),
                eq(staffCapacity.tenantId, tenantId),
                lte(
                  staffCapacity.effectiveFrom,
                  weekStart.toISOString().split("T")[0],
                ),
              ),
            )
            .orderBy(desc(staffCapacity.effectiveFrom))
            .limit(1);

          if (!capacity) {
            return {
              userId: user.userId,
              userName: user.userName,
              weeklyHours: 0,
              actualHours: 0,
              utilizationPercent: 0,
              status: "underutilized" as const,
            };
          }

          // Get actual hours logged for the week
          const [actualHours] = await db
            .select({
              total: sql<number>`coalesce(sum(${timeEntries.hours}), 0)`,
            })
            .from(timeEntries)
            .where(
              and(
                eq(timeEntries.userId, user.userId),
                eq(timeEntries.tenantId, tenantId),
                gte(timeEntries.date, weekStart.toISOString().split("T")[0]),
                lte(timeEntries.date, weekEnd.toISOString().split("T")[0]),
              ),
            );

          const actual = Number(actualHours?.total ?? 0);
          const utilizationPercent =
            capacity.weeklyHours > 0
              ? (actual / capacity.weeklyHours) * 100
              : 0;

          // Determine status
          let status: "overallocated" | "optimal" | "underutilized" = "optimal";
          if (utilizationPercent > 100) {
            status = "overallocated";
          } else if (utilizationPercent < 75) {
            status = "underutilized";
          }

          return {
            userId: user.userId,
            userName: user.userName,
            weeklyHours: capacity.weeklyHours,
            actualHours: actual,
            utilizationPercent,
            status,
          };
        }),
      );

      return { utilization: utilizationData };
    }),

  // Get utilization trends for the last 12 weeks
  getUtilizationTrends: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        weeks: z.number().default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const trends = [];
      const today = new Date();

      for (let i = 0; i < input.weeks; i++) {
        const weekStart = getWeekStart(today);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get utilization for this week
        const userConditions = [
          eq(users.tenantId, tenantId),
          eq(users.isActive, true),
        ];

        if (input.userId) {
          userConditions.push(eq(users.id, input.userId));
        }

        const activeUsers = await db
          .select({
            userId: users.id,
            userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          })
          .from(users)
          .where(and(...userConditions));

        // PERFORMANCE NOTE: N+1 Query Pattern (nested in loop)
        // Outer loop: weeks (default 12)
        // Inner loop: users (2 queries per user per week)
        //
        // Total queries: weeks × users × 2
        // Example: 12 weeks × 20 staff = 480 queries (~2-3s)
        //
        // This is ACCEPTABLE for:
        // - Dashboard loading (not real-time)
        // - Expected scale (<50 staff, <20 weeks)
        // - Infrequent access (not on every page load)
        //
        // For optimization, consider:
        // - Caching trend data with TTL
        // - Batch query with date range
        // - Materialized view updated nightly
        const weekData = await Promise.all(
          activeUsers.map(async (user) => {
            // Get capacity for this week
            const [capacity] = await db
              .select({
                weeklyHours: staffCapacity.weeklyHours,
              })
              .from(staffCapacity)
              .where(
                and(
                  eq(staffCapacity.userId, user.userId),
                  eq(staffCapacity.tenantId, tenantId),
                  lte(
                    staffCapacity.effectiveFrom,
                    weekStart.toISOString().split("T")[0],
                  ),
                ),
              )
              .orderBy(desc(staffCapacity.effectiveFrom))
              .limit(1);

            if (!capacity) return null;

            // Get actual hours for this week
            const [actualHours] = await db
              .select({
                total: sql<number>`coalesce(sum(${timeEntries.hours}), 0)`,
              })
              .from(timeEntries)
              .where(
                and(
                  eq(timeEntries.userId, user.userId),
                  eq(timeEntries.tenantId, tenantId),
                  gte(timeEntries.date, weekStart.toISOString().split("T")[0]),
                  lte(timeEntries.date, weekEnd.toISOString().split("T")[0]),
                ),
              );

            const actual = Number(actualHours?.total ?? 0);
            const utilizationPercent =
              capacity.weeklyHours > 0
                ? (actual / capacity.weeklyHours) * 100
                : 0;

            return {
              userId: user.userId,
              userName: user.userName,
              weekStart: weekStart.toISOString().split("T")[0],
              weeklyHours: capacity.weeklyHours,
              actualHours: actual,
              utilizationPercent,
            };
          }),
        );

        trends.push({
          weekStart: weekStart.toISOString().split("T")[0],
          data: weekData.filter((d) => d !== null),
        });
      }

      return { trends: trends.reverse() };
    }),

  // Get workload balancing recommendations
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    // Get current week utilization inline (to avoid ctx.runProcedure)
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const activeUsers = await db
      .select({
        userId: users.id,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)));

    const utilization = await Promise.all(
      activeUsers.map(async (user) => {
        const [capacity] = await db
          .select({
            weeklyHours: staffCapacity.weeklyHours,
          })
          .from(staffCapacity)
          .where(
            and(
              eq(staffCapacity.userId, user.userId),
              eq(staffCapacity.tenantId, tenantId),
              lte(
                staffCapacity.effectiveFrom,
                weekStart.toISOString().split("T")[0],
              ),
            ),
          )
          .orderBy(desc(staffCapacity.effectiveFrom))
          .limit(1);

        if (!capacity) {
          return {
            userId: user.userId,
            userName: user.userName,
            weeklyHours: 0,
            actualHours: 0,
            utilizationPercent: 0,
            status: "underutilized" as const,
          };
        }

        const [actualHours] = await db
          .select({
            total: sql<number>`coalesce(sum(${timeEntries.hours}), 0)`,
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.userId, user.userId),
              eq(timeEntries.tenantId, tenantId),
              gte(timeEntries.date, weekStart.toISOString().split("T")[0]),
              lte(timeEntries.date, weekEnd.toISOString().split("T")[0]),
            ),
          );

        const actual = Number(actualHours?.total ?? 0);
        const utilizationPercent =
          capacity.weeklyHours > 0 ? (actual / capacity.weeklyHours) * 100 : 0;

        let status: "overallocated" | "optimal" | "underutilized" = "optimal";
        if (utilizationPercent > 100) {
          status = "overallocated";
        } else if (utilizationPercent < 75) {
          status = "underutilized";
        }

        return {
          userId: user.userId,
          userName: user.userName,
          weeklyHours: capacity.weeklyHours,
          actualHours: actual,
          utilizationPercent,
          status,
        };
      }),
    );

    const recommendations = [];

    // Find overallocated and underutilized staff
    const overallocated = utilization.filter(
      (u) => u.status === "overallocated",
    );
    const underutilized = utilization.filter(
      (u) => u.status === "underutilized" && u.weeklyHours > 0,
    );

    if (overallocated.length > 0 && underutilized.length > 0) {
      recommendations.push({
        type: "redistribute",
        message: `${overallocated.length} staff member(s) are overallocated. Consider redistributing work to ${underutilized.length} underutilized team member(s).`,
        overallocatedStaff: overallocated.map((u) => u.userName),
        underutilizedStaff: underutilized.map((u) => u.userName),
      });
    } else if (overallocated.length > 0) {
      recommendations.push({
        type: "overload",
        message: `${overallocated.length} staff member(s) are overallocated. Consider hiring or reducing workload.`,
        overallocatedStaff: overallocated.map((u) => u.userName),
      });
    } else if (underutilized.length > 0) {
      recommendations.push({
        type: "underutilized",
        message: `${underutilized.length} staff member(s) are underutilized. Consider reassigning tasks or reducing capacity.`,
        underutilizedStaff: underutilized.map((u) => u.userName),
      });
    }

    // Calculate team average
    const totalCapacity = utilization.reduce(
      (sum, u) => sum + u.weeklyHours,
      0,
    );
    const totalActual = utilization.reduce((sum, u) => sum + u.actualHours, 0);
    const teamUtilization =
      totalCapacity > 0 ? (totalActual / totalCapacity) * 100 : 0;

    return {
      recommendations,
      teamUtilization,
      totalCapacity,
      totalActual,
    };
  }),
});

// Helper function to get the start of the week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
