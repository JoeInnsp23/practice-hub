# Epic 5: Bulk Operations & Data Import - Brownfield Enhancement

**Epic ID:** EPIC-5
**Status:** Draft
**Tier:** 5
**Estimated Effort:** 5-8 days
**Priority:** Medium
**Created:** 2025-10-22

---

## Epic Goal

Extend bulk import infrastructure to support service and task CSV imports, implement generic CSV parsing service, provide downloadable import templates, and extend bulk operations to clients/invoices/documents/users to enable rapid data import and efficient bulk management across all entity types.

---

## Epic Description

### Existing System Context

**Current State:**
- Bulk import infrastructure built in Epic 2 (FR10: CSV parsing, validation framework, API routes)
- Client CSV import implemented in Epic 2 (FR11)
- Bulk task operations exist (bulk action bar in task list)
- No bulk operations for clients, invoices, documents, or users
- No service CSV import
- No task CSV import
- No import template system

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy
- CSV Parsing: Papa Parse library (installed in Epic 2)

**Integration Points:**
- tRPC routers: extend import router (from Epic 2), clients.ts, invoices.ts, documents.ts, users.ts
- Import infrastructure: lib/services/csv-parser.ts (from Epic 2), /api/import/* routes
- Bulk action bars: components/client-hub/bulk-action-bar.tsx (pattern from tasks)
- Database schema: services, tasks, clients, invoices, documents, users tables

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 4 bulk operation features (4 individual capabilities):

1. **Service CSV Import (FR26)** - 1 feature
   - Service CSV template with category/billing validation
   - Bulk service creation with duplicate detection
   - **Status:** No service import exists
   - **Value:** Rapid practice firm onboarding (service catalog setup)

2. **Import Templates System (FR27)** - 1 feature
   - Downloadable CSV templates per entity type
   - Template generation with headers, examples, comments
   - **Status:** No template download system exists
   - **Value:** Reduces user errors, clear format expectations

3. **CSV Parsing Service Enhancement (FR28)** - 1 feature
   - Generic CSV parser with multiple delimiter support
   - Date format parsing (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
   - BOM handling for UTF-8 files
   - **Status:** Basic CSV parser exists (Epic 2), needs enhancements
   - **Value:** Consistent import behavior across entity types

4. **Bulk Operations Extensions (FR29)** - 1 feature
   - Bulk operations for clients, invoices, documents, users
   - Bulk action bars in all list views
   - **Status:** Only task bulk operations exist
   - **Value:** Efficient management across all entities

**How It Integrates:**
- Service import: Extend /api/import/ with services route, reuse validation framework from Epic 2
- Import templates: New /api/import/templates/[type]/route.ts endpoints
- CSV parser: Enhance lib/services/csv-parser.ts with multi-delimiter, date parsing, BOM handling
- Bulk operations: Create bulk action bars for client/invoice/document/user list views, extend tRPC routers with bulk mutations

**Success Criteria:**
- [ ] Service CSV import processing 50+ services without errors
- [ ] Import templates downloadable for clients, services, tasks
- [ ] CSV parser handles various delimiters (comma, semicolon, tab)
- [ ] CSV parser handles multiple date formats correctly
- [ ] Bulk client operations (status change, manager assignment, tags)
- [ ] Bulk invoice operations (status change, send emails, export)
- [ ] Bulk document operations (move to folder, category change, delete)
- [ ] Bulk user operations (activate/deactivate, role change)
- [ ] Zero regressions in existing import/bulk functionality

---

## Stories

### Story 1: Service CSV Import & Import Templates (FR26 + FR27)
**Effort:** 3-4 days

Implement service CSV import with category/billing validation and downloadable CSV templates for all entity types to enable rapid service catalog setup and reduce import errors.

**Acceptance Criteria (Service CSV Import - FR26):**
- Service CSV import endpoint: /api/import/services/route.ts
- Service CSV template structure: name, category, billing_type, description, default_rate, estimated_hours, is_active
- Template validation rules:
  - name: required, max 200 chars
  - category: must match existing categories (Accounting, Tax, Audit, Advisory, etc.)
  - billing_type: must be "fixed" | "hourly" | "value"
  - default_rate: decimal, >= 0
  - estimated_hours: decimal, >= 0
  - is_active: boolean (true/false, yes/no, 1/0)
- Category validation: check against existing service categories in database
- Billing type validation: validate enum value
- Rate format validation: parse decimal with currency symbols removed (£100.00 → 100.00)
- Hours format validation: parse decimal (8.5, 8:30 → 8.5)
- Duplicate detection by name: skip or update existing service
- Service component import support (optional): nested structure for service components
- Bulk service creation with tenantId enforcement (auto-add from auth context)
- Import preview: show first 5 rows before import (dry-run mode)
- Import summary: "42 services imported, 2 skipped (duplicates), 1 error"
- Service import validation: ensure default_rate and estimated_hours compatible with billing_type

**Acceptance Criteria (Import Templates - FR27):**
- Template generation endpoint: /api/import/templates/[type]/route.ts
- Template types supported: "clients", "services", "tasks", "users" (future: "invoices", "documents")
- Template structure:
  - Row 1: Headers (field names: company_name, email, phone, etc.)
  - Row 2: Example data (sample valid values)
  - Row 3: Comments (field format explanations: "DD/MM/YYYY format", "Required field", etc.)
- Template download button in import modals (DataImportModal component)
- Template generation logic: use entity schema definitions to generate headers
- Template versioning: track template version in file metadata (optional future enhancement)
- Template file format: CSV with UTF-8 encoding
- Template file naming: {entity_type}_import_template_{date}.csv (e.g., services_import_template_2025-10-22.csv)

**Technical Notes:**
- Service import: reuse CSV parser and validation framework from Epic 2
- Category validation: query services table for distinct categories
- Duplicate detection: check by (tenant_id, name) uniqueness
- Template generation: use Zod schemas to generate field definitions
- Template download: return CSV as Response with Content-Disposition: attachment header

---

### Story 2: CSV Parsing Service Enhancement & Task Import (FR28 + Task CSV Import)
**Effort:** 2-3 days

Enhance generic CSV parser with multiple delimiter support, date format parsing, and BOM handling, plus implement task CSV import to complete bulk import capabilities.

**Acceptance Criteria (CSV Parser Enhancement - FR28):**
- Extend lib/services/csv-parser.ts with enhanced features
- Multiple delimiter support: comma (,), semicolon (;), tab (\t)
- Delimiter auto-detection: analyze first row to detect delimiter
- Date format parsing: support DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
- Date format auto-detection: try multiple formats, use first successful parse
- BOM handling: strip UTF-8 BOM (\uFEFF) from file start if present
- Quote handling: properly handle quoted fields with delimiters inside ("Main St, Suite 5")
- Line ending handling: support \n, \r\n, \r
- Empty field handling: distinguish between empty string and null
- Error accumulation: collect all validation errors, don't fail on first error
- Field mapping: map CSV column names to database field names (flexible mapping)
- Value transformation utilities:
  - parseDate(value, formats): try multiple date formats
  - parseNumber(value): handle currency symbols (£, $, €), thousands separators (1,000.00)
  - parseBoolean(value): handle true/false, yes/no, 1/0, Y/N
- CSV parser configuration: { delimiter, dateFormats, encoding, skipEmptyLines, trimFields }

**Acceptance Criteria (Task CSV Import):**
- Task CSV import endpoint: /api/import/tasks/route.ts (wire to existing route from Epic 2)
- Task CSV template structure: title, description, task_type, priority, status, client_code, service_name, assigned_to_email, due_date, estimated_hours
- Template validation rules:
  - title: required, max 500 chars
  - task_type: must match enum
  - priority: must be "low" | "medium" | "high" | "urgent"
  - status: must match task status enum
  - client_code: lookup client by code, validate exists
  - service_name: lookup service by name (optional)
  - assigned_to_email: lookup user by email, validate tenant membership
  - due_date: date format (DD/MM/YYYY, YYYY-MM-DD)
  - estimated_hours: decimal
- Client lookup: find client by client_code, assign task.clientId
- Service lookup: find service by name (optional)
- User lookup: find user by email for assignment
- Duplicate detection: skip if task with same title exists for client
- Bulk task creation with tenantId enforcement
- Import preview and summary

**Technical Notes:**
- Use date-fns for date parsing: `parse(value, 'dd/MM/yyyy', new Date())`
- Delimiter detection: count occurrences of delimiters in first row
- BOM detection: check if file starts with \uFEFF
- Papa Parse config: { delimiter: 'auto', skipEmptyLines: true, transformHeader: (h) => h.trim() }
- Task import: reuse task creation validation from tasks.create mutation

---

### Story 3: Bulk Operations Extensions (FR29)
**Effort:** 3-4 days

Extend bulk operations beyond tasks to clients, invoices, documents, and users with bulk action bars in all list views and bulk mutation endpoints.

**Acceptance Criteria:**

**Bulk Client Operations:**
- Bulk action bar in client list view (app/client-hub/clients/page.tsx)
- Bulk actions:
  - Change status (active → inactive, inactive → active)
  - Assign/reassign client manager (select user from dropdown)
  - Add tags (multi-select tags, bulk tag assignment)
  - Export selected (CSV download)
  - Delete selected (soft delete, confirmation required)
- tRPC mutations: clients.bulkUpdateStatus, clients.bulkAssignManager, clients.bulkAddTags, clients.bulkDelete
- Selection: checkbox per row, "Select all" checkbox in header
- Bulk action confirmation: modal showing count ("Update status for 15 clients?")

**Bulk Invoice Operations:**
- Bulk action bar in invoice list view (app/client-hub/invoices/page.tsx)
- Bulk actions:
  - Change status (draft → sent, sent → paid, etc.)
  - Send invoice emails (bulk email send with template)
  - Export selected (CSV or PDF download)
  - Delete selected (soft delete, confirmation)
- tRPC mutations: invoices.bulkUpdateStatus, invoices.bulkSendEmails, invoices.bulkDelete
- Bulk email preview: show first 3 recipients before sending
- Progress indicator: "Sending 15 invoices... 8/15 sent"

**Bulk Document Operations:**
- Bulk action bar in document list view (app/client-hub/documents/page.tsx)
- Bulk actions:
  - Move to folder (select destination folder)
  - Change category (select new category)
  - Download selected (ZIP archive)
  - Delete selected (soft delete, confirmation)
- tRPC mutations: documents.bulkMove, documents.bulkChangeCategory, documents.bulkDelete
- ZIP download: server-side ZIP creation, stream to client

**Bulk User Operations:**
- Bulk action bar in user list view (app/admin/users/page.tsx)
- Bulk actions:
  - Activate/deactivate users (toggle is_active)
  - Change role (bulk role assignment)
  - Assign to department (select department)
  - Export selected (CSV download)
- tRPC mutations: users.bulkUpdateStatus, users.bulkChangeRole, users.bulkAssignDepartment
- Role change validation: prevent removing all admins
- Admin protection: prevent bulk deactivation of own account

**General Bulk Action Requirements:**
- Bulk action bars follow task bulk action pattern (BulkActionBar component)
- Confirmation dialogs for destructive actions (delete, deactivate)
- Progress indicators for long-running operations (>10 items)
- Bulk operation audit logging (log who performed bulk action, what changed)
- Error handling: show errors per item ("5 succeeded, 2 failed: [reasons]")
- Optimistic UI updates with rollback on failure
- Keyboard shortcuts: Cmd/Ctrl+A to select all

**Technical Notes:**
- Reuse BulkActionBar component from tasks (make generic)
- Bulk mutations: use Promise.all for parallel operations, wrap in transaction
- ZIP creation: use archiver library (`npm install archiver`)
- Audit logging: create bulkOperationLogs table (operation_type, entity_type, affected_ids[], performed_by, performed_at)
- Error handling: collect errors, return { succeeded: 5, failed: 2, errors: [...] }

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: bulk mutations, import endpoints)
- [x] Database schema changes are backward compatible (optional: bulkOperationLogs table for audit trail)
- [x] UI changes follow existing patterns (BulkActionBar component reused, glass-card, shadcn/ui)
- [x] Performance impact is minimal (bulk operations use transactions, imports are async jobs)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId)

**Schema Changes Required:**
```typescript
// Optional: bulkOperationLogs table for audit trail
export const bulkOperationLogs = pgTable("bulk_operation_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  operationType: text("operation_type").notNull(), // "status_change" | "assign" | "delete" | "email" | etc.
  entityType: text("entity_type").notNull(), // "clients" | "invoices" | "documents" | "users" | "tasks"
  affectedIds: text("affected_ids").array().notNull(),
  performedBy: text("performed_by").references(() => users.id).notNull(),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  metadata: json("metadata"), // operation-specific details
});
```

---

## Risk Mitigation

**Primary Risks:**

1. **CSV Parser Date Format Ambiguity**
   - **Risk:** Ambiguous date formats (01/02/2025 = Jan 2 or Feb 1?) cause incorrect data import
   - **Mitigation:** Document date format requirements clearly; prefer YYYY-MM-DD (unambiguous); show preview before import; allow format specification
   - **Impact:** Dates imported incorrectly, require manual correction
   - **Likelihood:** Medium | **Severity:** Medium

2. **Bulk Operation Performance at Scale**
   - **Risk:** Bulk operations on 1000+ items slow or timeout
   - **Mitigation:** Implement batch processing (chunks of 100); show progress indicator; use database transactions for consistency; add operation timeout warnings
   - **Impact:** Bulk operations take >30 seconds, may timeout
   - **Likelihood:** Low | **Severity:** Low

3. **Service Import Category Mismatch**
   - **Risk:** Imported services reference non-existent categories
   - **Mitigation:** Validate categories against database; provide clear error messages; suggest creating categories first; include category list in template comments
   - **Impact:** Service import fails with validation errors
   - **Likelihood:** Medium | **Severity:** Low

4. **Bulk Delete Accidental Data Loss**
   - **Risk:** User accidentally bulk deletes critical data
   - **Mitigation:** Require confirmation dialog; implement soft delete (is_active flag); provide "undo" within 30 days; audit log all deletions
   - **Impact:** Data temporarily unavailable (recoverable via soft delete)
   - **Likelihood:** Low | **Severity:** High

**Rollback Plan:**
- Service import: Remove service import endpoint, no impact on existing services
- Import templates: Remove template endpoints, no impact on existing imports
- CSV parser: Revert to basic parser from Epic 2
- Bulk operations: Remove bulk mutation endpoints, revert to single-item operations (existing state)

---

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Service CSV import processing 50+ services successfully
- [x] Import templates downloadable for clients, services, tasks
- [x] CSV parser handles multiple delimiters, date formats, BOM
- [x] Task CSV import processing tasks with client/service/user lookups
- [x] Bulk client operations functional (status, manager, tags, export, delete)
- [x] Bulk invoice operations functional (status, emails, export, delete)
- [x] Bulk document operations functional (move, category, download, delete)
- [x] Bulk user operations functional (status, role, department, export)
- [x] Unit tests written for CSV parser enhancements, bulk mutations
- [x] Integration tests for service/task import with various CSV formats
- [x] E2E tests for bulk operations (select items, perform action, verify results)
- [x] Multi-tenant isolation tests (validate tenantId filtering in bulk operations)
- [x] Performance tests for bulk operations (100+ items)
- [x] Seed data updated with sample services for import testing
- [x] Documentation updated: CSV format specifications, bulk operation guides, import troubleshooting
- [x] Code reviewed with focus on bulk operation transactions, CSV parsing edge cases
- [x] Performance benchmarks met (import 100 services <30s, bulk operation 100 items <10s)
- [x] No regressions in existing import/bulk functionality
- [x] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream Dependencies:**
- Epic 2 (High-Impact Workflows) completed for bulk import infrastructure (FR10: CSV parser, validation framework, import API routes)

**Downstream Dependencies:**
- None (final enhancement epic before polish)

**External Dependencies:**
- Papa Parse library (already installed in Epic 2)
- archiver library for ZIP creation (npm install archiver @types/archiver)
- date-fns library (already installed)

---

## Success Metrics

**Quantitative:**
- Service import: >50 services imported in first month
- Task import: >200 tasks imported in first month
- Template downloads: >20 template downloads per week
- Bulk operations: >100 bulk operations per month across all entity types
- CSV parser: Handle 95% of CSV files without manual format fixes

**Qualitative:**
- Service import enables rapid practice firm service catalog setup
- Import templates reduce user errors and support requests
- Enhanced CSV parser handles real-world CSV variations (Excel exports, Google Sheets, etc.)
- Bulk operations improve efficiency for administrative tasks
- Task import enables bulk task creation for recurring workflows

---

## Notes

- This epic extends bulk import infrastructure from Epic 2 (FR10-FR11)
- Service import is most requested after client import (survey data from archived CRM)
- CSV parser enhancements handle real-world CSV variations from Excel, Google Sheets, accounting software exports
- Bulk operations follow task bulk action pattern (reuse BulkActionBar component)
- Soft delete for bulk delete operations preserves data recovery capability
- Import templates reduce support burden for CSV format questions

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 5)
