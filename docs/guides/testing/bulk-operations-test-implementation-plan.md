# Bulk Operations Test Implementation Plan

**Created:** 2025-10-26
**Story:** STORY-5.3 - Bulk Operations Extensions
**QA Issue:** TEST-001 (CRITICAL) - Zero tests for bulk operations
**Status:** Test structure in place, implementation pending
**Estimated Effort:** 2-3 days

---

## Executive Summary

This document provides a comprehensive implementation plan for the 43 bulk operation tests identified as CRITICAL in the Story 5.3 QA review. The test structure is in place with clear TODOs; this plan provides detailed implementation guidance following the tasks router pattern.

**Current Status:**
- ✅ Test structure: 43 test placeholders added
- ✅ Critical tests identified: AC18, AC22, AC23
- ✅ All placeholders pass (no test failures blocking work)
- ⚠️ Implementation pending: ~2-3 days of focused test writing

---

## Test Architecture

### Pattern Reference

**Follow:** `__tests__/routers/tasks.test.ts` lines 928-1188
**Type:** Integration tests with real database operations
**NOT:** Mock-based unit tests (insufficient for bulk operations)

### Key Requirements

1. **Database Integration:**
   - Use real database via test helpers
   - Create test data using helper functions
   - Clean up data using tracker pattern

2. **Transaction Testing:**
   - Test actual transaction rollback behavior
   - Verify no partial updates on failure
   - Critical for AC23 validation

3. **Multi-Tenant Isolation:**
   - Create data in different tenants
   - Verify cross-tenant protection
   - Essential security validation

4. **Audit Logging:**
   - Verify activity logs created
   - Check log content (action, userId, etc.)
   - AC22 compliance requirement

---

## Implementation Guide

### Test Helper Setup

All bulk operation tests should use these helpers from `__tests__/helpers/`:

```typescript
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

import { createTestUser, createTestClient, createTestDepartment } from "../helpers/test-data";
```

### Standard Test Pattern

```typescript
describe("bulkOperationName", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller>;
  const tracker = { /* resource IDs for cleanup */ };

  beforeEach(async () => {
    ctx = await createMockContext();
    caller = createCaller(ctx);
  });

  afterEach(async () => {
    // Clean up test data using tracker
  });

  it("should perform bulk operation on multiple entities", async () => {
    // 1. Create test data (3-5 entities)
    const entity1 = await createTestEntity(ctx.authContext.tenantId, ...);
    const entity2 = await createTestEntity(ctx.authContext.tenantId, ...);
    const entity3 = await createTestEntity(ctx.authContext.tenantId, ...);
    tracker.entities?.push(entity1.id, entity2.id, entity3.id);

    // 2. Call bulk operation
    const result = await caller.bulkOperation({
      entityIds: [entity1.id, entity2.id, entity3.id],
      // operation-specific params
    });

    // 3. Assert success
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);

    // 4. Verify database state
    const updated = await db.select()
      .from(entities)
      .where(eq(entities.id, entity1.id));

    expect(updated[0].field).toBe(expectedValue);
  });

  it("should enforce multi-tenant isolation", async () => {
    // 1. Create entity in DIFFERENT tenant
    const otherTenantEntity = await createTestEntity("other-tenant-id", ...);

    // 2. Create entity in OWN tenant
    const ownEntity = await createTestEntity(ctx.authContext.tenantId, ...);

    // 3. Attempt bulk operation including cross-tenant entity
    await expect(
      caller.bulkOperation({
        entityIds: [ownEntity.id, otherTenantEntity.id],
      })
    ).rejects.toThrow("One or more entities not found");

    // 4. Verify own entity NOT updated (cross-tenant blocked entire operation)
    const check = await db.select()
      .from(entities)
      .where(eq(entities.id, ownEntity.id));

    expect(check[0].field).toBe(originalValue); // unchanged
  });

  it("should log activity for bulk operation (AC22)", async () => {
    // 1. Create test entities
    const entity1 = await createTestEntity(ctx.authContext.tenantId, ...);
    const entity2 = await createTestEntity(ctx.authContext.tenantId, ...);

    // 2. Perform bulk operation
    await caller.bulkOperation({
      entityIds: [entity1.id, entity2.id],
    });

    // 3. Verify activity logs created
    const logs = await db.select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, "bulk_operation_name"),
          eq(activityLogs.entityType, "entity_type")
        )
      );

    // 4. Assert log properties
    expect(logs.length).toBe(2); // one per entity
    expect(logs[0].userId).toBe(ctx.authContext.userId);
    expect(logs[0].tenantId).toBe(ctx.authContext.tenantId);
    expect(logs[0].entityId).toBe(entity1.id);
  });
});
```

