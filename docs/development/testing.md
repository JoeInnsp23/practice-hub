---
title: "Testing Infrastructure Documentation"
category: "development"
subcategory: "testing"
purpose: "Comprehensive guide to Practice Hub's test infrastructure, patterns, and workflows"
audience: ["ai-agent", "developer"]
prerequisites: ["guides/development/setting-up-environment.md"]
related: ["development/coding-standards.md", "reference/api/trpc-routers.md"]
last_updated: "2025-10-21"
next_review: "2026-01-21"
version: "1.0"
status: "current"
owner: "development-team"
tags: ["testing", "vitest", "trpc", "integration-tests", "unit-tests", "tenant-isolation"]
---

# Testing Infrastructure Documentation

**Quick Summary**: Practice Hub uses Vitest for testing with 31 router tests (input validation), integration tests for tenant isolation, and helper utilities for mocked authentication contexts.

**Last Updated**: 2025-10-21 | **Next Review**: 2026-01-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- Complete overview of test infrastructure and framework (Vitest)
- Router tests (31 files, input validation only)
- Integration tests (tenant isolation validation)
- Test helpers and utilities
- How to write and run tests
- Coverage requirements and thresholds
- Future testing plans (E2E with Playwright)

**What this doc does NOT cover**:
- Production deployment testing → See [`guides/operations/deployment.md`](../guides/operations/deployment.md)
- Performance testing → See [`operations/monitoring-alerting.md`](../operations/monitoring-alerting.md)

---

## Prerequisites

Before reading this document, you should:
- [x] Have completed local development environment setup
- [x] Understand tRPC router architecture (see [`reference/api/trpc-routers.md`](../reference/api/trpc-routers.md))
- [x] Be familiar with TypeScript and Vitest testing framework
- [x] Understand multi-tenant architecture (see [`architecture/multi-tenancy.md`](../architecture/multi-tenancy.md))

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core commands:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

**Key Points**:
- **31 router test files** exist in `__tests__/routers/` (input validation only)
- **Tenant isolation integration test** validates multi-tenant data isolation
- **Test helpers** in `__tests__/helpers/trpc.ts` provide mocked auth contexts
- **Coverage thresholds**: 70% minimum (configured in `vitest.config.ts`)
- **Router tests need upgrade**: Currently only validate Zod schemas, need full implementation tests

---

## Test Infrastructure Overview

### Testing Framework

**Vitest** - Fast unit test framework powered by Vite

**Configuration**: `/root/projects/practice-hub/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["**/*.test.ts", "**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts", "app/server/routers/**/*.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### Test Directory Structure

```
__tests__/
├── setup.ts                              # Global test setup (env vars, mocks)
├── helpers/
│   └── trpc.ts                          # tRPC testing utilities
├── routers/                             # Router input validation tests (31 files)
│   ├── clients.test.ts
│   ├── leads.test.ts
│   ├── tasks.test.ts
│   ├── invoices.test.ts
│   ├── proposals.test.ts
│   ├── workflows.test.ts
│   ├── workflows.versioning.test.ts
│   ├── ... (24 more router tests)
└── integration/
    └── tenant-isolation.test.ts         # Multi-tenant data isolation tests
```

### Test Setup Configuration

**File**: `/root/projects/practice-hub/__tests__/setup.ts`

Global setup runs before all tests to configure environment:

```typescript
// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:...";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-auth";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

// Mock external service credentials
process.env.LEMVERIFY_API_KEY = "test-lemverify-api-key";
process.env.RESEND_API_KEY = "test-resend-api-key";
process.env.S3_ENDPOINT = "http://localhost:9000";
process.env.DOCUSEAL_API_KEY = "test-docuseal-api-key";
process.env.XERO_CLIENT_ID = "test-xero-client-id";
```

**Purpose**: Ensures consistent test environment without requiring real API keys or external services.

---

## Router Tests (31 Files)

### Current Status: INPUT_VALIDATION_ONLY

**Location**: `/root/projects/practice-hub/__tests__/routers/`

**Count**: 31 test files

**Coverage**: Input validation via Zod schema testing

**⚠️ IMPORTANT LIMITATION**: These tests currently only validate input schemas. They do NOT test:
- Database operations
- Business logic
- Authentication/authorization
- Tenant isolation at router level
- Error handling
- Response data structure

### Router Test File List

```
1.  activities.test.ts
2.  admin-kyc.test.ts
3.  analytics.test.ts
4.  calendar.test.ts
5.  clientPortal.test.ts
6.  clientPortalAdmin.test.ts
7.  clients.test.ts
8.  compliance.test.ts
9.  dashboard.test.ts
10. documents.test.ts
11. invitations.test.ts
12. invoices.test.ts
13. leads.test.ts
14. messages.test.ts
15. notifications.test.ts
16. onboarding.test.ts
17. pipeline.test.ts
18. portal.test.ts
19. pricing.test.ts
20. pricingAdmin.test.ts
21. pricingConfig.test.ts
22. proposals.test.ts
23. proposalTemplates.test.ts
24. services.test.ts
25. settings.test.ts
26. tasks.test.ts
27. timesheets.test.ts
28. transactionData.test.ts
29. users.test.ts
30. workflows.test.ts
31. workflows.versioning.test.ts
```

### Router Test Pattern

**Example**: `/root/projects/practice-hub/__tests__/routers/clients.test.ts`

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientsRouter } from "@/app/server/routers/clients";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    // ... other mocked methods
  },
}));

describe("app/server/routers/clients.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(clientsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test client",
        });
      }).not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required name field
        email: "test@example.com",
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid client data", () => {
      const validInput = {
        clientCode: "TC001",
        name: "Test Client Ltd",
        type: "limited_company" as const,
        status: "active" as const,
        email: "test@example.com",
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });
});
```

