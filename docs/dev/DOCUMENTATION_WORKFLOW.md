---
title: Documentation Workflow Guide
description: Complete guide for maintaining Practice Hub's hybrid documentation system
audience: [dev, ops]
status: complete
generated: HUMAN-AUTHORED
tags: [documentation, workflow, automation, best-practices]
---

# Documentation Workflow Guide

Complete workflow guide for Practice Hub's hybrid documentation system (CODE-EXTRACT + AI-GENERATED + HUMAN-AUTHORED).

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Daily Development Workflow](#daily-development-workflow)
- [Documentation System](#documentation-system)
- [Tagging Guide](#tagging-guide)
- [Maintenance Operations](#maintenance-operations)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Practice Hub uses a **three-section hybrid documentation system**:

1. **CODE-EXTRACT**: Auto-generated from `@doc:path#section` tags in code
2. **AI-GENERATED**: Created by Claude Skills, updated when drift >5%
3. **HUMAN-AUTHORED**: Manual content, never auto-overwritten

### Architecture

```mermaid
graph LR
    A[Code with @doc tags] --> B[extract_doclets.py]
    B --> C[docs/dev/doclets.yaml]
    C --> D[build_docs.py]
    E[docs/books.yaml] --> D
    D --> F[Unified Documentation]

    G[repo-facts.json] --> H[AI-GENERATED sections]
    H --> F

    I[Manual Edits] --> J[HUMAN-AUTHORED sections]
    J --> F
```

---

## Quick Start

### Initial Setup

```bash
# 1. Install Python dependencies
pip install -r scripts/requirements-docs.txt

# 2. Setup pre-commit hook (recommended)
pnpm docs:setup-precommit

# 3. Derive initial facts
pnpm docs:facts
```

### First Documentation Update

```bash
# 1. Add @doc tags to your code (see Tagging Guide below)

# 2. Extract tags
pnpm docs:extract

# 3. Build unified docs
pnpm docs:build

# 4. Validate
pnpm docs:validate

# 5. Commit
git add docs/
git commit -m "docs: update from code changes"
```

---

## Daily Development Workflow

### When You Add/Modify Code

**1. Tag as you code** (recommended):
```typescript
/**
 * @doc:api/clients#createClient
 * @doc-summary Creates a new client record with multi-tenant isolation
 * @doc-audience dev
 * @doc-tags mutation,clients,trpc
 *
 * Creates a client record linked to the authenticated user's tenant.
 * Validates email uniqueness within tenant scope.
 *
 * **Input**: CreateClientInput
 * **Output**: { success: boolean, client: Client }
 *
 * **Example**:
 * ```typescript
 * const result = await trpc.clients.create.mutate({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * ```
 */
export const createClient = protectedProcedure
  .input(createClientSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation...
  });
```

**2. Pre-commit hook runs automatically**:
- Derives repo facts
- Extracts documentation tags
- Builds unified documentation
- Validates documentation
- Auto-stages generated files

**3. Review and commit**:
```bash
git status  # Check generated files
git commit -m "feat: add createClient procedure"
```

---

## Documentation System

### Three Section Types

#### 1. CODE-EXTRACT

Auto-generated from `@doc` tags in code. Never edit manually.

**In Markdown**:
```markdown
<!-- BEGIN CODE-EXTRACT: api/clients -->
**This content is auto-generated from code tags**
<!-- END CODE-EXTRACT: api/clients -->
```

**In Code**:
```typescript
/**
 * @doc:api/clients#createClient
 * @doc-summary Creates a new client record
 * ...
 */
```

#### 2. AI-GENERATED

Created by Claude Skills, updated when drift >5%.

**In Markdown**:
```markdown
<!-- BEGIN AI-GENERATED -->
**Total Routers**: {{repo-facts.routers.total}}
**Total Procedures**: {{repo-facts.routers.procedures.total}}

[Auto-generated content from repo-facts.json]
<!-- END AI-GENERATED -->
```

**Triggers**:
- Repo facts change significantly (>5%)
- User requests documentation update
- Weekly maintenance run

#### 3. HUMAN-AUTHORED

Manual content, never auto-overwritten. Write freely!

**In Markdown**:
```markdown
<!-- HUMAN-AUTHORED SECTION -->
## Custom Guide

Your manual content here. This will NEVER be overwritten by automation.
```

---

## Tagging Guide

### Tag Format

```typescript
/**
 * @doc:path#section                    // REQUIRED: Target location
 * @doc-summary One-line description    // REQUIRED: Brief summary
 * @doc-audience dev|ops|user           // RECOMMENDED: Target audience
 * @doc-tags tag1,tag2,tag3             // RECOMMENDED: Searchable tags
 *
 * Detailed documentation content goes here.
 * This will be extracted and inserted into the target document.
 *
 * **Use markdown** for formatting!
 */
```

### Target Paths

Defined in `docs/books.yaml`:

| Path | Target File | Description |
|------|-------------|-------------|
| `api/{router}` | `docs/reference/api/routers.md` | tRPC router procedures |
| `db/schema` | `docs/reference/database/schema.md` | Database tables |
| `components/{category}` | `docs/development/components.md` | React components |
| `env/{category}` | `docs/reference/configuration/environment.md` | Environment variables |
| `patterns/{name}` | Various | Implementation patterns |

### When to Tag

**High Priority** (tag immediately):
- ✅ tRPC router procedures (queries/mutations)
- ✅ Database tables and enums
- ✅ Environment variables

**Medium Priority** (tag when stabilized):
- ⚠️ Reusable utility functions
- ⚠️ Custom React hooks
- ⚠️ API clients and integrations

**Low Priority** (optional):
- ℹ️ UI components (if reusable)
- ℹ️ Type definitions (if exported)

### Tag Examples

**tRPC Procedure**:
```typescript
/**
 * @doc:api/clients#list
 * @doc-summary Lists all clients for the authenticated tenant
 * @doc-audience dev
 * @doc-tags query,clients,trpc,multi-tenant
 *
 * Retrieves all client records scoped to the user's tenant.
 * Results are paginated with 50 items per page.
 *
 * **Input**: { page?: number, search?: string }
 * **Output**: { clients: Client[], total: number, page: number }
 *
 * **Example**:
 * ```typescript
 * const { clients, total } = await trpc.clients.list.query({ page: 1 });
 * ```
 */
```

**Database Table**:
```typescript
/**
 * @doc:db/schema#clients
 * @doc-summary Clients table stores customer business information
 * @doc-audience dev,ops
 * @doc-tags database,schema,multi-tenant
 *
 * Main CRM table for client (customer business) records.
 * Implements tenant-level isolation via `tenantId` foreign key.
 *
 * **Relationships**:
 * - belongs_to: tenants (via tenantId)
 * - has_many: contacts, directors, compliance
 *
 * **Indexes**:
 * - PRIMARY KEY: id
 * - UNIQUE: (tenantId, email)
 * - INDEX: tenantId, createdAt
 */
```

**Environment Variable**:
```typescript
/**
 * @doc:env/database#DATABASE_URL
 * @doc-summary PostgreSQL connection string
 * @doc-audience ops
 * @doc-tags environment,database,required
 *
 * **Required**: Yes
 * **Format**: `postgresql://user:password@host:port/database`
 *
 * **Development**:
 * ```
 * DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"
 * ```
 *
 * **Production**:
 * ```
 * DATABASE_URL="postgresql://prod_user:strong_pass@db.example.com:5432/practice_hub_prod"
 * ```
 */
```

---

## Maintenance Operations

### Full Maintenance Cycle

```bash
# Complete automation (recommended)
pnpm docs:maintain

# Or manual steps:
pnpm docs:facts          # 1. Derive repo facts
pnpm docs:extract        # 2. Extract @doc tags
pnpm docs:build          # 3. Build unified docs
pnpm docs:validate       # 4. Validate all docs
```

### Audit Operations

```bash
# Find items needing documentation
pnpm docs:audit-tags

# Generate tagging plan
pnpm docs:tag-plan

# Apply tags (dry run first!)
pnpm docs:tag-apply

# Apply tags for real
pnpm docs:tag-apply-force

# Rollback if needed
pnpm docs:tag-rollback

# Check for redundant code
pnpm audit:redundancy

# Fix broken internal links
pnpm docs:fix-links
```

### Generate Module READMEs

```bash
# Auto-generate module documentation
pnpm docs:generate:modules
```

### Drift Detection

```bash
# Check for stale AI-GENERATED content
pnpm docs:validate:drift

# With custom threshold (default: 5%)
python3 scripts/check_doc_drift.py --threshold 0.10
```

---

## CI/CD Integration

### Pre-commit Hook

Installed via `pnpm docs:setup-precommit`:

```bash
#!/bin/bash
# Runs automatically on every commit

# 1. Derive repo facts
pnpm docs:facts

# 2. Extract @doc tags
pnpm docs:extract

# 3. Build unified docs
pnpm docs:build

# 4. Validate documentation
pnpm docs:validate || exit 1

# 5. Auto-stage generated files
git add docs/dev/repo-facts.json
git add docs/dev/doclets.yaml
git add docs/reference/**/*.md
git add .claude/skills/practice-hub-docs-search/doc-index.json
```

### GitHub Actions

**Documentation Validation** (`.github/workflows/docs-validation.yml`):
- Runs on every push to `main`/`develop`
- Validates frontmatter, checks for orphans, detects drift
- Ensures generated files are up-to-date
- Uploads redundancy audit reports

**Security Scan** (`.github/workflows/security-scan.yml`):
- Scans for exposed secrets in docs
- Validates `.env.example` format
- Checks dependency licenses
- Runs vulnerability scan

---

## Troubleshooting

### Tag Not Extracted

**Problem**: Added `@doc` tag but it doesn't appear in docs.

**Solutions**:
1. Check target exists in `docs/books.yaml`
2. Verify extraction zone exists in target file
3. Run `pnpm docs:extract` manually
4. Check `docs/dev/doclets.yaml` for errors

### Extraction Zone Overwritten

**Problem**: Manual edits to CODE-EXTRACT zones get replaced.

**Solution**: Never edit CODE-EXTRACT zones! Use HUMAN-AUTHORED sections:
```markdown
<!-- END CODE-EXTRACT: api/clients -->

<!-- HUMAN-AUTHORED SECTION -->
## Additional Notes

Your custom content here (won't be overwritten).
```

### Documentation Drift

**Problem**: `pnpm docs:validate:drift` reports drift >5%.

**Solutions**:
1. Review changes: `git diff docs/architecture/tech-stack.md`
2. If changes are correct, accept them
3. If incorrect, re-run `pnpm docs:build` to restore source-of-truth

### Invalid Doc Tag

**Problem**: `@doc:api/invalid` tag not recognized.

**Solutions**:
1. Check target path in `docs/books.yaml`
2. Add target if missing:
   ```yaml
   targets:
     api/invalid:
       file: docs/reference/api/routers.md
       section: "<!-- BEGIN CODE-EXTRACT: api/invalid -->"
       type: code-extract
   ```
3. Add extraction zone to target file

### Pre-commit Hook Fails

**Problem**: Pre-commit hook exits with error.

**Solutions**:
1. Check error message (usually validation failure)
2. Fix validation errors
3. Re-run commit
4. **Emergency**: Skip hook with `git commit --no-verify` (NOT RECOMMENDED)

---

## Best Practices

### 1. Tag as You Code
✅ Add `@doc` tags when writing new procedures/tables/components
❌ Don't wait until end of sprint to tag everything

### 2. Keep Tags Close
✅ Place tags directly above the code they document
❌ Don't put tags far from code or in separate files

### 3. Use Clear Summaries
✅ "Creates a new client record with multi-tenant isolation"
❌ "Client creation" (too vague)

### 4. Provide Examples
✅ Always include usage examples for routers and components
❌ Don't just describe inputs/outputs without showing how to use

### 5. Run Maintenance Before Commits
✅ `pnpm docs:maintain` before pushing
❌ Don't let documentation drift accumulate

### 6. Review Generated Content
✅ Check that extracted content looks correct
❌ Don't blindly trust automation

### 7. Use HUMAN-AUTHORED for Context
✅ Add architectural context, decision rationale
❌ Don't try to document everything via tags

### 8. Validate Regularly
✅ Run `pnpm docs:validate` in CI
❌ Don't skip validation "just this once"

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `derive_repo_facts.ts` | Scan codebase for stats | `pnpm docs:facts` |
| `extract_doclets.py` | Extract @doc tags | `pnpm docs:extract` |
| `build_docs.py` | Merge into unified docs | `pnpm docs:build` |
| `check_doc_drift.py` | Detect stale content | `pnpm docs:validate:drift` |
| `audit_taggable_items.py` | Find untagged items | `pnpm docs:audit-tags` |
| `generate_tagging_plan.py` | Generate tagging plan | `pnpm docs:tag-plan` |
| `apply_tags.py` | Apply tags automatically | `pnpm docs:tag-apply` |
| `generate_module_readmes.ts` | Generate module READMEs | `pnpm docs:generate:modules` |
| `audit-redundancy.ts` | Find unused code/deps | `pnpm audit:redundancy` |
| `fix_doc_links.py` | Fix broken links | `pnpm docs:fix-links` |
| `validate-frontmatter.ts` | Check frontmatter | `pnpm docs:validate:frontmatter` |
| `find-orphaned-docs.sh` | Find orphaned docs | `pnpm docs:validate:orphans` |

---

## Metrics & Quality Gates

### Coverage Metrics

Track documentation coverage:
```bash
# Find untagged items
pnpm docs:audit-tags

# Check current coverage
# Total taggable: 275 items (80 tables + 39 env vars + 156 components)
# Tagged: 0 (0% coverage)
```

**Quality Gates**:
- ✅ **Gold**: >80% coverage, <5% drift
- ⚠️ **Silver**: >50% coverage, <10% drift
- ❌ **Bronze**: <50% coverage, >10% drift

### Drift Thresholds

- **Green**: 0-5% drift (acceptable)
- **Yellow**: 5-10% drift (needs review)
- **Red**: >10% drift (requires immediate update)

---

## References

- **Tagging Spec**: [DOC_TAGGING_SPEC.md](./DOC_TAGGING_SPEC.md)
- **Target Mapping**: [books.yaml](../books.yaml)
- **Skills**: [.claude/skills/docs-maintainer/](../../.claude/skills/docs-maintainer/)
- **Subagent**: [.claude/agents/docs-update.md](../../.claude/agents/docs-update.md)

---

**Questions?** Contact the Practice Hub Documentation Team or open an issue on GitHub.

**Maintained by**: Practice Hub Documentation Team
**Last Updated**: 2025-01-24
**Version**: 1.0.0
