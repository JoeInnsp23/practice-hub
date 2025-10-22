# Epic 3: Advanced Automation Features - Brownfield Enhancement

**Epic ID:** EPIC-3
**Status:** Draft
**Tier:** 3
**Estimated Effort:** 12-20 days
**Priority:** High
**Created:** 2025-10-22

---

## Epic Goal

Implement advanced automation features including task templates, automated task generation, reports dashboard backend integration, real-time activity feeds, and workflow triggers to unlock workflow automation and restore time-saving capabilities from archived CRM.

---

## Epic Description

### Existing System Context

**Current State:**
- Practice Hub has workflow system but doesn't auto-generate tasks
- Reports dashboard shows all zeros (reports/page.tsx:33-48) with empty chart data (line 186-187)
- Database views exist for reports (drizzle/0000_create_views.sql) but never queried
- Activity feed exists but requires page refresh (no real-time updates)
- Notifications exist but require page refresh (no real-time push)
- Archived CRM had comprehensive TaskSettings.tsx (task templates) - not ported

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy, existing views for reports
- Real-time: Need SSE implementation (Supabase subscriptions in archived CRM)

**Integration Points:**
- tRPC routers: tasks.ts, workflows.ts, new reports.ts router
- Database views: dashboardKpiView, monthlyRevenueView, clientRevenueView (exist, unused)
- Reports page: app/client-hub/reports/page.tsx (hardcoded zeros)
- Activity feed: components/client-hub/activity-feed.tsx
- Notifications: components/notifications/notification-bell.tsx

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 6 advanced automation features (8 individual capabilities):

1. **Task Templates System (FR13)** - 1 feature
   - Task template management with placeholders ({client_name}, {service_name})
   - Service-level template assignment with client overrides
   - **Status:** Completely missing (archived CRM had TaskSettings.tsx)
   - **Value:** Prerequisite for automated task generation

2. **Auto Task Generation (FR14)** - 2 features
   - Task generation triggered by service activation
   - Placeholder replacement and due date calculation
   - **Status:** Workflow system exists but doesn't auto-generate
   - **Depends:** FR13 (Task Templates)
   - **Value:** Eliminates manual task creation

3. **Reports Dashboard Backend (FR15)** - 2 features
   - Reports backend integration with existing database views
   - Revenue/client/service report endpoints
   - **Status:** Shows all zeros, database views exist but never queried
   - **Value:** Data-driven decision making

4. **Real-time Activity Feed (FR16)** - 1 feature
   - SSE implementation for live activity updates
   - **Status:** Requires page refresh currently
   - **Value:** Instant visibility of team activity

5. **Real-time Notifications (FR17)** - 1 feature
   - Live notification push with SSE
   - **Status:** Requires page refresh currently
   - **Value:** Immediate notification awareness

6. **Workflow Triggers (FR18)** - 1 feature
   - Automated task generation on workflow completion
   - **Status:** Workflow stages exist but no automation
   - **Depends:** FR14 (Auto Task Generation)
   - **Value:** Complete automation loop

**How It Integrates:**
- Task templates: New taskTemplates/taskTemplateServices/clientTaskTemplateOverrides tables, new settings page
- Auto task generation: Extend tasks router, integrate with workflows system
- Reports: New reports router querying existing database views, wire to reports UI
- Real-time: New SSE endpoint (/api/activity/stream), EventSource client integration
- Workflow triggers: Extend workflows router, trigger task generation on stage completion

**Success Criteria:**
- [ ] Task templates created and assigned to services
- [ ] Automated task generation working on service activation
- [ ] Reports dashboard showing real data from database views
- [ ] Activity feed updates in real-time without page refresh
- [ ] Notifications appear instantly via SSE push
- [ ] Workflow completion triggers task generation automatically
- [ ] SSE abstraction layer enables future WebSocket migration
- [ ] Zero regressions in existing workflow/task/report functionality

---

## Stories

### Story 1: Task Templates System (FR13)
**Effort:** 5-6 days

Implement task template management with placeholder system, service-level assignment, and client overrides to enable automated task generation from templates.