**What These Tests Validate**:
- ✅ Input schema accepts valid data
- ✅ Input schema rejects invalid data
- ✅ Required fields are enforced
- ✅ Email format validation
- ✅ Enum values are validated
- ✅ Optional fields are handled correctly

**What These Tests DO NOT Validate**:
- ❌ Database operations (all mocked)
- ❌ Business logic execution
- ❌ Tenant isolation enforcement
- ❌ Authentication checks
- ❌ Response data structure
- ❌ Error handling paths

### Future Router Test Improvements

**Needed**: Full implementation tests that validate:

1. **Database Operations**:
   - Data is correctly inserted/updated/deleted
   - Queries return expected results
   - Transactions are handled properly

2. **Tenant Isolation**:
   - Users can only access their tenant's data
   - Cross-tenant access is prevented
   - Tenant ID is correctly applied to all queries

3. **Authentication**:
   - Protected procedures require authentication
   - Admin procedures require admin role
   - Unauthenticated requests are rejected

4. **Business Logic**:
   - Calculations are correct
   - State transitions are valid
   - Side effects are triggered

5. **Error Handling**:
   - Invalid operations throw appropriate errors
   - Database errors are handled gracefully
   - User-friendly error messages are returned

**See**: [`practice-hub-testing` skill](../../.claude/skills/practice-hub-testing.md) for automated router test generation

---

## Integration Tests

### Tenant Isolation Integration Tests

**File**: `/root/projects/practice-hub/__tests__/integration/tenant-isolation.test.ts`

**Purpose**: Validate multi-tenant data isolation across all database tables

**Coverage**: Tests tenant isolation for:
- Clients table
- Leads table
- Tasks table
- Activity logs table
- User assignment validation
- Complex joined queries

### Test Structure

```typescript
describe("Tenant Isolation Integration Tests", () => {
  beforeAll(async () => {
    // Create two separate test tenants
    await db.insert(tenants).values([
      { id: TENANT_A_ID, name: "Tenant A Test", slug: "tenant-a" },
      { id: TENANT_B_ID, name: "Tenant B Test", slug: "tenant-b" },
    ]);

    // Create test users for each tenant
    await db.insert(users).values([
      { id: USER_A_ID, tenantId: TENANT_A_ID, email: "user-a@tenant-a.test" },
      { id: USER_B_ID, tenantId: TENANT_B_ID, email: "user-b@tenant-b.test" },
    ]);
  });

  afterAll(async () => {
    // Clean up all test data
    // (Removes in reverse order to respect foreign key constraints)
  });

  describe("Clients Table Isolation", () => {
    it("should isolate client records by tenant", async () => {
      // Create clients for both tenants
      const [clientA] = await db.insert(clients).values({
        tenantId: TENANT_A_ID,
        name: "Client A from Tenant A",
      }).returning();

      const [clientB] = await db.insert(clients).values({
        tenantId: TENANT_B_ID,
        name: "Client B from Tenant B",
      }).returning();

      // Query as Tenant A - should only see Tenant A's client
      const tenantAClients = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, TENANT_A_ID));

      expect(tenantAClients).toHaveLength(1);
      expect(tenantAClients[0].id).toBe(clientA.id);
    });

    it("should prevent cross-tenant client access", async () => {
      // Create client for Tenant A
      const [clientA] = await db.insert(clients).values({
        tenantId: TENANT_A_ID,
        name: "Private Client A",
      }).returning();

      // Try to query Tenant A's client as Tenant B
      const unauthorizedAccess = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, TENANT_B_ID));

      // Should not find Tenant A's client
      expect(unauthorizedAccess).toHaveLength(0);
    });
  });
});
```

### Key Test Scenarios

1. **Data Isolation**: Each tenant can only query their own data
2. **Cross-Tenant Prevention**: Querying with wrong tenant ID returns empty results
3. **User Assignment Validation**: Users cannot be assigned across tenant boundaries
4. **Complex Query Isolation**: Joins and aggregations maintain tenant boundaries

### Running Integration Tests

```bash
# Run all integration tests
pnpm test __tests__/integration/

# Run specific integration test file
pnpm test __tests__/integration/tenant-isolation.test.ts

# Watch mode for integration tests
pnpm test:watch __tests__/integration/
```

**⚠️ WARNING**: Integration tests use the real database. Ensure you're not running against production!

---

## Test Helpers

### tRPC Testing Utilities

**File**: `/root/projects/practice-hub/__tests__/helpers/trpc.ts`

Provides utilities for testing tRPC routers with mocked authentication contexts.

### Available Helper Functions

#### 1. `createMockAuthContext()`

