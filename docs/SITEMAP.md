# Documentation Sitemap

**Last Updated**: 2025-11-03 (Phase 3 Reorganization Complete)
**Total Documents**: ~90 (fully reorganized into numbered taxonomy)
**AI-Optimized**: Numbered index structure for easy navigation

---

## Numbered Documentation Index

- **[00-ai-index/](00-ai-index/README.md)** - ⭐ AI agent entry point (MANDATORY first read)
- **[10-system/](10-system/README.md)** - System architecture & core docs
- **[20-dev-standards/](20-dev-standards/README.md)** - Coding standards & documentation guide
- **[30-reference/](30-reference/README.md)** - API, database, config, security
- **[40-guides/](40-guides/README.md)** - Integration guides & specialized docs
- **[50-operations/](50-operations/README.md)** - Deployment & operational procedures
- **[60-active-planning/](60-active-planning/README.md)** - Active phases, launch plans, sprints
- **[70-research/](70-research/README.md)** - Research projects (pricing, market analysis)
- **[90-completed/](90-completed/README.md)** - Completed phases, historical reports

---

## Core System Documentation (Root)

- [bmm-brownfield-architecture.md](bmm-brownfield-architecture.md) - **START HERE** - Complete system reference
- [bmm-index.md](bmm-index.md) - BMad method entry point
- [coding-standards.md](coding-standards.md) - Development standards (router creation, testing, database)
- [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md) - Where to save documentation
- [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md) - Maintenance process & update triggers
- [known-issues.md](known-issues.md) - Known issues & troubleshooting
- [README.md](README.md) - Documentation overview
- [SITEMAP.md](SITEMAP.md) - This index

---

## 10-system/ - System Architecture

- [architecture-detailed/](10-system/architecture-detailed/README.md) - Detailed architecture docs
  - [api-design.md](10-system/architecture-detailed/api-design.md) - tRPC patterns, endpoints
  - [authentication.md](10-system/architecture-detailed/authentication.md) - Better Auth dual system
  - [multi-tenancy.md](10-system/architecture-detailed/multi-tenancy.md) - Dual isolation architecture
  - [realtime-architecture.md](10-system/architecture-detailed/realtime-architecture.md) - SSE implementation

---

## 30-reference/ - Technical Reference

### API & Database
- [api/routers.md](30-reference/api/routers.md) - 44 tRPC routers
- [database/schema.md](30-reference/database/schema.md) - 96 tables/views
- [database/scripts.md](30-reference/database/scripts.md) - Database utilities

### Configuration & Security
- [configuration/environment.md](30-reference/configuration/environment.md) - Environment variables
- [security/csrf.md](30-reference/security/csrf.md) - CSRF protection
- [error-codes.md](30-reference/error-codes.md) - Error code reference
- [integrations.md](30-reference/integrations.md) - Integrations overview

---

## 40-guides/ - Integration & Development Guides

### Integration Guides (6)
- [integrations/microsoft-oauth.md](40-guides/integrations/microsoft-oauth.md) - Staff SSO
- [integrations/xero.md](40-guides/integrations/xero.md) - Accounting integration
- [integrations/docuseal.md](40-guides/integrations/docuseal.md) - E-signatures
- [integrations/sentry.md](40-guides/integrations/sentry.md) - Error tracking
- [integrations/lemverify.md](40-guides/integrations/lemverify.md) - KYC/AML
- [integrations/companies-house.md](40-guides/integrations/companies-house.md) - UK company data

### Development Guides (3)
- [testing/bulk-operations-test-implementation-plan.md](40-guides/testing/bulk-operations-test-implementation-plan.md)
- [SECRETS_HANDLING.md](40-guides/SECRETS_HANDLING.md) - Secrets management
- [sql-safety-checklist.md](40-guides/sql-safety-checklist.md) - SQL safety patterns

---

## 50-operations/ - Deployment & Operations

- [deployment.md](50-operations/deployment.md) - Deployment procedures
- [runbooks.md](50-operations/runbooks.md) - Backup, monitoring, production checklist

---

## 60-active-planning/ - Current Phase Work

