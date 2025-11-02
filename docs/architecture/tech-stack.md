---
title: Technology Stack
description: Complete technology stack with versions and justifications
audience: dev, architect
status: complete
generated: AI-GENERATED
---

# Technology Stack

<!-- BEGIN AI-GENERATED -->
**Framework**: Next.js {{package.json:next.version}}
**React**: {{package.json:react.version}}
**Database**: PostgreSQL (Drizzle ORM {{package.json:drizzle-orm.version}})
**Auth**: Better Auth {{package.json:better-auth.version}}

**Total Dependencies**: {{package.json:dependencies.count}}
**Total Dev Dependencies**: {{package.json:devDependencies.count}}

This section will be auto-updated when package.json changes.
<!-- END AI-GENERATED -->

---

<!-- HUMAN-AUTHORED SECTION -->

**Quick Summary**: Practice Hub is built on Next.js 15 with React 19, PostgreSQL, Better Auth, tRPC, and shadcn/ui. This document provides a complete inventory of all technologies, their versions, purposes, and configuration details.

## What This Document Covers

- Core framework and runtime
- Database and ORM stack
- Authentication and authorization
- API and data fetching
- UI and styling libraries
- Development and testing tools
- Integration services
- Infrastructure and deployment

---

## Quick Start / TL;DR

**Core Stack**:
```
Next.js 15.5.4 (App Router + Turbopack)
├── React 19.1.0
├── TypeScript 5.x
├── PostgreSQL 14+ (via Docker)
├── Drizzle ORM 0.44.5
├── Better Auth 1.3.26
├── tRPC 11.6.0
└── Tailwind CSS v4
```

**Build Tool**: Turbopack (built into Next.js 15)
**Package Manager**: pnpm
**Node Version**: 20.x
**Deployment Target**: Production (Coolify/Hetzner)

---

## Framework & Runtime

### Next.js 15.5.4 (App Router)

**Purpose**: Full-stack React framework providing routing, server components, API routes, and build optimization.

**Key Features Used**:
- App Router architecture (`app/` directory)
- Server Components (default)
- Server Actions
- Route Groups `(auth)`, `(public)`, `(client-portal)`
- API Routes (`app/api/`)
- Middleware for authentication
- Turbopack for fast builds

**Configuration**: `next.config.ts`
```typescript
- Runtime: nodejs
- Security headers: HSTS, CSP, XSS Protection
- Sentry integration: Source map upload
- Content Security Policy for production
```

**Related Files**:
- `next.config.ts` - Next.js configuration
- `middleware.ts` - Route protection
- `instrumentation.ts` - Sentry initialization

---

### React 19.1.0

**Purpose**: UI library for building interactive interfaces with Server and Client Components.

**Key Features Used**:
- Server Components (primary rendering strategy)
- Client Components (`"use client"` directive)
- React Hooks (useState, useEffect, useMemo, useCallback)
- Context API (theme, auth)
- Suspense boundaries
- Error boundaries

**Patterns**:
- Server Components for data fetching
- Client Components for interactivity
- Form handling with React Hook Form
- State management via React Query (TanStack Query)

---

### TypeScript 5.x

**Purpose**: Type-safe JavaScript with compile-time error detection.

**Configuration**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Type Safety Strategy**:
- `strict: true` mode enabled
- No implicit `any`
- Strict null checks
- Drizzle-generated types for database
- Zod for runtime validation
- tRPC for end-to-end type safety

---

### Turbopack

**Purpose**: Next-generation bundler providing 10x faster builds than Webpack.

**Usage**:
```bash
pnpm dev --turbopack      # Development
pnpm build --turbopack    # Production build
```

**Benefits**:
- Incremental compilation
- Faster Hot Module Replacement (HMR)
- Optimized production builds
- Native TypeScript support

---

## Database & ORM Stack

### PostgreSQL 14+

**Purpose**: Primary relational database for all application data.

**Deployment**:
- **Development**: Docker Compose (`docker-compose.yml`)
- **Production**: Managed PostgreSQL (Hetzner/Coolify)