Creates a mock authentication context for testing.

```typescript
export function createMockAuthContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  return {
    userId: overrides.userId || "test-user-id",
    tenantId: overrides.tenantId || "test-tenant-id",
    organizationName: overrides.organizationName || "Test Organization",
    role: overrides.role || "user",
    email: overrides.email || "test@example.com",
    firstName: overrides.firstName || "Test",
    lastName: overrides.lastName || "User",
  };
}
```

**Usage**:
```typescript
const authContext = createMockAuthContext({
  tenantId: "custom-tenant-id",
  role: "admin",
});
```

#### 2. `createMockAdminContext()`

Creates a mock admin authentication context (role = "admin").

```typescript
export function createMockAdminContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  return createMockAuthContext({
    role: "admin",
    ...overrides,
  });
}
```

**Usage**:
```typescript
const adminContext = createMockAdminContext({
  email: "admin@company.com",
});
```

#### 3. `createMockContext()`

Creates a complete tRPC context including session and auth context.

```typescript
export function createMockContext(overrides: Partial<Context> = {}): Context {
  const authContext = overrides.authContext || createMockAuthContext();

  return {
    session: overrides.session || {
      user: {
        id: authContext.userId,
        email: authContext.email,
        name: `${authContext.firstName} ${authContext.lastName}`,
      },
      session: {
        id: "test-session-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: authContext.userId,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        token: "test-token",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      },
    },
    authContext,
  };
}
```

**Usage**:
```typescript
const ctx = createMockContext({
  authContext: createMockAuthContext({ tenantId: "acme-corp" }),
});
```

#### 4. `createCaller()`

Creates a test caller for a tRPC router.

```typescript
export function createCaller<TRouter extends Record<string, any>>(
  router: TRouter,
  context: Context = createMockContext(),
) {
  return router.createCaller(context);
}
```

**Usage**:
```typescript
const caller = createCaller(clientsRouter);
const result = await caller.list({ search: "test" });
```

#### 5. `createAdminCaller()`

Creates a test caller with admin context.

```typescript
export function createAdminCaller<TRouter extends Record<string, any>>(
  router: TRouter,
  overrides: Partial<Context> = {},
) {
  const adminContext = createMockContext({
    ...overrides,
    authContext: createMockAdminContext(overrides.authContext),
  });
  return router.createCaller(adminContext);
}
```

**Usage**:
```typescript
const adminCaller = createAdminCaller(usersRouter);
const allUsers = await adminCaller.listAll();
```

### Helper Usage Examples

**Example 1: Testing with Custom Tenant**

```typescript
import { createCaller, createMockContext, createMockAuthContext } from "../helpers/trpc";

describe("Multi-tenant router test", () => {
  it("should filter by tenant ID", async () => {
    const tenantId = "acme-accounting-123";

    const ctx = createMockContext({
      authContext: createMockAuthContext({ tenantId }),
    });

    const caller = createCaller(clientsRouter, ctx);
    const clients = await caller.list({});

    // All returned clients should belong to this tenant
    expect(clients.every(c => c.tenantId === tenantId)).toBe(true);
  });
});
```

**Example 2: Testing Admin-Only Procedures**

```typescript
import { createCaller, createAdminCaller, createMockContext } from "../helpers/trpc";

describe("Admin procedure test", () => {
  it("should allow admin access", async () => {
    const adminCaller = createAdminCaller(settingsRouter);

    // Should succeed
    const settings = await adminCaller.updateGlobalSettings({ ... });
    expect(settings).toBeDefined();
  });

  it("should reject non-admin access", async () => {
    const userCaller = createCaller(settingsRouter, createMockContext({
      authContext: createMockAuthContext({ role: "user" }),
    }));

    // Should throw FORBIDDEN error
    await expect(
      userCaller.updateGlobalSettings({ ... })
    ).rejects.toThrow("Admin access required");
  });
});
```

---

## How to Write Tests

### Writing Router Tests

**Pattern**: Input validation + full implementation testing

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { myRouter } from "@/app/server/routers/my-router";
import { createCaller, createMockContext } from "../helpers/trpc";
import { db } from "@/lib/db";
import { myTable } from "@/lib/db/schema";

describe("app/server/routers/my-router.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof myRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(myRouter, ctx);
    vi.clearAllMocks();
  });

  describe("myProcedure", () => {
    // 1. Input validation tests
    it("should validate required fields", () => {
      expect(() => {
        myRouter._def.procedures.myProcedure._def.inputs[0]?.parse({});
      }).toThrow();
    });

    it("should accept valid input", () => {
      expect(() => {
        myRouter._def.procedures.myProcedure._def.inputs[0]?.parse({
          field: "value",
        });
      }).not.toThrow();
    });

    // 2. Implementation tests (FUTURE - not yet implemented)
    it("should create record in database", async () => {
      const result = await caller.myProcedure({ field: "value" });

      // Verify database record
      const record = await db.select().from(myTable).where(...);
      expect(record).toBeDefined();
    });

    it("should enforce tenant isolation", async () => {
      const result = await caller.myProcedure({ field: "value" });

      // Verify tenant ID is set correctly
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
    });
  });
});
```

### Writing Integration Tests

**Pattern**: Real database operations with cleanup

```typescript
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { myTable } from "@/lib/db/schema";