**Acceptance Criteria:**
- taskTemplates table created (name_pattern, description_pattern, estimated_hours, priority, task_type, due_date_offset_days, due_date_offset_months, service_component_id, tenant_id)
- taskTemplateServices table created (template_id, service_id) for many-to-many linkage
- clientTaskTemplateOverrides table created (client_id, template_id, custom_due_date, custom_priority, is_disabled)
- Task Settings UI at app/client-hub/settings/task-templates/page.tsx
- Template list view with search and filter (by service, task type)
- Template create/edit form with fields: name pattern, description pattern, estimated hours, priority, task type, due date offset
- Placeholder system: {client_name}, {service_name}, {period}, {tax_year}, {company_number}
- Placeholder preview: show example with sample data ("Corporation Tax Return for Acme Ltd")
- Due date offset configuration: "3 months after service activation" or "15th of month"
- Template preview modal showing generated task with placeholders replaced
- Service-level template assignment: assign templates to services (one-to-many)
- Client-level override interface: disable templates or customize due dates per client
- Template soft delete (is_active flag, don't hard delete)
- Template cloning: "Duplicate" button creates copy
- tRPC procedures: taskTemplates.list, taskTemplates.create, taskTemplates.update, taskTemplates.delete, taskTemplates.preview, taskTemplates.assignToService

**Technical Notes:**
- Reference archived CRM: .archive/practice-hub/crm-app/main/src/pages/TaskSettings.tsx
- Use date-fns for due date calculations (addMonths, addDays)
- Store placeholders as text, replace at generation time
- Validate placeholder syntax (must be {valid_placeholder_name})

---

### Story 2: Auto Task Generation & Workflow Triggers (FR14 + FR18)
**Effort:** 4-5 days

Implement automated task generation from templates triggered by service activation and workflow completion to eliminate manual task creation and complete automation loop.

**Acceptance Criteria (Auto Task Generation - FR14):**
- Task generation triggered by service activation (when service status → "active")
- Placeholder replacement: {client_name} → client.companyName, {service_name} → service.name, etc.
- Due date calculation from offsets: addMonths(activationDate, template.dueDateOffsetMonths)
- Target date calculation: default 1 week before due date (due_date - 7 days)
- Existing task deduplication: skip if task with same name exists for client/service
- Recurring vs one-time support: isRecurring field on template
- Batch generation for recurring tasks: generate N months ahead (configurable)
- Auto-assignment to client manager (or template.defaultAssignee)
- Metadata tracking: auto_generated flag, template_id, service_id, generated_at on tasks table
- "Generate Tasks" button in service detail page (app/client-hub/services/[id]/page.tsx)
- "Generate Tasks" button in workflow completion modal
- Admin dashboard for auto-generated tasks: app/admin/tasks/auto-generated/page.tsx
- Generation preview: show tasks that will be created before generating
- tRPC procedures: tasks.generateFromTemplate, tasks.generateRecurringTasks, tasks.bulkGenerateForClient, tasks.previewGeneration

**Acceptance Criteria (Workflow Triggers - FR18):**
- Workflow stage completion webhook/trigger (on stage.status → "completed")
- Check if workflow has associated templates (workflowTemplates table)
- Generate next stage tasks automatically (call tasks.generateFromTemplate)
- Notification to assignee when task auto-generated ("New task: Q1 VAT Return assigned to you")
- Workflow dashboard showing auto-generated tasks per workflow stage
- Workflow template configuration: assign templates to workflow stages
- Trigger configuration: "on stage complete" | "on workflow start" | "on workflow complete"

**Technical Notes:**
- Add fields to tasks table: auto_generated (boolean), template_id (FK), generated_at (timestamp)
- Create workflowTemplates table (workflow_id, stage_id, template_id, trigger_type)
- Use tRPC mutation chaining: workflow.completeStage → tasks.generateFromTemplate
- Prevent duplicate generation: check if task already exists by (client_id, service_id, name)

---

### Story 3: Reports Dashboard Backend Integration (FR15)
**Effort:** 3-4 days

Wire reports dashboard to existing database views and implement backend queries to replace hardcoded zeros with real data for data-driven decision making.

**Acceptance Criteria:**
- Create reports tRPC router at app/server/routers/reports.ts
- Create reports-queries.ts at lib/db/queries/reports-queries.ts
- Query existing PostgreSQL views (already exist at drizzle/0000_create_views.sql):
  - dashboardKpiView: total revenue, total clients, active tasks, overdue tasks
  - monthlyRevenueView: revenue by month for charts
  - clientRevenueView: revenue by client for breakdowns
- Revenue chart data endpoint: reports.getMonthlyRevenue (last 12 months)
- Client breakdown data endpoint: reports.getClientRevenue (top 10 clients)
- Service performance data endpoint: reports.getServicePerformance (revenue by service)
- Replace hardcoded KPI zeros at reports/page.tsx:33-48 with reports.getDashboardKpis query
- Wire RevenueChart component to real data (currently empty array at line 186)
- Wire ClientBreakdown component to real data (currently empty array at line 187)
- Date range filtering: 30/90/365 days, custom date range
- Report export functionality: CSV download button per chart
- Drill-down capabilities: click chart segment → detail page (e.g., click client → client revenue detail)
- Loading states while data fetches
- Error handling with user-friendly messages

**Technical Notes:**
- Database views already exist (drizzle/0000_create_views.sql) - just query them
- Use Drizzle ORM to query views: `db.select().from(dashboardKpiView)`
- Views already include tenantId filtering - safe to query
- Add indexes if performance issues: CREATE INDEX ON invoices(tenant_id, created_at)
- Use Recharts library for charts (already used in reports/page.tsx)

---

### Story 4: Real-time Updates via SSE (FR16 + FR17)
**Effort:** 3-4 days

Implement Server-Sent Events (SSE) for real-time activity feed and notification updates with abstraction layer for future WebSocket migration.

**Acceptance Criteria (Real-time Activity Feed - FR16):**
- SSE endpoint created at app/api/activity/stream/route.ts
- EventSource client integration in activity-feed.tsx component
- Server-side event emission when activity logs created (after INSERT on activityLogs table)
- Client-side event handling: parse SSE message → update activity feed state
- Reconnection logic with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Heartbeat mechanism: server sends "ping" every 30s, client detects stale connection
- Graceful degradation to polling if SSE fails (fallback after 3 reconnect attempts)
- Activity badge real-time updates: increment "3 new activities" badge
- Connection status indicator: "Live" | "Connecting..." | "Offline"
- SSE authentication: validate session token in SSE request

**Acceptance Criteria (Real-time Notifications - FR17):**
- Extend SSE endpoint to include notifications channel (multiplexed streams)
- Notification badge real-time updates: increment count when notification arrives
- Toast notification display for high-priority notifications (type: "urgent")
- Notification sound (optional, user preference from userSettings)
- Mark as read with optimistic UI update (local state → SSE confirm)
- Notification grouping: combine similar notifications ("3 tasks assigned to you")

**Acceptance Criteria (Abstraction Layer):**
- Create lib/realtime/client.ts: RealtimeClient interface
- Create lib/realtime/server.ts: RealtimeServer interface
- SSE implementation: lib/realtime/sse-client.ts, lib/realtime/sse-server.ts
- API contract stable: { type: "activity" | "notification", data: {...} }
- Enable future migration: WebSocket can replace SSE without changing client code
- Documentation: docs/realtime-architecture.md explaining abstraction

**Technical Notes:**
- SSE requires GET endpoint returning text/event-stream content type
- Use ReadableStream for SSE in Next.js App Router:
  ```typescript
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
  ```
- Client: `const eventSource = new EventSource('/api/activity/stream')`
- Server: emit events with `controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)`
- Multiplex channels: include channel in event type (`activity:new`, `notification:new`)

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: taskTemplates, reports, SSE endpoints)
- [x] Database schema changes are backward compatible (new tables: taskTemplates, taskTemplateServices, clientTaskTemplateOverrides, workflowTemplates; add fields to tasks: auto_generated, template_id, generated_at)
- [x] UI changes follow existing patterns (GlobalHeader/Sidebar, glass-card, shadcn/ui)
- [x] Performance impact is minimal (SSE connections managed, report queries use indexed views)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId, SSE streams scoped to tenant)
- [x] Real-time architecture forward-compatible (abstraction layer enables WebSocket migration)

