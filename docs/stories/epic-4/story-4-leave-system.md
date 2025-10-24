# User Story: Holiday/Leave Request System

**Story ID:** STORY-4.4
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR22 - Holiday/Leave Management
**Priority:** Medium
**Effort:** 3-5 days
**Status:** Ready for Development

---

## User Story

**As a** staff member
**I want** comprehensive holiday/leave management with requests, approvals, and balance tracking
**So that** I can manage my leave and managers can approve team leave efficiently

---

## Business Value

- **Operational Maturity:** Professional leave management system
- **Transparency:** Clear leave balances and calendar visibility
- **Compliance:** Tracked annual entitlements and usage

---

## Acceptance Criteria

**AC1:** leaveRequests table created (user_id, leave_type, start_date, end_date, days_count, status, reviewer fields)
**AC2:** leaveBalances table created (user_id, year, annual_entitlement, annual_used, sick_used, toil_balance, carried_over)
**AC3:** Leave request interface at `/client-hub/leave`
**AC4:** Request form: type (annual_leave, sick_leave, toil, unpaid, other), date range, notes
**AC5:** Date validation: prevent overlaps, past dates
**AC6:** Days count calculation: working days (exclude weekends, public holidays)
**AC7:** Balance validation: prevent if insufficient annual leave
**AC8:** Manager approval interface at `/admin/leave/approvals`
**AC9:** Approval list with bulk approve/reject
**AC10:** Leave calendar at `/client-hub/leave/calendar` (month view, color-coded)
**AC11:** Leave balance widget: "15 days remaining (25 - 10 used)"
**AC12:** Conflict detection: alert if team members request same dates
**AC13:** Email notifications: submitted, approved, rejected
**AC14:** Carryover logic: transfer unused leave to next year (max 5 days)
**AC15:** Public holiday integration (UK bank holidays)
**AC16:** Leave history per user
**AC17:** tRPC: leave.request, approve, reject, cancel, getBalance, getCalendar, getHistory, getTeamLeave

---

## Technical Implementation

```typescript
// leaveRequests table
export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysCount: real("days_count").notNull(),
  status: text("status").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewerComments: text("reviewer_comments"),
  notes: text("notes"),
});

// leaveBalances table
export const leaveBalances = pgTable("leave_balances", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  annualEntitlement: real("annual_entitlement").notNull(),
  annualUsed: real("annual_used").default(0).notNull(),
  sickUsed: real("sick_used").default(0).notNull(),
  toilBalance: real("toil_balance").default(0).notNull(),
  carriedOver: real("carried_over").default(0).notNull(),
});

// Calculate working days
import { differenceInBusinessDays } from "date-fns";
const daysCount = differenceInBusinessDays(endDate, startDate) + 1;

// Color coding: annual (green), sick (red), toil (blue), unpaid (gray)
```

---

## Definition of Done

- [ ] leaveRequests, leaveBalances tables created
- [ ] Leave request UI functional
- [ ] Manager approval interface working
- [ ] Leave calendar displaying
- [ ] Balance calculations correct
- [ ] Conflict detection working
- [ ] Email notifications sent
- [ ] Carryover logic implemented
- [ ] Public holidays integrated
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR22)

## QA Results

### Review Date: 2025-10-23

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Overall Implementation Quality: 7.5/10**

The leave management system demonstrates solid architecture and security-conscious design. The tRPC router (`app/server/routers/leave.ts`) is exceptionally well-implemented with comprehensive validation logic, proper multi-tenant isolation, and thoughtful error handling. The database schema is well-designed with appropriate indexes and cascading delete rules. UI components follow Practice Hub design standards with glass-card styling and consistent color schemes.

**Key Strengths:**
- Robust backend validation (6 validation checks in request endpoint)
- Proper multi-tenant security (tenantId enforced in all queries)
- Good separation of concerns (router, schema, utilities, components)
- Working days calculation correctly excludes weekends + UK bank holidays
- Integration tests cover critical TOIL redemption scenarios

