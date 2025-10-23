# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Behavior

**IMPORTANT: These rules must be followed for all development in this repository:**

1. **Always use shadcn/ui components first** - Before creating any custom UI components, check if a shadcn/ui component exists that can fulfill the requirement. Only create custom components when absolutely necessary.

2. **Use react-hot-toast for notifications** - All toast notifications should use `react-hot-toast` library. Do not use other toast/notification libraries.

3. **Always commit code when todo list is complete** - When all items in the todo list are marked as completed, create a git commit with a descriptive message summarizing the changes.

4. **Always keep light/dark theme aligned throughout all modules** - Please ensure all styles, and themes are consistent throughout the app.

5. **Limited pnpm dev usage** - The user will manually run dev to test front end UI. Exception: Dev server may be run for testing purposes ONLY when explicitly authorized, and must be stopped immediately after testing completes.

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

13. **FORBIDDEN: Never use killall commands** - **NEVER** run `killall`, `killall -9`, or any variant that could kill system processes. These commands are EXTREMELY DANGEROUS and can:
   - Kill VS Code and lose unsaved work
   - Terminate critical system processes
   - Destroy active development sessions

   **FORBIDDEN COMMANDS:**
   - `killall node` / `killall -9 node` - Will kill VS Code and all Node processes
   - `killall pnpm` / `killall -9 pnpm` - Will kill package manager processes
   - `killall -9` with ANY process name

   **SAFE ALTERNATIVES:**
   - Use `ps aux | grep <process>` to find specific PIDs
   - Use `kill <specific-pid>` for targeted termination
   - Use `pkill -f "specific-pattern"` with VERY specific patterns
   - For Playwright: `pkill -f "playwright test"` (specific pattern only)

13. **ALWAYS use Practice Hub Skills for their intended purposes** - The following skills are installed in `.claude/skills/` and must be used:
   - **practice-hub-testing**: Generate router tests, validate multi-tenant isolation, check test coverage
   - **practice-hub-debugging**: Find/remove console.log statements, track TODOs, code quality checks
   - **practice-hub-database-ops**: Validate schema, check seed consistency, safe database reset
   - **artifacts-builder**: Build UI components following Practice Hub design system
   - **brand-guidelines**: Enforce Practice Hub design standards and conventions
   - **webapp-testing**: Test local web applications with Playwright
   - **skill-creator**: Create new skills interactively

   **Usage:** Invoke skills using the Skill tool, NOT by running scripts directly. The skills contain automation scripts that Claude will use when the skill is invoked. Always use these skills for testing, debugging, and database operations tasks.

14. **Error Tracking & Logging Policy** - Production code must use Sentry for error tracking:
   - **NEVER use console.log/console.warn/console.debug in production code** - These are not tracked and leak to logs
   - **Replace console.error with Sentry.captureException** in all UI components and tRPC routers:
     ```typescript
     import * as Sentry from "@sentry/nextjs";

     try {
       await operation();
     } catch (error) {
       Sentry.captureException(error, {
         tags: { operation: "operation_name" },
         extra: { contextData: "values" },
       });
       toast.error("User-friendly error message");
     }
     ```
   - **Exceptions where console.error is acceptable:**
     - Webhook handlers (external integrations need visible debugging)
     - API route handlers for webhook signature verification failures
     - Development-only code paths (guarded by `process.env.NODE_ENV === 'development'`)
   - **Add ESLint rule** to prevent console statements:
     ```json
     // .eslintrc.json (future)
     "rules": {
       "no-console": ["error", { "allow": [] }]
     }
     ```

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

8. **Authentication patterns** - Follow Better Auth's standard implementation patterns (see detailed documentation in `/docs/MICROSOFT_OAUTH_SETUP.md`):

   **Middleware Setup:**
   ```tsx
   // middleware.ts
   import { type NextRequest, NextResponse } from "next/server";
   import { auth } from "@/lib/auth";

   const publicPaths = ["/", "/sign-in", "/sign-up"];

   export default async function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;

     if (publicPaths.some((path) => pathname === path)) {
       return NextResponse.next();
     }

     if (pathname.startsWith("/api/")) {
       return NextResponse.next();
     }

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
     matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
   };
   ```

   **Auth API Route:**
   ```tsx
   // app/api/auth/[...all]/route.ts
   import { toNextJsHandler } from "better-auth/next-js";
   import { auth } from "@/lib/auth";

   export const runtime = "nodejs";

   export const { POST, GET } = toNextJsHandler(auth);
   ```

   **Custom Auth Pages:**
   ```tsx
   // app/(auth)/sign-in/page.tsx
   "use client";
   import { signIn } from "@/lib/auth-client";

   export default function SignInPage() {
     const onSubmit = async (data: SignInForm) => {
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

   **Module-Level Protection (Server-Side):**
   ```tsx
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