**Schema Changes Required:**
```typescript
// taskTemplates table
export const taskTemplates = pgTable("task_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  namePattern: text("name_pattern").notNull(), // "Q{quarter} VAT Return for {client_name}"
  descriptionPattern: text("description_pattern"),
  estimatedHours: real("estimated_hours"),
  priority: text("priority").notNull(), // "low" | "medium" | "high" | "urgent"
  taskType: text("task_type").notNull(),
  dueDateOffsetDays: integer("due_date_offset_days").default(0),
  dueDateOffsetMonths: integer("due_date_offset_months").default(0),
  serviceComponentId: text("service_component_id").references(() => serviceComponents.id),
  isRecurring: boolean("is_recurring").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// taskTemplateServices (many-to-many)
export const taskTemplateServices = pgTable("task_template_services", {
  templateId: text("template_id").references(() => taskTemplates.id).notNull(),
  serviceId: text("service_id").references(() => services.id).notNull(),
});

// clientTaskTemplateOverrides
export const clientTaskTemplateOverrides = pgTable("client_task_template_overrides", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  clientId: text("client_id").references(() => clients.id).notNull(),
  templateId: text("template_id").references(() => taskTemplates.id).notNull(),
  customDueDate: date("custom_due_date"),
  customPriority: text("custom_priority"),
  isDisabled: boolean("is_disabled").default(false),
});

// workflowTemplates
export const workflowTemplates = pgTable("workflow_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  workflowId: text("workflow_id").references(() => workflows.id).notNull(),
  stageId: text("stage_id"),
  templateId: text("template_id").references(() => taskTemplates.id).notNull(),
  triggerType: text("trigger_type").notNull(), // "on_stage_complete" | "on_workflow_start" | "on_workflow_complete"
});

// Add to tasks table
autoGenerated: boolean("auto_generated").default(false),
templateId: text("template_id").references(() => taskTemplates.id),
generatedAt: timestamp("generated_at"),
```

