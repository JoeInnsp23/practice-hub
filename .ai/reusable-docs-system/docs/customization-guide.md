# Customization Guide

Complete guide to customizing the reusable documentation system for your project.

---

## Overview

The documentation system is designed to be highly customizable. This guide covers all customization points and how to adapt the system to your project structure.

---

## Customization Checklist

**Before using the system, customize these components:**

- [ ] TypeDoc entry points (`typedoc.json`)
- [ ] Package.json scripts (skill name, paths)
- [ ] Skill name and description (`SKILL.md`)
- [ ] Documentation concepts (`doc-index.yaml`)
- [ ] Code index generator paths (`generate-code-index.ts`)
- [ ] Pre-commit hook paths (`.husky/pre-commit`)

---

## 1. TypeDoc Configuration

**File:** `typedoc.json`

### Entry Points

**Monorepo structure:**
```json
{
  "entryPoints": [
    "packages/*/src/**/*.ts",
    "packages/*/src/**/*.tsx",
    "apps/web/src/**/*.tsx",
    "apps/api/src/**/*.ts"
  ]
}
```

**Single-repo structure:**
```json
{
  "entryPoints": [
    "src/**/*.ts",
    "components/**/*.tsx",
    "lib/**/*.ts"
  ]
}
```

**Custom structure:**
```json
{
  "entryPoints": [
    "path/to/your/code/**/*.ts"
  ]
}
```

### Output Directory

Default: `docs/reference/typescript`

**To customize:**
```json
{
  "out": "docs/api/typescript"
}
```

### Exclude Patterns

**To exclude specific files/directories:**
```json
{
  "exclude": [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

---

## 2. Package.json Scripts

**File:** `package.json`

### Basic Scripts

```json
{
  "scripts": {
    "docs:generate": "typedoc && echo '✅ TypeScript API docs generated'",
    "docs:generate:python": "pdoc3 --output-dir docs/reference/python --format markdown src/",
    "docs:generate:code-index": "ts-node .claude/skills/SKILLNAME/scripts/generate-code-index.ts",
    "docs:generate:all": "pnpm docs:generate && pnpm docs:generate:python && pnpm docs:generate:code-index"
  }
}
```

### Customization Points

**1. Skill name:**
Replace `SKILLNAME` with your chosen skill name:
```json
"docs:generate:code-index": "ts-node .claude/skills/myproject-docs-search/scripts/generate-code-index.ts"
```

**2. Python source path:**
Replace `src/` with your Python source directory:
```json
"docs:generate:python": "cd apps/api && pdoc3 --output-dir ../../docs/reference/python --format markdown src/"
```

**3. Package manager:**
- Use `npm run` instead of `pnpm` if using npm
- Use `yarn` if using yarn

---

## 3. Skill Configuration

**File:** `.claude/skills/SKILLNAME/SKILL.md`

### Name and Description

```yaml
---
name: myproject-docs-search
description: Search documentation for MyProject. Triggers when user asks about requirements, architecture, APIs, or implementation patterns.
allowed-tools: Read, Grep, Glob
---
```

**Customization:**
- `name`: Your skill name (kebab-case, e.g., `myproject-docs-search`)
- `description`: Customize with your project name and key features

### Trigger Patterns

**Add project-specific terminology to improve trigger reliability:**

```yaml
description: Search documentation for MyProject (authentication, payment processing, data analytics). Triggers when user asks about auth flows, payment integration, analytics dashboards, or implementation patterns.
```

**Include:**
- Key features (e.g., "authentication", "payment processing")
- Core components (e.g., "user management", "order system")
- Common queries (e.g., "How do I implement X?", "What's the API for Y?")

### Domain Sections

**Remove unused domains:**

If your project doesn't have PRD/Stories/QA documentation, remove those sections from `SKILL.md`:

```markdown
<!-- BEFORE -->
1. 📋 **Requirements** — What we're building
2. 🏗️ **Architecture** — How we designed it
3. 📚 **API Reference** — How we implemented it
4. 📖 **Stories** — What we built
5. 🧪 **QA Gates** — Quality validation
6. 💻 **Coding Standards** — Best practices

<!-- AFTER (code-only project) -->
1. 🏗️ **Architecture** — How we designed it
2. 📚 **API Reference** — How we implemented it
3. 💻 **Coding Standards** — Best practices
```

---

## 4. Documentation Index

**File:** `.claude/skills/SKILLNAME/doc-index.yaml`

### Adding Concepts

**Structure:**
```yaml
concepts:
  concept-name:
    description: "Short description"
    api:  # Optional
      - path: "docs/reference/path"
        description: "What's here"
    architecture:  # Optional
      - path: "docs/architecture/path"
        section: "Section name"
    patterns:  # Optional
      - path: "docs/patterns/path"
    keywords: ["keyword1", "keyword2"]
