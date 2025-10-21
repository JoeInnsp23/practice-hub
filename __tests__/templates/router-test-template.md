# Router Integration Test Template

This checklist provides a systematic approach for upgrading router tests from input validation to integration level.

**Based on**: Task 0 spike findings - use unique IDs + afterEach cleanup approach

---

## Pre-Test Setup

- [ ] **Read the entire router file** to understand all procedures and their logic
- [ ] **Identify all procedures** in the router (list them out)
- [ ] **Check database schema** for the primary table(s) used by this router
- [ ] **Review existing test file** to understand current input validation tests

---

## Phase 1: Test Infrastructure Setup

### Step 1: Import Required Modules

```typescript
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { {routerName} } from "@/app/server/routers/{routerName}";
import { createCaller, createMockContext } from "../helpers/trpc";
import {
  createTestClient, // or appropriate factory
  cleanupTestData,
  type TestDataTracker,
} from "../helpers/factories";
import { db } from "@/lib/db";
import { {tables} } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Context } from "@/app/server/context";
```

### Step 2: Set Up Test Context

```typescript
describe("app/server/routers/{routerName}.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof {routerName}Router>>;
  const tracker: TestDataTracker = {
    clients: [],
    tasks: [],
    invoices: [],
    documents: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller({routerName}Router, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.clients = [];
    tracker.tasks = [];
    tracker.invoices = [];
    tracker.documents = [];
  });

  // Tests go here...
});
```

---

## Phase 2: Integration Test Implementation

### For Each Procedure in Router:

#### **CREATE Procedures**

- [ ] **Test 1: Successful Creation**
  - [ ] Call procedure with valid input
  - [ ] Track created ID in tracker
  - [ ] Verify return value matches expected structure
  - [ ] Query database directly to verify data persisted
  - [ ] Verify `tenantId` matches context (tenant isolation)
  - [ ] Verify activity log created (if applicable)

- [ ] **Test 2: Validation Errors**
  - [ ] Test with missing required fields
  - [ ] Test with invalid data types
  - [ ] Test with invalid email formats (if applicable)
  - [ ] Verify appropriate error messages

- [ ] **Test 3: Constraint Violations**
  - [ ] Test duplicate unique fields (if applicable)
  - [ ] Test foreign key violations (if applicable)

```typescript
describe("create (Integration)", () => {
  it("should create {entity} and persist to database", async () => {
    const input = {
      name: "Test {Entity}",
      // ... other fields
    };

    const result = await caller.create(input);
    tracker.{entities}.push(result.{entity}.id);

    expect(result.success).toBe(true);
    expect(result.{entity}.id).toBeDefined();

    // Verify database persistence
    const [db{Entity}] = await db
      .select()
      .from({entities})
      .where(eq({entities}.id, result.{entity}.id));

    expect(db{Entity}.name).toBe("Test {Entity}");
    expect(db{Entity}.tenantId).toBe(ctx.authContext.tenantId);

    // Verify activity log (if applicable)
    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, result.{entity}.id));

    expect(log.action).toBe("created");
    expect(log.userId).toBe(ctx.authContext.userId);
  });
});
```

#### **READ/LIST Procedures**

