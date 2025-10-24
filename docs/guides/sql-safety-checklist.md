# SQL Safety Checklist

**Last Updated:** 2025-01-24
**Status:** Active
**Triggered by:** 3 critical PostgreSQL ANY() bugs discovered during Story 2.2 testing

---

## Purpose

This checklist ensures all tRPC routers follow SQL safety best practices and prevent the introduction of SQL injection vulnerabilities or syntax errors.

**Use this checklist:**
- Before submitting any PR that modifies router files
- During code reviews of database-related changes
- When writing new tRPC procedures with database queries

---

## Quick Reference: Common Patterns

### ✅ CORRECT Patterns

**1. Array Operations - Use `inArray()`**
```typescript
import { inArray } from "drizzle-orm";

// ✅ CORRECT
.where(inArray(column, arrayVariable))

// ✅ CORRECT (with AND)
.where(and(
  eq(table.tenantId, tenantId),
  inArray(table.id, ids)
))
```

**2. Parameterized Queries - Use Drizzle Helpers**
```typescript
import { eq, and, or, isNull } from "drizzle-orm";

// ✅ CORRECT
.where(and(
  eq(table.tenantId, tenantId),
  eq(table.status, "active")
))
```

**3. Raw SQL (when necessary) - Use Placeholders**
```typescript
import { sql } from "drizzle-orm";

// ✅ CORRECT - Parameterized
await db.execute(sql`
  UPDATE ${table}
  SET status = ${status}
  WHERE tenant_id = ${tenantId}
`);
```

---

### ❌ DANGEROUS Patterns (Never Use)

**1. PostgreSQL ANY() with Direct Array**
```typescript
// ❌ WRONG - Will cause syntax error
.where(sql`${column} = ANY(${arrayVariable})`)

// ❌ WRONG - Parameter expansion breaks PostgreSQL
sql`WHERE id = ANY(${ids})`

// Why it fails: Drizzle expands ${ids} into ($1, $2, $3, ...)
// PostgreSQL ANY() expects single array parameter: ANY($1::text[])
```

**2. String Concatenation**
```typescript
// ❌ WRONG - SQL injection risk
.where(sql`status = '${userInput}'`)

// ❌ WRONG - Dynamic table names without validation
const tableName = userInput;
await db.execute(sql`SELECT * FROM ${tableName}`);
```

**3. Unparameterized User Input**
```typescript
// ❌ WRONG - Never interpolate user input directly
const query = `SELECT * FROM users WHERE email = '${email}'`;
await db.execute(sql.raw(query));
```

---

## Pre-Commit Checklist

Before committing router changes, verify:

### 1. ✅ Array Operations
- [ ] No usage of `= ANY(${array})` pattern
- [ ] All array operations use `inArray(column, array)` helper
- [ ] If ANY() is required, uses explicit ARRAY[] syntax: `= ANY(ARRAY[...]::type[])`

### 2. ✅ Imports
- [ ] `inArray` imported from `"drizzle-orm"` when used
- [ ] Other helpers imported: `eq`, `and`, `or`, `isNull`, etc.

### 3. ✅ Multi-Tenant Isolation
- [ ] All queries filter by `tenantId`
- [ ] Client portal queries filter by BOTH `tenantId` AND `clientId`
- [ ] No queries bypass tenant isolation unless explicitly documented

### 4. ✅ User Input Validation
- [ ] All inputs validated with Zod schemas
- [ ] No direct string interpolation of user input in SQL
- [ ] File paths, IDs, and enums validated before use

### 5. ✅ Raw SQL (if used)
- [ ] Justification documented in code comment
- [ ] Uses parameterized placeholders (not string concatenation)
- [ ] Cannot be replaced with Drizzle ORM helpers

### 6. ✅ Error Handling
- [ ] Uses Sentry.captureException (not console.error)
- [ ] Provides user-friendly error messages
- [ ] No sensitive data in error messages

### 7. ✅ Testing
- [ ] Unit tests cover new procedures
- [ ] Multi-tenant isolation verified in tests
- [ ] Edge cases tested (empty arrays, null values, etc.)

---

## Code Review Checklist

When reviewing PRs with router changes:

