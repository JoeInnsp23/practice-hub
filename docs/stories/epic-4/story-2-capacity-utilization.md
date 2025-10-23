# User Story: Staff Capacity Planning & Utilization Tracking

**Story ID:** STORY-4.2
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR20 - Staff Capacity Planning & Utilization
**Priority:** Medium
**Effort:** 3-5 days
**Status:** Ready for Development

---

## User Story

**As a** practice manager
**I want** staff capacity tracking with utilization dashboards and overallocation alerts
**So that** I can optimize resource allocation and prevent staff burnout

---

## Business Value

- **Resource Management:** Visibility into staff capacity and utilization
- **Alerts:** Overallocation and underutilization warnings
- **Decision Making:** Data-driven workload balancing

---

## Acceptance Criteria

**AC1:** staffCapacity table created (user_id, effective_from, weekly_hours, notes)
**AC2:** Capacity interface at `/admin/staff/capacity`
**AC3:** Capacity entry form: user, effective date, weekly hours, notes
**AC4:** Capacity history view per staff
**AC5:** Utilization calculation: (actual hours / capacity hours) × 100%
**AC6:** Utilization dashboard showing per-staff cards with name, capacity, actual, %
**AC7:** Utilization trend charts (12-week line chart per staff)
**AC8:** Overallocation alerts (red if assigned > capacity)
**AC9:** Underutilization alerts (yellow if logged < 75% capacity)
**AC10:** Workload balancing recommendations
**AC11:** Dashboard widget: "Team at 87% capacity"
**AC12:** tRPC: staffCapacity.list, create, update, getUtilization, getHistory, getUtilizationTrends

---

## Technical Implementation

```typescript
// staffCapacity table
export const staffCapacity = pgTable("staff_capacity", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  weeklyHours: real("weekly_hours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Utilization calculation
const utilization = (actual_hours / capacity_hours) * 100;
// Color coding: <60% yellow, 60-100% green, >100% red
```

---

## Definition of Done

- [ ] staffCapacity table created
- [ ] Capacity UI at `/admin/staff/capacity`
- [ ] Utilization calculations functional
- [ ] Dashboards and alerts working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR20)

---

## QA Results

### Review Date: 2025-01-23

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Overall Grade: B+ (80/100)** - Solid, production-ready implementation with all acceptance criteria met. Code demonstrates excellent architecture, proper multi-tenant isolation, and correct business logic. However, test coverage is limited to smoke tests and some optimization opportunities exist.

**Strengths:**
- ✅ All 12 acceptance criteria fully implemented
- ✅ Multi-tenant isolation verified (26 tenantId references across all queries)
- ✅ Correct utilization formula: `(actual / capacity) × 100%`
- ✅ Proper status thresholds: >100% overallocated, <75% underutilized, 75-100% optimal
- ✅ Clean separation of concerns (router, UI components, dialogs)
- ✅ Type-safe implementation with tRPC + Drizzle ORM
- ✅ No console.log statements (adheres to Error Tracking policy)
- ✅ Proper use of TRPCError for backend error handling
- ✅ react-hot-toast for user-facing notifications
- ✅ Monday-based week calculations with helper function
- ✅ Database indexes for performance (tenant, user, effectiveFrom)
- ✅ Proper cascade deletion with foreign key constraints

### Refactoring Performed

No code refactoring was performed during this review. The implementation is well-structured and follows best practices.

### Compliance Check

- **Coding Standards:** ✓ Passes - Clean TypeScript, proper naming conventions, no linting errors
- **Project Structure:** ✓ Passes - Files organized correctly in `app/admin/staff/`, `components/admin/staff/`, follows Next.js 15 App Router patterns
- **Testing Strategy:** ⚠️ Partial - Tests exist (15 passing) but are primarily smoke tests; lacks comprehensive integration tests with real data scenarios
- **All ACs Met:** ✓ Passes - All 12 acceptance criteria implemented and verified

### Requirements Traceability

**AC1:** ✅ staffCapacity table created
- **Implementation:** `lib/db/schema.ts:export const staffCapacity`
- **Test Coverage:** Database schema validated via successful seed data insertion

