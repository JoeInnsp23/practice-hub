---
title: "AI Agent Quick Start Guide"
category: "getting-started"
subcategory: "ai-optimization"
purpose: "Load optimal context for AI agents working on Practice Hub"
audience: ["ai-agent"]
prerequisites: []
related: ["../architecture/system-overview.md", "../development/coding-standards.md"]
last_updated: "2025-10-21"
version: "2.0"
status: "current"
owner: "development-team"
tags: ["ai-agent", "context-loading", "quick-start"]
---

# AI Agent Quick Start Guide

**Quick Summary**: Optimal context loading sequence for AI agents (Claude Code, Cursor, etc.) working on Practice Hub

**Last Updated**: 2025-10-21 | **Version**: 2.0 | **Status**: Current

---

## Essential Context (Load First)

### 1. Critical Rules
**File**: `/CLAUDE.md` (root)
**Why**: Contains CRITICAL development rules that MUST be followed
**Key Points**:
- Database is in dev - NO MIGRATIONS (only `pnpm db:reset`)
- Always use shadcn/ui components first
- Glass-card design system (solid backgrounds, no transparency)
- Never run `pnpm dev` (user runs manually)
- Sentry for errors (NOT console.log)

### 2. System Overview
**File**: [`../architecture/system-overview.md`](../architecture/system-overview.md)
**Why**: Complete brownfield architecture reference
**Key Points**:
- Multi-tenant SaaS (Next.js 15 + PostgreSQL + Better Auth)
- Dual isolation (tenant + client level)
- 50+ tables, 29 tRPC routers, 14 database views
- Known issues: 3 critical schema fixes needed (client portal dual isolation)

### 3. Multi-Tenancy Architecture
**File**: [`../architecture/multi-tenancy.md`](../architecture/multi-tenancy.md)
**Why**: Core architectural pattern used everywhere
**Key Points**:
- Tenant = Accountancy firm
- Client = Customer business within tenant
- Staff queries: filter by `tenantId`
- Client portal queries: filter by `tenantId` AND `clientId`

---

## Load Based on Task Type

### Task: Adding New Feature
**Load**:
1. [`../architecture/system-overview.md`](../architecture/system-overview.md) - Overall architecture
2. [`../reference/database/schema.md`](../reference/database/schema.md) - Database patterns
3. [`../reference/api/routers.md`](../reference/api/routers.md) - tRPC patterns
4. [`../development/coding-standards.md`](../development/coding-standards.md) - Code conventions
5. [`../guides/development/creating-trpc-router.md`](../guides/development/creating-trpc-router.md) - Implementation guide

### Task: Fixing Bug
**Load**:
1. [`../troubleshooting/common-errors.md`](../troubleshooting/common-errors.md) - Known issues
2. [`../development/technical-debt.md`](../development/technical-debt.md) - Pre-production issues
3. [`../architecture/system-overview.md`](../architecture/system-overview.md) - System context
4. Relevant integration guide (if integration-related)

### Task: Database Changes
**Load**:
1. `/CLAUDE.md` - **CRITICAL**: Database reset procedure
2. [`../reference/database/schema.md`](../reference/database/schema.md) - Schema patterns
3. [`../guides/development/database-workflow.md`](../guides/development/database-workflow.md) - Step-by-step
4. [`../architecture/multi-tenancy.md`](../architecture/multi-tenancy.md) - Isolation patterns

### Task: Adding Integration
**Load**:
1. [`../architecture/system-overview.md`](../architecture/system-overview.md) - Integration points
2. [`../guides/integrations/`](../guides/integrations/) - Existing integration patterns
3. [`../reference/configuration/environment.md`](../reference/configuration/environment.md) - Environment vars
4. [`../development/security-guidelines.md`](../development/security-guidelines.md) - Security requirements

