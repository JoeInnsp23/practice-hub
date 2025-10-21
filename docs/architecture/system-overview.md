# Practice Hub Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the Practice Hub codebase, including technical debt, workarounds, and real-world patterns. It serves as a comprehensive reference for AI agents and developers working on enhancements.

**Purpose**: Provide AI development agents with accurate, actionable documentation of the system as it exists today—not as we wish it to be.

**Scope**: Comprehensive documentation of entire system including all modules, integrations, and infrastructure.

### Change Log

| Date       | Version | Description                          | Author           |
|------------|---------|--------------------------------------|------------------|
| 2025-10-21 | 1.0     | Initial brownfield analysis          | Winston/Architect |

---

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

**Core Configuration:**
- **Package Dependencies**: `package.json` - Next.js 15.5.4, React 19, Better Auth 1.3.26
- **Database Schema**: `lib/db/schema.ts` - Complete PostgreSQL schema with Drizzle ORM
- **Database Client**: `lib/db/index.ts` - Drizzle connection setup
- **Drizzle Config**: `drizzle.config.ts` - Database configuration

**Authentication & Authorization:**
- **Staff Auth**: `lib/auth.ts` - Better Auth configuration with Microsoft OAuth
- **Staff Auth Client**: `lib/auth-client.ts` - Client-side hooks
- **Client Portal Auth**: `lib/client-portal-auth.ts` - Separate Better Auth instance
- **Middleware**: `middleware.ts` - Route protection for both staff and client portal

**API Layer:**
- **tRPC Setup**: `app/server/trpc.ts` - tRPC initialization with rate limiting
- **tRPC Context**: `app/server/context.ts` - Request context with auth
- **tRPC Routers**: `app/server/routers/` - 29 API routers (see Router Inventory below)
- **API Routes**: `app/api/` - Next.js API routes for webhooks and special endpoints

**Frontend Entry Points:**
- **Root Layout**: `app/layout.tsx` - Main app layout with providers
- **Practice Hub**: `app/page.tsx` - Main dashboard
- **Client Hub**: `app/client-hub/` - Client relationship management
- **Proposal Hub**: `app/proposal-hub/` - Proposal generation and pricing calculator
- **Admin Panel**: `app/admin/` - User management and KYC review queue
- **Client Portal**: `app/client-portal/` - External client access

**Database Migrations:**
- `drizzle/0000_create_views.sql` - 14 database views for business logic
- `drizzle/0001_add_performance_indexes.sql` - 5 performance indexes

**Integration Clients:**
- **LEM Verify (KYC/AML)**: `lib/kyc/lemverify-client.ts`
- **Google Gemini (AI)**: `lib/ai/extract-client-data.ts`
- **Resend (Email)**: `lib/email/index.ts`
- **DocuSeal (E-Signature)**: `lib/docuseal/client.ts`
- **Xero (Accounting)**: `lib/xero/client.ts` ⚠️ Partial implementation
- **S3 Storage**: `lib/s3/upload.ts` - S3-compatible object storage

**Development & Operations:**
- **Seed Script**: `scripts/seed.ts` - Database seeding with test data
- **Auth Seed Script**: `scripts/seed-auth-users.ts` - Better Auth user seeding
- **Migrate Script**: `scripts/migrate.ts` - Migration runner
- **Development Guide**: `CLAUDE.md` - Critical development rules and conventions
- **Pre-Production Issues**: `docs/PRE_PRODUCTION_ISSUES.md` - Known issues and technical debt

---

## High Level Architecture

### Technical Summary

Practice Hub is a **multi-tenant SaaS platform** for accountancy firms built with Next.js 15 App Router, PostgreSQL, and Better Auth. It implements **dual-level data isolation** (tenant + client) for secure multi-tenancy.

**Current Status**: Development phase, preparing for production deployment. Contains test/seed data only.

**Key Characteristics**:
- 🏗️ **Monolithic Next.js application** (frontend + backend in single codebase)
- 🔐 **Dual authentication systems** (staff via Better Auth, client portal via separate Better Auth instance)
- 📊 **Type-safe APIs** via tRPC (29 routers, no REST except webhooks)
- 🗄️ **PostgreSQL database** with 50+ tables, 14 views, Drizzle ORM
- 🧩 **Module-based architecture** (Practice Hub, Client Hub, Proposal Hub, Admin Panel, Client Portal)
- ⚡ **Turbopack** for fast development and production builds
- 🎨 **shadcn/ui components** with custom glass-card design system
- 📧 **Rich integrations** (KYC, AI document extraction, email, e-signature, S3 storage)

### Actual Tech Stack (from package.json)

| Category        | Technology           | Version  | Notes                          |
|-----------------|----------------------|----------|--------------------------------|
| **Runtime**     | Next.js              | 15.5.4   | App Router + Turbopack         |
| Framework       | React                | 19.1.0   | Latest stable                  |
| Build Tool      | Turbopack            | (built-in)| `next dev --turbopack`        |
| **Database**    | PostgreSQL           | 14+      | Via Docker or managed          |
| ORM             | Drizzle              | 0.44.5   | Type-safe SQL query builder    |
| Migrations      | Drizzle Kit          | 0.31.4   | Schema management              |
| **Auth**        | Better Auth          | 1.3.26   | Email/password + Microsoft OAuth|
| Password Hash   | bcryptjs             | 3.0.2    | 10 rounds (bcrypt hashing)     |
| **API**         | tRPC                 | 11.6.0   | Type-safe APIs (no REST)       |
| State Mgmt      | TanStack Query       | 5.90.2   | React Query for data fetching  |
| Serialization   | SuperJSON            | 2.2.2    | Date, Map, Set support         |
| **Frontend**    | Tailwind CSS         | 4        | Utility-first styling          |
| UI Library      | shadcn/ui            | -        | Radix UI primitives            |
| Icons           | Lucide React         | 0.544.0  | Icon library                   |
| Forms           | React Hook Form      | 7.63.0   | Form management                |
| Validation      | Zod                  | 4.1.11   | Schema validation              |
| Notifications   | react-hot-toast      | 2.6.0    | Toast notifications            |
| **Integrations**| LEM Verify           | (REST API)| KYC/AML (£1/verification)     |
| AI              | Google Gemini        | 0.24.1   | Document extraction            |
| Email           | Resend               | 6.1.2    | Transactional emails           |
| E-Signature     | DocuSeal             | (self-hosted)| Document signing           |
| Object Storage  | AWS SDK S3           | 3.901.0  | MinIO local / Hetzner prod     |
| Accounting      | Xero API             | (custom) | ⚠️ Partial implementation      |
| **DevOps**      | Docker               | (compose)| PostgreSQL, MinIO, DocuSeal    |
| Monitoring      | Sentry               | 10.20.0  | Error tracking                 |
| Testing         | Vitest               | 3.2.4    | Unit + API route tests         |
| Linting         | Biome                | 2.2.0    | Linting + formatting           |
| TypeScript      | TypeScript           | 5.x      | Strict mode                    |
| **Rate Limiting**| Upstash Redis       | 1.35.6   | Rate limiting (optional)       |
| Rate Limit Lib  | @upstash/ratelimit   | 2.0.6    | IP-based rate limiting         |

