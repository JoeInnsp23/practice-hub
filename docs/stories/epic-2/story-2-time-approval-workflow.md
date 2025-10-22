# User Story: Time Approval Workflow System

**Story ID:** STORY-2.2
**Epic:** Epic 2 - High-Impact Workflows
**Feature:** FR6 - Time Approval Workflow
**Priority:** High
**Effort:** 5-7 days
**Status:** Ready for Development

---

## User Story

**As a** staff member and manager
**I want** a manager approval workflow for timesheets with submission validation and email notifications
**So that** I can replace manual spreadsheet reconciliation and save 1.5 hours/week per manager

---

## Business Value

- **Efficiency:** Saves 1.5 hours/week per manager (eliminates manual spreadsheet reconciliation)
- **Accuracy:** Validates timesheet hours before approval (prevents incomplete submissions)
- **Accountability:** Creates audit trail for all timesheet approvals and rejections
- **Transparency:** Email notifications keep staff informed of approval status

---

## Acceptance Criteria

### Functional Requirements - Timesheet Submission

**AC1: Submit Week for Approval**
- **Given** a staff member has logged hours for a week
- **When** they click "Submit Week for Approval" button
- **Then** submission validation runs
- **And** if validation passes, timesheet submission is created with status "pending"
- **And** success toast message is shown: "Timesheet submitted for approval"

**AC2: Submission Validation - Minimum Hours**
- **Given** a staff member is submitting a week for approval
- **When** total hours for the week < 37.5 hours (configurable minimum)
- **Then** submission is blocked
- **And** error message is shown: "Minimum 37.5 hours required for submission"
- **And** validation highlights missing days

**AC3: Submission Validation - Duplicate Prevention**
- **Given** a staff member has already submitted a week for approval
- **When** they attempt to submit the same week again
- **Then** submission is blocked
- **And** error message is shown: "This week has already been submitted"

**AC4: Submission Display in Timesheet View**
- **Given** a week has been submitted for approval
- **When** the staff member views that week in timesheet
- **Then** a "Submitted" badge is shown
- **And** time entries are read-only (cannot edit submitted week)
- **And** submission status is displayed (pending/approved/rejected)

### Functional Requirements - Manager Approval Interface

**AC5: Manager Approvals Page**
- **Given** a manager navigates to `/client-hub/time/approvals`
- **When** the page loads
- **Then** all pending submissions for their reports are displayed
- **And** submissions show: user name, week dates, total hours, submitted date

**AC6: Individual Approval**
- **Given** a manager is viewing a pending submission
- **When** they click "Approve" button
- **Then** submission status changes to "approved"
- **And** approval timestamp and reviewer are recorded
- **And** staff member receives email notification: "Timesheet approved by [Manager]"
- **And** submission moves to "Approved" tab

**AC7: Individual Rejection**
- **Given** a manager is viewing a pending submission
- **When** they click "Reject" button
- **Then** rejection modal opens with comment textarea
- **And** manager enters rejection reason
- **And** submission status changes to "rejected"
- **And** staff member receives email notification with rejection reason
- **And** week becomes editable again for staff member

**AC8: Bulk Approve**
- **Given** a manager has selected multiple pending submissions
- **When** they click "Approve Selected" button
- **Then** all selected submissions are approved
- **And** email notifications are sent to all affected staff members
- **And** success toast shows: "3 timesheets approved"

**AC9: Bulk Reject**
- **Given** a manager has selected multiple pending submissions
- **When** they click "Reject Selected" button
- **Then** rejection modal opens with shared comment
- **And** all selected submissions are rejected with the same reason
- **And** email notifications are sent to all affected staff members

### Functional Requirements - Audit Trail

**AC10: Approval Audit Trail**
- **Given** a timesheet submission exists
- **When** status changes (submitted → approved/rejected → resubmitted)
- **Then** all status changes are recorded with timestamp and user
- **And** audit trail is viewable in submission detail
- **And** audit log includes: date, action, user, comments

**AC11: Resubmission Workflow**
- **Given** a timesheet was rejected
- **When** the staff member corrects and resubmits
- **Then** submission status changes to "resubmitted"
- **And** manager sees "Resubmitted" badge in approvals list
- **And** original rejection comments are preserved in history

### Functional Requirements - Email Notifications

