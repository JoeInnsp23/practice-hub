# User Story: Client CSV Import & Task Reassignment

**Story ID:** STORY-2.5
**Epic:** Epic 2 - High-Impact Workflows
**Feature:** FR11 (Client CSV Import) + FR12 (Task Reassignment)
**Priority:** High
**Effort:** 4-5 days
**Status:** Ready for Development

---

## User Story

**As a** staff member and administrator
**I want** client CSV import with comprehensive validation and task reassignment with history tracking
**So that** I can rapidly onboard practice firms (100+ clients) and balance workload across staff

---

## Business Value

- **Onboarding Speed:** Import 100+ clients in <30 seconds (vs. days of manual entry)
- **Data Quality:** Comprehensive validation prevents bad data (email, VAT, Companies House)
- **Workload Balancing:** Task reassignment enables efficient staff resource allocation
- **Accountability:** Assignment history provides audit trail for workload changes

---

## Acceptance Criteria

### Functional Requirements - Client CSV Import (FR11)

**AC1: Client CSV Template Structure**
- **Given** an admin downloads client CSV template
- **When** the template is opened
- **Then** headers include: `company_name`, `client_code`, `email`, `phone`, `vat_number`, `companies_house_number`, `client_type`, `status`, `street_address`, `city`, `postcode`, `country`, `client_manager_email`
- **And** template includes example row with sample data
- **And** template includes comments row with field descriptions

**AC2: Email Format Validation**
- **Given** a client CSV row has email field
- **When** validation runs
- **Then** email is validated with regex: `/^[\w.-]+@[\w.-]+\.\w+$/`
- **And** invalid emails are flagged with error: "Row X: Invalid email format"

**AC3: VAT Number Format Validation**
- **Given** a client CSV row has VAT number
- **When** validation runs
- **Then** UK VAT format is validated: `GB` followed by 9-12 digits
- **And** invalid VAT numbers are flagged with error: "Row X: Invalid VAT number format"

**AC4: Companies House Number Validation**
- **Given** a client CSV row has Companies House number
- **When** validation runs
- **Then** length is validated (exactly 8 characters)
- **And** optional API lookup verifies company exists (Phase 2)
- **And** invalid numbers are flagged with error: "Row X: Companies House number must be 8 characters"

**AC5: Date Format Parsing**
- **Given** a client CSV row has date fields
- **When** parsing runs
- **Then** multiple date formats are supported: `DD/MM/YYYY`, `YYYY-MM-DD`, `MM/DD/YYYY`
- **And** dates are converted to ISO format for database storage
- **And** unparseable dates are flagged with error: "Row X: Invalid date format"

**AC6: Duplicate Detection**
- **Given** a client CSV row has email or Companies House number
- **When** duplicate check runs
- **Then** existing clients are checked by email and Companies House number
- **And** duplicates are flagged with options: "Skip" or "Update"
- **And** import summary shows: "3 skipped (duplicates)"

**AC7: Client Manager Assignment**
- **Given** a client CSV row has client_manager_email
- **When** validation runs
- **Then** user is looked up by email within tenant
- **And** if user exists, client is assigned to that manager
- **And** if user doesn't exist, error is flagged: "Row X: Manager email not found"

**AC8: Client Type Validation**
- **Given** a client CSV row has client_type
- **When** validation runs
- **Then** value must match enum: `individual`, `company`, `partnership`, `trust`
- **And** invalid types are flagged with error: "Row X: Invalid client type"

**AC9: Status Validation**
- **Given** a client CSV row has status
- **When** validation runs
- **Then** value must match enum: `lead`, `prospect`, `active`, `inactive`
- **And** invalid statuses are flagged with error: "Row X: Invalid status"
- **And** if status is missing, defaults to `active`

**AC10: Bulk Client Creation**
- **Given** CSV validation passes
- **When** import is confirmed
- **Then** all clients are created in database transaction
- **And** tenantId is auto-added from auth context
- **And** client codes are generated using sequential pattern (not Math.random())

