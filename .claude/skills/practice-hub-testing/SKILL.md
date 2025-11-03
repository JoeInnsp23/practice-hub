---
name: practice-hub-testing
description: Comprehensive testing workflows for Practice Hub including Vitest configuration, tRPC router testing, multi-tenant validation, Better Auth flows, and component testing. Use for writing tests, validating multi-tenant isolation, and ensuring production readiness.
---

# Practice Hub Testing Skill

## Overview

This skill provides comprehensive testing patterns for Practice Hub's multi-tenant architecture, tRPC routers, Better Auth integration, and React components using Vitest.

**Powerful automation scripts included** - see `scripts/` directory.

**Keywords**: testing, Vitest, tRPC testing, multi-tenant testing, Better Auth, integration tests, unit tests, test coverage, quality assurance

## Automation Scripts

**IMPORTANT: Always run scripts with `--help` first** to understand usage.

### 1. Generate Router Tests
```bash
python scripts/generate_router_test.py app/server/routers/clients.ts
```
- Analyzes tRPC router file
- Generates comprehensive test boilerplate
- Includes multi-tenant isolation tests
- Creates beforeEach/afterEach hooks

**Integration with docs-maintainer**:
- Use `docs/dev/repo-facts.json` to discover all routers
- Auto-generates tests for newly added routers
- Validates test coverage against router inventory

### 2. Validate Tenant Isolation
```bash
python scripts/validate_tenant_isolation.py
python scripts/validate_tenant_isolation.py --strict
```
- Scans all database queries
- Detects missing tenant filters
- Finds hard-coded tenant IDs
- **CRITICAL before production deployment**

### 3. Check Test Coverage
```bash
bash scripts/check_coverage.sh
```
- Runs Vitest with coverage
- Identifies routers without tests
- Finds components without tests
- Generates coverage report

## Critical Testing Priorities

**IMPORTANT: Pre-production testing checklist:**

1. ✅ **Multi-tenant data isolation** - CRITICAL before live data
2. ✅ **tRPC router authorization** - Ensure tenant scoping works
3. ✅ **Better Auth flows** - Sign in, sign up, session management
4. ✅ **UI component rendering** - All modules render correctly
5. ✅ **Database queries** - All queries properly scoped to tenantId
6. ✅ **Edge cases** - Error handling, invalid inputs, boundary conditions

## Vitest Configuration

Practice Hub uses Vitest for testing. Configuration in `vitest.config.ts`:

**Available Scripts:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Visual UI for tests
pnpm test:coverage     # Coverage report
```

## tRPC Router Testing

### Test File Structure

Place tests alongside routers or in `__tests__` directory:
```
app/server/routers/
├── clients.ts
├── clients.test.ts
├── proposals.ts
└── proposals.test.ts
```

### Testing Protected Procedures

**Pattern for testing tenant-scoped queries:**

```typescript
// app/server/routers/clients.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../index';
import { createContext } from '../context';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';