**AC12: Approval Email Notification**
- **Given** a manager approves a timesheet
- **When** approval is recorded
- **Then** email is sent to staff member with:
  - Subject: "Timesheet Approved - Week of [dates]"
  - Body: Manager name, approval date, week dates, total hours
  - Link to view timesheet

**AC13: Rejection Email Notification**
- **Given** a manager rejects a timesheet
- **When** rejection is recorded
- **Then** email is sent to staff member with:
  - Subject: "Timesheet Rejected - Week of [dates]"
  - Body: Manager name, rejection reason, week dates
  - Link to edit and resubmit timesheet

**AC14: Manager Dashboard Widget**
- **Given** a manager has pending approvals
- **When** they view the dashboard
- **Then** "Pending Approvals" widget shows count
- **And** clicking widget navigates to approvals page

### Integration Requirements

**AC15: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** timesheet submissions are queried
- **Then** all queries filter by tenantId
- **And** managers only see submissions from their tenant

**AC16: Role-Based Access Control**
- **Given** a user without manager role attempts to access approvals page
- **When** they navigate to `/client-hub/time/approvals`
- **Then** they are redirected with error message
- **And** only users with role "manager", "admin", or "org:admin" can approve

### Quality Requirements

**AC17: Performance**
- **Given** a manager has 100 pending approvals
- **When** the approvals page loads
- **Then** page loads in <2 seconds
- **And** bulk actions complete in <5 seconds

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// timesheetSubmissions table
export const timesheetSubmissions = pgTable("timesheet_submissions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "rejected" | "resubmitted"
  totalHours: real("total_hours").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewerComments: text("reviewer_comments"),
}, (table) => ({
  // Unique constraint: prevent duplicate submissions for same week
  userWeekUnique: unique().on(table.userId, table.weekStartDate),
  // Indexes for query performance
  tenantIdIdx: index("timesheet_submissions_tenant_id_idx").on(table.tenantId),
  statusIdx: index("timesheet_submissions_status_idx").on(table.status),
  reviewerIdx: index("timesheet_submissions_reviewer_idx").on(table.reviewedBy),
}));

// Update timeEntries table with submission link
export const timeEntries = pgTable("time_entries", {
  // ... existing fields
  submissionId: text("submission_id").references(() => timesheetSubmissions.id),
  // ... other fields
});
```

### File Structure

```
app/client-hub/time/
  approvals/
    page.tsx                  # Manager approval interface
  page.tsx                    # Extend with submit button
components/client-hub/
  timesheet-submission-card.tsx  # Submission list item
  timesheet-reject-modal.tsx     # Rejection reason modal
  pending-approvals-widget.tsx   # Dashboard widget
lib/email/
  timesheet-notifications.ts     # Email templates for approval/rejection
```

### tRPC Procedures

```typescript
// app/server/routers/timesheets.ts

