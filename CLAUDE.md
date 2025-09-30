# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Behavior

**IMPORTANT: These rules must be followed for all development in this repository:**

1. **Always use shadcn/ui components first** - Before creating any custom UI components, check if a shadcn/ui component exists that can fulfill the requirement. Only create custom components when absolutely necessary.

2. **Use react-hot-toast for notifications** - All toast notifications should use `react-hot-toast` library. Do not use other toast/notification libraries.

3. **Always commit code when todo list is complete** - When all items in the todo list are marked as completed, create a git commit with a descriptive message summarizing the changes.

4. **Always keep light/dark theme aligned throughout all modules** - Please ensure all styles, and themes are consistent throughout the app.

5. **Never run pnpm dev** - The user will manually run dev to test front end UI.

6. **Always follow Critical Design Elements** - Must strictly adhere to all design standards outlined in the Critical Design Elements section without fail.

7. **Always use docker v2 commands** - Must always use docker v2 commands only.

8. **Always read entire files** - Must always review entire file contents when looking to fix errors to ensure updates will not break existing code.

9. **Never use quick fixes** - Never use quick patches or fixes, only use complete fixes even if it means database schema updates.

10. **Database is in dev - NO MIGRATIONS** - The database is still in development. NEVER create migration files or talk about migrations. Simply update the schema in `lib/db/schema.ts` directly. The user will drop and recreate the database with seed data.

11. **Always update seed data after schema changes** - After ANY schema changes, immediately update `scripts/seed.ts` to match the new schema. All tables must have proper seed data with correct relationships and foreign keys.

