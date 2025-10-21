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

## Future Testing Plans

### 1. End-to-End (E2E) Testing with Playwright

**Status**: PLANNED

**Scope**:
- Critical user workflows
- Authentication flows
- Multi-tenant access control
- Client portal functionality
- Admin panel operations

**Implementation**:
- Install Playwright: `pnpm add -D @playwright/test`
- Create `e2e/` directory for test files
- Configure `playwright.config.ts`
- Integrate with CI/CD pipeline

**Priority Workflows**:
1. Staff user login → Client creation → Service assignment
2. Client portal login → View proposals → Sign proposal
3. Admin login → User management → Tenant configuration
4. Proposal workflow → PDF generation → DocuSeal signature
5. Invoice workflow → Xero sync → Payment tracking

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
