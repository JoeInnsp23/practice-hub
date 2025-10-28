# Reusable Documentation System for Claude Code 📚

**Complete documentation generation + intelligent search skill** - Extract once, bootstrap anywhere.

## What This Package Provides

This is a fully-featured documentation system extracted from Eagle Education that you can bootstrap to any TypeScript, Python, or monorepo project. It provides:

### 🤖 **Intelligent Documentation Search Skill**
- Multi-domain search across 6 documentation types (requirements, architecture, API reference, stories, QA gates, coding patterns)
- Auto-activating Claude Code skill that triggers when you start development work
- Fast code index for function/type/class lookups with line numbers
- Concept-based knowledge graph connecting requirements → design → implementation

### 📚 **Auto-Generating API Documentation**
- TypeScript API docs (TypeDoc → markdown)
- Python API docs (pdoc3 → markdown)
- Code index with function signatures, parameters, examples
- Pre-commit hooks auto-regenerate docs when source changes

### 🔍 **Fast Code Navigation**
- YAML-based code index with file:line references
- Search by function name, type, class, or concept
- Returns signature, parameters, return type, examples
- Auto-discovers new files (no manual config updates)

### ✅ **Quality Gates**
- Enforces comprehensive documentation (JSDoc/docstrings)
- Blocks commits without documentation
- Pre-commit validation and auto-generation
- Zero-config setup with smart defaults

---

## Quick Start

### For Claude Code (Automated Bootstrap)

See **[BOOTSTRAP.md](BOOTSTRAP.md)** for Claude-readable setup instructions.

**TL;DR for Claude:**
```bash
# 1. Read the bootstrap guide
Read .ai/reusable-docs-system/BOOTSTRAP.md

# 2. Run automated installer (with customization prompts)
bash .ai/reusable-docs-system/scripts/install.sh

# 3. Validate setup
bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

### For Manual Installation

1. **Copy templates** to project root:
   ```bash
   cp templates/typedoc.json.template ./typedoc.json
   # Edit paths in typedoc.json for your project structure
   ```

2. **Add package.json scripts**:
   ```bash
   # Merge scripts from templates/package-json-scripts.json
   pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node
   ```

3. **Install pre-commit hook**:
   ```bash
   cp templates/pre-commit.sh.template .husky/pre-commit
   chmod +x .husky/pre-commit
   ```

4. **Create docs search skill**:
   ```bash
   mkdir -p .claude/skills/PROJECT-docs-search
   cp templates/SKILL.md.template .claude/skills/PROJECT-docs-search/SKILL.md
   cp templates/doc-index.yaml.template .claude/skills/PROJECT-docs-search/doc-index.yaml
   cp scripts/generate-code-index.ts .claude/skills/PROJECT-docs-search/scripts/
   ```

5. **Customize for your project**:
   - Edit `typedoc.json` entry points
   - Edit `doc-index.yaml` concepts
   - Edit `SKILL.md` trigger patterns
   - See **[docs/customization-guide.md](docs/customization-guide.md)** for details

---

## Features

### 1. Multi-Domain Documentation Search

The skill searches **6 documentation domains** simultaneously:

| Domain | What It Contains | Example Queries |
|--------|------------------|-----------------|
| 📋 **PRD & Requirements** | Epics, features, functional requirements | "What's in the MVP?", "What are requirements for X?" |
| 🏗️ **Architecture** | Tech stack, components, design decisions | "Why did we choose X?", "Show me the RAG pipeline" |
| 📚 **API Reference** | TypeScript + Python APIs with examples | "How do I use generateQuestion?", "What fields does User have?" |
| 📖 **Stories** | User stories, acceptance criteria, tasks | "What's in story 1.1?", "Is the feature done?" |
| 🧪 **QA Gates** | Quality validation, test results, decisions | "Did story X pass QA?", "What issues were found?" |
| 💻 **Coding Standards** | Best practices, patterns, conventions | "How should I structure a service?" |

### 2. Fast Code Index

Automatically indexes all documented code:

```yaml
functions:
  generateAdaptiveQuestion:
    description: "Generates adaptive questions using RAG and Gemini"
    file: "apps/api/src/services/question_generator.py"
    line: 42
    signature: "async def generateAdaptiveQuestion(topic_id: str, difficulty: int) -> Question"
    parameters:
      - name: "topic_id"
        type: "str"
        description: "UUID of the topic"
    returns:
      type: "Question"
      description: "Generated question with options and explanation"
    example: |
      question = await generateAdaptiveQuestion('double-entry', 5)
```

**Query:** "What's the signature for generateAdaptiveQuestion?"
**Result:** File path, line number, full signature, parameters, example

### 3. Auto-Generation Pipeline

Pre-commit hook automatically:
1. Detects changed `.ts`, `.tsx`, `.py` files
2. Regenerates TypeScript API docs (TypeDoc)
3. Regenerates Python API docs (pdoc3)
4. Regenerates code index (all functions/types/classes)
5. Stages updated docs for commit

**No manual work required** - docs stay in sync automatically.

### 4. Claude Code Skill Integration

The skill **automatically activates** when you:
- Start development work: "I'm implementing story 1.2..."
- Ask for complete picture: "Show me the complete RAG pipeline"
- Debug issues: "I'm debugging the login flow..."
- Search code: "What's the User type?"

**Trigger reliability:** ~70-90% for active development contexts (optimized trigger patterns included).

---

## Project Structure Support

### ✅ Monorepo (pnpm/npm/yarn workspaces)
```
packages/
  ├── types/        # Shared TypeScript types
  ├── utils/        # Utilities
