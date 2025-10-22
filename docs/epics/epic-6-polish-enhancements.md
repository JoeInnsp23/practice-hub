# Epic 6: Polish & Enhancements - Brownfield Enhancement

**Epic ID:** EPIC-6
**Status:** Draft
**Tier:** 6
**Estimated Effort:** 3-5 days
**Priority:** Low
**Created:** 2025-10-22

---

## Epic Goal

Complete final polish features including dashboard upcoming deadlines widget with real data, notification preferences backend persistence, workflow-triggered email automation, API documentation page, and weekly timesheet full restoration to achieve 100% feature parity with archived CRM and production readiness.

---

## Epic Description

### Existing System Context

**Current State:**
- Dashboard has upcoming deadlines widget but shows hardcoded "Corporation Tax - XYZ" placeholder
- Notification preferences UI exists but no persistence (settings don't save)
- Email notifications exist for some events (proposals, leads) but not workflow-triggered
- API documentation page existed in archived CRM (566 lines) but not ported
- Weekly timesheet simplified during migration (60% parity vs archived CRM)

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy
- Email: Existing email notification system (resend or similar)

**Integration Points:**
- Dashboard: app/client-hub/dashboard/page.tsx (upcoming deadlines widget)
- Settings: userSettings table (from Epic 2), notification preferences
- Workflows: workflows.ts router, email automation triggers
- Timesheet: app/client-hub/time/page.tsx (weekly timesheet view)
- Database: complianceItems table (for deadlines), emailTemplates table (for automation)

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 5 polish features (4 core + 2 bonus):

1. **Dashboard Upcoming Deadlines Widget (FR30)** - 1 feature
   - Query complianceItems for upcoming deadlines
   - Replace hardcoded placeholder with real data
   - **Status:** Widget hardcoded with "Corporation Tax - XYZ"
   - **Value:** Real deadline visibility in dashboard

2. **Notification Preferences Backend (FR31)** - 1 feature
   - Wire notification preferences UI to userSettings table
   - Persist preferences and enforce in notification logic
   - **Status:** UI exists but no persistence
   - **Value:** User control over notification delivery

3. **Email Automation for Workflows (FR32)** - 1 feature
   - Workflow-triggered email rules
   - Email template system with variables
   - **Status:** Email exists for some events, not workflows
   - **Value:** Automated client/staff communication

4. **API Documentation Page (FR33)** - BONUS
   - Admin page with tRPC endpoint documentation
   - Request/response schemas, examples
   - **Status:** Not ported from archived CRM
   - **Value:** Internal API reference for developers

5. **Weekly Timesheet Full Restoration (FR34)** - BONUS
   - Restore full weekly timesheet features from archived CRM
   - TOIL/holiday balance widgets, week submission
   - **Status:** Simplified to 60% parity
   - **Value:** Complete timesheet functionality

**How It Integrates:**
- Upcoming deadlines: Query complianceItems table, wire to dashboard widget
- Notification preferences: Extend userSettings table (from Epic 2), check preferences before sending notifications
- Email automation: Create emailTemplates table, integrate with workflows.completeStage trigger
- API docs: Generate docs from tRPC router definitions, display in admin page
- Weekly timesheet: Restore features from archived CRM (TOIL/holiday widgets, submission workflow from Epic 2)

**Success Criteria:**
- [ ] Dashboard shows real upcoming deadlines from complianceItems table
- [ ] Notification preferences save and persist correctly
- [ ] Notification delivery respects user preferences (email/in-app/digest)
- [ ] Workflow completion triggers automated emails to clients/staff
- [ ] Email templates created with variable substitution
- [ ] API documentation page accessible in admin panel
- [ ] Weekly timesheet restored to 100% parity with archived CRM
- [ ] Zero regressions in existing dashboard/settings/workflow/timesheet functionality

---

## Stories

### Story 1: Dashboard Deadlines & Notification Preferences (FR30 + FR31)
**Effort:** 2 days

Wire dashboard upcoming deadlines widget to real data from complianceItems table and implement notification preferences persistence to enable user control over notification delivery.

**Acceptance Criteria (Dashboard Upcoming Deadlines - FR30):**
- Query complianceItems table for upcoming deadlines (due_date within next 30 days)
- Filter by tenant_id for multi-tenant isolation
- Sort by due_date ascending (earliest first)
- Display in dashboard widget at app/client-hub/dashboard/page.tsx
- Replace hardcoded "Corporation Tax - XYZ" placeholder (line ~45-60)
- Widget shows: compliance type, client name, due date, urgency indicator
- Click deadline to navigate to compliance detail page
- Deadline count badge: "5 upcoming deadlines"
- Color-coded urgency:
  - Red: due within 7 days
  - Yellow: due within 7-14 days
  - Green: due within 14-30 days
- Empty state: "No upcoming deadlines" when no items
- Loading state: skeleton loader while fetching
- tRPC query: compliance.getUpcoming({ days: 30 })

**Acceptance Criteria (Notification Preferences - FR31):**
- Extend userSettings table (created in Epic 2) if fields missing:
  - email_notifications (boolean)
  - in_app_notifications (boolean)
  - digest_email ("daily" | "weekly" | "never")
  - notification_types (JSONB: { task_assigned: true, mention: true, deadline_approaching: false, ... })
- Wire notification preferences UI to backend (app/client-hub/settings/page.tsx)
- Implement settings.updateNotificationSettings mutation (currently logs but doesn't save)
- Save preferences to userSettings table
- Notification preference enforcement: check before sending notification
  - If email_notifications = false, skip email
  - If in_app_notifications = false, skip in-app notification
  - If notification_types.task_assigned = false, skip task assignment notifications
- Digest email scheduling: daily/weekly summary (optional Phase 2)
- Default preferences: all enabled on first login
- Preference preview: "You will receive [X] types of notifications via [email/in-app]"

**Technical Notes:**
- Upcoming deadlines: use existing complianceItems table (should exist)
- If complianceItems doesn't exist, use invoices.due_date as alternative data source
- Notification preferences: create getNotificationPreferences(userId) helper
- Check preferences in notification creation logic (lib/notifications/create-notification.ts or similar)

---

### Story 2: Email Automation & API Documentation (FR32 + FR33)
**Effort:** 4-5 days

Implement workflow-triggered email automation with template system and create internal API documentation page for developer reference.

**Acceptance Criteria (Email Automation - FR32):**
- emailTemplates table created (tenant_id, template_name, template_type, subject, body_html, body_text, variables[], is_active, created_at, updated_at)
- Email template types:
  - "workflow_stage_complete": sent when workflow stage completes
  - "task_assigned": sent when task assigned
  - "task_due_soon": sent when task due within 3 days
  - "task_overdue": sent when task overdue
  - "client_created": sent to client when account created
  - "client_status_changed": sent when client status changes
- Workflow-triggered email rules (workflowEmailRules table: workflow_id, stage_id, email_template_id, recipient_type, send_delay_hours)
- Recipient types: "client" | "assigned_staff" | "client_manager" | "custom_email"
- Email template variables: {client_name}, {task_name}, {due_date}, {staff_name}, {company_name}, {workflow_name}, {stage_name}
- Variable substitution: replace placeholders with actual values at send time
- Email scheduling: optional delay (e.g., send 1 day after stage completion)
- Email queue with retry logic: store in emailQueue table (template_id, recipient_email, variables, status, send_at, sent_at, error_message)
- Email tracking: sent, bounced, opened (via provider webhooks - optional Phase 2)
- Email template editor UI: app/admin/settings/email-templates/page.tsx
- Template preview: show rendered email with sample data
- tRPC procedures: emailTemplates.list, emailTemplates.create, emailTemplates.update, emailTemplates.preview, emailTemplates.sendTest

**Acceptance Criteria (API Documentation - FR33):**
- API documentation page at app/admin/api-docs/page.tsx
- tRPC endpoint listing: all routers and procedures
- Endpoint documentation per procedure:
  - Procedure name (e.g., clients.create)
  - Description (extracted from JSDoc comments or manual)
  - Request schema (Zod schema display)
  - Response schema (Zod schema display)
  - Example request (JSON)
  - Example response (JSON)
  - Authentication requirements (public/protected/admin)
  - Rate limiting information (if applicable)
- External API documentation section:
  - Companies House API endpoints used
  - HMRC API endpoints used
  - DocuSeal API endpoints used
- Database schema documentation:
  - Tables list with descriptions
  - Relationships diagram (optional visual)
  - Field descriptions
- Search functionality: filter endpoints by name/description
- Copy button: copy example JSON to clipboard
- Syntax highlighting: JSON examples with syntax highlighting

**Technical Notes:**
- Email templates: use Resend, SendGrid, or existing email provider
- Template rendering: use templating library (Handlebars, Mustache) or simple string replace
- Email queue: process with cron job or background worker
- API docs: generate from tRPC router type definitions
- Use tRPC metadata for descriptions: `.meta({ description: "..." })`
- Syntax highlighting: use react-syntax-highlighter library

---

### Story 3: Weekly Timesheet Full Restoration (FR34) - BONUS
**Effort:** 2-3 days

Restore full weekly timesheet features from archived CRM to achieve 100% parity including TOIL/holiday balance widgets, week-at-a-glance grid, and submission workflow integration.

**Acceptance Criteria:**
- Dedicated weekly timesheet component (currently simplified into timesheet-grid)
- Week-at-a-glance grid view: 7 days (Mon-Sun) × work types
- Daily row totals: sum of hours per day
- Weekly total: sum of all hours for week
- TOIL balance widget in weekly view: "TOIL Balance: 14.5 hours (1.9 days)"
- Holiday balance widget in weekly view: "Leave Remaining: 15 days (25 entitlement - 10 used)"
- Week submission workflow: "Submit Week" button
- Submission validation: warn if < 37.5 hours (configurable minimum from settings)
- Approval status indicator: "Pending Approval" | "Approved" | "Rejected" badge
- Rejected week: show reviewer comments, allow resubmission
- Minimum hours warning: highlight row if daily hours < expected (e.g., <7.5 for full-time)
- Week navigation: Previous/Next week buttons, date picker
- Copy previous week: "Copy Last Week" button to duplicate entries
- Time entry quick add: keyboard shortcuts (Tab to next cell, Enter to save)
- Weekly summary card: total hours, billable %, work type breakdown (pie chart)
- Integration with time approval workflow (Epic 2): submission triggers timesheetSubmissions record

**Technical Notes:**
- Reference archived CRM: .archive/practice-hub/crm-app/main/src/components/WeeklyTimesheet.tsx
- Use timesheet approval workflow from Epic 2 (FR6)
- TOIL balance: query leaveBalances.toil_balance (from Epic 4)
- Holiday balance: query leaveBalances (annual_entitlement - annual_used) (from Epic 4)
- Week submission: call timesheets.submit mutation (from Epic 2)
- Grid component: use Radix UI Table or custom grid with keyboard navigation

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: upcoming deadlines query, email template mutations)
- [x] Database schema changes are backward compatible (new tables: emailTemplates, workflowEmailRules, emailQueue; extend userSettings for notification preferences)
- [x] UI changes follow existing patterns (GlobalHeader/Sidebar, glass-card, shadcn/ui)
- [x] Performance impact is minimal (deadline query indexed, email queue processed async)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId)

