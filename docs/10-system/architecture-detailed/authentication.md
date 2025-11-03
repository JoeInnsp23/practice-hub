---
title: "Authentication & Authorization Architecture"
category: "architecture"
subcategory: "security"
purpose: "Understand Practice Hub's dual Better Auth system for staff and client portal"
audience: ["ai-agent", "developer"]
prerequisites: ["system-overview.md", "multi-tenancy.md"]
related: ["../guides/integrations/microsoft-oauth.md", "../reference/security/csrf.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "architecture-team"
tags: ["authentication", "authorization", "better-auth", "security", "oauth"]
---

# Authentication & Authorization Architecture

**Quick Summary**: Practice Hub uses two separate Better Auth instances: one for staff (with Microsoft OAuth + email/password) and one for client portal (email/password only), enabling dual-level data isolation.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- Dual Better Auth system architecture
- Staff authentication (email/password + Microsoft OAuth)
- Client portal authentication (email/password only)
- Authorization levels and role-based access
- Middleware-based route protection
- Session management patterns

---

## Prerequisites

Before reading this document, you should:
- [x] Understand [Multi-Tenancy Architecture](multi-tenancy.md)
- [x] Understand [System Overview](system-overview.md)
- [x] Understand Better Auth basics

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core patterns:

**Dual Auth System**:
```
Staff Auth (lib/auth.ts)
├── API Route: /api/auth/[...all]
├── Methods: Email/Password + Microsoft OAuth
├── Context: { userId, tenantId, role }
└── Middleware: All routes except /portal

Client Portal Auth (lib/client-portal-auth.ts)
├── API Route: /api/client-portal-auth/[...all]
├── Methods: Email/Password only
├── Context: { userId, tenantId, clientId }
└── Middleware: /portal routes only
```

**Getting Auth Context**:
```typescript
// Staff
const authContext = await getAuthContext();
// { userId, tenantId, role, email, ... }

// Client Portal
const authContext = await getClientPortalAuthContext();
// { userId, tenantId, clientId, email, ... }
```

**Protecting Routes**:
```typescript
// middleware.ts automatically protects all routes
// Redirects to /sign-in (staff) or /portal/sign-in (client portal)
```

---

## Detailed Guide

### Why Dual Auth Systems?

Practice Hub requires two separate authentication systems due to the dual-level data isolation model:

**Staff Authentication**:
- Needs: Single-level isolation (`tenantId`)
- Access: All clients within their accountancy firm
- Methods: Email/password + Microsoft OAuth (work accounts)
- User Table: `users`

**Client Portal Authentication**:
- Needs: Dual-level isolation (`tenantId` + `clientId`)
- Access: Only their specific client data
- Methods: Email/password only (no OAuth)
- User Table: `client_portal_users`

**Alternative Considered**: Single Better Auth instance with custom logic

**Why Rejected**: Better Auth doesn't natively support dual-isolation, would require extensive customization

---

### Staff Authentication (Better Auth)

#### Configuration

**File**: `lib/auth.ts`

**Key Features**:
- Email/password authentication with bcrypt (10 rounds)
- Microsoft OAuth (personal + work/school accounts)
- Database-backed sessions (7-day expiration)
- CSRF protection
- HTTP-only cookies

**Implementation**:
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: Enable in production
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common", // Personal + work accounts
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
```

#### API Route

**File**: `app/api/auth/[...all]/route.ts`

```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const runtime = "nodejs"; // Required for Better Auth

export const { POST, GET } = toNextJsHandler(auth);
```

**Endpoints Provided**:
- `POST /api/auth/sign-in` - Email/password sign-in
- `POST /api/auth/sign-up` - User registration
- `GET /api/auth/session` - Get current session
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/oauth/microsoft` - Microsoft OAuth flow
- `GET /api/auth/callback/microsoft` - OAuth callback

---

#### Client-Side Hooks

**File**: `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Usage**:
```typescript
"use client";
import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Hello {session.user.name}!</div>;
}
```

---

#### Auth Context (Multi-Tenant)

**File**: `lib/auth.ts`

```typescript
export interface AuthContext {
  userId: string;
  tenantId: string;         // ALWAYS populated
  organizationName?: string;
  role: string;             // admin, member
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session || !session.user) {
    return null;
  }

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

