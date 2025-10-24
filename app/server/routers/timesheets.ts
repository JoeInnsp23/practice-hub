import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
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
          name: "",
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

      // Validation: minimum hours check
      const minimumHours = 37.5; // TODO: Make configurable in settings
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
});
