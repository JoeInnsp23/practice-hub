import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leaveBalances, leaveRequests, users } from "@/lib/db/schema";
import {
  sendLeaveRequestApproved,
  sendLeaveRequestRejected,
  sendLeaveRequestSubmitted,
} from "@/lib/email/leave-notifications";
import { applyCarryover } from "@/lib/leave/carryover";
import { calculateWorkingDays, hasWorkingDays } from "@/lib/leave/working-days";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const leaveRouter = router({
  /**
   * Request leave
   */
  request: protectedProcedure
    .input(
      z.object({
        leaveType: z.enum([
          "annual_leave",
          "sick_leave",
          "toil",
          "unpaid",
          "other",
        ]),
        startDate: z.string(), // ISO date string
        endDate: z.string(), // ISO date string
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const now = new Date();
      // Reset time portion for fair date comparison
      now.setHours(0, 0, 0, 0);

      // Validation 1: Prevent past dates
      if (startDate < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot request leave for past dates",
        });
      }

      // Validation 2: End date must be after start date
      if (endDate < startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be on or after start date",
        });
      }

      // Validation 3: Must include at least one working day
      if (!hasWorkingDays(startDate, endDate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Leave request must include at least one working day (weekends and bank holidays are automatically excluded)",
        });
      }

      // Calculate working days
      const daysCount = calculateWorkingDays(startDate, endDate);

      // Validation 4: Check for overlapping requests
      const overlappingRequests = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.tenantId, tenantId),
            eq(leaveRequests.userId, userId),
            or(
              eq(leaveRequests.status, "pending"),
              eq(leaveRequests.status, "approved"),
            ),
            or(
              // New request starts during existing request
              and(
                lte(leaveRequests.startDate, input.startDate),
                gte(leaveRequests.endDate, input.startDate),
              ),
              // New request ends during existing request
              and(
                lte(leaveRequests.startDate, input.endDate),
                gte(leaveRequests.endDate, input.endDate),
              ),
              // New request completely contains existing request
              and(
                gte(leaveRequests.startDate, input.startDate),
                lte(leaveRequests.endDate, input.endDate),
              ),
            ),
          ),
        );

      if (overlappingRequests.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "You already have a leave request for these dates. Please cancel the existing request first.",
        });
      }

      // Validation 5: Check annual leave balance (only for annual leave)
      if (input.leaveType === "annual_leave") {
        const currentYear = new Date().getFullYear();
        const [balance] = await db
          .select()
          .from(leaveBalances)
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, userId),
              eq(leaveBalances.year, currentYear),
            ),
          );

        if (balance) {
          const available =
            (balance.annualEntitlement ?? 0) +
            (balance.carriedOver ?? 0) -
            (balance.annualUsed ?? 0);
          if (daysCount > available) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Insufficient annual leave balance. You have ${available} days available, but are requesting ${daysCount} days.`,
            });
          }
        } else {
          // No balance record for current year - create one with default entitlement
          await db.insert(leaveBalances).values({
            id: crypto.randomUUID(),
            tenantId,
            userId,
            year: currentYear,
            annualEntitlement: 25, // UK standard
            annualUsed: 0,
            sickUsed: 0,
            toilBalance: 0,
            carriedOver: 0,
          });

          // Check again
          if (daysCount > 25) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Insufficient annual leave balance. You have 25 days available, but are requesting ${daysCount} days.`,
            });
          }
        }
      }

      // Validation 6: Check TOIL balance (only for TOIL leave)
      if (input.leaveType === "toil") {
        const currentYear = new Date().getFullYear();
        const [balance] = await db
          .select()
          .from(leaveBalances)
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, userId),
              eq(leaveBalances.year, currentYear),
            ),
          );

        const toilBalance = balance?.toilBalance ?? 0;

        if (!balance || toilBalance === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "You have no TOIL balance available. TOIL is earned through approved overtime hours.",
          });
        }

        // Convert days to hours (assuming 7.5 hour workdays)
        const hoursRequired = daysCount * 7.5;

        if (hoursRequired > toilBalance) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Insufficient TOIL balance. You have ${toilBalance} hours (${(toilBalance / 7.5).toFixed(1)} days) available, but are requesting ${hoursRequired} hours (${daysCount} days).`,
          });
        }
      }

      // Create leave request
      const [request] = await db
        .insert(leaveRequests)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          userId,
          leaveType: input.leaveType,
          startDate: input.startDate,
          endDate: input.endDate,
          daysCount,
          status: "pending",
          notes: input.notes,
        })
        .returning();

      // Send email notification (non-blocking)
      const userName =
        `${ctx.authContext.firstName || ""} ${ctx.authContext.lastName || ""}`.trim() ||
        ctx.authContext.email;
      sendLeaveRequestSubmitted({
        to: ctx.authContext.email,
        userName,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        daysCount,
      }).catch((error) => {
        Sentry.captureException(error, {
          tags: { operation: "sendLeaveRequestSubmitted" },
          extra: {
            userId: ctx.authContext.userId,
            leaveType: input.leaveType,
            startDate: input.startDate,
          },
        });
      });

      return { success: true, request };
    }),

  /**
   * Approve leave request (admin only)
   */
  approve: adminProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        reviewerComments: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Get the request
      const [request] = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.id, input.requestId),
            eq(leaveRequests.tenantId, tenantId),
          ),
        );

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave request not found",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve request with status: ${request.status}`,
        });
      }

      // Update request status
      const [updatedRequest] = await db
        .update(leaveRequests)
        .set({
          status: "approved",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewerComments: input.reviewerComments,
        })
        .where(eq(leaveRequests.id, input.requestId))
        .returning();

      // Update leave balance (for annual leave)
      if (request.leaveType === "annual_leave") {
        const currentYear = new Date().getFullYear();
        await db
          .update(leaveBalances)
          .set({
            annualUsed: sql`${leaveBalances.annualUsed} + ${request.daysCount}`,
          })
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, request.userId),
              eq(leaveBalances.year, currentYear),
            ),
          );
      }

      // Update sick leave used (for sick leave)
      if (request.leaveType === "sick_leave") {
        const currentYear = new Date().getFullYear();
        await db
          .update(leaveBalances)
          .set({
            sickUsed: sql`${leaveBalances.sickUsed} + ${request.daysCount}`,
          })
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, request.userId),
              eq(leaveBalances.year, currentYear),
            ),
          );
      }

      // Deduct TOIL balance (for TOIL leave)
      if (request.leaveType === "toil") {
        const currentYear = new Date().getFullYear();
        const hoursToDeduct = request.daysCount * 7.5;

        await db
          .update(leaveBalances)
          .set({
            toilBalance: sql`${leaveBalances.toilBalance} - ${hoursToDeduct}`,
          })
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, request.userId),
              eq(leaveBalances.year, currentYear),
            ),
          );
      }

      // Get user details for email notification
      const [user] = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, request.userId));

      if (user) {
        // Send email notification (non-blocking)
        const userName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
        const approverName =
          `${ctx.authContext.firstName || ""} ${ctx.authContext.lastName || ""}`.trim() ||
          ctx.authContext.email;

        sendLeaveRequestApproved({
          to: user.email,
          userName,
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          daysCount: request.daysCount,
          approverName,
        }).catch((error) => {
          Sentry.captureException(error, {
            tags: { operation: "sendLeaveRequestApproved" },
            extra: {
              requestId: input.requestId,
              approverUserId: userId,
            },
          });
        });
      }

      return { success: true, request: updatedRequest };
    }),

  /**
   * Reject leave request (admin only)
   */
  reject: adminProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        reviewerComments: z.string().min(1, "Reason for rejection is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Get the request
      const [request] = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.id, input.requestId),
            eq(leaveRequests.tenantId, tenantId),
          ),
        );

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave request not found",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject request with status: ${request.status}`,
        });
      }

      // Update request status
      const [updatedRequest] = await db
        .update(leaveRequests)
        .set({
          status: "rejected",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewerComments: input.reviewerComments,
        })
        .where(eq(leaveRequests.id, input.requestId))
        .returning();

      // Get user details for email notification
      const [user] = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, request.userId));

      if (user) {
        // Send email notification (non-blocking)
        const userName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
        const approverName =
          `${ctx.authContext.firstName || ""} ${ctx.authContext.lastName || ""}`.trim() ||
          ctx.authContext.email;

        sendLeaveRequestRejected({
          to: user.email,
          userName,
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          daysCount: request.daysCount,
          approverName,
          comments: input.reviewerComments,
        }).catch((error) => {
          Sentry.captureException(error, {
            tags: { operation: "sendLeaveRequestRejected" },
            extra: {
              requestId: input.requestId,
              reviewerUserId: userId,
            },
          });
        });
      }

      return { success: true, request: updatedRequest };
    }),

  /**
   * Cancel leave request (user can cancel their own pending requests)
   */
  cancel: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Get the request
      const [request] = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.id, input.requestId),
            eq(leaveRequests.tenantId, tenantId),
            eq(leaveRequests.userId, userId), // Can only cancel own requests
          ),
        );

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave request not found",
        });
      }

      if (request.status !== "pending" && request.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel request with status: ${request.status}`,
        });
      }

      // If approved, need to restore balance
      if (request.status === "approved") {
        const currentYear = new Date().getFullYear();

        if (request.leaveType === "annual_leave") {
          await db
            .update(leaveBalances)
            .set({
              annualUsed: sql`${leaveBalances.annualUsed} - ${request.daysCount}`,
            })
            .where(
              and(
                eq(leaveBalances.tenantId, tenantId),
                eq(leaveBalances.userId, userId),
                eq(leaveBalances.year, currentYear),
              ),
            );
        }

        if (request.leaveType === "sick_leave") {
          await db
            .update(leaveBalances)
            .set({
              sickUsed: sql`${leaveBalances.sickUsed} - ${request.daysCount}`,
            })
            .where(
              and(
                eq(leaveBalances.tenantId, tenantId),
                eq(leaveBalances.userId, userId),
                eq(leaveBalances.year, currentYear),
              ),
            );
        }

        // Restore TOIL balance (for TOIL leave)
        if (request.leaveType === "toil") {
          const hoursToRestore = request.daysCount * 7.5;

          await db
            .update(leaveBalances)
            .set({
              toilBalance: sql`${leaveBalances.toilBalance} + ${hoursToRestore}`,
            })
            .where(
              and(
                eq(leaveBalances.tenantId, tenantId),
                eq(leaveBalances.userId, userId),
                eq(leaveBalances.year, currentYear),
              ),
            );
        }
      }

      // Update request status
      const [updatedRequest] = await db
        .update(leaveRequests)
        .set({
          status: "cancelled",
        })
        .where(eq(leaveRequests.id, input.requestId))
        .returning();

      return { success: true, request: updatedRequest };
    }),

  /**
   * Get leave balance for current user
   */
  getBalance: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;
      const year = input.year || new Date().getFullYear();

      // Get or create balance record
      let [balance] = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.userId, userId),
            eq(leaveBalances.year, year),
          ),
        );

      if (!balance) {
        // Create default balance
        [balance] = await db
          .insert(leaveBalances)
          .values({
            id: crypto.randomUUID(),
            tenantId,
            userId,
            year,
            annualEntitlement: 25,
            annualUsed: 0,
            sickUsed: 0,
            toilBalance: 0,
            carriedOver: 0,
          })
          .returning();
      }

      const annualRemaining =
        (balance.annualEntitlement ?? 0) +
        (balance.carriedOver ?? 0) -
        (balance.annualUsed ?? 0);

      return {
        balance,
        annualRemaining,
      };
    }),

  /**
   * Get leave calendar (all approved leave for team visibility)
   */
  getCalendar: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.string().optional(), // Optional filter by specific user
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const whereConditions = [
        eq(leaveRequests.tenantId, tenantId),
        eq(leaveRequests.status, "approved"),
        // Overlapping date range
        or(
          and(
            lte(leaveRequests.startDate, input.endDate),
            gte(leaveRequests.endDate, input.startDate),
          ),
        ),
      ];

      if (input.userId) {
        whereConditions.push(eq(leaveRequests.userId, input.userId));
      }

      const requests = await db
        .select({
          id: leaveRequests.id,
          userId: leaveRequests.userId,
          userName: users.name,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          leaveType: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          daysCount: leaveRequests.daysCount,
          status: leaveRequests.status,
          notes: leaveRequests.notes,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(leaveRequests.startDate);

      return { requests };
    }),

  /**
   * Get leave history for current user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        year: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      const whereConditions = [
        eq(leaveRequests.tenantId, tenantId),
        eq(leaveRequests.userId, userId),
      ];

      // Optional year filter
      if (input.year) {
        const yearStart = `${input.year}-01-01`;
        const yearEnd = `${input.year}-12-31`;
        whereConditions.push(
          gte(leaveRequests.startDate, yearStart),
          lte(leaveRequests.startDate, yearEnd),
        );
      }

      // Create alias for reviewer users to avoid table name collision
      const reviewerUsers = users;

      const requests = await db
        .select({
          id: leaveRequests.id,
          leaveType: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          daysCount: leaveRequests.daysCount,
          status: leaveRequests.status,
          notes: leaveRequests.notes,
          requestedAt: leaveRequests.requestedAt,
          reviewedBy: leaveRequests.reviewedBy,
          reviewedAt: leaveRequests.reviewedAt,
          reviewerComments: leaveRequests.reviewerComments,
          reviewerName: reviewerUsers.name,
        })
        .from(leaveRequests)
        .leftJoin(reviewerUsers, eq(leaveRequests.reviewedBy, reviewerUsers.id))
        .where(and(...whereConditions))
        .orderBy(desc(leaveRequests.requestedAt))
        .limit(input.limit);

      return { requests };
    }),

  /**
   * Get team leave (for managers to see all leave requests)
   */
  getTeamLeave: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "approved", "rejected", "cancelled"])
          .optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const whereConditions = [eq(leaveRequests.tenantId, tenantId)];

      if (input.status) {
        whereConditions.push(eq(leaveRequests.status, input.status));
      }

      // Date range filter
      if (input.startDate && input.endDate) {
        const dateRangeCondition = or(
          and(
            lte(leaveRequests.startDate, input.endDate),
            gte(leaveRequests.endDate, input.startDate),
          ),
        );
        if (dateRangeCondition) whereConditions.push(dateRangeCondition);
      }

      const requests = await db
        .select({
          id: leaveRequests.id,
          userId: leaveRequests.userId,
          userName: sql<string>`COALESCE(${users.name}, CONCAT(${users.firstName}, ' ', ${users.lastName}), 'Unknown User')`,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userEmail: users.email,
          leaveType: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          daysCount: leaveRequests.daysCount,
          status: leaveRequests.status,
          notes: leaveRequests.notes,
          requestedAt: leaveRequests.requestedAt,
          reviewedBy: leaveRequests.reviewedBy,
          reviewedAt: leaveRequests.reviewedAt,
          reviewerComments: leaveRequests.reviewerComments,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(leaveRequests.requestedAt));

      return { requests };
    }),

  /**
   * Get conflicting leave requests (check if team members are requesting same dates)
   */
  getConflicts: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        excludeUserId: z.string().optional(), // Exclude current user when checking
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const whereConditions = [
        eq(leaveRequests.tenantId, tenantId),
        or(
          eq(leaveRequests.status, "pending"),
          eq(leaveRequests.status, "approved"),
        ),
        // Overlapping dates
        or(
          and(
            lte(leaveRequests.startDate, input.endDate),
            gte(leaveRequests.endDate, input.startDate),
          ),
        ),
      ];

      if (input.excludeUserId) {
        whereConditions.push(
          sql`${leaveRequests.userId} != ${input.excludeUserId}`,
        );
      }

      const conflicts = await db
        .select({
          id: leaveRequests.id,
          userId: leaveRequests.userId,
          userName: users.name,
          leaveType: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          daysCount: leaveRequests.daysCount,
          status: leaveRequests.status,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.userId, users.id))
        .where(and(...whereConditions));

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    }),

  /**
   * Update annual leave entitlement for a user (admin only)
   * Allows setting custom entitlements (part-time staff, pro-rated amounts, etc.)
   */
  updateEntitlement: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        year: z.number().int().min(2020).max(2100),
        annualEntitlement: z.number().min(0).max(50), // Flexible for various contract types
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify user belongs to this tenant
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your organization",
        });
      }

      // Get or create leave balance for the year
      const [existingBalance] = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, input.userId),
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.year, input.year),
          ),
        );

      if (existingBalance) {
        // Update existing balance
        const [updated] = await db
          .update(leaveBalances)
          .set({
            annualEntitlement: input.annualEntitlement,
          })
          .where(
            and(
              eq(leaveBalances.userId, input.userId),
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.year, input.year),
            ),
          )
          .returning();

        return { success: true, balance: updated };
      }

      // Create new balance with custom entitlement
      const [created] = await db
        .insert(leaveBalances)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          tenantId,
          year: input.year,
          annualEntitlement: input.annualEntitlement,
          annualUsed: 0,
          sickUsed: 0,
          toilBalance: 0,
          carriedOver: 0,
        })
        .returning();

      return { success: true, balance: created };
    }),

  /**
   * Manually set carryover amount for a user (admin only)
   * Allows manual override of automatic carryover calculation
   */
  setCarryover: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        year: z.number().int().min(2020).max(2100),
        carriedOver: z.number().min(0).max(25), // Max 25 days carryover (flexible for edge cases)
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify user belongs to this tenant
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your organization",
        });
      }

      // Get or create leave balance for the year
      const [existingBalance] = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, input.userId),
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.year, input.year),
          ),
        );

      if (existingBalance) {
        // Update existing balance
        const entitlementDiff = input.carriedOver - (existingBalance.carriedOver ?? 0);
        const [updated] = await db
          .update(leaveBalances)
          .set({
            carriedOver: input.carriedOver,
            annualEntitlement:
              (existingBalance.annualEntitlement ?? 0) + entitlementDiff,
          })
          .where(
            and(
              eq(leaveBalances.userId, input.userId),
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.year, input.year),
            ),
          )
          .returning();

        return { success: true, balance: updated };
      }

      // Create new balance with carryover
      const [created] = await db
        .insert(leaveBalances)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          tenantId,
          year: input.year,
          annualEntitlement: 25 + input.carriedOver, // Default UK entitlement + carryover
          annualUsed: 0,
          sickUsed: 0,
          toilBalance: 0,
          carriedOver: input.carriedOver,
        })
        .returning();

      return { success: true, balance: created };
    }),

  /**
   * Run automatic carryover for a user (admin only)
   * Applies standard carryover logic (max 5 days) from previous year
   */
  runCarryover: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        fromYear: z.number().int().min(2020).max(2100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify user belongs to this tenant
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your organization",
        });
      }

      const result = await applyCarryover(
        input.userId,
        tenantId,
        input.fromYear,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to apply carryover",
        });
      }

      return {
        success: true,
        carriedDays: result.carriedDays,
        fromYear: input.fromYear,
        toYear: input.fromYear + 1,
      };
    }),
});