```

### Example: Adding Authentication

```yaml
concepts:
  authentication:
    description: "User authentication, sessions, OAuth integration"
    api:
      - path: "docs/reference/typescript/modules/auth.md"
        description: "Auth module TypeScript API"
      - path: "docs/reference/python/src/auth/service.md"
        description: "Auth service implementation"
    architecture:
      - path: "docs/architecture/auth-system.md"
        description: "Authentication system design"
      - path: "docs/architecture/security.md"
        section: "Authentication & Authorization"
    patterns:
      - path: "docs/patterns/auth-patterns.md"
        description: "Auth implementation patterns"
    keywords: ["auth", "authentication", "login", "session", "oauth", "jwt", "security", "bearer-token"]
```

### Removing Unused Domains

**For code-only projects, remove:**
- `prd:` sections
- `stories:` sections
- `qa-gates:` sections

**Keep:**
- `api:` — Auto-generated API reference
- `architecture:` — System design docs
- `patterns:` — Coding standards

### Updating By-Domain Section

```yaml
by-domain:
  API-TypeScript:
    - docs/reference/typescript/

  API-Python:
    - docs/reference/python/

  Architecture:
    - docs/architecture/

  Patterns:
    - docs/patterns/

  # Remove if not applicable:
  # PRD:
  #   - docs/prd/
  # Stories:
  #   - docs/stories/
  # QA-Gates:
  #   - docs/qa/gates/
```

---

## 5. Code Index Generator

**File:** `.claude/skills/SKILLNAME/scripts/generate-code-index.ts`

### Source Paths

**Lines 212-214:**

**Monorepo (default):**
```typescript
const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
const webFiles = findSourceFiles(path.join(rootDir, 'apps/web'), ['.tsx'])
const pyFiles = findSourceFiles(path.join(rootDir, 'apps/api'), ['.py'])
```

**Single-repo TypeScript:**
```typescript
const tsFiles = findSourceFiles(path.join(rootDir, 'src'), ['.ts', '.tsx'])
const webFiles: string[] = []
const pyFiles: string[] = []
```

**Single-repo Python:**
```typescript
const tsFiles: string[] = []
const webFiles: string[] = []
const pyFiles = findSourceFiles(path.join(rootDir, 'src'), ['.py'])
```

**Custom paths:**
```typescript
const tsFiles = findSourceFiles(path.join(rootDir, 'lib'), ['.ts'])
const webFiles = findSourceFiles(path.join(rootDir, 'components'), ['.tsx'])
const pyFiles = findSourceFiles(path.join(rootDir, 'backend/src'), ['.py'])
```

### Custom Metadata Extraction

**To extract additional metadata:**

```typescript
interface CodeEntry {
  description: string
  file: string
  line: number
  type: 'function' | 'type' | 'component' | 'class'
  signature?: string
  tags?: string[]
  // Add custom fields:
  deprecated?: boolean
  category?: string
  [key: string]: unknown
}
```

**Example: Extract `@deprecated` tag:**

```typescript
// In extractTypeScriptDocs()
const deprecatedMatch = jsdocText.match(/@deprecated/i)
const deprecated = !!deprecatedMatch

entries.push({
  name,
  description,
  file: path.relative(rootDir, filePath),
  line: lineNum,
  type,
  signature: declaration.split('\n')[0],
  deprecated,  // Add custom field
})
```

---

## 6. Pre-Commit Hook

**File:** `.husky/pre-commit`

### Skill Name

**Replace `PROJECT-docs-search` with your skill name:**

```bash
# Line ~80
if [ -f ".claude/skills/PROJECT-docs-search/code-index.yaml" ]; then
    git add .claude/skills/PROJECT-docs-search/code-index.yaml 2>/dev/null || true
    echo "✅ Code index updated and staged"
fi
```

**After customization:**
```bash
if [ -f ".claude/skills/myproject-docs-search/code-index.yaml" ]; then
    git add .claude/skills/myproject-docs-search/code-index.yaml 2>/dev/null || true
    echo "✅ Code index updated and staged"
fi
```

### Python Source Path

**If Python source is not in `apps/api`:**

```bash
# Update the python docs generation path
# Line ~62
echo "🔄 Python files changed, regenerating API docs..."
pnpm docs:generate:python > /dev/null 2>&1
```

Make sure this matches your `package.json` script.

### Enable Documentation Enforcement

**To enforce JSDoc/docstrings before commits:**

Uncomment lines 18-28:

```bash
# Uncomment to enforce JSDoc/docstrings before commit
echo "🔍 Enforcing documentation standards..."
cd apps/web
pnpm lint
TS_EXIT=$?
cd ../..

if [ $TS_EXIT -ne 0 ]; then
    echo ""
    echo "❌ BLOCKED: TypeScript documentation violations detected!"
    exit 1