9. **Checklist Components** - All checklist-type UI components must follow this design language:

   **Completed items:**
   ```tsx
   <div className="bg-muted/50 border-green-200 dark:border-green-900 border rounded-lg p-4">
     <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
     <span className="line-through text-muted-foreground">Task name</span>
   </div>
   ```

   **Uncompleted items:**
   ```tsx
   <div className="border-border border rounded-lg p-4">
     <Circle className="h-6 w-6 text-muted-foreground hover:text-primary flex-shrink-0 transition-colors" />
     <span>Task name</span>
   </div>
   ```

   **Required styling:**
   - Completed: Green circle (`CheckCircle2` with `text-green-600`), green border (`border-green-200 dark:border-green-900`), muted background (`bg-muted/50`)
   - Uncompleted: Empty circle (`Circle` with `text-muted-foreground`), standard border
   - Icons: Always `h-6 w-6 flex-shrink-0` for consistency
   - Interactive: Clickable to toggle state, with hover effects

   **Examples:** Onboarding checklists, proposal calculator service selection, task lists

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

# Object Storage (MinIO for local development)
docker compose up -d minio           # Start MinIO server
./scripts/setup-minio.sh             # Initialize bucket (first time only)
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
# S3 API Endpoint: http://localhost:9000
```

## MinIO Object Storage (Local Development)

MinIO provides S3-compatible object storage for local development. It allows you to test PDF generation, file uploads, and storage operations without connecting to Hetzner S3.

### Setup

1. **Start MinIO:**
   ```bash
   docker compose up -d minio
   ```

2. **Initialize Bucket (first time only):**
   ```bash
   ./scripts/setup-minio.sh
   ```
   This creates the `practice-hub-proposals` bucket and sets public read permissions.

3. **Access MinIO Console:**
   - URL: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

### Configuration

MinIO is configured via environment variables in `.env.local`:

```bash
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="us-east-1"
```

### Testing PDF Generation

1. Create a proposal in the calculator
2. Click "Generate PDF" on the proposal detail page
3. View the generated PDF in MinIO Console → Buckets → practice-hub-proposals

### Production Migration (Hetzner S3)

For production deployment on Coolify/Hetzner, use `.env.production.example` as a template:

```bash
# Hetzner S3 Object Storage
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="your-hetzner-access-key"
S3_SECRET_ACCESS_KEY="your-hetzner-secret-key"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="eu-central"
```

**No code changes required** - the same S3 client works with both MinIO and Hetzner S3. Just update the environment variables.

### Troubleshooting

**Bucket not found:**
- Run `./scripts/setup-minio.sh` to create the bucket
- Verify bucket exists in MinIO console

**Connection refused:**
- Ensure MinIO is running: `docker ps | grep minio`
- Check port 9000 is not in use: `lsof -i :9000`

**Permission denied:**
- Bucket policy may need updating
- Run setup script again to reset permissions

## DocuSeal E-Signature (Local Development)

DocuSeal provides self-hosted electronic signature functionality for proposal signing. It's integrated via Docker Compose and uses the same PostgreSQL database.

### Setup

1. **Generate Required Secrets FIRST:**
   ```bash
   # Generate secret key for DocuSeal container
   openssl rand -base64 32  # Add to .env.local as DOCUSEAL_SECRET_KEY

   # Generate webhook secret for signature verification
   openssl rand -base64 32  # Add to .env.local as DOCUSEAL_WEBHOOK_SECRET
   ```

   **⚠️ IMPORTANT:** Add both to `.env.local` BEFORE starting DocuSeal. The docker-compose.yml file has NO defaults for security reasons.

2. **Start DocuSeal:**
   ```bash
   docker compose up -d docuseal
   ```

   **Health Check:** Wait ~30 seconds for healthcheck to pass:
   ```bash
   docker ps  # Status should show "healthy" for practice-hub-docuseal
   ```

3. **Access DocuSeal Admin:**
   - URL: http://localhost:3030
   - Create admin account on first visit
   - Navigate to Settings → API Keys → Generate New Key
   - Copy the API key to `.env.local` as `DOCUSEAL_API_KEY`

4. **Configure Webhooks:**
   - In DocuSeal Admin: Settings → Webhooks
   - Webhook URL: `http://host.docker.internal:3000/api/webhooks/docuseal`
   - Secret: Use the same value as `DOCUSEAL_WEBHOOK_SECRET` from step 1
   - Events: Select `submission.completed`

