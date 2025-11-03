# Legacy Feature Inventory

**Source**: `.archive/practice-hub/` (React 19 + Vite + Supabase monorepo)
**Date**: 2025-10-27
**Apps Analyzed**: 9 workspace apps (home, crm, clients, proposal, social, bookkeeping, accounts, payroll, employee-portal)

---

## Overview

The legacy Practice Hub is a **multi-app monorepo** with 9 independent SPAs sharing common packages:
- **Framework**: React 19.1.1 + Vite 7.0.6 + React Router DOM v6
- **Backend**: Express.js servers per-app + Supabase PostgreSQL
- **Auth**: Supabase JWT with shared AuthProvider context
- **State**: TanStack React Query v5.56.2 + Zustand
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS
- **Notifications**: Sonner v1.5.0

---

## CLIENT HUB (clients-app)

### App Metadata
- **Port**: 6000
- **Base Path**: `/portal`
- **Purpose**: Lightweight client-facing portal (external user access)
- **Routes**: 3 pages

### Features

| ID | Feature | Route | Component/File | Evidence |
|----|---------|-------|----------------|----------|
| `CLIENT_HUB/AUTH_LOGIN` | Client Portal Login | `/portal/login` | `PortalLogin.tsx` | `.archive/clients-app/main/src/App.tsx:24` |
| `CLIENT_HUB/DASHBOARD` | Client Portal Dashboard | `/portal/dashboard` | `PortalDashboard.tsx` | `.archive/clients-app/main/src/App.tsx:36` |
| `CLIENT_HUB/DOCUMENTS` | Client Document Upload & Management | `/portal/documents` | `PortalDocumentsPage.tsx` | `.archive/clients-app/main/src/App.tsx:37` |

**Notes**:
- Protected by `PortalProtectedRoute` wrapper
- Public route: `/portal/login`
- Default redirect from `/` to `/portal/login`
- Uses `@shared/hooks/usePortalDocuments` for document access

---

## PROPOSAL HUB (proposal-app)

### App Metadata
- **Port**: 10000
- **Base Path**: `/` (root level)
- **Backend**: Express.js API on port 10000 (same server)
- **Purpose**: Sales pipeline and proposal management
- **Routes**: 8 pages

### Features

| ID | Feature | Route | Component/File | Evidence |
|----|---------|-------|----------------|----------|
| `PROPOSAL_HUB/DASHBOARD` | Proposal Hub Overview | `/` or `/dashboard` | `Dashboard.tsx` | `.archive/proposal-app/main/src/App.tsx:28-29` |
| `PROPOSAL_HUB/LEADS` | Lead Management & Tracking | `/leads` | `Leads.tsx` | `.archive/proposal-app/main/src/App.tsx:30` |
| `PROPOSAL_HUB/PROPOSALS` | Proposal CRUD & Workflow | `/proposals` | `Proposals.tsx` | `.archive/proposal-app/main/src/App.tsx:31` |
| `PROPOSAL_HUB/QUOTES` | Quote Generation & Tracking | `/quotes` | `Quotes.tsx` | `.archive/proposal-app/main/src/App.tsx:32` |
| `PROPOSAL_HUB/PIPELINE` | Visual Pipeline/Kanban View | `/pipeline` | `Pipeline.tsx` | `.archive/proposal-app/main/src/App.tsx:33` |
| `PROPOSAL_HUB/ANALYTICS` | Conversion & Win/Loss Analytics | `/analytics` | `Analytics.tsx` | `.archive/proposal-app/main/src/App.tsx:34` |
| `PROPOSAL_HUB/SETTINGS` | Proposal System Configuration | `/settings` | `Settings.tsx` | `.archive/proposal-app/main/src/App.tsx:35` |

### API Endpoints (Express.js)

| ID | Endpoint | Method | Handler | Purpose |
|----|----------|--------|---------|---------|
| `PROPOSAL_API/LIST` | `/api/v1/proposals` | GET | `server.js:152-195` | List proposals with pagination & filtering |
| `PROPOSAL_API/CREATE` | `/api/v1/proposals` | POST | `server.js:197-222` | Create new proposal |
| `PROPOSAL_API/GET` | `/api/v1/proposals/:id` | GET | `server.js:224-247` | Fetch single proposal by ID |
| `PROPOSAL_API/UPDATE` | `/api/v1/proposals/:id` | PUT | `server.js:249-276` | Update proposal details |
| `PROPOSAL_API/ACTIVITIES` | `/api/v1/proposals/:id/activities` | GET | `server.js:279-298` | Get proposal activity/notes history |
| `PROPOSAL_API/ADD_ACTIVITY` | `/api/v1/proposals/:id/activities` | POST | `server.js:300-327` | Add note/activity (audit trail) |
| `PROPOSAL_API/CONVERT` | `/api/v1/proposals/:id/convert` | POST | `server.js:329-393` | Convert accepted proposal to client |
| `PROPOSAL_API/ANALYTICS` | `/api/v1/proposals/analytics/pipeline` | GET | `server.js:395-471` | Get pipeline analytics (conversion, by status/source) |

