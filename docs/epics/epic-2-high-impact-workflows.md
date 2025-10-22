# Epic 2: High-Impact Workflows - Brownfield Enhancement

**Epic ID:** EPIC-2
**Status:** Draft
**Tier:** 2
**Estimated Effort:** 15-25 days
**Priority:** High
**Created:** 2025-10-22

---

## Epic Goal

Implement high-impact workflow features including task notes/comments, time approval workflows, settings persistence, bulk import infrastructure, and task reassignment to restore time-saving automation from archived CRM and unlock staff productivity.

---

## Epic Description

### Existing System Context

**Current State:**
- Practice Hub has core task management, timesheet tracking, and settings UI
- Task detail page has comment skeleton UI (task-details.tsx:874-918) but zero backend
- Settings router fully implemented (settings.ts:19-167) but UI never calls it (0% save success rate)
- Bulk import modal exists (DataImportModal component) but calls non-existent API endpoints (404 errors)
- No task reassignment functionality exists
- No time approval workflow (currently manual spreadsheet reconciliation)

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy
- Notifications: react-hot-toast for UI feedback

**Integration Points:**
- tRPC routers: tasks.ts, timesheets.ts, settings.ts, new bulk import router
- Task detail component: app/client-hub/tasks/[id]/task-details.tsx
- Settings page: app/client-hub/settings/page.tsx
- Database schema: taskNotes, timesheetSubmissions, integrationSettings, userSettings tables

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 8 high-impact workflow features (13 individual capabilities):

1. **Task Notes & Comments System (FR5)** - 2 features
   - Thread-based commenting with @mentions
   - Notification integration for mentioned users
   - **Status:** UI skeleton exists, zero backend
   - **Value:** Eliminates email/Slack fragmentation

2. **Time Approval Workflow (FR6)** - 5 features
   - Submit week for approval with validation
   - Manager approval interface with bulk actions
   - Approval/rejection with comments and audit trail
   - Email notifications
   - **Status:** Entire workflow missing
   - **Value:** Saves 1.5 hours/week per manager

3. **Settings Persistence (FR7)** - 1 feature
   - Wire settings UI to existing backend router
   - Replace hardcoded handleSave() with tRPC mutations
   - **Status:** Backend exists (easiest gap to fix)
   - **Value:** 0% → 100% save success rate

4. **System Settings UI Backend (FR8)** - 1 feature
   - Functional system configuration (company, currency, timezone)
   - Store in tenants.metadata JSONB field
   - **Status:** 100% placeholder with local state
   - **Value:** Critical for multi-tenant operations

5. **Integration Settings UI (FR9)** - 1 feature
   - Xero/QuickBooks/Slack/Teams/Stripe integration toggles
   - OAuth flows and credential storage
   - **Status:** Placeholder toggles with no API connections
   - **Value:** Foundation for future integrations

6. **Bulk Import System Backend (FR10)** - 1 feature
   - CSV import infrastructure with validation framework
   - API routes for /api/import/clients, /api/import/tasks, /api/import/services
   - **Status:** UI exists, endpoints return 404
   - **Value:** Foundation for client/service/task import

7. **Client CSV Import (FR11)** - 1 feature
   - Client CSV template with validation
   - Duplicate detection, email/VAT/Companies House validation
   - **Status:** Completely missing
   - **Value:** Rapid practice firm onboarding

8. **Task Reassignment UI (FR12)** - 1 feature
   - Task reassignment modal with history tracking
   - Bulk reassignment support
   - **Status:** Zero reassignment functionality
   - **Value:** Workload balancing for staff

**How It Integrates:**
- Task notes: Extend tasks tRPC router, integrate with notifications system, complete skeleton UI
- Time approval: New timesheets.submit/approve/reject procedures, new approvals page
- Settings: Wire existing UI to existing backend (FR7), create new backends for system/integration settings (FR8-9)
- Bulk import: New import router, CSV parsing service, connect DataImportModal to endpoints
- Task reassignment: Extend tasks router, new modal component, history tracking