**Areas of Concern:**
- Two acceptance criteria not implemented (AC13, AC14)
- Build currently failing due to syntax error
- Missing unit test coverage for working-days.ts utility
- Formatting issues in multiple new components
- UK bank holidays hardcoded (not scalable beyond 2026)

### Refactoring Performed

**No refactoring performed** - Build failure and missing ACs prevent safe refactoring. Must resolve critical issues first.

### Compliance Check

- **Coding Standards**: ⚠️ PARTIAL
  - **Issue**: Formatting violations in 5+ new components
  - **Details**: approval-actions-modal.tsx, approval-list.tsx, leave-calendar.tsx need `pnpm exec biome format --write`
  - **Impact**: Build may fail, inconsistent code style

- **Project Structure**: ✓ PASS
  - All files in correct locations per unified-project-structure.md
  - Components properly organized under `components/client-hub/leave/` and `components/admin/leave/`
  - tRPC router in `app/server/routers/leave.ts`

- **Testing Strategy**: ⚠️ CONCERNS  
  - **Gap**: No unit tests for `lib/leave/working-days.ts` (critical business logic)
  - **Gap**: No UI component tests
  - **Gap**: No E2E tests for leave request workflow
  - **Strength**: Good integration test (`leave-toil-integration.test.ts`) with 6 comprehensive scenarios

- **All ACs Met**: ✗ FAIL
  - **AC13 NOT IMPLEMENTED**: Email notifications (submitted, approved, rejected)
  - **AC14 NOT IMPLEMENTED**: Carryover logic (schema field exists but no business logic)
  - 15 of 17 ACs fully implemented (88% complete)

### Requirements Traceability

#### Given-When-Then Mapping

| AC | Requirement | Test Coverage | Status |
|----|-------------|---------------|--------|
| AC1 | leaveRequests table created | Schema validation | ✅ PASS |
| AC2 | leaveBalances table created | Schema validation | ✅ PASS |
| AC3 | Leave request UI at `/client-hub/leave` | Manual verification needed | ✅ IMPLEMENTED |
| AC4 | Request form with all fields | Manual verification needed | ✅ IMPLEMENTED |
| AC5 | Date validation (overlaps, past dates) | `leave-toil-integration.test.ts` line 73-106 | ✅ PASS |
| AC6 | Working days calculation | Indirect via integration tests | ⚠️ NO UNIT TESTS |
| AC7 | Balance validation | `leave-toil-integration.test.ts` line 73-106 | ✅ PASS |
| AC8 | Manager approval interface | Manual verification needed | ✅ IMPLEMENTED |
| AC9 | Bulk approve/reject | Manual verification needed | ✅ IMPLEMENTED |
| AC10 | Leave calendar | Manual verification needed | ✅ IMPLEMENTED |
| AC11 | Balance widget | Manual verification needed | ✅ IMPLEMENTED |
| AC12 | Conflict detection | `getConflicts` endpoint (leave.ts:673-724) | ⚠️ NO TESTS |
| AC13 | Email notifications | **NOT IMPLEMENTED** | ❌ FAIL |
| AC14 | Carryover logic | **NOT IMPLEMENTED** | ❌ FAIL |
| AC15 | UK bank holidays | `working-days.ts:7-38` | ⚠️ NO TESTS |
| AC16 | Leave history | `getHistory` endpoint (leave.ts:574-607) | ⚠️ NO TESTS |
| AC17 | All tRPC endpoints | Integration tests cover some | ⚠️ PARTIAL |

**Test Coverage Summary:**
- **Integration Tests**: 6 tests (TOIL-focused)
- **Unit Tests**: 0 tests  
- **E2E Tests**: 0 tests
- **UI Component Tests**: 0 tests

**Coverage Gaps (P0 - Must Fix):**
1. Unit tests for `working-days.ts` (critical business logic)
2. Tests for `getConflicts` endpoint (security-sensitive)
3. Tests for balance validation edge cases

### Improvements Checklist