### Launch Planning
- [launch/LAUNCH_PLAN_REVISED.md](60-active-planning/launch/LAUNCH_PLAN_REVISED.md) - Revised launch plan
- [launch/MASTER_LAUNCH_PLAN.md](60-active-planning/launch/MASTER_LAUNCH_PLAN.md) - Master coordination

### Phase Tracking
- [phases/PHASE_1_EMPLOYEE_HUB.md](60-active-planning/phases/PHASE_1_EMPLOYEE_HUB.md) - Phase 1 work

### Agent Planning
- [agents/AGENT_ASSIGNMENTS.md](60-active-planning/agents/AGENT_ASSIGNMENTS.md) - Agent roles & assignments

---

## 70-research/ - Research & Pricing

### Pricing Research (~20 files)

**Business Logic (5):**
- [pricing/business-logic/CALCULATOR_LOGIC.md](70-research/pricing/business-logic/CALCULATOR_LOGIC.md)
- [pricing/business-logic/PRICING_STRUCTURE_2025.md](70-research/pricing/business-logic/PRICING_STRUCTURE_2025.md)
- [pricing/business-logic/SERVICE_COMPONENTS.md](70-research/pricing/business-logic/SERVICE_COMPONENTS.md)
- [pricing/business-logic/PRICING_EXAMPLES.md](70-research/pricing/business-logic/PRICING_EXAMPLES.md)
- [pricing/business-logic/STAFF_QUICK_GUIDE.md](70-research/pricing/business-logic/STAFF_QUICK_GUIDE.md)

**Core Pricing Docs (12):**
- [pricing/00-exec-brief.md](70-research/pricing/00-exec-brief.md)
- [pricing/10-service-inventory.md](70-research/pricing/10-service-inventory.md)
- [pricing/15-service-alignment-matrix.md](70-research/pricing/15-service-alignment-matrix.md)
- [pricing/20-market-research.md](70-research/pricing/20-market-research.md)
- [pricing/30-pricing-model.md](70-research/pricing/30-pricing-model.md)
- [pricing/32-pricing-dsl.md](70-research/pricing/32-pricing-dsl.md)
- [pricing/40-quote-workflow.md](70-research/pricing/40-quote-workflow.md)
- [pricing/45-readiness-checklist.md](70-research/pricing/45-readiness-checklist.md)
- [pricing/50-test-plan.md](70-research/pricing/50-test-plan.md)
- [pricing/55-gaps.md](70-research/pricing/55-gaps.md)
- [pricing/60-decisions.md](70-research/pricing/60-decisions.md)
- [pricing/70-rollout-plan.md](70-research/pricing/70-rollout-plan.md)

**Market Data:**
- [pricing/data/](70-research/pricing/data/) - Market snapshots, research data

---

## 90-completed/ - Archived & Historical

### Phase 0 (Documentation Audit - Complete)
- [phase-0/audit/](90-completed/phase-0/audit/) - Inventory, duplicates, code review
- [phase-0/code-review-phase-0.md](90-completed/phase-0/code-review-phase-0.md) - Phase 0 code review
- [phase-0/PHASE_0_DOC_AUDIT.md](90-completed/phase-0/PHASE_0_DOC_AUDIT.md) - Audit plan
- [phase-0/PHASE_0_COMPLETE.md](90-completed/phase-0/PHASE_0_COMPLETE.md) - Completion report

### Phase 1 (Future)
- Reserved for Phase 1 completion artifacts

### Phase 2 (Documentation Optimization - Complete)
- [phase-2/DOC_STATUS_REPORT.md](90-completed/phase-2/DOC_STATUS_REPORT.md) - Comprehensive audit findings

### Gap Analysis (Historical)
- [gap-analysis/](90-completed/gap-analysis/) - Feature gap analysis, DocuSeal readiness

### Project Artifacts
- [project-scan-report.json](90-completed/project-scan-report.json) - Brownfield scan results

---

**Documentation Version**: 4.0 - Fully Reorganized Numbered Taxonomy
**Total Files**: ~90 (from 1,528 including deprecated TypeDoc)
**Reduction**: 94% file count (mostly TypeDoc removal)
**Organization**: AI-optimized numbered taxonomy (00-90)
