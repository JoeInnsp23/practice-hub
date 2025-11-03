# AI Documentation Index - Practice Hub

**MANDATORY:** All AI agents MUST read this document BEFORE creating any documentation in `docs/`.

**Purpose:** Central entry point with load order, save rules, and anti-patterns for AI agents working with Practice Hub documentation.

**Last Updated:** 2025-01-03

---

## 🚨 CRITICAL RULES (READ FIRST)

1. **DO NOT create files in `docs/` root** unless it's a core system document (7 max)
2. **DO NOT duplicate information** - check existing docs first
3. **DO NOT create stub files** (<500 words) unless in `60-active-planning/` with phase owner
4. **ALWAYS verify** against `20-dev-standards/DOCUMENTATION_GUIDE.md` before creating

---

## 📚 AI LOAD ORDER (Sequential)

### Phase 1: System Understanding (REQUIRED)

1. **[10-system/bmm-brownfield-architecture.md](../10-system/bmm-brownfield-architecture.md)** - Complete system state (96 tables, 44 routers, 1,778 tests)
2. **[../CLAUDE.md](../../CLAUDE.md)** - CRITICAL development rules and conventions

### Phase 2: Development Standards (REQUIRED)

3. **[20-dev-standards/coding-standards.md](../20-dev-standards/coding-standards.md)** - Router creation, testing, database patterns
4. **[20-dev-standards/DOCUMENTATION_GUIDE.md](../20-dev-standards/DOCUMENTATION_GUIDE.md)** - Where to save different doc types

### Phase 3: Reference (Load as needed)

5. **[30-reference/README.md](../30-reference/README.md)** - API, database, config, security
6. **[40-guides/README.md](../40-guides/README.md)** - Integration guides, specialized guides
7. **[50-operations/README.md](../50-operations/README.md)** - Deployment, runbooks

---

## 📋 Where to Save Documentation

**Quick Reference Table:**

| Document Type | Location | Example |
|--------------|----------|---------|
| System architecture | Update `10-system/bmm-brownfield-architecture.md` | DO NOT create new files |
| Development standards | Update `20-dev-standards/coding-standards.md` | DO NOT create new files |
| Integration setup | `40-guides/integrations/{service}.md` | `microsoft-oauth.md` |
| API reference | `30-reference/api/routers.md` | All routers documented |
| Database schema | `30-reference/database/schema.md` | 96 tables/views |
| Operations procedures | `50-operations/runbooks.md` | Deployment, backup |
| Active phase plan | `60-active-planning/phases/PHASE_X.md` | Current work |
| Completed phase | `90-completed/phase-X/PHASE_X_COMPLETE.md` | Historical |
| Research/market data | `70-research/pricing/` | Market research files |
| Completion reports | `90-completed/{phase-name}/` | NOT in root! |

**Full Rules:** See [DOCUMENTATION_GUIDE.md](../20-dev-standards/DOCUMENTATION_GUIDE.md)

---

## ❌ DO NOT CREATE

### Files/Folders to NEVER Create:

- ❌ New architecture docs in root (use `bmm-brownfield-architecture.md`)
- ❌ New navigation files (use existing `README.md`, `SITEMAP.md`)
- ❌ Stub/placeholder files (<500 words)
- ❌ Subdirectories for single files
- ❌ Duplicate docs for existing content
- ❌ Files in `docs/` root (max 7 core files allowed)
- ❌ Files in `.archive/` (old CRM app reference only - project root)

### Anti-Patterns:

```
docs/architecture/          ❌ NO! Use bmm-brownfield-architecture.md
docs/modules/              ❌ NO! Covered in master doc
docs/testing/              ❌ NO! Use coding-standards.md
docs/development/          ❌ NO! Use coding-standards.md
docs/getting-started/      ❌ NO! Use README.md
docs/future-feature.md     ❌ NO! Stub file
```

---

## 🔗 Quick Links

### Core Documentation

- **[10-system/README.md](../10-system/README.md)** - System architecture
- **[20-dev-standards/README.md](../20-dev-standards/README.md)** - Dev standards
- **[bmm-index.md](../bmm-index.md)** - BMad method workflows

### Navigation

- **[README.md](../README.md)** - Main navigation
- **[SITEMAP.md](../SITEMAP.md)** - Complete index

---

## 🎯 Pre-Creation Checklist

Before creating ANY documentation:

- [ ] Read this AI index
- [ ] Read `DOCUMENTATION_GUIDE.md` in `20-dev-standards/`
- [ ] Check if content exists in `bmm-brownfield-architecture.md`
- [ ] Check if content exists in `coding-standards.md`
- [ ] Verify correct numbered bucket (10/20/30/40/50/60/70/90)
- [ ] Ensure file is >500 words OR in `60-active-planning/` with phase owner
- [ ] Verify NOT creating stub/placeholder
- [ ] Confirm NOT duplicating existing content

**If unsure → ASK USER before creating!**

---

## 📊 Numbered Taxonomy

```
00-ai-index/          This document (AI entry point)
10-system/            System architecture & core docs
20-dev-standards/     Coding standards & documentation guide
30-reference/         API, database, config, security
40-guides/            Integration guides & specialized docs
50-operations/        Deployment & operational procedures
60-active-planning/   Active phases, launch plans, sprints
70-research/          Research projects (pricing, market analysis)
90-completed/         Completed phases, historical reports
```

**Rationale:** Numbered prefixes ensure proper sorting and clear separation of active vs completed work.

---

## 🚫 Critical Reminders

1. **`.archive/` location:** `/root/projects/practice-hub/.archive/` (PROJECT ROOT ONLY, not docs/)
2. **Old CRM app reference:** Never modify or add docs to `.archive/`
3. **File count limit:** ~50 files total (excluding research)
4. **Root limit:** 7 core files max in `docs/` root
5. **BMAD workflows:** See [bmm-index.md](../bmm-index.md) for agent workflows

---

**Version:** 1.0  
**Last Updated:** 2025-01-03  
**For Issues:** Update this index or ask user

