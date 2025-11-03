# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Behavior

**IMPORTANT: These rules must be followed for all development in this repository:**

1. **Use shared UI components first** - Create custom components only when a shared component cannot meet the need.

2. **Use react-hot-toast for notifications** - All toast notifications should use `react-hot-toast` library. Do not use other toast/notification libraries.

3. **Commit small and often** - Commit when the current TODO list is complete; otherwise after any logical change, touching 2+ files, >30 lines changed, adding/removing a file, when lint/tests pass, or every 15 minutes. Use conventional commits `type(scope): summary` with bullets of key changes. For DB schema/seed updates, commit immediately after updating schema and seeds (after `pnpm db:reset`).

4. **Always keep light/dark theme aligned throughout all modules** - Please ensure all styles, and themes are consistent throughout the app.

5. **Dev server policy** - Never run `pnpm dev`. The dev server may only be run with explicit user permission.

6. **Always follow Critical Design Elements** - Must strictly adhere to all design standards outlined in the Critical Design Elements section without fail.

7. **Always use docker v2 commands** - Must always use docker v2 commands only.

8. **Read entire files before editing** - Review the whole file before making changes. For very large files (>800 lines), read imports, related functions/classes, and surrounding context before edits.

9. **No quick fixes** - Deliver full implementations: no placeholders, TODOs, or temporary workarounds. Include schema/seed updates and add/adjust tests as needed.

10. **Development-mode DB policy** - Update the database by editing `lib/db/schema.ts` (no migration files). When changing the schema, update `scripts/seed.ts` and other related files (types/validation/views/tests) in unison.

11. **Seeds after schema changes** - Immediately update `scripts/seed.ts` to match the new schema (FKs, constraints, tenant/client isolation) and adjust related types/validation/views/tests as needed. Validate by running `pnpm db:reset`.

12. **Database reset** - Use a single command to reset the database:
   ```bash
   pnpm db:reset
   ```
   Do not run individual DB scripts (push/generate/migrate/seed) separately.

13. **Process safety** - Do not use `killall` (e.g., `killall node`/`killall pnpm`). Use `ps`/`grep` to find PIDs and `kill <pid>`. Use `pkill -f` only with an exact, narrowly-scoped pattern and only when absolutely necessary.

14. **ALWAYS use Practice Hub Skills for their intended purposes** - The following skills are installed in `.claude/skills/` and must be used:
   - **practice-hub-testing**: Generate router tests, validate multi-tenant isolation, check test coverage
   - **practice-hub-debugging**: Find/remove console.log statements, track TODOs, code quality checks
   - **practice-hub-database-ops**: Validate schema, check seed consistency, safe database reset
   - **artifacts-builder**: Build UI components following Practice Hub design system
   - **brand-guidelines**: Enforce Practice Hub design standards and conventions
   - **webapp-testing**: Test local web applications with Playwright
   - **skill-creator**: Create new skills interactively

   **Usage:** Invoke skills using the Skill tool, NOT by running scripts directly. The skills contain automation scripts that Claude will use when the skill is invoked. Always use these skills for testing, debugging, and database operations tasks.

15. **Error Tracking & Logging Policy** - Production code must use Sentry for error tracking (see `/docs/guides/integrations/sentry.md` for complete setup guide):
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
  - **Biome enforcement**:
    ```json
    {
      "$schema": "https://biomejs.dev/schemas/1.7.0/schema.json",
      "linter": { "rules": { "style": { "noConsole": "error" } } }
    }
    ```

16. **SQL Safety Policy** - All database queries must follow SQL safety best practices (see `/docs/guides/sql-safety-checklist.md` for complete checklist):
   - **NEVER use `= ANY(${array})` pattern** - Causes PostgreSQL syntax errors due to parameter expansion
   - **ALWAYS use `inArray(column, array)` for array operations** - Drizzle ORM helper prevents SQL bugs:
     ```typescript
     import { inArray } from "drizzle-orm";

     // ✅ CORRECT
     .where(inArray(table.id, ids))

     // ❌ WRONG - Will fail at runtime
     .where(sql`${table.id} = ANY(${ids})`)
     ```
  - **Empty arrays** - If an array is empty, short-circuit in code (e.g., return an empty result) to avoid invalid SQL.
   - **Exception: ARRAY[] syntax is acceptable** - If ANY() is required, use explicit PostgreSQL ARRAY[] constructor:
     ```typescript
     // ✅ ACCEPTABLE - Explicit ARRAY[] with type casting
     sql`${column} = ANY(ARRAY[${sql.join(values.map(v => sql`${v}`), sql`, `)}]::text[])`
     ```
   - **Pre-commit verification**: Run `grep -rn "= ANY(" app/server/routers/` before committing router changes
   - **Historical context**: 3 critical ANY() bugs discovered during Story 2.2 testing (2025-01-24) - see `/docs/audits/2025-01-24-router-sql-audit.md`

