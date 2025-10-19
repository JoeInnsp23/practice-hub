---
name: practice-hub-debugging
description: Systematic debugging and code cleanup for Practice Hub. Includes scripts to find/remove console.log statements, track TODOs/FIXMEs, validate code quality, and prepare codebase for production deployment. Critical for pre-production cleanup.
---

# Practice Hub Debugging Skill

## Overview

Systematic debugging, code cleanup, and quality assurance for Practice Hub before production deployment.

**Powerful automation scripts included** - see `scripts/` directory.

**Keywords**: debugging, code cleanup, console.log removal, TODO tracking, code quality, production readiness, technical debt

## Automation Scripts

**IMPORTANT: Always run scripts with `--help` first** to understand usage.

### 1. Find Console Logs
```bash
python scripts/find_console_logs.py
python scripts/find_console_logs.py --remove
python scripts/find_console_logs.py --interactive
```
**Features:**
- Scans all TypeScript/JavaScript files
- Finds console.log, console.warn, console.error, etc.
- Automatically removes console.log (keeps console.error)
- Interactive mode for manual review
- Skip comments and node_modules

**Why it matters:** Production code should not contain console.log statements

### 2. Track TODOs
```bash
python scripts/track_todos.py
python scripts/track_todos.py --by-priority
python scripts/track_todos.py --export todos.md
```
**Features:**
- Finds TODO, FIXME, HACK, XXX, NOTE comments
- Categorizes by priority (FIXME=critical, TODO=medium, etc.)
- Groups by file or priority
- Export to markdown report
- Identifies technical debt

**Priority Levels:**
- 🚨 **FIXME** - Critical, breaks functionality
- ⚠️ **HACK** - High priority, needs refactoring
- 📝 **TODO** - Medium, planned feature
- 💡 **XXX** - Low, minor improvement
- 📌 **NOTE** - Info, documentation

## Known TODOs in Practice Hub

Based on codebase analysis, these TODOs exist:

### 1. Calculator: VAT Registration
**File:** `app/proposal-hub/calculator/page.tsx:95`
**Issue:** `vatRegistered: true` is hardcoded
**Fix:** Fetch from client data
```typescript
// Before:
vatRegistered: true, // TODO: Get from client data

// After:
vatRegistered: client?.vatRegistered ?? false,
```

### 2. Analytics: Conversion Data
**Files:** `app/proposal-hub/reports/page.tsx:65,268`
**Issue:** Analytics endpoint doesn't provide conversion data
**Fix:** Add conversion tracking to analytics router
```typescript
// TODO: Add to analytics router
convertedToProposal: count(
  proposals.id
).where(eq(proposals.leadId, leads.id))
```

### 3. Proposals: Email Confirmation
**File:** `app/server/routers/proposals.ts:1044`
**Issue:** No email confirmation after signature
**Fix:** Implement email notification
```typescript
// TODO: Send confirmation email to client and team
await sendEmail({
  to: proposal.client.email,
  template: 'proposal-signed',
  data: { proposalId, clientName }
});
```

### 4. Transaction Data: Xero Integration
**File:** `app/server/routers/transactionData.ts:212`
**Issue:** Xero API integration not implemented
**Fix:** Either implement or document as future feature

## Code Quality Checks

### Remove Console Statements

**Current state:** 115 console statements found in codebase

**Action:**
```bash
# 1. Review all console statements
python scripts/find_console_logs.py

# 2. Automatically remove console.log
python scripts/find_console_logs.py --remove

# 3. Manual review for console.error (keep if needed)
python scripts/find_console_logs.py --interactive
```

**Best practices:**
- ❌ Remove: `console.log()` - debugging leftover
- ❌ Remove: `console.debug()` - debugging leftover
- ⚠️ Review: `console.warn()` - may be legitimate
- ✅ Keep: `console.error()` - genuine error handling (if appropriate)

### Address TODOs

**Current state:** 5 TODOs found

**Workflow:**
```bash
# 1. Generate TODO report
python scripts/track_todos.py --by-priority

# 2. Export for planning
python scripts/track_todos.py --export todos.md

# 3. Address based on priority:
#    - FIXME: Must fix before production
#    - HACK: Should refactor
#    - TODO: Plan for next sprint or document
```

## Pre-Production Checklist

Before deploying to production with live data:

### Critical (Must Fix)
- [ ] All FIXME items resolved
- [ ] All console.log statements removed
- [ ] No hard-coded tenant IDs (except tests)
- [ ] All placeholder code removed
- [ ] Error handling produces user-friendly messages

### High Priority (Should Fix)
- [ ] HACK items refactored or documented
- [ ] TODO items planned or removed
- [ ] No commented-out code blocks
- [ ] Type errors resolved (pnpm tsc --noEmit)
- [ ] Linter warnings addressed (pnpm lint)

### Medium Priority (Nice to Have)
- [ ] XXX items addressed
- [ ] Code comments accurate and helpful
- [ ] Variable names descriptive
- [ ] Functions follow single responsibility
- [ ] DRY principle applied

## Debugging Workflows

### Finding Performance Issues

```typescript
// Instead of console.log for timing:
const start = performance.now();
const result = await expensiveOperation();
const duration = performance.now() - start;

// Log only in development
if (process.env.NODE_ENV === 'development') {
  console.log(`Operation took ${duration}ms`);
}
```

### Debugging Multi-Tenant Issues

```typescript
// Add temporary assertions during debugging
if (process.env.NODE_ENV === 'development') {
  const allResults = await db.select().from(clients);
  const wrongTenant = allResults.filter(
    c => c.tenantId !== ctx.authContext.tenantId
  );

  if (wrongTenant.length > 0) {
    console.error('TENANT ISOLATION ERROR:', wrongTenant);
    throw new Error('Tenant isolation violated!');
  }
}
```

### Debugging tRPC Errors

```typescript
// Better error logging for tRPC
.mutation(async ({ ctx, input }) => {
  try {
    return await someOperation(input);
  } catch (error) {
    // Log with context
    console.error('Operation failed:', {
      userId: ctx.authContext.userId,
      tenantId: ctx.authContext.tenantId,
      input,
      error: error instanceof Error ? error.message : String(error)
    });

    // Throw user-friendly error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to complete operation',
    });
  }
});
```

## Best Practices

### Logging in Production

Instead of console.log, use structured logging:

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Production-appropriate error logging
if (error) {
  console.error({
    timestamp: new Date().toISOString(),
    userId: ctx.authContext.userId,
    error: error.message,
    stack: error.stack,
  });
}
```

### Managing Technical Debt

1. **Categorize** - Use FIXME/HACK/TODO appropriately
2. **Link to issues** - Add GitHub issue numbers in comments
3. **Time-box** - Set deadlines for addressing debt
4. **Document** - Explain why something is a TODO
5. **Track** - Use track_todos.py regularly

### Code Review Checklist

Before committing:
```bash
# 1. Check for console statements
python .claude/skills/practice-hub-debugging/scripts/find_console_logs.py

# 2. Review TODOs
python .claude/skills/practice-hub-debugging/scripts/track_todos.py

# 3. Run linter
pnpm lint

# 4. Run type check
pnpm tsc --noEmit

# 5. Run tests
pnpm test
```

## Quick Fixes

### Remove All Console.log

```bash
python scripts/find_console_logs.py --remove
```

### Generate TODO Report

```bash
python scripts/track_todos.py --by-priority --export todos.md
```

### Validate Tenant Isolation

```bash
python ../practice-hub-testing/scripts/validate_tenant_isolation.py --strict
```

## Common Debugging Patterns

### Finding Race Conditions

Look for:
- Missing `await` keywords
- Promises not being awaited
- State updates in async callbacks

### Finding Memory Leaks

Check for:
- Event listeners not being removed
- Large objects in global scope
- Unclosed database connections

### Finding Security Issues

Scan for:
- Hard-coded credentials
- SQL injection points
- Missing input validation
- Exposed API keys

## Production Readiness

**Run these commands before deployment:**

```bash
# 1. Clean console statements
python .claude/skills/practice-hub-debugging/scripts/find_console_logs.py --remove

# 2. Check TODOs
python .claude/skills/practice-hub-debugging/scripts/track_todos.py --by-priority

# 3. Validate tenant isolation
python .claude/skills/practice-hub-testing/scripts/validate_tenant_isolation.py --strict

# 4. Run full test suite
pnpm test

# 5. Build check
pnpm build
```

If all pass: ✅ **Ready for production!**