**Schema Changes Required:**
```typescript
// emailTemplates table
export const emailTemplates = pgTable("email_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  templateName: text("template_name").notNull(),
  templateType: text("template_type").notNull(), // "workflow_stage_complete" | "task_assigned" | etc.
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: text("variables").array(), // ["{client_name}", "{task_name}", ...]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// workflowEmailRules table
export const workflowEmailRules = pgTable("workflow_email_rules", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  workflowId: text("workflow_id").references(() => workflows.id).notNull(),
  stageId: text("stage_id"), // optional: trigger on specific stage
  emailTemplateId: text("email_template_id").references(() => emailTemplates.id).notNull(),
  recipientType: text("recipient_type").notNull(), // "client" | "assigned_staff" | "client_manager" | "custom_email"
  customRecipientEmail: text("custom_recipient_email"),
  sendDelayHours: integer("send_delay_hours").default(0),
  isActive: boolean("is_active").default(true).notNull(),
});

// emailQueue table
export const emailQueue = pgTable("email_queue", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  emailTemplateId: text("email_template_id").references(() => emailTemplates.id).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: json("variables"), // variable values for substitution
  status: text("status").notNull(), // "pending" | "sent" | "failed" | "bounced"
  sendAt: timestamp("send_at").notNull(), // scheduled send time
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Extend userSettings (if fields missing)
// notification_types: json("notification_types") // { task_assigned: true, mention: true, ... }
```