17. **Form Decimal/Numeric Handling Policy** - Forms with decimal/numeric fields must follow industry-standard patterns (see Story 7.2 architectural decision):
   - **ALWAYS use number types in forms** - Better UX with HTML number inputs, simpler validation (min/max vs regex)
   - **ALWAYS use type-safe conversions at boundaries** - Convert numbers to strings when passing to database (decimal fields)
   - **Drizzle ORM Design:** PostgreSQL `decimal`/`numeric` types are **INTENTIONALLY** represented as `string` in TypeScript (preserves precision beyond JavaScript number limits)
   - **Accepted Pattern:**
     ```typescript
     // ✅ CORRECT - Form uses numbers
     const invoiceSchema = z.object({
       subtotal: z.number().min(0, "Subtotal must be 0 or greater"),
       taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
     });

     // ✅ CORRECT - Type-safe conversion at boundary
     const handleSave = (data: InvoiceFormData) => {
       mutation.mutate({
         subtotal: data.subtotal.toString(), // number → string for DB
         taxRate: data.taxRate.toString(),
       });
     };

     // OR use tRPC transform:
     .input(z.object({
       subtotal: z.number().transform(n => n.toString()),
       taxRate: z.number().transform(n => n.toString()),
     }))
     ```
   - **Why This Pattern:**
     - HTML `<input type="number">` works with JavaScript numbers, not strings
     - PostgreSQL decimals require string representation for precision
     - React Hook Form, Zod, and tRPC all support and encourage transform patterns
     - Industry standard approach validated by 2025 research
   - **Research Sources:** Zod transforms, React Hook Form valueAsNumber, tRPC input transforms, Drizzle ORM decimal design
   - **Do not coerce for logic:** Avoid parsing DB decimal strings to numbers for business logic; use strings in the domain model. Convert to numbers only for UI formatting and guard with `Number.isFinite`.
   - **Historical Context:** Architectural decision (2025-10-26) — principle remains: number inputs in forms; string conversion at the DB boundary for decimals.

## Critical Design Elements

**IMPORTANT: These design standards must be followed consistently across all modules:**

1. **Card styling** - Use the shared Card component first. Apply the `glass-card` design-system class via the shared component API. Do not hand-roll card styles (no inline `bg-* border`).

2. **Table styling** - Use a shared TableContainer wrapper; ensure all tables are wrapped in `<div className="glass-table">`. No inline table background/border styles.

3. **Headers and Sidebars** - Use shared `GlobalHeader` and `GlobalSidebar` components. Provide module-specific `headerColor`; set `showBackToHome={true}` for non–practice-hub modules. Keep header/sidebar colors aligned to the module palette. Do not build bespoke headers/sidebars.

4. **Layout backgrounds** - All module layouts must use gradient background (apply on the top-level layout container):
   ```tsx
   className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
   ```

 

6. **Use design system classes** - Use tokens/classes from `globals.css` via shared components (e.g., `.glass-card`, `.glass-subtle`, `.glass-table`). Avoid inline `bg-*`, `border`, and `shadow` styling; extend the design system if a token is missing.

7. **Module color scheme** - Use module color tokens via the shared theme (Client Hub `#3b82f6`, Admin `#f97316`, Practice Hub primary). Do not use inline hex in components.

8. **Authentication patterns** - Follow Better Auth standard patterns:
  - **Middleware (Node runtime)**: Protect routes; public paths: `/`, `/sign-in`, `/sign-up`; allow `/api/*`; unauthenticated users redirect to `/sign-in?from=PATH`.
  - **Auth API Route (Node runtime)**: `app/api/auth/[...all]/route.ts` uses `toNextJsHandler(auth)` with `export const runtime = "nodejs"`.
  - **Tenant/role context**: Use `getAuthContext()` for tenant and role information; use protected/admin tRPC procedures.
  - **Server components/layouts**: Use `redirect()` on unauthorized access.

   **Complete implementation details:** See `/docs/architecture/authentication.md` for middleware setup, protected procedures, and session access patterns. For Microsoft OAuth setup, see `/docs/guides/integrations/microsoft-oauth.md`.

9. **Checklist Components** - Use a shared `ChecklistItem` component that supports completed/unfinished states, toggle interaction, and `h-6 w-6` icons. Styles must match the design language below:

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

MinIO provides S3-compatible object storage for local development. Test PDF generation, file uploads, and storage operations without connecting to Hetzner S3.

