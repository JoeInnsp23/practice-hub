# Prioritized Backlog: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Total Items**: 5 gaps + 5 test suites
**Estimated Effort**: 16.5 hours

---

## P0 Items (Critical Path - Must Fix Before Production)

### GAP-001: My Tasks Filter (Client Hub / Task Management)

**Status**: PARTIAL | **Severity**: HIGH | **Effort**: S (30 min) | **Confidence**: 85%

#### Problem / Why
Legacy app uses OR filter across 3 assignment fields (assignedTo, preparer, reviewer). Current app only checks `assignedToId`. Users assigned as preparer or reviewer won't see their tasks in "My Tasks" filter, breaking core workflow.

#### Acceptance Criteria
- [ ] Filter shows tasks where user is `assignedTo`
- [ ] Filter shows tasks where user is `preparer`
- [ ] Filter shows tasks where user is `reviewer`
- [ ] No duplicate tasks shown when user has multiple roles on same task
- [ ] E2E test (TEST-001) validates all 3 role scenarios

#### Implementation Notes
**Files to Update**:
- `lib/db/schema.ts:2788-2826` - Add `preparerId` to `taskDetailsView`
- `lib/db/queries/task-queries.ts:44-46` - Change filter to OR logic:
  ```typescript
  or(
    eq(taskDetailsView.assignedToId, userId),
    eq(taskDetailsView.preparerId, userId),
    eq(taskDetailsView.reviewerId, userId)
  )
  ```
- `app/server/routers/tasks.ts:313+` - Verify router uses updated query

**SQL Change**:
```sql
-- Add preparerId to taskDetailsView
ALTER VIEW taskDetailsView ADD COLUMN preparerId uuid;
```

#### Tests Required
- **TEST-001** (E2E): `tests/e2e/regression/client-hub.spec.ts`
  - Scenario 1: User assigned as `assignedTo` sees task
  - Scenario 2: User assigned as `preparer` sees task
  - Scenario 3: User assigned as `reviewer` sees task
  - Scenario 4: User with multiple roles sees task once (no duplicates)

#### Dependencies
- None (can start immediately)

#### Owner
Backend Developer

#### Estimate
0.5 hours (30 minutes)

#### Evidence
- **Primary**: `docs/gap-analysis/fixes/my-tasks-filter-fix.md` (complete fix proposal)
- **Legacy**: `.archive/crm-app/src/hooks/useTasks.ts:76-79` (OR filter logic)
- **Gap Analysis**: `docs/gap-analysis/30-gap-table.md:151-174`

---

## P1 Items (Important - Fix Before Production if Possible)

### GAP-002: Quotes Module (Proposal Hub / Quote Management)

**Status**: MISSING | **Severity**: MEDIUM | **Effort**: M (4 hours) | **Confidence**: 70%

#### Problem / Why
Legacy app has `/quotes` page. Current app has no `quotes` router. Unclear if quotes are proposal variants (`type='quote'`) or separate entity. If separate, missing CRUD operations.

#### Acceptance Criteria
- [ ] Verify quote data model (separate table vs proposal type)
- [ ] If separate: create `quotes` router with CRUD operations
- [ ] If type variant: document in architecture docs (`docs/architecture/proposal-hub.md`)
- [ ] E2E test validates quote creation/editing

#### Implementation Notes
**Option A: Quotes are Proposal Variants**
- Add `type` field to proposals table: `enum('proposal', 'quote')`
- Update proposal forms to support quote type
- Document in `docs/architecture/proposal-hub.md`

**Option B: Quotes are Separate Entity**
- Create `quotes` table mirroring proposals schema
- Create `app/server/routers/quotes.ts` with:
  - `create`, `update`, `delete`, `getById`, `list` procedures
- Add quotes UI pages in `app/proposal-hub/quotes/`

#### Tests Required
- If Option B: `tests/routers/quotes.test.ts` - CRUD operations
- E2E: Quote creation/editing flow

#### Dependencies
- **BLOCKER**: Decision DEC-002 (product clarification required)

#### Owner
Backend Developer + Frontend Developer

#### Estimate
4 hours (assumes Option B - separate module)

#### Evidence
- **Legacy**: `.archive/proposal-app/main/src/App.tsx:32` (quotes page exists)
- **Gap Analysis**: `docs/gap-analysis/30-gap-table.md:74`

---

### GAP-003: Proposal Activities/Notes (Proposal Hub / Activities)

**Status**: PARTIAL | **Severity**: MEDIUM | **Effort**: S (3 hours) | **Confidence**: 65%

#### Problem / Why
Legacy has `/api/v1/proposals/:id/activities` endpoint tracking proposal audit trail (creation, status changes, signatures). Current app may not track these events explicitly. Need to verify if merged into notes system or missing.

#### Acceptance Criteria
- [ ] Proposal creation events logged
- [ ] Status change events tracked (draft → sent → signed → converted)
- [ ] Notes tracked with timestamps
- [ ] Signature events captured (via DocuSeal webhook)
- [ ] Audit trail visible in UI

#### Implementation Notes
**Option A: Use Existing Notes System**
- Verify `notes` table tracks proposal events
- Add activity types: `proposal_created`, `status_changed`, `signed`
- Update proposal router to create notes on events

**Option B: Create Separate Activities Table**
- Create `proposalActivities` table with:
  - `id`, `proposalId`, `userId`, `type`, `metadata`, `createdAt`
- Create `proposalActivities` router
- Add UI component to display timeline

#### Tests Required
- `tests/routers/proposal-activities.test.ts` - Activity audit trail
- E2E: Verify activity timeline in proposal detail page

#### Dependencies
- None (can start after GAP-001)

#### Owner
Backend Developer