fi
```

---

## 7. Project Structure Patterns

### Monorepo (Recommended)

```
my-project/
├── packages/
│   ├── types/src/           # Shared types
│   ├── utils/src/           # Utilities
│   └── config/              # Shared configs
├── apps/
│   ├── web/src/             # Frontend
│   └── api/src/             # Backend
├── docs/
│   ├── reference/           # Auto-generated API docs
│   ├── architecture/        # Design docs
│   └── patterns/            # Coding standards
├── .claude/
│   └── skills/
│       └── myproject-docs-search/
├── typedoc.json
└── package.json
```

**TypeDoc entry points:**
```json
["packages/*/src/**/*.ts", "apps/web/src/**/*.tsx"]
```

### Single-Repo TypeScript

```
my-project/
├── src/
│   ├── types/
│   ├── components/
│   ├── lib/
│   └── utils/
├── docs/
│   ├── reference/
│   ├── architecture/
│   └── patterns/
├── .claude/
│   └── skills/
│       └── myproject-docs-search/
├── typedoc.json
└── package.json
```

**TypeDoc entry points:**
```json
["src/**/*.ts"]
```

### Single-Repo Python

```
my-project/
├── src/
│   ├── models/
│   ├── services/
│   └── routes/
├── docs/
│   ├── reference/
│   ├── architecture/
│   └── patterns/
├── .claude/
│   └── skills/
│       └── myproject-docs-search/
└── pyproject.toml
```

**pdoc3 command:**
```bash
pdoc3 --output-dir docs/reference/python --format markdown src/
```

---

## 8. Testing Customizations

### Test 1: TypeDoc Generation

```bash
pnpm docs:generate
# Check: docs/reference/typescript/ has markdown files
```

### Test 2: Python Doc Generation

```bash
pnpm docs:generate:python
# Check: docs/reference/python/ has markdown files
```

### Test 3: Code Index Generation

```bash
pnpm docs:generate:code-index
# Check: .claude/skills/SKILLNAME/code-index.yaml has entries
```

### Test 4: Skill Activation

Ask Claude Code:
```
"Show me the complete [your-feature] system"
```

**Expected:**
- Skill activates automatically
- Returns results from multiple domains
- Includes file:line references

### Test 5: Pre-Commit Hook

```bash
# Make a change to a .ts file
echo "// test" >> src/test.ts

# Stage and commit
git add src/test.ts
git commit -m "test: verify pre-commit hook"

# Expected: Hook runs, docs regenerate, commit succeeds
```

---

## 9. Common Customization Scenarios

### Scenario: Next.js App Router Project

```json
// typedoc.json
{
  "entryPoints": [
    "app/**/*.tsx",
    "components/**/*.tsx",
    "lib/**/*.ts"
  ]
}
```

### Scenario: NestJS Backend

```json
// typedoc.json
{
  "entryPoints": [
    "src/modules/**/*.ts",
    "src/common/**/*.ts",
    "src/shared/**/*.ts"
  ]
}
```

### Scenario: Python FastAPI + TypeScript Frontend

**package.json:**
```json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:generate:python": "cd backend && pdoc3 --output-dir ../docs/reference/python --format markdown src/",
    "docs:generate:code-index": "ts-node .claude/skills/myapi-docs-search/scripts/generate-code-index.ts",
    "docs:generate:all": "pnpm docs:generate && pnpm docs:generate:python && pnpm docs:generate:code-index"
  }
}
```

**generate-code-index.ts:**
```typescript
const tsFiles = findSourceFiles(path.join(rootDir, 'frontend/src'), ['.ts', '.tsx'])
const pyFiles = findSourceFiles(path.join(rootDir, 'backend/src'), ['.py'])
```

---

## 10. Advanced Customization

### Custom Doc Index Domains

**Add a new domain (e.g., "tutorials"):**

```yaml
concepts:
  getting-started:
    description: "Getting started guide"
    tutorials:
      - path: "docs/tutorials/getting-started.md"
    keywords: ["tutorial", "quickstart", "setup"]
```

**Update SKILL.md:**
```markdown
7. 📖 **Tutorials** — Step-by-step guides
```

### Custom Code Index Categories

**Group functions by category:**

```typescript
// In generate-code-index.ts
function extractTypeScriptDocs(filePath: string): CodeEntry[] {
  // ...

  // Extract @category tag
  const categoryMatch = jsdocText.match(/@category\s+(\w+)/i)
  const category = categoryMatch ? categoryMatch[1] : 'uncategorized'

  entries.push({
    name,
    description,
    file: path.relative(rootDir, filePath),
    line: lineNum,
    type,
    category,  // Add category
  })
}
```

### Multi-Language Support

**Add support for additional languages:**

```typescript
// In generate-code-index.ts
const rustFiles = findSourceFiles(path.join(rootDir, 'src'), ['.rs'])

for (const file of rustFiles) {
  const docs = extractRustDocs(file)
  entries.push(...docs)
}
```

---

## Troubleshooting Customizations

### Issue: TypeDoc not finding files

**Solution:**
Check entry points in `typedoc.json` match your structure:
```bash
# List files that should match
ls -R packages/*/src/**/*.ts
ls -R apps/web/src/**/*.tsx
```

### Issue: Code index empty

**Solution:**
1. Verify source paths in `generate-code-index.ts`
2. Ensure JSDoc/docstrings are present
3. Run manually: `pnpm docs:generate:code-index`

### Issue: Skill not triggering

**Solution:**
1. Update trigger patterns in `SKILL.md` with project terminology
2. Rephrase query: "I'm implementing [feature]" or "Show me complete [feature]"

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
