# Architecture

Complete system design and architecture of the reusable documentation system.

---

## System Overview

The documentation system consists of **4 core subsystems** working together:

1. **Documentation Generation** — Auto-generate API reference from code
2. **Code Index** — Fast function/type lookup with file:line references
3. **Documentation Search Skill** — Multi-domain intelligent search
4. **Automation Pipeline** — Pre-commit hooks for auto-regeneration

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Developer writes code with JSDoc/docstrings                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Git Pre-Commit Hook (triggers on .ts, .tsx, .py changes)   │
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
│ docs/reference/                                             │
│   ├── typescript/  (auto-generated TypeScript API docs)    │
│   └── python/      (auto-generated Python API docs)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ generate-code-index.ts extracts metadata                    │
│ → Parses JSDoc/docstrings                                   │
│ → Builds YAML index with file:line references              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ .claude/skills/SKILLNAME/code-index.yaml                    │
│ → Functions, types, classes with signatures                │
│ → Parameters, returns, examples                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Updated docs + code index staged for commit                 │
│ → Developer gets updated documentation automatically        │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Code activates skill during development              │
│ → Searches doc-index.yaml (concept lookup)                  │
│ → Searches code-index.yaml (function/type lookup)           │
│ → Greps documentation files (full-text search)              │
│ → Returns file:line references + examples                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Documentation Generation Pipeline

**Purpose:** Auto-generate markdown API documentation from source code.

**Components:**

#### TypeDoc (TypeScript → Markdown)

- **Input:** TypeScript source files with JSDoc comments
- **Output:** Markdown files in `docs/reference/typescript/`
- **Configuration:** `typedoc.json`

**Process:**
1. Reads entry points from `typedoc.json`
2. Parses TypeScript AST
3. Extracts JSDoc comments
4. Generates markdown using `typedoc-plugin-markdown`
5. Organizes by modules, functions, types

**Key config:**
```json
{
  "entryPoints": ["packages/*/src/**/*.ts"],
  "out": "docs/reference/typescript",
  "plugin": ["typedoc-plugin-markdown"]
}
```

#### pdoc3 (Python → Markdown)

- **Input:** Python source files with docstrings
- **Output:** Markdown files in `docs/reference/python/`
- **Configuration:** Command-line arguments

**Process:**
1. Imports Python modules
2. Extracts docstrings (Google/NumPy/reStructuredText style)
3. Generates markdown documentation
4. Organizes by modules, classes, functions

**Key command:**
```bash
pdoc3 --output-dir docs/reference/python --format markdown src/
```

---

### 2. Code Index System

**Purpose:** Fast lookup of functions, types, classes with file:line references.

**Component:** `generate-code-index.ts`

**Architecture:**

```
┌─────────────────────────────────────────────┐
│ findSourceFiles()                           │
│ → Recursively find .ts, .tsx, .py files    │
│ → Skip node_modules, .git, etc.            │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐
│ extractTypeScript│  │ extractPythonDocs│
│ Docs()           │  │ ()               │
│                  │  │                  │
│ - Parse JSDoc    │  │ - Parse          │
│ - Extract @param │  │   docstrings     │
│ - Extract        │  │ - Extract args   │
│   @returns       │  │ - Extract        │
│ - Extract        │  │   returns        │
│   @example       │  │ - Extract        │
│ - Get line       │  │   examples       │
│   number         │  │ - Get line       │
│                  │  │   number         │
└──────────────────┘  └──────────────────┘
       │                       │
       └───────────┬───────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ buildYaml()                                 │
│ → Group by type (functions, types,         │
│   components)                               │
│ → Format as YAML                            │
│ → Add metadata (version, timestamp)        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ code-index.yaml                             │
│                                             │
│ functions:                                  │
│   myFunction:                               │
│     file: "src/utils.ts"                    │
│     line: 42                                │
│     signature: "function myFunction(...)"   │
│     parameters: [...]                       │
│     returns: {...}                          │
│     example: |                              │
│       myFunction('test')                    │
└─────────────────────────────────────────────┘
```

**Data Structure:**