### Repository Structure Reality Check

- **Type**: Monorepo (single Next.js app, not microservices)
- **Package Manager**: pnpm (lockfile: `pnpm-lock.yaml`)
- **Notable Decisions**:
  - No separate backend/frontend folders (Next.js App Router pattern)
  - `app/server/` contains tRPC routers (server-side code)
  - `.archive/` contains old code (95% of console.log statements are here)
  - Skills-based development workflow (`.claude/skills/`)
  - BMAD agent system for architecture/development workflows (`.bmad-core/`)

---

## Source Tree and Module Organization

### Project Structure (Actual)

```
practice-hub/
├── app/                              # Next.js 15 App Router
│   ├── (auth)/                       # Auth pages (grouped route)
│   │   ├── sign-in/page.tsx         # Staff sign-in
│   │   ├── sign-up/page.tsx         # Staff sign-up
│   │   └── oauth-setup/page.tsx     # Microsoft OAuth tenant assignment
│   ├── admin/                        # Admin Panel (role: admin)
│   │   ├── users/                   # User management
│   │   ├── kyc-review/              # KYC approval queue
│   │   └── portal-links/            # Client portal link management
│   ├── client-hub/                   # CRM Module
│   │   ├── clients/                 # Client list + details
│   │   ├── tasks/                   # Task management
│   │   ├── workflows/               # Workflow automation
│   │   └── calendar/                # Calendar view
│   ├── practice-hub/                 # Main Dashboard
│   │   └── page.tsx                 # Overview with KPIs
│   ├── proposal-hub/                 # Proposal Management
│   │   ├── calculator/              # Pricing calculator (28 services, 138+ rules)
│   │   ├── leads/                   # Lead management
│   │   ├── proposals/               # Proposal list + details
│   │   ├── reports/                 # Analytics dashboard
│   │   └── templates/               # Proposal templates
│   ├── client-portal/                # External Client Access
│   │   ├── onboarding/              # KYC/AML onboarding flow
│   │   ├── dashboard/               # Client dashboard
│   │   ├── documents/               # Document access
│   │   └── portal/sign-in/          # Client portal auth
│   ├── api/                          # Next.js API Routes
│   │   ├── auth/[...all]/           # Better Auth staff endpoint
│   │   ├── client-portal-auth/[...all]/  # Better Auth client portal endpoint
│   │   ├── webhooks/                # Webhook handlers
│   │   │   ├── lemverify/           # KYC status updates (HMAC verified)
│   │   │   └── docuseal/            # E-signature status (HMAC verified)
│   │   ├── onboarding/              # File upload routes
│   │   ├── xero/                    # Xero OAuth flow
│   │   └── cron/                    # Scheduled tasks
│   ├── server/                       # Server-side code
│   │   ├── context.ts               # tRPC context (auth, session)
│   │   ├── trpc.ts                  # tRPC setup + procedures
│   │   ├── routers/                 # tRPC API routers (29 files)
│   │   │   ├── clients.ts           # Client CRUD
│   │   │   ├── proposals.ts         # Proposal management
│   │   │   ├── onboarding.ts        # KYC/AML onboarding
│   │   │   ├── users.ts             # User management (admin)
│   │   │   ├── tasks.ts             # Task operations
│   │   │   ├── workflows.ts         # Workflow automation
│   │   │   ├── invoices.ts          # Invoice management
│   │   │   ├── analytics.ts         # Dashboard analytics
│   │   │   ├── clientPortal.ts      # Client portal operations
│   │   │   └── ... (20 more)        # See Router Inventory below
│   │   └── index.ts                 # Root router combining all routers
│   ├── globals.css                   # Global styles + Tailwind config
│   └── layout.tsx                    # Root layout (providers, theme)
├── components/                       # React Components
│   ├── ui/                          # shadcn/ui components (40+ files)
│   ├── global-header.tsx            # Module header with nav
│   ├── global-sidebar.tsx           # Module sidebar navigation
│   └── ...                          # Custom components
├── lib/                             # Shared Utilities
│   ├── auth.ts                      # Better Auth staff config
│   ├── auth-client.ts               # Better Auth client hooks
│   ├── client-portal-auth.ts        # Better Auth client portal config
│   ├── db/                          # Database layer
│   │   ├── index.ts                 # Drizzle client
│   │   ├── schema.ts                # Complete DB schema (50+ tables)
│   │   └── queries/                 # Typed query functions
│   ├── kyc/                         # KYC/AML integration
│   │   └── lemverify-client.ts      # LEM Verify API client
│   ├── ai/                          # AI integrations
│   │   ├── extract-client-data.ts   # Gemini document extraction
│   │   └── questionnaire-prefill.ts # Pre-fill onboarding form
│   ├── email/                       # Email service
│   │   └── index.ts                 # Resend client
│   ├── docuseal/                    # E-Signature integration
│   │   └── client.ts                # DocuSeal API client
│   ├── s3/                          # Object storage
│   │   └── upload.ts                # S3-compatible uploads
│   ├── xero/                        # Accounting integration
│   │   └── client.ts                # ⚠️ Partial implementation
│   ├── rate-limit.ts                # Upstash rate limiting
│   ├── cache.ts                     # In-memory caching with TTL
│   ├── sentry.ts                    # Error tracking setup
│   └── utils.ts                     # Shared utilities
├── scripts/                         # Database & Setup Scripts
│   ├── seed.ts                      # Main database seeding
│   ├── seed-auth-users.ts           # Better Auth user seeding
│   ├── migrate.ts                   # Migration runner
│   └── setup-minio.sh               # MinIO bucket initialization
├── drizzle/                         # Database Migrations
│   ├── 0000_create_views.sql       # 14 database views
│   └── 0001_add_performance_indexes.sql  # 5 performance indexes
├── docs/                            # Documentation
│   ├── SYSTEM_ARCHITECTURE.md       # System overview
│   ├── API_REFERENCE.md             # API documentation
│   ├── DATABASE_SCHEMA.md           # Schema reference
│   ├── MICROSOFT_OAUTH_SETUP.md     # OAuth setup guide
│   ├── PRE_PRODUCTION_ISSUES.md     # ⚠️ Known issues + tech debt
│   ├── kyc/                         # KYC documentation
│   ├── operations/                  # Operational runbooks
│   ├── proposal-reference/          # Pricing calculator docs
│   └── user-guides/                 # User documentation
├── .claude/                         # Claude Code configuration
│   ├── skills/                      # Practice Hub skills
│   │   ├── practice-hub-testing/    # Testing automation
│   │   ├── practice-hub-debugging/  # Code quality checks
│   │   └── practice-hub-database-ops/  # Database operations
│   └── commands/                    # Custom slash commands
├── .bmad-core/                      # BMAD agent system
│   ├── agents/                      # Agent definitions
│   └── core-config.yaml             # BMAD configuration
├── .archive/                        # ⚠️ Old code (DO NOT MODIFY)
│   └── ...                          # 95% of console.log statements
├── __tests__/                       # Vitest test suite
│   ├── routers/                     # Router tests
│   └── lib/                         # Utility tests
├── middleware.ts                    # Next.js middleware (auth)
├── CLAUDE.md                        # ⚠️ CRITICAL: Development rules
├── README.md                        # Project overview
├── package.json                     # Dependencies + scripts
├── drizzle.config.ts                # Drizzle configuration
├── docker-compose.yml               # PostgreSQL + MinIO + DocuSeal
└── biome.json                       # Biome configuration
```