**Quick Setup:**
```bash
docker compose up -d minio          # Start MinIO
./scripts/setup-minio.sh            # Initialize bucket (first time only)
```

**MinIO Console:** http://localhost:9001 (credentials: `minioadmin` / `minioadmin`)

**Environment Variables:** See `.env.local` for local configuration, `.env.production.example` for Hetzner S3 production setup.

**Complete documentation:** See `/docs/operations/deployment.md` for production migration, troubleshooting, and advanced configuration.

## DocuSeal E-Signature (Local Development)

DocuSeal provides self-hosted electronic signature functionality for proposal signing. Integrated via Docker Compose with the PostgreSQL database.

**Quick Setup:**
```bash
# 1. Generate secrets and add to .env.local FIRST
openssl rand -base64 32  # DOCUSEAL_SECRET_KEY
openssl rand -base64 32  # DOCUSEAL_WEBHOOK_SECRET

# 2. Start DocuSeal
docker compose up -d docuseal

# 3. Access admin UI at http://localhost:3030
# - Create admin account
# - Settings → API Keys → Generate New Key → Add to .env.local as DOCUSEAL_API_KEY
# - Settings → Webhooks → Add webhook URL and secret
```

**Required Environment Variables:**
- `DOCUSEAL_HOST` - DocuSeal instance URL (default: `http://localhost:3030`)
- `DOCUSEAL_API_KEY` - From DocuSeal Admin UI
- `DOCUSEAL_SECRET_KEY` - Generate with `openssl rand -base64 32`
- `DOCUSEAL_WEBHOOK_SECRET` - Same value in both app and DocuSeal webhook settings

**Complete documentation:** See `/docs/operations/deployment.md` for webhook configuration, production setup, and troubleshooting.

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

**Level 1: Tenant Isolation (Accountancy Firm Level)**
- **Tenant** = Accountancy firm (e.g., "Acme Accounting Ltd")
- **Implementation**: All tables (except system tables) must have `tenantId` field
- **Access**: Staff users see all data within their tenant only

**Level 2: Client Isolation (Customer Business Level)**
- **Client** = Customer business using the client portal (e.g., "ABC Manufacturing Ltd")
- **Implementation**: Client portal tables must have BOTH `tenantId` AND `clientId`
- **Access**: Client portal users only see their specific client's data

**Database Schema Requirements:**
- Standard tables: `tenantId` required
- Client portal tables: BOTH `tenantId` AND `clientId` required
- System tables: No isolation (tenants, session, account, verification)

**Complete architecture details:** See `/docs/architecture/multi-tenancy.md` for dual isolation patterns, schema examples, and query patterns.

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

**Key Components:**
- **Context Creation** (`app/server/context.ts`): Combines Better Auth session with tenant context
- **Protected Procedures**: `protectedProcedure` (authenticated), `adminProcedure` (admin-only)
- **Auto Tenant Scoping**: All routers automatically have `ctx.authContext.tenantId` available

**Complete implementation details:** See `/docs/architecture/api-design.md` for context creation, protected procedures, router patterns, and query/mutation examples.

### Accessing Session and User Data

**Server-Side:**
- `auth.api.getSession()` - Check authentication status and get session details
- `getAuthContext()` - For multi-tenant operations requiring tenant context (includes `tenantId`, `role`, etc.)

**Client-Side:**
- `useSession()` - Access session state in components
- `signIn()`, `signOut()`, `signUp()` - Authentication actions from `@/lib/auth-client`

**Complete patterns and examples:** See `/docs/architecture/authentication.md` for server/client access patterns and usage examples.

### Multi-Tenancy Implementation

The application uses `getAuthContext()` and `getClientPortalAuthContext()` helpers to extend Better Auth sessions with tenant-specific context.

**Key Helpers:**
- `getAuthContext()` - Staff access (tenant-level isolation)
- `getClientPortalAuthContext()` - Client portal access (dual isolation with `tenantId` + `clientId`)
- `requireAuth()` - Throw if not authenticated
- `requireAdmin()` - Throw if not admin

**Complete implementation:** See `/docs/architecture/multi-tenancy.md` for auth context patterns, helper functions, query examples, and tRPC integration.

## Environment Setup

**Required environment variables** in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Better Auth secret key (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` - Application URLs

**Complete environment variable reference:** See `/docs/reference/configuration/environment.md` for all required/optional variables, production configuration, and security best practices

## Code Conventions

- Use Biome for all formatting and linting (configured in `biome.json`)
- 2-space indentation
- Component files use `.tsx` extension
- Server actions and API routes follow Next.js 15 patterns
- All new features should maintain multi-tenant isolation
