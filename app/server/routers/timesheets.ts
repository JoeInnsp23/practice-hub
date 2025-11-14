import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  leaveBalances,
  staffCapacity,
  timeEntries,
  timesheetSubmissions,
  users,
} from "@/lib/db/schema";
import {
  sendTimesheetApprovalEmail,
  sendTimesheetRejectionEmail,
} from "@/lib/email/timesheet-notifications";
import { protectedProcedure, router } from "../trpc";

/**
 * Helper function to accrue TOIL from approved timesheet
 * Calculates overtime based on logged hours vs contracted hours
 */
async function accrueToilFromTimesheet(
  timesheetId: string,
  userId: string,
  weekEndDate: string,
  totalHours: number,
  tenantId: string,
): Promise<void> {
  // Get user's contracted hours from staffCapacity
  const capacity = await db
    .select()
    .from(staffCapacity)
    .where(
      and(
        eq(staffCapacity.userId, userId),
        eq(staffCapacity.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (capacity.length === 0) {
    // No capacity record - skip TOIL accrual
    console.warn(
      `No staffCapacity record found for user ${userId} - skipping TOIL accrual`,
    );
    return;
  }

  const contractedHours = capacity[0].weeklyHours;
  const toilHours = Math.max(0, totalHours - contractedHours);

  // Only accrue TOIL if overtime was worked
  if (toilHours > 0) {
    // Import toil router at runtime to avoid circular dependency
    const { toilRouter } = await import("./toil");

    // Create caller context for internal procedure call
    const caller = toilRouter.createCaller({
      db,
      authContext: {
        userId,
        tenantId,
        role: "staff",
        email: "",
        firstName: null,
        lastName: null,
      },
      session: {
        user: {
          id: userId,
          email: "",
          emailVerified: false,
          name: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "internal-call",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId,
          expiresAt: new Date(Date.now() + 86400000),
          token: "internal-call-token",
          ipAddress: "127.0.0.1",
          userAgent: "internal",
        },
      },
      clientPortalSession: null,
      clientPortalAuthContext: null,
    });

    await caller.accrueToil({
      userId,
      timesheetId,
      weekEnding: weekEndDate,
      loggedHours: totalHours,
      contractedHours,
    });
  }
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function adjustToilBalance(
  tx: DbTransaction,
  {
    tenantId,
    userId,
    date,
    hours,
    operation,
  }: {
    tenantId: string;
    userId: string;
    date: string | Date;
    hours: number | string;
    operation: "deduct" | "refund";
  },
) {
  const numericHours =
    typeof hours === "string" ? Number.parseFloat(hours) : Number(hours);

  const hoursValue = Math.abs(numericHours);

  if (!Number.isFinite(hoursValue) || hoursValue === 0) {
    return;
  }

  const entryDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(entryDate.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date for TOIL adjustment.",
    });
  }

  const year = entryDate.getFullYear();

  const [balance] = await tx
    .select({ toilBalance: leaveBalances.toilBalance })
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.tenantId, tenantId),
        eq(leaveBalances.userId, userId),
        eq(leaveBalances.year, year),
      ),
    )
    .limit(1);

  const currentBalance = Number(balance?.toilBalance ?? 0);

  if (operation === "deduct") {
    if (currentBalance < hoursValue - 1e-6) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Insufficient TOIL balance. You have ${currentBalance.toFixed(
          2,
        )} hours available, but this entry requires ${hoursValue.toFixed(2)} hours.`,
      });
    }

    await tx
      .update(leaveBalances)
      .set({
        toilBalance: sql`${leaveBalances.toilBalance} - ${hoursValue}`,
      })
      .where(
        and(
          eq(leaveBalances.tenantId, tenantId),
          eq(leaveBalances.userId, userId),
          eq(leaveBalances.year, year),
        ),
      );

    return;
  }

  if (balance) {
    await tx
      .update(leaveBalances)
      .set({
        toilBalance: sql`${leaveBalances.toilBalance} + ${hoursValue}`,
      })
      .where(
        and(
          eq(leaveBalances.tenantId, tenantId),
          eq(leaveBalances.userId, userId),
          eq(leaveBalances.year, year),
        ),
      );
  } else {
    await tx.insert(leaveBalances).values({
      id: randomUUID(),
      tenantId,
      userId,
      year,
      annualEntitlement: 25,
      annualUsed: 0,
      sickUsed: 0,
      toilBalance: hoursValue,
      carriedOver: 0,
    });
  }
}

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

/**
 * Check if a time entry overlaps with existing entries for the same user on the same date
 * @param userId - User ID to check overlaps for
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param date - Date string (YYYY-MM-DD format)
 * @param startTime - Start time string (HH:MM format)
 * @param endTime - End time string (HH:MM format)
 * @param excludeEntryId - Optional entry ID to exclude (for update operations)
 * @returns Array of overlapping entry IDs
 */
async function checkTimeEntryOverlap(
  userId: string,
  tenantId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: string,
): Promise<string[]> {
  const overlappingEntries = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.tenantId, tenantId),
        eq(timeEntries.date, date),
        excludeEntryId
          ? sql`${timeEntries.id} != ${excludeEntryId}`
          : sql`true`,
        // Overlap condition: (start1 < end2) AND (end1 > start2)
        sql`${timeEntries.startTime} < ${endTime}`,
        sql`${timeEntries.endTime} > ${startTime}`,
      ),
    );

  return overlappingEntries.map((e) => e.id);
}

/**
 * Calculate total hours for a user on a specific date
 * @param userId - User ID
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param date - Date string (YYYY-MM-DD format)
 * @param excludeEntryId - Optional entry ID to exclude from total (for update operations)
 * @returns Total hours for the user on the specified date
 */
async function getDailyTotalHours(
  userId: string,
  tenantId: string,
  date: string,
  excludeEntryId?: string,
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(CAST(hours AS DECIMAL)), 0) as total_hours
    FROM time_entries
    WHERE user_id = ${userId}
      AND tenant_id = ${tenantId}
      AND date = ${date}
      ${excludeEntryId ? sql`AND id != ${excludeEntryId}` : sql``}
  `);

  return Number(result.rows[0]?.total_hours || 0);
}

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
      const { tenantId, userId: currentUserId, role } = ctx.authContext;
      const { startDate, endDate, userId, clientId, billable } = input;

      // Build conditions
      const conditions = [eq(timeEntries.tenantId, tenantId)];

      // Enforce user isolation: non-admin users can only see their own entries
      // Admin users can view any user's entries if userId is provided, otherwise see all
      if (role === "admin") {
        // Admin can view specific user's entries if userId is provided
        if (userId) {
          conditions.push(eq(timeEntries.userId, userId));
        }
        // Otherwise admin sees all entries (no userId filter)
      } else {
        // Non-admin users can ONLY see their own entries
        conditions.push(eq(timeEntries.userId, currentUserId));
      }

      if (startDate) {
        conditions.push(gte(timeEntries.date, startDate));
      }

      if (endDate) {
        conditions.push(lte(timeEntries.date, endDate));
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
      const { tenantId, userId, firstName, lastName} = ctx.authContext;

      // Validation: Check for overlaps and daily limits if startTime/endTime provided
      if (input.startTime && input.endTime) {
        // Validate endTime > startTime
        if (input.endTime <= input.startTime) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "End time must be after start time",
          });
        }

        // Check for overlapping entries
        const overlaps = await checkTimeEntryOverlap(
          userId,
          tenantId,
          input.date,
          input.startTime,
          input.endTime,
        );

        if (overlaps.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Time entry overlaps with ${overlaps.length} existing ${overlaps.length === 1 ? "entry" : "entries"}. Please adjust the time range.`,
          });
        }
      }

      // Check 24-hour daily limit
      const currentDayTotal = await getDailyTotalHours(
        userId,
        tenantId,
        input.date,
      );
      const newTotal = currentDayTotal + Number(input.hours);

      if (newTotal > 24) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot log ${input.hours}h. Daily total would be ${newTotal.toFixed(2)}h, exceeding 24-hour limit. Current total: ${currentDayTotal.toFixed(2)}h.`,
        });
      }

      const newEntry = await db.transaction(async (tx) => {
        const [createdEntry] = await tx
          .insert(timeEntries)
          .values({
            tenantId,
            userId,
            date: input.date,
            clientId: input.clientId,
            serviceId: input.serviceId,
            taskId: input.taskId,
            description: input.description,
            hours: input.hours,
            billable: input.billable,
            rate: input.rate,
            startTime: input.startTime,
            endTime: input.endTime,
            status: input.status,
            notes: input.notes,
            workType: input.workType,
            billed: input.billed,
            amount: input.amount,
            invoiceId: input.invoiceId,
            submissionId: input.submissionId,
            submittedAt: input.submittedAt,
            approvedById: input.approvedById,
            approvedAt: input.approvedAt,
          })
          .returning();

        if ((input.workType || "WORK").toUpperCase() === "TOIL") {
          await adjustToilBalance(tx, {
            tenantId,
            userId,
            date: input.date,
            hours: input.hours,
            operation: "deduct",
          });
        }

        await tx.insert(activityLogs).values({
          tenantId,
          module: "employee-hub",
          entityType: "timeEntry",
          entityId: createdEntry.id,
          action: "created",
          description: `Logged ${input.hours}h for ${input.description}`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            hours: input.hours,
            billable: input.billable,
          },
        });

        return createdEntry;
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
      const updatedEntry = await db.transaction(async (tx) => {
        const existingRows = await tx
          .select()
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.id, input.id),
              eq(timeEntries.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!existingRows[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Time entry not found",
          });
        }

        const existingEntry = existingRows[0];
        const entryUserId = existingEntry.userId;
        const previousWorkType = (
          existingEntry.workType || "WORK"
        ).toUpperCase();

        // Validation: Check overlaps and daily limits if time range is being changed
        const updatedStartTime =
          input.data.startTime ?? existingEntry.startTime;
        const updatedEndTime = input.data.endTime ?? existingEntry.endTime;
        const updatedDate = input.data.date ?? existingEntry.date;

        if (updatedStartTime && updatedEndTime) {
          // Validate endTime > startTime
          if (updatedEndTime <= updatedStartTime) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "End time must be after start time",
            });
          }

          // Check for overlaps (exclude current entry)
          const overlaps = await checkTimeEntryOverlap(
            entryUserId,
            tenantId,
            updatedDate,
            updatedStartTime,
            updatedEndTime,
            input.id, // Exclude self
          );

          if (overlaps.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Updated time entry would overlap with ${overlaps.length} existing ${overlaps.length === 1 ? "entry" : "entries"}.`,
            });
          }
        }

        // Check 24-hour daily limit
        const updatedHours = input.data.hours
          ? Number(input.data.hours)
          : Number(existingEntry.hours);
        const currentDayTotal = await getDailyTotalHours(
          entryUserId,
          tenantId,
          updatedDate,
          input.id, // Exclude current entry from total
        );
        const newTotal = currentDayTotal + updatedHours;

        if (newTotal > 24) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot update to ${updatedHours}h. Daily total would be ${newTotal.toFixed(2)}h, exceeding 24-hour limit.`,
          });
        }

        if (previousWorkType === "TOIL") {
          await adjustToilBalance(tx, {
            tenantId,
            userId: entryUserId,
            date: existingEntry.date,
            hours: existingEntry.hours,
            operation: "refund",
          });
        }

        const [newEntry] = await tx
          .update(timeEntries)
          .set({
            ...input.data,
            updatedAt: new Date(),
          })
          .where(eq(timeEntries.id, input.id))
          .returning();

        const updatedWorkType = (newEntry.workType || "WORK").toUpperCase();

        if (updatedWorkType === "TOIL") {
          await adjustToilBalance(tx, {
            tenantId,
            userId: entryUserId,
            date: newEntry.date,
            hours: newEntry.hours,
            operation: "deduct",
          });
        }

        await tx.insert(activityLogs).values({
          tenantId,
          module: "employee-hub",
          entityType: "timeEntry",
          entityId: input.id,
          action: "updated",
          description: `Updated time entry`,
          userId,
          userName: `${firstName} ${lastName}`,
          oldValues: existingEntry,
          newValues: input.data,
        });

        return newEntry;
      });

      return { success: true, timeEntry: updatedEntry };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;
      await db.transaction(async (tx) => {
        const existingRows = await tx
          .select()
          .from(timeEntries)
          .where(
            and(eq(timeEntries.id, id), eq(timeEntries.tenantId, tenantId)),
          )
          .limit(1);

        if (!existingRows[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Time entry not found",
          });
        }

        const existingEntry = existingRows[0];
        const entryUserId = existingEntry.userId;
        const existingWorkType = (
          existingEntry.workType || "WORK"
        ).toUpperCase();

        if (existingWorkType === "TOIL") {
          await adjustToilBalance(tx, {
            tenantId,
            userId: entryUserId,
            date: existingEntry.date,
            hours: existingEntry.hours,
            operation: "refund",
          });
        }

        await tx.delete(timeEntries).where(eq(timeEntries.id, id));

        await tx.insert(activityLogs).values({
          tenantId,
          module: "employee-hub",
          entityType: "timeEntry",
          entityId: id,
          action: "deleted",
          description: `Deleted time entry (${existingEntry.hours}h)`,
          userId,
          userName: `${firstName} ${lastName}`,
        });
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

  // Submit week for approval
  submit: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.string(), // ISO date
        weekEndDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Calculate total hours for week
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(CAST(hours AS DECIMAL)), 0) as total_hours
        FROM time_entries
        WHERE tenant_id = ${tenantId}
          AND user_id = ${userId}
          AND date >= ${input.weekStartDate}
          AND date <= ${input.weekEndDate}
      `);

      const totalHours = Number(result.rows[0]?.total_hours || 0);

      // Get user's minimum hours setting
      const userRecord = await db
        .select({
          timesheetMinWeeklyHours: users.timesheetMinWeeklyHours,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const minimumHours = userRecord[0]?.timesheetMinWeeklyHours ?? 37.5;

      // Validation: minimum hours check
      if (totalHours < minimumHours) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum ${minimumHours} hours required for submission`,
        });
      }

      // Check for duplicate submission
      const existingSubmission = await db
        .select()
        .from(timesheetSubmissions)
        .where(
          and(
            eq(timesheetSubmissions.tenantId, tenantId),
            eq(timesheetSubmissions.userId, userId),
            eq(timesheetSubmissions.weekStartDate, input.weekStartDate),
          ),
        )
        .limit(1);

      if (
        existingSubmission.length > 0 &&
        existingSubmission[0].status === "pending"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This week has already been submitted",
        });
      }

      // Create submission
      const [newSubmission] = await db
        .insert(timesheetSubmissions)
        .values({
          tenantId,
          userId,
          weekStartDate: input.weekStartDate,
          weekEndDate: input.weekEndDate,
          status: existingSubmission.length > 0 ? "resubmitted" : "pending",
          totalHours: totalHours.toString(),
        })
        .returning();

      // Link time entries to submission
      await db.execute(sql`
        UPDATE time_entries
        SET submission_id = ${newSubmission.id}
        WHERE tenant_id = ${tenantId}
          AND user_id = ${userId}
          AND date >= ${input.weekStartDate}
          AND date <= ${input.weekEndDate}
      `);

      return { success: true, submissionId: newSubmission.id };
    }),

  // Get pending approvals (manager only)
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId, role } = ctx.authContext;

    // Check if user is manager/admin
    if (role !== "manager" && role !== "admin" && role !== "org:admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const submissions = await db
      .select({
        id: timesheetSubmissions.id,
        weekStartDate: timesheetSubmissions.weekStartDate,
        weekEndDate: timesheetSubmissions.weekEndDate,
        totalHours: timesheetSubmissions.totalHours,
        submittedAt: timesheetSubmissions.submittedAt,
        status: timesheetSubmissions.status,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(timesheetSubmissions)
      .innerJoin(users, eq(timesheetSubmissions.userId, users.id))
      .where(
        and(
          eq(timesheetSubmissions.tenantId, tenantId),
          inArray(timesheetSubmissions.status, ["pending", "resubmitted"]),
        ),
      )
      .orderBy(desc(timesheetSubmissions.submittedAt));

    return submissions;
  }),

  // Approve submission
  approve: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName, role } = ctx.authContext;

      // Check manager role
      if (role !== "manager" && role !== "admin" && role !== "org:admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Update submission
      const result = await db
        .update(timesheetSubmissions)
        .set({
          status: "approved",
          reviewedBy: userId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(timesheetSubmissions.id, input.submissionId),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Send approval email
      await sendTimesheetApprovalEmail({
        userId: result[0].userId,
        weekStartDate: result[0].weekStartDate,
        weekEndDate: result[0].weekEndDate,
        managerName: `${firstName} ${lastName}`,
        totalHours: Number(result[0].totalHours),
      });

      // TOIL Accrual: Calculate and accrue TOIL if overtime worked
      await accrueToilFromTimesheet(
        result[0].id,
        result[0].userId,
        result[0].weekEndDate,
        Number(result[0].totalHours),
        tenantId,
      );

      return { success: true };
    }),

  // Reject submission
  reject: protectedProcedure
    .input(
      z.object({
        submissionId: z.string(),
        comments: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName, role } = ctx.authContext;

      // Check manager role
      if (role !== "manager" && role !== "admin" && role !== "org:admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Update submission
      const result = await db
        .update(timesheetSubmissions)
        .set({
          status: "rejected",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewerComments: input.comments,
        })
        .where(
          and(
            eq(timesheetSubmissions.id, input.submissionId),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Unlink time entries from submission (make editable again)
      await db.execute(sql`
        UPDATE time_entries
        SET submission_id = NULL
        WHERE submission_id = ${input.submissionId}
      `);

      // Send rejection email
      await sendTimesheetRejectionEmail({
        userId: result[0].userId,
        weekStartDate: result[0].weekStartDate,
        weekEndDate: result[0].weekEndDate,
        managerName: `${firstName} ${lastName}`,
        rejectionReason: input.comments,
      });

      return { success: true };
    }),

  // Bulk approve
  bulkApprove: protectedProcedure
    .input(z.object({ submissionIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName, role } = ctx.authContext;

      // Check manager role
      if (role !== "manager" && role !== "admin" && role !== "org:admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get submissions before updating
      const submissions = await db
        .select()
        .from(timesheetSubmissions)
        .where(
          and(
            inArray(timesheetSubmissions.id, input.submissionIds),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        );

      // Bulk update
      await db
        .update(timesheetSubmissions)
        .set({
          status: "approved",
          reviewedBy: userId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            inArray(timesheetSubmissions.id, input.submissionIds),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        );

      // Send emails for each approved submission
      await Promise.all(
        submissions.map((submission) =>
          sendTimesheetApprovalEmail({
            userId: submission.userId,
            weekStartDate: submission.weekStartDate,
            weekEndDate: submission.weekEndDate,
            managerName: `${firstName} ${lastName}`,
            totalHours: Number(submission.totalHours),
          }),
        ),
      );

      // TOIL Accrual: Process TOIL for each approved submission
      await Promise.all(
        submissions.map((submission) =>
          accrueToilFromTimesheet(
            submission.id,
            submission.userId,
            submission.weekEndDate,
            Number(submission.totalHours),
            tenantId,
          ),
        ),
      );

      return { success: true, count: input.submissionIds.length };
    }),

  // Bulk reject
  bulkReject: protectedProcedure
    .input(
      z.object({
        submissionIds: z.array(z.string()),
        comments: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName, role } = ctx.authContext;

      // Check manager role
      if (role !== "manager" && role !== "admin" && role !== "org:admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get submissions before updating
      const submissions = await db
        .select()
        .from(timesheetSubmissions)
        .where(
          and(
            inArray(timesheetSubmissions.id, input.submissionIds),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        );

      // Bulk update
      await db
        .update(timesheetSubmissions)
        .set({
          status: "rejected",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewerComments: input.comments,
        })
        .where(
          and(
            inArray(timesheetSubmissions.id, input.submissionIds),
            eq(timesheetSubmissions.tenantId, tenantId),
          ),
        );

      // Unlink time entries from all rejected submissions
      await db
        .update(timeEntries)
        .set({ submissionId: null })
        .where(inArray(timeEntries.submissionId, input.submissionIds));

      // Send emails for each rejected submission
      await Promise.all(
        submissions.map((submission) =>
          sendTimesheetRejectionEmail({
            userId: submission.userId,
            weekStartDate: submission.weekStartDate,
            weekEndDate: submission.weekEndDate,
            managerName: `${firstName} ${lastName}`,
            rejectionReason: input.comments,
          }),
        ),
      );

      return { success: true, count: input.submissionIds.length };
    }),

  // Get submission status for week
  getSubmissionStatus: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      const submission = await db
        .select()
        .from(timesheetSubmissions)
        .where(
          and(
            eq(timesheetSubmissions.tenantId, tenantId),
            eq(timesheetSubmissions.userId, userId),
            eq(timesheetSubmissions.weekStartDate, input.weekStartDate),
          ),
        )
        .limit(1);

      return submission.length > 0 ? submission[0] : null;
    }),

  // Get time entries for a specific week
  getWeek: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.string(), // ISO date (YYYY-MM-DD)
        weekEndDate: z.string(), // ISO date (YYYY-MM-DD)
        userId: z.string().optional(), // Optional: filter by specific user (for manager view)
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx.authContext;
      const targetUserId = input.userId || currentUserId;

      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, tenantId),
            eq(timeEntries.userId, targetUserId),
            gte(timeEntries.date, input.weekStartDate),
            lte(timeEntries.date, input.weekEndDate),
          ),
        )
        .orderBy(timeEntries.date, timeEntries.createdAt);

      return entries;
    }),

  // Copy previous week's time entries to current week
  copyPreviousWeek: protectedProcedure
    .input(
      z.object({
        currentWeekStartDate: z.string(), // ISO date for current week Monday
        currentWeekEndDate: z.string(), // ISO date for current week Sunday
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Calculate previous week dates (7 days earlier)
      const prevWeekStart = new Date(input.currentWeekStartDate);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];

      const prevWeekEnd = new Date(input.currentWeekEndDate);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
      const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];

      // Get previous week's entries
      const previousEntries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, tenantId),
            eq(timeEntries.userId, userId),
            gte(timeEntries.date, prevWeekStartStr),
            lte(timeEntries.date, prevWeekEndStr),
          ),
        );

      if (previousEntries.length === 0) {
        return { success: true, entriesCopied: 0 };
      }

      // Copy entries with adjusted dates (maintain day-of-week)
      const newEntries = previousEntries.map((entry) => {
        const entryDate = new Date(entry.date);
        const adjustedDate = new Date(entryDate);
        adjustedDate.setDate(adjustedDate.getDate() + 7); // Move forward 7 days

        return {
          tenantId,
          userId,
          clientId: entry.clientId,
          taskId: entry.taskId,
          serviceId: entry.serviceId,
          date: adjustedDate.toISOString().split("T")[0],
          startTime: entry.startTime,
          endTime: entry.endTime,
          hours: entry.hours,
          workType: entry.workType,
          billable: entry.billable,
          billed: false, // Reset billed status for new entries
          rate: entry.rate,
          amount: entry.amount,
          description: entry.description,
          notes: entry.notes,
          status: "draft" as const, // Always create as draft
          submissionId: null, // Not part of any submission yet
          submittedAt: null,
          approvedById: null,
          approvedAt: null,
          metadata: entry.metadata,
        };
      });

      // Bulk insert copied entries
      await db.insert(timeEntries).values(newEntries);

      return { success: true, entriesCopied: newEntries.length };
    }),

  // Get weekly summary with work type breakdown
  getWeeklySummary: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        weekEndDate: z.string(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx.authContext;
      const targetUserId = input.userId || currentUserId;

      // Get all entries for week
      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, tenantId),
            eq(timeEntries.userId, targetUserId),
            gte(timeEntries.date, input.weekStartDate),
            lte(timeEntries.date, input.weekEndDate),
          ),
        );

      // Calculate total hours and billable hours
      const totalHours = entries.reduce(
        (sum, entry) => sum + Number(entry.hours),
        0,
      );
      const billableHours = entries
        .filter((entry) => entry.billable)
        .reduce((sum, entry) => sum + Number(entry.hours), 0);

      // Calculate billable percentage
      const billablePercentage =
        totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

      // Group by work type
      const workTypeBreakdown = entries.reduce(
        (acc, entry) => {
          const workType = entry.workType || "WORK";
          if (!acc[workType]) {
            acc[workType] = 0;
          }
          acc[workType] += Number(entry.hours);
          return acc;
        },
        {} as Record<string, number>,
      );

      // Convert to array for pie chart
      const workTypeData = Object.entries(workTypeBreakdown).map(
        ([name, hours]) => ({
          name,
          hours,
          percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0,
        }),
      );

      return {
        totalHours,
        billableHours,
        nonBillableHours: totalHours - billableHours,
        billablePercentage,
        workTypeBreakdown: workTypeData,
        entriesCount: entries.length,
      };
    }),
});