---

## Risk Mitigation

**Primary Risks:**

1. **SSE Connection Stability**
   - **Risk:** SSE connections drop frequently, degrading user experience
   - **Mitigation:** Implement robust reconnection logic with exponential backoff; graceful fallback to polling; comprehensive testing under various network conditions
   - **Impact:** Users experience delays in real-time updates (fallback to 30s polling)
   - **Likelihood:** Medium | **Severity:** Low

2. **Task Template Complexity**
   - **Risk:** Placeholder system and due date logic more complex than estimated
   - **Mitigation:** Reference archived CRM implementation (TaskSettings.tsx); start with simple placeholders; use date-fns for reliable date calculations
   - **Impact:** Task template story extends 1-2 days
   - **Likelihood:** Low | **Severity:** Low

3. **Report Query Performance**
   - **Risk:** Report queries slow with large datasets (1000+ clients, 10000+ invoices)
   - **Mitigation:** Database views already exist (optimized); add indexes if needed; implement pagination for large result sets
   - **Impact:** Report dashboard load time >3s
   - **Likelihood:** Low | **Severity:** Low

4. **Automated Task Generation Bugs**
   - **Risk:** Task generation creates duplicates or incorrect tasks
   - **Mitigation:** Comprehensive deduplication logic; generation preview before commit; dry-run mode for testing; extensive unit tests
   - **Impact:** Duplicate tasks require manual cleanup
   - **Likelihood:** Medium | **Severity:** Medium

**Rollback Plan:**
- Task templates: Remove taskTemplates tables, revert task generation logic
- Auto task generation: Disable auto-generation triggers, keep manual generation
- Reports: Revert to hardcoded zeros (existing state)
- Real-time: Remove SSE endpoint, revert to page refresh (existing state)
- Workflow triggers: Disable workflow completion hooks

---

## Definition of Done

- [x] All 4 stories completed with acceptance criteria met
- [x] Task templates created and functional with placeholder preview
- [x] Automated task generation working on service activation and workflow completion
- [x] Reports dashboard showing real data from database views
- [x] Real-time activity feed updating without page refresh via SSE
- [x] Real-time notifications pushing instantly via SSE
- [x] SSE abstraction layer implemented for future WebSocket migration
- [x] Unit tests written for task template logic, task generation, report queries
- [x] Integration tests for SSE connections (reconnection, fallback to polling)
- [x] E2E tests for task generation workflow, real-time updates
- [x] Multi-tenant isolation tests (SSE streams scoped to tenant, report queries filter by tenantId)
- [x] Performance tests for report queries (>1000 clients, >10000 invoices)
- [x] Seed data updated with sample task templates, auto-generated tasks
- [x] Documentation updated: task template guide, SSE architecture, report metrics definitions
- [x] Code reviewed with focus on task generation logic (deduplication, date calculations)
- [x] Performance benchmarks met (<3s page loads, <500ms API, <2s real-time latency)
- [x] No regressions in existing workflow/task/report/activity functionality
- [x] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream Dependencies:**
- Epic 2 (High-Impact Workflows) completed for task notes foundation (task activity integration)

**Downstream Dependencies:**
- Epic 4 (Staff Management) benefits from task templates (capacity planning templates)
- Epic 6 (Polish) extends real-time architecture (notification preferences)

**External Dependencies:**
- date-fns library for date calculations (npm install date-fns)
- Database views already exist (drizzle/0000_create_views.sql) - no creation needed

---

## Success Metrics

**Quantitative:**
- Task templates: >10 templates created in first week
- Auto task generation: >100 tasks generated automatically in first month
- Reports: >50 report views per week (replacing manual Excel reports)
- Real-time: SSE connection uptime >99.5%, reconnection success >95%
- Task generation accuracy: <1% duplicate task rate

**Qualitative:**
- Task templates eliminate manual task creation for recurring workflows
- Automated task generation reduces admin overhead by 2 hours/week
- Reports dashboard provides instant visibility into practice performance
- Real-time updates improve team collaboration and awareness
- Workflow triggers complete automation loop (service activation → task generation → completion → next stage)

---

## Notes

- Database views for reports already exist (drizzle/0000_create_views.sql) - Story 3 is mostly wiring UI to queries
- Archived CRM had TaskSettings.tsx (500+ lines) - reference for task template UI patterns
- SSE chosen for Phase 1 simplicity (vs WebSocket) - abstraction layer enables migration in Phase 2
- Task templates are prerequisite for auto task generation (FR13 → FR14 dependency)
- Real-time architecture decision documented in PRD Appendix C (SSE selected)

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 3)
