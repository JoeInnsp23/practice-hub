# Troubleshooting Guide

Common issues and solutions for the reusable documentation system.

---

## Quick Diagnosis

Run the validation script to identify issues:

```bash
bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

---

## Installation Issues

### Issue: `pnpm install` fails with TypeDoc errors

**Symptoms:**
```
ERR_PNPM_PEER_DEP_ISSUES Unmet peer dependencies
```

**Solution:**
```bash
# Use --legacy-peer-deps flag
pnpm install --legacy-peer-deps typedoc typedoc-plugin-markdown ts-node

# Or use npm instead
npm install --save-dev typedoc typedoc-plugin-markdown ts-node
```

### Issue: `pip install pdoc3` fails

**Symptoms:**
```
ERROR: Could not find a version that satisfies the requirement pdoc3
```

**Solutions:**

1. **Update pip:**
```bash
pip install --upgrade pip
pip install pdoc3
```

2. **Use pip3:**
```bash
pip3 install pdoc3
```

3. **Use virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pdoc3
```

### Issue: Pre-commit hook not executable

**Symptoms:**
```
.husky/pre-commit: Permission denied
```

**Solution:**
```bash
chmod +x .husky/pre-commit
```

---

## Documentation Generation Issues

### Issue: TypeDoc not generating any docs

**Symptoms:**
- `docs/reference/typescript/` is empty
- No errors during `pnpm docs:generate`

**Diagnosis:**

1. **Check entry points:**
```bash
# List files that should match your entry points
ls -R packages/*/src/**/*.ts 2>/dev/null || echo "No files found"
```

2. **Run TypeDoc with verbose output:**
```bash
pnpm typedoc --help
```

**Solutions:**

1. **Fix entry points in `typedoc.json`:**

```json
{
  "entryPoints": [
    "src/**/*.ts"  // Single-repo
    // OR
    "packages/*/src/**/*.ts"  // Monorepo
  ]
}
```

2. **Ensure TypeScript files have JSDoc:**

```typescript
/**
 * This function needs JSDoc to be documented
 */
export function myFunction() {
  // ...
}
```

3. **Check TypeDoc is reading config:**
```bash
pnpm typedoc --options typedoc.json
```

### Issue: TypeDoc generates docs but they're incomplete

**Symptoms:**
- Only some functions documented
- Missing types or interfaces

**Solution:**

Check `excludeNotDocumented` setting in `typedoc.json`:

```json
{
  "excludeNotDocumented": false  // ← Should be false to include all code
}
```

### Issue: Python docs not generating

**Symptoms:**
- `pnpm docs:generate:python` fails silently
- `docs/reference/python/` is empty

**Diagnosis:**

1. **Check pdoc3 is installed:**
```bash
pdoc3 --version
```

2. **Check Python source path:**
```bash
ls apps/api/src/*.py  # Verify files exist
```

**Solutions:**

1. **Fix Python source path in `package.json`:**

```json
{
  "scripts": {
    "docs:generate:python": "cd apps/api && pdoc3 --output-dir ../../docs/reference/python --format markdown src/"
    // ↑ Adjust 'apps/api' and 'src/' to match your structure
  }
}
```

2. **Ensure Python files have docstrings:**

```python
def my_function():
    """This function needs a docstring to be documented."""
    pass
```

3. **Run pdoc3 manually:**
```bash
cd apps/api
pdoc3 --output-dir ../../docs/reference/python --format markdown src/
```

### Issue: Code index is empty

**Symptoms:**
- `code-index.yaml` exists but has no entries
- Only metadata section present

**Diagnosis:**

1. **Check if source files have JSDoc/docstrings:**
```bash
grep -r "@param" packages/  # TypeScript
grep -r '"""' apps/api/src/  # Python
```

2. **Run code index generator manually:**
```bash
pnpm docs:generate:code-index
```

**Solutions:**

1. **Add JSDoc to TypeScript functions:**

```typescript
/**
 * Description
 * @param name - Parameter description
 * @returns Return description
 */
export function myFunction(name: string): string {
  return name
}
```

2. **Fix source paths in `generate-code-index.ts`:**

```typescript
// Line 212-214
const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
// ↑ Change 'packages' to match your structure
```

3. **Check regex patterns:**

The script uses regex to find JSDoc blocks. Ensure your JSDoc format matches:

```typescript
/**
 * Description  ← Must have description
 * @param foo - Description  ← Must have @param
 */
export function myFunction(foo: string): void {  ← Must have export
  // ...
}
```

---

## Skill Activation Issues

### Issue: Skill not triggering automatically

**Symptoms:**
- Ask Claude about features, but skill doesn't activate
- No results from documentation search

**Why This Happens:**

Skill activation is **non-deterministic** — it depends on Claude Code's internal heuristics matching the skill description.

**Solutions:**

1. **Rephrase query with active verbs:**