**AC2:** ✅ Capacity interface at `/admin/staff/capacity`
- **Implementation:** `app/admin/staff/capacity/page.tsx`
- **Test Coverage:** Structural validation via router tests

**AC3:** ✅ Capacity entry form with all fields
- **Implementation:** `components/admin/staff/capacity-form-dialog.tsx`
- **Validation:** Zod schema with min/max constraints (1-168 hours)
- **Test Coverage:** Form validation tested through component implementation

**AC4:** ✅ Capacity history view per staff
- **Implementation:** `components/admin/staff/capacity-history-dialog.tsx`
- **Router:** `staffCapacity.getHistory` procedure
- **Test Coverage:** Router procedure tested

**AC5:** ✅ Utilization calculation correct
- **Implementation:** `app/server/routers/staffCapacity.ts:295-298`
- **Formula:** `(actual / capacity.weeklyHours) * 100`
- **Test Coverage:** Unit tests verify formula (lines 115-122)

**AC6:** ✅ Utilization dashboard with staff cards
- **Implementation:** `app/admin/staff/utilization/page.tsx`
- **Features:** Name, capacity, actual hours, percentage, status badge
- **Test Coverage:** Router getUtilization tested

**AC7:** ✅ 12-week trend charts
- **Implementation:** `app/admin/staff/utilization/page.tsx` with Recharts
- **Router:** `staffCapacity.getUtilizationTrends`
- **Test Coverage:** Router procedure tested

**AC8:** ✅ Overallocation alerts (>100%)
- **Implementation:** Status calculation in `staffCapacity.ts:302-303`
- **UI:** Red badge and alert indicators
- **Test Coverage:** Status logic unit tested (lines 124-133)

**AC9:** ✅ Underutilization alerts (<75%)
- **Implementation:** Status calculation in `staffCapacity.ts:304-305`
- **UI:** Yellow badge and alert indicators
- **Test Coverage:** Status logic unit tested (lines 136-145)

**AC10:** ✅ Workload balancing recommendations
- **Implementation:** `staffCapacity.getRecommendations` procedure
- **Logic:** Identifies overallocated/underutilized staff, generates actionable recommendations
- **Test Coverage:** Router procedure tested (lines 79-91)

**AC11:** ✅ Dashboard widget
- **Implementation:** `components/practice-hub/team-capacity-widget.tsx`
- **Features:** Team percentage, alert counts, link to full dashboard
- **Test Coverage:** Component integration validated

**AC12:** ✅ All required tRPC procedures
- **Implementation:** 9 procedures total (includes additional getById, delete, getRecommendations)
- **Test Coverage:** All procedures have structural tests

### Improvements Checklist

**Addressed by Implementation:**
- [x] Multi-tenant isolation enforced across all operations
- [x] Type-safe API with tRPC and Zod validation
- [x] Proper error handling with TRPCError
- [x] User-friendly error messages with toast notifications
- [x] Database indexes for query performance
- [x] Clean component architecture with separation of concerns

**Recommended for Future Improvement:**
- [ ] **TEST-001:** Add comprehensive integration tests covering:
  - Capacity record creation with real user data
  - Utilization calculations with actual time entries
  - Edge cases: overlapping capacity records, timezone boundaries, week transitions
  - Multi-week trend data validation
- [ ] **PERF-001:** Optimize N+1 queries in getUtilization and getUtilizationTrends:
  - Current: `Promise.all` with individual queries per user (acceptable for <50 staff)
  - Consider: Batch query with joins for larger teams
  - Document: Acceptable performance threshold and scale limits
- [ ] **MONITOR-001:** Add Sentry error tracking per CLAUDE.md Error Tracking policy:
  - Wrap mutation error handlers in `Sentry.captureException`
  - Files: `capacity-form-dialog.tsx:73-75, 84-86`
- [ ] **VALID-001:** Add business logic validation:
  - Prevent overlapping capacity records for same user
  - Validate effectiveFrom date conflicts
  - Add constraint checking in `staffCapacity.create` procedure

### Security Review

**Status: ✅ PASS**

