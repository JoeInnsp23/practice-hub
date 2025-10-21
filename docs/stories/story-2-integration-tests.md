# Story 2: Add Integration Tests for Client-Hub Routers - Brownfield Enhancement

**Epic:** Client-Hub Production Readiness
**Created:** 2025-10-21
**Priority:** CRITICAL
**Story Points:** 13

---

## User Story

As a **developer working on client-hub routers**,
I want **integration tests that execute actual procedures and verify database operations**,
So that **I can confidently deploy changes knowing business logic, tenant isolation, and data persistence work correctly**.

---

## Story Context

### Existing System Integration

- **Integrates with:** Existing router test infrastructure in `__tests__/routers/`
- **Technology:** Vitest, tRPC, Drizzle ORM, PostgreSQL
- **Follows pattern:** Existing test helpers in `__tests__/helpers/trpc.ts`
- **Touch points:**
  - 31 existing router test files (currently input validation only)
  - `createCaller` and `createMockContext` test helpers
  - Tenant isolation test patterns from `__tests__/integration/tenant-isolation.test.ts`

### Current System Context

**Existing Test Infrastructure:**
- ✅ 31 router test files exist with proper structure
- ✅ Test helpers (`createCaller`, `createMockContext`) available
- ✅ All tests currently passing (29 tests in clients.test.ts alone)
- ⚠️ Tests only validate Zod input schemas, don't execute procedures
- ⚠️ No database operation verification
- ⚠️ No business logic testing
- ⚠️ No activity logging verification

**Example Current Test (Input Validation Only):**
```typescript
it("should accept valid client data", () => {
  const validInput = { name: "Test Client", email: "test@example.com" };
  expect(() => {
    clientsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
  }).not.toThrow();
});
```

**Target Test (Integration Level):**
```typescript
it("should create client and verify database state", async () => {
  const input = { name: "Test Client", email: "test@example.com", type: "limited_company" };
  const result = await caller.clients.create(input);

  expect(result.success).toBe(true);
  expect(result.client.name).toBe("Test Client");

  // Verify database state
  const dbClient = await db.select().from(clients).where(eq(clients.id, result.client.id));
  expect(dbClient[0].tenantId).toBe(ctx.authContext.tenantId);

  // Verify activity log created
  const activityLog = await db.select().from(activityLogs)
    .where(eq(activityLogs.entityId, result.client.id));
  expect(activityLog[0].action).toBe("created");
});
```

---

## Acceptance Criteria

### Functional Requirements

1. **Clients Router Upgraded:** `__tests__/routers/clients.test.ts` includes integration tests for all 10 procedures
2. **Tasks Router Upgraded:** `__tests__/routers/tasks.test.ts` includes integration tests
3. **Invoices Router Upgraded:** `__tests__/routers/invoices.test.ts` includes integration tests
4. **Documents Router Upgraded:** `__tests__/routers/documents.test.ts` includes integration tests
5. **Services Router Upgraded:** `__tests__/routers/services.test.ts` includes integration tests
6. **Compliance Router Upgraded:** `__tests__/routers/compliance.test.ts` includes integration tests
7. **Timesheets Router Upgraded:** `__tests__/routers/timesheets.test.ts` includes integration tests
8. **Workflows Router Upgraded:** `__tests__/routers/workflows.test.ts` includes integration tests

### Integration Requirements

9. **Database Operations Tested:** Each CREATE/UPDATE/DELETE test verifies database state after operation
10. **Tenant Isolation Verified:** All tests verify data scoped to correct `tenantId`
11. **Activity Logging Verified:** All write operations verify activity log created with correct metadata
12. **Error Handling Tested:** NOT_FOUND, validation errors, and constraint violations tested
13. **Transaction Rollbacks Tested:** Failed operations verify no partial data persisted

### Quality Requirements

14. **Code Coverage:** Minimum 80% code coverage for all 8 client-hub routers
15. **All Tests Pass:** `pnpm test __tests__/routers` completes successfully
16. **No Flaky Tests:** Tests run reliably without random failures
17. **Fast Execution:** Test suite completes in under 2 minutes

---

## Technical Notes

### Integration Approach