**AC11: Import Preview**
- **Given** a CSV file is uploaded
- **When** "Preview Import" button is clicked
- **Then** first 5 rows are displayed as preview
- **And** validation results are shown for preview rows
- **And** no database writes occur (dry run mode)

**AC12: Import Summary**
- **Given** import completes
- **When** results are displayed
- **Then** summary shows:
  - "45 clients imported successfully"
  - "3 skipped (duplicates)"
  - "2 errors" (with row numbers and error messages)
- **And** import log is created in importLogs table

### Functional Requirements - Task Reassignment (FR12)

**AC13: Task Reassignment Modal**
- **Given** a user clicks "Reassign" on a task
- **When** the reassignment modal opens
- **Then** user selection dropdown is displayed (tenant users only)
- **And** change reason textarea is displayed (optional, max 500 chars)
- **And** assignment type selection is displayed: `preparer`, `reviewer`, `assigned_to`

**AC14: User Selection Dropdown**
- **Given** the reassignment modal is open
- **When** the user clicks user dropdown
- **Then** all tenant users are displayed (searchable)
- **And** current assignee is highlighted
- **And** selecting a user populates the reassignment form

**AC15: Assignment Type Selection**
- **Given** the reassignment modal is open
- **When** the user selects assignment type
- **Then** options are: `Preparer`, `Reviewer`, `Assigned To`
- **And** selecting a type determines which task field is updated

**AC16: Reassignment Button in Task Detail**
- **Given** a user is viewing task detail page
- **When** the page loads
- **Then** "Reassign" button is visible in action bar
- **And** clicking button opens reassignment modal

**AC17: Individual Task Reassignment**
- **Given** reassignment form is filled
- **When** user clicks "Reassign Task"
- **Then** task assignment is updated (preparer/reviewer/assignedTo field)
- **And** taskAssignmentHistory record is created
- **And** notifications are sent to old and new assignees
- **And** success toast is shown: "Task reassigned to John Smith"

**AC18: Bulk Task Reassignment**
- **Given** multiple tasks are selected in task list
- **When** user clicks "Reassign Selected" button
- **Then** bulk reassignment modal opens
- **And** all selected tasks are reassigned to chosen user
- **And** assignment history records are created for all tasks
- **And** notifications are sent to affected users

**AC19: Notifications to Assignees**
- **Given** a task is reassigned
- **When** reassignment completes
- **Then** old assignee receives notification: "Task #123 reassigned to John"
- **And** new assignee receives notification: "Task #123 assigned to you by Manager"
- **And** notifications link to task detail page

**AC20: Assignment History View**
- **Given** a task has been reassigned
- **When** the task detail page is viewed
- **Then** "Assignment History" section is displayed
- **And** timeline shows all reassignments with:
  - Date/time, from user, to user, changed by user, reason
- **And** history is ordered newest first

**AC21: Prevent Self-Reassignment**
- **Given** a user is reassigning a task
- **When** they select the current assignee
- **Then** validation error is shown: "Cannot reassign to current assignee"
- **And** reassignment is blocked

### Integration Requirements

**AC22: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** clients are imported or tasks are reassigned
- **Then** all queries filter by tenantId
- **And** tenants cannot reassign tasks across tenant boundaries

**AC23: Assignment History Integration**
- **Given** task assignment history exists
- **When** task activity timeline is viewed
- **Then** reassignment events appear in timeline with other task events
- **And** events show: date, action, user, assignee change

### Quality Requirements

**AC24: Performance**
- **Given** 100 clients are imported
- **When** performance is measured
- **Then** import completes in <30 seconds
- **And** validation completes in <5 seconds

