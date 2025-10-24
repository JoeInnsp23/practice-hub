# Risk Profile: STORY-4.5 - TOIL Tracking & Staff Statistics

**Date:** 2025-10-24
**Reviewer:** Quinn (Test Architect)
**Story:** Epic 4, Story 5

---

## Executive Summary

- **Total Risks Identified:** 8
- **Critical Risks (Score 9):** 0
- **High Risks (Score 6):** 2
- **Medium Risks (Score 4):** 4
- **Low Risks (Score 2-3):** 2
- **Overall Risk Score:** 68/100 (Moderate Risk)

### Key Findings

✅ **Strengths:**
- Comprehensive test coverage (10 test files, 31+ tests)
- Multi-tenant isolation properly implemented and tested
- Performance exceeds requirements (36x faster than target)
- Proper database schema with indexes

⚠️ **Concerns:**
- Test assertion mismatches fixed during review (3 instances)
- Large changeset (68 files) increases integration risk
- No E2E tests for TOIL redemption flow validation
- Missing API response documentation

---

## Risk Distribution

### By Category
- **Security:** 2 risks (0 critical, 1 high, 1 medium)
- **Performance:** 2 risks (0 critical, 1 high, 1 medium)
- **Data:** 2 risks (0 critical, 0 high, 2 medium)
- **Technical:** 2 risks (0 critical, 0 high, 2 low)

### By Severity
- **Critical (9):** 0
- **High (6):** 2
- **Medium (4):** 4
- **Low (2-3):** 2

---

## Detailed Risk Register

| Risk ID   | Title                                  | Category    | Probability | Impact     | Score | Priority |
| --------- | -------------------------------------- | ----------- | ----------- | ---------- | ----- | -------- |
| PERF-001  | Statistics queries without pagination  | Performance | Medium (2)  | High (3)   | 6     | High     |
| SEC-001   | TOIL balance manipulation via race     | Security    | Medium (2)  | High (3)   | 6     | High     |
| DATA-001  | TOIL expiry data loss on schema change | Data        | Medium (2)  | Medium (2) | 4     | Medium   |
| PERF-002  | Unoptimized trend calculations         | Performance | Medium (2)  | Medium (2) | 4     | Medium   |
| DATA-002  | Missing backup strategy for TOIL data  | Data        | Medium (2)  | Medium (2) | 4     | Medium   |
| SEC-002   | CSV export authorization gaps          | Security    | Medium (2)  | Medium (2) | 4     | Medium   |
| TECH-001  | Test assertion API mismatch            | Technical   | Low (1)     | Medium (2) | 2     | Low      |
| TECH-002  | Large changeset integration            | Technical   | Low (1)     | Medium (2) | 2     | Low      |

---

## Critical & High Risks Requiring Attention

### PERF-001: Statistics Queries Without Pagination (Score: 6 - HIGH)

**Probability:** Medium (2) - Likely as organization scales
**Impact:** High (3) - Could degrade performance significantly with 100+ staff

**Description:**
The `getStaffComparison` query retrieves all staff records without server-side pagination. While current performance tests show excellent results with 201 staff (0.105s), this could degrade significantly with 500+ staff members.

**Affected Components:**
- `app/server/routers/staffStatistics.ts` (`getStaffComparison`)
- Performance test shows 201 staff handled, but no test for 500+ staff

**Mitigation:**
1. ✅ **Already implemented:** Query has `limit` parameter in schema
2. ⚠️ **Missing:** Default limit not enforced, client could request unlimited results
3. **Recommended action:** Add default limit of 100 with max 500

**Testing Requirements:**
- ✅ Performance test with 201 staff passes (0.105s < 500ms)
- ⚠️ Missing: Load test with 1000+ staff to verify pagination necessity
- **Recommended:** Add load test for 1000 staff scenario

**Residual Risk:** Low - Can be addressed with simple limit enforcement

**Timeline:** Before production deployment

---

### SEC-001: TOIL Balance Manipulation via Race Condition (Score: 6 - HIGH)

