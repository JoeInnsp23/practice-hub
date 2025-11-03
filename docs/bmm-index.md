# Practice Hub - Master Documentation Index

**Generated:** 2025-01-03  
**Documentation System:** Aggressively Consolidated  
**Purpose:** AI-Optimized Single Entry Point for Development  

---

## 🚀 Quick Start for AI Agents

**MANDATORY Load Order:**

1. **[00-ai-index/README.md](./00-ai-index/README.md)** - ⭐ START HERE: AI documentation index with load order and save rules
2. **[Brownfield Architecture](./bmm-brownfield-architecture.md)** - Complete system state, 96 tables/views, 44 routers, 1,778 tests
3. **Critical Rules:** [CLAUDE.md](../CLAUDE.md) - Development rules and conventions
4. **Development Standards:** [Coding Standards](./coding-standards.md) - Router creation, testing, database patterns
5. **Load integration guides as needed** based on specific task

---

## 📋 Executive Summary

**Project:** practice-hub - Multi-Tenant Practice Management SaaS  
**Status:** ~70% Complete - Preparing for Client Hub & Proposal Hub Launch  
**Tech Stack:** Next.js 15 + React 19 + TypeScript + tRPC + PostgreSQL + Better Auth  
**Database:** 96 tables/views (80 tables + 16 views)  
**API:** 44 tRPC routers (type-safe)  
**Tests:** 1,778 test cases in 85 files  
**Modules:** 7 hubs (Client, Proposal, Practice, Admin, Employee, Portal, Social)  

**Critical for Launch:**
- Client Hub: ~70% complete
- Proposal Hub: ~70% complete  
- Employee Hub: Newly created

---

## 🏗️ Core Architecture Documentation

### 🔴 PRIMARY DOCUMENT: Brownfield Architecture

**📄 [bmm-brownfield-architecture.md](./bmm-brownfield-architecture.md)** - ⭐ START HERE

**Complete system documentation including:**
- Technology stack (frontend, backend, integrations)
- All 96 database tables/views cataloged
- All 44 tRPC routers documented  
- 100+ React components inventoried
- Pricing engine deep-dive
- Multi-tenancy & authentication architecture
- Technical debt & launch checklists
- Development workflows

**When to use:** ANY development task - this is your comprehensive reference

---

### Additional Essential Documentation

**Development:**
- [Coding Standards](./coding-standards.md) - Complete dev standards including:
  - Creating tRPC routers (step-by-step guide)
  - Testing patterns (Vitest, Playwright)
  - Database query patterns
  - React component standards
  - Error handling and logging

**Technical References:**
- [Known Issues](./known-issues.md) - Known issues, troubleshooting, workarounds
- [Realtime Architecture](./realtime-architecture.md) - SSE implementation details

---

## 📁 Integration Guides

**Location:** `guides/integrations/`

- [Microsoft OAuth](./guides/integrations/microsoft-oauth.md) - Staff SSO authentication
- [Xero](./guides/integrations/xero.md) - Accounting integration (in progress)
- [DocuSeal](./guides/integrations/docuseal.md) - E-signature platform
- [Sentry](./guides/integrations/sentry.md) - Error tracking and monitoring
- [LEM Verify](./guides/integrations/lemverify.md) - KYC/AML identity verification
- [Companies House](./guides/integrations/companies-house.md) - UK company data lookup

---

## 📚 Reference Documentation

**API & Database:**
- [tRPC Routers](./reference/api/routers.md) - All 44 routers documented
- [Database Schema](./reference/database/schema.md) - Complete 96 tables/views reference (13,060 words)
- [Database Scripts](./reference/database/scripts.md) - Management scripts

**Configuration & Security:**
- [Environment Variables](./reference/configuration/environment.md) - All env vars
- [CSRF Protection](./reference/security/csrf.md) - Security implementation
- [Error Codes](./reference/error-codes.md) - Standard error codes
- [Integrations Reference](./reference/integrations.md) - All 9 integrations overview

---

## 🚀 Operations Documentation

- [Deployment](./operations/deployment.md) - Production deployment procedures
- [Runbooks](./operations/runbooks.md) - Operations procedures (includes backup, monitoring, production checklist)

---

## 💰 Pricing Engine Documentation

**Location:** `pricing/` (20 files of comprehensive research)

**Core Research:**
- Executive brief, service inventory, market research
- Pricing models (A & B), DSL, quote workflow  
- Test plan, readiness checklist, rollout plan
- Decisions, gaps analysis

**Market Data:**
- 6 competitor pricing snapshots
- Research planning and methodology

**Critical Components:**
- Pricing Calculator: 28 services, 138+ rules
- Complexity Multipliers: Model A (transaction-based), Model B (simplified)
- Discount Engine: Volume, new client, rush service

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
pnpm test             # Run all tests (1,778 test cases in 85 files)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test:e2e         # E2E tests (Playwright)
```

### Docker
```bash
docker compose up -d  # Start services
docker compose down   # Stop services
```

---

## 📝 Documentation Maintenance

**Last Updated:** 2025-01-03  
**Documentation Version:** 3.0 - Aggressively Consolidated  
**Active Files:** 45 (reduced from 121)  
**Owner:** Development Team  

**How to Update:**
1. Primary reference: Keep [bmm-brownfield-architecture.md](./bmm-brownfield-architecture.md) current
2. Standards: Update [coding-standards.md](./coding-standards.md) when patterns change
3. Integrations: Add new guides to guides/integrations/ as needed
4. Metrics: Update test/table counts after significant codebase changes

**Documentation Organization:**
- **[60-active-planning/](60-active-planning/README.md)** - Active phases, launch plans, sprints
- **[90-completed/](90-completed/README.md)** - Completed phases, historical reports

**Special Note:**
- `.archive/` in project root is OLD CRM app reference only - DO NOT add new docs there

---

**🎯 Remember: For ANY development task, start with [Brownfield Architecture](./bmm-brownfield-architecture.md) - it's your comprehensive system reference.**