---

## Risk Mitigation

**Primary Risks:**

1. **Email Deliverability Issues**
   - **Risk:** Workflow-triggered emails marked as spam or not delivered
   - **Mitigation:** Use reputable email provider (Resend, SendGrid); implement SPF/DKIM/DMARC; test thoroughly; provide opt-out mechanism
   - **Impact:** Clients/staff don't receive automated emails
   - **Likelihood:** Low | **Severity:** Medium

2. **Email Template Variable Complexity**
   - **Risk:** Variable substitution logic more complex than estimated (nested objects, formatting)
   - **Mitigation:** Start with simple string replace; use templating library for complex cases; provide clear variable documentation
   - **Impact:** Email template story extends 1 day
   - **Likelihood:** Low | **Severity:** Low

3. **API Documentation Maintenance**
   - **Risk:** API docs become outdated as endpoints change
   - **Mitigation:** Generate docs from tRPC type definitions (single source of truth); add CI check to regenerate docs on router changes
   - **Impact:** Docs show incorrect API contracts
   - **Likelihood:** Medium | **Severity:** Low

4. **Weekly Timesheet Feature Creep**
   - **Risk:** Restoring weekly timesheet uncovers missing features beyond FR34
   - **Mitigation:** Define strict scope (60% → 100% parity, no new features); reference archived CRM as definition of done; defer enhancements to Phase 2
   - **Impact:** Weekly timesheet story extends 1-2 days
   - **Likelihood:** Medium | **Severity:** Low