**Key Behaviors**:
- **Organization Isolation**: All queries filter by `organization_id` from JWT
- **Conversion Logic**: Maps proposal fields → `crm_clients` table (lines 348-380)
- **Audit Trail**: Tracks `converted_at`, `converted_by`, `converted_to_client_id`
- **Analytics**: Calculates total proposals, total value, by_status, by_source, conversion_rate

### Data Models

**Proposal** (inferred from API):
- `id`, `organization_id`, `company_name`, `email`, `phone`, `address`
- `source` (enum: website, referral, linkedin, cold_call, partnership, other)
- `status` (enum: draft, sent, signed, declined, converted)
- `estimated_value` (decimal)
- `assigned_to` (user FK)
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `converted_to_client_id`, `converted_at`, `converted_by`

**Evidence**: `.archive/proposal-app/main/server/server.js:152-471`

---

## PRACTICE HUB CORE (crm-app)

### App Metadata
- **Port**: 3000 (main application)
- **Base Path**: `/crm`
- **Purpose**: Core practice management system (staff-facing)
- **Routes**: 28 pages
- **Backend**: Supabase PostgreSQL (shared)

### Task Management Features

| ID | Feature | Route/Hook | File | Evidence |
|----|---------|-----------|------|----------|
| `CRM/TASK_LIST` | List Tasks with Filters | `useTasks()` | `useTasks.ts:35-107` | Status, client, assignee, search filters |
| `CRM/TASK_GET` | Get Single Task | `useTasks(id)` | `useTasks.ts:109-136` | Fetches task with relations (client, users, time entries) |
| `CRM/TASK_CREATE` | Create Task | `useCreateTask()` | `useTasks.ts:138-203` | Supports adhoc, templated, recurring types |
| `CRM/TASK_UPDATE` | Update Task | `useUpdateTask()` | `useTasks.ts:205-272` | Auto-sets `completed_at` on status=completed |
| `CRM/TASK_DELETE` | Delete Task | `useDeleteTask()` | `useTasks.ts:274-299` | Soft or hard delete |
| `CRM/TASK_STATS` | Dashboard Stats | `useDashboardStats()` | `useTasks.ts:301-377` | My tasks, due this week, overdue, hours today |
| `CRM/TASK_REASSIGN` | Reassign Task | `useReassignTask()` | `useTaskReassignment.ts:63-228` | Preparer, reviewer, assigned_to with audit trail |
| `CRM/TASK_BULK_REASSIGN` | Bulk Reassign Tasks | `useBulkReassign()` | `useTaskReassignment.ts:230-383` | Multiple tasks to one user |
| `CRM/TASK_HISTORY` | Assignment History | `useAssignmentHistory()` | `useTaskReassignment.ts:7-32` | Full audit trail with from/to users |
| `CRM/TASK_SUGGESTIONS` | Reassignment Suggestions | `useSuggestions()` | `useTaskReassignment.ts:385-452` | AI-like suggestions by role priority |
| `CRM/CHECKLIST_PROGRESS` | Workflow Checklist Tracking | Component | `TaskChecklistTab.tsx:79-97` | Stage-based checklist with progress % |

**Task Status Enum**: `pending`, `in_progress`, `completed`, `cancelled`
**Priority Enum**: `high` (1), `medium` (2), `low` (3) - supports numeric mapping

### Task Assignment Workflow

**Evidence**: `.archive/crm-app/main/src/hooks/useTaskReassignment.ts:63-228`

```typescript
// Reassignment Logic
1. Get current assignee (based on assignment_type)
2. Validate new assignee exists and is active
3. Update task field (preparer_id | reviewer_id | assigned_to)
4. Create audit record in crm_task_assignment_history:
   - from_user_id, to_user_id, changed_by_user_id
   - assignment_type, change_reason
   - created_at
5. Send notification to new assignee (type: 'task_assigned' or 'task_reassigned')
6. Send notification to previous assignee (type: 'task_reassigned')
7. Invalidate React Query caches
```