### Task: Deployment/Operations
**Load**:
1. [`../operations/deployment.md`](../operations/deployment.md) - Deployment checklist
2. [`../operations/production-checklist.md`](../operations/production-checklist.md) - Production readiness
3. [`../reference/configuration/environment.md`](../reference/configuration/environment.md) - Environment config
4. [`../operations/runbooks.md`](../operations/runbooks.md) - Operational procedures

---

## Critical Gotchas (Always Remember)

### Database Reset Procedure
**NEVER** run individual database commands. **ALWAYS** use:
```bash
pnpm db:reset
```
This command does EVERYTHING in the correct order.

### Design System
- **ONLY** use `.glass-card`, `.glass-subtle`, `.glass-table` classes
- **NO** transparency or glassmorphism effects
- **ALWAYS** solid backgrounds (`rgb(255, 255, 255)` not `rgba`)

### Multi-Tenant Queries
```typescript
// ❌ WRONG - Missing tenant isolation
const clients = await db.select().from(clients);

// ✅ CORRECT - Always filter by tenantId
const clients = await db
  .select()
  .from(clients)
  .where(eq(clients.tenantId, ctx.authContext.tenantId));
```

### Client Portal Dual Isolation
```typescript
// ❌ WRONG - Client portal missing clientId
const proposals = await db
  .select()
  .from(proposals)
  .where(eq(proposals.tenantId, authContext.tenantId));

// ✅ CORRECT - Client portal needs BOTH
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

### Error Handling
```typescript
// ❌ WRONG - Don't use console.error in production code
console.error('Error:', error);

// ✅ CORRECT - Use Sentry
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error, {
  tags: { operation: "operation_name" },
  extra: { context: "values" },
});
toast.error("User-friendly message");
```

---

## Common File Locations

### Key Entry Points
- **Main App**: `app/page.tsx` - Practice Hub dashboard
- **tRPC Routers**: `app/server/routers/*.ts` - 29 API routers
- **Database Schema**: `lib/db/schema.ts` - All table definitions
- **Auth Config**: `lib/auth.ts` - Staff auth, `lib/client-portal-auth.ts` - Client portal auth
- **Middleware**: `middleware.ts` - Route protection

### Configuration
- **Environment**: `.env.local` - Local dev config
- **Docker**: `docker-compose.yml` - PostgreSQL + MinIO + DocuSeal
- **Drizzle**: `drizzle.config.ts` - Database config
- **Package**: `package.json` - Dependencies and scripts

### Database
- **Schema**: `lib/db/schema.ts` - 50+ table definitions
- **Seed**: `scripts/seed.ts` - Database seeding
- **Migrations**: `drizzle/0000_create_views.sql`, `drizzle/0001_add_performance_indexes.sql`

### Integrations
- **LEM Verify**: `lib/kyc/lemverify-client.ts` - KYC/AML
- **Google Gemini**: `lib/ai/extract-client-data.ts` - AI document extraction
- **DocuSeal**: `lib/docuseal/client.ts` - E-signature
- **Resend**: `lib/email/index.ts` - Email
- **S3**: `lib/s3/upload.ts` - Object storage

---

## Quick Commands Reference

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

## Documentation Discovery

**Master Index**: [`../README.md`](../README.md) - Complete documentation index

**By Category**:
- **Architecture**: [`../architecture/`](../architecture/)
- **Guides**: [`../guides/`](../guides/)
- **Reference**: [`../reference/`](../reference/)
- **Operations**: [`../operations/`](../operations/)
- **Development**: [`../development/`](../development/)
- **Troubleshooting**: [`../troubleshooting/`](../troubleshooting/)

**By Task**: See master index for task-based navigation

---

## Need Help?

1. **Check troubleshooting**: [`../troubleshooting/common-errors.md`](../troubleshooting/common-errors.md)
2. **Review technical debt**: [`../development/technical-debt.md`](../development/technical-debt.md)
3. **Read system overview**: [`../architecture/system-overview.md`](../architecture/system-overview.md)
4. **Search master index**: [`../README.md`](../README.md)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 2.0 | AI-optimized version | Winston/Architect |

---

**Ready to start? Load the documents relevant to your task and begin!**
