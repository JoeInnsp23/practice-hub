---
title: "Multi-Tenancy Architecture"
category: "architecture"
subcategory: "database"
purpose: "Understand Practice Hub's dual-level data isolation architecture"
audience: ["ai-agent", "developer"]
prerequisites: ["system-overview.md"]
related: ["../reference/database/schema.md", "authentication.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "architecture-team"
tags: ["multi-tenancy", "isolation", "security", "database"]
---

# Multi-Tenancy Architecture

**Quick Summary**: Practice Hub implements dual-level data isolation: tenant-level (accountancy firm) and client-level (customer business), ensuring complete data separation between tenants and optional client-level scoping for external access.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- Dual-level isolation model (tenant + client)
- Database schema patterns for multi-tenancy
- Authentication context design
- Query patterns for data isolation
- Critical security requirements

---

## Prerequisites

Before reading this document, you should:
- [x] Understand basic database concepts (foreign keys, indexes)
- [x] Read [System Overview](system-overview.md) for overall architecture context
- [x] Understand PostgreSQL schema design

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core patterns:

**Dual Isolation Model**:
```
Tenant (Accountancy Firm)
├── Staff Users (tenantId only)
├── Clients (tenantId only)
│   └── Client Portal Users (tenantId + clientId - DUAL ISOLATION)
├── Proposals (tenantId + clientId)
└── Data (tenantId scoped)
```

**Schema Patterns**:
```typescript
// Staff access (tenant isolation)
tenantId: text("tenant_id").references(() => tenants.id).notNull()

// Client portal access (dual isolation)
tenantId: text("tenant_id").references(() => tenants.id).notNull()
clientId: uuid("client_id").references(() => clients.id).notNull()
```

**Query Patterns**:
```typescript
// Staff query (tenant-scoped)
.where(eq(table.tenantId, ctx.authContext.tenantId))

// Client portal query (dual-scoped)
.where(and(
  eq(table.tenantId, ctx.authContext.tenantId),
  eq(table.clientId, ctx.authContext.clientId)
))
```

---

## Detailed Guide

### Architecture Overview

Practice Hub is a multi-tenant SaaS platform for accountancy firms. The application implements **two levels of data isolation**:

#### Level 1: Tenant Isolation (Accountancy Firm Level)

**Tenant** = Accountancy firm (e.g., "Acme Accounting Ltd")

**Purpose**: Isolate data between different accountancy firms using the platform

**Implementation**: All tables (except system tables) must have `tenantId` field

**Access**: Staff users (accountants, admins) have access to all data within their tenant

**Structure:**
```
Tenant (Accountancy Firm)
├── Users (Staff members - tenantId only)
├── Clients (Customer businesses - tenantId only)
├── Tasks, Invoices, Proposals, etc. (tenantId only)
```

#### Level 2: Client Isolation (Customer Business Level)

**Client** = Customer business using the client portal (e.g., "ABC Manufacturing Ltd")

**Purpose**: Isolate data between different customer businesses within the same accountancy firm

**Implementation**: Client portal tables must have BOTH `tenantId` AND `clientId`

**Access**: Client portal users only see data for their specific client company

**Structure:**
```
Tenant (Accountancy Firm)
└── Clients (Customer businesses)
    └── Client Portal Users (BOTH tenantId + clientId)
        ├── Can only access their client's proposals
        ├── Can only see their client's invoices
        ├── Can only view their client's documents
        └── Cannot see other clients' data within same tenant
```

---

### Database Schema Patterns

#### Standard Tables (Staff Access)

**Pattern**: Single-level isolation with `tenantId`

```typescript
// Example: Clients table
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  name: text("name").notNull(),
  email: text("email"),
  // ... other fields
});
```

**Usage**: Staff users can access all clients within their tenant

**Tables Using This Pattern**:
- `users` - Staff users
- `clients` - Customer businesses
- `tasks` - Task management
- `workflows` - Workflow automation
- `invoices` - Invoice management
- `time_entries` - Time tracking
- `compliance` - Compliance tracking
- `documents` - Document metadata
- `leads` - Sales leads
- `proposals` - Proposals (when not client-specific)

---

#### Client Portal Tables (Dual Isolation)

**Pattern**: Dual-level isolation with `tenantId` AND `clientId`

```typescript
// Example: Client portal access table
export const clientPortalAccess = pgTable("client_portal_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  clientId: uuid("client_id").references(() => clients.id).notNull(),  // REQUIRED
  userId: text("user_id").references(() => clientPortalUsers.id).notNull(),
  // ... other fields
});
```

**Usage**: Client portal users can only access data for their specific client

**Tables Using This Pattern**:
- `client_portal_access` - Portal access grants (junction table for multi-client support)
- `client_portal_invitations` - Client portal invitations
- `client_portal_session` - ✅ HAS dual isolation (`tenantId` + `clientId`)
- `client_portal_account` - ✅ HAS dual isolation (`tenantId` + `clientId`)
- `client_portal_verification` - ✅ HAS dual isolation (`tenantId` + `clientId`)
- Client-scoped data (proposals, invoices, documents when accessed via portal)

**📝 Multi-Client Access Pattern**:
- `client_portal_users` - Uses `tenantId` ONLY (by design)
  - Supports users accessing multiple clients within a tenant
  - Client associations managed via `client_portal_access` junction table
  - Pattern: user.tenantId → clientPortalAccess → multiple clientId values
- Authentication context includes `clientAccess[]` array with all accessible clients
- Current session tracks selected `currentClientId` for multi-client users

---

#### System Tables (No Isolation)

**Pattern**: No `tenantId` (system-wide tables)

**Tables**:
- `tenants` - The tenant table itself
- `session` - Better Auth staff sessions
- `account` - Better Auth OAuth accounts
- `verification` - Better Auth email verification
- `drizzle_migrations` - Drizzle system table

**Why No Isolation**: These tables are either the source of tenant identity or system-level authentication data.

---

### Authentication Context Design

#### Staff Authentication Context

```typescript
// lib/auth.ts
export interface AuthContext {
  userId: string;
  tenantId: string;         // ALWAYS populated
  organizationName?: string;
  role: string;             // admin, member
  email: string;
  firstName: string | null;
  lastName: string | null;
}
```

**Implementation**:
```typescript
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Look up user's tenant from database
  const userRecord = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      role: users.role,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (userRecord.length === 0) {
    console.warn("Auth: User not found in users table");
    return null;
  }

  const { id, tenantId, role, email, firstName, lastName, tenantName } = userRecord[0];

  return {
    userId: id,
    tenantId,
    organizationName: tenantName,
    role,
    email,
    firstName,
    lastName,
  };
}
```

**Usage**: Automatically scopes all staff queries to their tenant

---

#### Client Portal Authentication Context

```typescript
// lib/client-portal-auth.ts
export interface ClientPortalAuthContext {
  portalUserId: string;  // Portal user ID (not userId)
  tenantId: string;      // REQUIRED: Accountancy firm
  email: string;
  firstName: string | null;
  lastName: string | null;
  clientAccess: Array<{  // Multi-client support
    clientId: string;
    clientName: string;
    role: string;
    isActive: boolean;
  }>;
  currentClientId?: string; // Selected client for multi-client users
}
```

**Why Separate**: Client portal users need dual isolation (tenantId + clientId) AND support for multi-client access

**Multi-Client Pattern**:
- Portal users can access multiple clients within a tenant
- `clientAccess` array contains all client grants
- `currentClientId` tracks which client context is active in current session
- Queries must filter by `authContext.currentClientId` (not single `clientId`)

**Implementation**:
1. Looks up `client_portal_users` by session (gets `tenantId`)
2. Queries `client_portal_access` junction table for all client grants
3. Returns array of accessible clients with current selection

---

### Query Patterns

#### Staff Query (Tenant Isolation)

**Pattern**: Filter by `tenantId` only

```typescript
// Example: List all clients within tenant
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, authContext.tenantId));
```

**tRPC Example**:
```typescript
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    // ctx.authContext is automatically populated
    return db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),
});
```

---

#### Client Portal Query (Dual Isolation)

**Pattern**: Filter by BOTH `tenantId` AND `currentClientId`

```typescript
// ❌ WRONG - Client portal missing clientId
const proposals = await db
  .select()
  .from(proposalsTable)
  .where(eq(proposalsTable.tenantId, authContext.tenantId));

// ✅ CORRECT - Client portal needs BOTH
const proposals = await db
  .select()
  .from(proposalsTable)
  .where(
    and(
      eq(proposalsTable.tenantId, authContext.tenantId),           // Tenant isolation
      eq(proposalsTable.clientId, authContext.currentClientId)     // Client isolation (current selection)
    )
  );
```

**tRPC Example**:
```typescript
export const clientPortalRouter = router({
  getProposals: clientPortalProcedure.query(({ ctx }) => {
    // ctx.authContext has tenantId and currentClientId (selected client)
    if (!ctx.authContext.currentClientId) {
      throw new Error("No client selected");
    }

    return db
      .select()
      .from(proposals)
      .where(
        and(
          eq(proposals.tenantId, ctx.authContext.tenantId),
          eq(proposals.clientId, ctx.authContext.currentClientId)
        )
      );
  }),
});
```

**📝 Multi-Client Support Note**: For users with access to multiple clients, queries use `currentClientId` from session. Users can switch between accessible clients in their `clientAccess[]` array.

---

### Critical Security Requirements

#### Requirement 1: All Tables Must Have tenantId

**Rule**: Every table (except system tables) MUST have `tenantId` field

**Verification**:
```typescript
// ❌ WRONG - Missing tenantId
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  // Missing tenantId!
});

// ✅ CORRECT - Has tenantId
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  title: text("title").notNull(),
});
```

---

#### Requirement 2: Client Portal Tables Must Have BOTH tenantId AND clientId

**Rule**: Tables accessed by client portal users MUST have both fields

**Verification**:
```typescript
// ❌ WRONG - Missing clientId
export const clientPortalUsers = pgTable("client_portal_users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").notNull(),
  // Missing clientId!
});

// ✅ CORRECT - Has both tenantId and clientId
export const clientPortalUsers = pgTable("client_portal_users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  email: text("email").notNull(),
});
```

---

#### Requirement 3: All Queries Must Scope By tenantId

**Rule**: Every query MUST filter by `tenantId` (and `clientId` for client portal)

**Enforcement**: tRPC context automatically provides `authContext` with tenant/client info

**Verification Pattern**:
```typescript
// ❌ WRONG - No tenant scoping
const allClients = await db.select().from(clients);

// ✅ CORRECT - Scoped to tenant
const clients = await db
  .select()
  .from(clients)
  .where(eq(clients.tenantId, ctx.authContext.tenantId));
```

---

## Examples

### Example 1: Creating a New Table (Staff Access)

```typescript
// lib/db/schema.ts
export const newFeature = pgTable("new_feature", {
  id: uuid("id").defaultRandom().primaryKey(),

  // REQUIRED: Tenant isolation
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),

  // Feature-specific fields
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**When to use**: Staff-only features, internal data, tenant-level resources

---

### Example 2: Creating a New Table (Client Portal Access)

```typescript
// lib/db/schema.ts
export const clientSpecificData = pgTable("client_specific_data", {
  id: uuid("id").defaultRandom().primaryKey(),

  // REQUIRED: Dual isolation
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),

  // Feature-specific fields
  data: text("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**When to use**: Data accessible by client portal users, client-specific resources

---

### Example 3: Staff Server Component

```typescript
// app/client-hub/clients/page.tsx
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const authContext = await getAuthContext();
  if (!authContext) redirect("/sign-in");

  // Staff can see ALL clients within their tenant
  const clients = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.tenantId, authContext.tenantId));

  return <ClientsList clients={clients} />;
}
```

---

### Example 4: Client Portal Server Component

```typescript
// app/client-portal/proposals/page.tsx
import { getClientPortalAuthContext } from "@/lib/client-portal-auth";
import { redirect } from "next/navigation";

export default async function ClientProposalsPage() {
  const authContext = await getClientPortalAuthContext();
  if (!authContext) redirect("/portal/sign-in");

  // Client portal users can ONLY see their specific client's data
  const proposals = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.tenantId, authContext.tenantId),  // Tenant isolation
        eq(proposalsTable.clientId, authContext.clientId)   // Client isolation
      )
    );

  return <ProposalsList proposals={proposals} />;
}
```

---

## Common Patterns

**Pattern 1: Tenant-Scoped List Query**
```typescript
const items = await db
  .select()
  .from(table)
  .where(eq(table.tenantId, ctx.authContext.tenantId));
```
When to use: Staff features, internal resources, tenant-level data

**Pattern 2: Dual-Scoped List Query**
```typescript
const items = await db
  .select()
  .from(table)
  .where(
    and(
      eq(table.tenantId, ctx.authContext.tenantId),
      eq(table.clientId, ctx.authContext.clientId)
    )
  );
```
When to use: Client portal features, client-specific data

**Pattern 3: Tenant-Scoped Create**
```typescript
await db.insert(table).values({
  tenantId: ctx.authContext.tenantId,
  // ... other fields
});
```
When to use: Creating new records for staff users

**Pattern 4: Dual-Scoped Create**
```typescript
await db.insert(table).values({
  tenantId: ctx.authContext.tenantId,
  clientId: ctx.authContext.clientId,
  // ... other fields
});
```
When to use: Creating records in client portal

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "User not found in organization" | User record missing from `users` table | Ensure user was created with proper `tenantId` |
| Seeing other tenants' data | Missing `tenantId` filter in query | Add `.where(eq(table.tenantId, ctx.authContext.tenantId))` |
| Client portal user sees all clients' data | Missing `clientId` filter | Add dual isolation: `and(eq(...tenantId), eq(...clientId))` |
| Cannot create record | Foreign key constraint violation | Ensure `tenantId` references valid tenant |
| Migration fails after schema change | Seed data doesn't match schema | Update `scripts/seed.ts` to match new schema |

---

## Related Documentation

- [System Overview](system-overview.md) - Overall architecture context
- [Authentication Architecture](authentication.md) - Dual auth system design
- [Database Schema](../reference/database/schema.md) - Complete schema reference
- [Technical Debt](../development/technical-debt.md) - Known multi-tenancy issues

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial AI-optimized version | Architecture Team |

---

## Feedback

Found an issue? Update this doc directly or create an issue in the project repository.
