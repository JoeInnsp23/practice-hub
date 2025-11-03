# Practice Hub - Master Documentation Index

**Generated:** 2025-01-03  
**Documentation System:** BMM (BMAD Method Management) + Existing Docs v2.1  
**Purpose:** AI-Optimized Single Entry Point for Development  

---

## 🚀 Quick Start for AI Agents

**Recommended Load Order for Development Tasks:**

1. **ALWAYS START HERE:** [Brownfield Architecture](./bmm-brownfield-architecture.md) - Complete system state, 114 tables, 44 routers, launch status
2. **Critical Rules:** [CLAUDE.md](../CLAUDE.md) - Development rules and conventions
3. **Module-Specific:** Load relevant module docs based on task:
   - Client Hub work → [Client Hub Docs](#client-hub-documentation)
   - Proposal Hub work → [Proposal Hub Docs](#proposal-hub-documentation)
   - Admin work → [Admin Panel Docs](#admin-documentation)

---

## 📋 Executive Summary

**Project:** practice-hub - Multi-Tenant Practice Management SaaS  
**Status:** ~70% Complete - Preparing for Client Hub & Proposal Hub Launch  
**Tech Stack:** Next.js 15 + React 19 + TypeScript + tRPC + PostgreSQL + Better Auth  
**Database:** 114 tables/views (50+ core, 14 views)  
**API:** 44 tRPC routers (type-safe)  
**Modules:** 7 hubs (Client, Proposal, Practice, Admin, Portal, Client-Admin, Social)  

**Critical for Launch:**
- Client Hub: ~70% complete, needs E2E testing
- Proposal Hub: ~70% complete, pricing calculator needs validation
- Pricing Engine: 28 services, 138+ rules - see [Pricing Research](./pricing/)

---

## 🏗️ Core Architecture Documentation

### 🔴 PRIMARY DOCUMENT: Brownfield Architecture

**📄 [bmm-brownfield-architecture.md](./bmm-brownfield-architecture.md)** - ⭐ START HERE

**Complete system documentation including:**
- Technology stack (frontend, backend, integrations)
- All 114 database tables/views cataloged
- All 44 tRPC routers documented  
- 100+ React components inventoried
- Pricing engine deep-dive
- Multi-tenancy & authentication architecture
- Technical debt & launch checklists
- Development workflows

**When to use:** ANY development task - this is your comprehensive reference

---

### Existing Architecture Documents (Complement Brownfield Doc)

**System Design:**
- [System Overview](./architecture/system-overview.md) - High-level system design
- [Multi-Tenancy Architecture](./architecture/multi-tenancy.md) - Dual-level isolation patterns
- [Authentication & Authorization](./architecture/authentication.md) - Dual Better Auth system
- [API Design & tRPC Patterns](./architecture/api-design.md) - Type-safe API architecture
- [Design System & UI Patterns](./architecture/design-system.md) - Glass-card design system
- [Tech Stack](./architecture/tech-stack.md) - Technology choices and versions
- [Coding Standards](./architecture/coding-standards.md) - Code style guidelines
- [Source Tree](./architecture/source-tree.md) - Directory structure explained

---

## 📁 Module-Specific Documentation

### Client Hub Documentation

**Brownfield Reference:** [Client Hub Section](./bmm-brownfield-architecture.md#client-hub-tables-25-tables) (~70% complete)

**Existing Docs:**
- [Client Hub Module README](./modules/client-hub/README.md) - Module overview
- [Database Schema](./reference/database/schema.md) - Full schema reference

**Routers:** 12 routers (clients, services, compliance, documents, tasks, task-templates, timesheets, invoices, calendar, reports, workflows, integrations)

**Launch Blockers:**
- E2E test coverage needed
- Load testing required
- UAT with pilot client

---

### Proposal Hub Documentation

**Brownfield Reference:** [Proposal Hub Section](./bmm-brownfield-architecture.md#proposal-hub-tables-15-tables) (~70% complete)

**Pricing Research:** [docs/pricing/](./pricing/) - Comprehensive pricing research and configuration

**Existing Docs:**
- [Proposal Hub Module README](./modules/proposal-hub/README.md) - Module overview
- [Pricing Research](./pricing/) - Market research, service catalog, pricing models

**Routers:** 8 routers (leads, proposals, pricing, pricingAdmin, pricingConfig, proposalTemplates, pipeline, transactionData)

**Critical Components:**
- Pricing Calculator: 28 services, 138+ rules
- Complexity Multipliers: Model A (transaction-based), Model B (simplified)
- Discount Engine: Volume, new client, rush service

**Launch Blockers:**
- **P0:** Pricing calculator validation with known scenarios
- E2E testing: Lead→Proposal→PDF→E-signature flow
- Load testing: 100 concurrent proposal generations

---

### Admin Documentation

**Note:** Currently named `admin/` in codebase - should be renamed to `admin-hub/` for consistency (P1 technical debt)

**Brownfield Reference:** [Admin Routers Section](./bmm-brownfield-architecture.md#admin-routers-8-routers)

**Existing Docs:**
- [Admin Panel Module README](./modules/admin-panel/README.md) - Module overview

**Key Functions:**
- User management (staff)
- KYC review queue (LEM Verify integration)
- Portal link management
- Email template editor
- Legal page management
- Department management
- Leave approvals

---

### Client Portal Documentation

**Dual Portal System:**
- **Internal Portal:** Staff-facing client data views (`app/client-portal/`)
- **External Portal:** Client-facing self-service (`app/(client-portal)/`)

**Brownfield Reference:** [Client Portal Tables](./bmm-brownfield-architecture.md#client-portal-tables-8-tables)

**Existing Docs:**
- [Client Portal Module README](./modules/client-portal/README.md) - Module overview

**Authentication:** Separate Better Auth instance (`lib/client-portal-auth.ts`)

**Key Features:**
- KYC/AML onboarding (LEM Verify + Google Gemini)
- Document access
- Proposal viewing/signing
- Internal messaging

**Status:** ~75% complete, near production-ready

---

## 🛠️ Development Documentation

### Getting Started

**New Developers:**
1. [Developer Quick Start](./getting-started/quickstart-developer.md) - Complete onboarding
2. [Brownfield Architecture](./bmm-brownfield-architecture.md) - System understanding
3. [CLAUDE.md](../CLAUDE.md) - CRITICAL development rules
4. [Project Structure](./getting-started/project-structure.md) - Directory organization

**AI Agents:**
1. [AI Agent Quick Start](./getting-started/quickstart-ai-agent.md) - Optimal context loading
2. [Brownfield Architecture](./bmm-brownfield-architecture.md) - Complete system reference
3. [CLAUDE.md](../CLAUDE.md) - Development rules and patterns

---

### How-To Guides

**Development Tasks:**
- [Creating tRPC Routers](./development/creating-routers.md) - Router creation guide
- [Adding Database Tables](./development/adding-tables.md) - Schema modification
- [Creating UI Components](./development/creating-components.md) - Component patterns
- [Testing Guide](./development/testing-guide.md) - Unit/integration/E2E testing
- [Debugging Guide](./development/debugging-guide.md) - Debugging techniques

**Integration Guides:**
- [Microsoft OAuth Setup](./guides/integrations/microsoft-oauth.md) - Staff SSO
- [LEM Verify Integration](./guides/integrations/lemverify.md) - KYC/AML
- [Sentry Setup](./guides/integrations/sentry.md) - Error tracking
- [Xero Integration](./guides/integrations/xero.md) - Accounting sync (in progress)
- [DocuSeal Integration](./guides/integrations/docuseal.md) - E-signatures
- [Companies House](./guides/integrations/companies-house.md) - UK company data

---

### Reference Documentation

**API Reference:**
- [tRPC Routers](./reference/api/routers.md) - All 44 routers documented
- [Brownfield Architecture - API Section](./bmm-brownfield-architecture.md#api-design---trpc-routers-44-routers) - Detailed router breakdown

**Database Reference:**
- [Database Schema](./reference/database/schema.md) - Complete schema
- [Brownfield Architecture - Database Section](./bmm-brownfield-architecture.md#database-schema-114-tablesviews) - Tables catalog
- [Database Scripts](./reference/database/scripts.md) - Management scripts

**Configuration:**
- [Environment Variables](./reference/configuration/environment.md) - All env vars
- [Brownfield Architecture - Deployment](./bmm-brownfield-architecture.md#deployment-architecture) - Production config

**Security:**
- [CSRF Protection](./reference/security/csrf.md) - Security implementation

**Business Logic:**
- [Proposal Business Logic](./reference/business-logic/proposals/) - Proposal workflows

---

## 🧪 Testing Documentation

**Current Status:** 58 tests passing (42 unit, 16 integration)

**Testing Guides:**
- [Testing Guide](./development/testing-guide.md) - Overall strategy
- [Unit Testing](./testing/unit-testing.md) - Vitest patterns
- [Integration Testing](./testing/integration-testing.md) - Integration patterns
- [E2E Testing](./testing/e2e-testing.md) - Playwright patterns
- [Test Data Factories](./testing/test-data-factories.md) - Test data generation
- [Coverage Guidelines](./testing/coverage-guidelines.md) - Coverage targets

**Testing Commands:**
```bash
pnpm test              # Unit tests (58 tests, <3s)
pnpm test:coverage     # Coverage report
pnpm test:e2e          # Playwright E2E
pnpm test:e2e:ui       # Interactive E2E
```

---

## 🚀 Operations Documentation

**Deployment:**
- [Deployment Guide](./operations/deployment.md) - Production deployment
- [Production Checklist](./operations/production-checklist.md) - Pre-launch validation
- [Brownfield Architecture - Deployment Section](./bmm-brownfield-architecture.md#deployment-architecture) - Deployment config

**Operations:**
- [Backup & Recovery](./operations/backup-recovery.md) - Database operations
- [Monitoring](./operations/monitoring.md) - Sentry + monitoring
- [Runbooks](./operations/runbooks.md) - Operational procedures

**Database Management:**
```bash
docker compose up -d      # Start PostgreSQL
pnpm db:reset             # ⚠️ CRITICAL: Drop + push + migrate + seed (ONE command only)
pnpm db:studio            # Drizzle Studio GUI
```

**⚠️ NEVER run individual migration commands - always use `pnpm db:reset`**

---

## 💰 Pricing Engine Documentation

**Location:** `docs/pricing/` + brownfield architecture

**Resources:**
- [Pricing Research](./pricing/) - Market research, competitor analysis
- [Brownfield Architecture - Pricing Engine](./bmm-brownfield-architecture.md#pricing-engine-deep-dive) - Technical implementation

**Service Catalog:**
- 28 services across 5 categories
- Accounts Preparation (7), Bookkeeping (5), Tax (8), Payroll (4), Advisory (4)

**Pricing Rules:**
- 138+ rules (complexity multipliers, discounts, premiums)
- Model A: Transaction-based (bank txns, invoices, employees)
- Model B: Simplified bands (small/medium/large/enterprise)

**Data Sources:**
- Manual input
- Transaction data upload
- Companies House integration

**Status:** Functional but needs validation testing before scale

---

## 🐛 Troubleshooting

**Common Errors:**
- [Troubleshooting Guide](./troubleshooting/common-errors.md) - Error solutions

**Known Issues:**
- [Technical Debt](./development/technical-debt.md) - Known issues and priorities
- [Brownfield Architecture - Technical Debt](./bmm-brownfield-architecture.md#technical-debt--known-issues) - P0/P1/P2 issues

**P0 Issues (Blocking Launch):**
1. Pricing calculator validation (138 rules)
2. Client Hub E2E test coverage
3. Proposal Hub E2E test coverage

**P1 Issues (Post-Launch):**
1. Module naming: `admin/` → `admin-hub/`
2. Documentation consolidation
3. Social Hub completion or removal

---

## 📊 Project Status & Launch Planning

### Current Completion Status

| Module | Completion | Launch Priority | Status |
|--------|-----------|----------------|--------|
| **Client Hub** | ~70% | P0 | 🚧 Active Development |
| **Proposal Hub** | ~70% | P0 | 🚧 Active Development |
| Practice Hub | ~60% | P1 | 🚧 Active |
| Admin Panel | ~65% | P1 | 🚧 Active |
| Client Portal | ~75% | P1 | ✅ Near Complete |
| Client Admin | ~50% | P2 | 🚧 Active |
| Social Hub | ~20% | P3 | 📋 Placeholder |

### Launch Checklists

**See:** [Brownfield Architecture - Next Steps for Launch](./bmm-brownfield-architecture.md#next-steps-for-launch)

**Client Hub Launch:**
- [ ] Complete E2E test coverage
- [ ] Verify multi-tenant data isolation
- [ ] Test Companies House integration
- [ ] Load test: 100 clients, 1000 tasks, 5000 time entries
- [ ] User acceptance testing
- [ ] Error monitoring setup (Sentry)
- [ ] Configure automated backups

**Proposal Hub Launch:**
- [ ] **P0:** Validate pricing calculator (all 28 services)
- [ ] Test complexity multipliers with real data
- [ ] Verify discount rules
- [ ] E2E test: Full proposal flow
- [ ] Load test: 100 concurrent proposals
- [ ] Review pricing research
- [ ] Train staff on calculator
- [ ] S3 lifecycle policies

---

## 🗂️ Documentation Categories (Existing Docs v2.1)

### Getting Started (4 docs)
- [AI Agent Quick Start](./getting-started/quickstart-ai-agent.md) - AI agent context loading
- [Developer Quick Start](./getting-started/quickstart-developer.md) - Developer onboarding
- [Project Structure](./getting-started/project-structure.md) - Directory organization
- [Common Tasks](./getting-started/common-tasks.md) - Frequent tasks

### Architecture (8 docs)
- **[Brownfield Architecture](./bmm-brownfield-architecture.md)** - ⭐ PRIMARY DOCUMENT
- [System Overview](./architecture/system-overview.md)
- [Multi-Tenancy](./architecture/multi-tenancy.md)
- [Authentication](./architecture/authentication.md)
- [API Design](./architecture/api-design.md)
- [Design System](./architecture/design-system.md)
- [Tech Stack](./architecture/tech-stack.md)
- [Coding Standards](./architecture/coding-standards.md)
- [Source Tree](./architecture/source-tree.md)

### Guides (12 docs)
- **Integrations:** Microsoft OAuth, LEM Verify, Sentry, Xero, DocuSeal, Companies House
- **Development:** Creating routers, adding tables, creating components, testing, debugging

### Reference (8 docs)
- API: tRPC Routers
- Database: Schema, Scripts
- Configuration: Environment
- Security: CSRF
- Business Logic: Proposals
- Integrations Reference
- Error Codes

### Operations (5 docs)
- Deployment, Production Checklist, Backup & Recovery, Monitoring, Runbooks

### Development (7 docs)
- Coding Standards, Creating Routers, Adding Tables, Creating Components, Testing, Debugging, Technical Debt

### Testing (5 docs)
- Unit, Integration, E2E, Test Data Factories, Coverage Guidelines

### Modules (7 docs)
- Client Hub, Proposal Hub, Practice Hub, Admin Panel, Client Portal, Client Admin, Social Hub

### Pricing (Multiple docs)
- Comprehensive pricing research in `docs/pricing/`

### Decisions (ADRs)
- Architecture Decision Records in `docs/decisions/`

### Troubleshooting
- Common Errors

---

## 📦 Quick Command Reference

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (user runs, not AI)
pnpm build            # Production build
pnpm lint             # Run Biome linter
pnpm typecheck        # TypeScript check
```

### Database (⚠️ CRITICAL: Only use pnpm db:reset)
```bash
pnpm db:reset         # Drop + push + migrate + seed (ONE command)
pnpm db:studio        # Open Drizzle Studio
```

### Testing
```bash
pnpm test             # Run all tests (58 tests passing)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test:e2e         # E2E tests (Playwright)
```

### Docker
```bash
docker compose up -d  # Start services
docker compose down   # Stop services
docker ps             # List running containers
```

---

## 🔗 External Resources

- **Better Auth Docs:** https://www.better-auth.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Drizzle ORM Docs:** https://orm.drizzle.team/docs
- **tRPC Docs:** https://trpc.io/docs
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Playwright Docs:** https://playwright.dev

---

## 📝 Documentation Maintenance

**Last Updated:** 2025-01-03  
**Documentation Version:** BMM 1.0 + Existing v2.1  
**Owner:** Development Team  

**How to Update:**
1. Primary reference: Keep [bmm-brownfield-architecture.md](./bmm-brownfield-architecture.md) current
2. Module docs: Update module READMEs as features complete
3. This index: Regenerate when major changes occur

**Feedback:**
- Found outdated info? Update the relevant doc directly
- Found bugs? Check [Technical Debt](./development/technical-debt.md)
- Need help? Check [Troubleshooting](./troubleshooting/common-errors.md)

---

**🎯 Remember: For ANY development task, start with [Brownfield Architecture](./bmm-brownfield-architecture.md) - it's your comprehensive system reference.**