**Success Criteria:**
- [ ] Task comments functional with @mentions triggering notifications
- [ ] Time approval workflow complete from submission to manager approval
- [ ] Settings save successfully with 100% persistence rate
- [ ] System settings (company, currency, timezone) stored and retrieved correctly
- [ ] Integration settings UI functional with OAuth flows (Xero at minimum)
- [ ] Bulk import infrastructure working with dry-run validation
- [ ] Client CSV import processing 100+ clients without errors
- [ ] Task reassignment working with audit trail and notifications
- [ ] Zero regressions in existing task/timesheet/settings functionality

---

## Stories

### Story 1: Task Notes & Comments System (FR5)
**Effort:** 4-5 days

Implement thread-based task commenting with @mention parsing, autocomplete, and notification integration to eliminate email/Slack fragmentation for task discussions.

**Acceptance Criteria:**
- taskNotes table created (task_id, user_id, note, is_internal, mentioned_users[], created_at, updated_at)
- tRPC mutations: tasks.createNote, tasks.updateNote, tasks.deleteNote, tasks.getNotes
- @mention parsing: @username or @[User Name] formats supported
- @mention autocomplete dropdown (tenant users only, filtered by input)
- Mentioned users receive notifications (in-app notification created)
- Timestamp display (relative "2 hours ago" + absolute on hover)
- Edit history tracking (track updates with edited_at field)
- Internal vs external flag (staff-only vs client-visible toggle)
- Note deletion (owner or admin only, soft delete)
- Activity feed integration (notes appear in task activity timeline)
- Complete skeleton UI at task-details.tsx:874-918 with full functionality
- Note count badge on task card (show "3 comments" indicator)

**Technical Notes:**
- Use Radix UI Popover for @mention autocomplete
- Store mentioned_users as text[] in PostgreSQL
- Create notification when mentioned (type: "task_mention")
- Index on taskNotes.task_id for query performance

---

### Story 2: Time Approval Workflow System (FR6)
**Effort:** 5-7 days

Implement manager approval workflow for timesheets with submission validation, bulk approval actions, and email notifications to replace manual spreadsheet reconciliation.

**Acceptance Criteria:**
- timesheetSubmissions table created (user_id, week_start_date, week_end_date, status, submitted_at, reviewed_by, reviewed_at, total_hours, reviewer_comments)
- Submit week for approval button in timesheet view (app/client-hub/time/page.tsx)
- Submission validation: prevent if < 37.5 hours (configurable minimum in settings)
- Submission validation: prevent if already submitted for week
- Manager approval interface at app/client-hub/time/approvals/page.tsx
- List pending submissions with: user name, week dates, total hours, submitted date
- Bulk approve/reject actions (select multiple, approve/reject all)
- Individual approve/reject with optional comments
- Approval notification emails sent to submitter
- Rejection notification emails with reviewer comments
- Approval audit trail (track all status changes)
- Resubmission workflow for rejected submissions (status → "resubmitted")
- tRPC procedures: timesheets.submit, timesheets.approve, timesheets.reject, timesheets.getSubmissions, timesheets.getPendingApprovals
- Manager dashboard widget showing pending approvals count

**Technical Notes:**
- Use Better Auth role checking (only managers/admins can approve)
- Prevent double submission with unique constraint on (user_id, week_start_date)
- Email notifications use existing notification system
- Add status field to timeEntries: "draft" | "submitted" | "approved" | "rejected"

---

### Story 3: Settings Persistence & System Configuration (FR7 + FR8)
**Effort:** 3-4 days

Wire settings UI to existing backend router and implement system configuration persistence to achieve 100% save success rate and enable multi-tenant system customization.

**Acceptance Criteria (Settings Persistence - FR7):**
- Wire settings page to existing settings tRPC router (settings.ts:19-167)
- Replace hardcoded handleSave() at settings/page.tsx:84-86 with real mutations
- Create userSettings table (user_id, email_notifications, in_app_notifications, digest_email, theme, language, timezone)
- Implement settings.updateTenant mutation calls for company settings
- Implement settings.updateNotificationSettings mutation calls for user preferences
- Loading states during save ("Saving..." indicator)
- Error handling with user-friendly toast messages
- Optimistic updates with rollback on failure
- Real-time save indicators ("Saved ✓" confirmation)
- Settings data fetching on page load (replace hardcoded defaults)