**Configuration**:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"
```

**Schema Management**:
- 50+ tables (see `lib/db/schema.ts`)
- 14 database views (business logic aggregation)
- 5 performance indexes
- Multi-tenant isolation via `tenantId` foreign keys

**Docker Setup**:
```yaml
# docker-compose.yml
postgres:
  image: postgres:14
  ports: ["5432:5432"]
  environment:
    POSTGRES_DB: practice_hub
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
```

---

### Drizzle ORM 0.44.5

**Purpose**: Type-safe SQL query builder and schema management.

**Why Drizzle**:
- Full TypeScript support with inferred types
- SQL-like query syntax (familiar to developers)
- Zero runtime overhead
- Excellent Next.js App Router integration
- Automatic type generation from schema

**Key Files**:
- `lib/db/schema.ts` - Complete database schema (50+ tables)
- `lib/db/index.ts` - Drizzle client initialization
- `drizzle.config.ts` - Drizzle Kit configuration
- `drizzle/*.sql` - Manual SQL migrations (views)

**Configuration**: `drizzle.config.ts`
```typescript
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};
```

**Common Patterns**:
```typescript
// Query with tenant isolation
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, tenantId));

// Insert with generated ID
await db.insert(clientsTable).values({
  id: crypto.randomUUID(),
  tenantId,
  name: "Client Name",
});
```

---

### Drizzle Kit 0.31.4

**Purpose**: Schema migration and database management tool.

**Commands**:
```bash
pnpm db:push:dev      # Push schema changes (development)
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations
pnpm db:studio        # Launch Drizzle Studio GUI
```

**Migration Strategy**:
- **NO MIGRATIONS during development** (per CLAUDE.md)
- Direct schema updates in `lib/db/schema.ts`
- Database reset via `pnpm db:reset`
- Manual SQL migrations for views (`drizzle/*.sql`)

---

## Authentication & Authorization

### Better Auth 1.3.26

**Purpose**: Full-featured authentication library with dual auth systems.

**Dual Authentication Setup**:
1. **Staff Auth** (`lib/auth.ts`) - Email/password + Microsoft OAuth
2. **Client Portal Auth** (`lib/client-portal-auth.ts`) - Separate instance

**Features Used**:
- Email/password authentication
- Microsoft OAuth (Azure AD)
- Session management
- Password hashing (bcryptjs)
- Email verification
- User invitations

**API Routes**:
- `/api/auth/[...all]` - Staff auth endpoints
- `/api/client-portal-auth/[...all]` - Client portal endpoints

**Configuration**:
```bash
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="<azure-app-id>"
MICROSOFT_CLIENT_SECRET="<azure-secret>"
MICROSOFT_TENANT_ID="<azure-tenant-id>"
```

**Custom Auth Context**:
```typescript
// lib/auth.ts
export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string; // admin, accountant, member
  email: string;
  firstName: string | null;
  lastName: string | null;
}
```

---

### bcryptjs 3.0.2

**Purpose**: Password hashing for secure credential storage.

**Configuration**:
- Salt rounds: 10 (Better Auth default)
- Hashing algorithm: bcrypt
- Auto-salted passwords

---

## API & Data Fetching

### tRPC 11.6.0

**Purpose**: End-to-end type-safe API layer replacing REST.

**Architecture**:
```
Client (React Components)
  ↓ useQuery / useMutation
TanStack Query
  ↓ HTTP calls
tRPC Client
  ↓ /api/trpc
tRPC Server (29 routers)
  ↓ Drizzle ORM
PostgreSQL
```

**Key Files**:
- `app/server/trpc.ts` - tRPC initialization + middleware
- `app/server/context.ts` - Request context (auth, session)
- `app/server/routers/*.ts` - 29 API routers
- `lib/trpc/client.ts` - Client-side tRPC setup

**Procedures**:
- `publicProcedure` - No authentication required
- `protectedProcedure` - Staff authentication required
- `adminProcedure` - Admin role required
- `clientPortalProcedure` - Client portal authentication

**Middleware**:
- Rate limiting (Upstash Redis)
- Authentication checks
- Tenant context injection
- Sentry error tracking

**Standard Pattern**:
```typescript
export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, ctx.authContext.tenantId));
    }),
});
```

---

### TanStack Query 5.90.2

**Purpose**: Data fetching, caching, and synchronization for React.

**Usage**: Integrated with tRPC for automatic query invalidation and caching.

**Features**:
- Automatic background refetching
- Query caching
- Optimistic updates
- Infinite queries for pagination
- Mutation hooks

**Configuration**: `app/providers/trpc-provider.tsx`
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});
```

---

### Zod 4.1.11

**Purpose**: Schema validation and type inference.

**Usage**:
- tRPC input validation
- Form validation (React Hook Form)
- Runtime type checking
- Drizzle schema generation

**Example**:
```typescript
const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  type: z.enum(["individual", "company", "limited_company"]),
});
```

---

### SuperJSON 2.2.2

**Purpose**: Serialize complex JavaScript types (Date, Map, Set, BigInt) over tRPC.

**Why Needed**: tRPC transmits data as JSON, but SuperJSON preserves types like `Date` objects.

**Configuration**: `app/server/trpc.ts`
```typescript
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
```

---

## UI & Styling

### shadcn/ui

**Purpose**: Copy-paste React component library built on Radix UI primitives.

**Components Used** (30+):
- `Card`, `Button`, `Input`, `Label`
- `Dialog`, `AlertDialog`, `Popover`
- `Select`, `Checkbox`, `Switch`
- `Table`, `Tabs`, `Separator`
- `Badge`, `Avatar`, `Skeleton`

**Installation**: `components.json`
```json
{
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate"
  }
}
```

**Custom Modifications**:
- `Card` component includes `glass-card` class by default
- Components use design system CSS variables

**Location**: `components/ui/`

---

### Tailwind CSS v4

**Purpose**: Utility-first CSS framework for rapid UI development.

**Configuration**: `app/globals.css`
```css
@import "tailwindcss";

:root {
  --radius: 0.5rem;
  --primary: oklch(0.515 0.151 254.09);
  /* ... design tokens */
}
```

**Custom Classes**:
- `.glass-card` - Primary content cards (solid backgrounds)
- `.glass-subtle` - Headers and sidebars
- `.glass-table` - Table containers

**Tailwind Features Used**:
- Design tokens (`@theme` layer)
- Dark mode support (`.dark` class)
- Container queries
- Custom color system (OKLCH)

**PostCSS**: `postcss.config.mjs`
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

---

### Lucide React 0.544.0

**Purpose**: Icon library with 1000+ consistent SVG icons.

**Usage**:
```typescript
import { User, Mail, Settings } from "lucide-react";

