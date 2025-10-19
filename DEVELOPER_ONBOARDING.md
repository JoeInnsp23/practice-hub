# Developer Onboarding Guide

**Last Updated**: 2025-10-10
**Version**: 1.0

Welcome to the Practice Hub development team! This guide will help you get up and running with the codebase, understand the architecture, and start contributing effectively.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Environment Setup](#local-environment-setup)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Key Concepts](#key-concepts)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Common Development Tasks](#common-development-tasks)
9. [Debugging Tips](#debugging-tips)
10. [Resources & Documentation](#resources--documentation)

---

## Prerequisites

### Required Skills

**Essential**:
- ✅ TypeScript (intermediate+)
- ✅ React 19 (hooks, server components)
- ✅ Next.js 15 (App Router)
- ✅ SQL and relational databases
- ✅ Git version control

**Nice to Have**:
- tRPC experience
- Drizzle ORM or other TypeScript ORMs
- PostgreSQL administration
- Docker basics
- AWS S3 or object storage

### Required Software

**Core Tools**:
- **Node.js**: v20+ (LTS recommended)
- **pnpm**: v9+ (package manager)
- **Docker Desktop**: Latest stable (for PostgreSQL and MinIO)
- **Git**: v2.30+
- **VS Code** (recommended) or your preferred editor

**Installation**:

```bash
# Install Node.js (use nvm for version management)
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Verify installations
node --version    # Should be v20+
pnpm --version    # Should be v9+
docker --version  # Should be v20+
```

---

## Local Environment Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url> practice-hub
cd practice-hub

# Create your feature branch
git checkout -b feature/your-name-initial-setup
```

### Step 2: Install Dependencies

```bash
# Install all npm packages (uses pnpm)
pnpm install

# Verify installation
pnpm list --depth=0
```

**Expected output**: ~50 packages installed in under 30 seconds.

### Step 3: Environment Configuration

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

**Edit `.env.local`** with your local configuration:

```bash
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/practice_hub"

# Better Auth (generate new secret)
BETTER_AUTH_SECRET="<run: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# MinIO (Local S3)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="us-east-1"

# Resend (Email - use test mode)
RESEND_API_KEY="re_test_xxxxxxxx"  # Get from Resend dashboard
RESEND_FROM_EMAIL="onboarding@test.practicehub.com"

# LEM Verify (KYC - use sandbox)
LEMVERIFY_API_KEY="test_key_xxxxxxxx"  # Get from LEM Verify
LEMVERIFY_WEBHOOK_SECRET="whsec_xxxxxx"

# Google Gemini (AI)
GOOGLE_GEMINI_API_KEY="AIzaxxxxxx"  # Get from Google AI Studio
```

### Step 4: Start Docker Services

Start PostgreSQL and MinIO:

```bash
# Start all services
docker compose up -d

# Verify services are running
docker ps

# Expected output:
# - practice-hub-db (PostgreSQL on port 5432)
# - practice-hub-minio (MinIO on ports 9000, 9001)
```

**Access Services**:
- **PostgreSQL**: `localhost:5432` (user: `postgres`, password: `postgres`)
- **MinIO Console**: http://localhost:9001 (user: `minioadmin`, password: `minioadmin`)

### Step 5: Initialize Database

Set up database schema and seed data:

```bash
# Run complete database reset (creates schema + seeds data)
pnpm db:reset

# Expected output:
# ✓ Schema dropped
# ✓ Schema pushed (50+ tables created)
# ✓ Migrations applied (8 views created)
# ✓ Database seeded (sample data inserted)
```

**What this does**:
1. Drops all existing tables and views
2. Creates fresh schema from `lib/db/schema.ts`
3. Creates database views from `drizzle/*.sql`
4. Seeds database with sample data from `scripts/seed.ts`

### Step 6: Initialize MinIO

Set up S3-compatible object storage:

```bash
# Make script executable
chmod +x scripts/setup-minio.sh

# Run setup
./scripts/setup-minio.sh

# Expected output:
# ✓ Bucket 'practice-hub-proposals' created
# ✓ Public read policy applied
```

### Step 7: Start Development Server

```bash
# Start Next.js with Turbopack
pnpm dev

# Application will be available at:
# http://localhost:3000
```

**First-time startup**: May take 30-60 seconds to compile. Subsequent starts are faster (~5 seconds).

### Step 8: Verify Setup

Open http://localhost:3000 in your browser.

**Test credentials** (from seed data):
- **Admin**: `admin@demo.com` / `password`
- **Staff**: `john.smith@demo.com` / `password`
- **Client Portal**: `client@example.com` / `password`

**Verify**:
1. ✅ Can sign in with test credentials
2. ✅ Dashboard loads without errors
3. ✅ Can navigate between hubs (Practice Hub, Client Hub, Proposal Hub, Admin)
4. ✅ Database queries return data

---

## Project Structure

### High-Level Overview

```
practice-hub/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── practice-hub/      # Core practice management
│   ├── client-hub/        # CRM and client management
│   ├── proposal-hub/      # Proposals, leads, pricing
│   ├── admin/             # Admin panel
│   ├── client-portal/     # External client access
│   ├── api/               # API routes
│   │   └── auth/          # Better Auth endpoints
│   └── server/            # tRPC server setup
│       ├── routers/       # tRPC routers (by domain)
│       ├── context.ts     # tRPC context (session, auth)
│       └── trpc.ts        # tRPC initialization
├── lib/                   # Shared utilities
│   ├── db/               # Database config
│   │   ├── schema.ts     # Drizzle schema (50+ tables)
│   │   └── index.ts      # DB client
│   ├── auth.ts           # Better Auth config
│   ├── auth-client.ts    # Better Auth React client
│   └── utils.ts          # Helper functions
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (header, sidebar)
│   └── [domain]/        # Domain-specific components
├── drizzle/             # Database migrations & views
│   ├── *.sql            # SQL view definitions
│   └── migrations/      # Drizzle migrations (not used in dev)
├── scripts/             # Utility scripts
│   ├── seed.ts          # Database seeding
│   └── setup-minio.sh   # MinIO initialization
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   └── api/             # API route tests
├── public/              # Static assets
├── docs/                # Documentation
│   ├── user-guides/     # User documentation
│   └── *.md             # Technical documentation
├── .env.local           # Local environment variables (gitignored)
├── .env.example         # Environment template
├── CLAUDE.md            # AI assistant guidelines
├── README.md            # Project overview
├── biome.json           # Biome linting config
├── drizzle.config.ts    # Drizzle ORM config
├── next.config.ts       # Next.js config
├── tailwind.config.ts   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── vitest.config.ts     # Vitest testing config
```

### Key Directories Explained

#### `app/` - Next.js App Router

**Module Organization**:
Each "hub" is a self-contained module with its own:
- Pages (`page.tsx`)
- Layouts (`layout.tsx`)
- Loading states (`loading.tsx`)
- Error boundaries (`error.tsx`)

**Example: Client Hub**:
```
app/client-hub/
├── layout.tsx           # Hub layout (header, sidebar)
├── page.tsx             # Dashboard (default route)
├── clients/
│   ├── page.tsx         # Clients list
│   └── [id]/
│       ├── page.tsx     # Client detail
│       └── edit/
│           └── page.tsx # Client edit form
```

#### `app/server/` - tRPC Backend

**Router Organization**:
```
app/server/routers/
├── clients.ts           # Client CRUD operations
├── tasks.ts             # Task management
├── proposals.ts         # Proposal operations
├── kyc.ts              # KYC/AML operations
├── analytics.ts         # Reporting and analytics
└── index.ts            # Root router (combines all)
```

**Pattern**: One router per domain, combined in `index.ts`.

#### `lib/db/` - Database Layer

**`schema.ts`**: Single source of truth for database schema
- 50+ table definitions
- 15+ enums
- Foreign key relationships
- Indexes for performance

**`index.ts`**: Exports configured Drizzle client
- Connection pooling
- Query logging (dev only)

#### `components/` - React Components

**Organization by purpose**:
- `ui/` - shadcn/ui primitives (Button, Input, Card, etc.)
- `layout/` - App-wide layout (GlobalHeader, GlobalSidebar)
- `forms/` - Reusable form components
- `[domain]/` - Domain-specific (e.g., `client-hub/`, `proposals/`)

---

## Architecture Overview

### Tech Stack

**Frontend**:
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with Server Components
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Component library (Radix UI primitives)
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Recharts** - Data visualization

**Backend**:
- **Next.js API Routes** - Serverless functions
- **tRPC** - Type-safe RPC framework
- **Better Auth** - Authentication (email/password, OAuth)
- **Drizzle ORM** - TypeScript ORM
- **PostgreSQL** - Relational database
- **SuperJSON** - JSON serialization with Date/BigInt support

**Integrations**:
- **LEM Verify** - KYC/AML identity verification
- **Google Gemini 2.0 Flash** - AI document extraction
- **Resend** - Transactional email
- **Hetzner S3 / MinIO** - Object storage
- **Companies House API** - UK company data

**DevOps**:
- **Docker** - Local development (PostgreSQL, MinIO)
- **Biome** - Fast linter and formatter
- **Vitest** - Unit and integration testing
- **TypeScript** - Type safety

### Architecture Patterns

#### 1. Multi-Tenancy

**Tenant Isolation**:
- Every entity has `tenantId` foreign key
- All queries filter by `tenantId`
- Users belong to one tenant (organization)
- Data completely isolated between tenants

**Implementation**:
```typescript
// lib/auth.ts - Auth context includes tenantId
export interface AuthContext {
  userId: string;
  tenantId: string;  // ← Tenant isolation
  role: string;
  email: string;
}

// All queries must filter by tenantId
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, ctx.authContext.tenantId));
```

#### 2. Server Components + Client Components

**Default: Server Components** (React 19 pattern)
- Fetch data on server
- No client-side JavaScript
- Better performance, SEO

**Client Components**: Only when needed
- Interactive forms
- Client-state management
- Browser APIs (localStorage, etc.)

**Example**:
```typescript
// app/clients/page.tsx - Server Component (default)
export default async function ClientsPage() {
  const authContext = await getAuthContext();
  const clients = await db.select().from(clientsTable)
    .where(eq(clientsTable.tenantId, authContext.tenantId));

  return <ClientsList clients={clients} />;  // Pass data to client
}

// components/ClientsList.tsx - Client Component (interactive)
"use client";  // ← Mark as client component

export function ClientsList({ clients }) {
  const [search, setSearch] = useState("");
  // Client-side interactivity
}
```

#### 3. tRPC Type-Safe APIs

**Router Pattern**:
```typescript
// app/server/routers/clients.ts
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // ctx.authContext automatically available
    return db.select().from(clients)
      .where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.insert(clients).values({
        ...input,
        tenantId: ctx.authContext.tenantId,
      });
    }),
});
```

**Client Usage**:
```typescript
"use client";
import { trpc } from "@/lib/trpc/client";

export function ClientsList() {
  // Fully type-safe, auto-complete works
  const { data: clients, isLoading } = trpc.clients.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return <div>{clients.map(c => c.name)}</div>;
}
```

#### 4. Better Auth Integration

**Session Management**:
- Server-side: `auth.api.getSession()`
- Client-side: `useSession()` hook
- Multi-tenant: `getAuthContext()` helper

**Middleware Protection**:
```typescript
// middleware.ts
export default async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session && !publicPaths.includes(pathname)) {
    return NextResponse.redirect("/sign-in");
  }

  return NextResponse.next();
}
```

**tRPC Context**:
```typescript
// app/server/context.ts
export const createContext = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const authContext = await getAuthContext();

  return { session, authContext };
};

// Procedures can access ctx.session and ctx.authContext
```

#### 5. Database Views for Performance

**Problem**: Joining 5+ tables on every query is slow

**Solution**: Pre-computed views

**Example**:
```sql
-- drizzle/0001_create_client_details_view.sql
CREATE VIEW client_details_view AS
SELECT
  c.*,
  u.first_name AS account_manager_first_name,
  u.last_name AS account_manager_last_name,
  CONCAT(u.first_name, ' ', u.last_name) AS account_manager_name,
  u.email AS account_manager_email
FROM clients c
LEFT JOIN users u ON c.account_manager_id = u.id;
```

**Usage**:
```typescript
// Fast: Query view instead of joining
const clients = await db.select().from(clientDetailsView);
```

---

## Key Concepts

### 1. Better Auth Session vs Auth Context

**Better Auth Session** (`session`):
- Provided by Better Auth
- Contains: `user` (id, email, name), `session` (id, expiresAt)
- Access server-side: `auth.api.getSession()`
- Access client-side: `useSession()` hook

**Auth Context** (`authContext`):
- Custom helper extending session
- Contains: `userId`, `tenantId`, `role`, `email`, `firstName`, `lastName`, `organizationName`
- Access server-side: `getAuthContext()`
- Used for: Multi-tenant queries, role-based access

**When to use each**:
- **Session**: Check if user is authenticated
- **Auth Context**: Access tenant ID for data queries

```typescript
// Server Component
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/sign-in");  // Check auth

const authContext = await getAuthContext();
const clients = await db.select().from(clientsTable)
  .where(eq(clientsTable.tenantId, authContext.tenantId));  // Tenant isolation
```

### 2. Protected Procedures (tRPC)

**Three levels of protection**:

```typescript
// Public (no auth required)
export const publicProcedure = t.procedure;

// Protected (authenticated users only)
export const protectedProcedure = t.procedure.use(isAuthed);

// Admin (admin role required)
export const adminProcedure = t.procedure.use(isAdmin);
```

**Usage**:
```typescript
export const clientsRouter = router({
  // Anyone can access (e.g., landing page)
  publicData: publicProcedure.query(() => { ... }),

  // Authenticated users only
  list: protectedProcedure.query(({ ctx }) => {
    // ctx.authContext available
  }),

  // Admins only
  delete: adminProcedure.mutation(({ ctx, input }) => {
    // Only admins can delete
  }),
});
```

### 3. Database Schema Changes

**CRITICAL**: No migrations in development!

**Workflow**:
1. Edit `lib/db/schema.ts` directly
2. Run `pnpm db:reset` to apply changes
3. Update `scripts/seed.ts` to match new schema
4. Run `pnpm db:reset` again to verify seed data

**Example**:
```typescript
// lib/db/schema.ts - Add new column
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry"),  // ← NEW COLUMN
  // ...
});

// scripts/seed.ts - Update seed data
await db.insert(clients).values([
  {
    name: "ABC Ltd",
    industry: "Construction",  // ← ADD DATA FOR NEW COLUMN
    tenantId: tenant1.id,
  },
]);
```

**Why no migrations?**: Database is in development. Migrations only used in production.

### 4. Soft Deletes

**Pattern**: Don't delete data, mark as archived/deleted

**Implementation**:
```typescript
// Schema
export const clients = pgTable("clients", {
  // ...
  status: text("status").notNull().default("active"),
  // Possible statuses: active, inactive, archived
});

// Delete operation (actually just updates status)
await db.update(clients)
  .set({ status: "archived", updatedAt: new Date() })
  .where(eq(clients.id, clientId));

// Queries filter by status
const activeClients = await db.select().from(clients)
  .where(and(
    eq(clients.tenantId, tenantId),
    eq(clients.status, "active")  // ← Filter archived
  ));
```

**Why soft deletes?**: Compliance requirements (7-year retention for AML data).

### 5. Activity Logging

**Audit trail** for compliance and debugging:

```typescript
// Log all important actions
await db.insert(activityLogs).values({
  tenantId: ctx.authContext.tenantId,
  userId: ctx.authContext.userId,
  entityType: "client",
  entityId: client.id,
  action: "update",
  metadata: {
    changes: {
      name: { old: "ABC Ltd", new: "ABC Limited" },
    },
  },
  ipAddress: request.ip,
  userAgent: request.headers.get("user-agent"),
});
```

**What to log**:
- Create, update, delete operations
- Status changes (e.g., client onboarding → active)
- Admin actions (KYC approval, pricing changes)
- Authentication events (sign-in, sign-out)

---

## Development Workflow

### Branch Strategy

**Main branches**:
- `main` - Production-ready code
- `develop` - Integration branch (not used yet)

**Feature branches**:
```bash
# Create feature branch from main
git checkout main
git pull
git checkout -b feature/short-description

# Examples:
# feature/add-client-notes
# fix/kyc-webhook-validation
# refactor/proposal-calculator
```

### Daily Workflow

**1. Start work**:
```bash
# Pull latest changes
git checkout main
git pull

# Create/switch to feature branch
git checkout -b feature/my-feature

# Start services
docker compose up -d
pnpm dev
```

**2. Make changes**:
- Edit code
- Test manually (http://localhost:3000)
- Write/update tests
- Run linter: `pnpm lint`

**3. Commit changes**:
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add client notes feature

- Add notes field to clients table
- Create ClientNotes component
- Add tRPC endpoint for notes CRUD
- Update seed data with sample notes

Closes #123"

# Push to remote
git push origin feature/my-feature
```

### Code Quality Checks

**Before committing**:
```bash
# Run linter (auto-fix)
pnpm lint

# Run type check
pnpm tsc

# Run tests
pnpm test

# All checks pass? Ready to commit!
```

### Pull Request Process

**1. Create PR**:
- Push feature branch
- Open PR on GitHub
- Fill out PR template (description, testing notes, screenshots)

**2. Code review**:
- Wait for team review
- Address feedback
- Push additional commits

**3. Merge**:
- Squash and merge (preferred)
- Delete feature branch

---

## Testing

### Test Infrastructure

**Framework**: Vitest (fast, compatible with TypeScript)

**Test types**:
- **Unit tests**: Pure functions, utilities
- **API tests**: tRPC procedures, webhook handlers
- **Integration tests**: Database operations

**Location**: `tests/` directory

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test tests/unit/cache.test.ts

# Watch mode (re-run on changes)
pnpm test --watch
```

### Writing Tests

**Example: Unit test**:
```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from "vitest";
import { calculateAge } from "@/lib/utils";

describe("calculateAge", () => {
  it("calculates age correctly", () => {
    const birthDate = new Date("1990-01-01");
    const age = calculateAge(birthDate);
    expect(age).toBe(35);  // Assuming current year is 2025
  });

  it("handles leap years", () => {
    const birthDate = new Date("1992-02-29");
    const age = calculateAge(birthDate);
    expect(age).toBe(33);
  });
});
```

**Example: API test**:
```typescript
// tests/api/clients.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createCaller } from "@/app/server/routers/_app";
import { db } from "@/lib/db";

describe("clientsRouter", () => {
  beforeEach(async () => {
    // Reset database before each test
    await db.delete(clients);
  });

  it("creates a client", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.clients.create({
      name: "Test Client",
      email: "test@example.com",
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Client");
  });
});
```

### Test Coverage

**Current coverage**: 70%+ (unit tests), 60%+ (API tests)

**View coverage report**:
```bash
pnpm test --coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

---

## Common Development Tasks

### Add a New Table

**1. Define schema**:
```typescript
// lib/db/schema.ts
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  clientId: uuid("client_id").references(() => clients.id),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**2. Reset database**:
```bash
pnpm db:reset
```

**3. Update seed data**:
```typescript
// scripts/seed.ts
await db.insert(notes).values([
  {
    tenantId: tenant1.id,
    clientId: client1.id,
    content: "Initial consultation completed",
    createdBy: user1.id,
  },
]);
```

**4. Run reset again**:
```bash
pnpm db:reset
```

### Create a New tRPC Router

**1. Create router file**:
```typescript
// app/server/routers/notes.ts
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { notes } from "@/lib/db/schema";

export const notesRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return db.select().from(notes)
        .where(and(
          eq(notes.tenantId, ctx.authContext.tenantId),
          eq(notes.clientId, input.clientId)
        ));
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const [note] = await db.insert(notes).values({
        ...input,
        tenantId: ctx.authContext.tenantId,
        createdBy: ctx.authContext.userId,
      }).returning();

      return note;
    }),
});
```

**2. Add to root router**:
```typescript
// app/server/routers/index.ts
import { notesRouter } from "./notes";

export const appRouter = router({
  // ... other routers
  notes: notesRouter,  // ← Add here
});
```

**3. Use in component**:
```typescript
"use client";
import { trpc } from "@/lib/trpc/client";

export function NotesList({ clientId }: { clientId: string }) {
  const { data: notes } = trpc.notes.list.useQuery({ clientId });

  return <div>{notes?.map(n => <p key={n.id}>{n.content}</p>)}</div>;
}
```

### Add a New Page

**1. Create page file**:
```typescript
// app/client-hub/notes/page.tsx
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotesList } from "@/components/notes/NotesList";

export default async function NotesPage() {
  const authContext = await getAuthContext();
  if (!authContext) redirect("/sign-in");

  return (
    <div>
      <h1>Client Notes</h1>
      <NotesList />
    </div>
  );
}
```

**2. Add navigation link**:
```typescript
// components/layout/GlobalSidebar.tsx
const sidebarLinks = [
  { href: "/client-hub", label: "Dashboard", icon: Home },
  { href: "/client-hub/clients", label: "Clients", icon: Users },
  { href: "/client-hub/notes", label: "Notes", icon: FileText },  // ← Add
];
```

### Add a shadcn/ui Component

```bash
# Add component from shadcn/ui
npx shadcn@latest add dialog

# Component installed to: components/ui/dialog.tsx
# Import and use:
# import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

---

## Debugging Tips

### Common Issues

#### 1. Database Connection Error

**Error**: `ECONNREFUSED` or `Connection refused`

**Solutions**:
- Verify Docker is running: `docker ps`
- Start services: `docker compose up -d`
- Check port 5432 not in use: `lsof -i :5432`

#### 2. tRPC Type Errors

**Error**: `Property 'notes' does not exist on type 'TRPCClient'`

**Solution**: Restart TypeScript server in VS Code
- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

#### 3. Module Not Found

**Error**: `Cannot find module '@/lib/db/schema'`

**Solution**: Restart dev server
```bash
# Kill dev server (Ctrl+C)
pnpm dev
```

#### 4. Database Schema Out of Sync

**Error**: `relation "notes" does not exist`

**Solution**: Reset database
```bash
pnpm db:reset
```

#### 5. Auth Context Returns Null

**Error**: `authContext is null` in protected route

**Debug**:
```typescript
// Check session first
const session = await auth.api.getSession({ headers: await headers() });
console.log("Session:", session);  // Should have user object

// Then check auth context
const authContext = await getAuthContext();
console.log("Auth Context:", authContext);  // Should have tenantId

// If session exists but authContext is null:
// → User exists in Better Auth but not in users table
// → Run seed script to create user records
```

### Debugging Tools

**VS Code Extensions** (recommended):
- **Prisma/Drizzle ORM** - SQL autocomplete
- **ESLint** - Linting in editor
- **Error Lens** - Inline error messages
- **Thunder Client** - API testing

**Browser DevTools**:
- **React DevTools** - Component inspection
- **Network tab** - API request debugging
- **Console** - Client-side errors

**Database Tools**:
- **TablePlus** - GUI for PostgreSQL (recommended)
- **pgAdmin** - Official PostgreSQL GUI
- **DBeaver** - Universal database tool

---

## Resources & Documentation

### Internal Documentation

**User Guides**:
- [Staff Guide](docs/user-guides/STAFF_GUIDE.md) - End-user workflows
- [Client Onboarding Guide](docs/user-guides/CLIENT_ONBOARDING_GUIDE.md) - KYC/AML process
- [Admin Training Manual](docs/user-guides/ADMIN_TRAINING.md) - Admin features
- [FAQ](docs/user-guides/FAQ.md) - Common questions

**Technical Documentation**:
- [README.md](README.md) - Project overview and setup
- [CLAUDE.md](CLAUDE.md) - Development guidelines and critical rules
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - Configuration reference
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Complete schema documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines *(coming soon)*
- [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md) - Code standards *(coming soon)*
- [TROUBLESHOOTING_DEV.md](TROUBLESHOOTING_DEV.md) - Developer troubleshooting *(coming soon)*

### External Resources

**Next.js 15**:
- [Official Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

**React 19**:
- [React Docs](https://react.dev/)
- [Hooks Reference](https://react.dev/reference/react)

**tRPC**:
- [Official Docs](https://trpc.io/)
- [Next.js Integration](https://trpc.io/docs/client/nextjs)

**Drizzle ORM**:
- [Official Docs](https://orm.drizzle.team/)
- [PostgreSQL Schema](https://orm.drizzle.team/docs/sql-schema-declaration)

**Better Auth**:
- [Official Docs](https://www.better-auth.com/)
- [Next.js Setup](https://www.better-auth.com/docs/integrations/next-js)

**Tailwind CSS**:
- [Official Docs](https://tailwindcss.com/docs)
- [Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

**shadcn/ui**:
- [Component Library](https://ui.shadcn.com/)
- [Installation](https://ui.shadcn.com/docs/installation)

### Getting Help

**Internal Support**:
1. Check this documentation first
2. Search existing issues on GitHub
3. Ask in team Slack: `#practice-hub-dev`
4. Tag tech lead for urgent issues

**External Support**:
- Stack Overflow (tag: next.js, react, trpc)
- tRPC Discord: https://trpc.io/discord
- Better Auth Discord: [link in docs]

---

## Next Steps

### Week 1: Get Familiar
- ✅ Complete local setup
- ✅ Sign in with test credentials and explore UI
- ✅ Read CLAUDE.md (critical development rules)
- ✅ Browse codebase (focus on `app/`, `lib/`, `components/`)
- ✅ Run existing tests: `pnpm test`

### Week 2: Small Contribution
- Pick a "good first issue" from GitHub
- Create feature branch
- Implement fix/feature
- Write tests
- Submit PR

### Week 3: Larger Feature
- Implement full CRUD feature (e.g., client notes)
- Add tRPC router
- Create UI components
- Write comprehensive tests
- Document feature

### Week 4: Team Collaboration
- Review teammate PRs
- Participate in planning meetings
- Suggest improvements to codebase
- Contribute to documentation

---

## Questions?

If you have questions not covered in this guide, please:
1. Search documentation (`docs/` folder)
2. Check FAQ: [docs/user-guides/FAQ.md](docs/user-guides/FAQ.md)
3. Ask in `#practice-hub-dev` Slack channel
4. Update this guide with your learnings (submit PR)

**Welcome to the team! Happy coding! 🚀**

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
