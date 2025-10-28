# QA Test Plan: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Test Framework**: Playwright (E2E), Vitest (Unit/Integration)
**Test Environment**: Local dev, Staging, Production (smoke tests)

---

## Entry Criteria (Must Pass Before QA)

- [ ] All P0 items complete (GAP-001 + TEST-001)
- [ ] All P1 items complete (GAP-002, GAP-003, GAP-004) OR decisions deferred (DEC-002)
- [ ] Code review approved by Engineering Lead
- [ ] Unit tests passing (if applicable)
- [ ] Build successful (no TypeScript errors)
- [ ] Linting passed (Biome)
- [ ] Database schema updated (`pnpm db:reset` successful)

---

## Exit Criteria (Required for Production Deploy)

- [ ] All P0 E2E tests passing (TEST-001)
- [ ] All P1 E2E tests passing (TEST-002, TEST-003, TEST-004)
- [ ] Zero P0 bugs (critical blockers)
- [ ] P1 bugs triaged and accepted by Product Manager
- [ ] Regression testing complete (full manual QA pass)
- [ ] Smoke tests passed in staging
- [ ] Performance testing passed (task queries <500ms p95)
- [ ] SLO validation complete (error rate <1%)

---

## Test Suites

### Suite 1: Client Hub - Task Management (P0)

**Priority**: P0 (CRITICAL - Blocks Production)
**Test File**: `tests/e2e/regression/client-hub.spec.ts`
**Owner**: QA Engineer
**Estimated Time**: 2 hours (implementation + execution)

#### Test Cases

**TEST-001: My Tasks Filter (GAP-001 Validation)**
- **Priority**: P0
- **Description**: Validates OR logic across preparer/reviewer/assignedTo fields
- **Test Data**:
  - 3 test tenants
  - 10 tasks per tenant
  - Users with different role combinations:
    - User A: Assigned to 5 tasks (assignedTo)
    - User B: Preparer on 5 tasks (preparerId)
    - User C: Reviewer on 5 tasks (reviewerId)
    - User D: All 3 roles on different tasks
- **Steps**:
  1. Sign in as User A
  2. Navigate to My Tasks
  3. Verify 5 tasks shown (assignedTo filter)
  4. Sign in as User B
  5. Navigate to My Tasks
  6. Verify 5 tasks shown (preparer filter)
  7. Sign in as User C
  8. Navigate to My Tasks
  9. Verify 5 tasks shown (reviewer filter)
  10. Sign in as User D
  11. Navigate to My Tasks
  12. Verify all tasks shown (no duplicates)
- **Expected Results**:
  - Each user sees only their tasks
  - No duplicate tasks when user has multiple roles
  - Task count matches expected (5 tasks per role)
- **Flaky Policy**: Retry 3x, quarantine if still fails

**TEST-001b: Task Assignment Workflow**
- **Priority**: P0
- **Description**: Validates task creation and assignment
- **Steps**:
  1. Create new task
  2. Assign preparer, reviewer, assignedTo
  3. Verify task appears in My Tasks for all 3 users
  4. Update assignedTo to different user
  5. Verify old user no longer sees task, new user does
- **Expected Results**:
  - Task assignment updates My Tasks filter immediately
  - No orphaned tasks (tasks without any assignment)

**TEST-001c: Bulk Operations**
- **Priority**: P2 (Nice-to-have)
- **Description**: Validates bulk assign, bulk status update UI
- **Steps**:
  1. Select 5 tasks
  2. Bulk assign to User A
  3. Verify all 5 tasks appear in User A's My Tasks
  4. Bulk update status to "In Progress"
  5. Verify all 5 tasks have new status
- **Expected Results**:
  - Bulk operations complete in <5 seconds
  - All selected tasks updated atomically

---

### Suite 2: Proposal Hub - DocuSeal Integration (P1)

**Priority**: P1 (IMPORTANT - Should Pass Before Production)
**Test File**: `tests/e2e/regression/proposal-hub.spec.ts`
**Owner**: QA Engineer
**Estimated Time**: 3 hours (implementation + execution)

#### Test Cases

**TEST-002: Proposal Signing Flow**
- **Priority**: P1
- **Description**: Full proposal flow (create → send → sign → convert to invoice)
- **Test Data**:
  - 1 test tenant
  - 1 test client with email
  - DocuSeal webhook secret configured
