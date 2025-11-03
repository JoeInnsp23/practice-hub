# Documentation Maintenance Guide

**Purpose:** Prevent documentation drift by establishing update triggers, ownership, and validation processes.

**Created:** 2025-11-03 (Phase 2 Optimization)

---

## Ownership & Responsibility

### Doc Ownership by Directory

```
docs/10-system/              → Backend/Architecture Team
docs/20-dev-standards/       → Full Team
docs/30-reference/           → Backend Team
docs/40-guides/              → Feature Owners
docs/50-operations/          → DevOps/Backend
docs/60-active-planning/     → PM/Product
docs/70-research/            → Product/Business
docs/90-completed/           → Historical (Read-only)
```

**Setup:** Add to `.github/CODEOWNERS`:
```
/docs/10-system/**           @backend-team @architects
/docs/30-reference/**        @backend-team
/docs/50-operations/**       @devops @backend-team
/docs/70-research/**         @product-team
```

---

## Update Triggers (When Code Changes, Update Docs)

### Critical Triggers

| Code Change | Documentation to Update | File Path |
|-------------|------------------------|-----------|
| **Database Schema** (`lib/db/schema.ts`) | Database reference docs | `docs/30-reference/database/schema.md` |
| **New tRPC Router** (`app/server/routers/*.ts`) | API design docs | `docs/10-system/architecture-detailed/api-design.md` |
| **Auth Configuration** (`lib/auth.ts`, `lib/client-portal-auth.ts`) | Authentication docs | `docs/10-system/architecture-detailed/authentication.md` |
| **Pricing Logic** (`app/server/routers/pricing.ts`) | Calculator logic docs | `docs/70-research/pricing/business-logic/CALCULATOR_LOGIC.md` |
| **Multi-Tenancy Pattern** (auth context helpers) | Multi-tenancy docs | `docs/10-system/architecture-detailed/multi-tenancy.md` |
| **New Integration** (`lib/*.ts` for external services) | Integration guides | `docs/40-guides/integrations/*.md` |
| **Deployment Config** (Docker, env vars, infra) | Deployment docs | `docs/50-operations/deployment.md` |

### Update Process

1. **During Development:** Note doc updates needed in PR description
2. **Before PR Merge:** Update relevant docs in the same PR
3. **In Commit Message:** Reference doc updates: `feat(auth): add MFA support + update authentication.md`

---

## Validation & Quality Gates

### Pre-Commit Checks (Recommended CI Integration)

**Broken Link Checker:**
```bash
# Check for broken internal links in docs/
npm run docs:validate:links
```

**Freshness Checker:**
```bash
# Warn if docs haven't been updated in >6 months
npm run docs:validate:freshness
```

**Code Example Validator:**
```bash
# Check that code examples use valid imports/functions
npm run docs:validate:examples
```

### Manual Review Checklist

Before marking PR ready for review:
- [ ] Updated all docs listed in "Update Triggers" for this change
- [ ] Checked for broken links to moved/renamed files
- [ ] Verified code examples match current API
- [ ] Updated "Last Updated" date in doc frontmatter
- [ ] Ran local link checker (if available)

---

## Documentation Standards

### File Metadata (Frontmatter)

All architecture and reference docs should include:

```yaml
---
title: "Document Title"
category: "architecture | reference | guide | operations"
subcategory: "database | security | api | etc"
purpose: "One-sentence purpose of this doc"
audience: ["ai-agent", "developer", "ops"]
prerequisites: ["system-overview.md"]
related: ["../reference/database/schema.md"]
last_updated: "2025-11-03"
version: "1.0"
status: "current | needs_update | deprecated"
owner: "team-name"
tags: ["tag1", "tag2"]
---
```

### Status Tags

- **`current`** - Verified accurate within last 3 months
- **`needs_update`** - Known inaccuracies, update planned
- **`deprecated`** - Outdated, historical reference only

### Versioning

- **Major version bump** (1.0 → 2.0): Significant architectural change
- **Minor version bump** (1.0 → 1.1): New sections, updated examples
- **Update `last_updated`**: Any change, no matter how small

---