✅ **Good (higher trigger rate):**
- "I'm implementing [feature]"
- "I need to start working on [feature]"
- "Show me the complete [feature] system"

❌ **Bad (lower trigger rate):**
- "Tell me about [feature]"
- "What is [feature]?"
- "Explain [feature]"

2. **Update trigger patterns in `SKILL.md`:**

Add project-specific terminology to `description:` field:

```yaml
description: Search documentation for MyProject (authentication, payment processing, analytics). Triggers when user asks about auth flows, payment integration, analytics dashboards, or implementation patterns.
```

Include:
- Key features
- Core components
- Common dev terms

3. **Use concept-specific queries:**

If concept exists in `doc-index.yaml`, use it:

```
"Show me the complete authentication system"  ← If "authentication" is in doc-index.yaml
```

4. **Invoke skill manually:**

Use Claude Code skill invocation (if supported):
```
/skill myproject-docs-search "query here"
```

### Issue: Skill triggers but returns no results

**Symptoms:**
- Skill activates (you see it in logs)
- Returns "No results found"

**Diagnosis:**

1. **Check if concept exists in `doc-index.yaml`:**
```bash
grep -i "authentication" .claude/skills/*/doc-index.yaml
```

2. **Check if documentation files exist:**
```bash
ls docs/reference/typescript/
ls docs/architecture/
```

**Solutions:**

1. **Add concept to `doc-index.yaml`:**

```yaml
concepts:
  authentication:
    description: "User auth, sessions, OAuth"
    api:
      - path: "docs/reference/typescript/modules/auth.md"
    architecture:
      - path: "docs/architecture/auth-system.md"
    keywords: ["auth", "authentication", "login", "session"]
```

2. **Generate documentation if missing:**
```bash
pnpm docs:generate:all
```

3. **Check file paths in `doc-index.yaml` are correct:**
```bash
# Verify path exists
ls docs/reference/typescript/modules/auth.md
```

### Issue: Skill returns wrong domain

**Symptoms:**
- Ask about API, get architecture docs
- Ask about requirements, get code

**Solution:**

Be explicit in your query:

```
"Show me the **API** for authentication"  ← Returns API reference
"Show me the **design** for authentication"  ← Returns architecture
"Show me the **complete** authentication system"  ← Returns all domains
```

---

## Pre-Commit Hook Issues

### Issue: Pre-commit hook fails with "command not found"

**Symptoms:**
```
.husky/pre-commit: line 10: pnpm: command not found
```

**Solution:**

Ensure `pnpm` (or `npm`) is in PATH:

```bash
which pnpm  # Should return path to pnpm

# If not found, install:
npm install -g pnpm
```

### Issue: Pre-commit hook takes too long

**Symptoms:**
- Commits take >30 seconds
- TypeDoc/pdoc3 generation is slow

**Solutions:**

1. **Disable docs generation in pre-commit hook:**

Edit `.husky/pre-commit`, comment out slow parts:

```bash
# Disable TypeDoc
# if [ -n "$TS_FILES_CHANGED" ]; then
#     pnpm docs:generate > /dev/null 2>&1
# fi

# Disable pdoc3
# if [ -n "$PY_FILES_CHANGED" ]; then
#     pnpm docs:generate:python > /dev/null 2>&1
# fi
```

2. **Run docs generation in CI/CD instead:**

`.github/workflows/docs.yml`:
```yaml
name: Generate Docs
on: [push]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: pnpm docs:generate:all
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "docs: auto-generate API documentation"
```

3. **Optimize TypeDoc (for large projects):**

```json
// typedoc.json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**"
  ]
}
```

### Issue: Pre-commit hook stages unrelated files

**Symptoms:**
- Committing one file, but hook stages all docs

**This is expected behavior:**

The hook regenerates docs when ANY source file changes, then stages all updated docs.

**To verify what's staged:**
```bash
git status
```

**To unstage unwanted files:**
```bash
git reset HEAD docs/reference/python/
```

---

## Package.json Script Issues

### Issue: `pnpm docs:generate` not found

**Symptoms:**
```
 ERR_PNPM_NO_SCRIPT  Missing script: docs:generate
```

**Solution:**

Add script to `package.json`:

```json
{
  "scripts": {
    "docs:generate": "typedoc && echo '✅ TypeScript API docs generated'"
  }
}
```

### Issue: Scripts reference wrong skill name

**Symptoms:**
```
Error: Cannot find path .claude/skills/PROJECT-docs-search
```

**Solution:**

Update script with your actual skill name:

```json
{
  "scripts": {
    "docs:generate:code-index": "ts-node .claude/skills/myproject-docs-search/scripts/generate-code-index.ts"
    // ↑ Replace PROJECT-docs-search with your skill name
  }
}
```

---

## Validation Script Issues

### Issue: Validation script shows warnings

**Symptoms:**
```
⚠ TypeScript docs not generated
⚠ Code index is empty
```