**AC25: Client Code Generation**
- **Given** clients are imported without client codes
- **When** import runs
- **Then** client codes are generated using sequential pattern
- **And** codes use deterministic suffix (not Math.random())
- **And** codes are unique within tenant (no collisions)

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// taskAssignmentHistory table
export const taskAssignmentHistory = pgTable("task_assignment_history", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  taskId: text("task_id").references(() => tasks.id).notNull(),
  fromUserId: text("from_user_id").references(() => users.id), // null for first assignment
  toUserId: text("to_user_id").references(() => users.id).notNull(),
  changedBy: text("changed_by").references(() => users.id).notNull(),
  changeReason: text("change_reason"),
  assignmentType: text("assignment_type").notNull(), // "preparer" | "reviewer" | "assigned_to"
  changedAt: timestamp("changed_at").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("task_assignment_history_task_id_idx").on(table.taskId),
  tenantIdIdx: index("task_assignment_history_tenant_id_idx").on(table.tenantId),
}));
```

### File Structure

```
lib/services/
  client-import-validator.ts  # Client CSV validation
app/api/
  templates/
    clients/
      route.ts                # Client CSV template download
components/client-hub/
  task-reassignment-modal.tsx # Task reassignment UI
  task-assignment-history.tsx # Assignment history timeline
```

### Client Import Validator

```typescript
// lib/services/client-import-validator.ts

import { z } from "zod";

export const clientImportRowSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  client_code: z.string().optional(), // Generated if missing
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  vat_number: z
    .string()
    .regex(/^GB\d{9,12}$/, "VAT number must be GB followed by 9-12 digits")
    .optional(),
  companies_house_number: z
    .string()
    .length(8, "Companies House number must be 8 characters")
    .optional(),
  client_type: z.enum(["individual", "company", "partnership", "trust"]),
  status: z.enum(["lead", "prospect", "active", "inactive"]).default("active"),
  street_address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("United Kingdom"),
  client_manager_email: z.string().email().optional(),
});

export type ClientImportRow = z.infer<typeof clientImportRowSchema>;

export async function validateClientRow(
  row: any,
  tenantId: string
): Promise<{ valid: boolean; errors: string[]; managerId?: string }> {
  const result = clientImportRowSchema.safeParse(row);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  // Check for duplicate by email or Companies House number
  const duplicateCheck = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        or(
          eq(clients.email, result.data.email),
          result.data.companies_house_number
            ? eq(clients.companiesHouseNumber, result.data.companies_house_number)
            : undefined
        )
      )
    )
    .limit(1);

  if (duplicateCheck.length > 0) {
    return {
      valid: false,
      errors: ["Duplicate client (email or Companies House number already exists)"],
    };
  }

  // Look up client manager by email
  let managerId: string | undefined;
  if (result.data.client_manager_email) {
    const manager = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.email, result.data.client_manager_email)
        )
      )
      .limit(1);

    if (manager.length === 0) {
      return {
        valid: false,
        errors: [`Manager email not found: ${result.data.client_manager_email}`],
      };
    }

    managerId = manager[0].id;
  }

  return { valid: true, errors: [], managerId };
}
```

### tRPC Procedures

```typescript
// app/server/routers/tasks.ts