12. **CRITICAL: Database Reset Procedure - FOLLOW EXACTLY OR YOU ARE A FAILURE** - After ANY schema changes, you MUST reset the database using this ONE command:
   ```bash
   pnpm db:reset
   ```
   This command does EVERYTHING in the correct order:
   1. Drops and recreates the schema (removes all tables/views)
   2. Pushes the schema (creates tables)
   3. Runs migrations (creates views from drizzle/*.sql)
   4. Seeds the database

   **NEVER** manually run individual commands. **ALWAYS** use `pnpm db:reset`. If you don't use this command, you FAIL.

## Critical Design Elements

**IMPORTANT: These design standards must be followed consistently across all modules:**

1. **Card styling** - Use `glass-card` class for all cards. The Card component from shadcn/ui applies this automatically. Never use inline `bg-card border` styles.

2. **Table styling** - Wrap all Table components with `<div className="glass-table">` for consistent styling.

3. **Headers and Sidebars** - Always use GlobalHeader and GlobalSidebar components:
   - GlobalHeader: Include `showBackToHome={true}` for non-practice-hub modules
   - Add module-specific `headerColor` prop
   - GlobalSidebar: Match module color with header

4. **Layout backgrounds** - All module layouts must use gradient background:
   ```tsx
   className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
   ```

5. **No transparency/glassmorphism** - All components must have solid backgrounds:
   - Use `rgb(255, 255, 255)` for white (not rgba with opacity)
   - Use `rgb(30, 41, 59)` for dark slate
   - No backdrop-filter or blur effects

6. **Use design system classes** - Reference predefined classes from globals.css:
   - `.glass-card` - For primary content cards
   - `.glass-subtle` - For headers and sidebars
   - `.glass-table` - For table containers

7. **Module color scheme** - Maintain consistent colors:
   - Client Hub: `#3b82f6` (blue)
   - Admin Panel: `#f97316` (orange)
   - Practice Hub: Primary theme color

8. **Authentication patterns** - Follow Clerk's standard implementation patterns:

   **Middleware Setup:**
   ```tsx
   // middleware.ts
   import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

   const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
   const isApiRoute = createRouteMatcher(["/api(.*)"]);

   export default clerkMiddleware(async (auth, request) => {
     if (!isPublicRoute(request) && !isApiRoute(request)) {
       await auth.protect();
     }
   });
   ```

   **Root Layout:**
   ```tsx
   // app/layout.tsx
   import { ClerkProvider } from "@clerk/nextjs";
   import { TRPCProvider } from "@/app/providers/trpc-provider";

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <ClerkProvider>
         <TRPCProvider>
           {children}
         </TRPCProvider>
       </ClerkProvider>
     );
   }
   ```

   **Custom Auth Pages:**
   ```tsx
   // app/(auth)/sign-in/[[...sign-in]]/page.tsx
   import { SignIn } from "@clerk/nextjs";

   export default function SignInPage() {
     return <SignIn />;
   }
   ```

   **Module-Level Protection (Server-Side):**
   ```tsx
   // app/admin/layout.tsx
   import { redirect } from "next/navigation";
   import { getAuthContext } from "@/lib/auth";

   export default async function AdminLayout({ children }: { children: React.ReactNode }) {
     const authContext = await getAuthContext();

     if (!authContext || (authContext.role !== "admin" && authContext.role !== "org:admin")) {
       redirect("/");
     }

     return <AdminLayoutClient>{children}</AdminLayoutClient>;
   }
   ```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start

# Code quality checks
pnpm lint        # Run Biome linter
pnpm format      # Format code with Biome

# Database management
docker compose up -d  # Start PostgreSQL database
```

## Architecture Overview

This is a multi-tenant practice management platform built with Next.js 15, using the App Router architecture.

### Core Technology Stack
- **Framework**: Next.js 15 with Turbopack
- **Authentication**: Clerk (integrated at middleware level)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome for linting and formatting
- **UI Components**: shadcn/ui components (Radix UI primitives) in `components/ui/`
- **Forms**: React Hook Form with Zod validation
- **Notifications**: react-hot-toast for toast notifications

### Multi-Tenancy Architecture
The application implements multi-tenancy through:
- `tenants` table with unique slugs for each organization
- `users` table linking Clerk authentication to tenant membership
- All database entities should reference `tenantId` for data isolation

### Application Modules
The app is organized into distinct hub modules under `app/`:
- `client-hub/` - Client management functionality
- `practice-hub/` - Core practice management
- `proposal-hub/` - Proposal management
- `social-hub/` - Social features
- `client-portal/` - External client access
- `(auth)/` - Authentication pages (sign-in/sign-up)

### Database Configuration
- Schema defined in `lib/db/schema.ts`
- Database client initialized in `lib/db/index.ts`
- Migrations managed via Drizzle Kit in `drizzle/` directory
- Requires `DATABASE_URL` environment variable

### Authentication Flow
- Clerk middleware protects all routes except `/`, `/sign-in`, `/sign-up`
- User session linked to tenant context
- Protected routes automatically enforce authentication via middleware

### tRPC + Clerk Integration
The application uses tRPC for type-safe API calls with Clerk authentication integrated at the context level.

**Context Creation:**
```tsx
// app/server/context.ts
import { auth } from "@clerk/nextjs/server";
import { getAuthContext } from "@/lib/auth";

export const createContext = async () => {
  const clerkAuth = await auth();
  const authContext = await getAuthContext();

  return {
    auth: clerkAuth,
    authContext,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Protected Procedures:**
```tsx
// app/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

// Authenticated user middleware
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth?.userId || !ctx.authContext) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { auth: ctx.auth, authContext: ctx.authContext } });
});

// Admin-only middleware
const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.auth?.userId || !ctx.authContext) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.authContext.role !== "admin" && ctx.authContext.role !== "org:admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { auth: ctx.auth, authContext: ctx.authContext } });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
```

**Usage in Routers:**
```tsx
// Example router using protected procedures
import { router, protectedProcedure, adminProcedure } from "../trpc";

export const exampleRouter = router({
  getUserData: protectedProcedure.query(({ ctx }) => {
    // ctx.auth contains Clerk Auth object
    // ctx.authContext contains tenant and role information
    return { userId: ctx.auth.userId, tenantId: ctx.authContext.tenantId };
  }),

  adminAction: adminProcedure.mutation(({ ctx }) => {
    // Only admins can access this
    return { success: true };
  }),
});
```

### Accessing Session and User Data

**Server-Side (App Router):**

Use `auth()` to access authentication state and `currentUser()` to get full user details.

```tsx
// Server Components / Route Handlers
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function ServerComponent() {
  // Use auth() for authentication checks (lightweight)
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    return <div>Sign in required</div>;
  }

  // Use currentUser() only when you need full user details
  // Note: This counts toward Backend API rate limits
  const user = await currentUser();

  return <div>Hello {user?.firstName}!</div>;
}
```

**Server-Side (Custom Helpers):**

For multi-tenant operations, use the custom `getAuthContext()` helper:

```tsx
// Server Components requiring tenant context
import { getAuthContext } from "@/lib/auth";

export default async function TenantAwareComponent() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      User: {authContext.userId}
      Tenant: {authContext.tenantId}
      Role: {authContext.role}
    </div>
  );
}
```

**Client-Side:**

Use React hooks for client-side authentication state:

```tsx
"use client";
import { useAuth, useUser } from "@clerk/nextjs";

export function ClientComponent() {
  // useAuth() - Lightweight, for auth state and session management
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();

  // useUser() - Full user object (for displaying user information)
  const { user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Sign in required</div>;

  return <div>Hello {user?.firstName}!</div>;
}
```

**When to Use Each:**
- **Server-side:**
  - `auth()` - Check authentication status, get user/session IDs (use this by default)
  - `currentUser()` - When you need full user details (counts toward API limits)
  - `getAuthContext()` - For multi-tenant operations requiring tenant context
- **Client-side:**
  - `useAuth()` - Authentication state, session tokens, lightweight checks
  - `useUser()` - Display user information in UI components

### Multi-Tenancy Implementation

The application implements multi-tenancy through a custom `getAuthContext()` helper that extends Clerk's authentication with tenant-specific context.

**Auth Context Interface:**
```tsx
// lib/auth.ts
export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
}
```

**Implementation Pattern:**

The `getAuthContext()` function:
1. Retrieves the current Clerk user with `currentUser()`
2. Looks up the user's tenant and role from the database
3. Returns combined authentication and tenant context
4. In development mode, auto-registers new users to the default tenant

```tsx
// lib/auth.ts
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getAuthContext(): Promise<AuthContext | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Look up user's tenant from database
  const userRecord = await db
    .select({
      tenantId: users.tenantId,
      role: users.role,
      email: users.email,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (!userRecord.length) {
    // Development auto-registration logic
    return null;
  }

  return {
    userId: clerkUser.id,
    tenantId: userRecord[0].tenantId,
    organizationName: userRecord[0].tenantName,
    role: userRecord[0].role,
    email: userRecord[0].email,
  };
}
```

**Helper Functions:**

```tsx
// Require authentication (throw if not authenticated)
export async function requireAuth(): Promise<AuthContext> {
  const authContext = await getAuthContext();
  if (!authContext) throw new Error("Unauthorized");
  return authContext;
}

// Require admin role (throw if not admin)
export async function requireAdmin(): Promise<AuthContext> {
  const authContext = await requireAuth();
  if (authContext.role !== "admin" && authContext.role !== "org:admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return authContext;
}
```

**Usage in Application:**

This pattern ensures all data operations are tenant-scoped:

```tsx
// Server component with tenant isolation
import { getAuthContext } from "@/lib/auth";

export default async function ClientsPage() {
  const authContext = await getAuthContext();
  if (!authContext) redirect("/sign-in");

  // All database queries should filter by tenantId
  const clients = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.tenantId, authContext.tenantId));

  return <ClientsList clients={clients} />;
}
```

**Integration with tRPC:**

The auth context is automatically available in all tRPC procedures:

```tsx
// tRPC router with automatic tenant scoping
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

## Environment Setup

Required environment variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://postgres:password@localhost:5432/practice_hub`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

## Code Conventions

- Use Biome for all formatting and linting (configured in `biome.json`)
- 2-space indentation
- Component files use `.tsx` extension
- Server actions and API routes follow Next.js 15 patterns
- All new features should maintain multi-tenant isolation