#### Estimate
3 hours

#### Evidence
- **Legacy**: `.archive/proposal-app/main/server/server.js:279-327` (activities endpoint)
- **Gap Analysis**: `docs/gap-analysis/30-gap-table.md:75`

---

### GAP-004: Invoice PDF Generation (Invoice Management)

**Status**: PARTIAL | **Severity**: MEDIUM | **Effort**: S (3 hours) | **Confidence**: 60%

#### Problem / Why
Invoices router exists but no `generatePdf` mutation visible. Unclear if PDF generation is linked to documents system or missing. Invoices need printable PDFs for client delivery.

#### Acceptance Criteria
- [ ] Generate invoice PDF from invoice data
- [ ] Store PDF in S3/MinIO
- [ ] Return presigned URL with TTL (24 hours)
- [ ] Track PDF generation timestamp in `invoices` table
- [ ] E2E test validates PDF generation

#### Implementation Notes
**Files to Update**:
- `app/server/routers/invoices.ts` - Add `generatePdf` mutation:
  ```typescript
  generatePdf: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch invoice data
      // 2. Generate PDF with invoice template
      // 3. Upload to S3
      // 4. Update invoice.pdfUrl
      // 5. Return presigned URL
    })
  ```
- Create PDF template (use similar approach to proposal PDFs)
- Use existing S3 upload helper from `lib/s3.ts`

#### Tests Required
- `tests/routers/invoices.test.ts` - PDF generation mutation
- E2E: Generate PDF, verify download URL works

#### Dependencies
- S3/MinIO configured (already done)

#### Owner
Backend Developer

#### Estimate
3 hours

#### Evidence
- **Current**: `app/server/routers/invoices.ts` (no generatePdf mutation found)
- **Gap Analysis**: `docs/gap-analysis/30-gap-table.md:94`

---

## P2 Items (Nice-to-Have - Can Defer Post-MVP)

### GAP-005: Custom Report Builder (Reporting / Analytics)

**Status**: PARTIAL | **Severity**: LOW | **Effort**: L (8 hours) | **Confidence**: 60%

#### Problem / Why
Reports page exists but feature scope may be limited vs legacy ad-hoc reporting. Unclear if custom SQL query builder or parameterized reports are supported.

#### Acceptance Criteria
- [ ] Define supported report types (e.g., task reports, time reports, client reports)
- [ ] Document report parameters in `docs/features/reports.md`
- [ ] If ad-hoc SQL needed: add SQL query builder with safety constraints (prevent DELETE/DROP, limit to SELECT)

#### Implementation Notes
**Recommendation**: Defer to post-MVP. Focus on core practice management features first.

If implementing:
- Create `reportDefinitions` table with saved queries
- Add SQL parser to validate SELECT-only queries
- Use parameterized queries to prevent SQL injection
- Add UI for report builder in `app/client-hub/reports/builder/`

#### Tests Required
- If implemented: SQL injection prevention tests
- E2E: Create custom report, run, validate results

#### Dependencies
- None

#### Owner
Backend Developer + Product Manager (scope clarification)

#### Estimate
8 hours (deferred)

#### Evidence
- **Legacy**: `.archive/crm-app/main/src/App.tsx` (Reports.tsx page)
- **Current**: `app/client-hub/reports/page.tsx`, `app/server/routers/reports.ts`
- **Gap Analysis**: `docs/gap-analysis/30-gap-table.md:214`

---

## Test Gaps (E2E Coverage Required)

### TEST-001: My Tasks Filter E2E (P0)
**File**: `tests/e2e/regression/client-hub.spec.ts`
**Priority**: P0 (Critical)
**Effort**: 1 hour
**Description**: Validates OR logic across preparer/reviewer/assignedTo fields
**Suite**: Client Hub - Task Management
**Blocks**: Production deployment

### TEST-002: Proposal Signing Flow E2E (P1)
**File**: `tests/e2e/regression/proposal-hub.spec.ts`
**Priority**: P1 (Important)
**Effort**: 2 hours
**Description**: Full proposal flow (create → send → sign → convert to invoice)
**Suite**: Proposal Hub - DocuSeal Integration

### TEST-003: Client Portal Onboarding E2E (P1)
**File**: `tests/e2e/regression/client-portal.spec.ts`
**Priority**: P1 (Important)
**Effort**: 1 hour
**Description**: Client portal onboarding checklist flow
**Suite**: Client Portal - Onboarding

### TEST-004: Timesheet Approval Workflow E2E (P1)
**File**: `tests/e2e/regression/timesheet-approval.spec.ts`
**Priority**: P1 (Important)
**Effort**: 1 hour
**Description**: Timesheet submission → approval → rejection workflow
**Suite**: Client Hub - Time Tracking

### TEST-005: Bulk Operations E2E (P2)
**File**: `tests/e2e/regression/bulk-operations.spec.ts`
**Priority**: P2 (Nice-to-have)
**Effort**: 1 hour
**Description**: Bulk assign, bulk status update UI
**Suite**: Client Hub - Task Management

---

## Summary Table

| Priority | Items | Estimated Hours | Blocks Production? |
|----------|-------|-----------------|-------------------|
| **P0** | 1 gap + 1 test | 1.5 hours | YES |
| **P1** | 3 gaps + 4 tests | 15 hours | RECOMMENDED |
| **P2** | 1 gap + 1 test | 9 hours | NO (defer) |

**Total P0+P1 Effort**: 16.5 hours (2 developer-days)

---

**Next Steps**:
1. Assign GAP-001 to backend developer (start immediately)
2. Schedule decision meetings for GAP-002, GAP-003, GAP-004
3. QA lead: Plan TEST-001 implementation after GAP-001 complete