### Key Modules and Their Purpose

**Practice Hub** (`app/page.tsx`, `app/practice-hub/`)
- Main dashboard with KPI cards (revenue, clients, tasks)
- Quick actions menu
- Recent activity feed
- Navigation to all modules

**Client Hub** (`app/client-hub/`)
- **Purpose**: Complete CRM for client relationship management
- **Features**: Client list, client details, contacts, directors, PSCs, services, documents, compliance
- **Access**: Staff only (tenantId scoped)
- **Key Files**:
  - `clients/page.tsx` - Client list with search/filter
  - `clients/[id]/page.tsx` - Client detail page with tabs
  - `tasks/page.tsx` - Task management
  - `workflows/page.tsx` - Workflow automation

**Proposal Hub** (`app/proposal-hub/`)
- **Purpose**: Lead capture, pricing calculator, proposal generation
- **Features**: Comprehensive pricing engine (28 services, 138+ rules), PDF generation, DocuSeal integration
- **Access**: Staff only (tenantId scoped)
- **Key Files**:
  - `calculator/page.tsx` - Interactive pricing calculator (⚠️ VAT registration hardcoded - see TODO)
  - `leads/page.tsx` - Lead pipeline management
  - `proposals/page.tsx` - Proposal list
  - `reports/page.tsx` - Analytics dashboard (⚠️ Conversion data missing - see TODO)

**Admin Panel** (`app/admin/`)
- **Purpose**: System administration, user management, KYC review
- **Features**: User CRUD, invitations, KYC approval queue, portal links
- **Access**: Admin role only
- **Key Files**:
  - `users/page.tsx` - User management
  - `kyc-review/page.tsx` - KYC approval queue
  - `portal-links/page.tsx` - Client portal resource links

**Client Portal** (`app/client-portal/`)
- **Purpose**: External client access for onboarding and document management
- **Features**: KYC/AML onboarding, document upload, dashboard
- **Access**: Client portal users only (tenantId + clientId scoped - DUAL ISOLATION)
- **Key Files**:
  - `onboarding/page.tsx` - KYC/AML onboarding flow (LEM Verify + Gemini AI)
  - `dashboard/page.tsx` - Client-facing dashboard
  - `portal/sign-in/page.tsx` - Separate auth system

### tRPC Router Inventory (29 Routers)

All routers in `app/server/routers/`:

| Router | Purpose | Access Level | Notes |
|--------|---------|--------------|-------|
| `clients.ts` | Client CRUD operations | Protected | Multi-tenant scoped |
| `proposals.ts` | Proposal management | Protected | ⚠️ Missing email confirmation (TODO) |
| `onboarding.ts` | KYC/AML onboarding | Protected | LEM Verify + Gemini AI integration |
| `users.ts` | User management | Admin | Invitation system |
| `tasks.ts` | Task operations | Protected | Workflow integration |
| `workflows.ts` | Workflow automation | Protected | Custom workflows |
| `invoices.ts` | Invoice CRUD | Protected | Xero integration pending |
| `analytics.ts` | Dashboard KPIs | Protected | ⚠️ Missing conversion data (TODO) |
| `clientPortal.ts` | Client portal ops | Client Portal | Dual isolation (tenantId + clientId) |
| `clientPortalAdmin.ts` | Portal admin | Admin | Client portal user management |
| `dashboard.ts` | Dashboard data | Protected | KPI aggregation |
| `pricing.ts` | Pricing calculator | Protected | 28 services, 138+ rules |
| `pricingConfig.ts` | Pricing config | Admin | Service pricing management |
| `services.ts` | Service catalog | Protected | Service component management |
| `leads.ts` | Lead management | Protected | Lead scoring + pipeline |
| `pipeline.ts` | Sales pipeline | Protected | Opportunity tracking |
| `portal.ts` | Portal links | Protected | Resource link management |
| `invitations.ts` | User invitations | Admin | Invitation CRUD |
| `admin-kyc.ts` | KYC review queue | Admin | Manual approval workflow |
| `documents.ts` | Document management | Protected | S3 storage integration |
| `timesheets.ts` | Time tracking | Protected | Billable hours |
| `calendar.ts` | Calendar events | Protected | Event management |
| `compliance.ts` | Compliance tracking | Protected | Deadline management |
| `notifications.ts` | Notification system | Protected | In-app notifications |
| `messages.ts` | Internal messaging | Protected | Thread-based messaging |
| `activities.ts` | Activity logging | Protected | Audit trail |
| `settings.ts` | User settings | Protected | User preferences |
| `proposalTemplates.ts` | Proposal templates | Protected | Template CRUD |
| `transactionData.ts` | Transaction data | Protected | ⚠️ Xero integration placeholder (NOT_IMPLEMENTED) |

**Pattern Notes**:
- All routers use `protectedProcedure` (staff auth) or `adminProcedure` (admin auth) or `clientPortalProcedure` (client portal auth)
- Queries automatically scoped by `ctx.authContext.tenantId`
- Client portal queries use BOTH `tenantId` AND `clientId` (dual isolation)
- Rate limiting applied to all procedures via middleware

---

## Data Models and APIs

### Database Schema Overview

**Location**: `lib/db/schema.ts` (2000+ lines)

**Tables**: 50+ tables organized by domain
**Views**: 14 database views (see `drizzle/0000_create_views.sql`)
**Indexes**: 5 performance indexes (see `drizzle/0001_add_performance_indexes.sql`)