apps/
  ├── web/          # Frontend (Next.js, React, etc.)
  ├── api/          # Backend (FastAPI, Express, etc.)
```

### ✅ Single-Repo TypeScript
```
src/
  ├── types/
  ├── utils/
  ├── components/
```

### ✅ Single-Repo Python
```
src/
  ├── models/
  ├── services/
  ├── routes/
```

### ✅ Polyglot (TypeScript + Python)
Any combination of the above.

---

## Customization Points

See **[docs/customization-guide.md](docs/customization-guide.md)** for full details.

**Key customization areas:**

1. **Entry Points** (`typedoc.json`):
   - Monorepo: `packages/*/src/**/*.ts`, `apps/*/src/**/*.tsx`
   - Single-repo: `src/**/*.ts`

2. **Documentation Domains** (`doc-index.yaml`):
   - Add/remove domains (default: PRD, Architecture, API, Stories, QA, Patterns)
   - Map concepts to documentation files
   - Define search keywords

3. **Skill Triggers** (`SKILL.md`):
   - Customize trigger patterns for your project terminology
   - Add domain-specific concepts
   - Adjust skill description

4. **Code Index** (`generate-code-index.ts`):
   - Customize source file paths
   - Add custom metadata extraction
   - Filter specific directories

---

## Requirements

### Dependencies

**Node.js (TypeScript docs):**
- Node.js 18+
- pnpm, npm, or yarn
- TypeDoc + typedoc-plugin-markdown
- ts-node

**Python (Python docs):**
- Python 3.8+
- pdoc3

**Git Hooks:**
- Husky (optional but recommended)

### Installation Commands

```bash
# TypeScript dependencies
pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node

# Python dependencies
pip install pdoc3

# Git hooks (if using Husky)
pnpm install --save-dev husky
npx husky install
```

---

## Architecture

See **[docs/architecture.md](docs/architecture.md)** for full system design.

**High-level flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Developer commits code with JSDoc/docstrings                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Pre-commit hook detects .ts, .tsx, .py changes              │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ TypeDoc          │    │ pdoc3            │
│ (TS → markdown)  │    │ (Py → markdown)  │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ generate-code-index.ts extracts JSDoc/docstrings            │
│ → Builds code-index.yaml with file:line references          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Docs + code index staged for commit                         │
│ Developer gets updated docs automatically                   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Code activates skill during development              │
│ → Searches doc-index.yaml (concepts)                        │
│ → Searches code-index.yaml (functions/types)                │
│ → Returns file:line references + examples                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: Bootstrap to Next.js Monorepo

```bash
# 1. Clone/copy this package to your project
cp -r /path/to/.ai/reusable-docs-system .ai/

# 2. Run installer (interactive prompts)
bash .ai/reusable-docs-system/scripts/install.sh

# Prompts:
#   Project type? [monorepo/single-repo]: monorepo
#   Frontend framework? [next/react/vue]: next
#   Backend framework? [fastapi/express/none]: none
#   Skill name? [my-project-docs-search]: myapp-docs-search

# 3. Validate setup
bash .ai/reusable-docs-system/scripts/validate-setup.sh

# 4. Customize doc-index.yaml for your project structure
# Edit .claude/skills/myapp-docs-search/doc-index.yaml

# 5. Generate initial docs
pnpm docs:generate:all
git add docs/
git commit -m "docs: add auto-generated API documentation"

# 6. Test the skill
# Ask Claude: "Show me the complete authentication system"
```

### Example 2: Bootstrap to Python FastAPI Project

```bash
# 1. Copy package
cp -r /path/to/.ai/reusable-docs-system .ai/

# 2. Run installer
bash .ai/reusable-docs-system/scripts/install.sh

# Prompts:
#   Project type? [monorepo/single-repo]: single-repo
#   Language? [typescript/python/both]: python
#   Backend framework? [fastapi/django/flask]: fastapi
#   Skill name? [my-project-docs-search]: api-docs-search

# 3. Generate Python docs
pip install pdoc3
pnpm docs:generate:python

# 4. Test skill
# Ask Claude: "What's the signature for create_user?"
```

---

## Troubleshooting

See **[docs/troubleshooting.md](docs/troubleshooting.md)** for common issues.

**Quick fixes:**

| Issue | Solution |
|-------|----------|
| TypeDoc not generating docs | Check `typedoc.json` entry points match your structure |
| Skill not triggering | Rephrase query as "I'm implementing..." or "Show me complete..." |
| Code index empty | Ensure JSDoc/docstrings present, run `pnpm docs:generate:code-index` |
| Pre-commit hook failing | Check `chmod +x .husky/pre-commit`, verify dependencies installed |

---

## License

MIT License - Free to use, modify, and distribute.

---

## Credits

Extracted from **Eagle Education (StudyMate AI)** - an ADHD-optimized adaptive learning platform.

**Original system:**
- Documentation generation pipeline
- Multi-domain search skill
- Code index auto-generation
- Pre-commit automation

**Adapted for reuse by:** Claude Code (Sonnet 4.5)

---

## Support

For issues, questions, or feature requests:
1. Check **[docs/troubleshooting.md](docs/troubleshooting.md)**
2. Review **[docs/customization-guide.md](docs/customization-guide.md)**
3. Read **[BOOTSTRAP.md](BOOTSTRAP.md)** for Claude-specific setup

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
**Source:** Eagle Education Documentation System v2.3