**This is normal if:**
- You just installed the system
- You haven't added JSDoc/docstrings yet

**Solution:**

1. Add documentation to your code
2. Run generation manually:
```bash
pnpm docs:generate:all
```

3. Re-run validation:
```bash
bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

### Issue: Validation script shows failures

**Symptoms:**
```
✗ typedoc.json missing
✗ SKILL.md missing
```

**Solution:**

Re-run installer:
```bash
bash .ai/reusable-docs-system/scripts/install.sh
```

---

## Project Structure Issues

### Issue: Monorepo vs single-repo confusion

**Symptoms:**
- TypeDoc not finding files
- Code index has wrong paths

**Solution:**

**For monorepo:**
```json
// typedoc.json
{
  "entryPoints": ["packages/*/src/**/*.ts", "apps/*/src/**/*.tsx"]
}
```

```typescript
// generate-code-index.ts
const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
const webFiles = findSourceFiles(path.join(rootDir, 'apps/web'), ['.tsx'])
```

**For single-repo:**
```json
// typedoc.json
{
  "entryPoints": ["src/**/*.ts"]
}
```

```typescript
// generate-code-index.ts
const tsFiles = findSourceFiles(path.join(rootDir, 'src'), ['.ts', '.tsx'])
const webFiles: string[] = []
```

---

## Common Error Messages

### Error: `ENOENT: no such file or directory`

**Full error:**
```
Error: ENOENT: no such file or directory, scandir 'packages'
```

**Cause:** Path in `typedoc.json` or `generate-code-index.ts` doesn't exist

**Solution:**

1. Check project structure:
```bash
ls -la  # List directories
```

2. Fix path in `typedoc.json`:
```json
{
  "entryPoints": ["src/**/*.ts"]  // Use actual path
}
```

### Error: `SyntaxError: Unexpected token`

**Full error:**
```
SyntaxError: Unexpected token 'export'
```

**Cause:** Node.js trying to run TypeScript without compilation

**Solution:**

Use `ts-node` instead of `node`:
```bash
# Wrong
node .claude/skills/*/scripts/generate-code-index.ts

# Right
ts-node .claude/skills/*/scripts/generate-code-index.ts
# Or
pnpm docs:generate:code-index
```

### Error: `Module not found: Cannot resolve 'typedoc-plugin-markdown'`

**Cause:** Missing dependency

**Solution:**
```bash
pnpm install --save-dev typedoc-plugin-markdown
```

---

## Performance Issues

### Issue: TypeDoc is very slow

**Symptoms:**
- Takes >60 seconds to generate docs
- High CPU usage

**Solutions:**

1. **Exclude test files:**
```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

2. **Reduce entry points:**
```json
{
  "entryPoints": [
    "packages/core/src/**/*.ts"  // Only core package
    // Remove other packages
  ]
}
```

3. **Disable source links (faster but less useful):**
```json
{
  "disableSources": true
}
```

### Issue: Code index generation is slow

**Symptoms:**
- Takes >10 seconds
- Many files being scanned

**Solution:**

Add exclusions in `generate-code-index.ts`:

```typescript
const entries = fs.readdirSync(current, { withFileTypes: true })

for (const entry of entries) {
  // Add more exclusions:
  if ([
    'node_modules', '.git', 'dist', 'build',
    '__pycache__', '.pytest_cache',
    'coverage', '.next', '.turbo'  // Add these
  ].includes(entry.name)) {
    continue
  }
  // ...
}
```

---

## Getting Help

If you're still stuck:

1. **Check validation output:**
```bash
bash .ai/reusable-docs-system/scripts/validate-setup.sh
```

2. **Review configuration:**
- `typedoc.json` entry points
- `package.json` scripts
- `doc-index.yaml` concepts
- `generate-code-index.ts` paths

3. **Check logs:**
```bash
# TypeDoc logs
pnpm typedoc 2>&1 | tee typedoc.log

# Code index logs
pnpm docs:generate:code-index 2>&1 | tee code-index.log
```

4. **Verify file paths:**
```bash
# List what TypeDoc should find
find packages -name "*.ts" -o -name "*.tsx"

# List what code index should find
find src -name "*.ts" -o -name "*.tsx" -o -name "*.py"
```

---

## Known Limitations

### 1. Skill Trigger Reliability

**Issue:** Skill activation is non-deterministic (~70-90% reliability)

**Workaround:** Rephrase queries with active verbs ("I'm implementing X")

### 2. TypeDoc Monorepo Support

**Issue:** TypeDoc has limited monorepo support

**Workaround:** Use glob patterns in entry points

### 3. Code Index Size

**Issue:** Large projects (>10,000 functions) may have >1MB code index

**Workaround:** Exclude test files and internal packages

### 4. Python Async Functions

**Issue:** Code index regex doesn't always detect async Python functions

**Workaround:** Ensure docstring is on line after `async def`

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