### Configuration

DocuSeal is configured via environment variables in `.env.local`:

```bash
# DocuSeal E-Signature
DOCUSEAL_HOST="http://localhost:3030"
DOCUSEAL_API_KEY="<from-docuseal-admin-ui>"
DOCUSEAL_SECRET_KEY="<generate-with-openssl>"
DOCUSEAL_WEBHOOK_SECRET="<generate-with-openssl>"
```

### Testing Proposal Signing

1. Create a proposal in the calculator
2. Navigate to Proposal Hub → Proposals → Select proposal
3. Click "Send for Signature"
4. Enter signer email and name
5. Check email for signing link (or use direct link from proposal page)
6. Sign the document
7. Webhook automatically updates proposal status to "signed"

### Production Migration

For production deployment, use external DocuSeal instance or cloud-hosted solution:

```bash
# Production DocuSeal Configuration
DOCUSEAL_HOST="https://docuseal.yourdomain.com"
DOCUSEAL_API_KEY="<production-api-key>"
DOCUSEAL_SECRET_KEY="<production-secret>"
DOCUSEAL_WEBHOOK_SECRET="<production-webhook-secret>"
```

**Important:** Webhook URL must be publicly accessible in production:
- Development: `http://host.docker.internal:3000/api/webhooks/docuseal`
- Production: `https://app.yourdomain.com/api/webhooks/docuseal`

### Troubleshooting

**DocuSeal not starting:**
- Check PostgreSQL is running: `docker ps | grep postgres`
- View logs: `docker logs practice-hub-docuseal`
- Verify DATABASE_URL is correct in docker-compose.yml

**Webhook not working:**
- Verify DOCUSEAL_WEBHOOK_SECRET matches in both app and DocuSeal
- Check webhook URL is accessible from DocuSeal container
- View webhook logs in DocuSeal Admin → Settings → Webhooks → Recent Deliveries
- Check app logs for signature verification errors

**API key not working:**
- Regenerate API key in DocuSeal Admin
- Ensure DOCUSEAL_API_KEY in `.env.local` matches
- Restart Next.js dev server after changing env vars

**Signature not completing:**
- Check proposal has `docusealSubmissionId` in database
- Verify signer email matches submission
- Check DocuSeal submission status in admin UI

## Architecture Overview

This is a multi-tenant practice management platform built with Next.js 15, using the App Router architecture.

### Core Technology Stack
- **Framework**: Next.js 15 with Turbopack
- **Authentication**: Better Auth with email/password and bcrypt hashing
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome for linting and formatting
- **UI Components**: shadcn/ui components (Radix UI primitives) in `components/ui/`
- **Forms**: React Hook Form with Zod validation
- **Notifications**: react-hot-toast for toast notifications

### Multi-Tenancy Architecture with Dual Isolation

The application implements **two levels of data isolation**:

#### Level 1: Tenant Isolation (Accountancy Firm Level)
- **Tenant** = Accountancy firm (e.g., "Acme Accounting Ltd")
- **Purpose**: Isolate data between different accountancy firms using the platform
- **Implementation**: All tables (except system tables) must have `tenantId` field
- **Access**: Staff users (accountants, admins) have access to all data within their tenant

**Structure:**
```
Tenant (Accountancy Firm)
├── Users (Staff members - tenantId only)
├── Clients (Customer businesses - tenantId only)
├── Tasks, Invoices, Proposals, etc. (tenantId only)
```

#### Level 2: Client Isolation (Customer Business Level)
- **Client** = Customer business using the client portal (e.g., "ABC Manufacturing Ltd")
- **Purpose**: Isolate data between different customer businesses within the same accountancy firm
- **Implementation**: Client portal tables must have BOTH `tenantId` AND `clientId`
- **Access**: Client portal users only see data for their specific client company

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