---

## Router-Specific Implementation Details

### 1. Users Router (13 tests)

**File:** `__tests__/routers/users.test.ts`

#### bulkUpdateStatus (4 tests)

**Test 1: Update status for multiple users**
```typescript
it("should update status for multiple users", async () => {
  // Create 3 test users with status "active"
  const user1 = await createTestUser(ctx.authContext.tenantId, { status: "active" });
  const user2 = await createTestUser(ctx.authContext.tenantId, { status: "active" });
  const user3 = await createTestUser(ctx.authContext.tenantId, { status: "active" });

  // Bulk update to "inactive"
  const result = await caller.bulkUpdateStatus({
    userIds: [user1.id, user2.id, user3.id],
    status: "inactive",
  });

  expect(result.success).toBe(true);
  expect(result.count).toBe(3);

  // Verify all users updated
  const users = await db.select()
    .from(users)
    .where(inArray(users.id, [user1.id, user2.id, user3.id]));

  expect(users.every(u => u.status === "inactive")).toBe(true);
  expect(users.every(u => u.isActive === false)).toBe(true); // isActive synced
});
```

**Test 2: Multi-tenant isolation**
- Create user in different tenant
- Attempt bulk update including cross-tenant user
- Expect TRPCError "One or more users not found"

**Test 3: Audit logging**
- Verify activityLogs entries created
- Check action: "bulk_status_update"
- Verify newValues: {status, isActive}

**Test 4: Admin protection (AC18) - CRITICAL**
```typescript
it("should prevent admin from deactivating own account (AC18 - CRITICAL)", async () => {
  // Get current admin user ID
  const adminUserId = ctx.authContext.userId;

  // Create another test user
  const otherUser = await createTestUser(ctx.authContext.tenantId);

  // Attempt to bulk deactivate self + other
  await expect(
    caller.bulkUpdateStatus({
      userIds: [adminUserId, otherUser.id],
      status: "inactive",
    })
  ).rejects.toThrow("Cannot deactivate your own account via bulk operation");

  // Verify admin still active
  const admin = await db.select()
    .from(users)
    .where(eq(users.id, adminUserId));

  expect(admin[0].status).toBe("active");

  // Verify other user NOT deactivated (transaction rolled back)
  const other = await db.select()
    .from(users)
    .where(eq(users.id, otherUser.id));

  expect(other[0].status).not.toBe("inactive");
});
```

#### bulkChangeRole (4 tests)

**Implementation:**
1. Create users with role "member"
2. Bulk change to "accountant"
3. Verify roles updated
4. Test multi-tenant isolation
5. Test audit logging with action: "bulk_role_change"
6. Test invalid role value (should reject)

#### bulkAssignDepartment (4 tests)

**Implementation:**
1. Create test department using `createTestDepartment()`
2. Create users without departments
3. Bulk assign to department
4. Verify `departmentId` field updated
5. Test multi-tenant isolation (department from different tenant)
6. Test audit logging
7. Test invalid department ID (should throw)

#### Transaction Safety (1 test)

