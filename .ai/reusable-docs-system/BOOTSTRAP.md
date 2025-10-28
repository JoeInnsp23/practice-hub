# Bootstrap Guide for Claude Code 🤖

**This guide is optimized for Claude Code** to automatically install and configure the reusable documentation system.

---

## Overview

This package provides a complete documentation generation + intelligent search system that you can bootstrap to any TypeScript, Python, or monorepo project.

**What you'll install:**
1. ✅ Auto-generating API documentation (TypeScript + Python → markdown)
2. ✅ Code index with function/type lookups (file:line references)
3. ✅ Multi-domain documentation search skill (6 domains: PRD, Architecture, API, Stories, QA, Patterns)
4. ✅ Pre-commit hooks for auto-regeneration
5. ✅ Quality gates (enforce JSDoc/docstrings)

---

## Prerequisites Check

**Before starting, verify:**

### Required for TypeScript Projects
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm, npm, or yarn installed
- [ ] Project has `package.json`
- [ ] Git initialized (`.git/` exists)

### Required for Python Projects
- [ ] Python 3.8+ installed (`python --version` or `python3 --version`)
- [ ] pip installed

### Optional but Recommended
- [ ] Husky for git hooks (or manual hook management)
- [ ] Existing pre-commit hook (we'll merge with it)

---

## Installation Methods

### Method 1: Automated Installer (Recommended)

**For Claude Code:** Run the automated installer script which will:
1. Detect project structure (monorepo vs single-repo, TypeScript vs Python)
2. Prompt for customization (skill name, paths, domains)
3. Install all templates with customizations
4. Install dependencies
5. Validate setup

```bash
bash .ai/reusable-docs-system/scripts/install.sh
```

**Expected prompts:**

```
🔍 Detecting project structure...

Project type detected: [monorepo/single-repo]
Languages detected: [TypeScript, Python, Both]

Configure documentation system:

1. Skill name? (default: myproject-docs-search)
   → Enter a name for the Claude Code skill (e.g., "myapp-docs-search")

2. TypeScript entry points? (default: auto-detected)
   → Confirm or customize paths (e.g., "packages/*/src/**/*.ts")

3. Python source paths? (default: auto-detected)
   → Confirm or customize paths (e.g., "apps/api/src")

4. Documentation domains to include? (default: all)
   → Select domains: PRD, Architecture, API, Stories, QA, Patterns
   → Tip: Start with "Architecture, API, Patterns" for code-only projects

5. Merge with existing pre-commit hook? (yes/no)
   → If yes, we'll append to existing .husky/pre-commit
   → If no, we'll create new hook (you'll need to merge manually)

Installing...
✅ Templates copied
✅ Dependencies installed
✅ Skill created
✅ Pre-commit hook configured
✅ Initial docs generated

Run validation:
  bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

---

### Method 2: Manual Installation (Step-by-Step)

**For Claude Code:** Follow these steps to manually install each component.

#### Step 1: Install Dependencies

**TypeScript projects:**
```bash
pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node
# or
npm install --save-dev typedoc typedoc-plugin-markdown ts-node
```

**Python projects:**
```bash
pip install pdoc3
# or
pip3 install pdoc3
```

#### Step 2: Copy TypeDoc Config

```bash
# Copy template
cp .ai/reusable-docs-system/templates/typedoc.json.template ./typedoc.json

# ⚠️ IMPORTANT: Edit typedoc.json entry points for your project structure
```

**For monorepo:**
```json
"entryPoints": [
  "packages/*/src/**/*.ts",
  "apps/web/src/**/*.tsx"
]
```

**For single-repo:**
```json
"entryPoints": ["src/**/*.ts"]
```

#### Step 3: Add Package Scripts

Merge scripts from `templates/package-json-scripts.json` into your `package.json`:

```json
{
  "scripts": {
    "docs:generate": "typedoc && echo '✅ TypeScript API docs generated'",
    "docs:generate:python": "cd path/to/python && pdoc3 --output-dir ../../docs/reference/python --format markdown src/",
    "docs:generate:code-index": "ts-node .claude/skills/SKILLNAME/scripts/generate-code-index.ts",
    "docs:generate:all": "pnpm docs:generate && pnpm docs:generate:python && pnpm docs:generate:code-index"
  }
}
```

**⚠️ Replace `SKILLNAME` with your chosen skill name**

#### Step 4: Create Docs Search Skill

```bash
# 1. Create skill directory
SKILL_NAME="myproject-docs-search"  # Change this
mkdir -p .claude/skills/$SKILL_NAME/scripts

# 2. Copy skill definition
cp .ai/reusable-docs-system/templates/SKILL.md.template .claude/skills/$SKILL_NAME/SKILL.md

# 3. Copy doc index template
cp .ai/reusable-docs-system/templates/doc-index.yaml.template .claude/skills/$SKILL_NAME/doc-index.yaml

# 4. Copy code index generator
cp .ai/reusable-docs-system/scripts/generate-code-index.ts .claude/skills/$SKILL_NAME/scripts/

# 5. Edit files to customize for your project
# - SKILL.md: Update name, description, trigger patterns
# - doc-index.yaml: Add your project's concepts and documentation paths
# - generate-code-index.ts: Update source paths if needed
```

#### Step 5: Install Pre-Commit Hook

**If using Husky:**
```bash
# Install Husky if not already installed
pnpm install --save-dev husky
npx husky install

# Copy pre-commit hook
cp .ai/reusable-docs-system/templates/pre-commit.sh.template .husky/pre-commit
chmod +x .husky/pre-commit

# ⚠️ Edit .husky/pre-commit to customize paths if needed
```

**If NOT using Husky:**
```bash
# Copy to git hooks directly
cp .ai/reusable-docs-system/templates/pre-commit.sh.template .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# ⚠️ Edit .git/hooks/pre-commit to customize paths if needed
```

#### Step 6: Generate Initial Documentation

```bash
# Generate all docs
pnpm docs:generate:all

# Stage and commit
git add docs/ .claude/
git commit -m "docs: add auto-generated API documentation and search skill"
```

---

## Customization Guide

### 1. Customize Skill Name and Description

**Edit:** `.claude/skills/SKILLNAME/SKILL.md`

```yaml
---
name: myproject-docs-search  # ← Change this
description: Search documentation for MyProject. Triggers when user asks about requirements, architecture, APIs, or implementation patterns.  # ← Customize this
allowed-tools: Read, Grep, Glob
---
```

**Skill trigger optimization:**
- Include project-specific terminology (e.g., "authentication", "payment processing")
- Mention key features (e.g., "RAG pipeline", "user management")
- List common queries (e.g., "How do I implement X?", "What's the API for Y?")

### 2. Customize Documentation Domains

**Edit:** `.claude/skills/SKILLNAME/doc-index.yaml`

**Example customization for code-only project** (no PRD/stories):

```yaml
concepts:
  # ============================================================================
  # CORE FEATURES
  # ============================================================================

  authentication:
    description: "User authentication, sessions, OAuth"
    api:
      - path: "docs/reference/typescript/modules/auth.md"
      - path: "docs/reference/python/src/auth/"
    architecture:
      - path: "docs/architecture/auth-system.md"
    patterns:
      - path: "docs/patterns/auth-patterns.md"
    keywords: ["auth", "login", "session", "oauth", "jwt"]

  database-models:
    description: "Database schema, ORM models, migrations"
    api:
      - path: "docs/reference/python/src/models/"
    architecture:
      - path: "docs/architecture/database-schema.md"
    keywords: ["database", "model", "schema", "migration"]

# Add more concepts for your project...
```

**Remove unused domains:**
- Delete `prd:` sections if no PRD docs
- Delete `stories:` sections if no user stories
- Delete `qa-gates:` sections if no QA process
- Keep `api:`, `architecture:`, `patterns:` for code projects

### 3. Customize Entry Points

**Edit:** `typedoc.json`

**Monorepo example:**
```json
{
  "entryPoints": [
    "packages/auth/src/**/*.ts",
    "packages/database/src/**/*.ts",
    "apps/web/src/**/*.tsx",
    "apps/api/src/**/*.ts"
  ]
}
```

**Single-repo example:**
```json
{
  "entryPoints": [
    "src/**/*.ts",
    "components/**/*.tsx"
  ]
}
```

### 4. Customize Code Index Generator

**Edit:** `.claude/skills/SKILLNAME/scripts/generate-code-index.ts`

**Update source paths** (lines 212-214):

```typescript
// Default (monorepo)
const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
const webFiles = findSourceFiles(path.join(rootDir, 'apps/web'), ['.tsx'])
const pyFiles = findSourceFiles(path.join(rootDir, 'apps/api'), ['.py'])

// Single-repo TypeScript
const tsFiles = findSourceFiles(path.join(rootDir, 'src'), ['.ts', '.tsx'])
const webFiles: string[] = []
const pyFiles: string[] = []

// Single-repo Python
const tsFiles: string[] = []
const webFiles: string[] = []
const pyFiles = findSourceFiles(path.join(rootDir, 'src'), ['.py'])
```

---

## Validation

After installation, run the validation script:

```bash
bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

**Expected output:**

```
🔍 Validating documentation system setup...

✅ Dependencies installed
  - typedoc: 0.28.0
  - typedoc-plugin-markdown: 4.9.0
  - ts-node: 10.9.2
  - pdoc3: 0.10.0

✅ Configuration files present
  - typedoc.json
  - .claude/skills/myproject-docs-search/SKILL.md
  - .claude/skills/myproject-docs-search/doc-index.yaml
  - .claude/skills/myproject-docs-search/scripts/generate-code-index.ts

✅ Pre-commit hook configured
  - .husky/pre-commit (executable)

✅ Package scripts configured
  - docs:generate ✓
  - docs:generate:python ✓
  - docs:generate:code-index ✓
  - docs:generate:all ✓

✅ Documentation generated successfully
  - docs/reference/typescript/ (12 modules)
  - docs/reference/python/ (8 modules)
  - .claude/skills/myproject-docs-search/code-index.yaml (45 functions, 23 types)

✅ Skill triggers correctly
  - Test query: "Show me the complete authentication system"
  - Skill activated: ✓
  - Results returned: ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Documentation system ready!

Next steps:
1. Customize doc-index.yaml for your project structure
2. Add documentation to your source code (JSDoc/docstrings)
3. Test the skill: "Show me the complete [feature] system"
4. Commit and push: git add . && git commit -m "docs: configure documentation system"
```

---

## Testing the Skill

After installation, test the skill with these queries:

### Test 1: Code Index Lookup
```
"What's the signature for [your-function-name]?"
```

**Expected:**
- Returns file path, line number, signature, parameters, example

### Test 2: Concept Search
```
"Show me the complete [your-feature] system"
```

**Expected:**
- Returns all docs across domains (architecture, API, patterns, etc.)

### Test 3: Implementation Query
```
"How do I implement [your-feature]?"
```

**Expected:**
- Returns API reference, coding standards, architecture

### Test 4: Development Context
```
"I'm implementing [your-feature]"
```

**Expected:**
- Skill automatically activates
- Returns comprehensive context (requirements, design, API, patterns)

---

## Troubleshooting

### Issue: TypeDoc not generating docs

**Solution:**
1. Check `typedoc.json` entry points match your project structure:
   ```bash
   # List files that match your entry points
   ls packages/*/src/**/*.ts
   ls apps/web/src/**/*.tsx
   ```

2. Ensure dependencies installed:
   ```bash
   pnpm list typedoc typedoc-plugin-markdown
   ```

3. Run TypeDoc manually to see errors:
   ```bash
   pnpm typedoc
   ```

### Issue: Code index is empty

**Solution:**
1. Ensure JSDoc/docstrings are present:
   ```typescript
   /**
    * Description of function
    * @param foo - Description
    * @returns Description
    */
   export function myFunction(foo: string): number {
     // ...
   }
   ```

2. Check source paths in `generate-code-index.ts`:
   ```typescript
   const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
   // ↑ Does 'packages' exist in your project?
   ```

3. Run code index generator manually:
   ```bash
   pnpm docs:generate:code-index
   ```

### Issue: Skill not triggering

**Possible causes:**
1. Skill activation is non-deterministic (Claude Code's internal heuristics)
2. Query doesn't match trigger patterns

**Solutions:**
1. Rephrase query with active verbs:
   - ✅ "I'm implementing authentication"
   - ✅ "Show me the complete auth system"
   - ❌ "Tell me about authentication" (too vague)

2. Use concept-specific queries:
   - ✅ "How does RAG work?" (if RAG in doc-index.yaml)
   - ✅ "What's the User type?" (if User in code-index.yaml)

3. Check skill description in `SKILL.md` includes your terminology

### Issue: Pre-commit hook failing

**Solution:**
1. Check hook is executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

2. Check dependencies installed:
   ```bash
   pnpm list typedoc
   pip list | grep pdoc3
   ```

3. Run hook manually to see errors:
   ```bash
   .husky/pre-commit
   ```

4. Check pre-commit hook paths match your project:
   ```bash
   # Edit .husky/pre-commit
   # Update paths: cd apps/web → cd your/path
   ```

---

## Next Steps After Installation

1. **Add Documentation to Code:**
   - Add JSDoc to all TypeScript functions/types
   - Add docstrings to all Python functions/classes
   - Include `@example` blocks showing realistic usage

2. **Customize doc-index.yaml:**
   - Map your project's concepts to documentation files
   - Add keywords for better search
   - Remove unused domains (PRD, Stories, QA if not applicable)

3. **Test the System:**
   - Make a code change with documentation
   - Commit and verify docs auto-generate
   - Ask Claude about your feature
   - Verify skill activates and returns correct results

4. **Iterate:**
   - Refine trigger patterns in `SKILL.md`
   - Add more concepts to `doc-index.yaml`
   - Improve JSDoc/docstring quality

---

## Common Patterns

### Pattern 1: Monorepo with TypeScript + Python

```bash
# Install both TypeScript and Python doc generation
pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node
pip install pdoc3

# Configure entry points
# typedoc.json:
"entryPoints": ["packages/*/src/**/*.ts", "apps/web/src/**/*.tsx"]

# Configure Python paths in package.json:
"docs:generate:python": "cd apps/api && pdoc3 --output-dir ../../docs/reference/python --format markdown src/"

# Update code index generator paths:
const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
const pyFiles = findSourceFiles(path.join(rootDir, 'apps/api/src'), ['.py'])
```

### Pattern 2: Single-Repo TypeScript (Next.js, React, etc.)

```bash
# Install TypeScript doc generation only
pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node

# Configure entry points
# typedoc.json:
"entryPoints": ["src/**/*.ts", "components/**/*.tsx", "lib/**/*.ts"]

# Update code index generator paths:
const tsFiles = findSourceFiles(path.join(rootDir, 'src'), ['.ts', '.tsx'])
const pyFiles: string[] = []  // Empty
```

### Pattern 3: Single-Repo Python (FastAPI, Django, etc.)

```bash
# Install Python doc generation only
pip install pdoc3

# Configure Python paths in package.json:
"docs:generate:python": "pdoc3 --output-dir docs/reference/python --format markdown src/"

# Update code index generator paths:
const tsFiles: string[] = []  // Empty
const pyFiles = findSourceFiles(path.join(rootDir, 'src'), ['.py'])
```

---

## Support

For issues or questions:
1. Check **[docs/troubleshooting.md](docs/troubleshooting.md)**
2. Review **[docs/customization-guide.md](docs/customization-guide.md)**
3. Read **[docs/architecture.md](docs/architecture.md)**

---

**Installation Complete! 🎉**

Your project now has:
- ✅ Auto-generating API documentation
- ✅ Fast code index with file:line references
- ✅ Multi-domain documentation search skill
- ✅ Pre-commit hooks for automation
- ✅ Quality gates enforcing documentation

**Test the skill:** "Show me the complete [your-feature] system"

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
**Source:** Eagle Education Documentation System v2.3