<User className="h-4 w-4" />
```

**Why Lucide**:
- Tree-shakeable (only import icons you use)
- Consistent design language
- TypeScript support
- Excellent Tailwind integration

---

### Framer Motion 12.23.22

**Purpose**: Production-ready animation library for React.

**Usage**:
- Page transitions
- Modal animations
- Drag-and-drop (kanban board)
- Loading states

**Example**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {content}
</motion.div>
```

---

### next-themes 0.4.6

**Purpose**: Dark mode support for Next.js.

**Configuration**: `app/providers/theme-provider.tsx`
```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**Usage**: `components/mode-toggle.tsx`
```typescript
const { theme, setTheme } = useTheme();
```

---

## Forms & Validation

### React Hook Form 7.63.0

**Purpose**: Performant form handling with validation.

**Integration**: Works with Zod for schema validation.

**Usage**:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(clientSchema),
  defaultValues: {
    name: "",
    email: "",
  },
});
```

**Benefits**:
- Minimal re-renders
- Built-in validation
- TypeScript support
- Uncontrolled inputs (performance)

---

### @hookform/resolvers 5.2.2

**Purpose**: Validation resolver adapters for React Hook Form.

**Usage**: Connects Zod schemas to React Hook Form.

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
```

---

## Date & Time

### date-fns 4.1.0

**Purpose**: Modern JavaScript date utility library.

**Usage**:
```typescript
import { format, addDays, isBefore } from "date-fns";

