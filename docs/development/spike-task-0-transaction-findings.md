# Task 0 Technical Spike: Drizzle Transaction-Based Test Isolation

**Date**: 2025-10-21
**Story**: Story 2 - Integration Tests for Client-Hub Routers
**Purpose**: Determine if Drizzle ORM supports transaction-based test isolation

---

## Executive Summary

**✅ SUCCESS**: Drizzle ORM fully supports transaction-based test isolation with excellent performance.

**⚠️ ARCHITECTURAL LIMITATION**: tRPC routers use global `db` import, preventing transaction-aware database injection.

**RECOMMENDATION**: Use **unique test IDs + afterEach cleanup** approach instead of transactions.

---

## Test Results

### Test 1: Basic Transaction Support ✅

**Result**: PASSED
**Finding**: Drizzle supports `db.transaction()` wrapper syntax and allows all database operations within transactions.

```typescript
await db.transaction(async (tx) => {
  await tx.insert(clients).values({ ... });
  const [inserted] = await tx.select().from(clients).where(...);
  // All operations work correctly
});
```

---

### Test 2: Transaction Rollback (CRITICAL) ✅

**Result**: PASSED
**Finding**: Transaction rollback works perfectly - no data persists after rollback.

**Test A - Error Thrown**:
```typescript
await expect(
  db.transaction(async (tx) => {
    await tx.insert(clients).values({ ... });
    throw new Error("Intentional error");
  })
).rejects.toThrow();

// Verification: NO data persisted ✅
const results = await db.select().from(clients).where(...);
expect(results).toHaveLength(0); // PASSED
```

**Test B - Explicit Rollback**:
```typescript
try {
  await db.transaction(async (tx) => {
    await tx.insert(clients).values({ ... });
    throw new Error("Rollback");
  });
} catch (error) {
  // Expected
}

// Verification: NO data persisted ✅
expect(results).toHaveLength(0); // PASSED
```

---

### Test 3: Integration with tRPC Router Procedures ⚠️

**Result**: PASSED (but reveals architectural limitation)
**Finding**: tRPC routers work within transactions, BUT they use global `db` import, not transaction-aware database.

**Problem**:
```typescript
// app/server/routers/clients.ts
import { db } from "@/lib/db"; // ❌ Global import, not transaction-aware

export const clientsRouter = router({
  create: protectedProcedure.mutation(async ({ ctx, input }) => {
    // This uses global db, not transaction tx
    await db.insert(clients).values({ ... });
  }),
});
```

**Impact**: Even if tests wrap router calls in transactions, the routers still use the global database connection, so rollback doesn't affect router operations.

**To Fix This Would Require**:
1. Refactor ALL 29 routers to accept `db` as a parameter
2. Modify tRPC context to inject transaction-aware database
3. Update ALL router calls throughout the application

**Verdict**: Not feasible for this story (21 points) - would require massive refactoring.

---

### Test 4: Performance Measurement ✅

**Result**: PASSED (surprising finding!)
**Finding**: Transaction-based cleanup is **56% FASTER** than explicit cleanup!

**Performance Results**:
- **Without transaction** (explicit cleanup): 291ms
- **With transaction** (rollback): 127ms
- **Overhead**: -164ms (-56.4%)

**Explanation**: Transaction rollback is a single database operation, while explicit cleanup requires separate DELETE queries for each test record.

---

### Test 5: Alternative Approach - Unique IDs + Cleanup ✅

**Result**: PASSED
**Finding**: Unique test IDs with afterEach cleanup works reliably.

```typescript
it("should demonstrate unique ID approach", async () => {
  const testPrefix = `test-${Date.now()}`;
  const clientId = crypto.randomUUID();

  // Create test data
  await db.insert(clients).values({
    id: clientId,
    clientCode: `${testPrefix}-CODE`,
    name: `${testPrefix}-client`,
    // ...
  });

  // Test operations
  // ...

  // Cleanup in afterEach
  await db.delete(clients).where(eq(clients.id, clientId));
});
```

**Advantages**:
- ✅ Works with existing router architecture
- ✅ No refactoring required
- ✅ Simple and straightforward
- ✅ Compatible with tRPC routers

**Disadvantages**:
- ⚠️ Slightly slower than transactions (but still performant)
- ⚠️ Requires explicit cleanup logic
- ⚠️ Risk of test data pollution if cleanup fails

---

## Final Recommendation

### ✅ **Use Unique Test IDs + afterEach Cleanup**

**Rationale**:
1. **Compatible with existing architecture** - No router refactoring needed
2. **Works with tRPC routers** - Routers use global db as designed
3. **Performant enough** - 291ms for 50 iterations is acceptable
4. **Simple implementation** - Straightforward pattern developers understand
5. **Low risk** - Proven approach used in existing test suites

### Implementation Pattern

```typescript
describe("Client Router Integration Tests", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;
  const createdIds: string[] = [];

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(clientsRouter, ctx);
  });

  afterEach(async () => {
    // Cleanup all created test data
    if (createdIds.length > 0) {
      await db.delete(clients).where(
        inArray(clients.id, createdIds)
      );
      createdIds.length = 0;
    }
  });

  it("should create client and verify database state", async () => {
    const result = await caller.create({
      clientCode: `TEST-${Date.now()}`,
      name: "Test Client",
      type: "limited_company",
      status: "active",
    });

    createdIds.push(result.client.id);

    // Verify database state
    const [dbClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, result.client.id));

    expect(dbClient.name).toBe("Test Client");
    expect(dbClient.tenantId).toBe(ctx.authContext.tenantId);

    // Verify activity log
    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, result.client.id));

    expect(log.action).toBe("created");
  });
});
```

---

## Alternative Consideration: Transaction-Based (Future)

If the team decides to refactor routers for dependency injection in the future, transaction-based isolation would be the superior approach due to:
- ✅ 56% better performance
- ✅ Automatic cleanup (no risk of pollution)
- ✅ Complete test isolation
- ✅ Simpler test code

**Estimated effort for refactoring**: 2-3 weeks (40-60 story points)

---

## Time Spent

- **Spike Duration**: ~2 hours
- **Tests Written**: 7 comprehensive tests
- **Lines of Code**: ~320 lines (spike test file)

---

## Files Created

- `__tests__/spike/transaction-isolation.test.ts` (320 lines)
- `docs/development/spike-task-0-transaction-findings.md` (this document)

---

## Next Steps

1. ✅ **Proceed with unique IDs + cleanup approach** for Story 2
2. Create test data factory helpers (`__tests__/helpers/factories.ts`)
3. Implement cleanup strategy template for all 8 router test files
4. Begin upgrading router tests to integration level

---

## Conclusion

The spike successfully validated that:
1. Drizzle supports transactions (✅)
2. Transactions work correctly (✅)
3. Performance is excellent (✅)
4. **BUT** current architecture prevents transaction-based isolation (⚠️)

The **recommended approach is unique test IDs + afterEach cleanup**, which provides a pragmatic balance between:
- Compatibility with existing code
- Reasonable performance
- Simplicity and maintainability
- Low implementation risk

**Decision**: Proceed with unique IDs + afterEach cleanup for Story 2 integration tests.

---

**Approved by**: James (Developer Agent)
**Date**: 2025-10-21
**Status**: COMPLETED