describe('clients router', () => {
  // Mock auth context with tenant
  const mockAuthContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'admin',
    email: 'admin@example.com',
    firstName: 'Test',
    lastName: 'Admin',
  };

  const mockContext = {
    session: { user: { id: 'user-1' } },
    authContext: mockAuthContext,
    clientPortalSession: null,
    clientPortalAuthContext: null,
  };

  it('should only return clients for the authenticated tenant', async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.clients.list();

    // Verify all results belong to tenant-1
    expect(result.every(client => client.tenantId === 'tenant-1')).toBe(true);
  });

  it('should prevent access to other tenant data', async () => {
    const caller = appRouter.createCaller(mockContext);

    // Try to access client from different tenant
    await expect(
      caller.clients.getById({ id: 'client-from-tenant-2' })
    ).rejects.toThrow();
  });
});
```

### Testing Admin-Only Procedures

```typescript
it('should require admin role for admin procedures', async () => {
  const nonAdminContext = {
    ...mockContext,
    authContext: { ...mockAuthContext, role: 'member' },
  };

  const caller = appRouter.createCaller(nonAdminContext);

  await expect(
    caller.users.create({ email: 'test@example.com', role: 'member' })
  ).rejects.toThrow('Admin access required');
});
```

### Testing Client Portal Procedures

```typescript
it('should authenticate client portal users', async () => {
  const clientPortalContext = {
    session: null,
    authContext: null,
    clientPortalSession: { user: { id: 'client-user-1' } },
    clientPortalAuthContext: {
      userId: 'client-user-1',
      clientId: 'client-1',
      tenantId: 'tenant-1',
    },
  };

  const caller = appRouter.createCaller(clientPortalContext);

  const result = await caller.clientPortal.getProposals();

  expect(result.every(p => p.clientId === 'client-1')).toBe(true);
});
```

## Multi-Tenant Testing with Dual Isolation

Practice Hub implements **two levels of data isolation**:
1. **Tenant Isolation** - Accountancy firm level (staff access)
2. **Client Isolation** - Customer business level (client portal access)

### Critical Test Cases

**1. Tenant-Level Data Isolation (Staff Access):**
```typescript
describe('tenant data isolation (staff)', () => {
  it('should never return data from other tenants', async () => {
    // Create test data for multiple tenants
    await db.insert(clients).values([
      { id: 'client-1', tenantId: 'tenant-1', name: 'Tenant 1 Client' },
      { id: 'client-2', tenantId: 'tenant-2', name: 'Tenant 2 Client' },
    ]);

    const tenant1Context = createMockContext('tenant-1');
    const caller = appRouter.createCaller(tenant1Context);

    const results = await caller.clients.list();

    // Verify ZERO results from tenant-2
    expect(results.find(c => c.tenantId === 'tenant-2')).toBeUndefined();
    expect(results.every(c => c.tenantId === 'tenant-1')).toBe(true);
  });
});
```

**2. Client-Level Data Isolation (Client Portal Access):**
```typescript
describe('client data isolation (client portal)', () => {
  it('should only return data for specific client within tenant', async () => {
    // Create test data: 2 clients in same tenant
    await db.insert(proposals).values([
      { id: 'prop-1', tenantId: 'tenant-1', clientId: 'client-a', title: 'Client A Proposal' },
      { id: 'prop-2', tenantId: 'tenant-1', clientId: 'client-b', title: 'Client B Proposal' },
    ]);

    const clientAContext = createMockClientPortalContext('tenant-1', 'client-a');
    const caller = appRouter.createCaller(clientAContext);

    const results = await caller.clientPortal.getProposals();

    // Verify ZERO results from client-b (same tenant, different client)
    expect(results.find(p => p.clientId === 'client-b')).toBeUndefined();
    expect(results.every(p => p.clientId === 'client-a')).toBe(true);
    expect(results.every(p => p.tenantId === 'tenant-1')).toBe(true);
  });
});
```

**2. Foreign Key Relationships:**
```typescript
it('should maintain tenant isolation across relationships', async () => {
  const caller = appRouter.createCaller(mockContext);

  // Get tasks with client relationship
  const tasks = await caller.tasks.list();

  // Verify all related clients belong to same tenant
  for (const task of tasks) {
    if (task.client) {
      expect(task.client.tenantId).toBe('tenant-1');
    }
  }
});
```

## Database Testing Patterns

### Seed Data for Tests

Use `scripts/seed.ts` patterns for test data:

```typescript
import { db } from '@/lib/db';
import { tenants, users, clients } from '@/lib/db/schema';

async function seedTestData() {
  // Create test tenant
  await db.insert(tenants).values({
    id: 'test-tenant',
    name: 'Test Organization',
    slug: 'test-org',
  });

  // Create test user
  await db.insert(users).values({
    id: 'test-user',
    tenantId: 'test-tenant',
    email: 'test@example.com',
    role: 'admin',
  });

  // Create test clients
  await db.insert(clients).values([
    { id: 'client-1', tenantId: 'test-tenant', name: 'Test Client 1' },
    { id: 'client-2', tenantId: 'test-tenant', name: 'Test Client 2' },
  ]);
}
```

### Database Reset Between Tests

```typescript
import { beforeEach, afterEach } from 'vitest';

beforeEach(async () => {
  // Seed test data
  await seedTestData();
});

