---
documentation_version: "2.0"
last_updated: "2025-10-21"
architecture: "ai-optimized"
total_documents: 45
categories:
  - getting-started
  - architecture
  - guides
  - reference
  - operations
  - development
  - troubleshooting
  - user-guides
---

# Practice Hub Documentation

**AI-Optimized Documentation Architecture v2.0**

**AI Agent Quick Start**: Load [`getting-started/quickstart-ai-agent.md`](getting-started/quickstart-ai-agent.md) for optimal context

---

## Document Discovery

### By Task

**Setting Up**:
- **Local development environment** → [Developer Quick Start](getting-started/quickstart-developer.md)
- **AI agent context loading** → [AI Agent Quick Start](getting-started/quickstart-ai-agent.md)
- **Microsoft OAuth** → [Microsoft OAuth Setup](guides/integrations/microsoft-oauth.md)
- **Sentry error tracking** → [Sentry Setup](guides/integrations/sentry.md)

**Understanding the System**:
- **Overall architecture** → [System Overview](architecture/system-overview.md)
- **Multi-tenancy patterns** → [Multi-Tenancy Architecture](architecture/multi-tenancy.md)
- **Authentication system** → [Authentication & Authorization](architecture/authentication.md)
- **API design patterns** → [API Design & tRPC Patterns](architecture/api-design.md)
- **UI design system** → [Design System & UI Patterns](architecture/design-system.md)

**Development Tasks**:
- **Creating a new tRPC router** → [API Design](architecture/api-design.md) → Router Patterns
- **Adding database table** → [Multi-Tenancy Architecture](architecture/multi-tenancy.md) → Schema Patterns
- **Adding UI component** → [Design System](architecture/design-system.md) → Component Library
- **Understanding database schema** → [Database Schema](reference/database/schema.md)

**Operations**:
- **Deploying to production** → [Deployment](operations/deployment.md)
- **Production readiness check** → [Production Checklist](operations/production-checklist.md)
- **Backup and recovery** → [Backup & Recovery](operations/backup-recovery.md)
- **Monitoring setup** → [Monitoring](operations/monitoring.md)

**Troubleshooting**:
- **Database connection issues** → [Common Errors](troubleshooting/common-errors.md)
- **Authentication problems** → [Common Errors](troubleshooting/common-errors.md)
- **Known technical debt** → [Technical Debt](development/technical-debt.md)

### By Role

**AI Agent**:
1. Load [AI Agent Quick Start](getting-started/quickstart-ai-agent.md)
2. Load [CRITICAL RULES](../CLAUDE.md) from root
3. Load [System Overview](architecture/system-overview.md)
4. Load task-specific docs based on work

**New Developer**:
1. [Developer Quick Start](getting-started/quickstart-developer.md)
2. [System Overview](architecture/system-overview.md)
3. [Multi-Tenancy Architecture](architecture/multi-tenancy.md)
4. [Coding Standards](development/coding-standards.md)

**Backend Developer**:
1. [API Design & tRPC Patterns](architecture/api-design.md)
2. [Multi-Tenancy Architecture](architecture/multi-tenancy.md)
3. [Database Schema](reference/database/schema.md)
4. [Authentication & Authorization](architecture/authentication.md)

**Frontend Developer**:
1. [Design System & UI Patterns](architecture/design-system.md)
2. [API Design & tRPC Patterns](architecture/api-design.md)
3. [Coding Standards](development/coding-standards.md)

**DevOps Engineer**:
1. [Operations Documentation](operations/)
2. [Deployment](operations/deployment.md)
3. [Monitoring](operations/monitoring.md)
4. [Environment Variables](reference/configuration/environment.md)

**System Admin**:
1. [User Guides](user-guides/)
2. [Operations Runbooks](operations/runbooks.md)

---

## Documentation Categories

### [Getting Started](getting-started/)

Quick start guides for developers and AI agents.

**Documents**:
- [AI Agent Quick Start](getting-started/quickstart-ai-agent.md) - Optimal context loading for AI agents
- [Developer Quick Start](getting-started/quickstart-developer.md) - Complete onboarding guide

---

### [Architecture](architecture/)

System design, patterns, and technical architecture.

**Documents**:
- [System Overview](architecture/system-overview.md) - Complete brownfield architecture reference
- [Multi-Tenancy Architecture](architecture/multi-tenancy.md) - Dual-level data isolation patterns
- [Authentication & Authorization](architecture/authentication.md) - Dual Better Auth system
- [API Design & tRPC Patterns](architecture/api-design.md) - Type-safe API architecture
- [Design System & UI Patterns](architecture/design-system.md) - Glass-card design system

**Key Topics**:
- Multi-tenant SaaS architecture (tenant + client isolation)
- Better Auth dual authentication system
- tRPC type-safe APIs (29 routers)
- shadcn/ui component library
- PostgreSQL database (50+ tables, 14 views)

---

### [Guides](guides/)

Task-oriented how-to guides for development and operations.

**Sub-categories**:
- **[Development](guides/development/)** - Coming soon
- **[Integrations](guides/integrations/)** - Integration setup guides
  - [Microsoft OAuth Setup](guides/integrations/microsoft-oauth.md)
  - [LEM Verify Integration](guides/integrations/lemverify.md)
  - [Sentry Setup](guides/integrations/sentry.md)
  - [Xero Integration](guides/integrations/xero.md)

---

### [Reference](reference/)

Technical reference for APIs, database, configuration, and business logic.