**Side Effects**:
- **Audit Trail**: Every assignment change logged in `crm_task_assignment_history`
- **Notifications**: Both old and new assignees notified
- **Action URL**: Notification includes link to `/crm/tasks/${taskId}`

### Task Data Model

**Evidence**: `.archive/shared/types/src/database.types.ts` (crm_tasks section)

Fields:
- `id`, `organization_id`, `client_id`, `service_id`, `client_service_id`
- `name`/`title`, `description`
- `assigned_to`, `preparer_id`, `reviewer_id` (3 assignment fields)
- `status`, `priority`, `progress_percentage`, `completed_at`
- `deadline`, `target_date`, `due_date`, `estimated_hours`
- `workflow_instance_id`, `workflow_stage_id`, `workflow_template_id`
- `task_type` (adhoc, templated, recurring)
- `depends_on_task_ids` (array of task UUIDs)
- `metadata` (JSONB), `created_at`, `updated_at`, `deleted_at`

**Relations**:
- `client:crm_clients(name, client_code)`
- `preparer:crm_users(full_name)`
- `reviewer:crm_users(full_name)`
- `time_entries:crm_time_entries(hours)`
- `workflow_instance:crm_workflow_instances(name, status)`
- `workflow_stage:crm_workflow_stages(name, stage_order)`

### Workflow Checklist System

**Evidence**: `.archive/crm-app/main/src/components/tasks/TaskChecklistTab.tsx:24-67`

**Structure**:
```yaml
WorkflowInstance:
  id, name, status, template

WorkflowStage:
  id, name, description, stage_order, estimated_hours, is_required
  checklist_items: Array<ChecklistItem>

ChecklistItem:
  id, text
  sub_items: Array<ChecklistSubItem>

ChecklistSubItem:
  id, text, is_optional

ChecklistProgress:
  id, task_id, workflow_stage_id, checklist_item_id
  is_completed, completed_by, completed_at, progress_percentage
```

**Progress Calculation**:
- Per-stage: `checked_items / total_items * 100`
- Overall task: `sum(all_checked) / sum(all_items) * 100`

### Invoice Management Features

| ID | Feature | Hook | File | Evidence |
|----|---------|------|------|----------|
| `CRM/INVOICE_LIST` | List Invoices with Xero Sync | `useInvoices()` | `useInvoices.ts:103-220` | Search, filter by status/date/client |
| `CRM/INVOICE_XERO_SYNC` | Xero Invoice Sync Status | Embedded | `useInvoices.ts:6-59` | `xero_status`, `xero_last_sync_at` |
| `CRM/INVOICE_CLIENT_MATCH` | Manual Client Matching | Embedded | `useInvoices.ts:133-137` | Links Xero invoice to `client_id` |

**Invoice Data Model**:
- `id`, `organization_id`, `client_id` (optional, manual match)
- `xero_invoice_id`, `xero_invoice_number`, `xero_contact_id`, `xero_contact_name`
- `xero_status` (DRAFT, SUBMITTED, AUTHORISED, PAID, VOIDED, DELETED)
- `invoice_number`, `reference`, `type`, `status`, `sync_status`
- `sub_total`, `total_tax`, `total_amount`, `amount_due`, `amount_paid`
- `date`, `due_date`, `fully_paid_on_date`
- `assigned_to`, `task_id` (link to work)
- `currency_code`, `line_items` (JSON)

**Filter Logic**:
- **Search**: Invoice number, reference, contact name, client name
- **Status**: Xero status OR custom 'overdue' (due_date < today AND amount_due > 0)
- **Date Range**: Invoice.date between dateFrom and dateTo
- **Client**: Linked client_id
- **Exclusions**: Hides voided and deleted invoices

### Other CRM Routes (28 Pages Total)

**Evidence**: `.archive/crm-app/main/src/App.tsx` (186 lines)