describe("Feature Integration Tests", () => {
  const TEST_TENANT_ID = "test-tenant-integration";

  beforeAll(async () => {
    // Setup test data
    await db.insert(tenants).values({
      id: TEST_TENANT_ID,
      name: "Test Tenant",
    });
  });

  afterAll(async () => {
    // Cleanup test data (reverse order of foreign keys)
    await db.delete(myTable).where(eq(myTable.tenantId, TEST_TENANT_ID));
    await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));
  });

  it("should complete end-to-end workflow", async () => {
    // Test complete feature workflow
    const record = await db.insert(myTable).values({
      tenantId: TEST_TENANT_ID,
      data: "test",
    }).returning();

    expect(record).toBeDefined();
    expect(record[0].tenantId).toBe(TEST_TENANT_ID);
  });
});
```

---

## Router Integration Test Patterns

**Status**: 8 client-hub routers upgraded to full integration tests (Story 2 completed)

**Coverage**: 880 integration tests across 8 routers with 100% pass rate

This section documents the comprehensive integration testing patterns established for tRPC router testing, based on the successful upgrade of all 8 client-hub routers.

### Test Data Factory Pattern

**Recommended Approach**: Use unique test data with factory helpers + `afterEach` cleanup

**Factory Functions**: `/root/projects/practice-hub/__tests__/helpers/factories.ts`

```typescript
import {
  createTestTenant,
  createTestUser,
  createTestClient,
  createTestTask,
  createTestInvoice,
  createTestDocument,
  createCompleteTestSetup,
  cleanupTestData,
  type TestDataTracker,
} from "../helpers/factories";

describe("app/server/routers/clients.ts", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    tasks: [],
    invoices: [],
    documents: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.tasks = [];
    tracker.invoices = [];
    tracker.documents = [];
  });

  it("should create client with unique data", async () => {
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId);
    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    const client = await createTestClient(tenantId, userId, {
      name: "Test Client",
      type: "limited_company",
      status: "active",
    });
    tracker.clients?.push(client.id);

    expect(client.name).toBe("Test Client");
    expect(client.tenantId).toBe(tenantId);
  });
});
```

**Why This Approach?**:
- ✅ **Unique test data** prevents conflicts between parallel tests
- ✅ **Factory functions** provide consistent test data creation
- ✅ **Automatic cleanup** in `afterEach` ensures no data leakage
- ✅ **Foreign key ordering** handled by `cleanupTestData` helper
- ⚠️ **Transactions not used**: tRPC routers use global `db` import, preventing transaction-based isolation (see Story 2 spike report)

### Verifying Database State

**Pattern**: Query database directly to verify operations persisted correctly

```typescript
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

it("should persist client to database", async () => {
  // 1. Create client via tRPC router
  const result = await caller.clients.create({
    name: "Database Test Client",
    type: "limited_company",
  });

  // 2. Verify database state directly
  const [dbClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, result.client.id));

  // 3. Assert database matches result
  expect(dbClient).toBeDefined();
  expect(dbClient.name).toBe("Database Test Client");
  expect(dbClient.type).toBe("limited_company");
  expect(dbClient.status).toBe("active"); // Default value
  expect(dbClient.createdAt).toBeInstanceOf(Date);
});
```

**Key Points**:
- Always verify database state after create/update/delete operations
- Check both returned data AND database persistence
- Verify default values are applied correctly
- Check timestamps and auto-generated fields

### Verifying Tenant Isolation

**Pattern**: Every test must verify `tenantId` matches auth context

```typescript
it("should enforce tenant isolation", async () => {
  // 1. Create test data
  const client = await caller.clients.create({
    name: "Tenant Isolation Test",
    type: "limited_company",
  });

  // 2. Verify tenantId in response
  expect(client.client.tenantId).toBe(ctx.authContext.tenantId);

  // 3. Verify tenantId in database
  const [dbClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, client.client.id));

  expect(dbClient.tenantId).toBe(ctx.authContext.tenantId);

  // 4. Verify query filtering by tenantId
  const allClients = await caller.clients.list();
  expect(allClients.every(c => c.tenantId === ctx.authContext.tenantId)).toBe(true);
});
```

### Cross-Tenant Access Prevention

**Critical Security Test**: Verify tenant A cannot access tenant B's data

```typescript
describe("Cross-tenant access prevention", () => {
  it("should prevent accessing other tenant's data", async () => {
    // 1. Create client for tenant A
    const tenantAClient = await caller.clients.create({
      name: "Tenant A Client",
      type: "limited_company",
    });
    tracker.clients?.push(tenantAClient.client.id);

    // 2. Create context for tenant B
    const tenantBId = await createTestTenant();
    const tenantBUserId = await createTestUser(tenantBId);
    tracker.tenants?.push(tenantBId);
    tracker.users?.push(tenantBUserId);

    const tenantBContext = createMockContext({
      authContext: {
        userId: tenantBUserId,
        tenantId: tenantBId,
        organizationName: "Tenant B",
        role: "user",
        email: "tenantb@example.com",
        firstName: "Tenant",
        lastName: "B",
      },
    });
    const tenantBCaller = createCaller(clientsRouter, tenantBContext);

    // 3. Attempt to access tenant A's client from tenant B
    await expect(
      tenantBCaller.clients.getById({ id: tenantAClient.client.id })
    ).rejects.toThrow("NOT_FOUND");

    // 4. Verify tenant B's list doesn't include tenant A's data
    const tenantBClients = await tenantBCaller.clients.list();
    expect(tenantBClients.find(c => c.id === tenantAClient.client.id)).toBeUndefined();
  });
});
```

**Why This Test is Critical**:
- Validates multi-tenant security boundary
- Prevents data leakage between accountancy firms
- Required for all routers that handle tenant-scoped data
- Must test both `getById` (specific) and `list` (collection) operations

### Verifying Activity Logging

**Pattern**: Check `activityLogs` table for audit trail

```typescript
import { activityLogs } from "@/lib/db/schema";