- [ ] **Test 1: List with Filters**
  - [ ] Create test data using factories
  - [ ] Call procedure with no filters
  - [ ] Verify all records returned
  - [ ] Call procedure with filters
  - [ ] Verify only matching records returned
  - [ ] Verify tenant isolation (no other tenant's data)

- [ ] **Test 2: Pagination** (if applicable)
  - [ ] Create multiple test records
  - [ ] Test limit and offset parameters
  - [ ] Verify correct page returned

- [ ] **Test 3: Search** (if applicable)
  - [ ] Test search functionality
  - [ ] Verify search results match criteria

```typescript
describe("list (Integration)", () => {
  it("should list {entities} with tenant isolation", async () => {
    // Create test data
    const {entity}1 = await create{Entity}(/* ... */);
    const {entity}2 = await create{Entity}(/* ... */);
    tracker.{entities}.push({entity}1.id, {entity}2.id);

    const result = await caller.list({});

    expect(result.{entities}).toHaveLength(2);
    expect(result.{entities}.every(c => c.tenantId === ctx.authContext.tenantId)).toBe(true);
  });
});
```

#### **GET BY ID Procedures**

- [ ] **Test 1: Successful Retrieval**
  - [ ] Create test entity
  - [ ] Call procedure with valid ID
  - [ ] Verify correct entity returned
  - [ ] Verify tenant isolation

- [ ] **Test 2: Not Found**
  - [ ] Call procedure with non-existent ID
  - [ ] Verify NOT_FOUND error thrown

- [ ] **Test 3: Cross-Tenant Access Prevention** (CRITICAL)
  - [ ] Create entity for tenant A
  - [ ] Create context for tenant B
  - [ ] Attempt to access tenant A's entity from tenant B
  - [ ] Verify NOT_FOUND error (not FORBIDDEN - data should be invisible)

```typescript
describe("getById (Integration)", () => {
  it("should retrieve {entity} by ID", async () => {
    const {entity} = await create{Entity}(/* ... */);
    tracker.{entities}.push({entity}.id);

    const result = await caller.getById({entity}.id);

    expect(result.{entity}.id).toBe({entity}.id);
    expect(result.{entity}.tenantId).toBe(ctx.authContext.tenantId);
  });

  it("should throw NOT_FOUND for non-existent ID", async () => {
    await expect(
      caller.getById("non-existent-id")
    ).rejects.toThrow("NOT_FOUND");
  });

  it("should prevent cross-tenant access (CRITICAL)", async () => {
    // Create entity for tenant A
    const {entity} = await create{Entity}(ctx.authContext.tenantId, ctx.authContext.userId);
    tracker.{entities}.push({entity}.id);

    // Create context for tenant B
    const tenantBContext = createMockContext({
      authContext: {
        ...ctx.authContext,
        tenantId: "tenant-b-id",
      },
    });
    const tenantBCaller = createCaller({routerName}Router, tenantBContext);

    // Attempt to access tenant A's entity from tenant B
    await expect(
      tenantBCaller.getById({entity}.id)
    ).rejects.toThrow("NOT_FOUND");
  });
});
```

#### **UPDATE Procedures**

- [ ] **Test 1: Successful Update**
  - [ ] Create test entity
  - [ ] Call procedure with valid updates
  - [ ] Verify return value
  - [ ] Query database to verify updates persisted
  - [ ] Verify tenant isolation
  - [ ] Verify activity log (if applicable)

- [ ] **Test 2: Not Found**
  - [ ] Call procedure with non-existent ID
  - [ ] Verify NOT_FOUND error

- [ ] **Test 3: Partial Updates**
  - [ ] Test updating only some fields
  - [ ] Verify other fields unchanged

- [ ] **Test 4: Cross-Tenant Update Prevention**
  - [ ] Attempt to update entity from different tenant
  - [ ] Verify NOT_FOUND error

```typescript
describe("update (Integration)", () => {
  it("should update {entity} and persist changes", async () => {
    const {entity} = await create{Entity}(/* ... */);
    tracker.{entities}.push({entity}.id);

    const result = await caller.update({
      id: {entity}.id,
      data: {
        name: "Updated Name",
      },
    });

    expect(result.{entity}.name).toBe("Updated Name");

    // Verify database persistence
    const [db{Entity}] = await db
      .select()
      .from({entities})
      .where(eq({entities}.id, {entity}.id));

    expect(db{Entity}.name).toBe("Updated Name");
  });
});
```

#### **DELETE Procedures**

- [ ] **Test 1: Successful Deletion**
  - [ ] Create test entity
  - [ ] Call procedure
  - [ ] Verify success response
  - [ ] Query database to verify entity removed
  - [ ] Verify activity log (if applicable)

- [ ] **Test 2: Not Found**
  - [ ] Call procedure with non-existent ID
  - [ ] Verify NOT_FOUND error

- [ ] **Test 3: Dependency Checks**
  - [ ] Create entity with dependencies
  - [ ] Attempt deletion
  - [ ] Verify appropriate error (PRECONDITION_FAILED)

- [ ] **Test 4: Cross-Tenant Deletion Prevention**
  - [ ] Attempt to delete entity from different tenant
  - [ ] Verify NOT_FOUND error

```typescript
describe("delete (Integration)", () => {
  it("should delete {entity} from database", async () => {
    const {entity} = await create{Entity}(/* ... */);
    // Don't add to tracker since we're deleting it

    const result = await caller.delete({entity}.id);

    expect(result.success).toBe(true);

    // Verify database deletion
    const results = await db
      .select()
      .from({entities})
      .where(eq({entities}.id, {entity}.id));

    expect(results).toHaveLength(0);
  });
});
```

---

## Phase 3: Quality Verification

### Coverage Check

- [ ] **Run coverage for this router**:
  ```bash
  pnpm test --coverage __tests__/routers/{routerName}.test.ts
  ```

- [ ] **Verify minimum 75% coverage** (80% aspirational)
- [ ] **If < 75%, identify uncovered code paths** and add tests

### Stability Check

- [ ] **Run tests 5 times consecutively**:
  ```bash
  for i in {1..5}; do pnpm test __tests__/routers/{routerName}.test.ts; done
  ```

- [ ] **Verify no flaky tests** (all 5 runs pass)

- [ ] **Run tests with random order**:
  ```bash
  pnpm test --sequence.shuffle __tests__/routers/{routerName}.test.ts
  ```

- [ ] **Verify tests pass in random order** (no hidden dependencies)

---

## Phase 4: Documentation

- [ ] **Add file header comment** explaining test approach
- [ ] **Document any complex test setups** with inline comments
- [ ] **Update router file count** in story File List section

---

## Common Patterns & Tips

### Tenant Isolation Pattern

**ALWAYS verify tenant isolation in every test that queries data:**

```typescript
expect(result.{entity}.tenantId).toBe(ctx.authContext.tenantId);
```

### Activity Logging Pattern

**If router creates activity logs, verify them:**

```typescript
const [log] = await db
  .select()
  .from(activityLogs)
  .where(eq(activityLogs.entityId, result.{entity}.id));

expect(log.action).toBe("created");
expect(log.userId).toBe(ctx.authContext.userId);
```

### Transaction Rollback Testing

**Test that failed operations don't persist partial data:**

```typescript
it("should rollback on error", async () => {
  // Mock a failure in the operation
  vi.spyOn(db, "insert").mockRejectedValueOnce(new Error("DB Error"));

  await expect(caller.create({ name: "Test" })).rejects.toThrow();

  // Verify no partial data persisted
  const results = await db.select().from({entities});
  expect(results).toHaveLength(0);
});
```

### Performance Considerations

- **Batch create test data** when possible using factory helpers
- **Use `inArray()` for bulk cleanup** instead of individual deletes
- **Limit test data size** - don't create 1000 records if 10 will do

---

## Checklist Complete?

- [ ] All procedures have integration tests
- [ ] All tests verify database persistence
- [ ] Tenant isolation verified in all tests
- [ ] Cross-tenant access prevention test exists
- [ ] Activity logging verified (if applicable)
- [ ] Error handling tested
- [ ] Coverage ≥ 75%
- [ ] Tests pass 5 consecutive times
- [ ] Tests pass in random order
- [ ] Documentation complete

---

**Template Version**: 1.0
**Based on**: Story 2 Task 0 spike findings
**Date**: 2025-10-21