### Critical Issues (Block merge)
- [ ] No `= ANY(${array})` pattern usage
- [ ] No unparameterized user input in SQL
- [ ] No string concatenation in queries
- [ ] All queries include tenant isolation

### High Priority (Request changes)
- [ ] Missing `inArray` import when array operations present
- [ ] Raw SQL without justification comment
- [ ] console.error instead of Sentry
- [ ] Missing input validation

### Medium Priority (Suggest improvements)
- [ ] Inconsistent pattern usage (e.g., sql.join() vs inArray())
- [ ] Missing test coverage
- [ ] Poor error messages

---

## Migration Guide: Fixing ANY() Bugs

If you find `= ANY(${array})` in existing code:

**Step 1: Add Import**
```typescript
import { and, eq, inArray, sql } from "drizzle-orm";
```

**Step 2: Replace Pattern**
```typescript
// BEFORE:
.where(sql`${table.id} = ANY(${ids})`)

// AFTER:
.where(inArray(table.id, ids))
```

**Step 3: Combine with Other Conditions**
```typescript
// BEFORE:
.where(sql`${table.tenantId} = ${tenantId} AND ${table.id} = ANY(${ids})`)

// AFTER:
.where(and(
  eq(table.tenantId, tenantId),
  inArray(table.id, ids)
))
```

**Step 4: Test**
- Run relevant unit tests
- Verify multi-tenant isolation still works
- Check query returns expected results

---

## Automated Verification

Run these commands before committing:

### 1. Search for Dangerous Patterns
```bash
# Find ANY() usage (should only be proposals.ts with ARRAY[] syntax)
grep -rn "= ANY(" app/server/routers/ --include="*.ts" --exclude="*.test.ts"

# Find raw SQL (review each for parameterization)
grep -rn "db\.execute" app/server/routers/ --include="*.ts"

# Find string concatenation (should be rare)
grep -rn "concat\|CONCAT" app/server/routers/ --include="*.ts"
```

### 2. Verify Test Coverage
```bash
# Run router tests
pnpm test __tests__/routers/

# Run performance tests
pnpm test __tests__/performance/
```

### 3. Type Check
```bash
pnpm typecheck
```

---

## Historical Context

### Audit History

**2025-01-24: Comprehensive SQL Audit**
- **Trigger:** 3 critical ANY() bugs found during Story 2.2 performance testing
- **Scope:** 42 routers, 25,255 lines of code
- **Result:** 0 critical issues remaining (all fixed)
- **Report:** `/docs/audits/2025-01-24-router-sql-audit.md`

**Bugs Fixed:**
1. timesheets.ts:691-695 (bulkReject)
2. pricingAdmin.ts:373 (bulk service update)
3. pricingAdmin.ts:642 (component lookup)

**Root Cause:** Same pattern from tasks.ts (Story 2.1) repeated in multiple files

---

## Exception Cases

### When ANY() with ARRAY[] is Acceptable

```typescript
// ✅ ACCEPTABLE - Explicit ARRAY[] syntax with type casting
.where(sql`${column} = ANY(ARRAY[${sql.join(
  values.map((v) => sql`${v}`),
  sql`, `
)}]::text[])`)
```

**Requirements:**
- Uses explicit `ARRAY[...]` constructor
- Includes PostgreSQL type casting `::text[]` or `::uuid[]`
- Documented reason why `inArray()` not used
- Tested with multiple values

**Example:** proposals.ts:202 (sales stage filtering)

---

## Resources

- **Drizzle ORM Docs:** https://orm.drizzle.team/docs/operators
- **PostgreSQL ANY() Docs:** https://www.postgresql.org/docs/current/functions-comparisons.html
- **SQL Injection Prevention:** OWASP SQL Injection Guide
- **Audit Report:** `/docs/audits/2025-01-24-router-sql-audit.md`

---

## Contact

**Questions or Issues?**
- See: `/docs/audits/2025-01-24-router-sql-audit.md` for detailed findings
- Consult: This checklist before committing router changes
- Report: New SQL patterns not covered here via issue tracker

---

**Status:** ✅ Active - Enforced on all router modifications
**Last Audit:** 2025-01-24 (CLEAN - 0 critical issues)
**Next Review:** Before beta release or after 6 months (whichever first)
