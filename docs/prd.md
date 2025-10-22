# Practice Hub Client-Hub Gap Analysis & Feature Parity Implementation

**Version:** 1.0
**Date:** 2025-10-22
**Status:** Draft
**Type:** Brownfield Enhancement PRD

---

## Intro Project Analysis and Context

### Scope Assessment

This PRD addresses **SIGNIFICANT brownfield enhancements** requiring comprehensive planning:

- **Scope:** 59 incomplete features (31 missing, 20 partial, 8 complete but investigated) across 17 functional categories
- **Effort:** Conservative estimate of 67-95 days implementation
- **Impact:** Significant - affects production readiness, regulatory compliance, core workflows, and operational efficiency
- **Complexity:** Requires multi-sprint roadmap with architectural decisions (SSE vs WebSocket, database RLS strategy, CSV import infrastructure)

✅ **Full PRD is appropriate** - This is substantial feature parity restoration, not a simple feature addition.

### Analysis Source

**Primary Source:** User-provided comprehensive project brief (`docs/brief.md`, 907 lines)

**Brief Quality:** Exceptional - includes complete gap analysis (131 features compared), code-level evidence with file locations, conservative effort estimates, prioritized 3-tier implementation strategy, technical constraints, and complete phase roadmap (Phase 1-8).

**Investigation Conducted:** 7 parallel specialized agents conducted deep-dive analysis of 28 "investigation required" features, revealing:
- 8 features already complete (no work needed)
- 20 features partially implemented (some complete, needs finishing)
- 31 features completely missing (build from scratch)
- 4 additional features discovered not in original brief

**Additional Context:** Project files available in IDE:
- Archived CRM: `.archive/practice-hub/crm-app/`
- Current implementation: `app/client-hub/`, `app/server/routers/`
- Database schema: `lib/db/schema.ts`

---

## Existing Project Overview

### Current Project State

**Project:** Practice Hub - Multi-tenant practice management platform for accountancy firms

**Current Architecture:**
- **Frontend:** Next.js 15 (App Router), React 19, Turbopack, Tailwind CSS v4, shadcn/ui components
- **Backend:** tRPC for type-safe RPC, Better Auth for authentication, Drizzle ORM for database access
- **Database:** PostgreSQL 15+ with application-level multi-tenancy (`tenantId` filtering)
- **Infrastructure:** Docker Compose (dev: PostgreSQL, MinIO, DocuSeal), Coolify + Hetzner (production target)
- **Object Storage:** MinIO (local S3-compatible), Hetzner S3 (production)
- **E-Signature:** DocuSeal (Docker integration with webhooks)

**Migration Context:**

The platform was migrated from an archived CRM (React 18 + Vite + Supabase) to the current modern stack due to critical database and authentication issues. The migration successfully established:
- ✅ Better Auth replacing problematic Supabase Auth
- ✅ PostgreSQL with Drizzle ORM replacing Supabase
- ✅ Multi-tenant isolation architecture (application-level)
- ✅ tRPC for type-safe API layer
- ✅ Next.js 15 App Router for modern React patterns

However, the infrastructure-first approach created **"functional debt"** - 59 features from the proven production system were not fully migrated.

**Current Feature Status:**
- ✅ **82 features complete (63%)** - Auth, multi-tenancy, core CRUD operations working
- ⚠️ **20 features partial (15%)** - UI exists but non-functional or incomplete backend (settings, reports, invoice details, task notes skeleton, bulk import UI)
- ❌ **31 features missing (24%)** - Critical gaps blocking production readiness

**Primary Modules:**
- **Client-Hub** (staff-facing client management) - Primary focus of this PRD
- **Practice-Hub** (core practice operations)
- **Proposal-Hub** (proposal calculator and PDF generation)
- **Admin-Hub** (admin panel)
- **Client-Portal** (external client access - onboarding only in Phase 1)

---

## Enhancement Scope Definition

### Enhancement Type

☑ **New Feature Addition** + ☑ **Major Feature Modification** + ☑ **Integration with New Systems**

This is a **feature parity restoration** project - implementing missing features and completing partial implementations to match the validated production functionality of the archived CRM.

### Enhancement Description

Implement 59 incomplete features across Client-Hub, Admin-Hub, and Proposal-Hub modules to achieve 100% feature parity with the archived CRM application. This includes:

1. **Critical regulatory features** - HMRC VAT validation, legal pages (privacy policy, terms, cookie policy)
2. **Workflow completeness** - Task notes/comments with @mentions, time approval workflows, automated task generation
3. **Non-functional UI completion** - Settings persistence (currently 0% save success rate), reports backend integration (currently all zeros), invoice detail pages
4. **Staff management systems** - Department management, capacity planning, working patterns, holiday/leave requests, time in lieu tracking
5. **Bulk operations infrastructure** - CSV import backend, client/service/task import, import templates, CSV parsing service
6. **Real-time features** - SSE/WebSocket for activity feed updates, notifications push
7. **Production readiness blockers** - Legal pages, document organization (✅ already complete per investigation), client code generation fix (remove Math.random())

### Impact Assessment

☑ **Significant Impact (substantial existing code changes)**