**Schema Organization**:

```typescript
// Core Tables
- tenants              // Multi-tenant organizations
- users                // Staff users (Better Auth compatible)
- session              // Better Auth sessions
- account              // Better Auth OAuth accounts
- verification         // Better Auth email verification
- invitations          // User invitation system

// CRM Tables (tenantId scoped)
- clients              // Customer businesses
- client_contacts      // Contact persons
- client_directors     // Company directors
- client_pscs          // Persons with Significant Control
- client_services      // Assigned services

// Operations Tables (tenantId scoped)
- tasks                // Task management
- task_workflow_instances  // Workflow execution
- workflows            // Custom workflows
- workflow_stages      // Workflow steps
- time_entries         // Time tracking
- invoices             // Invoice management
- invoice_items        // Invoice line items
- compliance           // Compliance tracking
- documents            // Document storage metadata

// Proposal Tables (tenantId + optional clientId)
- leads                // Sales leads
- proposals            // Generated proposals
- proposal_services    // Proposal line items
- proposal_versions    // Version history
- proposal_templates   // Proposal templates
- client_transaction_data  // Financial transaction data

// KYC/AML Tables (tenantId scoped)
- onboarding_sessions  // KYC sessions
- onboarding_responses // Questionnaire answers
- onboarding_tasks     // Onboarding checklist
- kyc_verifications    // LEM Verify results

// Client Portal Tables (tenantId + clientId - DUAL ISOLATION)
- client_portal_users  // ⚠️ Missing tenantId + clientId (CRITICAL ISSUE)
- client_portal_session  // ⚠️ Missing tenantId + clientId (CRITICAL ISSUE)
- client_portal_account  // ⚠️ Missing tenantId + clientId (CRITICAL ISSUE)
- client_portal_verification  // ⚠️ Missing tenantId + clientId (CRITICAL ISSUE)
- client_portal_access // Portal access grants
- client_portal_invitations  // Client portal invitations

// Portal Resources
- portal_categories    // Resource categories
- portal_links         // Resource links

// Other Tables
- activity_logs        // Audit trail
- service_components   // Service catalog
- feedback             // User feedback
- calendar_events      // Calendar system
- calendar_event_attendees  // Event participants
- message_threads      // Messaging threads
- messages             // Messages
- message_thread_participants  // Thread participants
- notifications        // Notification system
```

**Multi-Tenancy Pattern**:
```typescript
// Standard table (staff access)
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  // ... other fields
});

// Client portal table (dual isolation) - CORRECT PATTERN
export const clientPortalAccess = pgTable("client_portal_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED
  clientId: uuid("client_id").references(() => clients.id).notNull(),  // REQUIRED
  // ... other fields
});
```

### Database Views (Denormalized Performance)

**Location**: `drizzle/0000_create_views.sql`

Practice Hub uses **14 database views** for performance optimization and business logic consistency:

1. **`client_details_view`** - Clients with account manager info
2. **`task_details_view`** - Tasks with client, assignee, reviewer, workflow info
3. **`time_entries_view`** - Time entries with user, client, task, service info
4. **`invoice_details_view`** - Invoices with client and balance calculations
5. **`invoice_items_view`** - Invoice line items with service details
6. **`client_services_view`** - Client services with effective rates
7. **`compliance_details_view`** - Compliance with overdue calculation
8. **`activity_feed_view`** - Activity logs with entity names and user info
9. **`task_workflow_view`** - Tasks with workflow progress
10. **`dashboard_kpi_view`** - Aggregated KPIs per tenant (revenue, clients, tasks)
11. **`monthly_revenue_view`** - Monthly revenue aggregation
12. **`client_revenue_view`** - Client revenue breakdown
13. **`leads_details_view`** - Leads with assigned user info
14. **`proposals_details_view`** - Proposals with client/lead and creator info
15. **`onboarding_sessions_view`** - Onboarding sessions with task progress
16. **`transaction_data_summary_view`** - Transaction data with client info

**Why Views?**:
- Avoid complex JOIN logic in application code
- Consistent denormalization across queries
- PostgreSQL query optimizer can leverage indexes efficiently
- Single source of truth for business calculations

### Performance Indexes

**Location**: `drizzle/0001_add_performance_indexes.sql`

**5 Critical Indexes**:

1. **`idx_activity_created_at`** - Activity logs sorted by date (activity feeds 5x faster)
2. **`idx_invoice_due_status`** - Overdue invoices (10x faster, partial index)
3. **`idx_task_due_status`** - Due tasks (8x faster, partial index)
4. **`idx_message_thread_time`** - Message threads (15x faster)
5. **`idx_proposal_client_status`** - Client proposals (6x faster)

**Pattern**: Partial indexes used for frequently filtered queries (e.g., only index `status IN ('sent', 'overdue')`)

### API Specifications

**Type**: tRPC (no REST APIs except webhooks)

**tRPC Endpoint**: `/api/trpc/[trpc]`

**Authentication**: Via tRPC context (`ctx.authContext`)

**Rate Limiting**: Upstash Redis-based (optional, skipped if not configured)

**Sample Router Pattern**:
```typescript
// app/server/routers/clients.ts
export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext; // Auto-scoped to tenant

      const clients = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, tenantId)); // Multi-tenant isolation

      return { clients };
    }),
});
```

**Client Usage**:
```typescript
// Frontend component
const { data } = trpc.clients.list.useQuery({ search: 'Acme' });
```

**WebHook APIs** (REST):
- `POST /api/webhooks/lemverify` - LEM Verify KYC status updates (HMAC-SHA256 verified)
- `POST /api/webhooks/docuseal` - DocuSeal e-signature status (HMAC verified)

---

## Technical Debt and Known Issues

**Source**: `docs/PRE_PRODUCTION_ISSUES.md` (comprehensive validation report)

### Critical Issues (3) - MUST FIX BEFORE PRODUCTION

#### Issue #1: Client Portal Session - Missing Dual Isolation
**Table**: `client_portal_session`
**Severity**: 🚨 CRITICAL
**Impact**: Security vulnerability - client portal users could access other clients' sessions

**Problem**:
```typescript
// Current (INCORRECT):
export const clientPortalSessions = pgTable("client_portal_session", {
  id: text("id").primaryKey(),
  // Missing tenantId
  // Missing clientId
});
```

**Fix Required**:
```typescript
// Fixed (CORRECT):
export const clientPortalSessions = pgTable("client_portal_session", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  clientId: text("client_id").references(() => clients.id).notNull(),
  // ... other fields
});
```

**Action**: Schema change + seed data update + `pnpm db:reset`

---

