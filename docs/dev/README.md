# Developer Documentation Tools

This directory contains scripts, generated data, and tooling for maintaining Practice Hub documentation.

## Contents

- **repo-facts.json**: Auto-generated repository statistics (routes, routers, tables, etc.)
- **doclets.yaml**: Extracted code documentation from `@doc:path#section` tags
- **DOC_TAGGING_SPEC.md**: Specification for code documentation tags
- **TAGGING_AUDIT_REPORT.md**: Audit of all taggable items in codebase
- **TAGGING_IMPLEMENTATION_PLAN.md**: Detailed plan for applying tags to code

## Scripts

Located in `scripts/`:

- **derive_repo_facts.ts**: Scans codebase and generates repo-facts.json
- **extract_doclets.py**: Extracts `@doc` tags from code
- **build_docs.py**: Merges extracted docs into markdown files
- **audit_taggable_items.py**: Scans for items needing documentation tags
- **generate_tagging_plan.py**: Creates detailed tagging implementation plan
- **apply_tags.py**: Automated tag application with safety checks

## Usage

### Generate Repository Facts

```bash
pnpm tsx scripts/derive_repo_facts.ts
```

### Extract Code Documentation

```bash
python3 scripts/extract_doclets.py
```

### Build Unified Docs

```bash
python3 scripts/build_docs.py
```

### Audit Taggable Items

```bash
python3 scripts/audit_taggable_items.py
```

## Automation

- **Pre-commit Hook**: Validates facts, extracts doclets, checks drift
- **CI Pipeline**: Runs extraction, validates coverage, detects drift
- **Claude Skills**: `docs-maintainer` skill auto-updates AI-GENERATED sections
- **Subagents**: `docs-update` orchestrates documentation workflows

## Section Types

Documentation files use three section types:

1. **CODE-EXTRACT**: Auto-generated from `@doc:path#section` tags in code
2. **AI-GENERATED**: Created by Claude Skills, updated on drift >5%
3. **HUMAN-AUTHORED**: Manual content, never auto-overwritten

See `DOC_TAGGING_SPEC.md` for complete tagging specification.