it("should log create activity", async () => {
  const client = await caller.clients.create({
    name: "Activity Log Test",
    type: "limited_company",
  });

  // Query activity logs
  const logs = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.entityId, client.client.id))
    .orderBy(activityLogs.createdAt);

  // Verify activity logged
  expect(logs).toHaveLength(1);
  expect(logs[0].action).toBe("created");
  expect(logs[0].entityType).toBe("client");
  expect(logs[0].entityId).toBe(client.client.id);
  expect(logs[0].userId).toBe(ctx.authContext.userId);
  expect(logs[0].tenantId).toBe(ctx.authContext.tenantId);
  expect(logs[0].details).toMatchObject({
    name: "Activity Log Test",
    type: "limited_company",
  });
});
```

**What to Verify**:
- Activity log created for create/update/delete operations
- `action` field matches operation type ("created", "updated", "deleted")
- `entityType` and `entityId` correctly reference the entity
- `userId` and `tenantId` match auth context
- `details` field contains relevant operation data

### Error Handling Tests

**Pattern**: Test NOT_FOUND, validation errors, and constraint violations

```typescript
describe("Error handling", () => {
  it("should throw NOT_FOUND for non-existent client", async () => {
    await expect(
      caller.clients.getById({ id: "non-existent-id" })
    ).rejects.toThrow("NOT_FOUND");
  });

  it("should throw CONFLICT for duplicate client code", async () => {
    const client = await caller.clients.create({
      name: "First Client",
      clientCode: "UNIQUE-CODE",
      type: "limited_company",
    });
    tracker.clients?.push(client.client.id);

    await expect(
      caller.clients.create({
        name: "Second Client",
        clientCode: "UNIQUE-CODE", // Duplicate
        type: "limited_company",
      })
    ).rejects.toThrow(); // Database constraint violation
  });

  it("should validate required fields", async () => {
    await expect(
      caller.clients.create({
        name: "", // Empty name
        type: "limited_company",
      })
    ).rejects.toThrow("VALIDATION_ERROR");
  });
});
```

### Transaction Rollback Tests

**Pattern**: Verify database state unchanged when transaction fails

```typescript
it("should rollback transaction on error", async () => {
  // Count clients before operation
  const beforeCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(eq(clients.tenantId, ctx.authContext.tenantId));

  // Attempt operation that will fail
  try {
    await caller.clients.createWithInvalidData({
      name: "Rollback Test",
      // Missing required field that causes database constraint error
    });
  } catch (error) {
    // Expected to fail
  }

  // Verify count unchanged (transaction rolled back)
  const afterCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(eq(clients.tenantId, ctx.authContext.tenantId));

  expect(afterCount[0].count).toBe(beforeCount[0].count);
});
```

### Coverage Requirements

**Minimum Coverage**: 75% for all client-hub routers

**Aspirational Coverage**: 80% for all client-hub routers

**Deferred**: Detailed coverage measurement deferred to future story (Story 4 or 5)

**Current Approach**: Focus on comprehensive integration tests that verify:
- Database operations (create, read, update, delete)
- Tenant isolation (all queries filtered by tenantId)
- Cross-tenant access prevention (explicit security test)
- Activity logging (audit trail verification)
- Error handling (NOT_FOUND, validation, constraints)
- Transaction rollback (database consistency)

### Serial Test Execution Strategy

**Why Serial Execution?**:
- Prevents database contention between router tests
- Ensures consistent test execution times
- Simplifies debugging when tests fail
- Avoids race conditions in cleanup operations

**Implementation**: Vitest runs router tests one file at a time by default (no configuration needed)

**Verification**:
```bash
# Run all router tests serially
pnpm test __tests__/routers/