Pages:
- `/crm/dashboard` - Dashboard.tsx
- `/crm/clients` - Clients.tsx
- `/crm/clients/:id` - ClientDetail.tsx
- `/crm/tasks` - Tasks.tsx
- `/crm/tasks/:id` - TaskDetail.tsx
- `/crm/documents` - Documents.tsx
- `/crm/timesheet` - Timesheet.tsx
- `/crm/time-entry` - TimeEntry.tsx
- `/crm/time-tracking` - TimeTracking.tsx
- `/crm/time-approvals` - TimeApprovals.tsx
- `/crm/invoices` - Invoices.tsx
- `/crm/invoices/:id` - InvoiceDetail.tsx
- `/crm/compliance` - Compliance.tsx
- `/crm/workflows` - Workflows.tsx
- `/crm/reports` - Reports.tsx
- `/crm/services` - Services.tsx
- `/crm/settings` - Settings page (admin only)
- `/crm/settings/branding` - BrandingSettings
- `/crm/settings/integrations` - IntegrationsSettings
- `/crm/settings/system` - SystemSettings
- `/crm/settings/legal` - LegalSettings
- `/crm/staff` - Staff management (staff role only)
- `/crm/admin/email-templates` - EmailTemplates (admin only)
- `/crm/admin/create-user` - CreateUser (admin only)
- `/crm/api-documentation` - API docs
- `/crm/admin/feedback` - AdminFeedback
- `/oauth/xero/callback` - Xero OAuth callback
- `/privacy-policy`, `/terms-and-conditions` - Legal pages (public)

---

## OTHER APPS (Inventory Only)

### Home App (Authentication Hub)
**Port**: 5000
**Routes**: Login, ResetPassword, UpdatePassword, HomePortal
**Purpose**: Entry point and password management

### Social App (Social Media Management)
**Port**: 5000 + 5001 (API)
**Routes**: Posts, Calendar, Templates, Analytics, Accounts (11 pages)
**Features**: BullMQ queue, Redis caching, Sharp image processing

### Bookkeeping App
**Purpose**: Financial accounting
**Pages**: Dashboard, BankAccounts, ChartOfAccounts, JournalEntries, Transactions, Reconciliation, VATManagement, IncomeTax, InvoiceAnalysis, Reports, Settings (11 pages)

### Accounts App
**Purpose**: Year-end accounts and statutory filings
**Pages**: Dashboard, WorkingPapers, StatutoryAccounts, TaxReturns, CompaniesHouseFiling, YearEnd, BookkeepingSync, Settings (8 pages)

### Payroll App
**Purpose**: Payroll processing
**Pages**: Dashboard, PayrollRuns, ClientPayroll, InternalPayroll, Reports, Settings (6 pages)

### Employee Portal App
**Port**: 11000
**Purpose**: Self-service employee portal
**Pages**: Dashboard, Profile, Payslips, Leave, TimeSubmission, Documents, Settings, Login (8 pages)

---

## SHARED PACKAGES

**Location**: `.archive/practice-hub/shared/`

Packages:
- `@shared/components` - Radix UI wrapped components (buttons, cards, dialogs, forms, etc.)
- `@shared/contexts` - AuthProvider, BrandingProvider
- `@shared/hooks` - useAuth, usePortalDocuments, custom hooks
- `@shared/services` - Supabase client, API services
- `@shared/types` - Global TypeScript interfaces (database.types.ts)
- `@shared/utils` - Helper functions

---

## KEY INTEGRATIONS

### Supabase (Auth + Database)
- **Auth**: JWT-based with email/password
- **Database**: PostgreSQL with RLS (Row-Level Security)
- **Storage**: File uploads (documents, images)

### Xero (Accounting)
- **Sync Direction**: Bidirectional (proposals → clients, invoices ← Xero)
- **OAuth**: `/oauth/xero/callback` route
- **Fields**: `xero_contact_id`, `xero_invoice_id`, `xero_status`, `xero_last_sync_at`

### Notifications
- **Library**: Sonner (toast notifications)
- **Types**: `task_assigned`, `task_reassigned`, `proposal_converted`
- **Delivery**: In-app notifications table with `action_url`

---

## TESTING

**Evidence**: No test files found in `.archive/` during discovery
**Status**: Minimal or no automated test coverage visible

---

## SUMMARY STATS

| Metric | Count |
|--------|-------|
| **Total Apps** | 9 |
| **Total Routes** | 70+ (across all apps) |
| **Client Hub Routes** | 3 (portal-only) |
| **Proposal Hub Routes** | 7 |
| **CRM Routes** | 28 |
| **API Endpoints** | 8+ (Proposal Express API) |
| **Shared Packages** | 6 |
| **Test Files** | 0 (not visible) |

---

**Next**: See [20-current-inventory.md](./20-current-inventory.md) for current app capabilities.