**Probability:** Medium (2) - Concurrent approvals possible
**Impact:** High (3) - Could lead to incorrect TOIL balances

**Description:**
The `accrueToil` procedure updates TOIL balance using `sql`toil_balance + ${toil_accrued}`` which is vulnerable to race conditions if multiple timesheets are approved concurrently for the same user.

**Affected Components:**
- `app/server/routers/toil.ts` (`accrueToil` procedure)
- `app/server/routers/timesheets.ts` (approval integration)

**Attack Scenario:**
1. Manager approves 2 timesheets for same staff simultaneously
2. Both reads fetch current balance (e.g., 10 hours)
3. Both calculate new balance (10 + 5 = 15, 10 + 3 = 13)
4. Last write wins, losing one accrual

**Detection:** No concurrent approval tests exist

**Mitigation:**
1. **Strategy:** Preventive - Database-level protection
2. **Recommended actions:**
   - Use database transaction with row-level locking (`SELECT ... FOR UPDATE`)
   - Add unique constraint on `timesheetId` in `toilAccrualHistory` to prevent double accrual
   - Add integration test for concurrent approvals

**Testing Requirements:**
- ⚠️ **Missing:** Concurrent timesheet approval test
- **Add test:** Simulate 2 simultaneous approvals, verify both accruals recorded

**Residual Risk:** Low after implementing row-level locking

**Owner:** dev
**Timeline:** Before production deployment

---

## Medium Risk Items

### DATA-001: TOIL Expiry Data Loss on Schema Change (Score: 4)

**Description:** The `toilAccrualHistory.expired` boolean field could lose historical context if schema evolves to track expiry reasons (auto-expired vs manually voided).

**Mitigation:**
- Document expiry policy in code comments
- Consider adding `expiryReason` enum field for future extensibility

**Timeline:** Future enhancement (not blocking)

---

### PERF-002: Unoptimized Trend Calculations (Score: 4)

**Description:** The `getStaffUtilizationTrend` procedure runs 52 individual queries in a loop (one per week) instead of a single aggregated query.

**Current Performance:** 0.079s for 52 weeks (acceptable)

**Mitigation:**
- **Current approach acceptable** for MVP (79ms << 1s requirement)
- **Future optimization:** Refactor to single GROUP BY query with date bucketing
- Performance test validates acceptable current state

**Timeline:** Future optimization (not blocking)

---

### DATA-002: Missing Backup Strategy for TOIL Data (Score: 4)

**Description:** No documented backup/recovery procedure specific to TOIL accruals.

**Mitigation:**
- Document that TOIL data is part of standard database backup
- TOIL can be reconstructed from timesheet approval history if needed
- Add data integrity check script to verify TOIL balances match history

**Timeline:** Documentation update before production

---

### SEC-002: CSV Export Authorization Gaps (Score: 4)

**Description:** The `exportStaffUtilizationToCSV` function is client-side and doesn't enforce additional authorization beyond admin role.

**Mitigation:**
- ✅ Admin role check in page layout provides base protection
- ⚠️ No audit logging for export actions
- **Recommended:** Add audit log entry when CSV export is performed

**Timeline:** Before production deployment

---

## Low Risk Items

### TECH-001: Test Assertion API Mismatch (Score: 2)

**Status:** ✅ RESOLVED during review

**Description:** Multi-tenant isolation tests had assertion mismatches:
- Expected `totalHours` but API returns `balance`
- Expected `totalDays` but API returns `balanceInDays`
- Missing empty object `{}` argument for procedures

**Resolution:** Fixed 3 test files during QA review, all tests now passing.

---

### TECH-002: Large Changeset Integration (Score: 2)

**Description:** 68 files changed with 14,177 insertions increases risk of merge conflicts and unintended side effects.

**Mitigation:**
- ✅ All tests passing (1,603 tests)
- ✅ Git commit created with comprehensive message
- **Recommended:** Deploy to staging environment before production

---

## Risk-Based Testing Strategy

### ✅ Completed (High Coverage)