format(new Date(), "PPP"); // "Jan 21, 2025"
```

**Why date-fns**:
- Tree-shakeable (import only what you use)
- Immutable functions
- TypeScript support
- No locale bloat

---

### react-day-picker 9.11.0

**Purpose**: Calendar date picker component.

**Usage**: Integrated with shadcn/ui Calendar component.

**Features**:
- Single date selection
- Date range selection
- Month/year navigation
- Disabled dates

---

## Data Visualization

### Recharts 3.2.1

**Purpose**: Composable charting library built on React components.

**Charts Used**:
- Bar charts (revenue, client breakdown)
- Line charts (activity trends)
- Pie charts (proposal status distribution)
- Area charts (analytics dashboard)

**Example**:
```typescript
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Bar dataKey="value" fill="var(--primary)" />
</BarChart>
```

---

## File Handling

### react-pdf/renderer 4.3.1

**Purpose**: Generate PDFs from React components on the server.

**Usage**: Proposal PDF generation.

**Location**: `lib/pdf/`

**Example**:
```typescript
import { Document, Page, Text, pdf } from "@react-pdf/renderer";

const ProposalPDF = () => (
  <Document>
    <Page>
      <Text>Proposal Content</Text>
    </Page>
  </Document>
);

const blob = await pdf(<ProposalPDF />).toBlob();
```

---

### xlsx 0.18.5

**Purpose**: Excel file generation and parsing.

**Usage**: Data export (clients, tasks, invoices).

**Location**: `lib/export/`, `lib/utils/export-csv.ts`

**Example**:
```typescript
import XLSX from "xlsx";

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
XLSX.writeFile(workbook, "clients.xlsx");
```

---

### papaparse 5.5.3

**Purpose**: CSV parsing and generation.

**Usage**: Import client data from CSV.

**Example**:
```typescript
import Papa from "papaparse";

Papa.parse(file, {
  header: true,
  complete: (results) => {
    console.log(results.data);
  },
});
```

---

## Email

### Resend 6.1.2

**Purpose**: Modern email API for transactional emails.

**Configuration**:
```bash
RESEND_API_KEY="<resend-api-key>"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

**Location**: `lib/email/index.ts`

**Email Templates**: `lib/email/templates/*.tsx`

**Example**:
```typescript
import { resend } from "@/lib/email";

await resend.emails.send({
  from: "noreply@yourdomain.com",
  to: "user@example.com",
  subject: "Welcome to Practice Hub",
  react: WelcomeEmail({ name: "John" }),
});
```

---

### @react-email/components 0.5.6

**Purpose**: React components for building email templates.

**Templates**:
- Welcome email
- Invitation email
- Password reset
- Proposal sent notification

**Example**:
```typescript
import { Html, Text, Button } from "@react-email/components";

export const WelcomeEmail = ({ name }) => (
  <Html>
    <Text>Welcome {name}!</Text>
    <Button href="https://app.com">Get Started</Button>
  </Html>
);
```

---

## Storage & CDN

### AWS SDK S3 Client 3.901.0

**Purpose**: S3-compatible object storage (MinIO locally, Hetzner S3 production).

**Configuration**:
```bash
# Development (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="us-east-1"

# Production (Hetzner)
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="<hetzner-key>"
S3_SECRET_ACCESS_KEY="<hetzner-secret>"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="eu-central"
```

**Location**: `lib/s3/upload.ts`, `lib/storage/s3.ts`

**Usage**:
- PDF storage (proposals)
- Document storage
- File uploads

**Example**:
```typescript
import { uploadToS3 } from "@/lib/s3/upload";

const { url, key } = await uploadToS3({
  file: pdfBlob,
  key: `proposals/${proposalId}.pdf`,
  contentType: "application/pdf",
});
```

---

## AI & Integrations

### Google Generative AI 0.24.1

**Purpose**: Google Gemini AI for document data extraction.

**Configuration**:
```bash
GEMINI_API_KEY="<google-ai-key>"
```

**Location**: `lib/ai/extract-client-data.ts`

**Use Cases**:
- Extract client data from PDF documents
- Questionnaire pre-filling
- Lead data extraction

**Example**:
```typescript
import { extractClientDataFromPDF } from "@/lib/ai/extract-client-data";

const extractedData = await extractClientDataFromPDF(pdfBuffer);
```