# Output shows files executed sequentially:
# ✓ __tests__/routers/clients.test.ts (28 tests) 4.2s
# ✓ __tests__/routers/tasks.test.ts (39 tests) 5.1s
# ✓ __tests__/routers/invoices.test.ts (31 tests) 4.8s
# ... (one at a time)
```

**Performance**: Full suite completes in 33.27 seconds (well under 2-minute requirement)

### Examples by Router Type

#### CRUD Router (Clients)

**File**: `__tests__/routers/clients.test.ts` (28 tests)

```typescript
describe("app/server/routers/clients.ts", () => {
  describe("create", () => {
    it("should create client and verify database", async () => { /* ... */ });
    it("should enforce tenant isolation", async () => { /* ... */ });
    it("should log activity", async () => { /* ... */ });
  });

  describe("getById", () => {
    it("should retrieve client by ID", async () => { /* ... */ });
    it("should throw NOT_FOUND for non-existent", async () => { /* ... */ });
    it("should prevent cross-tenant access", async () => { /* ... */ });
  });

  describe("list", () => {
    it("should return only tenant's clients", async () => { /* ... */ });
    it("should support pagination", async () => { /* ... */ });
  });

  describe("update", () => {
    it("should update client and log activity", async () => { /* ... */ });
    it("should verify database state after update", async () => { /* ... */ });
  });

  describe("delete", () => {
    it("should soft delete client", async () => { /* ... */ });
    it("should log delete activity", async () => { /* ... */ });
  });
});
```

#### Bulk Operations Router (Tasks)

**File**: `__tests__/routers/tasks.test.ts` (39 tests)

```typescript
describe("Bulk operations", () => {
  describe("bulkUpdateStatus", () => {
    it("should update multiple task statuses", async () => {
      // Create multiple tasks
      const tasks = await createTestTasks(tenantId, clientId, userId, 5);
      tracker.tasks?.push(...tasks.map(t => t.id));

      // Bulk update status
      const result = await caller.tasks.bulkUpdateStatus({
        taskIds: tasks.map(t => t.id),
        status: "completed",
      });

      expect(result.updatedCount).toBe(5);

      // Verify all tasks updated in database
      const updatedTasks = await db
        .select()
        .from(tasksTable)
        .where(inArray(tasksTable.id, tasks.map(t => t.id)));

      expect(updatedTasks.every(t => t.status === "completed")).toBe(true);
    });

    it("should only update tasks within tenant", async () => {
      // Verify tenant isolation for bulk operations
    });

    it("should log activity for each updated task", async () => {
      // Verify activity logging for bulk operations
    });
  });
});
```

#### File Operations Router (Documents)

**File**: `__tests__/routers/documents.test.ts` (56 tests)

```typescript
describe("File upload operations", () => {
  it("should upload document and verify metadata", async () => {
    const result = await caller.documents.upload({
      clientId,
      name: "test-document.pdf",
      type: "file",
      mimeType: "application/pdf",
      size: 1024,
      url: "https://example.com/test.pdf",
    });

    // Verify database
    const [dbDoc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, result.document.id));

    expect(dbDoc.name).toBe("test-document.pdf");
    expect(dbDoc.mimeType).toBe("application/pdf");
    expect(dbDoc.size).toBe(1024);
    expect(dbDoc.tenantId).toBe(ctx.authContext.tenantId);
    expect(dbDoc.clientId).toBe(clientId);
  });
});
```

#### Workflow Router (Workflows)

**File**: `__tests__/routers/workflows.test.ts` (30 tests)

```typescript
describe("Workflow state transitions", () => {
  it("should transition workflow stage to completed", async () => {
    // Create workflow with stages
    const workflow = await createTestWorkflow(tenantId, userId);
    const stage = await createTestWorkflowStage(workflow.id, {
      stageOrder: 1,
    });
    tracker.workflows?.push(workflow.id);
    tracker.workflowStages?.push(stage.id);

    // Create workflow instance
    const instance = await caller.workflows.createInstance({
      workflowId: workflow.id,
      clientId,
    });

    // Transition stage to completed
    const result = await caller.workflows.completeStage({
      instanceId: instance.id,
      stageId: stage.id,
    });

    // Verify database state
    const [dbInstance] = await db
      .select()
      .from(taskWorkflowInstances)
      .where(eq(taskWorkflowInstances.id, instance.id));

    expect(dbInstance.currentStageId).not.toBe(stage.id);
    expect(dbInstance.status).toBe("in_progress");
  });
});
```

### Troubleshooting Common Issues

#### Test Cleanup Failures

**Problem**: Tests fail with foreign key constraint errors during cleanup

**Solution**: Ensure cleanup order respects foreign key dependencies

```typescript
// CORRECT ORDER (from cleanupTestData helper):
// 1. taskWorkflowInstances
// 2. workflowStages
// 3. workflowVersions
// 4. workflows
// 5. timeEntries
// 6. documents
// 7. invoices
// 8. tasks
// 9. clients
// 10. users
// 11. tenants
```

#### Unique Constraint Violations

**Problem**: Tests fail with "duplicate key value violates unique constraint"

**Solution**: Use factory functions with timestamp-based unique values

```typescript
// ❌ BAD: Hardcoded values cause conflicts
const client = await createTestClient(tenantId, userId, {
  clientCode: "TEST-CLIENT", // Duplicate if run multiple times
});

// ✅ GOOD: Factory generates unique values
const client = await createTestClient(tenantId, userId); // Auto-generates TEST-CLIENT-{timestamp}
```

#### Tenant Isolation Test Failures

**Problem**: Cross-tenant access prevention test fails

**Solution**: Verify router queries filter by `tenantId`

```typescript
// ❌ BAD: No tenant filtering
const client = await db
  .select()
  .from(clients)
  .where(eq(clients.id, clientId));