**Acceptance Criteria (System Settings - FR8):**
- Replace useState with tRPC queries at settings/page.tsx:40-86
- Fetch company settings via settings.getTenant query on load
- Save company settings via settings.updateTenant mutation
- Store in tenants.metadata JSONB field with structure:
  ```json
  {
    "company": { "name": "", "email": "", "phone": "", "address": {} },
    "regional": { "currency": "GBP", "dateFormat": "DD/MM/YYYY", "timezone": "Europe/London" },
    "fiscal": { "fiscalYearStart": "04-06" }
  }
  ```
- Settings fields: company name, email, phone, address (street, city, postcode, country), currency, date format, timezone, fiscal year start
- Form validation (email format, phone format, required fields)
- Settings preview before save (show how dates will display)

**Technical Notes:**
- Use Zod schemas for settings validation
- JSONB queries via Drizzle: `tenants.metadata->>'company'`
- Create settings-schemas.ts for shared Zod schemas
- Test save/load cycle thoroughly (100% persistence)

---

### Story 4: Integration Settings & Bulk Import Infrastructure (FR9 + FR10)
**Effort:** 6-8 days

Implement integration settings UI with OAuth flows and build CSV bulk import infrastructure with validation framework to enable external integrations and data import capabilities.

**Acceptance Criteria (Integration Settings - FR9):**
- integrationSettings table created (tenant_id, integration_type, enabled, credentials encrypted, config JSONB, last_sync_at, sync_status)
- Integration Settings page at app/client-hub/settings/integrations/page.tsx
- Xero integration toggle with OAuth 2.0 flow (priority integration)
- QuickBooks/Sage/Slack/Teams/Stripe placeholder toggles (UI only, Phase 2 implementation)
- Integration status indicators (connected/disconnected, last sync timestamp)
- "Test Connection" button per integration (verify credentials)
- "Configure" button opens OAuth flow or credential form
- Secure credential storage with encryption (use crypto.subtle or library)
- Xero OAuth flow: redirect to Xero, handle callback, store tokens
- Error handling for failed OAuth flows

**Acceptance Criteria (Bulk Import Infrastructure - FR10):**
- API routes created: /api/import/clients/route.ts, /api/import/tasks/route.ts, /api/import/services/route.ts
- CSV parsing service at lib/services/csv-parser.ts (Papa Parse library)
- Import validation framework: validate field types, required fields, formats
- Dry run mode: validate CSV without database writes, return validation report
- Error reporting with row numbers (e.g., "Row 15: Invalid email format")
- Progress tracking (emit progress events during import)
- Import templates generation endpoint (/api/import/templates/[type]/route.ts)
- Bulk database insertion with transactions (rollback on error)
- Import audit trail (importLogs table: tenant_id, import_type, file_name, rows_processed, rows_failed, errors JSONB, imported_by, imported_at)
- Connect existing DataImportModal to new endpoints (replace 404 endpoints)
- Import history page at app/client-hub/data/import-history/page.tsx

**Technical Notes:**
- Use Papa Parse for CSV parsing: `npm install papaparse`
- Encrypt credentials: `crypto.createCipheriv` or use `@47ng/cloak` library
- Store encrypted credentials in integrationSettings.credentials (text field)
- Xero OAuth: register app at developer.xero.com, get client_id/secret
- Import validation: create lib/import/validators/ directory with entity-specific validators

---

### Story 5: Client CSV Import & Task Reassignment (FR11 + FR12)
**Effort:** 4-5 days

Implement client CSV import with comprehensive validation and task reassignment UI with history tracking to enable rapid client onboarding and workload balancing.

