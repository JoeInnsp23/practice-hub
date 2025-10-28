# Test Failure Analysis

**Generated:** 2025-10-28
**Total Failures:** 218 tests across 21 test files

## Summary

| Category | Count | % of Total | Severity |
|----------|-------|------------|----------|
| Drizzle `$dynamic()` errors | ~18 | 8% | **HIGH** - API usage issue |
| Drizzle `tx.limit()` errors | ~12 | 6% | **HIGH** - Transaction API issue |
| Array method errors | ~13 | 6% | **MEDIUM** - Type/data shape mismatch |
| Other Drizzle errors | ~3 | 1% | **MEDIUM** - Query builder issue |
| Unknown/Cascading | ~172 | 79% | **TBD** - Likely cascading from above |

## Category 1: Drizzle `$dynamic()` Method Errors (18 failures)

**Error Pattern:**
```
TypeError: db.select(...).from(...).leftJoin(...).$dynamic is not a function
TypeError: db.select(...).from(...).leftJoin(...).where(...).$dynamic is not a function
TypeError: db.select(...).from(...).where(...).$dynamic is not a function
```

**Root Cause Hypothesis:**
- Drizzle ORM query builder chain doesn't expose `$dynamic()` method after certain operations
- Likely a breaking change in Drizzle ORM version or incorrect API usage
- `$dynamic()` is used for dynamic query building (conditional filters)

**Affected Files (estimated):**
- `__tests__/routers/analytics.test.ts` (likely high count - 27 failures)
- `__tests__/routers/proposals.test.ts` (likely high count - 36 failures)
- `__tests__/routers/clientPortal.test.ts` (18 failures)

**Fix Strategy:**
1. Review Drizzle ORM documentation for `$dynamic()` API
2. Check if method was renamed or deprecated
3. Update query builder usage to correct pattern
4. Alternative: Use conditional query building without `$dynamic()`

---

## Category 2: Drizzle Transaction `.limit()` Method Errors (12 failures)

**Error Pattern:**
```
TypeError: tx.select(...).from(...).where(...).limit is not a function
```

**Root Cause Hypothesis:**
- Drizzle transaction query builder (tx) doesn't support `.limit()` method
- Possible Drizzle API difference between `db` and `tx` query builders
- Code may be using db patterns with tx object

**Affected Files:**
- `app/server/routers/workflows.ts:601` (migrateInstances procedure)
- `app/server/routers/workflows.ts:825` (rollbackToVersion procedure)
- `app/server/routers/tasks.ts:847` (assignWorkflow procedure)

**Fix Strategy:**
1. Review Drizzle transaction API documentation
2. Replace `.limit()` with alternative approach (e.g., array slicing)
3. Or restructure query to use `db` instead of `tx` where possible

---

## Category 3: Array Method Errors (13 failures)

**Error Patterns:**
```
TypeError: stats.find is not a function (5 occurrences)
TypeError: servicePopularity.map is not a function (4 occurrences)
TypeError: wonProposals.map is not a function (2 occurrences)
TypeError: templates.filter is not a function (2 occurrences)
TypeError: stageData.reduce is not a function (2 occurrences)
```

**Root Cause Hypothesis:**
- Router code expects arrays but receives non-array results (possibly undefined, null, or object)
- Likely cascading failures from Categories 1 & 2
- Database query returns empty/malformed results due to $dynamic() or limit() errors

**Affected Routers:**
- Analytics router (stats.find, servicePopularity.map, stageData.reduce)
- Proposals router (wonProposals.map)
- Proposal Templates router (templates.filter)

**Fix Strategy:**
1. Fix root cause (Categories 1 & 2) first - may resolve these automatically
2. Add type guards / null checks before array operations
3. Ensure database queries return arrays (not undefined/null)

---

## Category 4: Other Drizzle Errors (3 failures)

**Error Pattern:**
```
TypeError: db.select(...).from(...).where(...).then is not a function (3 occurrences)
```

**Root Cause Hypothesis:**
- Attempting to use `.then()` on non-Promise query builder
- Drizzle queries may need `.execute()` or await directly

**Fix Strategy:**
1. Review Drizzle query execution API
2. Replace `.then()` with `await` or `.execute()`