**Rollback Plan:**
- Upcoming deadlines: Revert to hardcoded placeholder (existing state)
- Notification preferences: Revert to no persistence (existing state)
- Email automation: Remove email templates, no impact on existing email notifications
- API docs: Remove API docs page, no impact on functionality
- Weekly timesheet: Revert to simplified view (existing state)

---

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Dashboard shows real upcoming deadlines from complianceItems
- [x] Notification preferences save and persist correctly
- [x] Workflow completion triggers automated emails to clients/staff
- [x] Email templates created with variable substitution
- [x] Email queue processes pending emails with retry logic
- [x] API documentation page accessible in admin panel
- [x] Weekly timesheet restored to 100% parity with archived CRM
- [x] Unit tests written for notification preference checks, email template rendering
- [x] Integration tests for workflow-triggered emails (mock email sending)
- [x] E2E tests for weekly timesheet submission, upcoming deadlines display
- [x] Multi-tenant isolation tests (validate tenantId filtering)
- [x] Seed data updated with sample email templates, compliance deadlines
- [x] Documentation updated: email template variables, API docs generation process
- [x] Code reviewed with focus on email template variable substitution, notification preference logic
- [x] Performance benchmarks met (<3s page loads, <500ms API)
- [x] No regressions in existing dashboard/settings/workflow/timesheet functionality
- [x] Feature deployed to staging and tested by QA
- [x] 100% feature parity achieved with archived CRM

---

## Dependencies

**Upstream Dependencies:**
- Epic 2 (High-Impact Workflows) completed for userSettings table, time approval workflow
- Epic 3 (Advanced Features) completed for workflow completion triggers
- Epic 4 (Staff Management) completed for TOIL/leave balances (weekly timesheet integration)

**Downstream Dependencies:**
- None (final epic)

**External Dependencies:**
- Email provider (Resend, SendGrid, or existing provider)
- Templating library for email templates (optional: Handlebars, Mustache)
- Syntax highlighting library for API docs (react-syntax-highlighter)

---

## Success Metrics

**Quantitative:**
- Upcoming deadlines: 100% display accuracy (matches complianceItems data)
- Notification preferences: 100% persistence rate (0% → 100% improvement)
- Email automation: >50 automated emails sent in first month
- API docs: >10 page views per week (internal developer usage)
- Weekly timesheet: >80% of staff use new weekly view vs daily view

**Qualitative:**
- Dashboard deadlines provide real deadline visibility
- Notification preferences give users control over notification delivery
- Workflow-triggered emails automate client/staff communication
- API docs provide internal reference for developers
- Weekly timesheet achieves 100% parity with archived CRM

---

## Notes

- This is the final polish epic - achieves 100% feature parity with archived CRM
- Upcoming deadlines widget currently hardcoded (dashboard/page.tsx ~line 45-60)
- Notification preferences UI exists but never persists (settings/page.tsx)
- Email automation extends existing email notification system (proposals, leads)
- API documentation page existed in archived CRM (566 lines at src/pages/ApiDocumentation.tsx)
- Weekly timesheet simplified during migration - archived CRM reference at src/components/WeeklyTimesheet.tsx
- After this epic, feature parity restoration is complete - focus shifts to polish, performance, and Phase 2 enhancements

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 6)