```yaml
functions:
  functionName:
    description: "What it does"
    file: "relative/path/to/file.ts"
    line: 42
    type: "function"
    signature: "export function functionName(...)"
    parameters:
      - name: "param1"
        type: "string"
        description: "What it is"
    returns:
      type: "ReturnType"
      description: "What it returns"
    tags: ["tag1", "tag2"]
    example: |
      const result = functionName('value')

types:
  TypeName:
    description: "Type definition"
    file: "path/to/file.ts"
    line: 24
    type: "type"
    signature: "export type TypeName = {...}"

components:
  ComponentName:
    description: "React component"
    file: "path/to/Component.tsx"
    line: 15
    type: "component"
```

---

### 3. Documentation Search Skill

**Purpose:** Intelligent multi-domain search with automatic activation.

**Component:** `.claude/skills/SKILLNAME/`

**Architecture:**

```
┌─────────────────────────────────────────────┐
│ Claude Code detects development query       │
│ → "I'm implementing X"                      │
│ → "Show me complete Y system"               │
│ → "What's the signature for Z?"             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Skill triggers (SKILL.md description match) │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐
│ Layer 0: Code    │  │ Layer 1: Concept │
│ Index Lookup     │  │ Index Lookup     │
│                  │  │                  │
│ - Check code-    │  │ - Check doc-     │
│   index.yaml for │  │   index.yaml for │
│   exact function │  │   concept        │
│   /type name     │  │ - Return all     │
│ - Return         │  │   matching docs  │
│   file:line +    │  │   across domains │
│   signature      │  │                  │
└──────────────────┘  └──────────────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Layer 2: Full-Text Search (Fallback)       │
│                                             │
│ - Grep docs/reference/                      │
│ - Grep docs/architecture/                   │
│ - Grep docs/patterns/                       │
│ - Return matching content                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Format Results                              │
│                                             │
│ ✨ [Domain - Source]                        │
│ File: path/to/file:line                     │
│ Content: ...                                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Return to Claude Code                       │
│ → Claude uses results for context           │
│ → Responds to user with detailed answer     │
└─────────────────────────────────────────────┘
```

**Search Strategy:**

1. **Code Index (Fast):**
   - Check if query matches function/type/class name
   - Return signature, file:line, parameters, example
   - Example: "What's validateEmail?" → Returns function details

2. **Concept Index (Comprehensive):**
   - Check if query matches concept keywords
   - Return ALL docs for that concept (API, architecture, patterns)
   - Example: "Show me authentication" → Returns auth API + architecture + patterns

3. **Full-Text Search (Fallback):**
   - Grep documentation files for query terms
   - Return matching content with file paths
   - Example: "How do I handle errors?" → Greps for "error handling"

---

### 4. Automation Pipeline

**Purpose:** Keep documentation in sync with code automatically.

**Component:** `.husky/pre-commit`

**Architecture:**

```
┌─────────────────────────────────────────────┐
│ git commit                                  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Pre-commit hook runs                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Detect changed files                        │
│ → git diff --cached --name-only             │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐
│ .ts/.tsx changed?│  │ .py changed?     │
│                  │  │                  │
│ Yes → Run        │  │ Yes → Run        │
│ pnpm docs:       │  │ pnpm docs:       │
│ generate         │  │ generate:python  │
│                  │  │                  │
│ No → Skip        │  │ No → Skip        │
└──────────────────┘  └──────────────────┘
       │                       │
       └───────────┬───────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ Any source files changed?                   │
│                                             │
│ Yes → Run pnpm docs:generate:code-index     │
│ No → Skip                                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Stage updated docs                          │
│ → git add docs/reference/                   │
│ → git add .claude/skills/*/code-index.yaml  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Commit succeeds with updated docs           │
└─────────────────────────────────────────────┘
```

**Optimization:** Only regenerate docs when source files change (not on every commit).

---

## Data Flow

### End-to-End Example: Adding a New Function

**1. Developer writes code:**

```typescript
/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns true if valid, false otherwise
 * @example
 * validateEmail('user@example.com')  // true
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

**2. Developer commits:**

```bash
git add src/utils/validation.ts
git commit -m "feat: add email validation"
```

**3. Pre-commit hook runs:**

```
🔍 Detecting .ts file changes...
✓ Found: src/utils/validation.ts

📚 Regenerating TypeScript API docs...
✓ TypeDoc generated docs/reference/typescript/modules/utils_validation.md

📝 Regenerating code index...
✓ Code index updated with validateEmail entry

✓ Staging updated docs...
✓ Commit ready
```

**4. TypeDoc generates:**

`docs/reference/typescript/modules/utils_validation.md`:
```markdown
## validateEmail