**Test Pattern to Follow:**
```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { clientsRouter } from "@/app/server/routers/clients";
import { createCaller, createMockContext } from "../helpers/trpc";
import { db } from "@/lib/db";
import { clients, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Context } from "@/app/server/context";

describe("app/server/routers/clients.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(clientsRouter, ctx);
  });

  describe("create (Integration)", () => {
    it("should create client and persist to database", async () => {
      const input = { name: "Test Client", type: "limited_company", email: "test@example.com" };

      const result = await caller.clients.create(input);

      expect(result.success).toBe(true);
      expect(result.client.id).toBeDefined();

      // Verify database persistence
      const [dbClient] = await db.select().from(clients)
        .where(eq(clients.id, result.client.id));
      expect(dbClient.name).toBe("Test Client");
      expect(dbClient.tenantId).toBe(ctx.authContext.tenantId);

      // Verify activity log
      const [log] = await db.select().from(activityLogs)
        .where(eq(activityLogs.entityId, result.client.id));
      expect(log.action).toBe("created");
      expect(log.userId).toBe(ctx.authContext.userId);
    });
  });
});
```

### Existing Pattern Reference

- Follow tenant isolation test patterns from `__tests__/integration/tenant-isolation.test.ts`
- Use `createMockContext()` to set up auth context with tenantId
- Clean up test data in `afterEach` or use transactions that rollback

### Routers to Upgrade (Priority Order)

1. **clients.ts** (10 procedures) - Foundation for all others
2. **tasks.ts** - Critical workflow functionality
3. **invoices.ts** - Financial operations
4. **documents.ts** - File operations
5. **services.ts** - Service assignments
6. **compliance.ts** - Compliance tracking
7. **timesheets.ts** - Time tracking
8. **workflows.ts** - Workflow instances

---

## Definition of Done

- [ ] All 8 router test files upgraded with integration tests
- [ ] Each test file has both input validation AND integration tests
- [ ] All tests verify database state after operations
- [ ] All tests verify tenant isolation (correct tenantId)
- [ ] All write operations verify activity logging
- [ ] Error cases tested (NOT_FOUND, validation, constraints)
- [ ] Transaction rollback tests included
- [ ] Code coverage reaches 80% for all 8 routers
- [ ] All tests pass: `pnpm test __tests__/routers`
- [ ] Test suite completes in under 2 minutes
- [ ] No flaky tests (run 5 times successfully)
- [ ] **Documentation updated:** `docs/development/testing.md` includes integration test patterns with examples

---

## Risk and Compatibility Check

### Minimal Risk Assessment

- **Primary Risk:** Integration tests reveal bugs in existing router implementations
- **Mitigation:**
  - Fix bugs as discovered, track separately from story scope
  - Use feature flags if bugs are too complex to fix immediately
  - Existing input validation tests still pass (no regression)
- **Rollback:** New integration tests can be commented out if blocking, input validation tests remain

### Compatibility Verification

- [ ] Existing input validation tests continue to pass
- [ ] No changes to router implementations (test-only changes)
- [ ] No database schema changes
- [ ] No API changes
- [ ] Test infrastructure changes are additive only

---

## Validation Checklist

### Scope Validation

- [x] Story scope is well-defined (8 routers)
- [x] Integration approach is clear (follow existing patterns)
- [x] Success criteria are measurable (80% coverage, tests pass)
- [x] Dependencies identified (Story 1 for documentation)

### Clarity Check

- [x] Test patterns clearly documented
- [x] Integration points specified (db, activityLogs, auth context)
- [x] Success criteria are testable
- [x] Rollback approach is feasible

---

## Implementation Notes

### Test Infrastructure Available

**Helpers:**
- `createCaller<T>` - Creates tRPC caller for testing
- `createMockContext()` - Creates mock context with tenantId
- Database access via `import { db } from "@/lib/db"`
- Schema imports from `@/lib/db/schema`

**Cleanup Strategies:**
1. **afterEach cleanup:** Delete test records explicitly
2. **Test transactions:** Wrap tests in transaction that rolls back
3. **Unique IDs:** Use unique test IDs to avoid conflicts

### Coverage Targets by Router

| Router | Current Lines | Target Coverage | Priority |
|--------|---------------|-----------------|----------|
| clients.ts | 472 lines | 80% (378 lines) | High |
| tasks.ts | ~350 lines | 80% | High |
| invoices.ts | ~300 lines | 80% | High |
| documents.ts | ~250 lines | 80% | Medium |
| services.ts | ~200 lines | 80% | Medium |
| compliance.ts | ~200 lines | 80% | Medium |
| timesheets.ts | ~200 lines | 80% | Medium |
| workflows.ts | ~250 lines | 80% | Medium |

---

## Success Metrics

- **Coverage:** 80%+ for all 8 client-hub routers
- **Test Count:** ~150-200 integration tests added
- **Bugs Found:** Track any bugs discovered during testing
- **Execution Time:** Test suite under 2 minutes
- **Confidence:** Developers can deploy router changes with confidence

---

**Story Status:** Ready for Implementation (Depends on Story 1)
**Estimated Time:** 2-3 days
**Dependencies:** Story 1 (documentation baseline)