**Helper Functions**:
```typescript
// Require authentication (throw if not authenticated)
export async function requireAuth(): Promise<AuthContext> {
  const authContext = await getAuthContext();
  if (!authContext) throw new Error("Unauthorized");
  return authContext;
}

// Require admin role (throw if not admin)
export async function requireAdmin(): Promise<AuthContext> {
  const authContext = await requireAuth();
  if (authContext.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return authContext;
}
```

---

### Client Portal Authentication (Better Auth - Separate Instance)

#### Configuration

**File**: `lib/client-portal-auth.ts`

**Key Features**:
- Email/password authentication only (no OAuth)
- Separate user table (`client_portal_users`)
- Dual isolation context (`tenantId` + `clientId`)
- Database-backed sessions
- Same security features as staff auth

**Implementation**:
```typescript
// lib/client-portal-auth.ts
import { betterAuth } from "better-auth";
import { prisma } from "./db";

export const clientPortalAuth = betterAuth({
  database: prisma,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
```

#### API Route

**File**: `app/(client-portal)/api/client-portal-auth/[...all]/route.ts`

```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { clientPortalAuth } from "@/lib/client-portal-auth";

export const runtime = "nodejs";

export const { POST, GET } = toNextJsHandler(clientPortalAuth);
```

**Endpoints Provided**:
- `POST /api/client-portal-auth/sign-in`
- `POST /api/client-portal-auth/sign-up`
- `GET /api/client-portal-auth/session`
- `POST /api/client-portal-auth/sign-out`

---

#### Client Portal Auth Context (Dual Isolation)

**File**: `lib/client-portal-auth.ts`

```typescript
export interface ClientPortalAuthContext {
  portalUserId: string;   // Portal user ID
  tenantId: string;       // REQUIRED - Accountancy firm
  email: string;
  firstName: string | null;
  lastName: string | null;
  clientAccess: Array<{   // Multi-client support
    clientId: string;
    clientName: string;
    role: string;
    isActive: boolean;
  }>;
  currentClientId?: string; // Selected client for multi-client users
}

export async function getClientPortalAuthContext(): Promise<ClientPortalAuthContext | null> {
  const session = await clientPortalAuth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session || !session.user) {
    return null;
  }

  // Look up user's tenant from client_portal_users
  // Then query client_portal_access for all accessible clients
  const userRecord = await db
    .select({
      id: clientPortalUsers.id,
      tenantId: clientPortalUsers.tenantId,
      clientId: clientPortalUsers.clientId,
      email: clientPortalUsers.email,
      firstName: clientPortalUsers.firstName,
      lastName: clientPortalUsers.lastName,
    })
    .from(clientPortalUsers)
    .where(eq(clientPortalUsers.id, session.user.id))
    .limit(1);

  if (userRecord.length === 0) {
    return null;
  }

  const { id, tenantId, clientId, email, firstName, lastName } = userRecord[0];

  return {
    userId: id,
    tenantId,
    clientId,
    email,
    firstName,
    lastName,
  };
}
```

**⚠️ CRITICAL ISSUE**: `client_portal_users` table missing `tenantId` + `clientId` columns (see [Technical Debt](../development/technical-debt.md))

---

### Middleware (Route Protection)

**File**: `middleware.ts`

**Purpose**: Automatically protect all routes, redirect unauthenticated users to sign-in

**Implementation**:
```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientPortalAuth } from "@/lib/client-portal-auth";

const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/portal/sign-in",
  "/portal/sign-up",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Allow API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Client portal routes
  if (pathname.startsWith("/portal")) {
    const session = await clientPortalAuth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      const signInUrl = new URL("/portal/sign-in", request.url);
      signInUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  // Staff routes (default)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs", // Required for Better Auth
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
```

**Protected Paths**:
- All routes except public paths redirect to `/sign-in`
- Client portal routes (`/portal/*`) redirect to `/portal/sign-in`
- API routes allowed (auth happens in tRPC context)

---

### Authorization Levels

#### Staff Roles

**Roles**:
- `admin` - Full system access
- `member` - Access to practice hub, clients, tasks (tenant-scoped)