```typescript
it("should rollback on partial failure - bulkUpdateStatus", async () => {
  // Create valid users
  const user1 = await createTestUser(ctx.authContext.tenantId);
  const user2 = await createTestUser(ctx.authContext.tenantId);

  // Use invalid user ID for partial failure
  const invalidUserId = "non-existent-user-id";

  // Attempt bulk operation with mix of valid/invalid IDs
  await expect(
    caller.bulkUpdateStatus({
      userIds: [user1.id, user2.id, invalidUserId],
      status: "inactive",
    })
  ).rejects.toThrow("One or more users not found");

  // CRITICAL: Verify valid users NOT updated (transaction rolled back)
  const check1 = await db.select().from(users).where(eq(users.id, user1.id));
  const check2 = await db.select().from(users).where(eq(users.id, user2.id));

  expect(check1[0].status).not.toBe("inactive"); // unchanged
  expect(check2[0].status).not.toBe("inactive"); // unchanged
});
```

---

### 2. Clients Router (10 tests)

**File:** `__tests__/routers/clients.test.ts`

#### bulkUpdateStatus (3 tests)

**Test 1: Update status for multiple clients**
```typescript
it("should update status for multiple clients", async () => {
  // Create 3 clients with status "prospect"
  const client1 = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, { status: "prospect" });
  const client2 = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, { status: "prospect" });
  const client3 = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, { status: "prospect" });

  // Bulk update to "active"
  const result = await caller.bulkUpdateStatus({
    clientIds: [client1.id, client2.id, client3.id],
    status: "active",
  });

  expect(result.success).toBe(true);
  expect(result.count).toBe(3);

  // Verify status updated
  const clients = await db.select()
    .from(clients)
    .where(inArray(clients.id, [client1.id, client2.id, client3.id]));

  expect(clients.every(c => c.status === "active")).toBe(true);
});
```

**Test 2:** Multi-tenant isolation (cross-tenant client should block operation)
**Test 3:** Audit logging with action: "bulk_status_update"

#### bulkAssignManager (3 tests)

**Implementation:**
1. Create test manager user
2. Create clients without managers
3. Bulk assign manager
4. Verify `managerId` field updated
5. Test multi-tenant isolation (manager from different tenant)
6. Test audit logging

#### bulkDelete (3 tests)

**Implementation:**
1. Create test clients
2. Bulk delete
3. Verify clients removed from database
4. Test multi-tenant isolation
5. Test audit logging with action: "bulk_delete"

#### Transaction Safety (1 test)

Similar to users router - test rollback on partial failure.

---

### 3. Invoices Router (10 tests)

**File:** `__tests__/routers/invoices.test.ts`

#### bulkUpdateStatus (3 tests)

**Implementation:**
1. Create invoices with status "draft"
2. Bulk update to "sent"
3. Verify status updated
4. Test multi-tenant isolation
5. Test audit logging

#### bulkSendEmails (3 tests)

**Test 1: Send emails for multiple invoices**
```typescript
it("should send emails for multiple invoices", async () => {
  // Create test client with email
  const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId, {
    email: "client@example.com"
  });

  // Create invoices linked to client
  const invoice1 = await createTestInvoice(ctx.authContext.tenantId, client.id);
  const invoice2 = await createTestInvoice(ctx.authContext.tenantId, client.id);

  // Bulk send emails
  const result = await caller.bulkSendEmails({
    invoiceIds: [invoice1.id, invoice2.id],
    emailType: "reminder",
  });

  expect(result.success).toBe(true);
  expect(result.sent).toBeGreaterThan(0);
  // Note: Actual email sending may be mocked in tests
});
```

**Test 2: Track sent/failed counts (AC9-10)**
```typescript
it("should track sent/failed counts for progress tracking (AC9-10)", async () => {
  // Create mix of valid/invalid invoices
  const validInvoice = await createTestInvoice(...);
  // Could mock email service to force failures for testing

  const result = await caller.bulkSendEmails({
    invoiceIds: [validInvoice.id],
    emailType: "reminder",
  });

  // Verify progress tracking fields
  expect(result).toHaveProperty("sent");
  expect(result).toHaveProperty("failed");
  expect(typeof result.sent).toBe("number");
  expect(typeof result.failed).toBe("number");
});
```

**Test 3:** Audit logging for email operations (both success and failure)

#### bulkDelete (3 tests)