**Acceptance Criteria (Client CSV Import - FR11):**
- Client CSV template structure: company_name, client_code, email, phone, vat_number, companies_house_number, client_type, status, address fields, client_manager_email
- Template download endpoint: /api/import/templates/clients/route.ts
- Email format validation (regex check)
- VAT number format validation (UK: GB followed by 9-12 digits)
- Companies House number validation (8 characters, optional API lookup)
- Date format parsing (support DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
- Duplicate detection by email or companies_house_number (skip or update)
- Client manager assignment by email lookup (find user by email)
- Client type validation (must match enum: "individual", "company", "partnership", "trust")
- Status validation (must match enum: "lead", "prospect", "active", "inactive")
- Bulk client creation with tenantId enforcement (auto-add from auth context)
- Import preview: show first 5 rows before import (dry run mode)
- Import summary: "45 clients imported, 3 skipped (duplicates), 2 errors"

**Acceptance Criteria (Task Reassignment - FR12):**
- taskAssignmentHistory table created (task_id, from_user_id, to_user_id, changed_by_user_id, change_reason, assignment_type, changed_at)
- tRPC mutations: tasks.reassign, tasks.bulkReassign, tasks.getAssignmentHistory
- Reassignment modal component (TaskReassignmentModal.tsx)
- User selection dropdown (tenant users only, searchable)
- Change reason textarea (optional, max 500 chars)
- Assignment type selection: "preparer" | "reviewer" | "assigned_to"
- Reassignment button in task detail page (top action bar)
- Bulk reassignment in task list (select multiple tasks → reassign button)
- Notifications to old assignee ("Task #123 reassigned to John") and new assignee ("Task #123 assigned to you by Manager")
- Assignment history view in task detail (show timeline of reassignments)
- Intelligent reassignment suggestions (optional Phase 2): suggest based on workload, skills

**Technical Notes:**
- Client import: reuse HMRC VAT validation from Epic 1 (optional)
- Client import: use Companies House lookup from Epic 1 (optional validation)
- CSV parser: handle quoted fields with commas (e.g., "123 Main St, Suite 5")
- Task reassignment: prevent reassigning to same user (validation check)
- Assignment history: show in activity timeline with other task events

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: task notes, time approvals, import endpoints)
- [x] Database schema changes are backward compatible (new tables: taskNotes, timesheetSubmissions, integrationSettings, userSettings, taskAssignmentHistory, importLogs)
- [x] UI changes follow existing patterns (GlobalHeader/Sidebar, glass-card, shadcn/ui components)
- [x] Performance impact is minimal (imports are async jobs, notes/comments indexed)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId)

**Schema Changes Required:**
```typescript
// taskNotes table
export const taskNotes = pgTable("task_notes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  taskId: text("task_id").references(() => tasks.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  isInternal: boolean("is_internal").default(false),
  mentionedUsers: text("mentioned_users").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
});

// integrationSettings table
export const integrationSettings = pgTable("integration_settings", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  integrationType: text("integration_type").notNull(), // "xero" | "quickbooks" | "slack" | etc.
  enabled: boolean("enabled").default(false).notNull(),
  credentials: text("credentials"), // encrypted JSON
  config: json("config"), // integration-specific config
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status"), // "success" | "error" | null
});

// userSettings table
export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),
  digestEmail: text("digest_email").default("daily"), // "daily" | "weekly" | "never"
  theme: text("theme").default("system"), // "light" | "dark" | "system"
  language: text("language").default("en"),
  timezone: text("timezone").default("Europe/London"),
});

// taskAssignmentHistory table
export const taskAssignmentHistory = pgTable("task_assignment_history", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  taskId: text("task_id").references(() => tasks.id).notNull(),
  fromUserId: text("from_user_id").references(() => users.id),
  toUserId: text("to_user_id").references(() => users.id).notNull(),
  changedBy: text("changed_by").references(() => users.id).notNull(),
  changeReason: text("change_reason"),
  assignmentType: text("assignment_type").notNull(), // "preparer" | "reviewer" | "assigned_to"
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// importLogs table
export const importLogs = pgTable("import_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  importType: text("import_type").notNull(), // "clients" | "services" | "tasks"
  fileName: text("file_name").notNull(),
  rowsProcessed: integer("rows_processed").notNull(),
  rowsFailed: integer("rows_failed").notNull(),
  errors: json("errors"), // array of error objects with row numbers
  importedBy: text("imported_by").references(() => users.id).notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
});
```

---

## Risk Mitigation

**Primary Risks:**

1. **CSV Import Complexity Underestimation**
   - **Risk:** CSV parsing edge cases (encoding, delimiters, quoted fields) cause import failures
   - **Mitigation:** Use battle-tested Papa Parse library; extensive testing with various CSV formats; dry-run validation before import
   - **Impact:** Import failures require manual data cleanup
   - **Likelihood:** Medium | **Severity:** Medium