**Role-Based Access (tRPC)**:
```typescript
// app/server/trpc.ts
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

**Usage**:
```typescript
export const usersRouter = router({
  list: adminProcedure.query(({ ctx }) => {
    // Only admins can access this
    return db.select().from(users).where(eq(users.tenantId, ctx.authContext.tenantId));
  }),
});
```

**Role-Based Access (Server Components)**:
```typescript
// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

---

#### Client Portal Roles

**Current State**: No roles (all client portal users have same access level)

**Future Enhancement**: Add client admin vs. client viewer roles

**Access Pattern**: All client portal users can access their client's data only (dual isolation enforced by queries)

---

### tRPC + Better Auth Integration

**Context Creation**:
```typescript
// app/server/context.ts
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

**Protected Procedures**:
```typescript
// app/server/trpc.ts
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

**Usage**:
```typescript
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    // ctx.session contains Better Auth session
    // ctx.authContext contains tenant and role information
    return db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),
});
```

---

## Examples

### Example 1: Custom Sign-In Page (Staff)

```typescript
// app/(auth)/sign-in/page.tsx
"use client";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function SignInPage() {
  const router = useRouter();

  const onSubmit = async (data: { email: string; password: string }) => {
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    router.push("/");
  };

  return <SignInForm onSubmit={onSubmit} />;
}
```

---

### Example 2: Microsoft OAuth Setup Page

```typescript
// app/(auth)/oauth-setup/page.tsx
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OAuthSetupPage() {
  const authContext = await getAuthContext();

  // User signed in via OAuth but not yet linked to tenant
  if (!authContext) {
    // Show tenant selection UI
    return <TenantSelectionForm />;
  }

  // User already linked, redirect to dashboard
  redirect("/");
}
```

---

### Example 3: Protected Server Component (Module-Level)

```typescript
// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.NodeNode }) {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

---

### Example 4: Client Portal Protected Page

```typescript
// app/client-portal/dashboard/page.tsx
import { getClientPortalAuthContext } from "@/lib/client-portal-auth";
import { redirect } from "next/navigation";

export default async function ClientDashboard() {
  const authContext = await getClientPortalAuthContext();
  if (!authContext) redirect("/portal/sign-in");

  // Access dual-scoped data
  const client = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, authContext.tenantId),
        eq(clients.id, authContext.clientId)
      )
    )
    .limit(1);

  return <DashboardUI client={client[0]} />;
}
```

---

## Common Patterns

**Pattern 1: Server-Side Session Check**
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/sign-in");
```
When to use: Check authentication status in server components

**Pattern 2: Client-Side Session Hook**
```typescript
const { data: session, isPending } = useSession();
```
When to use: Access session in client components

**Pattern 3: Get Full Auth Context**
```typescript
const authContext = await getAuthContext();
if (!authContext) redirect("/sign-in");
```
When to use: Need tenant info, role, or multi-tenant operations

**Pattern 4: Admin-Only Route**
```typescript
const authContext = await getAuthContext();
if (!authContext || authContext.role !== "admin") redirect("/");
```
When to use: Admin panel routes, system settings

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Unauthorized" error | No session found | Ensure user is signed in, check middleware config |
| "User not found in organization" | User record missing from `users` table | Ensure user was created with proper `tenantId` |
| Redirect loop | Middleware protecting sign-in page | Add `/sign-in` to `publicPaths` array |
| Session not persisting | Cookies not being set | Check `useSecureCookies` setting, ensure HTTPS in production |
| OAuth callback fails | Incorrect redirect URI | Update Microsoft Azure app registration with correct callback URL |
| Client portal users can't sign in | Using wrong auth endpoint | Ensure using `/api/client-portal-auth/sign-in` |

---

## Related Documentation

- [Multi-Tenancy Architecture](multi-tenancy.md) - Understand dual isolation model
- [Microsoft OAuth Setup](../guides/integrations/microsoft-oauth.md) - Complete OAuth configuration guide
- [CSRF Protection](../reference/security/csrf.md) - CSRF security details
- [Technical Debt](../development/technical-debt.md) - Known auth-related issues

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial AI-optimized version | Architecture Team |

---

## Feedback

Found an issue? Update this doc directly or create an issue in the project repository.