---

### axios 1.12.2

**Purpose**: HTTP client for external API calls.

**Usage**:
- DocuSeal API integration
- LEM Verify (KYC/AML) API
- Xero API integration

**Location**: Various integration clients in `lib/`

---

## Rate Limiting & Caching

### Upstash Redis 1.35.6

**Purpose**: Redis database for rate limiting and caching.

**Configuration**:
```bash
UPSTASH_REDIS_REST_URL="<upstash-url>"
UPSTASH_REDIS_REST_TOKEN="<upstash-token>"
```

**Location**: `lib/rate-limit.ts`

**Usage**:
- tRPC rate limiting (10 requests/10 seconds)
- Webhook rate limiting
- Signing rate limiting (anti-abuse)

---

### @upstash/ratelimit 2.0.6

**Purpose**: Rate limiting library for Upstash Redis.

**Configuration**:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const trpcRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
```

**Applied To**:
- All tRPC procedures
- Webhook endpoints
- Proposal signing endpoints

---

## Error Tracking

### Sentry Next.js 10.20.0

**Purpose**: Error tracking and performance monitoring.

**Configuration**:
```bash
NEXT_PUBLIC_SENTRY_DSN="<sentry-dsn>"
SENTRY_ORG="<org-slug>"
SENTRY_PROJECT="<project-slug>"
SENTRY_AUTH_TOKEN="<auth-token>"
```

**Files**:
- `instrumentation.ts` - Sentry initialization
- `sentry.client.config.ts` - Client-side config
- `sentry.server.config.ts` - Server-side config
- `sentry.edge.config.ts` - Edge runtime config
- `lib/sentry.ts` - Custom error capture helpers

**Error Capture Policy** (per CLAUDE.md):
- **NEVER** use `console.error` in production code
- **ALWAYS** use `Sentry.captureException` instead
- Exceptions: Webhooks, API routes (development-only paths)

**Usage**:
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: "riskyOperation" },
    extra: { userId: ctx.authContext.userId },
  });
  toast.error("Something went wrong");
}
```

---

## Notifications

### react-hot-toast 2.6.0

**Purpose**: Toast notification library.

**Configuration**: `app/layout.tsx`
```typescript
import { Toaster } from "react-hot-toast";

<Toaster position="top-right" />
```

**Usage**:
```typescript
import toast from "react-hot-toast";

toast.success("Client created!");
toast.error("Failed to save");
toast.loading("Saving...");
```

**Why react-hot-toast** (per CLAUDE.md):
- Required by project standards
- Do NOT use other toast libraries

---

## Drag & Drop

### dnd-kit 6.3.1 + sortable 10.0.0

**Purpose**: Drag-and-drop functionality for kanban boards.

**Usage**: Proposal pipeline kanban board.

**Features**:
- Accessible drag-and-drop
- Touch support
- Sortable lists
- Collision detection

**Location**: `components/proposal-hub/kanban/`

---

## Development Tools

### Biome 2.2.0

**Purpose**: Fast linter and formatter (replaces ESLint + Prettier).

**Configuration**: `biome.json`
```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  }
}
```

**Commands**:
```bash
pnpm lint        # Run linter
pnpm lint:fix    # Auto-fix issues
pnpm format      # Format code
```

**Why Biome**:
- 100x faster than ESLint
- All-in-one tool (lint + format)
- Zero config for Next.js/React

---

### Vitest 3.2.4

**Purpose**: Fast unit testing framework (Vite-powered).

**Configuration**: `vitest.config.ts`
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