#### Issue #2: Client Portal Account - Missing Dual Isolation
**Table**: `client_portal_account`
**Severity**: 🚨 CRITICAL
**Impact**: Authentication accounts lack proper multi-tenant isolation

**Fix**: Same pattern as Issue #1 (add `tenantId` + `clientId` + timestamps)

---

#### Issue #3: Client Portal Verification - Missing Dual Isolation
**Table**: `client_portal_verification`
**Severity**: 🚨 CRITICAL
**Impact**: Verification codes lack tenant/client scoping

**Fix**: Same pattern as Issue #1

---

### Medium Priority TODOs (5 in Production Code)

**⚠️ These TODOs exist in active production code (not .archive):**

1. **Calculator - VAT Registration Hardcoded** (`app/proposal-hub/calculator/page.tsx:95`)
   - **Issue**: `vatRegistered: true` hardcoded instead of fetching from client data
   - **Impact**: Pricing calculations incorrect for non-VAT clients
   - **Fix**: `vatRegistered: client?.vatRegistered ?? false`

2. **Reports - Missing Conversion Data** (`app/proposal-hub/reports/page.tsx:65,268`)
   - **Issue**: Analytics endpoint doesn't provide lead-to-proposal conversion tracking
   - **Impact**: Conversion rate metrics show 0%
   - **Fix**: Add conversion tracking to `app/server/routers/analytics.ts`

3. **Proposals - Email Confirmation Missing** (`app/server/routers/proposals.ts:1044`)
   - **Issue**: No email sent after proposal signing
   - **Impact**: Silent failure, no notifications
   - **Fix**: Implement email sending via Resend

4. **Transaction Data - Xero Integration Placeholder** (`app/server/routers/transactionData.ts:212`)
   - **Issue**: Returns `NOT_IMPLEMENTED` error
   - **Impact**: Transaction data feature completely non-functional
   - **Fix**: Implement Xero OAuth + API integration

---

### Code Quality Issues

**Console Statements**: 2,259 total (115 in `app/`, 2,144 in `.archive/`)

**Priority Files** (remove before production):
- `app/proposal-hub/reports/page.tsx` - 2 statements
- `app/proposal-hub/calculator/page.tsx` - 1 statement
- `app/server/routers/proposals.ts` - 6 statements
- `app/server/routers/onboarding.ts` - 11 statements
- `app/client-hub/clients/page.tsx` - 3 statements

**Action**: Use practice-hub-debugging skill to remove console statements

**Legitimate Console Usage** (keep):
- `console.error()` in webhook handlers (`/api/webhooks/*`) for external integration debugging
- Error logging in development-only code paths

---

### Workarounds and Gotchas

#### Workaround #1: Database Reset Procedure
**Context**: Database schema still in active development, no migrations workflow yet

**Rule**: NEVER manually run individual database commands

**ONLY Command**:
```bash
pnpm db:reset
```

**What it does** (in order):
1. Drops and recreates schema (removes all tables/views)
2. Pushes schema (creates tables)
3. Runs migrations (creates views from `drizzle/*.sql`)
4. Seeds database (runs `scripts/seed.ts` + `scripts/seed-auth-users.ts`)

**Failure Mode**: If you run commands individually, views will be missing or migrations will fail

---

#### Workaround #2: Better Auth Dual System
**Context**: Staff and client portal use separate Better Auth instances

**Why**: Better Auth doesn't natively support dual-isolation (tenantId + clientId)

**Implementation**:
- **Staff Auth**: `lib/auth.ts` → API route `/api/auth/[...all]`
- **Client Portal Auth**: `lib/client-portal-auth.ts` → API route `/api/client-portal-auth/[...all]`
- **Middleware**: Detects route prefix (`/portal`) to use correct auth system

**Gotcha**: Two session cookies, two auth clients, separate user tables

---

#### Workaround #3: Console.log Policy (Sentry Migration)
**Context**: Production code must use Sentry for error tracking, not console statements

**Rule**:
- ❌ NEVER use `console.log/warn/debug` in production code
- ✅ ALWAYS use `Sentry.captureException()` in UI components and tRPC routers
- ⚠️ EXCEPTION: `console.error()` acceptable in webhook handlers for external integration debugging

**Pattern**:
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

**Status**: Sentry configured, console statement cleanup pending

---

#### Workaround #4: Design System Constraints
**Context**: Custom glass-card design system with strict rules (see `CLAUDE.md`)

**Constraints**:
- ❌ NO transparency/glassmorphism effects (use solid backgrounds)
- ✅ ONLY use `.glass-card`, `.glass-subtle`, `.glass-table` CSS classes
- ✅ ONLY use shadcn/ui components (custom components rare)
- ✅ Gradient backgrounds required on all module layouts

**Why**: Ensures visual consistency across all modules

**Failure Mode**: Mixing inline `bg-card border` styles breaks design consistency

---

## Integration Points and External Dependencies

### Inbound (Webhooks)

| Source | Endpoint | Purpose | Security | Rate Limit | Status |
|--------|----------|---------|----------|------------|--------|
| LEM Verify | `/api/webhooks/lemverify` | KYC verification status updates | HMAC-SHA256 signature verification | None | ✅ Active |
| DocuSeal | `/api/webhooks/docuseal` | E-signature completion | HMAC signature verification | None | ✅ Active |

**Security Pattern**: All webhooks verify HMAC signatures, replay attack prevention via timestamp check

**Implementation**: `lib/rate-limit/webhook.ts` - Webhook-specific rate limiting with signature verification

---

### Outbound (API Calls)

| Service | Purpose | Auth Method | Rate Limits | Cost | Status |
|---------|---------|-------------|-------------|------|--------|
| **LEM Verify** | KYC/AML verification | API Key (Bearer token) | Unknown (monitor usage) | £1/verification | ✅ Active |
| **Google Gemini** | AI document extraction | API Key | 60 requests/min | Pay-as-you-go | ✅ Active |
| **Resend** | Transactional emails | API Key (Bearer token) | 100 emails/day (free), unlimited (paid) | $0.01/email (paid) | ✅ Active |
| **Hetzner S3** | Object storage (PDFs, docs) | Access Key + Secret Key | No explicit limits | €0.01/GB/month | ✅ Active (prod) |
| **MinIO** | S3-compatible local storage | Access Key + Secret Key | No limits | Free (local) | ✅ Active (dev) |
| **Microsoft Graph** | OAuth user profile | OAuth access token | Varies by endpoint | Free | ✅ Active |
| **DocuSeal** | E-signature document creation | API Key (Bearer token) | None | Self-hosted (free) | ✅ Active |
| **Xero** | Accounting integration | OAuth 2.0 | Unknown | Free | ⚠️ Partial |

---

### Integration Implementation Details