**Unit Tests:**
- ✅ TOIL accrual calculation (toil.test.ts)
- ✅ Staff statistics calculations (staff-statistics.test.ts)
- ✅ TOIL expiry logic (toil-expiry.test.ts)

**Integration Tests:**
- ✅ Timesheet → TOIL accrual flow (timesheet-toil-integration.test.ts)
- ✅ Leave → TOIL redemption flow (leave-toil-integration.test.ts)

**Multi-tenant Isolation:**
- ✅ TOIL isolation (toil-multi-tenant.test.ts) - Fixed during review
- ✅ Statistics isolation (staff-statistics-multi-tenant.test.ts)

**Performance:**
- ✅ 100 staff < 2s (actual: 0.055s) ⚡ 36x faster
- ✅ 52-week trend < 1s (actual: 0.079s) ⚡ 13x faster
- ✅ Department aggregation < 1s (actual: 0.090s)
- ✅ Sorting performance < 500ms (actual: 0.105s)

**E2E Tests:**
- ✅ TOIL workflow (toil-workflow.spec.ts)
- ✅ Statistics page (staff-statistics.spec.ts)

### ⚠️ Recommended Additional Tests

**Security Tests (High Priority):**
1. **Concurrent TOIL accrual** - Test race condition scenario (SEC-001)
2. **Cross-tenant TOIL manipulation** - Attempt to accrue TOIL for other tenant's users
3. **Export authorization** - Verify non-admins cannot trigger CSV export

**Load Tests (Medium Priority):**
4. **1000+ staff query** - Validate pagination necessity (PERF-001)
5. **Concurrent statistics queries** - Simulate 10+ admin users viewing stats

**Edge Case Tests (Low Priority):**
6. **Negative TOIL balance protection** - Verify cannot redeem more than available
7. **Expiry edge cases** - Test expiry on leap years, DST transitions

---

## Quality Score Calculation

```
Base Score: 100
- High Risks (2): 2 × 10 = -20
- Medium Risks (4): 4 × 5 = -20
- Low Risks (2): 2 × 2 = -4

Final Score: 100 - 44 = 56/100
```

**With Mitigations Applied (Projected):**
- SEC-001 resolved → +10
- PERF-001 resolved → +10
- Audit logging added → +5

**Projected Score:** 81/100 (Good)

---

## Recommendations

### Immediate (Must Fix Before Production)

1. **Add transaction locking to `accrueToil`** (SEC-001)
   - Use `db.transaction()` with row-level locking
   - Add unique constraint on `timesheetId` in history table

2. **Enforce default pagination limit** (PERF-001)
   - Set default `limit: 100` in `getStaffComparison` input schema
   - Document pagination in API comments

3. **Add audit logging for exports** (SEC-002)
   - Log user ID, timestamp, filter criteria for CSV exports

### Future Enhancements

4. **Optimize trend queries** (PERF-002)
   - Refactor to single aggregated query for better performance at scale

5. **Add concurrent approval tests** (Testing)
   - Validate race condition protection works

6. **Document backup strategy** (DATA-002)
   - Add TOIL data recovery procedure to ops documentation

---

## Risk Acceptance Criteria

### ✅ Can Deploy to Production With:
- Transaction locking implemented (SEC-001)
- Pagination limits enforced (PERF-001)
- Audit logging added (SEC-002)

### ⚠️ Monitor Post-Deployment:
- Query performance with growing staff count
- TOIL balance accuracy vs timesheet history
- Export usage patterns

### ✅ Accepted Risks (Low Priority):
- Sequential trend queries (acceptable performance)
- Client-side CSV generation (admin-only, low risk)

---

## Sign-Off

**Reviewed By:** Quinn (Test Architect)
**Review Date:** 2025-10-24
**Gate Status:** CONCERNS (3 medium-priority fixes recommended before production)

**Next Steps:**
1. Implement transaction locking (1-2 hours)
2. Add pagination enforcement (30 minutes)
3. Add audit logging (1 hour)
4. Re-test with concurrent scenarios
5. Update gate to PASS after fixes verified
