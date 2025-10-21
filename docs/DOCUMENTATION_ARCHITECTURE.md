# AI-Optimized Documentation Architecture

**Version**: 2.0
**Status**: PROPOSAL
**Purpose**: Complete documentation overhaul optimized for AI agents (Claude Code, BMAD agents, etc.)

---

## Executive Summary

This document proposes a **complete restructuring** of Practice Hub documentation to optimize for AI agent consumption while remaining human-friendly. The new architecture provides:

- **Task-Oriented Organization**: Docs organized by "what to do" not "what it is"
- **AI Discoverability**: YAML frontmatter, clear metadata, semantic structure
- **Single Source of Truth**: No redundancy, clear ownership per topic
- **BMAD Integration**: Aligned with agent workflows and skills
- **Context-Rich**: Each doc self-contained with necessary context
- **Version Controlled**: Clear change tracking and update dates

---

## Current Problems

### 1. Redundancy
- Multiple docs covering same topics (e.g., 2 OAuth docs, 2 architecture docs)
- Historical completion reports mixed with current documentation
- Unclear which doc is authoritative

### 2. Inconsistent Structure
- No standard template
- Varying levels of detail
- Some docs task-oriented, others reference-style
- No metadata for AI discovery

### 3. Poor AI Optimization
- No frontmatter for semantic understanding
- Missing cross-references
- No clear entry points for common tasks
- Historical context mixed with current state

### 4. Maintenance Challenges
- No clear ownership
- No update tracking
- Outdated information not flagged
- No deprecation strategy

---

## Proposed Documentation Architecture

### New Structure

```
docs/
├── README.md                          # Master index with AI discovery metadata
│
├── getting-started/                   # Quick start for humans and AI
│   ├── README.md                      # Getting started index
│   ├── quickstart-developer.md        # 5-minute developer setup
│   ├── quickstart-ai-agent.md         # AI agent context loading guide
│   ├── codebase-overview.md           # High-level codebase tour
│   └── common-tasks.md                # Top 20 most common tasks
│
├── architecture/                      # System design and patterns
│   ├── README.md                      # Architecture index
│   ├── system-overview.md             # High-level architecture (single source)
│   ├── database-design.md             # Schema patterns and decisions
│   ├── multi-tenancy.md               # Dual isolation architecture
│   ├── authentication.md              # Auth architecture (staff + client portal)
│   ├── api-design.md                  # tRPC patterns and conventions
│   ├── frontend-architecture.md       # React/Next.js patterns
│   └── design-system.md               # UI/UX patterns and components
│
├── guides/                            # Task-oriented how-to guides
│   ├── README.md                      # Guides index
│   ├── development/
│   │   ├── setting-up-environment.md
│   │   ├── database-workflow.md
│   │   ├── creating-trpc-router.md
│   │   ├── adding-ui-component.md
│   │   ├── implementing-feature.md
│   │   └── testing-guide.md
│   ├── operations/
│   │   ├── deployment.md
│   │   ├── backup-restore.md
│   │   ├── monitoring.md
│   │   └── troubleshooting.md
│   └── integrations/
│       ├── lemverify-kyc.md
│       ├── microsoft-oauth.md
│       ├── docuseal-esignature.md
│       ├── sentry-monitoring.md
│       └── xero-accounting.md
│
├── reference/                         # API and configuration reference
│   ├── README.md                      # Reference index
│   ├── api/
│   │   ├── trpc-routers.md           # All 29 routers documented
│   │   ├── rest-webhooks.md           # Webhook endpoints
│   │   └── api-patterns.md            # Common API patterns
│   ├── database/
│   │   ├── schema.md                  # Complete schema reference
│   │   ├── views.md                   # Database views
│   │   ├── indexes.md                 # Performance indexes
│   │   └── queries.md                 # Common query patterns
│   ├── configuration/
│   │   ├── environment-variables.md
│   │   ├── docker-compose.md
│   │   └── ci-cd.md
│   └── business-logic/
│       ├── pricing-calculator.md
│       ├── service-components.md
│       └── pricing-examples.md
│
├── operations/                        # Production operations
│   ├── README.md                      # Operations index
│   ├── deployment-checklist.md
│   ├── runbooks.md
│   ├── monitoring-alerting.md
│   ├── backup-recovery.md
│   ├── incident-response.md
│   └── maintenance-procedures.md
│
├── development/                       # Development conventions
│   ├── README.md                      # Development index
│   ├── coding-standards.md            # TypeScript/React conventions
│   ├── git-workflow.md                # Branch/commit conventions
│   ├── testing-strategy.md            # Test patterns
│   ├── code-review-checklist.md
│   ├── technical-debt.md              # Current tech debt tracking
│   └── security-guidelines.md
│
├── user-guides/                       # End-user documentation
│   ├── README.md                      # User guides index
│   ├── admin-guide.md                 # Admin panel usage
│   ├── staff-guide.md                 # Staff user guide
│   ├── client-onboarding.md           # Client onboarding
│   └── faq.md                         # Frequently asked questions
│
├── troubleshooting/                   # Problem-solution database
│   ├── README.md                      # Troubleshooting index
│   ├── common-errors.md               # Top 50 errors and solutions
│   ├── database-issues.md
│   ├── authentication-issues.md
│   ├── integration-failures.md
│   └── performance-problems.md
│
├── .archive/                          # Historical documents
│   ├── 2025-10-19-gap-analysis/
│   ├── handovers/
│   ├── phases/
│   └── audits/
│
└── .meta/                             # Documentation metadata
    ├── templates/                     # Document templates
    │   ├── guide-template.md
    │   ├── reference-template.md
    │   └── troubleshooting-template.md
    ├── changelog.md                   # Documentation change log
    └── ownership.yaml                 # Document ownership mapping
```