- **Steps**:
  1. Create new proposal with line items
  2. Generate PDF
  3. Send for signature via DocuSeal
  4. Verify DocuSeal submission created (check API response)
  5. Simulate webhook: Proposal signed
  6. Verify proposal status updated to "signed"
  7. Convert signed proposal to invoice
  8. Verify invoice created with same line items
- **Expected Results**:
  - Proposal PDF generated and stored in S3
  - DocuSeal submission created (submission ID returned)
  - Webhook updates proposal status correctly
  - Invoice matches proposal line items
- **Flaky Policy**: Retry 3x (DocuSeal API may timeout), quarantine if still fails

**TEST-002b: Proposal Activities Audit Trail (GAP-003 Validation)**
- **Priority**: P1
- **Description**: Validates proposal activity tracking
- **Steps**:
  1. Create proposal
  2. Verify activity logged: "Proposal created"
  3. Update status to "sent"
  4. Verify activity logged: "Status changed to sent"
  5. Simulate signature via webhook
  6. Verify activity logged: "Proposal signed"
- **Expected Results**:
  - All status changes tracked in activities/notes
  - Timestamps accurate
  - User attribution correct

**TEST-002c: PDF Generation**
- **Priority**: P1
- **Description**: Validates proposal PDF generation and download
- **Steps**:
  1. Create proposal
  2. Generate PDF
  3. Verify presigned URL returned
  4. Download PDF via presigned URL
  5. Verify PDF contains proposal data (client name, line items, total)
- **Expected Results**:
  - PDF generated in <5 seconds
  - Presigned URL valid for 24 hours
  - PDF content matches proposal data

---

### Suite 3: Client Portal - Onboarding (P1)

**Priority**: P1 (IMPORTANT - Should Pass Before Production)
**Test File**: `tests/e2e/regression/client-portal.spec.ts`
**Owner**: QA Engineer
**Estimated Time**: 2 hours (implementation + execution)

#### Test Cases

**TEST-003: Client Portal Onboarding Flow**
- **Priority**: P1
- **Description**: Client portal onboarding checklist flow
- **Test Data**:
  - 1 test tenant
  - 1 test client (new, onboarding incomplete)
- **Steps**:
  1. Sign in as client user
  2. Navigate to onboarding checklist
  3. Verify all checklist items shown as incomplete
  4. Complete first task (e.g., "Verify your email")
  5. Verify task marked as complete (green checkmark, strikethrough)
  6. Complete remaining tasks
  7. Verify onboarding marked as 100% complete
- **Expected Results**:
  - Checklist UI shows correct completion state
  - Progress bar updates correctly
  - Completed tasks have green border and strikethrough
  - Onboarding completion triggers "Welcome" message

**TEST-003b: Client Isolation Validation**
- **Priority**: P0 (CRITICAL - Multi-tenant security)
- **Description**: Validates dual isolation (tenantId + clientId)
- **Steps**:
  1. Create 2 clients in same tenant
  2. Sign in as Client A
  3. Verify Client A sees only their own data (tasks, proposals, invoices)
  4. Sign in as Client B
  5. Verify Client B sees only their own data
  6. Attempt to access Client A's proposal (direct URL)
  7. Verify 403 Forbidden error
- **Expected Results**:
  - No data leakage between clients
  - Direct URL access blocked by auth context

---

### Suite 4: Client Hub - Time Tracking (P1)

**Priority**: P1 (IMPORTANT - Should Pass Before Production)
**Test File**: `tests/e2e/regression/timesheet-approval.spec.ts`
**Owner**: QA Engineer
**Estimated Time**: 2 hours (implementation + execution)

#### Test Cases

**TEST-004: Timesheet Approval Workflow**
- **Priority**: P1
- **Description**: Timesheet submission → approval → rejection workflow
- **Test Data**:
  - 1 test tenant
  - 2 test users (staff member, manager)
  - 5 timesheet entries
- **Steps**:
  1. Sign in as staff member
  2. Create 5 timesheet entries for current week
  3. Submit timesheets for approval
  4. Verify status changed to "pending approval"
  5. Sign in as manager
  6. Navigate to pending timesheets
  7. Approve 3 timesheets
  8. Verify approved timesheets marked as "approved"
  9. Reject 2 timesheets with reason
  10. Verify rejected timesheets marked as "rejected"
  11. Sign in as staff member
  12. Verify rejected timesheets show rejection reason