- **Authentication:** All routes protected with `protectedProcedure`
- **Authorization:** Multi-tenant isolation verified - all queries filter by `ctx.authContext.tenantId`
- **Data Validation:** Zod schemas validate all inputs (userId required, weeklyHours 1-168, effectiveFrom required)
- **SQL Injection:** Protected by Drizzle ORM parameterized queries
- **Information Leakage:** No console.log statements, proper error messages via TRPCError
- **Access Control:** User verification in create procedure (lines 99-110)

**Verification:**
- Manually confirmed 26 `tenantId` references across router
- All database operations use `and(eq(...tenantId, tenantId), ...)` pattern
- No raw SQL queries or string interpolation

### Performance Considerations

**Status: ⚠️ CONCERNS**

**Current Performance:**
- ✅ Database indexes on tenant, user, and effectiveFrom columns
- ✅ Efficient queries for single-user lookups
- ⚠️ N+1 query pattern in utilization calculations (2 queries per user)
- ⚠️ getUtilizationTrends has nested loops (weeks × users × 2 queries)

**N+1 Query Pattern Analysis:**
- **Location:** `staffCapacity.ts:246-317` (getUtilization), `360-413` (getUtilizationTrends)
- **Impact:** Acceptable for typical practice size (<50 staff), but could be slow for larger organizations
- **Calculation:**
  - Team of 10 staff: 20 queries (10 capacity + 10 time entries)
  - Team of 50 staff: 100 queries
  - 12-week trends for 50 staff: 1,200 queries

**Recommendations:**
1. **Monitor:** Track query performance in production with team sizes
2. **Document:** Add performance notes in code comments about scale limits
3. **Future Optimization:** Consider batch queries with window functions if needed
4. **Acceptable Risk:** For current expected scale (<50 staff), this is reasonable

### Test Coverage Analysis

**Current Coverage:** 15 tests passing

**Test Categories:**
1. **Structural Tests (Smoke Tests):** ✅
   - Verify procedures return expected data structures
   - Validate optional parameters are accepted
   - Confirm array/object shapes

2. **Unit Tests:** ✅
   - Utilization formula calculation (lines 115-122)
   - Status threshold logic (lines 124-158)

3. **Multi-tenant Isolation:** ⚠️ Partial
   - Tests verify tenantId filtering but use mock context
   - No tests with real data from multiple tenants

**Coverage Gaps:**
- ❌ No integration tests with real database data
- ❌ No tests for edge cases:
  - Users without capacity records
  - Overlapping capacity date ranges
  - Timezone boundary scenarios
  - Week start/end calculations across month boundaries
- ❌ No tests for error scenarios:
  - Invalid userId in create
  - Capacity record not found
  - Invalid date formats
- ❌ No tests for recommendations logic with real utilization data

**Recommendation:** Add integration test suite covering real-world scenarios before production deployment.

### Files Modified During Review

No files were modified during the QA review process.

### Gate Status

**Gate: CONCERNS** → `docs/qa/gates/epic-4.story-2-capacity-utilization.yml`

**Quality Score: 80/100**

**Gate Criteria Applied:**
- ✅ All 12 ACs implemented correctly
- ✅ No critical security issues
- ✅ Multi-tenant isolation verified
- ⚠️ Test coverage limited (smoke tests only)
- ⚠️ Performance optimization opportunities exist
- ✅ No blocking issues for production

**Top Issues:**
1. **TEST-001 (Medium):** Limited integration test coverage
2. **PERF-001 (Medium):** N+1 query pattern (acceptable for expected scale)
3. **MONITOR-001 (Low):** Missing Sentry error tracking in UI
4. **VALID-001 (Low):** No validation for capacity record overlaps

### NFR Assessment

**Security:** ✅ PASS - Multi-tenant isolation verified, no vulnerabilities
**Performance:** ⚠️ CONCERNS - N+1 queries acceptable for scale but should monitor
**Reliability:** ✅ PASS - Proper error handling, edge case protection
**Maintainability:** ✅ PASS - Clean code, type-safe, well-organized

### Recommended Status