▸ **validateEmail**(`email`): `boolean`

Validates an email address format

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `email` | `string` | The email to validate |

**Returns:** `boolean`
true if valid, false otherwise

**Example:**
```typescript
validateEmail('user@example.com')  // true
```

**Defined in:** src/utils/validation.ts:12
```

**5. Code index generates:**

`.claude/skills/myproject-docs-search/code-index.yaml`:
```yaml
functions:
  validateEmail:
    description: "Validates an email address format"
    file: "src/utils/validation.ts"
    line: 12
    type: "function"
    signature: "export function validateEmail(email: string): boolean"
    parameters:
      - name: "email"
        type: "string"
        description: "The email to validate"
    returns:
      type: "boolean"
      description: "true if valid, false otherwise"
    example: |
      validateEmail('user@example.com')  // true
```

**6. Developer asks Claude:**

```
"What's the signature for validateEmail?"
```

**7. Skill searches:**

- **Layer 0 (Code Index):** Finds exact match for `validateEmail`
- Returns: file:line, signature, parameters, example

**8. Claude responds:**

```
The validateEmail function is defined in src/utils/validation.ts:12

Signature:
export function validateEmail(email: string): boolean

Parameters:
- email (string): The email to validate

Returns: boolean - true if valid, false otherwise

Example:
validateEmail('user@example.com')  // true
```

---

## Performance Considerations

### Documentation Generation

**TypeDoc:**
- **Time:** ~1-5s for small projects (<100 files)
- **Time:** ~5-30s for large projects (>1000 files)
- **Optimization:** Only runs when .ts/.tsx files change

**pdoc3:**
- **Time:** ~0.5-2s for small projects
- **Time:** ~2-10s for large projects
- **Optimization:** Only runs when .py files change

### Code Index Generation

**Time:** ~0.5-3s for most projects
- **Optimization:** Incremental updates (only changed files)
- **Caching:** None currently (regenerates full index each time)

### Skill Search

**Code Index Lookup:** <50ms (YAML parse + lookup)
**Concept Index Lookup:** <50ms (YAML parse + lookup)
**Full-Text Search:** 100-500ms (grep across multiple files)

**Total skill response time:** <1s for most queries

---

## Scalability

### Small Projects (<100 files)

- All components run in <5s
- Pre-commit hook adds <2s to commit time
- Code index <10KB

### Medium Projects (100-1000 files)

- TypeDoc may take 10-30s
- Pre-commit hook adds <10s to commit time
- Code index 10-100KB

### Large Projects (>1000 files)

- TypeDoc may take 30-60s
- Consider running docs generation separately (not in pre-commit)
- Code index 100KB-1MB

**Optimization for large projects:**
- Disable pre-commit hook
- Run docs generation in CI/CD instead
- Use incremental TypeDoc builds (future enhancement)

---

## Security Considerations

### Pre-Commit Hook

- **Risk:** Could expose secrets if docs commit sensitive code
- **Mitigation:** Review generated docs before pushing
- **Best practice:** Keep secrets in environment variables, not code

### Code Index

- **Risk:** Code index exposes function signatures (not full implementation)
- **Mitigation:** Acceptable for most projects (signatures are public API)
- **Best practice:** Don't include private/internal functions in docs

### Skill Search

- **Risk:** None (read-only operations)
- **Mitigation:** N/A

---

## Extension Points

### 1. Add New Documentation Domain

**Example: Add "Tutorials" domain:**

1. Add to `doc-index.yaml`:
```yaml
concepts:
  getting-started:
    tutorials:
      - path: "docs/tutorials/getting-started.md"
```

2. Update `SKILL.md`:
```markdown
7. 📖 **Tutorials** — Step-by-step guides
```

3. Skill will automatically search tutorials/ directory

### 2. Custom Metadata Extraction

**Example: Extract `@deprecated` tag:**

Modify `generate-code-index.ts`:
```typescript
const deprecatedMatch = jsdocText.match(/@deprecated/i)
const deprecated = !!deprecatedMatch

entries.push({
  // ...existing fields...
  deprecated,
})
```

### 3. Multi-Language Support

**Example: Add Rust support:**

1. Create `extractRustDocs()` function
2. Add `.rs` files to `findSourceFiles()`
3. Parse Rust doc comments (`///` and `//!`)

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