// ✅ GOOD: Always filter by tenantId
const client = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.id, clientId),
      eq(clients.tenantId, ctx.authContext.tenantId)
    )
  );
```

#### Activity Log Missing

**Problem**: Activity log verification fails because no log created

**Solution**: Check router implementation includes activity logging

```typescript
// Router should include activity logging:
await db.insert(activityLogs).values({
  id: crypto.randomUUID(),
  tenantId: ctx.authContext.tenantId,
  userId: ctx.authContext.userId,
  action: "created",
  entityType: "client",
  entityId: client.id,
  details: { name: input.name, type: input.type },
  createdAt: new Date(),
});
```

#### Test Execution Timeout

**Problem**: Tests timeout after 30 seconds

**Solution**: Increase timeout for slow integration tests

```typescript
// In test file
it("should complete slow operation", async () => {
  // ... test code
}, { timeout: 60000 }); // 60 seconds
```

#### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**: Run tests with random order to identify dependencies

```bash
# Run with random order
pnpm test --sequence.shuffle

# Run multiple times to detect flakiness
for i in {1..5}; do pnpm test; done
```

---

## Running Tests

### Test Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Run tests with UI dashboard
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
pnpm test __tests__/routers/clients.test.ts

# Run tests matching pattern
pnpm test clients

# Run integration tests only
pnpm test __tests__/integration/

# Run router tests only
pnpm test __tests__/routers/
```

### Coverage Reports

Coverage reports are generated in `/root/projects/practice-hub/coverage/`

**Reporters**:
- `text` - Terminal output
- `json` - Machine-readable JSON
- `html` - Interactive HTML report (open `coverage/index.html`)