**Sub-categories**:
- **[API Reference](reference/api/)** - tRPC routers documentation
  - [tRPC Routers](reference/api/routers.md) - All 29 routers
- **[Database Reference](reference/database/)** - Schema and scripts
  - [Schema](reference/database/schema.md) - Complete database schema
  - [Scripts](reference/database/scripts.md) - Database management scripts
- **[Configuration](reference/configuration/)** - Environment and settings
  - [Environment Variables](reference/configuration/environment.md)
- **[Security](reference/security/)** - Security implementations
  - [CSRF Protection](reference/security/csrf.md)

**Standalone Documents**:
- [Integrations Reference](reference/integrations.md) - All 9 integrations
- [Error Codes](reference/error-codes.md) - Standard error codes

---

### [Operations](operations/)

Production operations, deployment, and maintenance.

**Documents**:
- [Deployment](operations/deployment.md) - Deployment procedures
- [Production Checklist](operations/production-checklist.md) - Pre-production validation
- [Backup & Recovery](operations/backup-recovery.md) - Database backup procedures
- [Monitoring](operations/monitoring.md) - Monitoring and alerting
- [Runbooks](operations/runbooks.md) - Operational procedures

---

### [Development](development/)

Development standards, conventions, and technical debt.

**Documents**:
- [Coding Standards](development/coding-standards.md) - Code style guidelines
- [Technical Debt](development/technical-debt.md) - Pre-production issues and TODOs

**Coming Soon**:
- Git Workflow
- Testing Strategy
- Code Review Checklist
- Security Guidelines

---

### [Troubleshooting](troubleshooting/)

Problem-solution database for common errors.

**Documents**:
- [Common Errors](troubleshooting/common-errors.md) - Top errors and solutions

**Coming Soon**:
- Database Issues
- Authentication Issues
- Integration Failures
- Performance Problems

---

### [User Guides](user-guides/)

End-user documentation for staff and clients.

**Note**: User guides directory exists but documentation is pending migration.

---

## Critical Files (Root Directory)

These files remain in the project root:

- **[CLAUDE.md](../CLAUDE.md)** - ⚠️ CRITICAL: Development rules and conventions (MUST READ for all developers and AI agents)
- **[README.md](../README.md)** - Project overview
- **[SECURITY.md](../SECURITY.md)** - Security policy
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contributing guidelines
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history

---

## Documentation Architecture

### AI-Optimized Design

**Features**:
- ✅ **YAML Frontmatter** - All docs have machine-readable metadata
- ✅ **Task-Oriented Organization** - Find docs by "what to do" not "what it is"
- ✅ **Single Source of Truth** - Zero redundancy, clear ownership
- ✅ **Cross-Referenced** - Related docs linked throughout
- ✅ **Version Controlled** - Last updated dates, change tracking
- ✅ **TL;DR Sections** - Quick summaries for AI agents and experienced developers

### Document Templates

All documents follow standardized templates in [`.meta/templates/`](.meta/templates/):
- [Guide Template](.meta/templates/guide-template.md)
- [Reference Template](.meta/templates/reference-template.md)

### Metadata Standard

Every document includes YAML frontmatter:

```yaml
---
title: "Document Title"
category: "architecture|guide|reference|operations|development"
subcategory: "specific-area"
purpose: "One-line description"
audience: ["ai-agent", "developer", "devops"]
prerequisites: ["other-doc.md"]
related: ["related-doc.md"]
last_updated: "YYYY-MM-DD"
version: "X.X"
status: "current|deprecated|draft"
owner: "team-name"
tags: ["keyword1", "keyword2"]
---
```

---

## Quick Command Reference

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (user runs, not AI)
pnpm build            # Production build
pnpm lint             # Run Biome linter
pnpm typecheck        # TypeScript check

# Database (CRITICAL: Only use pnpm db:reset)
pnpm db:reset         # Drop + push + migrate + seed (ONE command)
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run all tests (58 tests passing)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Docker
docker compose up -d  # Start services
docker compose down   # Stop services
docker ps             # List running containers
```

---

## Documentation Status

### Completed

✅ AI-optimized architecture (v2.0)
✅ YAML frontmatter for all core docs
✅ Task-based and role-based navigation
✅ Master index with discovery metadata
✅ Architecture documents (5 docs)
✅ Integration guides (4 docs)
✅ Reference documentation (6 docs)
✅ Operations documentation (5 docs)
✅ Development documentation (2 docs)
✅ Troubleshooting documentation (1 doc)

### In Progress

🚧 Development how-to guides
🚧 Additional troubleshooting guides
🚧 User guides migration

### Archived

📦 Historical documents in [`.archive/`](.archive/):
- Gap analysis reports
- Phase completion reports
- Handover documents
- Audit reports
- Pull request documentation

---

## Feedback & Contributions

**Found an issue?**
- Update the relevant document directly
- Check [Technical Debt](development/technical-debt.md) for known issues
- Consult [Troubleshooting](troubleshooting/common-errors.md) for common problems

**Want to contribute?**
- Read [CONTRIBUTING.md](../CONTRIBUTING.md)
- Follow [Coding Standards](development/coding-standards.md)
- Use document templates from [`.meta/templates/`](.meta/templates/)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 2.0 | AI-optimized documentation architecture | Winston/Architect |
| 2025-10-21 | 1.0 | Initial documentation structure | Development Team |

---

**Documentation Version**: 2.0
**Last Updated**: 2025-10-21
**Architecture**: AI-Optimized
**Status**: Current