**Critical:** Test cascade to invoice items
```typescript
it("should delete multiple invoices and cascade to items", async () => {
  const client = await createTestClient(...);
  const invoice1 = await createTestInvoice(..., client.id);
  const invoice2 = await createTestInvoice(..., client.id);

  // Create invoice items
  await createTestInvoiceItem(invoice1.id);
  await createTestInvoiceItem(invoice2.id);

  // Bulk delete invoices
  const result = await caller.bulkDelete({
    invoiceIds: [invoice1.id, invoice2.id],
  });

  // Verify invoices deleted
  const invoices = await db.select()
    .from(invoices)
    .where(inArray(invoices.id, [invoice1.id, invoice2.id]));

  expect(invoices.length).toBe(0);

  // Verify items cascaded (deleted via foreign key constraint)
  const items = await db.select()
    .from(invoiceItems)
    .where(inArray(invoiceItems.invoiceId, [invoice1.id, invoice2.id]));

  expect(items.length).toBe(0);
});
```

#### Transaction Safety (1 test)

Test rollback on partial failure.

---

### 4. Documents Router (10 tests)

**File:** `__tests__/routers/documents.test.ts`

#### bulkMove (3 tests)

**Implementation:**
1. Create test folder
2. Create documents in root
3. Bulk move to folder
4. Verify `parentId` updated
5. Test multi-tenant isolation
6. Test audit logging

#### bulkChangeCategory (3 tests)

**Test 1: Replace mode (AC13)**
```typescript
it("should change tags for multiple documents (replace mode)", async () => {
  // Create documents with existing tags
  const doc1 = await createTestDocument(ctx.authContext.tenantId, {
    tags: ["old-tag-1", "old-tag-2"]
  });
  const doc2 = await createTestDocument(ctx.authContext.tenantId, {
    tags: ["old-tag-3"]
  });

  // Bulk change tags (replace mode)
  const result = await caller.bulkChangeCategory({
    documentIds: [doc1.id, doc2.id],
    tags: ["new-tag-1", "new-tag-2"],
    addTags: false, // REPLACE mode
  });

  expect(result.success).toBe(true);

  // Verify tags replaced
  const docs = await db.select()
    .from(documents)
    .where(inArray(documents.id, [doc1.id, doc2.id]));

  expect(docs[0].tags).toEqual(["new-tag-1", "new-tag-2"]);
  expect(docs[1].tags).toEqual(["new-tag-1", "new-tag-2"]);
});
```

**Test 2: Add mode (AC13)**
```typescript
it("should add tags to existing tags (add mode)", async () => {
  // Create document with existing tags
  const doc = await createTestDocument(ctx.authContext.tenantId, {
    tags: ["existing-tag"]
  });

  // Bulk add tags (add mode)
  const result = await caller.bulkChangeCategory({
    documentIds: [doc.id],
    tags: ["new-tag-1", "new-tag-2"],
    addTags: true, // ADD mode
  });

  // Verify tags added (not replaced)
  const updated = await db.select()
    .from(documents)
    .where(eq(documents.id, doc.id));

  expect(updated[0].tags).toContain("existing-tag");
  expect(updated[0].tags).toContain("new-tag-1");
  expect(updated[0].tags).toContain("new-tag-2");
});
```

**Test 3:** Audit logging

#### bulkDelete (3 tests)

**Implementation:**
1. Create documents
2. Bulk delete
3. Verify deleted from database
4. Test multi-tenant isolation
5. Test audit logging

#### Transaction Safety (1 test)

Test rollback on partial failure.

---

## Test Execution Strategy

### Development Workflow

1. **Start with Users Router (highest priority)**
   - Contains CRITICAL AC18 admin protection test
   - Most complex (13 tests)
   - Serves as reference for other routers

2. **Proceed to remaining routers**
   - Clients (10 tests)
   - Invoices (10 tests)
   - Documents (10 tests)

3. **Run tests incrementally**
   - Test each mutation individually
   - Fix failures before proceeding
   - Update test placeholders as you go

### Test Commands

