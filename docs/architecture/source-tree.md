---
title: "Source Tree & Directory Structure"
category: "architecture"
subcategory: "organization"
purpose: "Complete reference for Practice Hub's directory structure and file organization"
audience: ["ai-agent", "developer"]
prerequisites: []
related: ["system-overview.md", "tech-stack.md", "coding-standards.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "architecture-team"
tags: ["source-tree", "directory", "organization", "structure"]
---

# Source Tree & Directory Structure

**Quick Summary**: Practice Hub follows Next.js 15 App Router conventions with a modular architecture organized by feature hubs. This document provides a complete directory reference with purpose and ownership for each section.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- Root directory structure
- App Router organization
- Module-based architecture
- Component organization
- Library and utility structure
- Configuration files
- Scripts and tools

---

## Quick Start / TL;DR

**Top-Level Organization**:
```
practice-hub/
├── app/              # Next.js App Router (pages, layouts, API routes)
├── components/       # React components (UI, features, shared)
├── lib/              # Business logic, utilities, integrations
├── scripts/          # Database seeding, migrations, setup
├── drizzle/          # Database migrations (SQL)
├── docs/             # Documentation
├── public/           # Static assets
└── .claude/          # AI agent skills and commands
```

**Key Patterns**:
- **Module Hubs**: `app/client-hub/`, `app/proposal-hub/`, `app/admin/`, etc.
- **tRPC Routers**: `app/server/routers/*.ts` (29 routers)
- **Components**: Organized by module + shadcn/ui in `components/ui/`
- **Business Logic**: Domain-specific code in `lib/`

---

## Root Directory

```
practice-hub/
├── app/                      # Next.js App Router (frontend + API)
├── components/               # React components (shared, UI, features)
├── lib/                      # Business logic, utilities, database
├── scripts/                  # Development and operational scripts
├── drizzle/                  # Database migrations and views
├── docs/                     # Documentation (architecture, guides, reference)
├── public/                   # Static assets (images, fonts, etc.)
├── .claude/                  # Claude Code skills and slash commands
│
├── .next/                    # Next.js build output (gitignored)
├── node_modules/             # Dependencies (gitignored)
│
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml            # Lockfile for pnpm
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS v4 configuration
├── biome.json                # Biome linter/formatter config
├── vitest.config.ts          # Vitest testing configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── docker-compose.yml        # Local development services
├── middleware.ts             # Next.js middleware (auth)
├── instrumentation.ts        # Sentry initialization
├── sentry.*.config.ts        # Sentry configurations
│
├── .env.local                # Local environment variables (gitignored)
├── .env.example              # Example environment variables
├── .env.production.example   # Production environment template
│
├── .gitignore                # Git ignore rules
├── README.md                 # Project readme
├── CLAUDE.md                 # Critical development rules for AI agents
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # Contribution guidelines
└── SECURITY.md               # Security policies
```

---

## `app/` - Next.js App Router

### Overview

Next.js 15 App Router with collocated components, layouts, and API routes. Organized by feature modules (hubs) with route groups for special sections.

### Structure

```
app/
├── layout.tsx                # Root layout (providers, theme, auth)
├── page.tsx                  # Practice Hub homepage/dashboard
├── error.tsx                 # Global error boundary
├── globals.css               # Global styles + design system
├── favicon.ico               # Site favicon
│
├── (auth)/                   # Auth route group (custom layout)
│   ├── layout.tsx            # Auth layout (centered, no nav)
│   ├── sign-in/page.tsx      # Staff sign-in page
│   ├── sign-up/page.tsx      # Staff sign-up page
│   ├── accept-invitation/[token]/page.tsx  # Staff invitation acceptance
│   └── oauth-setup/page.tsx  # Microsoft OAuth setup instructions
│
├── (public)/                 # Public route group (no auth required)
│   ├── lead-capture/
│   │   ├── page.tsx          # Public lead capture form
│   │   └── thank-you/page.tsx
│   └── proposals/
│       ├── sign/[id]/page.tsx      # Public proposal signing
│       └── signed/[id]/page.tsx    # Signed proposal confirmation
│
├── practice-hub/             # ⭐ Main practice dashboard module
│   ├── layout.tsx            # Practice Hub layout
│   ├── page.tsx              # Dashboard (app cards, quick actions)
│   ├── calendar/page.tsx     # Calendar view
│   ├── messages/page.tsx     # Internal messaging
│   └── notifications/page.tsx
│
├── client-hub/               # ⭐ Client relationship management module
│   ├── layout.tsx            # Client Hub layout (blue theme)
│   ├── page.tsx              # Client Hub dashboard
│   ├── clients/
│   │   ├── page.tsx          # Clients list
│   │   └── [id]/page.tsx     # Client detail page
│   ├── tasks/
│   │   ├── page.tsx          # Tasks list/board
│   │   └── [id]/page.tsx     # Task detail
│   ├── invoices/page.tsx
│   ├── documents/page.tsx
│   ├── services/page.tsx
│   ├── time/page.tsx         # Time tracking
│   ├── compliance/page.tsx   # Compliance deadlines
│   ├── workflows/page.tsx
│   ├── reports/page.tsx
│   └── settings/page.tsx
│
├── proposal-hub/             # ⭐ Proposal & sales pipeline module
│   ├── layout.tsx            # Proposal Hub layout
│   ├── page.tsx              # Proposal Hub dashboard
│   ├── calculator/page.tsx   # Pricing calculator
│   ├── proposals/
│   │   ├── page.tsx          # Proposals list
│   │   ├── [id]/page.tsx     # Proposal detail
│   │   └── pipeline/page.tsx # Kanban board
│   ├── leads/
│   │   ├── page.tsx          # Leads list
│   │   ├── [id]/page.tsx     # Lead detail
│   │   └── new/page.tsx      # Create lead
│   ├── onboarding/
│   │   ├── page.tsx          # Onboarding sessions list
│   │   └── [id]/page.tsx     # Onboarding session detail
│   ├── pipeline/page.tsx     # Sales pipeline (kanban)
│   ├── analytics/
│   │   ├── page.tsx          # Sales analytics dashboard
│   │   └── pricing/page.tsx  # Pricing analytics
│   ├── reports/page.tsx
│   └── admin/
│       ├── pricing/page.tsx  # Pricing admin (per tenant config)
│       └── templates/page.tsx
│
├── admin/                    # ⭐ Admin panel module (admin-only)
│   ├── layout.tsx            # Admin layout (orange theme, role check)
│   ├── page.tsx              # Admin dashboard
│   ├── users/
│   │   ├── page.tsx          # User management
│   │   └── [id]/page.tsx     # User detail/edit
│   ├── invitations/page.tsx  # User invitation management
│   ├── feedback/page.tsx     # User feedback review
│   ├── pricing/page.tsx      # Global pricing configuration
│   ├── kyc-review/
│   │   ├── page.tsx          # KYC review queue
│   │   └── [id]/page.tsx     # KYC review detail
│   └── portal-links/page.tsx # Client portal link management
│
├── client-admin/             # ⭐ Client portal admin (manage client portal users)
│   ├── layout.tsx
│   ├── page.tsx              # Client admin dashboard
│   ├── users/page.tsx        # Client portal user management
│   └── invitations/page.tsx  # Client portal invitations
│
├── client-portal/            # ⚠️ Legacy client portal path (deprecated)
│   ├── layout.tsx
│   ├── page.tsx              # Redirects to /portal
│   └── onboarding/
│       ├── page.tsx
│       └── pending/page.tsx
│
├── portal/                   # ⭐ Client portal module (external client access)
│   ├── layout.tsx            # Portal layout (client portal auth)
│   ├── page.tsx              # Portal dashboard
│   ├── sign-in/page.tsx      # Client portal sign-in
│   ├── accept/[token]/page.tsx # Client portal invitation
│   ├── proposals/
│   │   ├── page.tsx          # Client's proposals list
│   │   ├── [id]/page.tsx     # Proposal detail
│   │   └── [id]/sign/page.tsx # Proposal signing
│   ├── invoices/
│   │   ├── page.tsx          # Client's invoices
│   │   └── [id]/page.tsx     # Invoice detail
│   ├── documents/page.tsx    # Client's documents
│   └── messages/page.tsx     # Client messaging
│
├── social-hub/               # ⚠️ Placeholder module (future feature)
│   ├── layout.tsx
│   └── page.tsx
│
├── api/                      # API routes (non-tRPC endpoints)
│   ├── auth/[...all]/route.ts       # Better Auth staff endpoints
│   ├── client-portal-auth/[...all]/route.ts  # Better Auth client portal
│   ├── trpc/[trpc]/route.ts         # tRPC API handler
│   ├── webhooks/
│   │   └── docuseal/route.ts        # DocuSeal webhook handler
│   ├── upload/route.ts              # File upload endpoint
│   ├── cron/
│   │   └── expire-proposals/route.ts # Cron job (proposal expiry)
│   ├── documents/[id]/route.ts      # Document download
│   ├── onboarding/[sessionId]/submit/route.ts
│   ├── portal/auth/[...all]/route.ts # Portal auth (legacy)
│   ├── oauth-setup/check-permissions/route.ts
│   ├── setup-tenant/route.ts        # Initial tenant setup
│   └── xero/
│       ├── callback/route.ts        # Xero OAuth callback
│       └── connect/route.ts         # Xero connection
│
├── server/                   # tRPC server code
│   ├── routers/              # 29 tRPC routers
│   │   ├── clients.ts        # Client CRUD operations
│   │   ├── proposals.ts      # Proposal operations
│   │   ├── leads.ts          # Lead management
│   │   ├── tasks.ts          # Task management
│   │   ├── invoices.ts       # Invoice operations
│   │   ├── users.ts          # User management
│   │   ├── dashboard.ts      # Dashboard widgets
│   │   ├── analytics.ts      # Analytics data
│   │   ├── documents.ts      # Document management
│   │   ├── messages.ts       # Messaging
│   │   ├── calendar.ts       # Calendar events
│   │   ├── notifications.ts  # Notifications
│   │   ├── workflows.ts      # Workflow management
│   │   ├── services.ts       # Service management
│   │   ├── pricing.ts        # Pricing calculations
│   │   ├── pricingAdmin.ts   # Pricing admin operations
│   │   ├── pricingConfig.ts  # Tenant pricing config
│   │   ├── proposalTemplates.ts # Proposal templates
│   │   ├── onboarding.ts     # Onboarding sessions
│   │   ├── pipeline.ts       # Sales pipeline
│   │   ├── activities.ts     # Activity logs
│   │   ├── timesheets.ts     # Time tracking
│   │   ├── compliance.ts     # Compliance deadlines
│   │   ├── invitations.ts    # User invitations
│   │   ├── settings.ts       # User/tenant settings
│   │   ├── clientPortal.ts   # Client portal operations
│   │   ├── clientPortalAdmin.ts # Client portal admin
│   │   ├── admin-kyc.ts      # KYC review operations
│   │   ├── transactionData.ts # Transaction data import
│   │   └── portal.ts         # Portal operations (legacy)
│   ├── context.ts            # tRPC context (auth, session)
│   ├── trpc.ts               # tRPC initialization + middleware
│   └── index.ts              # App router (combines all routers)
│
└── providers/                # React context providers
    ├── trpc-provider.tsx     # tRPC client provider
    └── theme-provider.tsx    # Theme provider (next-themes)
```

**Key Concepts**:

- **Route Groups**: `(auth)`, `(public)`, `(client-portal)` - organize routes without affecting URL structure
- **Dynamic Routes**: `[id]`, `[token]`, `[...all]` - parameterized routes
- **Layouts**: Each module has its own layout with auth checks and module-specific styling
- **Colocation**: Components can be colocated with routes (e.g., `page.tsx` + `client-hub-dashboard.tsx`)

---

## `components/` - React Components

### Overview

React components organized by scope: UI primitives (shadcn/ui), module-specific features, and shared components.

### Structure

```
components/
├── ui/                       # ✨ shadcn/ui components (30+ primitives)
│   ├── button.tsx            # Button variants
│   ├── card.tsx              # Card with glass-card class
│   ├── input.tsx             # Form input
│   ├── label.tsx             # Form label
│   ├── dialog.tsx            # Modal dialog
│   ├── alert-dialog.tsx      # Confirmation dialog
│   ├── select.tsx            # Dropdown select
│   ├── checkbox.tsx          # Checkbox input
│   ├── switch.tsx            # Toggle switch
│   ├── radio-group.tsx       # Radio button group
│   ├── table.tsx             # Data table
│   ├── tabs.tsx              # Tabbed interface
│   ├── badge.tsx             # Status badge
│   ├── avatar.tsx            # User avatar
│   ├── skeleton.tsx          # Loading skeleton
│   ├── calendar.tsx          # Date picker
│   ├── popover.tsx           # Popover container
│   ├── dropdown-menu.tsx     # Dropdown menu
│   ├── textarea.tsx          # Multi-line text input
│   ├── separator.tsx         # Horizontal separator
│   ├── scroll-area.tsx       # Scrollable area
│   ├── progress.tsx          # Progress bar
│   ├── breadcrumb.tsx        # Breadcrumb navigation
│   ├── sheet.tsx             # Side sheet/drawer
│   ├── alert.tsx             # Alert box
│   └── form.tsx              # Form wrapper (React Hook Form)
│
├── shared/                   # 🌐 Shared components (used across modules)
│   ├── GlobalHeader.tsx      # Universal header (all modules)
│   ├── GlobalSidebar.tsx     # Universal sidebar (all modules)
│   ├── user-button.tsx       # User dropdown menu
│   ├── theme-toggle.tsx      # Dark mode toggle
│   ├── DateTimeDisplay.tsx   # Formatted date/time display
│   └── (other shared utilities)
│
├── practice-hub/             # 🏠 Practice Hub components
│   ├── AppCard.tsx           # Module hub card
│   └── NavigationTabs.tsx    # Tab navigation
│
├── client-hub/               # 💼 Client Hub components
│   ├── dashboard/
│   │   ├── kpi-widget.tsx    # KPI display widget
│   │   ├── activity-feed.tsx # Recent activity list
│   │   └── quick-actions.tsx # Quick action buttons
│   ├── clients/
│   │   ├── clients-table.tsx         # Clients data table
│   │   ├── client-modal.tsx          # Create/edit client modal
│   │   ├── client-wizard-modal.tsx   # Multi-step client wizard
│   │   ├── client-filters.tsx        # Client list filters
│   │   └── wizard/
│   │       ├── basic-info-step.tsx
│   │       ├── contact-info-step.tsx
│   │       ├── registration-details-step.tsx
│   │       ├── directors-shareholders-step.tsx
│   │       ├── service-selection-step.tsx
│   │       ├── service-configuration-step.tsx
│   │       ├── pricing-configuration-step.tsx
│   │       └── review-step.tsx
│   ├── tasks/
│   │   ├── task-list.tsx     # Task list view
│   │   ├── task-board.tsx    # Kanban board view
│   │   ├── task-card.tsx     # Task card component
│   │   └── task-modal.tsx    # Create/edit task
│   ├── invoices/
│   │   ├── invoice-list.tsx  # Invoice list
│   │   └── invoice-form.tsx  # Invoice form
│   ├── time/
│   │   ├── timesheet-grid.tsx      # Time entry grid
│   │   ├── hourly-timesheet.tsx    # Hourly view
│   │   ├── monthly-timesheet.tsx   # Monthly view
│   │   ├── quick-time-entry.tsx    # Quick time entry
│   │   └── time-entry-modal.tsx    # Time entry form
│   ├── documents/
│   │   ├── upload-modal.tsx        # Document upload
│   │   └── file-preview-modal.tsx  # Document preview
│   ├── services/
│   │   ├── service-card.tsx  # Service card
│   │   └── service-modal.tsx # Create/edit service
│   ├── reports/
│   │   ├── revenue-chart.tsx       # Revenue visualization
│   │   └── client-breakdown.tsx    # Client breakdown chart
│   ├── compliance/
│   │   ├── compliance-list.tsx     # Compliance deadlines list
│   │   └── compliance-calendar.tsx # Calendar view
│   ├── workflows/
│   │   ├── workflow-assignment-modal.tsx
│   │   └── workflow-instance-modal.tsx
│   └── data-import-modal.tsx # CSV import modal
│
├── proposal-hub/             # 📊 Proposal Hub components
│   ├── calculator/
│   │   ├── pricing-calculator.tsx    # Main pricing calculator
│   │   ├── service-selector.tsx      # Service selection UI
│   │   └── floating-price-widget.tsx # Floating price summary
│   ├── kanban/
│   │   ├── kanban-board.tsx   # Kanban board container
│   │   ├── kanban-column.tsx  # Board column
│   │   └── deal-card.tsx      # Draggable deal card
│   ├── charts/
│   │   ├── proposals-status-chart.tsx # Proposal status pie chart
│   │   ├── win-loss-chart.tsx         # Win/loss ratio
│   │   ├── lead-sources-chart.tsx     # Lead source breakdown
│   │   └── complexity-chart.tsx       # Complexity distribution
│   ├── widgets/
│   │   ├── recent-activity-feed.tsx   # Recent activity widget
│   │   └── top-services-widget.tsx    # Top services widget
│   ├── templates/
│   │   └── (template management components)
│   ├── analytics/
│   │   └── (analytics visualizations)
│   ├── send-proposal-dialog.tsx       # Send proposal modal
│   ├── convert-to-client-dialog.tsx   # Convert lead to client
│   ├── create-proposal-from-lead-dialog.tsx
│   ├── signature-pad.tsx              # E-signature canvas
│   └── task-dialog.tsx                # Create task from proposal
│
├── client-portal/            # 🔒 Client Portal components
│   ├── client-switcher.tsx   # Multi-client account switcher
│   ├── documents/
│   │   └── docuseal-signing-modal.tsx # E-signature modal
│   └── messages/
│       ├── message-input.tsx        # Message input field
│       └── message-thread-list.tsx  # Message threads
│
├── client-admin/             # 👥 Client Admin components
│   └── send-invitation-dialog.tsx # Client portal invitation
│
├── admin/                    # ⚙️ Admin Panel components
│   └── EmailPreviewModal.tsx # Email template preview
│
├── feedback/                 # 📝 Feedback components
│   ├── feedback-button.tsx   # Floating feedback button
│   └── feedback-modal.tsx    # Feedback submission modal
│
├── providers/                # 🌍 Context providers
│   └── theme-provider.tsx    # Theme context provider
│
├── mode-toggle.tsx           # Dark mode toggle (legacy)
├── client-only.tsx           # Client-side only wrapper
├── error-boundary.tsx        # React error boundary
└── realtime-notifications.tsx # SSE notifications component
```

**Component Organization Rules**:

1. **shadcn/ui components** → `components/ui/` (never modified directly)
2. **Module-specific components** → `components/{module-name}/`
3. **Shared across modules** → `components/shared/`
4. **Feature-specific** → `components/{module}/{feature}/`

---

## `lib/` - Business Logic & Utilities

### Overview

Domain logic, database access, integrations, and utilities. Organized by domain/responsibility.

### Structure

```
lib/
├── db/                       # 🗄️ Database layer
│   ├── schema.ts             # ⭐ Complete database schema (50+ tables)
│   ├── index.ts              # Drizzle client initialization
│   └── queries/              # Reusable database queries
│       ├── client-queries.ts
│       ├── task-queries.ts
│       └── dashboard-queries.ts
│
├── ai/                       # 🤖 AI integrations
│   ├── extract-client-data.ts      # Google Gemini document extraction
│   ├── save-extracted-data.ts      # Save extracted data
│   └── questionnaire-prefill.ts    # Questionnaire AI prefill
│
├── kyc/                      # 🔍 KYC/AML integrations
│   └── lemverify-client.ts   # LEM Verify API client
│
├── docuseal/                 # ✍️ E-Signature integration
│   ├── client.ts             # DocuSeal API client
│   ├── uk-compliance-fields.ts # UK compliance signature fields
│   └── email-handler.ts      # DocuSeal email handling
│
├── xero/                     # 📑 Accounting integration
│   └── client.ts             # Xero API client (partial)
│
├── s3/                       # 📦 Object storage
│   ├── upload.ts             # S3 upload utility
│   ├── upload.test.ts        # Upload tests
│   └── signed-pdf-access.ts  # Generate signed URLs
│
├── storage/                  # 📂 Storage abstraction
│   └── s3.ts                 # S3 client configuration
│
├── email/                    # 📧 Email service
│   ├── index.ts              # Resend client + email sender
│   ├── preview.ts            # Email preview utility
│   ├── send-client-portal-invitation.ts
│   └── templates/            # React Email templates
│       └── (email template components)
│
├── pdf/                      # 📄 PDF generation
│   └── (react-pdf components)
│
├── export/                   # 📊 Data export
│   └── task-export.ts        # Task XLSX export
│
├── utils/                    # 🛠️ Utility functions
│   ├── format.ts             # Formatting utilities
│   ├── export-csv.ts         # CSV export utility
│   └── sales-stage-automation.ts # Sales stage automation
│
├── hooks/                    # 🪝 Custom React hooks
│   ├── use-debounce.ts       # Debounce hook
│   ├── use-sse.ts            # Server-sent events hook
│   ├── use-time-entries.ts   # Time entries hook
│   └── use-tenant.ts         # Tenant context hook
│
├── constants/                # 📋 Constants and enums
│   ├── work-types.ts         # Work type definitions
│   ├── pipeline-stages.ts    # Sales pipeline stages
│   └── sales-stages.ts       # Sales stage definitions
│
├── rate-limit/               # 🚦 Rate limiting
│   ├── webhook.ts            # Webhook rate limiter
│   ├── webhook.test.ts       # Webhook rate limit tests
│   └── signing.ts            # Signing rate limiter
│
├── client-portal/            # 🔐 Client portal utilities
│   ├── access-manager.ts     # Access control
│   └── auto-convert-lead.ts  # Auto-convert lead to client
│
├── lead-scoring/             # 📈 Lead scoring
│   └── calculate-score.ts    # Lead score calculation
│
├── cron/                     # ⏰ Scheduled jobs
│   └── expire-proposals.ts   # Proposal expiry job
│
├── trpc/                     # 🔌 tRPC client
│   └── client.ts             # tRPC React client setup
│
├── auth.ts                   # 🔒 Staff authentication (Better Auth)
├── auth-client.ts            # 🔒 Staff auth client hooks
├── client-portal-auth.ts     # 🔐 Client portal auth (Better Auth)
├── client-portal-auth-client.ts # 🔐 Portal auth hooks
├── email-client-portal.ts    # 📧 Portal email utilities
├── rate-limit.ts             # 🚦 tRPC rate limiter
├── rate-limit.test.ts        # Rate limit tests
├── cache.ts                  # 💾 Cache utilities
├── cache.test.ts             # Cache tests
├── config.ts                 # ⚙️ App configuration
├── config.test.ts            # Config tests
├── utils.ts                  # 🛠️ General utilities (cn helper)
├── api-client.ts             # 🌐 API client utilities
├── sentry.ts                 # 🐛 Sentry error helpers
└── console-capture.ts        # 🖥️ Console log capture (feedback feature)
```

**Key Files**:

- **`lib/db/schema.ts`** - Single source of truth for database structure
- **`lib/auth.ts`** - Staff authentication + tenant context
- **`lib/client-portal-auth.ts`** - Client portal authentication + client context
- **`lib/rate-limit.ts`** - tRPC rate limiting middleware
- **`lib/sentry.ts`** - Centralized error tracking

---

## `scripts/` - Operational Scripts

### Overview

Database seeding, migrations, and development tools.

### Structure

```
scripts/
├── seed.ts                   # ⭐ Main database seeding script
├── seed-auth-users.ts        # Better Auth user seeding
├── migrate.ts                # Migration runner
├── setup-minio.sh            # MinIO bucket initialization
└── (future scripts)
```

**Commands**:
```bash
pnpm db:seed          # Run seed.ts
pnpm db:seed:auth     # Run seed-auth-users.ts
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset DB (migrate + seed + seed:auth)
```

---

## `drizzle/` - Database Migrations

### Overview

SQL migrations for views and indexes. Schema changes are made directly in `lib/db/schema.ts` (no migration files during development).

### Structure

```
drizzle/
├── 0000_create_views.sql                # 14 database views
├── 0001_add_performance_indexes.sql     # 5 performance indexes
└── meta/                                # Drizzle metadata (gitignored)
```

**Migration Strategy**:
- **Development**: Direct schema updates, no migrations (per CLAUDE.md)
- **Production**: Manual SQL migrations for views/indexes only

---

## `docs/` - Documentation

### Overview

Comprehensive project documentation for developers and AI agents.

### Structure

```
docs/
├── architecture/             # 🏗️ Architecture documentation
│   ├── README.md             # Architecture index
│   ├── system-overview.md    # Complete brownfield architecture
│   ├── multi-tenancy.md      # Dual-level isolation architecture
│   ├── authentication.md     # Dual Better Auth system
│   ├── api-design.md         # tRPC patterns and conventions
│   ├── design-system.md      # Glass-card design system
│   ├── tech-stack.md         # ⭐ This document
│   ├── source-tree.md        # ⭐ Directory structure (you are here)
│   └── coding-standards.md   # ⭐ Coding conventions
│
├── guides/                   # 📖 How-to guides
│   └── (future guides)
│
├── reference/                # 📚 Reference documentation
│   ├── api/
│   │   └── routers.md        # tRPC router reference
│   └── database/
│       └── schema.md         # Database schema reference
│
├── PRE_PRODUCTION_ISSUES.md  # Known issues and technical debt
└── MICROSOFT_OAUTH_SETUP.md  # Microsoft OAuth setup guide
```

---

## `public/` - Static Assets

### Overview

Static files served directly by Next.js.

### Structure

```
public/
├── images/           # Image assets
├── fonts/            # Custom fonts (if any)
└── (other static files)
```

---

## `.claude/` - AI Agent Skills

### Overview

Claude Code skills and slash commands for development automation.

### Structure

```
.claude/
├── skills/                   # Claude Code skills
│   ├── practice-hub-testing/
│   ├── practice-hub-debugging/
│   ├── practice-hub-database-ops/
│   ├── artifacts-builder/
│   ├── brand-guidelines/
│   ├── webapp-testing/
│   └── skill-creator/
└── commands/                 # Custom slash commands
    └── (future commands)
```

---

## Configuration Files

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, metadata |
| `pnpm-lock.yaml` | Dependency lockfile |
| `tsconfig.json` | TypeScript compiler configuration |
| `next.config.ts` | Next.js configuration (Sentry, headers) |
| `tailwind.config.js` | Tailwind CSS v4 configuration |
| `postcss.config.mjs` | PostCSS configuration (Tailwind) |
| `biome.json` | Biome linter/formatter configuration |
| `vitest.config.ts` | Vitest testing configuration |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `docker-compose.yml` | Local development services |
| `middleware.ts` | Next.js middleware (dual auth) |
| `instrumentation.ts` | Sentry initialization |
| `sentry.client.config.ts` | Sentry client configuration |
| `sentry.server.config.ts` | Sentry server configuration |
| `sentry.edge.config.ts` | Sentry edge runtime configuration |
| `components.json` | shadcn/ui configuration |
| `.gitignore` | Git ignore rules |
| `.env.local` | Local environment variables (gitignored) |
| `.env.example` | Example environment variables |
| `.env.production.example` | Production environment template |
| `README.md` | Project readme |
| `CLAUDE.md` | ⭐ Critical development rules |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | Contribution guidelines |
| `SECURITY.md` | Security policies |
| `AGENTS.md` | AI agent guidelines |

---

## Module Organization Pattern

Each module follows this pattern:

```
app/{module-name}/
├── layout.tsx                # Module layout (auth check, theme, sidebar)
├── page.tsx                  # Module homepage/dashboard
├── {feature}/
│   ├── page.tsx              # Feature list/overview
│   └── [id]/page.tsx         # Feature detail
└── {other-features}/
```

**Examples**:
- `app/client-hub/clients/page.tsx` - Clients list
- `app/client-hub/clients/[id]/page.tsx` - Client detail
- `app/proposal-hub/proposals/[id]/page.tsx` - Proposal detail

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `ClientModal.tsx` |
| Page Routes | kebab-case | `page.tsx`, `[id]/page.tsx` |
| Utilities | kebab-case | `format.ts`, `export-csv.ts` |
| Types | PascalCase | `AuthContext`, `Client` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Hooks | camelCase (use-prefix) | `use-debounce.ts` |
| Test Files | Same as file + `.test` | `cache.test.ts` |

---

## Import Path Aliases

TypeScript path aliases (configured in `tsconfig.json`):

```typescript
// @/* → Root directory
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { clientsRouter } from "@/app/server/routers/clients";
```

**Benefits**:
- No relative path hell (`../../../../lib/db`)
- Easy to refactor
- Consistent across codebase

---

## Key Directories Summary

| Directory | Purpose | Owner |
|-----------|---------|-------|
| `app/` | Next.js App Router (pages, layouts, API) | Frontend/Backend |
| `components/` | React components (UI, features, shared) | Frontend |
| `lib/` | Business logic, utilities, integrations | Backend |
| `scripts/` | Database seeding, migrations, dev tools | DevOps |
| `drizzle/` | SQL migrations (views, indexes) | Database |
| `docs/` | Architecture, guides, reference | Architecture |
| `public/` | Static assets | Frontend |
| `.claude/` | AI agent skills and commands | AI/DevOps |

---

## Related Documentation

- [System Overview](system-overview.md) - High-level architecture
- [Tech Stack](tech-stack.md) - Complete technology inventory
- [Coding Standards](coding-standards.md) - Coding conventions
- [Multi-Tenancy](multi-tenancy.md) - Data isolation patterns
- [API Design](api-design.md) - tRPC patterns

---

**For questions or updates, contact the architecture team.**