**Rationale:** While many features are isolated additions, several require:
- Integration with existing tRPC routers (extend 15+ routers)
- Database schema enhancements (20+ new tables, no migrations - direct updates per CLAUDE.md Rule #12)
- Real-time architecture decisions (SSE vs WebSocket implementation)
- Multi-tenant isolation enforcement across all new tables
- Settings and reports backend integration (converting placeholder UI to functional with existing backend)
- Bulk import infrastructure (CSV parsing, validation, error handling)
- Staff management expansion (departments, capacity, leave systems)

---

## Goals and Background Context

### Goals

1. **Achieve production readiness** - Complete all Critical-priority gaps (HMRC VAT, legal pages, invoice details, client code generation fix) enabling production release candidate

2. **Restore 100% feature parity** - Implement all 59 incomplete features achieving functional equivalence with proven production system

3. **Eliminate technical debt** - Convert all placeholder UI components to fully-functional implementations with backend integration (settings 0% → 100% save success, reports all zeros → real data)

4. **Enable self-service client onboarding** - Deploy HMRC VAT validation and legal pages supporting external client onboarding without staff intervention, reducing onboarding time by 50% (2 hours → 1 hour per client)

5. **Unlock staff productivity** - Implement high-impact workflow features (task notes, time approvals, automated workflows, bulk operations) restoring time-saving automation from archived CRM

6. **Complete staff management** - Implement department management, capacity planning, working patterns, holiday/leave requests, and time in lieu tracking for operational maturity

7. **Build data import infrastructure** - Complete bulk import system with CSV parsing, validation, templates, and import workflows for clients, services, and tasks

### Background Context

The Practice Hub platform underwent a technology stack migration from the archived CRM to a modern Next.js 15 architecture to resolve critical database and authentication issues that were blocking scaling and reliability. The migration prioritized infrastructure stability - Better Auth replacing problematic auth, PostgreSQL with Drizzle ORM replacing Supabase, and multi-tenant isolation architecture.

However, the infrastructure-first approach created **functional debt**: 59 features that worked in production were deferred during migration. This includes:

- **Regulatory compliance features** - HMRC VAT validation with sandbox credentials already available
- **Workflow automation** - Task notes, time approvals, auto-task generation
- **Non-functional UI components** - Settings pages display UI but don't persist changes (0% save success rate), reports dashboard shows all zeros (no backend queries), invoice list has no detail page route
- **Staff operations** - Department management, capacity planning, working patterns, holiday/leave systems completely absent
- **Bulk operations** - Import UI exists but calls non-existent API endpoints (`/api/import/clients` returns 404)
- **Real-time features** - Archived CRM used Supabase subscriptions for live updates; new stack needs SSE/WebSocket implementation

**Critical Investigation Finding:** Several "missing" features have backend infrastructure already built but unused:
- Settings router fully implemented (tRPC mutations exist), UI just never calls them
- Invoice detail endpoint `getById()` exists, just needs UI route
- Database views created for reports (comprehensive PostgreSQL views), never queried

This reduces implementation effort by 5-7 days - just wire UI to existing backend for some features.

The archived CRM proved these features were necessary through production usage. They aren't "nice-to-haves" but validated user needs. Without feature parity, the Client-Hub feels incomplete and blocks production release for Q1-Q2 tax season when VAT validation is most critical.

This PRD establishes a systematic, evidence-based roadmap to complete the migration and unlock the platform's full potential.

---

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD Creation | 2025-10-22 | 1.0 | Created brownfield PRD from comprehensive project brief + 7-agent investigation findings covering all 59 features | PM Agent (John) |

---

## Requirements

### Summary

**Total Features:** 51 features requiring implementation (59 analyzed - 8 already complete)

| Tier | Feature Count | Estimated Effort |
|------|---------------|------------------|
| Tier 1: Critical Path | 4 features (FR1-FR4) | 5-9 days |
| Tier 2: High-Impact Workflows | 8 features (FR5-FR12) | 15-25 days |
| Tier 3: Advanced Features | 6 features (FR13-FR18) | 12-20 days |
| Tier 4: Staff Management | 7 features (FR19-FR25) | 30-40 days |
| Tier 5: Bulk Operations | 4 features (FR26-FR29) | 5-8 days |
| Tier 6: Polish & Enhancements | 5 features (FR30-FR34) | 3-5 days |
| **TOTAL** | **51 features** | **67-95 days** |

---

### Feature Mapping Table (34 FRs = 51 Individual Features)

| FR # | FR Name | Individual Features | Count |
|------|---------|---------------------|-------|
| **TIER 1** | | | **7** |
| FR1 | Legal Pages Implementation | 1. Privacy Policy page<br>2. Terms of Service page<br>3. Cookie Policy page<br>4. Footer links<br>5. Signup flow integration<br>6. Legal Settings admin UI | 6 |
| FR2 | HMRC VAT Validation | 7. HMRC VAT validation integration | 1 |
| FR3 | Invoice Detail Page | 8. Invoice detail page route & UI | 1 |
| FR4 | Client Code Generation Fix | 9. Deterministic client code generation | 1 |
| **TIER 2** | | | **13** |
| FR5 | Task Notes & Comments | 10. Task comments threading<br>11. @mentions parsing & notifications | 2 |
| FR6 | Time Approval Workflow | 12. Submit week for approval<br>13. Manager approval interface<br>14. Approve/reject actions<br>15. Min hours validation<br>16. Approval audit trail | 5 |
| FR7 | Settings Persistence | 17. Wire UI to backend settings router | 1 |
| FR8 | System Settings UI | 18. System settings backend integration | 1 |
| FR9 | Integration Settings UI | 19. Integration settings backend | 1 |
| FR10 | Bulk Import System | 20. Bulk import backend infrastructure | 1 |
| FR11 | Client CSV Import | 21. Client CSV import implementation | 1 |
| FR12 | Task Reassignment UI | 22. Task reassignment feature | 1 |
| **TIER 3** | | | **8** |
| FR13 | Task Templates System | 23. Task templates management | 1 |
| FR14 | Auto Task Generation | 24. Auto task generation from templates<br>25. Workflow trigger integration | 2 |
| FR15 | Reports Dashboard Backend | 26. Reports backend integration<br>27. Revenue/client/service report endpoints | 2 |
| FR16 | Real-time Activity Feed | 28. SSE implementation for activity feed | 1 |
| FR17 | Real-time Notifications | 29. Real-time notification push | 1 |
| FR18 | Workflow Triggers | 30. Automated workflow triggers | 1 |
| **TIER 4** | | | **15** |
| FR19 | Department Management | 31. Departments table & CRUD | 1 |
| FR20 | Staff Capacity Planning | 32. Staff capacity tracking<br>33. Utilization dashboards | 2 |
| FR21 | Working Patterns | 34. Working patterns management | 1 |
| FR22 | Holiday/Leave System | 35. Leave requests<br>36. Leave balances<br>37. Leave approval workflow<br>38. Leave calendar | 4 |
| FR23 | Time in Lieu Tracking | 39. TOIL accrual<br>40. TOIL redemption | 2 |
| FR24 | Staff Statistics Dashboard | 41. Individual staff utilization analytics<br>42. Department-level aggregations | 2 |
| FR25 | Work Type Management UI | 43. Work types table migration<br>44. Work type admin UI | 2 |
| **TIER 5** | | | **4** |
| FR26 | Service CSV Import | 45. Service CSV import | 1 |
| FR27 | Import Templates | 46. CSV import templates system | 1 |
| FR28 | CSV Parsing Service | 47. Generic CSV parser infrastructure | 1 |
| FR29 | Bulk Operations Extensions | 48. Bulk operations for clients/invoices/documents/users | 1 |
| **TIER 6** | | | **4** |
| FR30 | Upcoming Deadlines Widget | 49. Dashboard upcoming deadlines backend | 1 |
| FR31 | Notification Preferences | 50. Notification preferences persistence | 1 |
| FR32 | Email Automation | 51. Workflow-triggered email automation | 1 |
| FR33 | API Documentation | Bonus: API docs page (discovered, not in original 51) | - |
| FR34 | Weekly Timesheet Restoration | Bonus: Weekly timesheet full features (discovered) | - |

**Notes:**
- 34 grouped FRs expand to 51 discrete features for implementation
- FR33 & FR34 are additional discovered features beyond the original 51
- Total implementation scope: 51 core features + 2 discovered = 53 features

---

### Functional Requirements - TIER 1: Critical Path (5-9 days)

**FR1: Legal Pages Implementation**

The system shall provide three fully accessible legal pages:
- FR1.1: Privacy Policy page at route `/privacy`
- FR1.2: Terms of Service page at route `/terms`
- FR1.3: Cookie Policy page at route `/cookie-policy`
- FR1.4: Footer links to all three pages
- FR1.5: Legal page links in signup flow
- FR1.6: Content management for admins (Legal Settings UI)

**Rationale:** GDPR compliance requirement - PRODUCTION BLOCKER. Completely missing.

**FR2: HMRC VAT Validation Integration**

The system shall integrate with HMRC API for real-time VAT validation:
- FR2.1: OAuth 2.0 flow for HMRC authentication
- FR2.2: VAT validation in client onboarding wizard
- FR2.3: VAT validation in client edit forms
- FR2.4: Sandbox and production credential support
- FR2.5: Validation result display with success/failure indicators
- FR2.6: Follow Companies House pattern (clients.ts:490-607)
- FR2.7: Store validation status in database

**Rationale:** Eliminates manual verification, ensures data accuracy. Sandbox credentials available.

**FR3: Invoice Detail Page**

The system shall provide complete invoice detail view:
- FR3.1: Create route at `app/client-hub/invoices/[id]/page.tsx`
- FR3.2: Display full invoice details
- FR3.3: Line items table with descriptions, quantities, rates
- FR3.4: Payment history with dates and amounts
- FR3.5: PDF export capability
- FR3.6: Edit button (draft invoices only)
- FR3.7: Status change actions
- FR3.8: Wire to existing `invoices.getById()` tRPC endpoint

**Rationale:** Backend exists (line 97-122), just needs UI route. Currently only list view.

**FR4: Client Code Generation Fix**

The system shall generate client codes deterministically:
- FR4.1: Remove Math.random() from auto-convert-lead.ts:281-282
- FR4.2: Implement sequential or date-based suffix
- FR4.3: Check uniqueness before assignment
- FR4.4: Add unique constraint to clients.clientCode
- FR4.5: Handle collision scenarios gracefully

**Rationale:** Current bug uses random suffix. Prevents duplicates.

**Current Bug:** `const suffix = Math.floor(Math.random() * 1000)...` at line 281

---


### Functional Requirements - TIER 2: High-Impact Workflows (15-25 days)

**FR5: Task Notes & Comments System**

The system shall provide thread-based commenting on tasks:
- FR5.1: Create taskNotes table (task_id, user_id, note, is_internal, mentioned_users, created_at, updated_at)
- FR5.2: tRPC mutations: tasks.createNote, tasks.updateNote, tasks.deleteNote, tasks.getNotes
- FR5.3: @mention parsing (@username or @[User Name])
- FR5.4: @mention autocomplete dropdown (tenant users only)
- FR5.5: Notification integration for mentioned users
- FR5.6: Timestamp display (relative + absolute on hover)
- FR5.7: Edit history tracking
- FR5.8: Internal vs external flag (staff-only vs client-visible)
- FR5.9: Note deletion (owner or admin only)
- FR5.10: Activity feed integration (combine with assignment history)
- FR5.11: Complete UI at task-details.tsx:874-918 (currently skeleton)

**Rationale:** Eliminates email/Slack fragmentation. UI skeleton exists, zero backend.
**Effort:** 4-5 days

---


**FR6: Time Approval Workflow System**

The system shall implement manager approval for timesheets:
- FR6.1: Create timesheetSubmissions table (user_id, week_start/end_date, status, submitted_at, reviewed_by, reviewed_at, total_hours, reviewer_comments)
- FR6.2: Submit week for approval UI (button in timesheet view)
- FR6.3: Submission validation (prevent if < 37.5 hours configurable minimum)
- FR6.4: Manager approval interface at app/client-hub/time/approvals/page.tsx
- FR6.5: List pending submissions with user, week, hours details
- FR6.6: Bulk approve/reject actions
- FR6.7: Individual approve/reject with comments
- FR6.8: Approval notification emails
- FR6.9: Approval audit trail
- FR6.10: Resubmission workflow for rejected submissions
- FR6.11: tRPC procedures: timesheets.submit/approve/reject/getSubmissions

**Rationale:** Currently manual spreadsheet reconciliation. Saves 1.5 hours/week per manager. Entire workflow missing.
**Effort:** 5-7 days

---


**FR7: Settings Persistence**

The system shall wire settings UI to existing backend:
- FR7.1: Wire settings page to existing settings tRPC router
- FR7.2: Replace hardcoded handleSave() (line 84-86) with tRPC mutations
- FR7.3: Create userSettings table for per-user preferences
- FR7.4: Implement settings.updateTenant mutation calls
- FR7.5: Implement settings.updateNotificationSettings mutation calls
- FR7.6: Add loading states during save
- FR7.7: Error handling with user-friendly messages
- FR7.8: Optimistic updates with rollback on failure
- FR7.9: Real-time save indicators ("Saving..." then "Saved")
- FR7.10: Settings data fetching on load (replace hardcoded defaults)

**Rationale:** 0% save success rate currently. Backend router exists, UI just never calls it. Easiest gap to fix.
**Effort:** 2-3 days

---


**FR8: System Settings UI Backend Integration**

The system shall make system configuration functional:
- FR8.1: Replace useState with tRPC queries at settings/page.tsx:40-86
- FR8.2: Fetch via settings.getTenant query on page load
- FR8.3: Save via settings.updateTenant mutation
- FR8.4: Store in tenants.metadata JSONB field
- FR8.5: Settings: company name, email, phone, address, currency, date format, timezone, fiscal year

**Rationale:** 100% placeholder with local state. Critical for multi-tenant operations.
**Effort:** 2-3 days

---

**FR9: Integration Settings UI Backend**

The system shall provide functional integrations config:
- FR9.1: Create integrationSettings table (tenant_id, integration_type, enabled, credentials encrypted, last_sync_at)
- FR9.2: Xero integration toggle with OAuth flow
- FR9.3: QuickBooks/Sage/Slack/Teams/Stripe placeholders
- FR9.4: Integration status indicators (connected/disconnected, last sync)
- FR9.5: Test connection button per integration
- FR9.6: Secure credential storage with encryption

**Rationale:** Currently placeholder toggles with no API connections.
**Effort:** 3-4 days

---

**FR10: Bulk Import System Backend**

The system shall provide functional CSV import:
- FR10.1: Create API routes: /api/import/clients, /api/import/tasks, /api/import/services
- FR10.2: CSV parsing service (Papa Parse or similar)
- FR10.3: Import validation framework
- FR10.4: Dry run mode (validation without writes)
- FR10.5: Error reporting with row numbers
- FR10.6: Progress tracking
- FR10.7: Import templates generation
- FR10.8: Bulk database insertion with transactions
- FR10.9: Import audit trail
- FR10.10: Connect existing DataImportModal to new endpoints

**Rationale:** UI exists but calls non-existent endpoints (404 errors).
**Effort:** 5-6 days

---

**FR11: Client CSV Import**

The system shall support client CSV import:
- FR11.1: Client CSV template (company_name, client_code, email, phone, vat_number, etc.)
- FR11.2: Email format validation
- FR11.3: VAT number format validation (UK)
- FR11.4: Companies House number validation (API lookup)
- FR11.5: Date format parsing (multiple formats)
- FR11.6: Duplicate detection by email/companies_house_number
- FR11.7: Client manager assignment by email lookup
- FR11.8: Client type validation
- FR11.9: Status validation
- FR11.10: Bulk creation with tenantId enforcement

**Rationale:** Common operation for onboarding practice firms.
**Effort:** 2-3 days

---

**FR12: Task Reassignment UI**

The system shall provide task reassignment:
- FR12.1: Create taskAssignmentHistory table (task_id, from/to/changed_by user_ids, change_reason, assignment_type, changed_at)
- FR12.2: tRPC mutations: tasks.reassign, tasks.bulkReassign
- FR12.3: Reassignment modal component
- FR12.4: User selection dropdown (tenant users)
- FR12.5: Change reason textarea (optional)
- FR12.6: Assignment type selection (preparer/reviewer/assigned_to)
- FR12.7: Reassignment buttons in task details and bulk action bar
- FR12.8: Notifications to old and new assignee
- FR12.9: Assignment history view
- FR12.10: Intelligent reassignment suggestions (optional)

**Rationale:** Zero reassignment functionality exists.
**Effort:** 3-4 days

---

### Functional Requirements - TIER 3: Advanced Features (12-20 days)

**FR13: Task Templates System**

The system shall implement task template management:
- FR13.1: Create taskTemplates table (name_pattern, description_pattern, estimated_hours, priority, task_type, due_date_offset_days/months, service_component_id)
- FR13.2: Create taskTemplateServices table (template_id, service_id linkage)
- FR13.3: Create clientTaskTemplateOverrides table (client_id, template_id, custom_due_date, custom_priority)
- FR13.4: Task Settings UI at app/client-hub/settings/task-templates/page.tsx
- FR13.5: Template list/create/edit/delete interface
- FR13.6: Placeholder system: {client_name}, {service_name}, {period}, {tax_year}
- FR13.7: Due date offset configuration (e.g. "3 months after service activation")
- FR13.8: Template preview with example values
- FR13.9: Service-level template assignment
- FR13.10: Client-level override capability
- FR13.11: tRPC procedures: taskTemplates.list/create/update/delete

**Rationale:** Prerequisite for FR14 (Auto Task Generation). Archived CRM had comprehensive TaskSettings.tsx.
**Effort:** 5-6 days

---

**FR14: Auto Task Generation from Workflows**

The system shall automatically generate tasks from templates:
- FR14.1: Task generation triggered by service activation
- FR14.2: Placeholder replacement ({client_name} → actual client name, etc.)
- FR14.3: Due date calculation from offsets (addMonths, addDays)
- FR14.4: Target date calculation (default: 1 week before due date)
- FR14.5: Existing task deduplication (skip if name exists)
- FR14.6: Recurring vs one-time support (isRecurring field)
- FR14.7: Batch generation for recurring tasks (N months ahead)
- FR14.8: Auto-assignment to client manager
- FR14.9: Metadata tracking (auto_generated flag, template_id, service_id)
- FR14.10: "Generate Tasks" buttons in service detail/workflow completion
- FR14.11: Admin dashboard for auto-generated tasks
- FR14.12: tRPC: tasks.generateFromTemplate/generateRecurringTasks/bulkGenerateForClient

**Rationale:** Workflow system exists but doesn't auto-generate tasks. Depends on FR13.
**Effort:** 3-4 days

---

**FR15: Reports Dashboard Backend Integration**

The system shall provide full backend integration for reports:
- FR15.1: Create reports tRPC router at app/server/routers/reports.ts
- FR15.2: Create reports-queries.ts at lib/db/queries/
- FR15.3: Query existing PostgreSQL views (dashboardKpiView, monthlyRevenueView, clientRevenueView already exist at drizzle/0000_create_views.sql)
- FR15.4: Revenue chart data endpoint (monthly revenue aggregation)
- FR15.5: Client breakdown data endpoint (revenue by client)
- FR15.6: Service performance data endpoint (revenue by service)
- FR15.7: Replace hardcoded KPI zeros at reports/page.tsx:33-48 with real data
- FR15.8: Wire RevenueChart component to real data (currently empty array at line 186)
- FR15.9: Wire ClientBreakdown component to real data (currently empty array at line 187)
- FR15.10: Report export functionality (CSV/PDF)
- FR15.11: Drill-down capabilities (click chart segment → detail)
- FR15.12: Date range filtering (30/90/365 days, custom)

**Rationale:** Shows all zeros currently. Database views exist but never queried.
**Effort:** 3-4 days

---

**FR16: Real-time Activity Feed Updates**

The system shall provide live activity updates:
- FR16.1: Implement Server-Sent Events (SSE) for Phase 1
- FR16.2: Create SSE endpoint at app/api/activity/stream/route.ts
- FR16.3: Activity feed subscription (EventSource API)
- FR16.4: Server-side event emission when activity logs created
- FR16.5: Client-side event handling and feed update
- FR16.6: Reconnection logic with exponential backoff
- FR16.7: Heartbeat mechanism for stale connection detection
- FR16.8: Graceful degradation to polling if SSE fails
- FR16.9: Activity badge real-time updates (new activity count)
- FR16.10: Abstraction layer for future WebSocket migration (Phase 2)

**Rationale:** Archived CRM had real-time via Supabase subscriptions. SSE chosen for Phase 1 simplicity.
**Effort:** 2-3 days

---

**FR17: Real-time Notifications Push**

The system shall provide live notification updates:
- FR17.1: Extend SSE endpoint to include notifications channel
- FR17.2: Notification badge real-time updates (increment count on arrival)
- FR17.3: Toast notification display for high-priority notifications
- FR17.4: Notification sound (optional, user preference)
- FR17.5: Mark as read with optimistic UI update
- FR17.6: Notification grouping (combine similar notifications)

**Rationale:** Currently requires page refresh for new notifications.
**Effort:** 1-2 days

---

**FR18: Automated Task Generation Workflow Triggers**

The system shall trigger task generation on workflow completion:
- FR18.1: Workflow stage completion webhook/trigger
- FR18.2: Check if workflow has associated templates
- FR18.3: Generate next stage tasks automatically
- FR18.4: Notification to assignee when task auto-generated
- FR18.5: Workflow dashboard showing auto-generated tasks per workflow

**Rationale:** Completes the workflow automation loop. Depends on FR14.
**Effort:** 1-2 days

---

### Functional Requirements - TIER 4: Staff Management & Operations (30-40 days)

**FR19: Department Management**

The system shall provide department organization:
- FR19.1: Create departments table (tenant_id, name, description, manager_id, created_at, updated_at)
- FR19.2: Admin interface at app/admin/departments/page.tsx
- FR19.3: Department CRUD operations
- FR19.4: Department manager assignment
- FR19.5: Add departmentId field to users table
- FR19.6: User assignment to departments in user edit form
- FR19.7: Department-level reporting (aggregate metrics)
- FR19.8: Department filtering in staff lists and reports
- FR19.9: tRPC: departments.list/create/update/delete

**Rationale:** No departments table exists. Required for organizational structure.
**Effort:** 2-3 days

---

**FR20: Staff Capacity Planning**

The system shall track staff capacity and utilization:
- FR20.1: Create staffCapacity table (user_id, effective_from, weekly_hours, notes, created_at, updated_at)
- FR20.2: Capacity interface at app/admin/staff/capacity/page.tsx
- FR20.3: Capacity entry form (user, effective date, weekly hours)
- FR20.4: Capacity history view (changes over time)
- FR20.5: Utilization calculation: (actual hours / capacity hours) * 100
- FR20.6: Utilization dashboard per-staff
- FR20.7: Overallocation alerts (assigned > capacity)
- FR20.8: Underutilization alerts (logged < capacity by threshold)
- FR20.9: Capacity vs actual comparison charts (weekly/monthly)
- FR20.10: Workload balancing recommendations
- FR20.11: tRPC: staffCapacity.list/create/update/getUtilization

**Rationale:** Capacity planning completely missing. Required for resource management.
**Effort:** 3-5 days

---

**FR21: Working Patterns Management**

The system shall track working hours and patterns:
- FR21.1: Create workingPatterns table (user_id, pattern_type, contracted_hours, monday_hours, tuesday_hours...sunday_hours, effective_from, notes)
- FR21.2: Working patterns interface at app/admin/staff/working-patterns/page.tsx
- FR21.3: Pattern entry form with day-by-day hours
- FR21.4: Pattern templates (standard full-time 37.5h, part-time 20h, etc.)
- FR21.5: Pattern history per user
- FR21.6: Integration with time tracking for validation
- FR21.7: Pattern-aware capacity calculations
- FR21.8: Flexible arrangements support (compressed hours, job share)
- FR21.9: tRPC: workingPatterns.list/create/update/getByUser

**Rationale:** Working patterns missing. Required for accurate capacity calculations.
**Effort:** 2-3 days

---

**FR22: Holiday/Leave Request System**

The system shall manage staff leave:
- FR22.1: Create leaveRequests table (user_id, leave_type, start/end_date, days_count, status, requested_at, reviewed_by, reviewed_at, reviewer_comments, notes)
- FR22.2: Create leaveBalances table (user_id, year, annual_entitlement, annual_used, sick_used, toil_balance, carried_over)
- FR22.3: Leave request interface at app/client-hub/leave/page.tsx
- FR22.4: Leave request form (type, dates, notes)
- FR22.5: Manager approval interface at app/admin/leave/approvals/page.tsx
- FR22.6: Leave calendar showing team availability
- FR22.7: Leave balance widget showing remaining days
- FR22.8: Leave conflict detection (multiple team members same dates)
- FR22.9: Leave notification emails (submitted/approved/rejected)
- FR22.10: Leave carryover logic (transfer unused to next year, capped)
- FR22.11: Public holiday integration (UK bank holidays)
- FR22.12: tRPC: leave.request/approve/reject/getBalance/getCalendar

**Rationale:** Holiday/leave management completely absent. Required for operational maturity.
**Effort:** 3-5 days

---

**FR23: Time in Lieu Tracking**

The system shall track TOIL (Time Off In Lieu):
- FR23.1: TOIL accrual calculation (overtime hours beyond contracted)
- FR23.2: TOIL balance field in leaveBalances table
- FR23.3: TOIL accrual triggered by timesheet approval (calculate hours > contracted)
- FR23.4: TOIL redemption via leave request (leave_type: 'toil')
- FR23.5: TOIL balance widget in dashboard
- FR23.6: TOIL accrual history view (when earned and used)
- FR23.7: TOIL expiry policy (optional: expires after 6 months)
- FR23.8: Integration with working patterns for accurate accrual

**Rationale:** TOIL tracking missing. Required for flexible working arrangements.
**Effort:** 2-3 days

---

**FR24: Staff Statistics Dashboard**

The system shall provide detailed staff performance analytics:
- FR24.1: Individual staff utilization cards showing percentage
- FR24.2: 12-week utilization trend charts per staff
- FR24.3: Department-level utilization aggregations
- FR24.4: Staff comparison table (name, role, dept, hours, utilization %)
- FR24.5: Filters by status, role, department, date range
- FR24.6: Utilization heatmap (staff × weeks, color-coded)
- FR24.7: Export staff stats to CSV
- FR24.8: Utilization alerts (overallocated/underutilized staff)

**Rationale:** Basic role-level stats exist. Missing individual performance analytics.
**Effort:** 2-3 days

---

**FR25: Work Type Management UI**

The system shall provide work type configuration:
- FR25.1: Migrate from workTypeEnum to workTypes database table
- FR25.2: Create workTypes table (tenant_id, code, label, color_code, is_active, sort_order, is_billable)
- FR25.3: Admin interface at app/admin/settings/work-types/page.tsx
- FR25.4: Work type list with color indicators
- FR25.5: Work type create/edit form with color picker
- FR25.6: Soft delete (is_active flag) instead of hard delete
- FR25.7: Sort order drag-and-drop for UI ordering
- FR25.8: Update timeEntries.workType from enum to foreign key
- FR25.9: Seed default work types (Work, Admin, Training, Meeting, etc.)
- FR25.10: tRPC: workTypes.list/create/update/softDelete

**Rationale:** Work types are enum-based. Migrating to table enables per-tenant customization.
**Effort:** 3-4 days

---

### Functional Requirements - TIER 5: Bulk Operations & Import (5-8 days)

**FR26: Service CSV Import**

The system shall support service CSV import:
- FR26.1: Service CSV template (name, category, billing_type, description, default_rate, estimated_hours, is_active)
- FR26.2: Category validation (must match existing categories)
- FR26.3: Billing type validation (fixed/hourly/value)
- FR26.4: Rate format validation (decimal)
- FR26.5: Hours format validation (decimal)
- FR26.6: Duplicate detection by name
- FR26.7: Service component import support (optional nested structure)
- FR26.8: Bulk service creation with tenantId enforcement

**Rationale:** Enables rapid practice firm onboarding. Archived CRM had servicesImportService.ts.
**Effort:** 2-3 days

---

**FR27: Import Templates System**

The system shall provide downloadable CSV templates:
- FR27.1: Template generation endpoint per entity type (clients, services, tasks)
- FR27.2: Template includes headers row with field names
- FR27.3: Template includes example data row for reference
- FR27.4: Template includes comments row explaining field formats
- FR27.5: Template download button in import modals
- FR27.6: Template versioning (track changes over time)

**Rationale:** Import templates reduce user errors and provide clear format expectations.
**Effort:** 1-2 days

---

**FR28: CSV Parsing Service**

The system shall provide generic CSV parsing infrastructure:
- FR28.1: Generic CSV parser using Papa Parse library
- FR28.2: CSV line parsing with quote handling (commas inside quotes)
- FR28.3: Field mapping logic (map CSV columns to database fields)
- FR28.4: Value transformation utilities (date/number/boolean parsing)
- FR28.5: Validation framework (type checking, required fields, format validation)
- FR28.6: Error accumulation (collect all errors, don't fail on first)
- FR28.7: Support for multiple date formats (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
- FR28.8: Support for different delimiters (comma, semicolon, tab)
- FR28.9: BOM (Byte Order Mark) handling for UTF-8 with BOM files

**Rationale:** Generic parser enables consistent import behavior across entity types.
**Effort:** 2-3 days

---

**FR29: Bulk Operations Extensions**

The system shall extend bulk operations beyond tasks:
- FR29.1: Bulk client operations (status change, assign manager, tag)
- FR29.2: Bulk invoice operations (status change, send emails, export)
- FR29.3: Bulk document operations (move to folder, change category, delete)
- FR29.4: Bulk user operations (activate/deactivate, role change)
- FR29.5: Bulk action bars in all list views (similar to task bulk action bar)
- FR29.6: Confirmation dialogs for destructive bulk actions
- FR29.7: Progress indicators for long-running operations
- FR29.8: Bulk operation audit logging

**Rationale:** Bulk task operations exist. Extending to other entities restores archived CRM functionality.
**Effort:** 3-4 days

---

### Functional Requirements - TIER 6: Polish & Enhancements (3-5 days)

**FR30: Dashboard Upcoming Deadlines Widget**

The system shall display upcoming compliance deadlines:
- FR30.1: Query complianceItems table for upcoming deadlines
- FR30.2: Filter by due_date within next 30 days
- FR30.3: Sort by due_date ascending
- FR30.4: Display in dashboard widget (replace hardcoded "Corporation Tax - XYZ")
- FR30.5: Click deadline to navigate to compliance detail
- FR30.6: Deadline count badge showing total upcoming
- FR30.7: Color-coded urgency (red: <7 days, yellow: 7-14 days, green: 14-30 days)

**Rationale:** Dashboard widget is hardcoded placeholder. Other widgets work with real data.
**Effort:** 1 day

---

**FR31: Notification Preferences Backend**

The system shall persist user notification preferences:
- FR31.1: Create userSettings table if not exists (email_notifications, in_app_notifications, digest_email)
- FR31.2: Wire notification preferences UI to backend
- FR31.3: Implement settings.updateNotificationSettings mutation (currently logs but doesn't save)
- FR31.4: Notification preference enforcement (check before sending)
- FR31.5: Digest email scheduling (daily/weekly summary)

**Rationale:** Notification preferences UI exists but no persistence.
**Effort:** 2-3 days

---

**FR32: Email Automation for Workflows**

The system shall send automated emails on workflow events:
- FR32.1: Email template system (create emailTemplates table)
- FR32.2: Workflow-triggered email rules (send when stage completes)
- FR32.3: Task-triggered email rules (send when assigned, due soon, overdue)
- FR32.4: Client-triggered email rules (send when created, status changed)
- FR32.5: Email scheduling (delay sending, batch emails)
- FR32.6: Email queue with retry logic
- FR32.7: Email tracking (sent, opened, clicked via provider)
- FR32.8: Email template variables ({client_name}, {task_name}, {due_date}, etc.)

**Rationale:** Email automation exists for proposals/leads. Missing workflow-triggered emails.
**Effort:** 3-4 days

---

**FR33: API Documentation Page**

The system shall provide internal API documentation:
- FR33.1: Admin page at app/admin/api-docs/page.tsx
- FR33.2: tRPC endpoint listing with descriptions
- FR33.3: Request/response schema display (extracted from Zod schemas)
- FR33.4: Example requests and responses
- FR33.5: Authentication requirements per endpoint
- FR33.6: Rate limiting information
- FR33.7: External API documentation (Companies House, HMRC endpoints)
- FR33.8: Database schema documentation (tables, relationships)

**Rationale:** API documentation page existed in archived CRM (566 lines). Not ported.
**Effort:** 2-3 days

---

**FR34: Weekly Timesheet Full Restoration**

The system shall restore full weekly timesheet features:
- FR34.1: Dedicated weekly timesheet component (currently simplified into timesheet-grid)
- FR34.2: Week-at-a-glance grid view (7 days × work types)
- FR34.3: TOIL balance widget in weekly view
- FR34.4: Holiday balance widget in weekly view
- FR34.5: Week submission workflow (submit for approval button)
- FR34.6: Approval status indicator (pending/approved/rejected)
- FR34.7: Minimum hours warning (highlight if <37.5 hours)
- FR34.8: Daily totals and weekly total display

**Rationale:** Weekly timesheet view simplified (60% parity). Restoring full features.
**Effort:** 2-3 days

---

### Non-Functional Requirements

**NFR1: Performance Maintenance**
- Page load times: <3 seconds (95th percentile)
- API response times: <500ms for core operations
- Database queries must use indexes (no full table scans)
- Real-time features: <2 second latency

**NFR2: Browser Compatibility**
- Desktop: Chrome, Firefox, Safari, Edge (latest 2 versions)
- OS: Windows 10+, macOS 11+, Linux Ubuntu 20.04+
- Mobile: iOS 14+, Android 10+
- No IE support required (EOL June 2022)

**NFR3: Scalability for 100+ Users**
- Support 100+ concurrent users
- Unlimited clients per tenant
- Unlimited database size
- No performance degradation as data grows

**NFR4: Code Quality Standards**
- Biome formatting/linting (biome.json)
- TypeScript strict mode
- tRPC type safety for all APIs
- React Server Components (Next.js App Router patterns)
- shadcn/ui component usage per CLAUDE.md
- Sentry.captureException (not console.error except webhooks)

**NFR5: Test Coverage Requirements**
- Unit tests (Vitest) for tRPC routers
- Integration tests for multi-tenant isolation
- E2E tests (Playwright) for critical flows
- Maintain existing coverage standards

**NFR6: Security Standards**
- Sentry.captureException for errors (per CLAUDE.md Rule #14)
- Better Auth session validation
- SQL injection prevention via Drizzle ORM
- Encrypt sensitive data (integration credentials) at rest
- Zod schemas for all input validation
- HTTPS for all production endpoints

**NFR7: Real-time Performance**
- <2 second update latency from event to display
- 99.5% uptime for SSE connections
- Graceful reconnection with exponential backoff
- Fallback to polling if SSE fails

**NFR8: Bundle Size Control**
- Initial bundle size <500KB
- Code splitting for module routes
- Lazy loading for heavy components
- Tree-shaking for unused code
- Dynamic imports for optional features

**NFR9: Accessibility Baseline**
- Keyboard navigation for all interactive elements
- Semantic HTML (button, nav, main, article, etc.)
- ARIA labels where needed (icon-only buttons)
- Color contrast WCAG 2.1 AA (full audit Phase 2)

**NFR10: Documentation Standards**
- Seed data updates (scripts/seed.ts per CLAUDE.md Rule #11)
- Document complex integrations (HMRC, real-time)
- README updates for new environment variables
- Migration notes (document schema changes)

---

### Compatibility Requirements

**CR1: Existing API Compatibility**
- Existing tRPC procedure signatures cannot change without versioning
- New procedures may be added
- Optional parameters may be added
- Response formats must remain compatible (can add fields, not remove)

**CR2: Database Schema Compatibility**
- Follow CLAUDE.md Rule #12: Direct updates to lib/db/schema.ts (NO migration files)
- Use `pnpm db:reset` for development schema changes
- Seed data must be updated immediately after schema changes
- All new tables (except system) must include tenantId field
- Client portal tables must include both tenantId AND clientId (dual isolation)

**CR3: UI/UX Consistency**
- Use shadcn/ui components from components/ui/
- glass-card styling for cards (.glass-card class)
- glass-table wrapper for tables
- Solid backgrounds (no transparency per CLAUDE.md Rule #5)
  - White: rgb(255, 255, 255) not rgba
  - Dark slate: rgb(30, 41, 59)
- GlobalHeader/GlobalSidebar patterns for module layouts
- Gradient backgrounds: bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800
- Module colors: Client Hub #3b82f6 blue, Admin Panel #f97316 orange

**CR4: Integration Compatibility**
- HMRC API: Follow Companies House pattern (clients.ts:490-607)
- OAuth 2.0 flows use similar structure
- Webhooks: Follow DocuSeal pattern (/api/webhooks/docuseal)
- Signature verification required for webhooks
- Object storage: Use existing MinIO/S3 client pattern
- Environment-based configuration (sandbox/production)

**CR5: Multi-tenant Architecture Consistency**
- Standard tables: Include tenantId field with FK to tenants.id
- Client portal tables: Include both tenantId AND clientId (dual isolation per CLAUDE.md)
- System tables exempt: tenants, Better Auth tables (session, account, verification), drizzle_migrations
- Query filtering: All queries must include WHERE tenantId = ctx.authContext.tenantId
- Client portal queries: Must filter by both tenantId AND clientId

**CR6: Authentication Flow Compatibility**
- Middleware protects all routes except /, /sign-in, /sign-up
- Use getAuthContext() for server-side tenant context
- Respect role-based access control (admin vs staff) via tRPC
- Use protectedProcedure for authenticated endpoints
- Use adminProcedure for admin-only endpoints
- Session management via Better Auth session table

**CR7: Real-time Architecture Forward Compatibility**
- Real-time implementation must use abstraction layer
- Enable future migration from SSE (Phase 1) to WebSocket (Phase 2)
- API contract stable across transport changes
- Client code should not change when migrating transports
- Abstraction: Create lib/realtime/client.ts and lib/realtime/server.ts interfaces

---

## Epic and Story Structure

### Epic Approach

**Single Comprehensive Epic:** Practice Hub Feature Parity Restoration

**Rationale:** This is a unified feature parity project restoring 51 missing/partial features from the validated archived CRM. While large in scope (67-95 days), all features contribute to the single goal of achieving 100% feature parity for production readiness. Breaking into multiple epics would create artificial boundaries where features are interdependent (e.g., task templates depend on task notes, TOIL depends on leave system, etc.).

**Epic Structure:** Organize stories by implementation tier (1-6) to enable sprint planning while maintaining logical dependencies.

---

### Epic 1: Practice Hub Feature Parity Restoration

**Epic Goal:** Achieve 100% feature parity with archived CRM by implementing 51 missing/partial features across Client-Hub, Admin-Hub, and Proposal-Hub modules, enabling production release with complete regulatory compliance, workflow automation, staff management, and bulk operations capabilities.

**Integration Requirements:**
- Extend 15+ existing tRPC routers
- Create 20+ new database tables (direct schema updates, no migrations per CLAUDE.md)
- Implement HMRC API integration following Companies House pattern
- Build CSV import infrastructure with validation framework
- Implement SSE-based real-time updates with WebSocket migration abstraction
- Wire existing non-functional UI components to new/existing backends
- Enforce multi-tenant isolation (tenantId filtering) across all new features
- Maintain existing performance benchmarks (<3s loads, <500ms API, <2s real-time)

**Story Sequencing Rationale:**
Stories are sequenced by:
1. Production blockers first (legal pages, HMRC VAT)
2. Backend infrastructure before dependent features (templates before auto-generation, CSV parser before imports)
3. High-impact workflow features (task notes, time approvals) before staff management enhancements
4. Bulk operations and polish features last
5. Minimize risk - each story delivers value while maintaining system integrity

---

## Appendices

### A. Investigation Summary

This PRD is based on comprehensive analysis:

**Investigation Methodology:**
- 7 parallel specialized agents deployed to analyze 28 "investigation required" features
- 131 total features compared between archived CRM and current implementation
- Code-level evidence gathered with exact file locations and line numbers
- Conservative effort estimates (67-95 days) based on complexity analysis

**Key Findings:**
- **82 features complete (63%)** - Strong foundation exists
- **20 features partial (15%)** - UI exists but non-functional (settings 0% save rate, reports all zeros, bulk import UI calls 404 endpoints)
- **31 features missing (24%)** - Critical gaps blocking production

**Critical Discoveries:**
- HMRC sandbox credentials available in `.archive/practice-hub/.env`
- Companies House integration exists as reference pattern (clients.ts:490-607)
- Settings backend router fully implemented but UI never calls it (easiest gap to fix - 2-3 days)
- Database views exist for reports but never queried
- Real-time features in archived CRM used Supabase subscriptions; new stack requires SSE/WebSocket decision
- Client code generation uses Math.random() - confirmed bug at auto-convert-lead.ts:281-282

**Effort Estimate Revision:**
- Brief original estimate: 20-33 days (based on high-level analysis)
- Investigation revised: 67-95 days (based on code inspection revealing 59 total features, not 49)
- Difference explained by: deeper code analysis, discovered 4 additional features not in brief, complexity of partial features

**Reference Documentation:**
- Comprehensive Investigation Report: docs/.archive/COMPREHENSIVE-INVESTIGATION-REPORT.md
- Detailed Gap Analysis: docs/.archive/CLIENT-HUB-DETAILED-GAP-ANALYSIS.md
- Initial Gap Analysis: docs/.archive/crm-gap-analysis.md
- Archived CRM Reference: .archive/practice-hub/crm-app/

---

### B. Implementation Resources

**Code Reference Locations:**

**Missing Features (Build from Scratch):**
- HMRC Service Implementation: .archive/practice-hub/crm-app/main/src/services/hmrcService.ts
- Task Reassignment: .archive/practice-hub/crm-app/main/src/hooks/useTaskReassignment.tsx
- Task Notes: .archive/practice-hub/crm-app/main/src/hooks/useTaskNotes.tsx
- Task Templates: .archive/practice-hub/crm-app/main/src/pages/TaskSettings.tsx
- Staff Capacity: .archive/practice-hub/crm-app/main/src/hooks/useStaffCapacity.tsx
- CSV Import: .archive/practice-hub/crm-app/main/src/services/import/bulkImportService.ts

**Partial Features (Complete Integration):**
- Companies House Pattern: app/server/routers/clients.ts:490-607
- Task Notes UI Skeleton: app/client-hub/tasks/[id]/task-details.tsx:874-918
- Settings Backend (unused): app/server/routers/settings.ts:19-167
- Settings UI (local state): app/client-hub/settings/page.tsx:84-86
- Invoice Detail Endpoint: app/server/routers/invoices.ts:97-122
- Bulk Import Modal: components/client-hub/data-import-modal.tsx
- Client Code Bug: lib/client-portal/auto-convert-lead.ts:274-285

**Environment Configuration:**
- HMRC Sandbox Credentials: Available in `.archive/practice-hub/.env`
- Local Development: Docker Compose (PostgreSQL, MinIO, DocuSeal)
- Database Reset: `pnpm db:reset` (per CLAUDE.md Rule #12)

---

### C. Architectural Decisions

**Decision 1: Real-time Transport (Finalized)**
- **Selected:** Server-Sent Events (SSE) for Phase 1
- **Rationale:** Simpler than WebSocket, adequate for one-way server→client updates (activity feed, notifications), matches Next.js patterns
- **Migration Path:** Abstraction layer (lib/realtime/) enables future WebSocket upgrade in Phase 2 without client code changes

**Decision 2: Database RLS Strategy (Finalized)**
- **Phase 1 (MVP):** Application-level filtering (`WHERE tenantId = ctx.authContext.tenantId`)
- **Phase 2:** Database-level RLS policies (defense-in-depth)
- **Rationale:** Application-level sufficient for MVP velocity; RLS added before wider production for security hardening

**Decision 3: CSV Import Architecture (Finalized)**
- **Selected:** Server-side parsing (Node.js with Papa Parse)
- **Rationale:** Security (prevent malicious CSV uploads), validation control, consistent error handling, audit logging
- **Alternative Rejected:** Client-side parsing (security risk, inconsistent validation)

**Decision 4: Settings Storage (Finalized)**
- **Tenant settings:** tenants.metadata JSONB field (already exists)
- **User settings:** New userSettings table (FR7)
- **Integration settings:** New integrationSettings table (FR9)
- **Work types:** Migrate from enum to workTypes table (FR25)

---

### D. Risk Assessment

**Risk 1: Scope Underestimation (Medium)**
- **Issue:** 67-95 day estimate is 3x original brief estimate (20-33 days)
- **Mitigation:** Investigation-based estimates are more accurate; prioritize by tier to deliver incremental value
- **Impact:** Timeline extends but quality improves (no rushed delivery)

**Risk 2: Database RLS Security Gap Until Phase 2 (Low-Medium)**
- **Issue:** Application-level filtering depends on developer discipline; missing WHERE tenantId filter causes data leak
- **Mitigation:** Code review every query; automated multi-tenant isolation tests; implement database RLS early in Phase 2
- **Impact:** Potential tenant data leak if developer error occurs

**Risk 3: Real-time Architecture Complexity (Low)**
- **Issue:** Starting with SSE means potential refactoring to WebSocket in Phase 2
- **Mitigation:** Abstraction layer minimizes migration impact; SSE adequate for Phase 1 needs
- **Impact:** Phase 2 may require 2-3 days WebSocket migration

**Risk 4: HMRC Production Credentials Delay (Low)**
- **Issue:** Sandbox credentials exist; production credentials pending approval
- **Mitigation:** Implement with environment-based configuration; test with sandbox; swap credentials when available
- **Impact:** Production VAT validation delayed but not blocking for development

---

### E. Success Criteria

**MVP Launch Readiness Checklist:**
- [ ] ALL Tier 1 features complete and tested (4 features)
- [ ] ALL Tier 2 features complete and tested (8 features)
- [ ] ALL Tier 3 features complete and tested (6 features)
- [ ] ALL Tier 4 features complete and tested (7 features)
- [ ] ALL Tier 5 features complete and tested (4 features)
- [ ] ALL Tier 6 features complete and tested (5 features)
- [ ] Non-functional UI components eliminated (settings, reports, invoice details functional)
- [ ] Legal pages reviewed by counsel
- [ ] HMRC integration tested with sandbox credentials
- [ ] Real-time architecture implemented (SSE with abstraction layer)
- [ ] Staff training completed on ALL new features
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured for production
- [ ] Feature parity audit completed vs archived CRM (100% coverage confirmed)

**Definition of Done (Per Feature):**
1. Functional requirements implemented
2. Unit tests written (tRPC routers)
3. Integration tests written (multi-tenant isolation)
4. E2E tests written (critical user flows)
5. Code reviewed (especially tenantId filtering)
6. Seed data updated (if schema changed)
7. Documentation updated (complex features)
8. Performance benchmarks met (<3s loads, <500ms API)
9. Accessibility baseline met (keyboard nav, semantic HTML, ARIA)
10. Feature deployed to staging and tested by QA

---

## End of Document

**Document Version:** 1.0
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Phase:** 1 (Internal MVP - Client-Hub Gap Analysis)
**Total Features:** 51 features requiring implementation
**Total Effort:** 67-95 days (conservative estimate)

---