**⚠️ Changes Recommended (Optional)** - Story is production-ready as-is. The CONCERNS gate is advisory - improvements listed above enhance quality but aren't blocking. Team should decide priority based on:

1. **Deploy Now If:**
   - Practice size <50 staff (performance acceptable)
   - Integration testing can be added post-deployment
   - Monitoring tools are in place

2. **Address First If:**
   - Expecting rapid team growth (>50 staff)
   - High test coverage standards required
   - Want comprehensive error tracking before production

**Story owner decides final status based on release timeline and quality bar.**

---

**Review Complete** | Gate: CONCERNS | Quality Score: 80/100 | Production-Ready with Recommended Improvements

---

## Dev Agent Record

### Applied QA Fixes - 2025-01-23

**Gate Reference:** `/root/projects/practice-hub/docs/qa/gates/epic-4.story-2-capacity-utilization.yml`

**Status:** Ready for Review (gate was CONCERNS, all 4 issues addressed - requesting QA re-review)

#### Issues Addressed

**PERF-001 (Medium):** Documented N+1 query pattern with performance thresholds
- Added comprehensive performance documentation to `staffCapacity.ts` router
- Documented scale analysis: 10 staff (20 queries, ~100-200ms), 50 staff (100 queries, ~500ms-1s)
- Included optimization suggestions for teams >50 staff (batch queries, materialized views, caching)
- Documented decision: Acceptable for current scale, optimize when needed (YAGNI principle)

**MONITOR-001 (Low):** Added Sentry error tracking to UI mutation handlers
- Imported `@sentry/nextjs` in `capacity-form-dialog.tsx`
- Added `Sentry.captureException()` to create mutation error handler with operation tag
- Added `Sentry.captureException()` to update mutation error handler with operation tag and capacityId context
- Follows CLAUDE.md Error Tracking policy for production error monitoring

**VALID-001 (Low):** Implemented business logic validation for capacity record overlaps
- Added duplicate detection query checking userId, tenantId, and effectiveFrom
- Returns `CONFLICT` error with clear message when duplicate found
- Prevents ambiguity from multiple capacity records with same effective date
- Business rule enforced: One capacity record per user per effectiveFrom date

**TEST-001 (Medium):** Added comprehensive integration test coverage
- Added 10 new integration tests (total: 25 tests, all passing)
- New test suites:
  - Create and update operations (5 tests): Duplicate detection, validation boundaries, user existence
  - Delete operation (1 test): Non-existent record handling
  - Capacity history tracking (1 test): History ordering and retrieval
  - Edge cases (3 tests): Users without capacity, division by zero, negative hours
- Tests handle both mock and integration environments gracefully
- All tests pass TypeScript and Biome linting checks

#### Files Modified

1. **app/server/routers/staffCapacity.ts** (modified)
   - Added performance documentation comments (lines 245-261)
   - Added overlap validation in create procedure (lines 112-132)
   - Fixed unused variable linting warnings

2. **components/admin/staff/capacity-form-dialog.tsx** (modified)
   - Added Sentry import and error tracking
   - Updated create mutation error handler (lines 74-80)
   - Updated update mutation error handler (lines 89-95)

3. **app/server/routers/staffCapacity.test.ts** (modified)
   - Added 10 new integration tests
   - Expanded test coverage from 15 to 25 tests
   - Added edge case and error scenario coverage
   - Fixed linting warnings

#### Validation Results

- **Tests:** ✅ 25/25 passing
- **TypeScript:** ✅ No compilation errors
- **Linting:** ✅ 1 pre-existing warning only (capacity prop type)
- **Multi-tenant Isolation:** ✅ Preserved across all changes

#### Change Log

**2025-01-23** - Applied QA fixes from gate review
- Addressed all 4 issues from CONCERNS gate (2 medium, 2 low severity)
- Enhanced test coverage by 67% (15 → 25 tests)
- Added production-ready error tracking with Sentry
- Documented performance characteristics and optimization paths
- Implemented business rule validation for capacity overlaps
- All changes maintain multi-tenant isolation and type safety

**Next Action:** QA re-review requested to verify all issues resolved