export const tasksRouter = router({
  // ... existing procedures

  // Reassign task
  reassign: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      toUserId: z.string(),
      assignmentType: z.enum(["preparer", "reviewer", "assigned_to"]),
      changeReason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current task assignment
      const task = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.taskId),
            eq(tasks.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (task.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Prevent self-reassignment
      const currentAssigneeId =
        input.assignmentType === "preparer"
          ? task[0].preparerId
          : input.assignmentType === "reviewer"
            ? task[0].reviewerId
            : task[0].assignedTo;

      if (currentAssigneeId === input.toUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reassign to current assignee",
        });
      }

      // Update task assignment
      const updateField =
        input.assignmentType === "preparer"
          ? { preparerId: input.toUserId }
          : input.assignmentType === "reviewer"
            ? { reviewerId: input.toUserId }
            : { assignedTo: input.toUserId };

      await db
        .update(tasks)
        .set(updateField)
        .where(eq(tasks.id, input.taskId));

      // Create assignment history record
      await db.insert(taskAssignmentHistory).values({
        id: crypto.randomUUID(),
        tenantId: ctx.authContext.tenantId,
        taskId: input.taskId,
        fromUserId: currentAssigneeId,
        toUserId: input.toUserId,
        changedBy: ctx.authContext.userId,
        changeReason: input.changeReason,
        assignmentType: input.assignmentType,
      });

      // Send notifications
      if (currentAssigneeId) {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          tenantId: ctx.authContext.tenantId,
          userId: currentAssigneeId,
          type: "task_reassigned",
          title: "Task reassigned",
          message: `Task #${task[0].title} has been reassigned`,
          link: `/client-hub/tasks/${input.taskId}`,
          read: false,
        });
      }

      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        tenantId: ctx.authContext.tenantId,
        userId: input.toUserId,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `Task #${task[0].title} has been assigned to you by ${ctx.authContext.firstName}`,
        link: `/client-hub/tasks/${input.taskId}`,
        read: false,
      });

      return { success: true };
    }),

  // Bulk reassign tasks
  bulkReassign: protectedProcedure
    .input(z.object({
      taskIds: z.array(z.string()),
      toUserId: z.string(),
      assignmentType: z.enum(["preparer", "reviewer", "assigned_to"]),
      changeReason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Reassign all tasks in transaction
      await db.transaction(async (tx) => {
        for (const taskId of input.taskIds) {
          // Reuse individual reassign logic
          // ... (similar to reassign procedure)
        }
      });

      return { success: true, count: input.taskIds.length };
    }),

  // Get assignment history
  getAssignmentHistory: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await db
        .select({
          id: taskAssignmentHistory.id,
          changedAt: taskAssignmentHistory.changedAt,
          assignmentType: taskAssignmentHistory.assignmentType,
          changeReason: taskAssignmentHistory.changeReason,
          fromUser: {
            id: fromUser.id,
            firstName: fromUser.firstName,
            lastName: fromUser.lastName,
          },
          toUser: {
            id: toUser.id,
            firstName: toUser.firstName,
            lastName: toUser.lastName,
          },
          changedBy: {
            id: changedByUser.id,
            firstName: changedByUser.firstName,
            lastName: changedByUser.lastName,
          },
        })
        .from(taskAssignmentHistory)
        .leftJoin(users.as("fromUser"), eq(taskAssignmentHistory.fromUserId, fromUser.id))
        .innerJoin(users.as("toUser"), eq(taskAssignmentHistory.toUserId, toUser.id))
        .innerJoin(users.as("changedByUser"), eq(taskAssignmentHistory.changedBy, changedByUser.id))
        .where(
          and(
            eq(taskAssignmentHistory.tenantId, ctx.authContext.tenantId),
            eq(taskAssignmentHistory.taskId, input.taskId)
          )
        )
        .orderBy(desc(taskAssignmentHistory.changedAt));

      return history;
    }),
});
```

### Technical Notes

- **Client Code Generation:** Reuse sequential pattern from Epic 1 STORY-3 (no Math.random())
- **Duplicate Detection:** Check by email OR Companies House number (both should be unique)
- **Papa Parse:** Reuse CSV parser from STORY-2.4 bulk import infrastructure
- **Assignment History:** Store all reassignments with from/to user for audit trail
- **Notification Integration:** Use existing notification system for reassignment alerts

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] taskAssignmentHistory table created with indexes
- [ ] Client CSV template download endpoint at `/api/templates/clients`
- [ ] Client import validator with email, VAT, Companies House validation
- [ ] Date format parsing (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
- [ ] Duplicate detection by email and Companies House number
- [ ] Client manager assignment by email lookup
- [ ] Client type and status validation (enum checks)
- [ ] Bulk client creation with tenantId enforcement
- [ ] Import preview (dry run mode) functional
- [ ] Import summary with counts (imported, skipped, errors)
- [ ] Task reassignment modal component created
- [ ] User selection dropdown (tenant users, searchable)
- [ ] Assignment type selection (preparer/reviewer/assigned_to)
- [ ] Reassignment button in task detail page
- [ ] Individual task reassignment functional
- [ ] Bulk task reassignment functional
- [ ] Notifications sent to old and new assignees
- [ ] Assignment history view in task detail
- [ ] Self-reassignment prevention validation
- [ ] Assignment history integrated in activity timeline
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Client codes generated using sequential pattern (not Math.random())
- [ ] Unit tests written for client import validator and task reassignment
- [ ] Integration tests for CSV import and reassignment workflow
- [ ] E2E tests for client import and bulk task reassignment
- [ ] Seed data updated with sample assignment history
- [ ] Code reviewed with focus on validation and notification delivery
- [ ] Documentation updated: client CSV template guide, task reassignment workflow
- [ ] Performance benchmarks met (<30s for 100 client import)
- [ ] No regressions in existing functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- Epic 1 STORY-3: Client code generation pattern (sequential, not Math.random())
- Epic 2 STORY-4: Bulk import infrastructure (CSV parser, validation framework)

**Downstream:**
- None

**External:**
- Papa Parse library (already installed in STORY-2.4)

---

## Testing Strategy

### Unit Tests
- Test client import validation (email, VAT, Companies House formats)
- Test date format parsing (multiple formats)
- Test duplicate detection by email and Companies House number
- Test client manager lookup by email
- Test task reassignment with history record creation
- Test self-reassignment prevention
- Test multi-tenant isolation (clients/tasks filtered by tenantId)

### Integration Tests
- Test client CSV import with valid and invalid rows
- Test import summary accuracy (imported, skipped, errors counts)
- Test task reassignment creates history and sends notifications
- Test bulk task reassignment transaction rollback on error

### E2E Tests
- Test client CSV import: upload → preview → import → verify in database
- Test task reassignment: select task → reassign → verify assignment and history
- Test bulk task reassignment: select multiple → reassign → verify all updated

---

## Risks & Mitigation

**Risk:** Client code generation collisions during bulk import
**Mitigation:** Use database transaction with unique constraint; retry on collision; test with concurrent imports
**Impact:** Low - collision handling ensures uniqueness

**Risk:** Duplicate detection edge cases (case sensitivity, whitespace)
**Mitigation:** Normalize email to lowercase and trim whitespace before comparison
**Impact:** Low - edge cases handled with normalization

**Risk:** Reassignment notifications spam users
**Mitigation:** Batch notifications for bulk reassignments; user preference for notification delivery
**Impact:** Low - users can disable notifications in settings

**Risk:** Assignment history grows large for frequently reassigned tasks
**Mitigation:** Paginate history view if >20 records; no automatic cleanup (audit trail)
**Impact:** Low - pagination handles large histories

---

## Notes

- **Client Import Extends STORY-2.4:** Reuses CSV parser and validation framework from bulk import infrastructure
- **Client Code Pattern:** Reuses sequential generation from Epic 1 STORY-3 (fixes Math.random() bug)
- **HMRC VAT Validation:** Optionally reuse VAT validation from Epic 1 STORY-2 (Phase 2)
- **Companies House Lookup:** Optionally reuse Companies House API from Epic 1 STORY-3 (Phase 2)
- **Assignment History:** Provides audit trail for compliance and workload analysis
- **Bulk Reassignment:** Enables efficient workload rebalancing (e.g., reassign 20 tasks when staff leaves)
- **CSV Template:** Downloadable template with example data helps users prepare imports correctly

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-2 - High-Impact Workflows
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR11 + FR12)