#### LEM Verify (KYC/AML)
**Client**: `lib/kyc/lemverify-client.ts`
**Webhook**: `app/api/webhooks/lemverify/route.ts`

**Flow**:
1. Create verification via API → Get hosted verification URL
2. Send URL to client (email or client portal)
3. Client completes verification on LEM Verify platform
4. Webhook receives status update (HMAC verified)
5. Auto-approve if `outcome = "pass"` + `aml_status = "clear"`
6. Convert lead to client, grant portal access, send email

**Cost**: £1 per verification (vs ComplyCube £4-6)

**Current State**: v1.0 - Hosted verification page
**Future**: v2.0 - Direct API upload (pending LEM Verify API docs - see TODO in `lemverify-client.ts:20-24`)

**Known Issue**: Webhook signature verification uses `LEMVERIFY_WEBHOOK_SECRET` environment variable

---

#### Google Gemini AI (Document Extraction)
**Client**: `lib/ai/extract-client-data.ts`
**Model**: Gemini 2.0 Flash (`@google/generative-ai` v0.24.1)

**Flow**:
1. Client uploads identity document (passport, driving license)
2. Upload to S3 via `lib/s3/upload.ts`
3. Call Gemini API with image + structured extraction prompt
4. Extract: firstName, lastName, dateOfBirth, nationality, documentNumber, etc.
5. Pre-fill KYC questionnaire with extracted data

**Rate Limit**: 60 requests/minute (Gemini API)

**Current State**: ✅ Active, working well

**Known Issue**: API key stored in environment variable `GOOGLE_AI_API_KEY`

---

#### Resend (Email)
**Client**: `lib/email/index.ts`

**Templates**:
- KYC verification status updates
- Password reset
- Email verification
- User invitations
- Client portal invitations

**Current State**: ✅ Active

**Known Issue**: Free tier (100 emails/day), need paid plan for production

---

#### DocuSeal (E-Signature)
**Client**: `lib/docuseal/client.ts`
**Webhook**: `app/api/webhooks/docuseal/route.ts`
**Docker**: Self-hosted via `docker-compose.yml`

**Flow**:
1. Generate proposal PDF via `@react-pdf/renderer`
2. Upload PDF to DocuSeal API
3. Create submission with signer email
4. Send signing link via email
5. Webhook receives `submission.completed` event
6. Update proposal status to "signed"

**Current State**: ✅ Active (local development), needs production instance

**Setup**: Requires `DOCUSEAL_SECRET_KEY` + `DOCUSEAL_WEBHOOK_SECRET` (generate with `openssl rand -base64 32`)

