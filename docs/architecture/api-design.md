---
title: "API Design & tRPC Patterns"
category: "architecture"
subcategory: "api"
purpose: "Understand Practice Hub's tRPC-based API architecture and standard patterns"
audience: ["ai-agent", "developer"]
prerequisites: ["system-overview.md", "multi-tenancy.md"]
related: ["../reference/api/routers.md", "../guides/development/creating-trpc-router.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "architecture-team"
tags: ["trpc", "api", "type-safety", "patterns"]
---

# API Design & tRPC Patterns

**Quick Summary**: Practice Hub uses tRPC for 100% type-safe APIs with automatic multi-tenant scoping, rate limiting, and comprehensive error handling. No REST APIs except webhooks.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- tRPC architecture and setup
- Standard procedure patterns (query, mutation)
- Multi-tenant query scoping
- Rate limiting and middleware
- Error handling patterns
- Router organization

---

## Prerequisites

Before reading this document, you should:
- [x] Understand [System Overview](system-overview.md)
- [x] Understand [Multi-Tenancy Architecture](multi-tenancy.md)
- [x] Understand TypeScript and React Query basics
- [x] Understand tRPC fundamentals

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core patterns:

**tRPC Stack**:
```
tRPC v11.6.0
├── Server: app/server/routers/*.ts (29 routers)
├── Context: AuthContext with tenantId + role
├── Procedures: protectedProcedure, adminProcedure, publicProcedure
├── Middleware: Rate limiting + auth check
└── Client: TanStack Query hooks
```

**Standard Query Pattern**:
```typescript
export const router = {
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(table)
        .where(eq(table.tenantId, ctx.authContext.tenantId));
    }),
};
```

**Standard Mutation Pattern**:
```typescript
create: protectedProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await db.insert(table).values({
      tenantId: ctx.authContext.tenantId,
      ...input,
    });
  }),
```

---

## Detailed Guide

### Why tRPC?

**Advantages**:
- 100% type-safe APIs (TypeScript end-to-end)
- No code generation required
- Automatic validation with Zod
- TanStack Query integration
- Better DX than REST

**Trade-offs**:
- No external API access (internal only)
- Requires TypeScript
- Monorepo architecture preferred

**Webhooks Exception**: Practice Hub uses REST for webhooks (`/api/webhooks/*`) as external services need to call them.

---

### tRPC Setup

#### Context Creation

**File**: `app/server/context.ts`

```typescript
import { auth, getAuthContext } from "@/lib/auth";

export const createContext = async () => {
  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  // Get our app's auth context (with tenant info)
  const authContext = await getAuthContext();

  return {
    session,
    authContext,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Why**: Context provides auth session and tenant info to all tRPC procedures

---

#### tRPC Initialization

**File**: `app/server/trpc.ts`

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson, // Supports Date, Map, Set, etc.
});

export const router = t.router;
export const publicProcedure = t.procedure;
```

**SuperJSON**: Enables passing Date objects, Map, Set without manual serialization

---

#### Procedure Types

**1. Public Procedure** (no auth required):
```typescript
export const publicProcedure = t.procedure;
```
Use cases: Health checks, public data (rarely used)

**2. Protected Procedure** (staff auth required):
```typescript
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.authContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in organization",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      authContext: ctx.authContext,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```
Use cases: All staff features (90% of procedures)

**3. Admin Procedure** (admin role required):
```typescript
const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.authContext) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({ ctx });
});

export const adminProcedure = t.procedure.use(isAdmin);
```
Use cases: User management, system settings, KYC approval

---

### Query Patterns

#### Standard List Query

**Pattern**: Fetch all records for tenant with optional filters

```typescript
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, like, and } from "drizzle-orm";

export const clientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      let query = db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, tenantId));

      if (input.search) {
        query = query.where(like(clients.name, `%${input.search}%`));
      }

      if (input.status) {
        query = query.where(eq(clients.status, input.status));
      }

      return await query;
    }),
});
```

**Key Points**:
- ALWAYS filter by `tenantId`
- Use Zod for input validation
- Optional filters for search/filtering
- Return type is inferred automatically

---

#### Standard Get Query

**Pattern**: Fetch single record by ID (tenant-scoped)

```typescript
getById: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    const client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, input.id),
          eq(clients.tenantId, ctx.authContext.tenantId) // Security: Prevent cross-tenant access
        )
      )
      .limit(1);

    if (client.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client not found",
      });
    }

    return client[0];
  }),
```

**Key Points**:
- ALWAYS include `tenantId` check (prevents cross-tenant access)
- Throw `NOT_FOUND` error if record doesn't exist
- Use `.limit(1)` for performance

---

#### Aggregation Query

**Pattern**: Dashboard KPIs, statistics

```typescript
stats: protectedProcedure.query(async ({ ctx }) => {
  const { tenantId } = ctx.authContext;

  const [totalClients, activeClients, revenue] = await Promise.all([
    db
      .select({ count: sql`count(*)` })
      .from(clients)
      .where(eq(clients.tenantId, tenantId)),

    db
      .select({ count: sql`count(*)` })
      .from(clients)
      .where(
        and(
          eq(clients.tenantId, tenantId),
          eq(clients.status, "active")
        )
      ),

    db
      .select({ total: sql`sum(amount)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.status, "paid")
        )
      ),
  ]);

  return {
    totalClients: totalClients[0].count,
    activeClients: activeClients[0].count,
    revenue: revenue[0].total || 0,
  };
}),
```

**Key Points**:
- Use `Promise.all()` for parallel queries
- Use database views for complex aggregations (see `dashboard_kpi_view`)
- Always scope by `tenantId`

---

### Mutation Patterns

#### Standard Create Mutation

**Pattern**: Create new record with auto-generated ID

```typescript
create: protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const newClient = await db
      .insert(clients)
      .values({
        tenantId: ctx.authContext.tenantId, // ALWAYS set tenantId
        ...input,
      })
      .returning();

    return newClient[0];
  }),
