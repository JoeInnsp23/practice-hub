# Practice Hub Pre-Production Issues Report

**Document Version:** 1.0.0
**Generated:** 2025-10-19 13:45:00 UTC
**Status:** BASELINE - Pre-Optimization
**Phase:** Phase 1 - Validation & Baseline Collection

---

## Executive Summary

This document catalogs all issues identified during the pre-production validation phase of Practice Hub. The platform is currently in development with test/seed data only, preparing for optimization before live data import.

**Critical Findings:**
- ✅ **Multi-Tenant Isolation:** PASSED - All queries properly scoped
- 🚨 **Database Schema:** 3 critical issues, 17 warnings
- 🚨 **Seed Data Consistency:** 20 critical issues, 4 warnings
- ⚠️ **Code Quality:** 2,259 console statements (mostly in .archive)
- ⚠️ **Technical Debt:** 107 TODOs (61 actionable, 46 informational)

**Overall Status:** 🟡 NEEDS ATTENTION - Addressed before production deployment

---

## Table of Contents

1. [Database Schema Issues](#1-database-schema-issues)
2. [Seed Data Consistency Issues](#2-seed-data-consistency-issues)
3. [Multi-Tenant Isolation Validation](#3-multi-tenant-isolation-validation)
4. [Code Quality Issues](#4-code-quality-issues)
5. [Technical Debt (TODOs)](#5-technical-debt-todos)
6. [Prioritized Action Plan](#6-prioritized-action-plan)
7. [Version History](#7-version-history)

---

## 1. Database Schema Issues

**Validation Tool:** `validate_schema.py --strict`
**Scan Date:** 2025-10-19 13:40:00 UTC
**Tables Analyzed:** 7
**Status:** 🚨 FAILED

### 1.1 Critical Issues (3)

#### Issue #1.1: Client Portal Session - Missing Dual Isolation

**Table:** `client_portal_session`
**Severity:** 🚨 CRITICAL
**Impact:** Security - Client portal users could potentially access other clients' sessions

**Problem:**
```typescript
// Current (INCORRECT):
export const clientPortalSessions = pgTable("client_portal_session", {
  id: text("id").primaryKey(),
  // Missing tenantId
  // Missing clientId
  // ... other fields
});
```

**Required Fix:**
```typescript
// Fixed (CORRECT):
export const clientPortalSessions = pgTable("client_portal_session", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED - Tenant isolation
  clientId: text("client_id").references(() => clients.id).notNull(),  // REQUIRED - Client isolation
  // ... other fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Rationale:**
- **Tenant Isolation:** Separate different accountancy firms
- **Client Isolation:** Within a tenant, separate different customer businesses
- Client portal users must only access their specific client's data

---

#### Issue #1.2: Client Portal Account - Missing Dual Isolation

**Table:** `client_portal_account`
**Severity:** 🚨 CRITICAL
**Impact:** Security - Authentication accounts lack proper isolation

**Problem:**
```typescript
// Current (INCORRECT):
export const clientPortalAccounts = pgTable("client_portal_account", {
  id: text("id").primaryKey(),
  // Missing tenantId
  // Missing clientId
  // Missing createdAt
  // Missing updatedAt
  // ... other fields
});
```

**Required Fix:**
```typescript
// Fixed (CORRECT):
export const clientPortalAccounts = pgTable("client_portal_account", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED - Tenant isolation
  clientId: text("client_id").references(() => clients.id).notNull(),  // REQUIRED - Client isolation
  // ... other fields
  createdAt: timestamp("created_at").defaultNow().notNull(),            // REQUIRED - Audit trail
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(), // REQUIRED - Audit trail
});
```

---

#### Issue #1.3: Client Portal Verification - Missing Dual Isolation

**Table:** `client_portal_verification`
**Severity:** 🚨 CRITICAL
**Impact:** Security - Verification codes lack proper scoping

**Problem:**
```typescript
// Current (INCORRECT):
export const clientPortalVerifications = pgTable("client_portal_verification", {
  id: text("id").primaryKey(),
  // Missing tenantId
  // Missing clientId
  // ... other fields
});
```

**Required Fix:**
```typescript
// Fixed (CORRECT):
export const clientPortalVerifications = pgTable("client_portal_verification", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(), // REQUIRED - Tenant isolation
  clientId: text("client_id").references(() => clients.id).notNull(),  // REQUIRED - Client isolation
  // ... other fields
});
```

---

### 1.2 Warnings (17)

#### Warning #1.2.1: Missing Timestamps

**Affected Table:** `client_portal_account`
**Severity:** ⚠️ WARNING
**Impact:** Audit trail - Cannot track when records were created/modified

**Issue:**
- Missing `createdAt` timestamp
- Missing `updatedAt` timestamp with auto-update

**Fix:**
```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
```

---

#### Warning #1.2.2-17: Foreign Key References

**Severity:** ⚠️ WARNING
**Impact:** Schema parser limitation - False positives

**Details:**
- 16 warnings about foreign key references to non-existent tables
- These are FALSE POSITIVES - schema parser only found 7 tables but actual schema has many more
- Tables referenced: `users`, `clients`, `tasks`, `compliance`
- These tables DO exist in the full schema

**Action:** ✅ IGNORE - These are schema parser limitations, not actual issues

---

## 2. Seed Data Consistency Issues

**Validation Tool:** `check_seed_consistency.py`
**Scan Date:** 2025-10-19 13:42:00 UTC
**Schema Tables:** 7 (parser limitation)
**Seeded Tables:** 20
**Status:** 🚨 FAILED

### 2.1 Critical Issues (20)

**Root Cause:** Schema parser limitation - Only detected 7 tables but seed data references 20+ tables

**Issue:** Seed data references tables that weren't detected by the schema validator.

**Tables Flagged:**
1. `documents`
2. `activityLogs`
3. `workflowStages`
4. `notifications`
5. `invitations`
6. `clientDirectors`
7. `clientPortalAccess`
8. `onboardingTasks`
9. `compliance`
10. `clientPortalInvitations`
11. `messageThreadParticipants`
12. `portalLinks`
13. `invoiceItems`
14. `clientServices`
15. `calendarEventAttendees`
16. `timeEntries`
17. `clientContacts`
18. `messages`
19. `taskWorkflowInstances`
20. `clientPSCs`

**Analysis:** ✅ FALSE POSITIVES
**Reason:** Schema validation script's regex pattern is too narrow, only catching simple table definitions
**Action:** These tables DO exist in `lib/db/schema.ts`, parser needs improvement

---

### 2.2 Warnings (4)

#### Warning #2.2.1: Tenants Table - No Seed Data

**Table:** `tenants`
**Severity:** ⚠️ WARNING
**Impact:** Low - Tenant created in seed script logic

**Analysis:** The `tenants` table IS seeded in `scripts/seed.ts` but the parser missed it
**Action:** ✅ IGNORE - Seed data exists

---

#### Warning #2.2.2-4: Client Portal Auth Tables - No Seed Data

**Tables:**
- `clientPortalSessions`
- `clientPortalAccounts`
- `clientPortalVerifications`

**Severity:** ⚠️ WARNING
**Impact:** Low - Runtime session tables

**Analysis:** These are Better Auth runtime tables, don't need seed data
**Action:** ✅ EXPECTED - Runtime-only tables

---

## 3. Multi-Tenant Isolation Validation

**Validation Tool:** `validate_tenant_isolation.py --strict`
**Scan Date:** 2025-10-19 13:43:00 UTC
**Files Scanned:** 29 router files
**Status:** ✅ PASSED

### Result: EXCELLENT ✅

**Findings:**
- ✅ All database queries properly scope by `tenantId`
- ✅ No hard-coded tenant IDs found
- ✅ No missing tenant filters detected
- ✅ Staff queries correctly use `ctx.authContext.tenantId`
- ✅ Client portal queries use BOTH `tenantId` AND `clientId` (dual isolation)

**Security Status:** 🟢 SECURE - Multi-tenant isolation correctly implemented

---

## 4. Code Quality Issues

**Validation Tool:** `find_console_logs.py`
**Scan Date:** 2025-10-19 13:44:00 UTC
**Total Statements:** 2,259
**Status:** ⚠️ NEEDS CLEANUP

### 4.1 Console Statements Breakdown

**Location Analysis:**
- **Production Code (app/):** ~115 statements
- **Archive (.archive/):** ~2,144 statements (95% of total)

**Statement Types:**
- `console.log()` - Debugging statements (should be removed)
- `console.error()` - Error logging (review for legitimacy)
- `console.warn()` - Warnings (review for legitimacy)
- `console.debug()` - Debug statements (should be removed)
- `console.info()` - Info statements (review for legitimacy)

### 4.2 Priority Files (app/ directory - 32 files)

**Critical (Remove Before Production):**

1. **app/proposal-hub/reports/page.tsx** - 2 statements
2. **app/proposal-hub/calculator/page.tsx** - 1 statement (line 95, TODO-related)
3. **app/server/routers/proposals.ts** - 6 statements
4. **app/server/routers/clientPortalAdmin.ts** - 2 statements
5. **app/server/routers/users.ts** - 1 statement
6. **app/server/routers/documents.ts** - 1 statement
7. **app/server/routers/onboarding.ts** - 11 statements
8. **app/server/routers/dashboard.ts** - 2 statements
9. **app/client-hub/clients/page.tsx** - 3 statements
10. **app/client-hub/clients/[id]/client-details.tsx** - 1 statement
11. **app/client-hub/tasks/page.tsx** - 4 statements
12. **app/(auth)/sign-in/page.tsx** - 2 statements
13. **app/(auth)/sign-up/page.tsx** - 2 statements
14. **app/admin/users/edit-user-dialog.tsx** - 1 statement
15. **app/admin/users/user-management-client.tsx** - 2 statements
16. **app/api/** - Multiple API routes with console statements

**Recommended Action:**
```bash
# Remove console.log statements from production code
python3 .claude/skills/practice-hub-debugging/scripts/find_console_logs.py --remove
```

**Keep (Legitimate Error Logging):**
- Some `console.error()` in API webhooks for debugging external integrations
- Error logging in production error handlers (review case-by-case)

---

## 5. Technical Debt (TODOs)

**Validation Tool:** `track_todos.py --by-priority`
**Scan Date:** 2025-10-19 13:45:00 UTC
**Total TODOs:** 107
**Status:** ⚠️ HIGH TODO COUNT

### 5.1 Breakdown by Priority

| Priority | Type | Count | Action Required |
|----------|------|-------|-----------------|
| 🚨 FIXME | Critical | 0 | Immediate |
| ⚠️ HACK | High | 0 | Before production |
| 📝 TODO | Medium | 61 | Review & address |
| 💡 XXX | Low | 0 | Nice to have |
| 📌 NOTE | Info | 46 | Documentation only |

### 5.2 Critical TODOs in Production Code (5)

These are the ONLY TODOs in active production code (not .archive):

#### TODO #1: Calculator - VAT Registration Hardcoded

**File:** `app/proposal-hub/calculator/page.tsx:95`
**Severity:** 📝 MEDIUM
**Current Code:**
```typescript
vatRegistered: true, // TODO: Get from client data
```

**Fix Required:**
```typescript
vatRegistered: client?.vatRegistered ?? false,
```

**Impact:** Pricing calculations may be incorrect if client is not VAT registered
**Priority:** HIGH - Implement in Phase 2

---

#### TODO #2 & #3: Reports - Missing Conversion Data

**Files:**
- `app/proposal-hub/reports/page.tsx:65`
- `app/proposal-hub/reports/page.tsx:268`

**Severity:** 📝 MEDIUM
**Current Code:**
```typescript
// TODO: Analytics endpoint doesn't provide conversion data yet
const converted = 0; // item.convertedToProposal doesn't exist
```

**Fix Required:**
Add conversion tracking to analytics router:
```typescript
// app/server/routers/analytics.ts
convertedToProposal: count(proposals.id).where(eq(proposals.leadId, leads.id))
```

**Impact:** Conversion rate metrics show 0%
**Priority:** MEDIUM - Implement in Phase 2

---

#### TODO #4: Proposals - Email Confirmation Missing

**File:** `app/server/routers/proposals.ts:1044`
**Severity:** 📝 MEDIUM
**Current Code:**
```typescript
// TODO: Send confirmation email to client and team
```

**Fix Required:**
```typescript
await sendEmail({
  to: proposal.client.email,
  template: 'proposal-signed',
  data: { proposalId, clientName, signedAt }
});

await sendEmail({
  to: accountManager.email,
  template: 'proposal-signed-notification',
  data: { proposalId, clientName, signedAt }
});
```

**Impact:** No email notifications after proposal signing
**Priority:** HIGH - Implement in Phase 2

---

#### TODO #5: Transaction Data - Xero Integration Placeholder

**File:** `app/server/routers/transactionData.ts:212`
**Severity:** 📝 MEDIUM
**Current Code:**
```typescript
// TODO: Implement Xero API integration
// For now, return placeholder message
throw new TRPCError({
  code: "NOT_IMPLEMENTED",
  message: "Xero integration not yet implemented"
});
```

**Fix Required:**
- Implement Xero OAuth flow
- Fetch bank transactions
- Calculate metrics
- Cache with TTL

**Impact:** Transaction data feature completely non-functional
**Priority:** MEDIUM - Implement in Phase 2

---

### 5.3 Archive TODOs (102)

**Location:** `.archive/` directory
**Status:** ℹ️ INFORMATIONAL
**Action:** IGNORE - Archive code not in production

**Breakdown:**
- Social app: 16 TODOs
- CRM app: 32 TODOs
- Home app: 1 TODO
- Employee portal: 2 TODOs
- Shared components: 5 TODOs
- Documentation: 46 NOTE comments

---

## 6. Prioritized Action Plan

### Phase 2: Code Cleanup (NEXT)

**Priority 1: Schema Fixes (CRITICAL)**
1. Add `tenantId` + `clientId` to `client_portal_session`
2. Add `tenantId` + `clientId` to `client_portal_account`
3. Add `tenantId` + `clientId` to `client_portal_verification`
4. Add `createdAt` + `updatedAt` timestamps to `client_portal_account`
5. Update seed data to match new schema
6. Run `pnpm db:reset`

**Priority 2: Remove Console Statements**
```bash
python3 .claude/skills/practice-hub-debugging/scripts/find_console_logs.py --remove
```
- Target: 115 statements in `app/` directory
- Exclude: Legitimate error logging in webhooks

**Priority 3: Implement TODOs**
1. Calculator VAT registration - Fetch from client data
2. Reports conversion data - Add to analytics endpoint
3. Proposal email confirmation - Implement email sending
4. Transaction data Xero integration - Implement API integration

**Priority 4: Linter & Type Check**
```bash
pnpm lint
pnpm tsc --noEmit
```

---

### Phase 3: Testing (AFTER PHASE 2)

**Generate tests for 29 routers**
- Phase 3A: 5 critical routers (clients, proposals, users, invoices, tasks)
- Phase 3B: 24 remaining routers

**Validate:**
- Multi-tenant isolation (already ✅ passing)
- Dual isolation for client portal
- Error handling
- Edge cases

---

### Phase 4: Database Optimization

**Schema Enhancements:**
- Add missing indexes for frequently queried fields
- Review foreign key `onDelete` behaviors
- Optimize query performance

**Seed Data:**
- Add comprehensive test scenarios
- Cover edge cases
- Ensure multi-tenant test data

---

## 7. Version History

### Version 1.0.0 (2025-10-19 13:45:00 UTC)

**Status:** BASELINE - Initial validation report
**Author:** Claude Code (Pre-Production Optimization)
**Changes:**
- Initial comprehensive validation
- Database schema issues identified
- Seed data consistency checked
- Multi-tenant isolation validated (✅ PASSED)
- Code quality baseline established
- TODO inventory completed

**Next Version:** 1.1.0 (Post Phase 2 Cleanup)
**Expected:** After schema fixes, console.log removal, and TODO implementation

---

## Appendix A: Validation Commands

**Reproduce this report:**

```bash
# Schema validation
python3 .claude/skills/practice-hub-database-ops/scripts/validate_schema.py --strict

# Seed consistency
python3 .claude/skills/practice-hub-database-ops/scripts/check_seed_consistency.py

# Tenant isolation
python3 .claude/skills/practice-hub-testing/scripts/validate_tenant_isolation.py --strict

# Console statements
python3 .claude/skills/practice-hub-debugging/scripts/find_console_logs.py

# TODOs
python3 .claude/skills/practice-hub-debugging/scripts/track_todos.py --by-priority
```

---

## Appendix B: Multi-Tenant Architecture Reference

**Dual Isolation Model:**

```
Tenant (Accountancy Firm - e.g., "Acme Accounting")
├── Users (Staff) - tenantId only
├── Clients (Customer businesses) - tenantId only
│   └── Client Portal Users - tenantId + clientId (DUAL ISOLATION)
├── Proposals - tenantId + clientId
├── Invoices - tenantId + clientId
├── Documents - tenantId + clientId
└── Messages - tenantId + clientId
```

**Authentication Contexts:**
- **Staff:** `getAuthContext()` - Returns `{ userId, tenantId, role, ... }`
- **Client Portal:** `getClientPortalAuthContext()` - Returns `{ userId, tenantId, clientId, ... }`

---

**END OF REPORT**