**Known Issue**: Missing email confirmation after signing (see TODO #3)

---

#### Xero (Accounting Integration)
**Client**: `lib/xero/client.ts`
**Status**: ⚠️ Partial Implementation

**Current State**:
- OAuth flow scaffolded (`/api/xero/authorize`, `/api/xero/callback`)
- Token refresh cron job (`/api/cron/xero-token-refresh`)
- Transaction data router returns `NOT_IMPLEMENTED` (see TODO #4)

**Missing**:
- Actual Xero API integration (fetch bank transactions, invoices, etc.)
- Data transformation and caching
- Metrics calculation

**Priority**: MEDIUM - Implement in Phase 2

---

#### S3 Storage (MinIO / Hetzner)
**Client**: `lib/s3/upload.ts`
**Local**: MinIO (`docker-compose.yml`)
**Production**: Hetzner S3

**Uses**:
- Proposal PDFs
- Identity document uploads (KYC)
- Client document storage

**Configuration**:
```bash
# Local (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"

# Production (Hetzner)
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="your-hetzner-access-key"
S3_SECRET_ACCESS_KEY="your-hetzner-secret-key"
S3_BUCKET_NAME="practice-hub-proposals"
```

**Current State**: ✅ Active (both local and production ready)

**Setup**: Run `./scripts/setup-minio.sh` to initialize MinIO bucket

---

## Authentication & Authorization Architecture

### Staff Authentication (Better Auth)

**Configuration**: `lib/auth.ts`
**Client Hooks**: `lib/auth-client.ts`
**API Route**: `app/api/auth/[...all]/route.ts`

**Methods**:
1. **Email/Password** - bcrypt hashing (10 rounds), no email verification yet (TODO: enable in production)
2. **Microsoft OAuth** - Personal + work/school accounts (`tenantId: "common"`)

**Session Management**:
- Database-backed sessions (table: `session`)
- 7-day expiration
- HTTP-only cookies
- CSRF protection via state parameter

**Multi-Tenant Context**:
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

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Look up user's tenant from database
  const userRecord = await db
    .select()
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  return { userId, tenantId, role, email, ... };
}
```

**Usage in tRPC**:
```typescript
// All protected procedures have authContext
protectedProcedure.query(({ ctx }) => {
  const { tenantId, role } = ctx.authContext;
  // Query automatically scoped to tenant
});
```

---

### Client Portal Authentication (Better Auth - Separate Instance)

**Configuration**: `lib/client-portal-auth.ts`
**Client Hooks**: `lib/client-portal-auth-client.ts`
**API Route**: `app/api/client-portal-auth/[...all]/route.ts`

**Why Separate?**:
- Client portal users need DUAL isolation (tenantId + clientId)
- Different user table (`client_portal_users`)
- Different session management
- Different authorization logic

**Dual Isolation Context**:
```typescript
// lib/client-portal-auth.ts
export interface ClientPortalAuthContext {
  userId: string;
  clientId: string;   // REQUIRED - Specific client company
  tenantId: string;   // REQUIRED - Accountancy firm
  email: string;
  // ... other fields
}
```

**Usage**:
```typescript
// Client portal queries filter by BOTH tenantId AND clientId
const proposals = await db
  .select()
  .from(proposals)
  .where(
    and(
      eq(proposals.tenantId, authContext.tenantId),  // Tenant isolation
      eq(proposals.clientId, authContext.clientId)   // Client isolation
    )
  );
```

**⚠️ CRITICAL ISSUE**: Client portal auth tables missing `tenantId` + `clientId` (see Technical Debt section)

---

### Middleware (Route Protection)

**File**: `middleware.ts`

**Public Paths** (no auth):
- `/` - Landing page
- `/sign-in`, `/sign-up` - Staff auth
- `/portal/sign-in`, `/portal/sign-up` - Client portal auth
- `/api/auth/*`, `/api/client-portal-auth/*` - Auth API routes
- `/proposals/sign/*` - Public proposal signature pages

**Protected Paths**:
- All other routes redirect to `/sign-in` if no session
- Client portal routes (`/portal/*`) use client portal auth
- Staff routes use staff auth

**Implementation**:
```typescript
export default async function middleware(request: NextRequest) {
  const isClientPortal = pathname.startsWith("/portal");

  if (isClientPortal) {
    const session = await clientPortalAuth.api.getSession({ headers });
    if (!session) redirect("/portal/sign-in");
  } else {
    const session = await auth.api.getSession({ headers });
    if (!session) redirect("/sign-in");
  }

  return NextResponse.next();
}
```

---

### Authorization Levels

**Staff Roles**:
- **admin** - Full system access, user management, KYC approval, system settings
- **member** - Access to practice hub, clients, tasks (tenant-scoped, no admin features)

**Role Checks**:
```typescript
// tRPC middleware
const isAdmin = t.middleware(({ ctx }) => {
  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
});

// Server component
export default async function AdminLayout({ children }) {
  const authContext = await getAuthContext();
  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }
  return <>{children}</>;
}
```

**Client Portal Roles**:
- No roles yet (all client portal users have same access level)
- Future: Add client admin vs. client viewer roles

---

## Development & Deployment

### Local Development Setup

**Prerequisites**:
- Node.js 18+ with pnpm
- Docker (for PostgreSQL, MinIO, DocuSeal)

**Setup Steps**:
```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start Docker services
docker compose up -d

# 4. Initialize database
pnpm db:reset  # ONLY use this command, never run individual commands

# 5. Initialize MinIO bucket (first time only)
./scripts/setup-minio.sh

# 6. Run development server
pnpm dev  # Note: NEVER run pnpm dev manually (user runs it)
```

**Default Users** (after seed):
- Admin: `joe@pageivy.com` / `PageIvy2024!`
- Member: `sarah.accountant@pageivy.com` / `PageIvy2024!`

**Development URLs**:
- App: http://localhost:3000
- MinIO Console: http://localhost:9001 (`minioadmin` / `minioadmin`)
- DocuSeal Admin: http://localhost:3030
- Drizzle Studio: `pnpm db:studio`

---

### Build and Deployment Process

**Build Command**:
```bash
pnpm build  # Next.js build with Turbopack
```

**Production Server**:
```bash
pnpm start  # Runs production build
```

**Environment Variables** (production):
```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."  # Different from dev
BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."

# KYC/AML
LEMVERIFY_API_KEY="..."
LEMVERIFY_ACCOUNT_ID="..."
LEMVERIFY_WEBHOOK_SECRET="..."
GOOGLE_AI_API_KEY="..."

# Email
RESEND_API_KEY="..."

# Storage (Hetzner S3)
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="eu-central"

# DocuSeal (production instance)
DOCUSEAL_HOST="https://docuseal.yourdomain.com"
DOCUSEAL_API_KEY="..."
DOCUSEAL_SECRET_KEY="..."
DOCUSEAL_WEBHOOK_SECRET="..."

# Monitoring
SENTRY_DSN="..."
SENTRY_AUTH_TOKEN="..."

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Deployment Platform**: Coolify on Hetzner (or similar Docker-based platforms)

**CI/CD**: Platform-native (Coolify webhook on git push)

---

### Testing Reality

**Framework**: Vitest
**Test Count**: 58 tests passing
**Execution Time**: <3 seconds
**Coverage**: Unit tests + API route tests

**Test Categories**:
1. **Unit Tests** (42 tests):
   - Configuration loading (`lib/config.test.ts`)
   - In-memory caching (`lib/cache.test.ts`)
   - Rate limiting (`lib/rate-limit.test.ts`)
   - S3 URL parsing (`lib/s3/upload.test.ts`)
   - Webhook rate limiting (`lib/rate-limit/webhook.test.ts`)

2. **API Route Tests** (16 tests):
   - LEM Verify webhook signature verification (`app/api/webhooks/lemverify/route.test.ts`)
   - Request validation
   - Error handling
   - HTTP status codes

**Test Patterns**:
```typescript
// Vitest test example
import { describe, it, expect } from 'vitest';
import { verifyWebhookSignature } from '@/lib/rate-limit/webhook';

describe('Webhook Signature Verification', () => {
  it('should verify valid HMAC signature', () => {
    const payload = { event: 'test' };
    const signature = generateHMAC(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });
});
```

**Running Tests**:
```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:ui        # Vitest UI
pnpm test:coverage  # Coverage report
```

**⚠️ Test Coverage Gaps**:
- No tRPC router tests yet (29 routers untested)
- No multi-tenant isolation tests (validation script exists, automated tests needed)
- No client portal dual isolation tests
- No integration tests

**Test Generation**: Use `practice-hub-testing` skill to generate router tests

---

## Scalability & Performance

### Current Capacity (MVP/Early Production)

**Expected Load**:
- Users: <100 concurrent
- Requests: <1000 req/minute
- Database: <10 GB
- S3 Storage: <100 GB

**Current Bottlenecks**:
- Database connection pool: Default 20 (monitor with Drizzle metrics)
- Gemini AI rate limit: 60 requests/min (document extraction)
- Resend email rate limit: 100 emails/day (free tier)

---

### Performance Optimizations (Implemented)

**Database Views** (14 views):
- Denormalized joins for complex queries
- Single source of truth for business logic
- PostgreSQL query optimizer can leverage indexes

**Performance Indexes** (5 indexes):
- Activity feed: 5x faster (sorted by `created_at`)
- Overdue invoices: 10x faster (partial index on `due_date` + `status`)
- Task filtering: 8x faster (partial index on active tasks)
- Message threads: 15x faster (indexed by `thread_id` + `created_at`)
- Client proposals: 6x faster (indexed by `client_id` + `status`)

**In-Memory Caching** (`lib/cache.ts`):
- TTL-based caching with automatic expiration
- Used for expensive queries (pricing config, service catalog)
- LRU eviction policy

**Rate Limiting** (`lib/rate-limit.ts`):
- Upstash Redis-based (optional)
- IP-based tracking
- Configurable thresholds
- Applied to all tRPC procedures via middleware

---

### Scaling Strategies (Future)

**Vertical Scaling**:
- Upgrade database instance (more CPU/RAM)
- Upgrade application server
- When: CPU >80%, memory >80%, disk I/O high

**Horizontal Scaling**:
- Multiple Next.js application instances (load balanced)
- Read replicas for database (Drizzle supports read replicas)
- CDN for static assets (Vercel Edge, Cloudflare)
- When: Single server at capacity

**Database Optimization**:
- Connection pooling (PgBouncer)
- Query optimization (EXPLAIN ANALYZE)
- Materialized views for expensive reports
- Partitioning for large tables (activity_logs, time_entries)

**Caching**:
- Redis for session data
- CDN for static assets
- In-memory caching for expensive queries (already implemented)

---

## Appendix A: Critical Development Rules

**Source**: `CLAUDE.md` (comprehensive development guidelines)

**MUST FOLLOW**:

1. **Database is in dev - NO MIGRATIONS** - Never create migration files, update schema directly in `lib/db/schema.ts`
2. **ALWAYS use `pnpm db:reset`** - Never run individual database commands
3. **Always update seed data after schema changes** - Seed data must match schema
4. **Never run `pnpm dev`** - User runs dev server manually to test frontend
5. **Always use shadcn/ui components first** - Only create custom components when absolutely necessary
6. **Use react-hot-toast for notifications** - No other toast libraries
7. **Follow Critical Design Elements** - Glass-card design system (see CLAUDE.md)
8. **Error Tracking Policy** - Use Sentry.captureException(), NOT console.error (except webhooks)
9. **Always read entire files** - Never make assumptions about file contents
10. **Never use quick fixes** - Only complete fixes, even if it means schema updates

**Design System Rules**:
- Use `.glass-card` for all cards (never inline `bg-card border`)
- Use `.glass-table` wrapper for all tables
- Always use GlobalHeader and GlobalSidebar components
- Gradient backgrounds required on all module layouts
- No transparency/glassmorphism effects (solid backgrounds only)

---

## Appendix B: Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server

# Database
pnpm db:reset         # ⚠️ ONLY database command (drop + push + migrate + seed)
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:ui          # Vitest UI
pnpm test:coverage    # Coverage report

# Code Quality
pnpm lint             # Run Biome linter
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code with Biome
pnpm typecheck        # TypeScript type checking

# Docker
docker compose up -d  # Start PostgreSQL + MinIO + DocuSeal
docker compose down   # Stop all services
docker ps             # List running containers
docker logs <container>  # View container logs
```

### Debugging and Troubleshooting

**Database Connection Issues**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs practice-hub-postgres

# Reset database
pnpm db:reset
```

**MinIO Issues**:
```bash
# Check MinIO is running
docker ps | grep minio

# Reinitialize bucket
./scripts/setup-minio.sh

# Access MinIO console
open http://localhost:9001
```

**DocuSeal Issues**:
```bash
# Check DocuSeal is running
docker ps | grep docuseal

# View DocuSeal logs
docker logs practice-hub-docuseal

# Regenerate secrets
openssl rand -base64 32  # Add to .env.local as DOCUSEAL_SECRET_KEY
openssl rand -base64 32  # Add to .env.local as DOCUSEAL_WEBHOOK_SECRET
```

**Common Issues**:
- **Port already in use**: `lsof -i :3000` → kill process or change port
- **Database connection refused**: Ensure PostgreSQL is running (`docker compose up -d`)
- **Bucket not found (MinIO)**: Run `./scripts/setup-minio.sh`
- **Build errors**: Clear Next.js cache (`rm -rf .next`)

---

## Appendix C: Multi-Tenant Architecture Reference

### Dual Isolation Model

```
Tenant (Accountancy Firm - e.g., "Acme Accounting")
├── Users (Staff) - tenantId only
├── Clients (Customer businesses) - tenantId only
│   └── Client Portal Users - tenantId + clientId (DUAL ISOLATION)
├── Proposals - tenantId + clientId
├── Invoices - tenantId + clientId
├── Documents - tenantId + clientId
└── Messages - tenantId + clientId
```

### Authentication Contexts

**Staff**:
```typescript
const authContext = await getAuthContext();
// { userId, tenantId, role, email, ... }
```

**Client Portal**:
```typescript
const authContext = await getClientPortalAuthContext();
// { userId, tenantId, clientId, email, ... }
```

### Query Patterns

**Staff Query** (tenant isolation):
```typescript
const clients = await db
  .select()
  .from(clients)
  .where(eq(clients.tenantId, authContext.tenantId));
```

**Client Portal Query** (dual isolation):
```typescript
const proposals = await db
  .select()
  .from(proposals)
  .where(
    and(
      eq(proposals.tenantId, authContext.tenantId),
      eq(proposals.clientId, authContext.clientId)
    )
  );
```

---

## Appendix D: Integration Status Matrix

| Integration | Status | Environment | Auth Method | Cost | Rate Limit | Notes |
|-------------|--------|-------------|-------------|------|------------|-------|
| LEM Verify | ✅ Active | Production | API Key | £1/verification | Unknown | UK MLR 2017 compliant |
| Google Gemini | ✅ Active | Production | API Key | Pay-as-you-go | 60/min | Document extraction |
| Resend | ✅ Active | Production | API Key | $0.01/email | 100/day (free) | Transactional emails |
| DocuSeal | ✅ Active | Development | API Key | Free (self-hosted) | None | E-signature |
| MinIO | ✅ Active | Development | Access Key | Free | None | S3-compatible local |
| Hetzner S3 | ✅ Ready | Production | Access Key | €0.01/GB/month | None | Object storage |
| Microsoft OAuth | ✅ Active | Both | OAuth 2.0 | Free | Varies | Personal + work accounts |
| Xero | ⚠️ Partial | None | OAuth 2.0 | Free | Unknown | Transaction data placeholder |
| Sentry | ✅ Configured | Both | Auth Token | Free (10k events/month) | None | Error tracking |

---

## Conclusion

This brownfield architecture document provides a comprehensive, accurate reference for AI agents and developers working on Practice Hub. It reflects the **ACTUAL** state of the system, including:

✅ **Strengths**:
- Solid multi-tenant architecture with dual isolation
- Type-safe APIs via tRPC (29 routers, 58 tests passing)
- Comprehensive database schema (50+ tables, 14 views, 5 performance indexes)
- Rich integrations (KYC, AI, email, e-signature, S3)
- Fast development workflow (Turbopack, hot reload)
- Modern tech stack (Next.js 15, React 19, PostgreSQL, Better Auth)

⚠️ **Known Issues**:
- 3 critical schema issues (client portal dual isolation - MUST FIX)
- 5 medium TODOs in production code (VAT registration, conversion data, email confirmation, Xero integration)
- 115 console statements in production code (cleanup pending)
- No tRPC router tests yet (29 routers untested)

🎯 **Next Steps**:
1. **Phase 2**: Fix critical schema issues + remove console statements + implement TODOs
2. **Phase 3**: Generate router tests + multi-tenant isolation tests
3. **Phase 4**: Database optimization + performance tuning
4. **Phase 5**: Production deployment readiness

**For More Information**:
- Development Rules: `CLAUDE.md`
- Pre-Production Issues: `docs/PRE_PRODUCTION_ISSUES.md`
- System Architecture: `docs/SYSTEM_ARCHITECTURE.md`
- API Reference: `docs/API_REFERENCE.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Maintained By**: Development Team
**Generated By**: Winston (Architect Agent)