## Automated Documentation Opportunities

### Recommended Automation (Future)

1. **tRPC Router → API Reference**
   - Auto-generate API docs from router procedure definitions
   - Tool: Custom script using TypeScript AST parsing
   - Output: `docs/30-reference/api/auto-generated/`

2. **Drizzle Schema → Database ERD**
   - Auto-generate ER diagrams from schema
   - Tool: `drizzle-kit generate` + mermaid diagrams
   - Output: `docs/30-reference/database/erd.md`

3. **Broken Link Checker (CI)**
   - Check all `[text](./path.md)` links resolve
   - Tool: `markdown-link-check` or custom script
   - Runs: On PR, blocks merge if broken links found

4. **Pricing Examples Refresh**
   - Regenerate pricing examples quarterly with current database prices
   - Tool: Custom script querying `pricingRules` table
   - Manual review before committing

---

## Quarterly Maintenance Cycle

### Every Quarter (Jan/Apr/Jul/Oct)

**Week 1: Audit**
- Run comprehensive doc audit (similar to Phase 2 process)
- Tag files: `current`, `needs_update`, `deprecated`
- Create backlog of doc update tasks

**Week 2-3: Updates**
- Fix critical inaccuracies (architecture/operations first)
- Update outdated examples and code snippets
- Archive deprecated docs to `docs/90-completed/archive-YYYY-QX/`

**Week 4: Validation**
- Run link checker
- Spot-check updated docs against codebase
- Update `docs/README.md` navigation if needed

---

## Emergency Doc Fixes

For **critical inaccuracies** that block development:

1. **Identify Issue:** File GitHub issue with `docs:critical` label
2. **Quick Fix:** PR with doc fix only (no code changes)
3. **Fast-Track Review:** Assign to doc owner, merge within 24h
4. **Notify Team:** Post in #dev channel about critical doc fix

**Examples of Critical:**
- Docs show wrong API endpoint preventing integration
- Incorrect schema preventing database queries
- Wrong deployment steps causing production issues

---

## Known Limitations & Future Work

**Current Gaps:**
- No automated link checking (manual only)
- No code example validation (syntax not checked)
- No automated freshness checks
- Pricing examples require manual recalculation

**Planned Improvements:**
- Add `docs:validate` npm script with all checks
- Integrate link checker in CI (GitHub Actions)
- Set up quarterly automation reminder
- Consider documentation-as-code tooling (Docusaurus, VitePress)

---

## Quick Reference: Common Doc Tasks

### Adding a New Feature

1. Write code + tests
2. **Before PR:** Add/update docs in same commit
   - Architecture change? → Update `docs/10-system/architecture-detailed/*.md`
   - New API? → Update `docs/30-reference/api/*.md`
   - New integration? → Create `docs/40-guides/integrations/[name].md`
3. Update `docs/README.md` navigation if new doc added
4. Commit with message: `feat(feature-name): implement X + update docs`

### Deprecating Documentation

1. **Move to archive:** `docs/90-completed/archive-YYYY-QX/[filename].md`
2. **Add deprecation notice** to old location:
   ```markdown
   # [Old Doc Name]

   > **⚠️ DEPRECATED:** This document is outdated as of [date].
   > See [new-doc.md](../path/to/new-doc.md) for current information.
   ```
3. **Update all links** to point to new doc
4. **Update navigation** in `docs/README.md`

### Finding Outdated Docs

```bash
# Find docs not updated in >6 months
find docs/ -name "*.md" -mtime +180 -ls

# Find docs with "TODO" or "FIXME"
grep -r "TODO\|FIXME" docs/ --include="*.md"

# Find docs with old dates in frontmatter
grep -r "last_updated.*2024" docs/ --include="*.md"
```

---

## Contacts & Escalation

**Questions about documentation?**
- Architecture docs: @backend-team
- Business logic: @product-team
- Operations: @devops

**Critical doc issue blocking you?**
- File issue with `docs:critical` label
- @ mention doc owner in #dev channel
- Expect fix within 24h

---

**Last Updated:** 2025-11-03
**Owner:** Architecture Team
**Status:** Current