```

**Key Points**:
- ALWAYS set `tenantId` from context
- Use `.returning()` to get created record
- Zod validation ensures data integrity

---

#### Standard Update Mutation

**Pattern**: Update existing record (tenant-scoped)

```typescript
update: protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const updated = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, id),
          eq(clients.tenantId, ctx.authContext.tenantId) // Security: Prevent cross-tenant updates
        )
      )
      .returning();

    if (updated.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client not found",
      });
    }

    return updated[0];
  }),
```

**Key Points**:
- ALWAYS include `tenantId` check in WHERE clause
- Update `updatedAt` timestamp
- Return updated record with `.returning()`
- Throw `NOT_FOUND` if no rows affected

---

#### Standard Delete Mutation

**Pattern**: Delete record (tenant-scoped)

```typescript
delete: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const deleted = await db
      .delete(clients)
      .where(
        and(
          eq(clients.id, input.id),
          eq(clients.tenantId, ctx.authContext.tenantId) // Security: Prevent cross-tenant deletes
        )
      )
      .returning();

    if (deleted.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client not found",
      });
    }

    return { success: true };
  }),
```

**Key Points**:
- ALWAYS include `tenantId` check
- Use soft deletes when possible (set `deletedAt` instead of actual delete)
- Return success indicator

---

### Error Handling

**Standard Error Codes**:
```typescript
TRPCError({
  code: "UNAUTHORIZED",     // Not authenticated
  code: "FORBIDDEN",        // Authenticated but no permission
  code: "NOT_FOUND",        // Resource doesn't exist
  code: "BAD_REQUEST",      // Invalid input (Zod catches most)
  code: "INTERNAL_SERVER_ERROR", // Unexpected errors
});
```

**Error Handling Pattern**:
```typescript
try {
  await operation();
} catch (error) {
  // Log to Sentry
  Sentry.captureException(error, {
    tags: { operation: "create_client" },
    extra: { input },
  });

  // Re-throw as TRPCError
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to create client",
    cause: error,
  });
}
```

**Client-Side Error Handling**:
```typescript
const mutation = trpc.clients.create.useMutation({
  onError: (error) => {
    toast.error(error.message);
  },
  onSuccess: () => {
    toast.success("Client created successfully");
  },
});
```

---

### Rate Limiting

**Implementation**: `app/server/trpc.ts`

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimiter = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.session?.user) {
    return next();
  }

  const userId = ctx.session.user.id;
  const allowed = await checkRateLimit(userId, path);

  if (!allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  return next();
});

// Apply to all procedures
export const protectedProcedure = t.procedure.use(isAuthed).use(rateLimiter);
```

**Configuration**: Upstash Redis-based, optional (gracefully skips if not configured)

**Limits**: 100 requests per 10 minutes per user per endpoint

---

### Client Usage

**Setup**: `app/_trpc/client.ts`

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/app/server";

export const trpc = createTRPCReact<AppRouter>();
```

**Query Hook**:
```typescript
"use client";
import { trpc } from "@/app/_trpc/client";

export function ClientsList() {
  const { data, isLoading, error } = trpc.clients.list.useQuery({
    search: "Acme",
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((client) => (
        <li key={client.id}>{client.name}</li>
      ))}
    </ul>
  );
}
```

**Mutation Hook**:
```typescript
"use client";
import { trpc } from "@/app/_trpc/client";

export function CreateClientForm() {
  const utils = trpc.useUtils();

  const mutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate(); // Refetch list
      toast.success("Client created!");
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

---

## Examples

### Example 1: Complete Router

```typescript
// app/server/routers/clients.ts
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.tenantId, ctx.authContext.tenantId),
            input.search ? like(clients.name, `%${input.search}%`) : undefined
          )
        );
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, input.id),
            eq(clients.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return result[0];
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const newClient = await db
        .insert(clients)
        .values({ tenantId: ctx.authContext.tenantId, ...input })
        .returning();

      return newClient[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(clients.id, id), eq(clients.tenantId, ctx.authContext.tenantId))
        )
        .returning();

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updated[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(clients)
        .where(
          and(
            eq(clients.id, input.id),
            eq(clients.tenantId, ctx.authContext.tenantId)
          )
        );

      return { success: true };
    }),
});
```

---

## Common Patterns

**Pattern 1: Tenant-Scoped List**
```typescript
.query(({ ctx }) => db.select().from(table).where(eq(table.tenantId, ctx.authContext.tenantId)))
```
When to use: All list queries

**Pattern 2: Tenant-Scoped Get**
```typescript
.where(and(eq(table.id, id), eq(table.tenantId, ctx.authContext.tenantId)))
```
When to use: All single-record queries

**Pattern 3: Optimistic Updates**
```typescript
const utils = trpc.useUtils();
mutation.mutate(data, {
  onMutate: async (newData) => {
    await utils.list.cancel();
    const previous = utils.list.getData();
    utils.list.setData(undefined, (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.list.setData(undefined, context.previous);
  },
});
```
When to use: Improve UX for creates/updates

---

## Related Documentation

- [System Overview](system-overview.md) - Complete architecture context
- [API Reference](../reference/api/routers.md) - All 29 routers documented
- [Creating tRPC Router](../guides/development/creating-trpc-router.md) - Step-by-step guide
- [Multi-Tenancy Architecture](multi-tenancy.md) - Data isolation patterns

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial AI-optimized version | Architecture Team |