export const timesheetsRouter = router({
  // ... existing procedures

  // Submit week for approval
  submit: protectedProcedure
    .input(z.object({
      weekStartDate: z.string(), // ISO date
      weekEndDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Calculate total hours for week
      const entries = await db
        .select({ hours: sum(timeEntries.hours) })
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.tenantId, ctx.authContext.tenantId),
            eq(timeEntries.userId, ctx.authContext.userId),
            gte(timeEntries.date, input.weekStartDate),
            lte(timeEntries.date, input.weekEndDate)
          )
        );

      const totalHours = entries[0]?.hours || 0;

      // Validation: minimum hours check
      const minimumHours = 37.5; // TODO: Make configurable in settings
      if (totalHours < minimumHours) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum ${minimumHours} hours required for submission`,
        });
      }

      // Create submission
      const submissionId = crypto.randomUUID();
      await db.insert(timesheetSubmissions).values({
        id: submissionId,
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        weekStartDate: input.weekStartDate,
        weekEndDate: input.weekEndDate,
        status: "pending",
        totalHours,
      });

      // Link time entries to submission
      await db
        .update(timeEntries)
        .set({ submissionId })
        .where(
          and(
            eq(timeEntries.tenantId, ctx.authContext.tenantId),
            eq(timeEntries.userId, ctx.authContext.userId),
            gte(timeEntries.date, input.weekStartDate),
            lte(timeEntries.date, input.weekEndDate)
          )
        );

      return { success: true, submissionId };
    }),

  // Get pending approvals (manager only)
  getPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is manager/admin
      if (
        ctx.authContext.role !== "manager" &&
        ctx.authContext.role !== "admin" &&
        ctx.authContext.role !== "org:admin"
      ) {
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
            eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId),
            inArray(timesheetSubmissions.status, ["pending", "resubmitted"])
          )
        )
        .orderBy(desc(timesheetSubmissions.submittedAt));

      return submissions;
    }),

  // Approve submission
  approve: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check manager role
      if (
        ctx.authContext.role !== "manager" &&
        ctx.authContext.role !== "admin" &&
        ctx.authContext.role !== "org:admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Update submission
      const result = await db
        .update(timesheetSubmissions)
        .set({
          status: "approved",
          reviewedBy: ctx.authContext.userId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(timesheetSubmissions.id, input.submissionId),
            eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId)
          )
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
        managerName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
      });

      return { success: true };
    }),

  // Reject submission
  reject: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      comments: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check manager role
      if (
        ctx.authContext.role !== "manager" &&
        ctx.authContext.role !== "admin" &&
        ctx.authContext.role !== "org:admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Update submission
      const result = await db
        .update(timesheetSubmissions)
        .set({
          status: "rejected",
          reviewedBy: ctx.authContext.userId,
          reviewedAt: new Date(),
          reviewerComments: input.comments,
        })
        .where(
          and(
            eq(timesheetSubmissions.id, input.submissionId),
            eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Unlink time entries from submission (make editable again)
      await db
        .update(timeEntries)
        .set({ submissionId: null })
        .where(eq(timeEntries.submissionId, input.submissionId));

      // Send rejection email
      await sendTimesheetRejectionEmail({
        userId: result[0].userId,
        weekStartDate: result[0].weekStartDate,
        weekEndDate: result[0].weekEndDate,
        managerName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
        rejectionReason: input.comments,
      });

      return { success: true };
    }),

  // Bulk approve
  bulkApprove: protectedProcedure
    .input(z.object({ submissionIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      // Check manager role
      if (
        ctx.authContext.role !== "manager" &&
        ctx.authContext.role !== "admin" &&
        ctx.authContext.role !== "org:admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Bulk update
      await db
        .update(timesheetSubmissions)
        .set({
          status: "approved",
          reviewedBy: ctx.authContext.userId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            inArray(timesheetSubmissions.id, input.submissionIds),
            eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId)
          )
        );

      // TODO: Send bulk approval emails (queue job for performance)

      return { success: true, count: input.submissionIds.length };
    }),

  // Get submission status for week
  getSubmissionStatus: protectedProcedure
    .input(z.object({
      weekStartDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const submission = await db
        .select()
        .from(timesheetSubmissions)
        .where(
          and(
            eq(timesheetSubmissions.tenantId, ctx.authContext.tenantId),
            eq(timesheetSubmissions.userId, ctx.authContext.userId),
            eq(timesheetSubmissions.weekStartDate, input.weekStartDate)
          )
        )
        .limit(1);

      return submission.length > 0 ? submission[0] : null;
    }),
});
```

### Email Notification Templates

```typescript
// lib/email/timesheet-notifications.ts

export async function sendTimesheetApprovalEmail({
  userId,
  weekStartDate,
  weekEndDate,
  managerName,
}: {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  managerName: string;
}) {
  // Get user email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return;

  const subject = `Timesheet Approved - Week of ${weekStartDate}`;
  const body = `
    <h2>Timesheet Approved</h2>
    <p>Your timesheet for the week of ${weekStartDate} to ${weekEndDate} has been approved by ${managerName}.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client-hub/time">View Timesheet</a></p>
  `;

  await sendEmail({
    to: user[0].email,
    subject,
    html: body,
  });
}

export async function sendTimesheetRejectionEmail({
  userId,
  weekStartDate,
  weekEndDate,
  managerName,
  rejectionReason,
}: {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  managerName: string;
  rejectionReason: string;
}) {
  // Get user email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return;

  const subject = `Timesheet Rejected - Week of ${weekStartDate}`;
  const body = `
    <h2>Timesheet Rejected</h2>
    <p>Your timesheet for the week of ${weekStartDate} to ${weekEndDate} has been rejected by ${managerName}.</p>
    <p><strong>Reason:</strong> ${rejectionReason}</p>
    <p>Please review and resubmit your timesheet.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client-hub/time">Edit Timesheet</a></p>
  `;

  await sendEmail({
    to: user[0].email,
    subject,
    html: body,
  });
}
```

### Technical Notes

- **Unique Constraint:** Prevent duplicate submissions with unique constraint on (user_id, week_start_date)
- **Role-Based Access:** Only managers/admins can access approvals page
- **Audit Trail:** All status changes recorded with timestamp and reviewer
- **Email Notifications:** Use existing email notification system
- **Bulk Actions:** Batch update for performance with multiple submissions

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] timesheetSubmissions table created with unique constraint on (user_id, week_start_date)
- [ ] tRPC procedures created: submit, approve, reject, bulkApprove, getPendingApprovals, getSubmissionStatus
- [ ] Submit week button added to timesheet view (app/client-hub/time/page.tsx)
- [ ] Submission validation: minimum hours (37.5h) and duplicate prevention
- [ ] Manager approvals page created at `/client-hub/time/approvals`
- [ ] Pending submissions list with user name, week dates, total hours, submitted date
- [ ] Individual approve/reject actions functional
- [ ] Bulk approve/reject actions functional
- [ ] Rejection modal with comment textarea
- [ ] Email notifications sent for approvals and rejections
- [ ] Resubmission workflow functional (rejected → edited → resubmitted)
- [ ] Audit trail viewable in submission detail
- [ ] Manager dashboard widget showing pending approvals count
- [ ] Role-based access control (manager/admin only)
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Time entries become read-only when submitted
- [ ] Time entries become editable again when rejected
- [ ] Unit tests written for submit/approve/reject procedures
- [ ] Integration tests for email notifications
- [ ] E2E tests for full submission workflow
- [ ] Seed data updated with sample timesheet submissions
- [ ] Code reviewed with focus on authorization (manager role checks)
- [ ] Documentation updated: time approval workflow usage
- [ ] Performance benchmarks met (<2s page load, <5s bulk actions)
- [ ] No regressions in existing timesheet functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- None (independent of other stories)

**Downstream:**
- Epic 4: Staff Management TOIL tracking depends on timesheet approval (approved hours trigger TOIL accrual)

**External:**
- Email notification service (existing)

---

## Testing Strategy

### Unit Tests
- Test submission validation (minimum hours check)
- Test duplicate submission prevention
- Test approval status changes
- Test rejection comments storage
- Test bulk approve/reject operations
- Test multi-tenant isolation (submissions filtered by tenantId)

### Integration Tests
- Test submission creation links time entries
- Test approval email notification sent
- Test rejection email notification sent with comments
- Test resubmission workflow (rejected → resubmitted)
- Test manager role authorization

### E2E Tests
- Test full submission workflow: submit → approve → email received
- Test rejection workflow: submit → reject → edit → resubmit
- Test bulk approval of multiple submissions
- Test manager dashboard widget click navigation

---

## Risks & Mitigation

**Risk:** Edge cases not handled (partial weeks, holiday weeks, retroactive submissions)
**Mitigation:** Define clear business rules; implement validation for edge cases; get stakeholder input on policies
**Impact:** Medium - workflow may be rejected by users, requires rework

**Risk:** Email notification delays or failures
**Mitigation:** Queue email jobs asynchronously; retry failed sends; log email errors; consider in-app notifications as fallback
**Impact:** Low - users can still see status in app

**Risk:** Manager workload with too many pending approvals
**Mitigation:** Bulk approve actions; filters by date range; email digest of pending approvals
**Impact:** Low - bulk actions mitigate this

**Risk:** Time entry edit conflicts after submission
**Mitigation:** Make time entries read-only when submitted; only unlock on rejection
**Impact:** Low - clear UI indicators prevent confusion

---

## Notes

- Time approval saves 1.5 hours/week per manager (ROI metric from archived CRM usage data)
- Minimum hours configurable in settings (default 37.5h for full-time UK staff)
- Rejection unlocks time entries for editing (sets submissionId to null)
- Resubmission creates new submission record (preserves rejection history)
- TOIL accrual in Epic 4 depends on approved hours (integration point)
- Consider adding manager delegation (approve on behalf of) in Phase 2
- Email notification templates should match company branding (configurable)

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-2 - High-Impact Workflows
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR6)