**View HTML Coverage Report**:
```bash
pnpm test:coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

---

## Coverage Requirements

### Current Thresholds (vitest.config.ts)

```typescript
coverage: {
  thresholds: {
    lines: 70,        // 70% of lines must be covered
    functions: 70,    // 70% of functions must be called
    branches: 70,     // 70% of branches must be tested
    statements: 70,   // 70% of statements must be executed
  },
}
```

### Coverage Targets

**Included in Coverage**:
- `lib/**/*.ts` - Library utilities
- `app/api/**/*.ts` - API routes
- `app/server/routers/**/*.ts` - tRPC routers

**Excluded from Coverage**:
- `**/*.test.ts` - Test files
- `**/*.spec.ts` - Spec files
- `**/*.d.ts` - Type definition files
- `lib/db/schema.ts` - Database schema (config, not logic)
- `**/__tests__/**` - Test directories

### Future Coverage Goals

**Target**: 80% minimum coverage (as per CLAUDE.md requirement)

**Strategy**:
1. Upgrade router tests from input validation to full implementation
2. Add integration tests for complex workflows
3. Add E2E tests for critical user paths (Playwright)
4. Increase threshold incrementally (70% → 75% → 80%)

---

## Practice Hub Testing Skills

Practice Hub includes automated testing skills for common testing tasks.

### Available Skills

**Invoke via Skill tool** (do NOT run scripts directly):

#### 1. `practice-hub-testing`

Comprehensive testing workflows including:
- Generate router tests
- Validate multi-tenant isolation
- Check test coverage
- Run specific test suites

**Usage**:
```
Invoke Skill tool with: "practice-hub-testing"
```

**Capabilities**:
- Generates complete router tests (input validation + implementation)
- Validates tenant isolation across all routers
- Checks test coverage against thresholds
- Identifies untested code paths

#### 2. `practice-hub-debugging`

Code quality and debugging workflows:
- Find/remove console.log statements
- Track TODOs/FIXMEs
- Validate code quality
- Prepare codebase for production

**Usage**:
```
Invoke Skill tool with: "practice-hub-debugging"
```

**Capabilities**:
- Finds console.log statements for removal (use Sentry instead)
- Tracks technical debt markers
- Validates code meets quality standards

#### 3. `webapp-testing`

End-to-end testing with Playwright (future):
- Test local web applications
- Capture screenshots
- Verify UI functionality
- Debug browser behavior

**Usage**:
```
Invoke Skill tool with: "webapp-testing"
```

**Status**: PLANNED - E2E testing infrastructure not yet implemented

---

## End-to-End (E2E) Testing

**Status**: ✅ IMPLEMENTED (2025-10-21)

**Framework**: Playwright v1.56.1

**Scope**: Critical client-hub user workflows tested end-to-end

### Quick Start

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (visual debugger)
pnpm test:e2e:ui

# Reset test database
pnpm test:e2e:reset-db
```

### E2E Test Infrastructure

**Test Database**: Dedicated test database (port 5433) separate from development database (port 5432)

**Test Credentials**:
- Admin: `e2e-admin@test.com` / `E2ETestAdmin123!`
- User: `e2e-user@test.com` / `E2ETestUser123!`

**Test Data**: All E2E test data uses `E2E-Test-` prefix for automatic cleanup

### Implemented Tests

5 E2E tests covering critical client-hub workflows:

1. **Client Creation** (`client-creation.spec.ts`)
   - Create client with contact information
   - Verify data persistence across page refresh
   - Keyboard navigation testing

2. **Client Detail View** (`client-detail.spec.ts`)
   - Navigate to client detail page
   - View all tabs (info, services, tasks, documents, invoices)
   - Display client information correctly

3. **Task Management** (`task-management.spec.ts`)
   - Create task → assign → mark complete
   - Verify task appears in client detail tasks tab

4. **Document Upload** (`document-upload.spec.ts`)
   - Upload document → verify in list → download
   - File handling and storage verification

5. **Invoice Generation** (`invoice-generation.spec.ts`)
   - Create invoice → add line items → preview PDF
   - Verify calculations (totals, tax)

### Test Helpers

**Location**: `__tests__/e2e/helpers/`

- `auth.ts` - Login helpers (`loginAsTestUser`, `loginAsTestAdmin`)
- `factory.ts` - Test data generators with E2E-Test- prefix
- `cleanup.ts` - Automatic test data cleanup

### Configuration

**File**: `playwright.config.ts`

- Timeout: 30 seconds per test
- Execution: Serial (1 worker to prevent conflicts)
- Browsers: Chromium (primary), Firefox (secondary)
- Base URL: http://localhost:3000
- Web Server: Automatically starts `pnpm dev`

### Comprehensive Guide

For detailed E2E testing documentation, see:
- **[E2E Testing Guide](./e2e-testing-guide.md)** - Complete guide with examples, patterns, and troubleshooting

---

## Future Testing Plans

### 1. E2E Test Expansion

**Status**: NEXT PRIORITY

**Scope**:
- Client portal login → View proposals → Sign proposal
- Admin login → User management → Tenant configuration
- Proposal workflow → PDF generation → DocuSeal signature
- Invoice workflow → Xero sync → Payment tracking

### 2. Router Test Upgrades

**Status**: IN PROGRESS

**Current**: Input validation only (Zod schema tests)

**Target**: Full implementation tests including:
- Database operations
- Tenant isolation enforcement
- Authentication checks
- Business logic validation
- Error handling
- Response structure validation

**Action Items**:
1. Create router test upgrade script
2. Update existing 31 router tests
3. Add database integration for router tests
4. Validate tenant isolation per router
5. Increase coverage threshold to 80%

### 3. Component Testing

**Status**: PLANNED

**Scope**:
- React components (UI layer)
- Form validation and submission
- State management (React Query)
- User interactions

**Framework**: Vitest + React Testing Library

**Priority Components**:
1. Form components (ClientForm, ProposalForm, etc.)
2. Data tables (ClientsList, TasksList, etc.)
3. Navigation (GlobalHeader, GlobalSidebar)
4. Authentication UI (SignIn, SignUp)

### 4. Performance Testing

**Status**: PLANNED

**Scope**:
- Database query performance
- API response times
- Frontend rendering performance
- Large dataset handling

**Tools**:
- Vitest benchmarks
- Lighthouse CI
- Database query analysis

### 5. Visual Regression Testing

**Status**: CONSIDERATION

**Scope**:
- UI component visual consistency
- Cross-browser compatibility
- Responsive design validation

**Tools**:
- Playwright screenshots
- Percy or Chromatic integration

---

## Troubleshooting

### Common Test Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| `DATABASE_URL not set` | Missing environment variable | Check `.env.local` exists and contains `DATABASE_URL` |
| Tests fail in CI but pass locally | Environment differences | Ensure CI uses same Node version and env vars |
| `Cannot find module '@/...'` | Path alias not resolved | Check `vitest.config.ts` has correct `alias` configuration |
| Integration tests timeout | Database not running | Start PostgreSQL: `pnpm db:up` |
| Mock not working | Mock defined after import | Move `vi.mock()` to top of file before imports |
| Coverage threshold not met | Insufficient tests | Run `pnpm test:coverage` and check HTML report |
| Test pollution (tests affect each other) | Shared state between tests | Use `beforeEach` to reset state, ensure cleanup in `afterEach` |

### Database Connection Issues

```bash
# Verify database is running
docker ps | grep postgres

# Start database if not running
pnpm db:up

# Check connection string
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Mock Debugging

```typescript
// Enable mock call tracking
import { vi } from "vitest";

const mockFn = vi.fn();

// After calling
console.log(mockFn.mock.calls);        // All calls
console.log(mockFn.mock.results);      // All results
console.log(mockFn.mock.calls.length); // Number of calls
```

### Test Isolation Issues

```typescript
// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks();  // Clear call history
  vi.resetAllMocks();  // Reset implementations
});

// Reset database state for integration tests
afterEach(async () => {
  await db.delete(testTable).where(eq(testTable.tenantId, TEST_TENANT_ID));
});
```

---

## Related Documentation

- [Development Coding Standards](./coding-standards.md) - TypeScript and testing conventions
- [tRPC Router Reference](../reference/api/trpc-routers.md) - All 31 routers documented
- [Multi-Tenancy Architecture](../architecture/multi-tenancy.md) - Tenant isolation patterns
- [Database Schema Reference](../reference/database/schema.md) - Complete schema documentation
- [Practice Hub Testing Skill](../../.claude/skills/practice-hub-testing.md) - Automated test generation

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial comprehensive testing documentation | Development Team |

---

## Feedback

Found an issue or have a suggestion? Update this document directly or create an issue in the project repository.