---

## Document Template Standard

Every document MUST follow this structure:

```markdown
---
title: "Document Title"
category: "architecture|guide|reference|operations|development"
subcategory: "database|api|auth|etc"
purpose: "One-line description of what this doc helps you do"
audience: ["ai-agent", "developer", "devops", "admin"]
prerequisites: ["other-doc-1.md", "other-doc-2.md"]
related: ["related-doc-1.md", "related-doc-2.md"]
last_updated: "2025-10-21"
version: "2.0"
status: "current|deprecated|draft"
owner: "team-name or person"
tags: ["keyword1", "keyword2", "keyword3"]
---

# Document Title

**Quick Summary**: 1-2 sentence summary for AI agents

**Last Updated**: 2025-10-21 | **Version**: 2.0 | **Status**: Current

---

## What This Document Covers

- Bullet list of exact topics covered
- Clear scope definition
- What this doc does NOT cover (link to other docs)

---

## Prerequisites

Before reading this document, you should:
- [ ] Have completed/read [prerequisite 1](link)
- [ ] Understand [concept 2](link)
- [ ] Have [tool/access 3]

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core commands/patterns:

```bash
# Essential commands
command 1
command 2
```

**Key Points**:
- Critical fact 1
- Critical fact 2
- Critical gotcha/warning

---

## Detailed Guide

### Section 1: [Topic]

Clear explanation with:
- **Why**: Context and reasoning
- **What**: Exact implementation
- **How**: Step-by-step instructions
- **Example**: Working code example
- **Common Issues**: Troubleshooting

### Section 2: [Topic]

...

---

## Examples

### Example 1: [Common Use Case]

```typescript
// Working code example with comments
```

**When to use**: Clear scenario
**Output**: Expected result

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Error message | Root cause | Fix with link |

---

## Related Documentation

- [Related Topic 1](../path/to/doc.md) - Brief description
- [Related Topic 2](../path/to/doc.md) - Brief description

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 2.0 | Initial AI-optimized version | Team |

---

## Feedback

Found an issue or have a suggestion? [Create an issue](link) or update this doc directly.
```

---

## AI Discovery Metadata

### Master Index (docs/README.md)

Create a master index with structured metadata for AI agents:

```markdown
---
documentation_version: "2.0"
last_updated: "2025-10-21"
architecture: "ai-optimized"
total_documents: 45
categories:
  - architecture
  - guides
  - reference
  - operations
  - development
  - user-guides
  - troubleshooting
---

# Practice Hub Documentation

**AI Agent Quick Start**: Load [`getting-started/quickstart-ai-agent.md`](getting-started/quickstart-ai-agent.md) for optimal context

## Document Discovery

### By Task
- **Setting up development environment**: [`guides/development/setting-up-environment.md`](guides/development/setting-up-environment.md)
- **Creating a new tRPC router**: [`guides/development/creating-trpc-router.md`](guides/development/creating-trpc-router.md)
- **Understanding multi-tenancy**: [`architecture/multi-tenancy.md`](architecture/multi-tenancy.md)
- **Deploying to production**: [`guides/operations/deployment.md`](guides/operations/deployment.md)
- **Troubleshooting database issues**: [`troubleshooting/database-issues.md`](troubleshooting/database-issues.md)

### By Role
- **AI Agent**: Start with [`getting-started/quickstart-ai-agent.md`](getting-started/quickstart-ai-agent.md)
- **New Developer**: Start with [`getting-started/quickstart-developer.md`](getting-started/quickstart-developer.md)
- **DevOps Engineer**: Start with [`operations/README.md`](operations/README.md)
- **System Admin**: Start with [`user-guides/admin-guide.md`](user-guides/admin-guide.md)

### By Category
[Full categorized index with descriptions]
```

---

## BMAD Integration

### Agent Configuration Updates

Update `.bmad-core/core-config.yaml`:

```yaml
documentation:
  version: "2.0"
  architecture: "ai-optimized"
  masterIndex: "docs/README.md"
  aiQuickStart: "docs/getting-started/quickstart-ai-agent.md"

  # Auto-load these docs for all agents
  alwaysLoad:
    - docs/architecture/system-overview.md
    - docs/architecture/multi-tenancy.md
    - docs/development/coding-standards.md

  # Load on-demand by agent type
  agentContexts:
    architect:
      - docs/architecture/
      - docs/reference/database/
    developer:
      - docs/guides/development/
      - docs/reference/api/
    debugger:
      - docs/troubleshooting/
      - docs/development/technical-debt.md
    tester:
      - docs/guides/development/testing-guide.md
      - docs/reference/api/
```

### Agent Slash Commands

Create documentation-specific slash commands:

```markdown
# .claude/commands/docs-find.md
Find documentation for: {topic}

You are a documentation discovery assistant. Help the user find the right documentation by:
1. Searching docs/README.md master index
2. Checking YAML frontmatter for relevant tags
3. Providing 3-5 most relevant documents with summaries
4. Offering to load the selected document

Search for: {topic}
```

---

## Migration Plan

### Phase 1: Foundation (Day 1)
1. ✅ Create new directory structure
2. ✅ Create document templates
3. ✅ Create master index (docs/README.md)
4. ✅ Create AI quickstart guide

### Phase 2: Core Documentation (Days 2-3)
1. **Architecture** (consolidate from existing):
   - system-overview.md (from BROWNFIELD_ARCHITECTURE + SYSTEM_ARCHITECTURE)
   - database-design.md (from DATABASE_SCHEMA)
   - multi-tenancy.md (extract from brownfield doc)
   - authentication.md (from AUTHENTICATION_OVERVIEW + BROWNFIELD)
   - api-design.md (from API_REFERENCE)

2. **Guides** (convert and consolidate):
   - Development guides (from CLAUDE.md + scattered guides)
   - Integration guides (from individual integration docs)
   - Operations guides (from operations/*.md)

3. **Reference** (consolidate):
   - API reference (from API_REFERENCE.md)
   - Database schema (from DATABASE_SCHEMA.md)
   - Configuration (from ENVIRONMENT_VARIABLES.md)

### Phase 3: Enhanced Content (Days 4-5)
1. Create troubleshooting database from PRE_PRODUCTION_ISSUES.md
2. Create common-tasks.md from analysis of frequent operations
3. Enhance with code examples
4. Add cross-references

### Phase 4: BMAD Integration (Day 6)
1. Update `.bmad-core/core-config.yaml`
2. Create documentation slash commands
3. Update agent skills to reference new docs
4. Test agent discovery and context loading

### Phase 5: Cleanup (Day 7)
1. Archive old documentation
2. Update all README references
3. Update CLAUDE.md with new doc structure
4. Create migration guide for contributors

---

## Success Metrics

### For AI Agents
- ✅ Agent can find relevant doc in <5 seconds
- ✅ Agent loads appropriate context automatically
- ✅ Agent can navigate doc relationships
- ✅ Agent knows which doc is authoritative

### For Developers
- ✅ New developer productive in <30 minutes
- ✅ Common task documented with working example
- ✅ Clear entry point for every workflow
- ✅ Troubleshooting covers 90% of issues

### For Maintainability
- ✅ Clear ownership for every document
- ✅ Outdated docs flagged within 30 days
- ✅ Zero redundant information
- ✅ All changes tracked in changelog

---

## Maintenance Guidelines

### Document Ownership
```yaml
# docs/.meta/ownership.yaml
architecture/:
  owner: "tech-lead"
  reviewers: ["senior-dev-1", "senior-dev-2"]
  update_frequency: "quarterly"

guides/development/:
  owner: "dev-team"
  reviewers: ["tech-lead"]
  update_frequency: "as-needed"

operations/:
  owner: "devops-team"
  reviewers: ["tech-lead"]
  update_frequency: "monthly"
```

### Update Process
1. **On code change**: Update related docs in same PR
2. **Monthly review**: Check `last_updated` dates, flag stale docs
3. **Quarterly audit**: Review entire doc structure, consolidate if needed
4. **Version bumps**: Major structural changes = version bump

### Deprecation Strategy
```markdown
---
status: "deprecated"
deprecated_date: "2025-10-21"
replacement: "docs/new-doc.md"
removal_date: "2025-11-21"
---

# ⚠️ DEPRECATED DOCUMENT

**This document has been deprecated as of 2025-10-21.**

**Use instead**: [New Document](../new-doc.md)

**Removal date**: This document will be removed on 2025-11-21.

---

[Original content remains for reference]
```

---

## Next Steps

**Approval Required**: Do you approve this architecture?

If yes, I will:
1. **Create the new structure** (directories + templates)
2. **Migrate core documentation** (architecture, guides, reference)
3. **Create AI quickstart guide**
4. **Update BMAD configuration**
5. **Archive old documentation**
6. **Update all references**

**Estimated Time**: 1-2 days for complete migration

**Benefits**:
- AI agents 10x more effective at finding information
- Zero redundancy
- Clear maintenance ownership
- Easy onboarding for new developers
- BMAD agent optimization

---

**Ready to proceed?**