**Build & Formatting (Immediate):**
- [ ] Fix syntax error causing build failure
- [ ] Run `pnpm exec biome format --write` on all new files
- [ ] Verify build passes: `pnpm exec next build`

**Missing Acceptance Criteria (Required for PASS):**
- [ ] **AC13**: Implement email notification system
  - Create email templates (submitted, approved, rejected)
  - Integrate with email service (Resend, SendGrid, or similar)
  - Add notification calls to `request`, `approve`, `reject` mutations
- [ ] **AC14**: Implement carryover logic
  - Create scheduled job/cron to run annually (Dec 31st)
  - Transfer unused annual leave to next year (max 5 days per AC14)
  - Update `carriedOver` field in leaveBalances

**Test Coverage (Recommended):**
- [ ] Add unit tests for `lib/leave/working-days.ts`:
  - Test `calculateWorkingDays()` with various date ranges
  - Test UK bank holiday detection
  - Test edge cases (weekend-only requests, bank holiday ranges)
- [ ] Add tRPC router tests for untested endpoints:
  - `getConflicts` (test overlap detection logic)
  - `getCalendar` (test date range filtering)
  - `getHistory` (test year filtering)
- [ ] Add UI component tests (React Testing Library):
  - LeaveRequestModal validation behavior
  - ApprovalList bulk actions
  - LeaveCalendar date selection

**Code Quality Improvements (Nice-to-Have):**
- [ ] Add JSDoc comments to all tRPC procedures
- [ ] Extract hardcoded values to constants:
  - TOIL hours per day (7.5) → `TOIL_HOURS_PER_DAY`
  - Default annual entitlement (25) → `DEFAULT_ANNUAL_ENTITLEMENT_UK`
- [ ] Consider API for dynamic UK bank holidays (gov.uk API)
- [ ] Add pagination to `getHistory` endpoint (currently limit-only)

### Security Review

**Multi-Tenant Isolation**: ✅ EXCELLENT
- All database queries properly filter by `tenantId`
- Admin procedures use `ctx.authContext.tenantId` from session
- Users can only access their own leave requests

**Authorization**: ✅ GOOD
- Admin-only procedures for `approve` and `reject`
- Users can only cancel their own requests (line 385: `eq(leaveRequests.userId, userId)`)
- Balance validation prevents over-requesting

**Input Validation**: ✅ EXCELLENT
- Zod schemas enforce type safety
- Past date prevention (line 39-44)
- Overlap detection (line 67-104)
- Balance checks before approval

**Potential Security Concerns**: NONE IDENTIFIED

### Performance Considerations

**Database Indexes**: ✅ GOOD
- `leave_requests`: Indexed on tenantId, userId, status, date_range
- `leave_balances`: Unique index on (userId, year)

**Query Optimization**: ✅ GOOD
- Efficient use of Drizzle ORM
- Proper use of `and()`, `or()` operators
- Early returns on validation failures

**Potential Bottlenecks**:
- ⚠️ `getTeamLeave` returns all team leave without pagination
- ⚠️ `getConflicts` could be slow with many pending requests

**Recommendations**:
- Add pagination to `getTeamLeave`
- Consider caching team leave calendar data

### Files Modified During Review

**No files modified** - Build failure prevents safe changes.

**Developer Action Required**: Please update File List section after resolving build issues and implementing missing ACs.

### Gate Status

**Gate: CONCERNS** → `docs/qa/gates/epic-4.4-leave-system.yml`

**Status Reason**: Two acceptance criteria not implemented (email notifications, carryover logic) and build currently failing. Core functionality is solid but requires completion before production deployment.

### Recommended Status

**✗ Changes Required - See unchecked items above**

**Priority Actions:**
1. Fix build failure (CRITICAL)
2. Run biome formatting on all new files (IMMEDIATE)
3. Implement AC13 (email notifications) (REQUIRED)
4. Implement AC14 (carryover logic) (REQUIRED)
5. Add unit tests for working-days.ts (HIGH PRIORITY)

**Once complete**, re-request QA review for gate upgrade to PASS.

---

**Story Owner decides final status transition.**