---

## Failed Test Files (by failure count)

| Rank | File | Failures | Primary Issue (Hypothesis) |
|------|------|----------|---------------------------|
| 1 | proposals.test.ts | 36 | `$dynamic()` errors + array methods |
| 2 | analytics.test.ts | 27 | `$dynamic()` errors + stats.find |
| 3 | clientPortal.test.ts | 18 | `$dynamic()` errors |
| 4 | leads.test.ts | 15 | TBD |
| 5 | messages.test.ts | 14 | TBD |
| 6 | proposalTemplates.test.ts | 12 | templates.filter error |
| 7 | calendar.test.ts | 12 | TBD |
| 8 | users.test.ts | 10 | TBD |
| 9 | pricingAdmin.test.ts | 10 | TBD |
| 10 | invitations.test.ts | 10 | TBD |
| 11 | legal.test.ts | 9 | TBD |
| 12 | pricingConfig.test.ts | 8 | TBD |
| 13 | clientPortalAdmin.test.ts | 8 | TBD |
| 14 | admin-kyc.test.ts | 8 | TBD |
| 15 | workflows.versioning.test.ts | 5 | `tx.limit()` errors |
| 16 | transactionData.test.ts | 4 | TBD |
| 17 | pricing.test.ts | 4 | TBD |
| 18 | notifications.test.ts | 4 | TBD |
| 19 | invoices.test.ts | 2 | TBD |
| 20 | toil-multi-tenant.test.ts | 1 | TBD |
| 21 | (1 more file) | TBD | TBD |

---

## Recommended Fix Order

### Phase 1: Fix Type Errors (Blocks Other Fixes)
**Priority:** 🔴 **CRITICAL** - Must fix before tests
1. ✅ **Fix seed scripts** (schema mismatches) - `TS2769` errors
2. ✅ **Fix timesheets test** (implicit any) - `TS7006` errors
3. ✅ **Fix weekly-summary-card** (type mismatch) - `TS2322` error

**Rationale:** TypeScript errors may prevent test execution or cause incorrect behavior

### Phase 2: Fix Drizzle ORM Issues (Root Causes)
**Priority:** 🔴 **CRITICAL** - Fixes ~30 failures
1. 🔧 **Fix `$dynamic()` API usage** (18 failures)
   - Research Drizzle ORM dynamic query API
   - Update all routers using `$dynamic()`
   - Likely affects: analytics, proposals, clientPortal routers
2. 🔧 **Fix `tx.limit()` API usage** (12 failures)
   - Review Drizzle transaction API
   - Update workflows, tasks routers
   - Alternative: use array slicing or db queries

**Rationale:** These are root cause API usage errors that block other tests

### Phase 3: Fix Cascading Array Errors
**Priority:** 🟡 **MEDIUM** - May auto-resolve after Phase 2
1. 🧪 **Re-run tests** after fixing Drizzle issues
2. 🔧 **Add type guards** if array errors persist
3. 🔧 **Fix remaining `.then()` errors** (3 failures)

**Rationale:** Many array errors are likely cascading failures from Drizzle issues

### Phase 4: Fix Remaining Test Failures
**Priority:** 🟢 **LOW** - Unknown issues (172 failures)
1. 🧪 **Re-run tests** with `--bail=1 --no-threads` to isolate next failure
2. 🔧 **Fix iteratively** in small batches (≤3 files per commit)
3. 🧪 **Full regression** after each batch

**Rationale:** Unknown issues require investigation; many may auto-resolve

---

## Next Steps

1. ✅ **Complete Phase 1.1** - Test failure analysis (THIS DOCUMENT)
2. 🔄 **Start Phase 1.2** - Fix seed script schema mismatches
3. 🔄 **Continue Phase 1.3-1.4** - Fix remaining type errors
4. 🔄 **Phase 1.5** - Fix Drizzle ORM issues + remaining test failures
5. 🔄 **Phase 1.6** - Validate test stabilization

---

**Files:**
- Full test output: `docs/quality/baseline-tests.txt` (1MB)
- This analysis: `docs/quality/test-failure-analysis.md`
