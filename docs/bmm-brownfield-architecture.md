# Practice Hub - Brownfield Architecture Document

**Generated:** 2025-01-03
**Project:** practice-hub
**Type:** Brownfield - Multi-Module Next.js SaaS Platform
**Status:** Active Development - Launch Preparation for Client Hub & Proposal Hub

---

## Executive Summary

Practice Hub is a **comprehensive multi-tenant practice management platform** built with Next.js 15, designed for accounting firms and professional services. The system is currently at ~70% completion with focus on launching **Client Hub** and **Proposal Hub** modules.

**Current State:**
- 7 major modules in active development
- 114 database tables/views (50+ core tables, 14 views)
- 44 tRPC API routers (type-safe APIs)
- 100+ React components across modules
- Comprehensive testing suite (58 tests passing)
- Production-ready authentication and multi-tenancy

**Critical Focus for Launch:**
- **Client Hub**: Client/contact management, compliance, documents, invoicing
- **Proposal Hub**: Lead management, pricing calculator (28 services, 138+ rules), proposal generation

**Known Issues:**
- Module naming inconsistency: `admin/` should be renamed to `admin-hub/` for consistency
- Documentation scattered - needs consolidation (this document addresses that)
- Pricing engine complexity requires review before scaling

---

## Quick Reference - Key Architecture Facts

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 15 (App Router + Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL 14+ with Drizzle ORM |
| **Auth** | Dual Better Auth system (staff + client portal) |
| **API** | tRPC v11 (44 routers, type-safe) |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Multi-Tenancy** | Dual-level: Tenant + Client isolation |
| **Deployment** | Docker-ready, PostgreSQL required |

---

## Technology Stack

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 15.5.4 | React framework with App Router |
| Runtime | React | 19.1.0 | UI library |
| Language | TypeScript | 5.x | Type safety |
| Build Tool | Turbopack | (Next.js 15) | Fast bundler |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Radix UI primitives |
| Forms | React Hook Form | 7.63.0 | Form state management |
| Validation | Zod | 4.1.11 | Schema validation |
| State Management | TanStack Query | 5.90.2 | Server state (via tRPC) |
| Icons | Lucide React | 0.544.0 | Icon library |
| Notifications | react-hot-toast | 2.6.0 | Toast notifications |
| Theme | next-themes | 0.4.6 | Dark/light mode |

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| API Layer | tRPC | 11.6.0 | Type-safe APIs |
| Database ORM | Drizzle ORM | 0.44.5 | TypeScript ORM |
| Database | PostgreSQL | 14+ | Relational database |
| Auth | Better Auth | 1.3.26 | Authentication system |
| Password Hashing | bcryptjs | 3.0.2 | Password encryption |
| Rate Limiting | @upstash/ratelimit | 2.0.6 | API rate limiting |
| Caching | @upstash/redis | 1.35.6 | Redis caching |
| Email | Resend | 6.1.2 | Transactional emails |
| File Storage | AWS S3 SDK | 3.901.0 | S3-compatible storage |
| PDF Generation | @react-pdf/renderer | 4.3.1 | PDF documents |

### Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **LEM Verify** | KYC/AML identity verification (UK MLR 2017) | ✅ Active |
| **Google Gemini** | AI document extraction (2.0 Flash) | ✅ Active |
| **Microsoft OAuth** | Staff SSO authentication | ✅ Active |
| **DocuSeal** | E-signature platform | ✅ Active |
| **Resend** | Transactional email delivery | ✅ Active |
| **Hetzner S3** | Object storage (production) | ✅ Active |
| **MinIO** | Local S3-compatible storage (dev) | ✅ Active |
| **Xero** | Accounting integration | 🚧 In Progress |
| **Companies House** | UK company data lookup | ✅ Active |
| **Sentry** | Error tracking and monitoring | ✅ Active |

### Development & Quality

| Category | Tool | Purpose |
|----------|------|---------|
| Linter/Formatter | Biome | Code quality (replaces ESLint + Prettier) |
| Testing (Unit) | Vitest | Fast unit tests (58 passing) |
| Testing (E2E) | Playwright | End-to-end browser testing |
| Type Checking | TypeScript | Static type analysis |
| Package Manager | pnpm | Fast, efficient dependency management |
| Containerization | Docker | Database and services |
| Version Control | Git | Source control |
| Monitoring | Sentry | Error tracking |

---

## Architecture Pattern

**Pattern:** Component-Based Next.js with tRPC Backend

This is a **modern full-stack monolith** using Next.js App Router:
- **Frontend:** React Server Components + Client Components
- **Backend:** tRPC routers with type-safe procedures
- **State:** Server-first with React Query for caching
- **Database:** PostgreSQL with Drizzle ORM (schema-first)

**Key Characteristics:**
- Type safety across entire stack (TypeScript + tRPC + Drizzle + Zod)
- Multi-tenant data isolation at database level
- Dual authentication systems (staff vs clients)
- Component-first UI with design system
- API-driven architecture ready for mobile/external apps

---

## Module Organization

The application is organized into **7 major hub modules** within a monolithic Next.js app:

### App Directory Structure

```
app/
├── (auth)/              # Authentication pages (sign-in, sign-up, OAuth)
├── practice-hub/        # Main dashboard - Practice overview
├── client-hub/          # CRM - Client management (LAUNCH PRIORITY)
├── proposal-hub/        # Sales - Leads & proposals (LAUNCH PRIORITY)
├── admin/               # ⚠️ Should be 'admin-hub' - System administration
├── client-admin/        # Client-level admin (portal user management)
├── client-portal/       # Internal client portal (staff-facing)
├── (client-portal)/     # External client portal (client-facing)
├── social-hub/          # Team collaboration (in development)
└── server/              # tRPC backend (44 routers)
```

### Module Status for Launch

| Module | Completion | Status | Priority | Notes |
|--------|-----------|--------|----------|-------|
| **Client Hub** | ~70% | 🚧 Active | **P0 - Launch Critical** | Core CRM complete, needs polish |
| **Proposal Hub** | ~70% | 🚧 Active | **P0 - Launch Critical** | Calculator works, needs testing |
| Practice Hub | 60% | 🚧 Active | P1 - Post Launch | Dashboard functional |
| Admin Panel | 65% | 🚧 Active | P1 - Post Launch | User/KYC management works |
| Client Portal | 75% | ✅ Near Complete | P1 - Post Launch | Onboarding + docs working |
| Client Admin | 50% | 🚧 Active | P2 - Future | Basic user management |
| Social Hub | 20% | 📋 Planned | P3 - Future | Placeholder only |

---

## Database Schema (114 Tables/Views)

### Core Multi-Tenancy (3 tables)

```
tenants               # Organizations (accounting firms)
users                 # Staff users (linked to tenant)
departments           # Organizational structure
```

**Multi-Tenancy Pattern:** All tables reference `tenantId` for data isolation

### Authentication (Better Auth - 4 tables)

```
session               # User sessions (Better Auth)
account               # OAuth accounts (Better Auth)
verification          # Email/password verification
user_settings         # User preferences
```

### Client Hub Tables (25+ tables)

**Clients & Contacts:**
```
clients               # Main client records
client_contacts       # Contact persons
client_directors      # Company directors
client_pscs           # Persons with Significant Control
```

**Services & Compliance:**
```
services              # Service catalog (28 services)
client_services       # Services assigned to clients
compliance            # Compliance tracking (deadlines, renewals)
```

**Documents & Signatures:**
```
documents             # File storage metadata (S3 references)
document_signatures   # DocuSeal e-signature tracking
```

**Tasks & Time:**
```
tasks                 # Task management
task_templates        # Reusable task templates
time_entries          # Time tracking
timesheet_submissions # Weekly timesheet approvals
```

**Invoices:**
```
invoices              # Invoice headers
invoice_items         # Line items
```

**Integrations:**
```
xero_connections      # Xero API connection data
companies_house_cache # UK company data cache
```

### Proposal Hub Tables (15+ tables)

**Lead Management:**
```
leads                 # Sales leads
```

**Proposals:**
```
proposals             # Proposal headers
proposal_services     # Selected services
proposal_versions     # Version history
proposal_notes        # Internal notes
proposal_signatures   # E-signature tracking
proposal_templates    # Reusable templates
```

**Pricing Engine:**
```
pricing_rules         # 138+ pricing rules (discounts, multipliers)
client_transaction_data # Transaction volume for pricing
```

### Client Portal Tables (8 tables)

```
client_portal_users          # Portal user accounts
client_portal_access         # Access permissions
client_portal_invitations    # Pending invitations
client_portal_session        # Better Auth sessions (separate)
client_portal_account        # Better Auth OAuth (separate)
onboarding_sessions          # KYC onboarding sessions
kyc_verifications            # LEM Verify results
aml_checks                   # AML screening data
```

**Pattern:** Separate Better Auth instance for client portal

### Staff Management (8+ tables)

```
staff_capacity        # Capacity planning
working_patterns      # Work schedules
leave_requests        # Leave management
leave_balances        # Annual/TOIL balances
toil_accrual_history  # Time off in lieu tracking
work_types            # Billable vs non-billable time types
```

### Workflows & Automation (6 tables)

```
workflows             # Custom workflow definitions
workflow_stages       # Stage definitions
workflow_templates    # Reusable workflows
task_workflow_instances # Active workflow instances
workflow_email_rules  # Email automation rules
email_queue           # Outbound email queue
```

### System Tables (8 tables)

```
activity_logs         # Audit trail (all user actions)
notifications         # In-app notifications
invitations           # Staff invitations
feedback              # User feedback
portal_categories     # Portal link categories
portal_links          # Resource links for client portal
legal_pages           # Terms/Privacy/Cookie policies
integration_settings  # Third-party integration config
```

### Database Views (14 views)

Optimized read-only views for performance:

```
dashboard_kpi_view           # Main dashboard KPIs
monthly_revenue_view         # Revenue trends
client_revenue_view          # Client profitability
activity_feed_view           # Recent activity
task_details_view            # Enriched task data
client_details_view          # Client summary data
compliance_details_view      # Compliance overview
time_entries_view            # Time entry summaries
invoice_details_view         # Invoice data with totals
```

**Pattern:** Views aggregate data from multiple tables for fast dashboard queries

---

## API Design - tRPC Routers (44 Routers)

### Client Hub Routers (12 routers)

| Router | Purpose | Key Procedures |
|--------|---------|----------------|
| `clients` | Client CRUD | list, create, update, delete, getById |
| `services` | Service management | listServices, assignService, updateServiceStatus |
| `compliance` | Compliance tracking | listItems, createDeadline, updateStatus |
| `documents` | Document management | upload, list, delete, getPresignedUrl |
| `tasks` | Task management | create, assign, updateStatus, listByClient |
| `task-templates` | Task templates | list, create, apply |
| `timesheets` | Time tracking | submitWeek, approve, reject, list |
| `invoices` | Invoicing | create, send, markPaid, list |
| `calendar` | Calendar events | listEvents, createEvent, updateEvent |
| `reports` | Reporting | clientBreakdown, revenueChart, timeAnalysis |
| `workflows` | Workflow automation | list, create, trigger, updateStage |
| `integrations` | Third-party APIs | xeroSync, companiesHouseLookup |

### Proposal Hub Routers (8 routers)

| Router | Purpose | Key Procedures |
|--------|---------|----------------|
| `leads` | Lead management | create, update, convertToProposal, list |
| `proposals` | Proposal CRUD | create, update, send, sign, list |
| `pricing` | Pricing calculator | calculatePrice, applyRules, getEstimate |
| `pricingAdmin` | Pricing config | updateRules, manageSer vices, testPricing |
| `pricingConfig` | Rule management | getRules, updateMultipliers, setDiscounts |
| `proposalTemplates` | Templates | list, create, apply |
| `pipeline` | Sales pipeline | getStages, moveDeal, getMetrics |
| `transactionData` | Volume data | upload, analyze, getHistory |

**Pricing Engine:** 138+ rules across 28 services with complexity multipliers (Model A & B)

### Admin Routers (8 routers)

| Router | Purpose |
|--------|---------|
| `users` | Staff user management |
| `departments` | Department CRUD |
| `admin-kyc` | KYC review queue |
| `invitations` | Staff invitations |
| `portal` | Portal link management |
| `email-templates` | Email template editor |
| `legal` | Legal page management |
| `settings` | System settings |

### Client Portal Routers (3 routers)

| Router | Purpose |
|--------|---------|
| `onboarding` | KYC/AML onboarding |
| `clientPortal` | Portal data access |
| `clientPortalAdmin` | Portal user management |

### Core Shared Routers (13 routers)

| Router | Purpose |
|--------|---------|
| `dashboard` | Main dashboard data |
| `analytics` | Analytics and metrics |
| `notifications` | In-app notifications |
| `messages` | Internal messaging |
| `activities` | Activity logging |
| `leave` | Leave management |
| `toil` | TOIL tracking |
| `staffCapacity` | Capacity planning |
| `staffStatistics` | Staff metrics |
| `workingPatterns` | Work schedules |
| `workTypes` | Time entry types |
| `task-generation` | Bulk task creation |
| `import-logs` | Import history |

---

## Component Inventory

### UI Foundation (shadcn/ui - 24 components)

Located in `components/ui/`:

```
alert-dialog, alert, avatar, badge, breadcrumb, button, calendar, 
card, checkbox, dialog, dropdown-menu, form, input, label, popover, 
progress, radio-group, scroll-area, select, separator, sheet, 
skeleton, switch, table, tabs, textarea
```

**Design System:** Glass-card aesthetic with solid backgrounds (no transparency)

### Shared Components (9 components)

Located in `components/shared/`:

```
GlobalHeader          # App-wide header with branding
GlobalSidebar         # Module navigation sidebar
user-button           # User profile dropdown
notifications-dropdown # Notification bell
theme-toggle          # Dark/light mode toggle
footer                # App footer
DateTimeDisplay       # Formatted date/time
connection-status     # WebSocket connection indicator
```

### Client Hub Components (~60 components)

Major component groups in `components/client-hub/`:

**Clients:**
- `clients-table` - Main client list (sortable, filterable)
- `client-modal` - Create/edit client
- `client-wizard-modal` - Multi-step client onboarding
- `client-filters` - Advanced filtering
- `bulk-action-bar` - Bulk operations

**Compliance:**
- `compliance-list` - Deadline tracking
- `compliance-calendar` - Calendar view

**Documents:**
- `document-grid` - File browser
- `upload-modal` - Multi-file uploader
- `file-preview-modal` - Document viewer
- `signature-upload-modal` - E-signature integration

**Tasks:**
- Task creation, assignment, status tracking
- `task-notes-section` - Collaborative notes with mentions
- `mention-autocomplete` - @mention functionality
- `task-reassignment-modal` - Reassign tasks
- `task-assignment-history` - Audit trail

**Time & Invoices:**
- `timesheet-submission-card` - Weekly timesheet
- `timesheet-reject-modal` - Approval workflow
- `invoice-form` - Invoice creation
- `invoice-list` - Invoice management

**Reports:**
- `client-breakdown` - Client profitability
- `revenue-chart` - Revenue trends

### Proposal Hub Components (~40 components)

Major component groups in `components/proposal-hub/`:

**Calculator:**
- `service-selector` - 28 services with search
- `complexity-settings` - Model A/B multipliers
- `discount-panel` - Volume/rush/new client discounts
- `price-breakdown` - Line-item breakdown

**Pipeline:**
- `kanban-board` - Drag-and-drop pipeline
- `deal-card` - Pipeline card
- `sales-stage-history` - Stage transitions

**Proposals:**
- `edit-proposal-dialog` - Proposal editor
- `send-proposal-dialog` - Email integration
- `signature-pad` - E-signature capture
- `version-history-dialog` - Version tracking

**Analytics:**
- Conversion metrics, win rate charts
- Revenue forecasting

**Templates:**
- Template editor and application

### Admin Components (~20 components)

Located in `components/admin/` and `components/admin-panel/`:

- User management table with bulk actions
- KYC review interface
- Leave approval queue
- Staff capacity management
- Working pattern editor
- Email template editor
- Import history viewer

### Staff Components (~10 components)

Located in `components/staff/`:

- Utilization heatmap
- TOIL balance widget
- Department utilization chart
- Staff comparison table

### Client Portal Components (~8 components)

Located in `components/client-portal/`:

- Onboarding wizard (multi-step KYC)
- Document access
- Message threads
- Client switcher (multi-client access)

---

## Critical Directories Explained

```
/app/                           # Next.js App Router
  ├── (auth)/                  # Auth pages (sign-in, sign-up)
  ├── client-hub/              # ⭐ LAUNCH PRIORITY - CRM module
  ├── proposal-hub/            # ⭐ LAUNCH PRIORITY - Sales module
  ├── practice-hub/            # Main dashboard
  ├── admin/                   # ⚠️ Should be admin-hub
  ├── client-admin/            # Client-level user management
  ├── client-portal/           # Internal portal views
  ├── (client-portal)/         # External portal (group route)
  ├── social-hub/              # Future: Team collaboration
  └── server/                  # tRPC backend
      ├── routers/             # 44 API routers
      ├── context.ts           # Auth context provider
      └── trpc.ts              # tRPC config

/components/                    # React components
  ├── ui/                      # shadcn/ui base components
  ├── shared/                  # App-wide shared components
  ├── client-hub/              # Client Hub specific
  ├── proposal-hub/            # Proposal Hub specific
  ├── admin/                   # Admin panel specific
  └── client-portal/           # Portal specific

/lib/                           # Shared utilities
  ├── db/                      # Database layer
  │   ├── schema.ts            # Drizzle schema (114 tables/views)
  │   └── index.ts             # DB client
  ├── auth.ts                  # Better Auth (staff)
  ├── auth-client.ts           # Auth client-side
  ├── client-portal-auth.ts    # Better Auth (portal)
  ├── s3/                      # S3 storage utils
  ├── email/                   # Resend email
  ├── kyc/                     # LEM Verify integration
  ├── companies-house/         # Companies House API
  └── services/                # Business logic services

/docs/                          # Documentation (66 docs)
  ├── architecture/            # System design docs
  ├── guides/                  # How-to guides
  ├── operations/              # Deployment, monitoring
  ├── pricing/                 # ⭐ Pricing research & config
  ├── modules/                 # Module-specific docs
  └── README.md                # Master index

/scripts/                       # Utility scripts
  ├── seed.ts                  # Database seeding
  ├── migrate.ts               # Migrations
  └── seed-auth-users.ts       # Auth user setup

/drizzle/                       # Database migrations
  └── 0000_create_views.sql    # View definitions

/__tests__/                     # Test suites
  ├── lib/                     # Unit tests (42 tests)
  ├── routers/                 # API tests (16 tests)
  └── e2e/                     # Playwright E2E tests
```

---

## Pricing Engine Deep Dive

Located in: `docs/pricing/`, `components/proposal-hub/calculator/`, `app/server/routers/pricing*.ts`

### Service Catalog (28 Services)

Categories:
- **Accounts Preparation** (7 services)
- **Bookkeeping** (5 services)
- **Tax Services** (8 services)
- **Payroll** (4 services)
- **Advisory** (4 services)

### Pricing Rules (138+ rules)

**Complexity Multipliers:**
- **Model A:** Activity-based (bank transactions, invoices, employees)
- **Model B:** Simplified bands (small/medium/large/enterprise)

**Discount Rules:**
- Volume discounts (multi-service bundles)
- New client discounts
- Rush service premiums
- Industry-specific pricing adjustments

**Data Sources:**
- Manual input (client provides estimates)
- File upload (transaction data, payroll records)
- Companies House integration (company size indicators)

### Calculator Flow

1. **Service Selection:** Choose from 28 services
2. **Complexity Assessment:** Model A or B
3. **Transaction Data:** Upload or manual entry
4. **Rule Application:** Automatic discounts/multipliers
5. **Price Breakdown:** Line-item detail
6. **Proposal Generation:** PDF + S3 storage

**Status:** Calculator functional but needs validation testing before scale

---

## Multi-Tenancy Implementation

### Dual-Level Isolation

**Level 1: Tenant (Organization)**
- Accounting firm or professional services organization
- All staff belong to one tenant
- All clients belong to one tenant
- Data fully isolated by `tenantId` at database level

**Level 2: Client (within Tenant)**
- Clients within a tenant can have portal access
- Portal users see ONLY their client's data
- Separate Better Auth instance for portal
- Additional `clientId` filtering in portal queries

### Database Pattern

All tables (except Better Auth core tables) include:
```typescript
tenantId: text("tenant_id")
  .references(() => tenants.id)
  .notNull()
```

**Enforcement:** Application-level checks in tRPC context + database foreign keys

### Auth Context Helper

```typescript
// lib/auth.ts
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  
  // Fetch user's tenant
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { tenant: true }
  });
  
  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    // ...
  };
}
```

**Usage:** Every tRPC procedure uses `ctx.authContext.tenantId` to filter queries

---

## Authentication Architecture

### Dual Better Auth Setup

**Staff Authentication:**
- File: `lib/auth.ts`
- Users table: `users`
- Sessions table: `session`
- OAuth: Microsoft (personal + work accounts)
- Password: bcrypt hashing
- Session TTL: 7 days

**Client Portal Authentication:**
- File: `lib/client-portal-auth.ts`
- Users table: `client_portal_users`
- Sessions table: `client_portal_session`
- Password-only (no OAuth)
- Separate cookie namespace
- Linked to parent `clients` table

### Middleware Protection

```typescript
// middleware.ts
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths
  if (publicPaths.includes(pathname)) return NextResponse.next();
  
  // Staff routes
  if (pathname.startsWith('/client-hub') || ...) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return redirect('/sign-in');
  }
  
  // Portal routes
  if (pathname.startsWith('/portal')) {
    const portalSession = await clientPortalAuth.api.getSession({ ... });
    if (!portalSession) return redirect('/portal/sign-in');
  }
  
  return NextResponse.next();
}
```

**Pattern:** Server-side session validation for all protected routes

---

## Testing Strategy

### Current Test Coverage (58 tests passing)

**Unit Tests (42 tests):**
- Configuration loading (`lib/config.ts`)
- In-memory caching (`lib/cache.ts`)
- Rate limiting (`lib/rate-limit.ts`)
- S3 utilities (`lib/s3/`)

**Integration Tests (16 tests):**
- LEM Verify webhook handling
- Signature verification (HMAC)
- Request validation
- HTTP status code handling

**Framework:** Vitest (execution time < 3 seconds)

### E2E Testing (Playwright)

**Configured but limited coverage:**
- Auth flows (sign-in, sign-up, OAuth)
- Client Hub: Client creation, document upload
- Proposal Hub: Lead creation, calculator basics

**Gap:** Client Hub and Proposal Hub workflows need comprehensive E2E coverage before launch

### Testing Commands

```bash
pnpm test              # Run unit tests
pnpm test:coverage     # Coverage report
pnpm test:e2e          # Playwright E2E
pnpm test:e2e:ui       # Interactive E2E
```

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 18+
- pnpm
- Docker (for PostgreSQL)

**Environment Variables:**
- Copy `.env.example` to `.env.local`
- Configure Better Auth secrets
- Add integration API keys (optional)

**Database Commands:**
```bash
docker compose up -d      # Start PostgreSQL
pnpm db:reset             # Drop + migrate + seed (ONE command)
pnpm db:studio            # Drizzle Studio GUI
```

**⚠️ CRITICAL:** Always use `pnpm db:reset` for schema changes. NEVER run individual migration commands.

### Development Commands

```bash
pnpm dev               # Start dev server (Turbopack)
pnpm build             # Production build
pnpm start             # Production server
pnpm lint              # Biome linter
pnpm format            # Biome formatter
pnpm typecheck         # TypeScript validation
```

### Code Quality Tools

- **Biome:** Linting + formatting (replaces ESLint + Prettier)
- **TypeScript:** Strict mode enabled
- **Vitest:** Unit testing
- **Playwright:** E2E testing

---

## Technical Debt & Known Issues

### High Priority (P0 - Blocking Launch)

1. **Pricing Calculator Validation**
   - Issue: 138 rules across 28 services need comprehensive testing
   - Impact: Incorrect pricing could damage client relationships
   - Action: Create test suite with known scenarios before launch
   - Owner: TBD

2. **Client Hub E2E Test Coverage**
   - Issue: Limited E2E coverage for critical workflows
   - Impact: Risk of production bugs in core CRM features
   - Action: Add Playwright tests for: client creation, compliance deadlines, document upload, invoicing
   - Owner: TBD

3. **Proposal Hub E2E Test Coverage**
   - Issue: Calculator and proposal generation not E2E tested
   - Impact: Risk of broken proposal flow
   - Action: Add tests for: lead→proposal conversion, calculator accuracy, PDF generation, e-signature flow
   - Owner: TBD

### Medium Priority (P1 - Post-Launch)

4. **Module Naming Inconsistency**
   - Issue: `admin/` directory should be `admin-hub/` for consistency
   - Impact: Developer confusion, documentation inconsistency
   - Action: Rename directory + update all imports and routes
   - Owner: Development Team

5. **Documentation Scattered**
   - Issue: 66 docs across 10 categories, some outdated
   - Impact: Hard to find information, duplication
   - Action: Consolidate into this brownfield architecture doc + focused module docs
   - Status: **IN PROGRESS** (this document is part of solution)

6. **Social Hub Incomplete**
   - Issue: Only placeholder code exists (~20% done)
   - Impact: Not blocking launch but listed in UI
   - Action: Either complete or hide from navigation
   - Owner: TBD

### Low Priority (P2 - Future Improvements)

7. **Xero Integration Incomplete**
   - Issue: Started but not production-ready
   - Impact: Clients expect Xero sync for invoicing
   - Action: Complete Xero OAuth + sync workflows
   - Owner: TBD

8. **Performance Optimization**
   - Issue: Some dashboard queries could be optimized
   - Impact: Slower load times for data-heavy clients
   - Action: Add database indexes, optimize views
   - Owner: TBD

---

## Deployment Architecture

### Production Stack

- **Platform:** Docker-ready (Next.js standalone build)
- **Database:** PostgreSQL 14+ (managed service recommended)
- **Storage:** Hetzner S3 or AWS S3
- **Email:** Resend (transactional emails)
- **Monitoring:** Sentry (errors), UptimeRobot (uptime)
- **CDN:** Next.js image optimization + CDN (TBD)

### Environment Variables (Production)

**Critical:**
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."  # Different from dev
BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
```

**Integrations (Optional but Recommended):**
```env
LEMVERIFY_API_KEY="..."
GOOGLE_AI_API_KEY="..."
RESEND_API_KEY="..."
S3_ENDPOINT="..."
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."
SENTRY_DSN="..."
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
```

### Security Headers

Configured in `next.config.ts`:
- HSTS (1 year)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- CSP (Content Security Policy)
- Permissions-Policy

### Build Command

```bash
pnpm build    # Creates .next/ production build
```

**Output:** Standalone Next.js server ready for Docker or Node.js deployment

---

## Integration Points

### External Services

| Integration | Type | Data Flow | Critical? |
|-------------|------|-----------|-----------|
| **LEM Verify** | REST API + Webhooks | Client → LEM Verify → Webhook → System | Yes (KYC) |
| **Google Gemini** | REST API | Document → AI → Extracted Data | Yes (KYC) |
| **Microsoft OAuth** | OAuth 2.0 | User → Microsoft → Token → Session | Yes (Auth) |
| **DocuSeal** | REST API + Webhooks | PDF → DocuSeal → Signed PDF → S3 | Yes (E-sig) |
| **Resend** | REST API | Template → Resend → Email Delivery | Yes (Emails) |
| **S3 (Hetzner/AWS)** | S3 Protocol | File → S3 → Presigned URL | Yes (Storage) |
| **Companies House** | REST API | Company Number → Company Data | No (Cache) |
| **Xero** | OAuth + REST API | Invoice → Xero Sync | No (Future) |
| **Sentry** | SDK + HTTP | Error → Sentry Dashboard | No (Monitor) |

### Webhook Endpoints

```
POST /api/lemverify/webhook       # LEM Verify KYC updates
POST /api/docuseal/webhook        # DocuSeal signature events
POST /api/xero/webhook            # Xero accounting events (future)
```

**Security:** All webhooks validate HMAC signatures

---

## Next Steps for Launch

### Client Hub Launch Checklist

- [ ] Complete E2E test coverage (client CRUD, compliance, documents, invoices)
- [ ] Verify multi-tenant data isolation in all queries
- [ ] Test Companies House integration with real data
- [ ] Load test: 100 clients, 1000 tasks, 5000 time entries
- [ ] User acceptance testing with pilot client
- [ ] Document onboarding process for new clients
- [ ] Set up error monitoring (Sentry)
- [ ] Configure automated backups

### Proposal Hub Launch Checklist

- [ ] Validate pricing calculator with known scenarios (all 28 services)
- [ ] Test complexity multipliers (Model A & B) with real data
- [ ] Verify discount rules apply correctly
- [ ] E2E test: Lead → Proposal → PDF → E-signature → Client conversion
- [ ] Load test: Generate 100 proposals simultaneously
- [ ] Review pricing research in `docs/pricing/` for completeness
- [ ] Train staff on calculator usage
- [ ] Document pricing methodology for clients
- [ ] Set up S3 bucket lifecycle policies (proposal PDFs)

### Post-Launch Priorities

1. Refactor: `admin/` → `admin-hub/` rename
2. Complete Xero integration
3. Social Hub: complete or remove
4. Performance optimization (database indexes, caching)
5. Mobile responsiveness improvements
6. Advanced analytics dashboards

---

## Appendix: File List Reference

### Critical Configuration Files

```
.env.local                    # Local environment variables
package.json                  # Dependencies and scripts
tsconfig.json                 # TypeScript configuration
next.config.ts                # Next.js configuration
biome.json                    # Biome linter/formatter config
drizzle.config.ts             # Drizzle ORM configuration
docker-compose.yml            # PostgreSQL container
middleware.ts                 # Route protection
```

### Database Files

```
lib/db/schema.ts              # Complete schema (114 tables/views)
lib/db/index.ts               # Database client
drizzle/0000_create_views.sql # View definitions
scripts/seed.ts               # Seed data
scripts/migrate.ts            # Migration runner
```

### Documentation Files (66 docs)

**Architecture:**
- `docs/architecture/system-overview.md`
- `docs/architecture/multi-tenancy.md`
- `docs/architecture/authentication.md`
- `docs/architecture/api-design.md`
- `docs/architecture/design-system.md`
- `docs/architecture/tech-stack.md`
- `docs/architecture/coding-standards.md`
- `docs/architecture/brownfield-architecture.md` (this file)

**Pricing Research:**
- `docs/pricing/` - Comprehensive pricing research and configuration

**See:** `docs/README.md` for full documentation index

---

**Document Version:** 1.0
**Generated:** 2025-01-03
**For:** Practice Hub Launch Planning
**Focus:** Client Hub & Proposal Hub Readiness


