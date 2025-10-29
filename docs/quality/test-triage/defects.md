# Code Defects Log

**Date**: 2025-10-28
**Purpose**: Track code-side defects discovered during test triage (not fixed in this effort)

---

## Format

Each defect entry should include:
- **DEFECT-NNN**: Unique identifier
- **Title**: Short description
- **Affected Spec**: Test file and line
- **Repro**: Exact command to reproduce
- **Observed**: What actually happens
- **Expected**: What should happen
- **Trace**: Call graph summary (from trace helper)
- **Root Cause**: Suspected files/functions
- **Severity**: BLOCKER / HIGH / MED / LOW
- **Confidence**: 0-100%

---

## Active Defects

### ⚠️ SYSTEMATIC TEST DEFECT (NOT APP CODE BUG)

## TEST-DEFECT-001: Drizzle database mocks return undefined instead of arrays (SYSTEMIC)

**Classification**: TEST_DEFECT (test infrastructure bug, not app code bug)

**Scope**: SYSTEMIC - Affects ALL router tests using Drizzle query mocks (~150+ tests)

**Affected Spec**: `__tests__/routers/proposals.test.ts:18-34` (mock definition) + 18 other router test files

**Test Names** (proposals.ts example - 19 failures):
- listByStage tests (7): "should accept empty input", "should filter by assignedToId", etc.
- getById, create, createFromLead, update, delete, send, trackView, addSignature, updateSalesStage (12 more)

**Repro**:
```bash
pnpm test __tests__/routers/proposals.test.ts -t "listByStage > should accept empty input"
```

**Observed**:
```
TypeError: allProposals is not iterable
at app/server/routers/proposals.ts:272:30
```

Database queries return `undefined` when awaited, causing:
- "is not iterable" errors on `for...of` loops
- "is not iterable" errors on array destructuring `const [x] = await query`
- ".find/.map/.reduce is not a function" errors when code assumes array

**Expected**:
Database mocks should return empty arrays `[]` when no data exists, allowing safe iteration and destructuring.

**Root Cause**:
`__tests__/routers/proposals.test.ts:18-34` (and similar mocks in all router tests)

Database mock only mocks query builder methods to return `this`, but **never mocks the final query execution** (awaited promise resolution).

**Technical Explanation**:

Drizzle query chains are **thenable** objects (implement `.then()` method). When you `await` a query, it should resolve to an array. Current mocks:

```typescript
// BROKEN (current implementation)
db: {
  select: vi.fn().mockReturnThis(),  // Returns builder
  from: vi.fn().mockReturnThis(),    // Returns builder
  where: vi.fn().mockReturnThis(),   // Returns builder
  // ... no .then() method!
}

// When awaited:
const result = await db.select().from().where();
// result = undefined (because 'this' is not a Promise and has no .then())
```

**The Fix**:

Create a proper thenable query mock:

```typescript
// FIXED (proper implementation)
const createQueryMock = (resolveValue = []) => {
  const query = {
    select: vi.fn().mockReturnValue(query),
    from: vi.fn().mockReturnValue(query),
    where: vi.fn().mockReturnValue(query),
    orderBy: vi.fn().mockReturnValue(query),
    limit: vi.fn().mockReturnValue(query),
    leftJoin: vi.fn().mockReturnValue(query),
    innerJoin: vi.fn().mockReturnValue(query),
    // Make it thenable - this is the key!
    then: vi.fn((resolve) => resolve(resolveValue)),
  };
  return query;
};

db: {
  select: vi.fn(() => createQueryMock([])),  // Returns thenable query
  insert: vi.fn(() => createQueryMock([])),
  update: vi.fn(() => createQueryMock([])),
  delete: vi.fn(() => createQueryMock([])),
  transaction: vi.fn((callback) => callback(db)),
}
```

**Severity**: CRITICAL (blocks 150+ tests across all router test files)

**Confidence**: 95%

**Related Patterns**:
- Error Pattern 1: "is not iterable" (223 occurrences) - Same root cause
- Error Pattern 2: ".find/.map/.reduce is not a function" (72 occurrences) - Same root cause

**Impact**:
This single test infrastructure bug is responsible for **MAJORITY** of test failures (estimated 150-200 of 206 failures).

**Fix Strategy**:
1. Create centralized database mock helper: `__tests__/helpers/db-mock.ts`
2. Implement proper thenable query pattern
3. Replace broken mocks in ALL router test files (systematic change)
4. Expected outcome: 150-200 tests will pass after fix

**Related Tests**:
All router test files with Drizzle mocks:
- `__tests__/routers/proposals.test.ts` (19 failures)
- `__tests__/routers/analytics.test.ts` (27 failures)
- `__tests__/routers/activities.test.ts`
- `__tests__/routers/invitations.test.ts`
- `__tests__/routers/transactionData.test.ts`
- And likely 15+ other router test files

---

---

## Resolved Defects
_(Move defects here once fixed by engineering)_
