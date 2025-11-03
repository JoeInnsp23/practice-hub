---
documentation_version: "3.0"
last_updated: "2025-01-03"
architecture: "aggressively-consolidated"
total_documents: 45
categories:
  - core
  - guides
  - reference
  - operations
  - pricing
---

# Practice Hub Documentation

**Aggressively Consolidated - January 2025**

**Start Here:** [`bmm-brownfield-architecture.md`](bmm-brownfield-architecture.md) - Complete system reference

---

## Quick Navigation

**For AI Agents (START HERE):**
1. **[00-ai-index/README.md](00-ai-index/README.md)** - ⭐ MANDATORY: AI documentation index with load order
2. Load [bmm-brownfield-architecture.md](bmm-brownfield-architecture.md) - Complete system state
3. Load [../CLAUDE.md](../CLAUDE.md) - CRITICAL development rules
4. Load integration guides as needed

**For Developers:**
1. [bmm-brownfield-architecture.md](bmm-brownfield-architecture.md) - System understanding
2. [coding-standards.md](coding-standards.md) - Development standards
3. [../CLAUDE.md](../CLAUDE.md) - CRITICAL rules

---

## Numbered Documentation Index

**AI-Optimized Structure (numbered prefixes for sorting):**

- **[00-ai-index/](00-ai-index/)** - AI agent entry point (MANDATORY first read)
- **[10-system/](10-system/)** - System architecture & core docs
- **[20-dev-standards/](20-dev-standards/)** - Coding standards & documentation guide
- **[30-reference/](30-reference/)** - API, database, config, security
- **[40-guides/](40-guides/)** - Integration guides & specialized docs
- **[50-operations/](50-operations/)** - Deployment & operational procedures
- **[60-active-planning/](60-active-planning/)** - Active phases, launch plans, sprints
- **[70-research/](70-research/)** - Research projects (pricing, market analysis)
- **[90-completed/](90-completed/)** - Completed phases, historical reports

---

## Core Documentation (7 files)

- [bmm-brownfield-architecture.md](bmm-brownfield-architecture.md) - **PRIMARY** - Complete system reference (96 tables/views, 44 routers, 1,778 tests)
- [README.md](README.md) - This file
- [SITEMAP.md](SITEMAP.md) - Complete documentation index
- [bmm-index.md](bmm-index.md) - BMad method entry point
- [coding-standards.md](coding-standards.md) - Development standards (includes router creation, testing, database patterns)
- [known-issues.md](known-issues.md) - Known issues and troubleshooting
- [realtime-architecture.md](realtime-architecture.md) - SSE implementation details

---

## Integration Guides (6 files)

**Location:** `guides/integrations/`

- [Microsoft OAuth](guides/integrations/microsoft-oauth.md) - Staff SSO setup
- [Xero](guides/integrations/xero.md) - Accounting integration
- [DocuSeal](guides/integrations/docuseal.md) - E-signature platform
- [Sentry](guides/integrations/sentry.md) - Error tracking
- [LEM Verify](guides/integrations/lemverify.md) - KYC/AML
- [Companies House](guides/integrations/companies-house.md) - UK company data

---

## Development Guides (3 files)

**Location:** `guides/`

- [Bulk Operations Testing](guides/testing/bulk-operations-test-implementation-plan.md)
- [Secrets Handling](guides/SECRETS_HANDLING.md)
- [SQL Safety Checklist](guides/sql-safety-checklist.md)

---

## Reference Documentation (7 files)

**API & Database:**
- [tRPC Routers](reference/api/routers.md) - All 44 routers
- [Database Schema](reference/database/schema.md) - Complete 96 tables/views reference
- [Database Scripts](reference/database/scripts.md)

**Configuration & Security:**
  - [Environment Variables](reference/configuration/environment.md)
- [CSRF Protection](reference/security/csrf.md)
- [Error Codes](reference/error-codes.md)
- [Integrations Reference](reference/integrations.md)

---

## Operations (2 files)

- [Deployment](operations/deployment.md) - Production deployment procedures
- [Runbooks](operations/runbooks.md) - Operations procedures (includes backup, monitoring, production checklist)

---

## Pricing Research (20 files)

**Location:** `pricing/`

Comprehensive market research, service catalog, and pricing models.

**Core Documents:**
- Executive brief, service inventory, market research
- Pricing models (A & B), DSL, quote workflow
- Test plan, readiness checklist, rollout plan
- Decisions, gaps analysis

**Market Data:**
- 6 competitor snapshots (pricing/data/market/snapshots/)
- Research planning (pricing/data/research/)

---

## Quick Command Reference

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (user runs)
pnpm build            # Production build
pnpm lint             # Run Biome linter
pnpm typecheck        # TypeScript check

# Database (CRITICAL: Only use pnpm db:reset)
pnpm db:reset         # Drop + push + migrate + seed (ONE command)
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run all tests (1,778 test cases in 85 files)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test:e2e         # E2E tests (Playwright)

# Docker
docker compose up -d  # Start services
docker compose down   # Stop services
```

---

## Special Directories

**Active Planning:**
- Location: `60-active-planning/` (phases, launch, agents, sprints)

**Completed Work:**
- Location: `90-completed/` (phase reports, retrospectives)

**Old CRM Archive (PROJECT ROOT ONLY):**
- Location: `/root/projects/practice-hub/.archive/` (NOT in docs/)
- Purpose: Reference material from archived CRM application
- ⚠️ DO NOT add new documentation here - it's for old app reference only

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-03 | 3.0 | **AGGRESSIVE CONSOLIDATION**: 121 → 45 files. Deleted 40+ files (reference/proposals duplicates, architecture subdocs, dev meta, user guides moved), archived planning docs, fixed metrics (1,778 tests, 96 tables/views) | Mary/Analyst |
| 2025-11-02 | 2.1 | Added stub files | Jose/Janitor |
| 2025-10-21 | 2.0 | AI-optimized architecture | Winston/Architect |
| 2025-10-21 | 1.0 | Initial structure | Development Team |

---

**Documentation Version**: 3.0  
**Last Updated**: 2025-01-03  
**Active Documents**: 45 (reduced from 121)  
**Status**: Aggressively Consolidated