- **Expected Results**:
  - Timesheet approval flow works correctly
  - Rejection reasons visible to staff
  - Manager sees only pending timesheets (not approved/rejected)

**TEST-004b: Configurable Threshold Validation (Story 6.3)**
- **Priority**: P1
- **Description**: Validates user-configurable hour/day thresholds
- **Steps**:
  1. Sign in as staff member
  2. Navigate to settings
  3. Update timesheet thresholds (8 hours/day, 40 hours/week)
  4. Create timesheet entry: 10 hours in one day
  5. Verify warning shown: "Exceeds 8 hours/day threshold"
  6. Create timesheets totaling 45 hours in one week
  7. Verify warning shown: "Exceeds 40 hours/week threshold"
- **Expected Results**:
  - Thresholds configurable per user
  - Warnings shown when thresholds exceeded
  - Warnings do not block submission (just alerts)

---

### Suite 5: Client Hub - Bulk Operations (P2)

**Priority**: P2 (NICE-TO-HAVE - Can Defer)
**Test File**: `tests/e2e/regression/bulk-operations.spec.ts`
**Owner**: QA Engineer
**Estimated Time**: 2 hours (implementation + execution)

#### Test Cases

**TEST-005: Bulk Task Operations**
- **Priority**: P2
- **Description**: Bulk assign, bulk status update UI
- **Steps**:
  1. Navigate to task list
  2. Select 5 tasks (checkboxes)
  3. Click "Bulk Assign"
  4. Assign to User A
  5. Verify all 5 tasks assigned to User A
  6. Select same 5 tasks
  7. Click "Bulk Update Status"
  8. Update status to "In Progress"
  9. Verify all 5 tasks have new status
- **Expected Results**:
  - Bulk operations complete in <5 seconds
  - All selected tasks updated atomically
  - No partial updates (all or nothing)

---

## Performance Testing

### Task Query Performance
**Objective**: Validate task list queries complete in <500ms (p95)

**Test Scenarios**:
1. **Small dataset**: 10 tasks per tenant (10 tenants) = 100 tasks
   - Expected: <100ms p95
2. **Medium dataset**: 100 tasks per tenant (10 tenants) = 1000 tasks
   - Expected: <300ms p95
3. **Large dataset**: 1000 tasks per tenant (10 tenants) = 10,000 tasks
   - Expected: <500ms p95

**Tools**: Playwright `page.evaluate` with `performance.now()`, Sentry performance monitoring

**Pass Criteria**:
- [ ] p95 latency <500ms for large dataset
- [ ] p50 latency <200ms for large dataset
- [ ] No queries timeout (>5 seconds)

---

## Regression Testing (Manual QA)

### Smoke Tests (Post-Deploy)
**Estimated Time**: 1 hour
**Environment**: Staging, then Production

**Test Cases**:
1. **Authentication**:
   - [ ] Sign in with email/password
   - [ ] Sign out
   - [ ] Password reset flow

2. **Client Hub**:
   - [ ] View task list
   - [ ] Create new task
   - [ ] Edit task
   - [ ] My Tasks filter shows correct tasks
   - [ ] Task assignment workflow

3. **Proposal Hub**:
   - [ ] Create proposal
   - [ ] Generate PDF
   - [ ] Send for signature
   - [ ] View proposal status