#### Database Schema Requirements

**Standard Tables (Staff Access):**
```typescript
export const standardTable = pgTable("table_name", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  // ... other fields
});
```

**Client Portal Tables (Dual Isolation):**
```typescript
export const clientPortalTable = pgTable("client_portal_table", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  clientId: text("client_id").references(() => clients.id).notNull(),   // REQUIRED
  // ... other fields
});
```

**System Tables (No Isolation Needed):**
- `tenants` - The tenant table itself
- `session`, `account`, `verification` - Better Auth staff authentication
- `drizzle_migrations` - Drizzle system table

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
- Better Auth middleware protects all routes except `/`, `/sign-in`, `/sign-up`
- Middleware runs in Node.js runtime (required for Better Auth)
- User session linked to tenant context
- Protected routes automatically enforce authentication via middleware

### tRPC + Better Auth Integration
The application uses tRPC for type-safe API calls with Better Auth session integrated at the context level.

**Context Creation:**
```tsx
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

**Protected Procedures:**
```tsx
// app/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Authenticated user middleware
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

// Admin-only middleware
const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.authContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in organization",
    });
  }

  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      authContext: ctx.authContext,
    },
  });
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
    // ctx.session contains Better Auth session
    // ctx.authContext contains tenant and role information
    return { userId: ctx.session.user.id, tenantId: ctx.authContext.tenantId };
  }),

  adminAction: adminProcedure.mutation(({ ctx }) => {
    // Only admins can access this
    return { success: true };
  }),
});
```

### Accessing Session and User Data

**Server-Side (App Router):**

Use `auth.api.getSession()` to access authentication state and user details.

```tsx
// Server Components / Route Handlers
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Sign in required</div>;
  }

  return <div>Hello {session.user.name}!</div>;
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
      Email: {authContext.email}
    </div>
  );
}
```

**Client-Side:**

Use Better Auth React hooks for client-side authentication state:

```tsx
"use client";
import { useSession } from "@/lib/auth-client";

export function ClientComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Sign in required</div>;

  return <div>Hello {session.user.name}!</div>;
}
```

**When to Use Each:**
- **Server-side:**
  - `auth.api.getSession()` - Check authentication status and get session details
  - `getAuthContext()` - For multi-tenant operations requiring tenant context
- **Client-side:**
  - `useSession()` - Access session state and user information in components
  - `signIn()`, `signOut()`, `signUp()` - Authentication actions from `@/lib/auth-client`

### Multi-Tenancy Implementation

The application implements multi-tenancy through a custom `getAuthContext()` helper that extends Better Auth's session with tenant-specific context.

**Auth Context Interface:**
```tsx
// lib/auth.ts
export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}
```

**Implementation Pattern:**

The `getAuthContext()` function:
1. Retrieves the current Better Auth session with `auth.api.getSession()`
2. Looks up the user's tenant and role from the database
3. Returns combined authentication and tenant context

```tsx
// lib/auth.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
  if (authContext.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return authContext;
}
```

#### 2. Client Portal Authentication (Client-Level Access)
Uses `getClientPortalAuthContext()` for dual isolation with both tenant and client scoping.

```tsx
// lib/auth.ts
export interface ClientPortalAuthContext {
  userId: string;
  clientId: string;      // REQUIRED: Specific client company
  tenantId: string;      // REQUIRED: Accountancy firm
  email: string;
  // ... other fields
}
```

**Usage in Application:**

**Staff Access (Tenant-Level):**
```tsx
// Server component with tenant isolation
import { getAuthContext } from "@/lib/auth";

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

**Client Portal Access (Dual Isolation):**
```tsx
// Server component with client isolation
import { getClientPortalAuthContext } from "@/lib/auth";

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
- `BETTER_AUTH_SECRET` - Better Auth secret key (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Better Auth server URL (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` - Better Auth client URL (e.g., `http://localhost:3000`)

## Code Conventions

- Use Biome for all formatting and linting (configured in `biome.json`)
- 2-space indentation
- Component files use `.tsx` extension
- Server actions and API routes follow Next.js 15 patterns
- All new features should maintain multi-tenant isolation