```bash
# Run single router bulk operation tests
pnpm test __tests__/routers/users.test.ts -t "Bulk Operations"
pnpm test __tests__/routers/clients.test.ts -t "Bulk Operations"
pnpm test __tests__/routers/invoices.test.ts -t "Bulk Operations"
pnpm test __tests__/routers/documents.test.ts -t "Bulk Operations"

# Run all bulk operation tests
pnpm test -t "Bulk Operations"

# Run specific test
pnpm test __tests__/routers/users.test.ts -t "should prevent admin from deactivating own account"
```

---

## Common Pitfalls & Solutions

### 1. Transaction Rollback Testing

**Problem:** Tests pass locally but fail in CI due to transaction behavior.

**Solution:**
- Always create test data INSIDE the test (not in beforeEach)
- Use explicit `.where()` clauses to verify state after rollback
- Don't rely on `.length` alone - check actual field values

### 2. Multi-Tenant Isolation

**Problem:** Cross-tenant tests pass when they should fail.

**Solution:**
- Use different `tenantId` values for cross-tenant tests
- Verify the error message includes "not found" (not "forbidden")
- Check that valid entities in own tenant are NOT updated

### 3. Audit Logging

**Problem:** Activity logs not found in tests.

**Solution:**
- Query `activityLogs` table explicitly
- Filter by `action` and `entityType`
- Check timestamp is recent (within last few seconds)
- Verify `userId` matches test context

### 4. Test Data Cleanup

**Problem:** Test data leaks between tests.

**Solution:**
- Use tracker pattern to collect IDs
- Clean up in `afterEach` hooks
- Consider using test database transaction rollback

---

## Acceptance Criteria Mapping

| Test Category | AC Covered | Priority |
|---------------|------------|----------|
| Admin Protection (Users) | AC18 | **CRITICAL - Security** |
| Audit Logging (All routers) | AC22 | **HIGH - Compliance** |
| Transaction Safety (All routers) | AC23 | **HIGH - Data Integrity** |
| Multi-Tenant Isolation | General | **HIGH - Security** |
| Bulk Status Update | AC1, AC6, AC11, AC15 | MEDIUM |
| Bulk Manager/Role Assignment | AC2, AC16 | MEDIUM |
| Bulk Email Sending | AC7, AC9-10 | MEDIUM |
| Bulk Tag Management | AC13 | MEDIUM |
| Bulk Delete | AC2, AC7, AC12 | MEDIUM |

---

## Timeline Estimate

**Total Effort:** 2-3 days (16-24 hours)

**Day 1 (8 hours):**
- Users Router: 13 tests (4-5 hours)
- Clients Router: 10 tests (3-4 hours)

**Day 2 (8 hours):**
- Invoices Router: 10 tests (3-4 hours)
- Documents Router: 10 tests (3-4 hours)

**Day 3 (optional, 4-8 hours):**
- Test refinement and edge cases
- Documentation updates
- QA re-review preparation

---

## Success Criteria

Before marking TEST-001 as RESOLVED:

1. ✅ All 43 bulk operation tests implemented (no TODOs)
2. ✅ All tests pass (`pnpm test -t "Bulk Operations"`)
3. ✅ Critical tests verified:
   - AC18: Admin protection prevents self-deactivation
   - AC22: Audit logging creates activity log entries
   - AC23: Transaction rollback on partial failure
4. ✅ Multi-tenant isolation enforced in all tests
5. ✅ Test coverage report shows >90% for bulk operations
6. ✅ No console.log statements in test code
7. ✅ Documentation updated with test results

---

## References

- **Pattern Reference:** `__tests__/routers/tasks.test.ts` lines 928-1188
- **Test Helpers:** `__tests__/helpers/trpc.ts`, `__tests__/helpers/test-data.ts`
- **QA Gate:** `/docs/qa/gates/5.3-bulk-operations-extensions.yml`
- **Story:** `/docs/stories/epic-5/story-3-bulk-operations-extensions.md`

---

**Document Owner:** Development Team
**Last Updated:** 2025-10-26
**Status:** Ready for Implementation