4. **Client Portal**:
   - [ ] Sign in as client
   - [ ] View onboarding checklist
   - [ ] Complete checklist task
   - [ ] View proposals (client's own only)

5. **Time Tracking**:
   - [ ] Create timesheet entry
   - [ ] Submit for approval
   - [ ] Manager approves/rejects

### Full Regression Pass (Week 2 Day 1)
**Estimated Time**: 4 hours
**Environment**: Staging

**Scope**: All features in Client Hub, Proposal Hub, Client Portal, Time Tracking
**Objective**: Validate no regressions introduced by GAP fixes

**Test Matrix**:
| Module | Features | Test Cases | Priority |
|--------|----------|------------|----------|
| Client Hub | Tasks, Contacts, Time | 15 | P0 |
| Proposal Hub | Proposals, PDFs, Signing | 10 | P1 |
| Client Portal | Onboarding, Documents | 8 | P1 |
| Time Tracking | Timesheets, Approval | 7 | P1 |

---

## Test Data Management

### Seed Data Requirements
- **Tenants**: 3 test tenants (Tenant A, Tenant B, Tenant C)
- **Users**: 5 users per tenant (admin, manager, staff, preparer, reviewer)
- **Clients**: 5 clients per tenant
- **Tasks**: 10 tasks per tenant with varied assignments
- **Proposals**: 3 proposals per tenant (draft, sent, signed)
- **Timesheets**: 5 timesheet entries per user

### Test Data Reset
- **Before E2E Suite**: Run `pnpm db:reset` to ensure clean state
- **Between Tests**: Clean up created data (delete test tasks/proposals)
- **After E2E Suite**: Keep test data for debugging (if tests fail)

---

## Flaky Test Policy

### Retry Strategy
- **First run**: Run test once
- **If fails**: Retry 3 more times (total 4 runs)
- **Pass criteria**: 3 out of 4 runs pass (75% success rate)

### Quarantine Policy
- **Quarantine trigger**: Test fails 3+ times in a row
- **Quarantine action**: Move test to separate suite, don't block deploy
- **Fix deadline**: 1 sprint (2 weeks)
- **If not fixed**: Remove test or mark as known issue

---

## Bug Triage Process

### Bug Severity Levels
- **P0 (Critical)**: Blocks production deploy, core workflows broken
  - Example: My Tasks filter returns no results
  - SLA: Fix within 4 hours
- **P1 (High)**: Important features broken, workaround exists
  - Example: Proposal PDF generation fails (manual PDF as workaround)
  - SLA: Fix before production deploy
- **P2 (Medium)**: Minor issues, low user impact
  - Example: UI alignment off by 2px
  - SLA: Fix in next sprint
- **P3 (Low)**: Cosmetic issues, no functional impact
  - Example: Tooltip text typo
  - SLA: Backlog (fix when capacity allows)

### Bug Triage Meeting
- **When**: Week 2 Day 2 (after regression testing)
- **Attendees**: QA Engineer, Backend Developer, Product Manager
- **Agenda**:
  1. Review all bugs found in regression testing
  2. Assign severity (P0, P1, P2, P3)
  3. Decide: Fix before deploy OR defer
  4. Assign owners for P0/P1 bugs

---

## Test Execution Schedule

### Week 1: E2E Test Implementation
| Day | Test Suite | Owner | Status |
|-----|------------|-------|--------|
| Day 2 | TEST-001 (My Tasks) | QA Engineer | Blocked by GAP-001 |
| Day 3 | TEST-002 (Proposal Signing) | QA Engineer | Blocked by GAP-003 |
| Day 4 | TEST-003 (Client Portal) | QA Engineer | Ready |
| Day 4 | TEST-004 (Timesheet Approval) | QA Engineer | Ready |
| Day 5 | TEST-005 (Bulk Operations) | QA Engineer | Deferred (P2) |

### Week 2: QA Validation
| Day | Activity | Owner | Duration |
|-----|----------|-------|----------|
| Day 6 | Full Regression Testing | QA Engineer | 4 hours |
| Day 6 | Performance Testing | QA Engineer | 2 hours |
| Day 7 | Bug Triage Meeting | All | 1 hour |
| Day 7 | P0 Bug Fixes | Backend Dev | 4 hours |
| Day 9 | Smoke Tests (Staging) | QA Engineer | 2 hours |

### Week 3: Production Validation
| Day | Activity | Owner | Duration |
|-----|----------|-------|----------|
| Day 11 | Smoke Tests (Production) | QA Engineer | 1 hour |
| Day 11 | SLO Validation | DevOps | 1 hour |

---

## Test Reporting

### Test Results Dashboard
- **Location**: CI/CD pipeline (GitHub Actions or similar)
- **Metrics**:
  - Total tests run
  - Pass rate (should be >95%)
  - Flaky test count (should be <5%)
  - P0 bug count (should be 0 before production)

### Daily Test Reports (Week 2)
- **Format**: Email or Slack message
- **Contents**:
  - Tests run today
  - Bugs found (with severity)
  - Blockers for deployment
  - Next day plan

---

**Next Steps**:
1. Implement TEST-001 (My Tasks) after GAP-001 complete
2. Run E2E suite locally to validate tests pass
3. Schedule regression testing for Week 2 Day 1
4. Set up test data reset automation