afterEach(async () => {
  // Clean up test data
  await db.delete(clients).where(eq(clients.tenantId, 'test-tenant'));
  await db.delete(users).where(eq(users.tenantId, 'test-tenant'));
  await db.delete(tenants).where(eq(tenants.id, 'test-tenant'));
});
```

## Component Testing

### Testing React Components with Vitest

```typescript
// components/ui/card.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('Card component', () => {
  it('should apply glass-card class automatically', () => {
    const { container } = render(
      <Card>
        <CardContent>Test content</CardContent>
      </Card>
    );

    const card = container.querySelector('.glass-card');
    expect(card).toBeDefined();
  });

  it('should render in dark mode', () => {
    render(
      <div className="dark">
        <Card>
          <CardContent>Dark mode test</CardContent>
        </Card>
      </div>
    );

    expect(screen.getByText('Dark mode test')).toBeDefined();
  });
});
```

### Testing Module Pages

```typescript
// app/client-hub/clients/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClientsPage from './page';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    clients: {
      list: {
        useQuery: () => ({
          data: [
            { id: '1', name: 'Client 1', tenantId: 'tenant-1' },
            { id: '2', name: 'Client 2', tenantId: 'tenant-1' },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

describe('ClientsPage', () => {
  it('should render client list', async () => {
    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Client 1')).toBeDefined();
      expect(screen.getByText('Client 2')).toBeDefined();
    });
  });
});
```

## Better Auth Testing

### Testing Authentication Flows

```typescript
describe('Better Auth integration', () => {
  it('should create session on successful sign in', async () => {
    const { auth } = await import('@/lib/auth');

    const result = await auth.api.signInEmail({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.session).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('should enforce middleware protection', async () => {
    // Test that unauthenticated requests are rejected
    const mockContext = {
      session: null,
      authContext: null,
    };

    const caller = appRouter.createCaller(mockContext);

    await expect(
      caller.clients.list()
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

## Integration Testing

### End-to-End Workflow Tests

```typescript
describe('proposal workflow integration', () => {
  it('should complete full proposal lifecycle', async () => {
    const caller = appRouter.createCaller(mockContext);

    // 1. Create lead
    const lead = await caller.leads.create({
      companyName: 'Test Company',
      contactEmail: 'contact@test.com',
    });

    // 2. Convert to proposal
    const proposal = await caller.proposals.createFromLead({
      leadId: lead.id,
    });

    // 3. Generate pricing
    const pricing = await caller.pricing.calculate({
      proposalId: proposal.id,
      services: ['bookkeeping', 'vat-returns'],
    });

    expect(pricing.totalPrice).toBeGreaterThan(0);

    // 4. Sign proposal
    const signature = await caller.proposals.sign({
      proposalId: proposal.id,
      signatureData: 'base64-signature',
    });

    expect(signature.success).toBe(true);
  });
});
```

## Test Coverage Goals

**Target Coverage:**
- tRPC Routers: 80%+ coverage
- Critical paths (auth, multi-tenant): 100% coverage
- UI Components: 60%+ coverage
- Integration tests: All major workflows

**Run Coverage Report:**
```bash
pnpm test:coverage
```

## Common Testing Patterns

### Mock Functions
```typescript
import { vi } from 'vitest';

const mockSendEmail = vi.fn();
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));
```

### Async Testing
```typescript
it('should handle async operations', async () => {
  const result = await caller.clients.create({ name: 'New Client' });
  expect(result.id).toBeDefined();
});
```

### Error Testing
```typescript
it('should handle validation errors', async () => {
  await expect(
    caller.clients.create({ name: '' }) // Invalid: empty name
  ).rejects.toThrow('Name is required');
});
```

## Best Practices

1. **Test tenant isolation first** - Most critical for multi-tenant app
2. **Use realistic test data** - Mirror production data structures
3. **Test error cases** - Not just happy paths
4. **Mock external services** - S3, email, payment processors
5. **Clean up after tests** - Remove test data in afterEach
6. **Test authorization** - Verify role-based access control
7. **Test edge cases** - Null values, empty arrays, boundary conditions

## Pre-Production Checklist

Before importing live data, ensure tests cover:

- ✅ All tRPC routers have basic test coverage
- ✅ Multi-tenant isolation verified across all queries
- ✅ Authentication and authorization flows tested
- ✅ Database foreign keys maintain tenant boundaries
- ✅ Client portal access properly scoped
- ✅ Admin functions require admin role
- ✅ Error handling produces user-friendly messages
- ✅ No console.log statements in production code
- ✅ All TODOs resolved or documented as future features