2. **Integration OAuth Flow Complexity**
   - **Risk:** Xero OAuth 2.0 implementation more complex than expected
   - **Mitigation:** Follow Next.js OAuth patterns; use existing auth patterns from Better Auth; extensive testing with Xero sandbox
   - **Impact:** Integration settings delayed
   - **Likelihood:** Medium | **Severity:** Low

3. **Time Approval Workflow Edge Cases**
   - **Risk:** Edge cases (partial weeks, holiday weeks, retroactive submissions) not handled
   - **Mitigation:** Define clear business rules; implement validation for edge cases; get stakeholder input on policies
   - **Impact:** Workflow rejected by users, requires rework
   - **Likelihood:** Medium | **Severity:** Medium

4. **Settings Migration from Local State**
   - **Risk:** Existing settings in UI local state lost during migration to backend
   - **Mitigation:** Settings are currently hardcoded defaults, no user data to migrate
   - **Impact:** None (no existing data)
   - **Likelihood:** Low | **Severity:** None

**Rollback Plan:**
- Task notes: Remove taskNotes table, revert UI to skeleton state
- Time approval: Remove timesheetSubmissions table, remove approval interface
- Settings: Revert to local state (existing behavior)
- Bulk import: Remove import endpoints, revert DataImportModal to show "Coming soon"
- Task reassignment: Remove taskAssignmentHistory table, remove reassignment UI

---

## Definition of Done

- [x] All 5 stories completed with acceptance criteria met
- [x] Task notes functional with @mentions and notifications
- [x] Time approval workflow complete from submission to approval
- [x] Settings save successfully (0% → 100% success rate achieved)
- [x] System settings (company, currency, timezone) functional
- [x] Integration settings UI functional with Xero OAuth working
- [x] Bulk import infrastructure processing CSVs with validation
- [x] Client CSV import processing 100+ clients successfully
- [x] Task reassignment functional with history and notifications
- [x] Unit tests written for all new tRPC mutations
- [x] Integration tests for CSV import (various formats, edge cases)
- [x] E2E tests for time approval workflow, task reassignment, settings save
- [x] Multi-tenant isolation tests (validate tenantId filtering)
- [x] Seed data updated with sample task notes, timesheet submissions, settings
- [x] Documentation updated: CSV import templates, Xero OAuth setup, time approval policies
- [x] Code reviewed with focus on validation (CSV parsing, settings schemas)
- [x] Performance benchmarks met (<3s page loads, <500ms API, CSV import <30s for 100 rows)
- [x] No regressions in existing task/timesheet/settings functionality
- [x] Feature deployed to staging and tested by QA
- [x] User acceptance testing completed for time approval workflow

---

## Dependencies

**Upstream Dependencies:**
- Epic 1 (Critical Path) completed for HMRC VAT validation pattern (optional for client import)

**Downstream Dependencies:**
- Epic 3 (Advanced Features) builds on task notes for automated task generation
- Epic 5 (Bulk Operations) extends bulk import infrastructure for services/tasks

**External Dependencies:**
- Xero developer account for OAuth credentials (create at developer.xero.com)
- Papa Parse library (npm install papaparse @types/papaparse)
- Encryption library for integration credentials (optional: @47ng/cloak)

---

## Success Metrics

**Quantitative:**
- Task notes: >50 comments created in first week of deployment
- Time approval: >90% of staff submit timesheets via new workflow
- Settings save: 100% success rate (0% → 100% improvement)
- Bulk import: Process 100 clients in <30 seconds with <5% error rate
- Task reassignment: >20 reassignments in first week

**Qualitative:**
- Task comments eliminate email threads for task discussions
- Time approval workflow reduces manager reconciliation time by 1.5 hours/week
- Settings persistence enables multi-tenant customization
- Bulk import enables rapid practice firm onboarding
- Task reassignment improves workload balancing

---

## Notes

- Settings router already exists (settings.ts:19-167) - Story 3 is mostly wiring UI to backend
- Task notes UI skeleton exists (task-details.tsx:874-918) - complete with backend
- DataImportModal component exists - just needs backend endpoints
- Time approval saves 1.5 hours/week per manager (ROI metric from archived CRM usage data)
- Xero integration is Phase 1 priority (most requested by users)
- CSV import is foundation for Epic 5 (service/task import extends same infrastructure)

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 2)