**Commands**:
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI
pnpm test:coverage     # Coverage report
```

**Test Files**: `*.test.ts`, `*.test.tsx`

---

### tsx 4.20.6

**Purpose**: Execute TypeScript files directly (used for scripts).

**Usage**:
```bash
tsx -r dotenv/config scripts/seed.ts dotenv_config_path=.env.local
```

**Scripts**:
- `scripts/seed.ts` - Database seeding
- `scripts/migrate.ts` - Migration runner
- `scripts/seed-auth-users.ts` - Auth user seeding

---

### dotenv 17.2.2

**Purpose**: Load environment variables from `.env.local`.

**Usage**: Scripts and local development.

**Configuration**: `.env.local`
```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
```

---

## Third-Party Integrations

### DocuSeal (E-Signature)

**Purpose**: Self-hosted e-signature for proposals.

**Configuration**:
```bash
DOCUSEAL_HOST="http://localhost:3030"
DOCUSEAL_API_KEY="<from-docuseal-ui>"
DOCUSEAL_SECRET_KEY="<openssl rand -base64 32>"
DOCUSEAL_WEBHOOK_SECRET="<openssl rand -base64 32>"
```

**Location**: `lib/docuseal/client.ts`

**Docker Setup**: `docker-compose.yml`
```yaml
docuseal:
  image: docuseal/docuseal:latest
  ports: ["3030:3000"]
```

**Webhook**: `/api/webhooks/docuseal`

---

### LEM Verify (KYC/AML)

**Purpose**: Know Your Customer (KYC) and Anti-Money Laundering (AML) checks.

**Configuration**:
```bash
LEMVERIFY_API_KEY="<lemverify-api-key>"
```

**Location**: `lib/kyc/lemverify-client.ts`

**Features**:
- Identity verification
- Document verification
- AML screening
- Business verification

---

### Xero (Accounting)

**Purpose**: Accounting software integration (partial implementation).

**Status**: ⚠️ Partial implementation - not production-ready

**Configuration**:
```bash
XERO_CLIENT_ID="<xero-client-id>"
XERO_CLIENT_SECRET="<xero-secret>"
```

**Location**: `lib/xero/client.ts`

---

## Infrastructure

### Docker Compose

**Purpose**: Local development environment orchestration.

**Services**:
- PostgreSQL 14
- MinIO (S3-compatible storage)
- DocuSeal (e-signature)

**File**: `docker-compose.yml`

**Commands**:
```bash
docker compose up -d        # Start all services
docker compose down         # Stop all services
docker compose logs -f      # View logs
```

---

### MinIO

**Purpose**: S3-compatible object storage for local development.

**Configuration**:
```yaml
minio:
  image: minio/minio
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
```

**Setup Script**: `scripts/setup-minio.sh`

**Web Console**: http://localhost:9001

---

## Production Deployment

### Target Platform: Coolify (Hetzner)

**Deployment Method**: Docker container via Coolify

**Environment Variables**: `.env.production.example`

**Build Process**:
```bash
pnpm build     # Next.js production build
pnpm start     # Production server
```

**Required Environment Variables**:
- `DATABASE_URL` - Managed PostgreSQL
- `BETTER_AUTH_SECRET` - Production secret
- `S3_*` - Hetzner Object Storage
- `RESEND_API_KEY` - Email service
- `SENTRY_DSN` - Error tracking
- `UPSTASH_*` - Redis rate limiting

---

## Summary

**Total Dependencies**: ~100 packages

**Key Technology Decisions**:

| Decision | Reason |
|----------|--------|
| Next.js 15 | App Router, Server Components, modern React features |
| Turbopack | 10x faster builds, native TypeScript support |
| Better Auth | Dual auth systems, Microsoft OAuth, session management |
| tRPC | End-to-end type safety, eliminates REST boilerplate |
| Drizzle ORM | SQL-like syntax, zero overhead, excellent TypeScript |
| Tailwind v4 | Utility-first, design tokens, rapid development |
| shadcn/ui | Copy-paste components, full customization, Radix primitives |
| Biome | 100x faster linting, all-in-one tool |
| Vitest | Fast testing, Vite-powered, modern DX |
| PostgreSQL | ACID compliance, JSON support, performance |

**Performance Characteristics**:
- Cold start: ~2s (Turbopack)
- HMR: <100ms (Turbopack)
- Build time: ~3 minutes (production)
- Bundle size: ~500KB (client JS)

---

## Related Documentation

- [System Overview](system-overview.md) - High-level architecture
- [Coding Standards](coding-standards.md) - Coding conventions
- [Source Tree](source-tree.md) - Directory structure
- [API Design](api-design.md) - tRPC patterns

---

**For questions or updates, contact the architecture team.**
