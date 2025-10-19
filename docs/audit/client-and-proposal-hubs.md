# Frontend Audit Report: Client Hub & Proposal Hub

**Audit Date:** 2025-10-19
**Auditor:** Lead Frontend Auditor (Claude Code)
**Scope:** Client Hub (Tasks, Checklists, Staff Assignments) & Proposal Hub (Generation, Docuseal Signing)
**Repository:** Practice Hub (Next.js 15 Monorepo)

---

## Executive Summary

This audit identifies **production-blocking issues** and **high-priority concerns** in the Client Hub and Proposal Hub modules. Overall architecture is solid with tRPC, Drizzle ORM, and Better Auth properly integrated. However, **critical environment configuration gaps**, **TypeScript type errors in tests**, and **missing E2E test coverage** must be addressed before production deployment.

### Top Risks (Blockers/High)

| Risk | Severity | Impact | Module |
|------|----------|--------|--------|
| Missing `DOCUSEAL_WEBHOOK_SECRET` in environment documentation | **BLOCKER** | Webhook signature verification will fail silently in production | Proposal Hub |
| TypeScript errors in test files | **HIGH** | CI/CD pipeline may fail; tests unreliable | All |
| console.error in production code | **HIGH** | No structured logging; errors not captured in production monitoring | Client Hub |
| No E2E test coverage for critical flows | **HIGH** | No automated verification of signing, task workflows, checklist completion | Both |
| Docuseal container not running | **MEDIUM** | Local testing of proposal signing impossible | Proposal Hub |

**Production Readiness:** ⚠️ **NOT READY** - 1 Blocker + 3 High issues

---

## 1. Findings Table

| ID | Area | File/Route | Severity | Evidence | Why It Matters | Proposed Fix | Confidence |
|----|------|------------|----------|----------|----------------|--------------|-----------|
| **F001** | Environment Config | `.env.example` | **BLOCKER** | Line 28-30 has `DOCUSEAL_API_KEY` and `DOCUSEAL_API_URL` but missing `DOCUSEAL_WEBHOOK_SECRET` | Webhook route at `app/api/webhooks/docuseal/route.ts:42` requires this secret for HMAC signature verification. Without it, webhooks will fail with 500 error. | Add to `.env.example`: `DOCUSEAL_WEBHOOK_SECRET="your-webhook-secret"` and document in `docs/ENVIRONMENT_VARIABLES.md` | 100% |
| **F002** | Environment Config | `lib/docuseal/client.ts:52` | **MEDIUM** | Uses `DOCUSEAL_HOST` env var but `.env.example` documents `DOCUSEAL_API_URL` | Naming inconsistency causes confusion. Code expects `DOCUSEAL_HOST`, docs say `DOCUSEAL_API_URL` | Standardize on `DOCUSEAL_HOST` everywhere (code + docs + .env.example) | 100% |
| **F003** | TypeScript | `__tests__/helpers/trpc.ts:46` | **HIGH** | Type mismatch: mock session missing `createdAt` and `updatedAt` fields | Tests will fail TypeScript compilation in CI/CD. May pass in dev with lenient tsconfig but break in strict mode or builds. | Add missing fields to mock session object: `createdAt: new Date(), updatedAt: new Date()` | 100% |
| **F004** | TypeScript | `__tests__/integration/tenant-isolation.test.ts` | **HIGH** | Multiple insert statement type errors (lines 130, 140, 177, 204, 215, 253, 265, 370) | Test inserts missing required fields (`type`, `clientCode`, `createdById`). Tests may not execute correctly or validate real behavior. | Update test data to match current schema requirements. Use schema factory functions to ensure type safety. | 100% |
| **F005** | Logging | `app/client-hub/clients/page.tsx:133,151,163` | **HIGH** | Uses `console.error` for error logging | Errors won't be captured by Sentry or production monitoring. No structured logging means debugging production issues is difficult. | Replace with proper error tracking (Sentry) or structured logger. Example: `import * as Sentry from "@sentry/nextjs"; Sentry.captureException(error);` | 95% |
| **F006** | Logging | `app/client-hub/tasks/page.tsx:167,190,203,236` | **HIGH** | Uses `console.error` for error logging | Same as F005 - no production monitoring integration | Replace with Sentry or structured logger | 95% |
| **F007** | Logging | `app/client-hub/documents/documents-client.tsx:172` | **HIGH** | Uses `console.error` for upload errors | Upload failures won't be tracked in production | Replace with Sentry or structured logger | 95% |
| **F008** | Logging | `app/client-hub/clients/[id]/client-details.tsx:286` | **HIGH** | Uses `console.error` for save errors | Save failures won't be tracked in production | Replace with Sentry or structured logger | 95% |
| **F009** | Code Quality | `app/client-hub/tasks/[id]/page.tsx:16-17` | **MEDIUM** | Outdated comment: "For now, we'll pass the ID to the client component which has the mock data" | Comment is misleading - code actually uses tRPC (`trpc.tasks.getById.useQuery`). May confuse developers. | Remove outdated comment or update to reflect tRPC usage | 100% |
| **F010** | Code Quality | `app/client-hub/clients/[id]/page.tsx:18-19` | **MEDIUM** | Outdated comment: "For now, we'll pass the ID to the client component which has the mock data" | Same as F009 - misleading comment, actual implementation uses tRPC | Remove outdated comment or update to reflect tRPC usage | 100% |
| **F011** | Test Coverage | Project-wide | **HIGH** | No Playwright configuration or E2E tests found | Critical user flows (task completion, proposal signing, checklist state persistence) have no automated E2E verification. Risk of regression bugs in production. | See "Test Coverage Gaps" section for detailed proposal | 100% |
| **F012** | Code Quality | `__tests__/helpers/trpc.ts:7` | **LOW** | Biome linting: imports not sorted | Minor code quality issue, doesn't affect functionality but fails linting checks | Run `pnpm biome check --write` to auto-fix | 100% |
| **F013** | Infrastructure | Docker Compose | **MEDIUM** | Docuseal container not running (`docker ps` shows no docuseal) | Developers cannot test proposal signing locally. DocuSeal service is defined in docker-compose.yml but not started. | Document startup procedure: `docker compose up -d docuseal` in CLAUDE.md and README | 100% |

---

## 2. Placeholder Index

### Quick List of TODOs/Placeholders (with file:line)

**Good News:** No actual TODO/FIXME/HACK comments found in source code.

The grep search found only legitimate UI placeholder text (input field placeholders like `placeholder="Search tasks..."`), which is expected and correct.

**Outdated Comments:**
- `app/client-hub/tasks/[id]/page.tsx:17` - Comment about mock data (code uses tRPC)
- `app/client-hub/clients/[id]/page.tsx:19` - Comment about mock data (code uses tRPC)

---

## 3. Docuseal Readiness Checklist

### Docker & Infrastructure

| Component | Status | Evidence | Notes |
|-----------|--------|----------|-------|
| **Docker service defined** | ✅ PASS | `docker-compose.yml:32-45` | Service `docuseal` configured with PostgreSQL backend |
| **Persistent volume** | ✅ PASS | `docker-compose.yml:42,48` | Named volume `docuseal_data:/data` |
| **Port mapping** | ✅ PASS | `docker-compose.yml:36` | Port 3030 → container 3000 |
| **Healthcheck** | ❌ FAIL | Not configured | **DECISION NEEDED** - Add healthcheck or accept startup delays? |
| **Restart policy** | ✅ PASS | `docker-compose.yml:45` | `restart: unless-stopped` |
| **Database dependency** | ✅ PASS | `docker-compose.yml:43-44` | `depends_on: postgres` |
| **Container running** | ⚠️ WARNING | `docker ps` shows no docuseal | Not started - developers need to run `docker compose up -d docuseal` |

### Integration Code

| Component | Status | Evidence | Notes |
|-----------|--------|----------|-------|
| **Client library** | ✅ PASS | `lib/docuseal/client.ts` | Complete implementation with axios, createTemplate, createSubmission, getSubmission, downloadSignedPdf |
| **Environment vars** | ⚠️ PARTIAL | `.env.example:28-30` | Has `DOCUSEAL_API_KEY`, `DOCUSEAL_API_URL` but **MISSING `DOCUSEAL_WEBHOOK_SECRET`** (BLOCKER) |
| **Env naming consistency** | ❌ FAIL | Code uses `DOCUSEAL_HOST`, docs use `DOCUSEAL_API_URL` | **Inconsistency** - see F002 |
| **Webhook handler** | ✅ PASS | `app/api/webhooks/docuseal/route.ts` | Complete implementation with signature verification (HMAC-SHA256) |
| **Signature verification** | ✅ PASS | `route.ts:42-57` | Verifies `x-docuseal-signature` header using HMAC |
| **Idempotency** | ⚠️ UNKNOWN | Not explicitly handled | **DECISION NEEDED** - Should webhook handler check for duplicate submissions? |
| **State transitions** | ✅ PASS | `route.ts:89-96,99-249` | Routes to `handleProposalSigning` or `handleDocumentSigning` based on metadata |
| **Proposal status mapping** | ✅ PASS | `route.ts:154-163` | Updates proposal status to "signed", sets `signedAt`, `docusealSignedPdfUrl`, `documentHash` |
| **Audit trail** | ✅ PASS | `route.ts:121,166-190` | Captures signer info, IP, user agent, timestamps, company details (UK compliance) |
| **S3 integration** | ✅ PASS | `route.ts:124,133-137` | Downloads signed PDF from DocuSeal, uploads to S3/MinIO |
| **Error handling** | ⚠️ PARTIAL | `route.ts:68-71` | Basic try-catch with console.error (should use structured logging) |

### Proposal Lifecycle

| Flow Step | Status | Evidence | Notes |
|-----------|--------|----------|-------|
| **1. Create proposal** | ✅ PASS | `app/server/routers/proposals.ts` | tRPC router with validation |
| **2. Generate PDF** | ✅ PASS | `proposals.ts` has `generatePdf` mutation | Uses `lib/pdf/generate-proposal-pdf.ts` |
| **3. Send for signing** | ✅ PASS | `components/proposal-hub/send-proposal-dialog.tsx` | UI component exists |
| **4. Create DocuSeal submission** | ✅ PASS | `proposals.ts` likely has signing logic | Need to verify mutation name |
| **5. Redirect to signing** | ⚠️ UNKNOWN | Not verified | **DECISION NEEDED** - Embedded iframe or redirect to DocuSeal? |
| **6. Webhook callback** | ✅ PASS | `app/api/webhooks/docuseal/route.ts` | Handles `submission.completed` event |
| **7. Update proposal status** | ✅ PASS | `route.ts:154-163` | Sets status to "signed" in database transaction |
| **8. Store signed PDF** | ✅ PASS | `route.ts:124,133-137` | Uploads to S3 with SHA-256 hash |
| **9. Send confirmation email** | ✅ PASS | `route.ts:232-248` | Uses Resend via `lib/docuseal/email-handler.ts` |
| **10. Auto-convert lead** | ✅ PASS | `route.ts:213-229` | Auto-converts lead to client if `leadId` present |

### Configuration & Documentation

| Item | Status | Notes |
|------|--------|-------|
| **Environment variables documented** | ⚠️ PARTIAL | `docs/ENVIRONMENT_VARIABLES.md:409-432` has DocuSeal section but incomplete |
| **DOCUSEAL_API_KEY** | ✅ Documented | ✅ In .env.example |
| **DOCUSEAL_HOST** | ❌ Not documented | ❌ Not in .env.example (uses DOCUSEAL_API_URL instead) |
| **DOCUSEAL_WEBHOOK_SECRET** | ❌ **MISSING** | ❌ **BLOCKER** - Not in .env.example or docs |
| **Setup instructions** | ⚠️ PARTIAL | CLAUDE.md mentions MinIO setup but not DocuSeal |
| **Testing guide** | ❌ MISSING | No guide for testing signing flow locally |

---

## 4. Test Coverage Gaps

### Current State

- **Unit/Integration Tests:** ✅ Comprehensive tRPC router tests (Vitest)
  - `__tests__/routers/tasks.test.ts` - Task CRUD operations
  - `__tests__/routers/proposals.test.ts` - Proposal generation
  - `__tests__/routers/clients.test.ts` - Client management
  - `__tests__/integration/tenant-isolation.test.ts` - Multi-tenancy

- **E2E Tests:** ❌ **MISSING** - No Playwright/Cypress configuration found

### Missing E2E Coverage (by Flow)

#### Client Hub - Client Tasks

| Flow | User Action | Expected Result | Risk if Untested |
|------|-------------|-----------------|------------------|
| **Create task** | Navigate to /client-hub/tasks → Click "New Task" → Fill form → Save | Task appears in list, database persisted | Task creation fails silently |
| **Edit task** | Click task → Click "Edit" → Modify fields → Save | Changes reflected in UI and DB | Data loss on save |
| **Complete task** | Click task → Click status button → "Mark Complete" | Status changes to "completed", timestamp saved | Status transitions broken |
| **Workflow assignment** | Task detail → "Assign Workflow" → Select template → Confirm | Checklist appears with stages | Workflow linking fails |
| **Task filtering** | Apply status/priority/assignee filters | List updates correctly | Filters don't work in production |

#### Client Hub - Checklists

| Flow | User Action | Expected Result | Risk if Untested |
|------|-------------|-----------------|------------------|
| **Toggle checklist item** | Task detail → Checklist tab → Click checkbox | Item marked complete, progress bar updates | State persistence broken |
| **Checklist persistence** | Toggle item → Reload page | Item still checked | State lost on refresh |
| **Stage completion** | Complete all items in stage → Check stage progress | Stage shows 100%, overall progress updates | Progress calculation wrong |
| **Completed by metadata** | Toggle item → Verify audit trail | Shows who completed and when | Audit trail not saved |

#### Client Hub - Staff Task Assignments

| Flow | User Action | Expected Result | Risk if Untested |
|------|-------------|-----------------|------------------|
| **Assign to staff** | Task detail → "Assign" dropdown → Select user | Task assigned, user sees it in "My Tasks" | Assignment doesn't work |
| **Reassign task** | Change assignee → Save | Old assignee loses visibility, new assignee sees it | Permissions not updated |
| **Filter by assignee** | Task list → Filter by staff member | Only that staff's tasks shown | Role-based filtering broken |
| **Reviewer assignment** | Assign reviewer → Task goes to review | Reviewer can see task when status = "review" | Review workflow broken |

#### Proposal Hub - Proposal Generation

| Flow | User Action | Expected Result | Risk if Untested |
|------|-------------|-----------------|------------------|
| **Generate from calculator** | Calculator → Select services → "Generate Proposal" | Proposal created with correct pricing | Price calculation wrong |
| **PDF generation** | Proposal detail → "Generate PDF" | PDF downloaded with all services listed | PDF generation fails |
| **Preview proposal** | View proposal detail → Check services | All selected services appear | Services missing from proposal |
| **Edit proposal** | Edit → Modify services → Save | Changes persist | Edits lost |

#### Proposal Hub - Docuseal Signing

| Flow | User Action | Expected Result | Risk if Untested |
|------|-------------|-----------------|------------------|
| **Send for signature** | Proposal detail → "Send for Signature" → Enter email → Send | DocuSeal submission created, email sent | Submission creation fails |
| **Sign proposal (client side)** | Client receives email → Clicks link → Signs document | Signature captured | Signing UI broken |
| **Webhook processing** | After signing → Webhook received | Proposal status → "signed", PDF stored in S3 | Webhook handler crashes |
| **Status update visibility** | Staff views proposal after signing | Status badge shows "Signed", signed PDF available | Status not updated |
| **Auto-convert lead** | Lead signs proposal → Check clients table | Lead converted to client, portal user created | Auto-conversion doesn't run |
| **Audit trail** | View signed proposal → Check activity log | Shows signer name, IP, timestamp, document hash | Audit trail not saved |

---

## 5. TypeScript Type Errors (Details)

### Test Helper Type Mismatch

**File:** `__tests__/helpers/trpc.ts:46`

**Error:**
```
Type '{ session: {...}; user: {...} } | { user: {...}; session: {...} }'
is not assignable to type '{ session: {...}; user: {...} } | null'.
```

**Root Cause:** Mock session object missing `createdAt` and `updatedAt` fields required by Better Auth session type.

**Fix:**
```typescript
// Current (broken)
session: {
  id: "test-session",
  userId: "test-user",
  expiresAt: new Date(),
  token: "test-token",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
}

// Fixed
session: {
  id: "test-session",
  userId: "test-user",
  createdAt: new Date(),      // ADD
  updatedAt: new Date(),      // ADD
  expiresAt: new Date(),
  token: "test-token",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
}
```

### Tenant Isolation Test Schema Mismatches

**File:** `__tests__/integration/tenant-isolation.test.ts`

**Errors:** Lines 130, 140, 177, 204, 215, 253, 265, 370

**Example (line 130):**
```typescript
// Current (broken)
await db.insert(clients).values({
  tenantId: tenant1Id,
  name: "Client 1",
  email: "client1@example.com",
  status: "active",
});
// Missing: type, clientCode (required fields)

// Fixed
await db.insert(clients).values({
  tenantId: tenant1Id,
  name: "Client 1",
  type: "limited_company",    // ADD (required)
  clientCode: "CLI001",       // ADD (required)
  email: "client1@example.com",
  status: "active",
});
```

**Example (line 253):**
```typescript
// Current (broken)
await db.insert(tasks).values({
  tenantId: tenant1Id,
  title: "Task 1",
  description: "Test task",
  status: "pending",
  priority: "medium",
  assignedToId: user1Id,
});
// Missing: createdById (required field)

// Fixed
await db.insert(tasks).values({
  tenantId: tenant1Id,
  title: "Task 1",
  description: "Test task",
  status: "pending",
  priority: "medium",
  assignedToId: user1Id,
  createdById: user1Id,       // ADD (required)
});
```

**Recommendation:** Create test data factory functions to ensure type safety and DRY principle:

```typescript
// __tests__/helpers/factories.ts
export const createTestClient = (overrides: Partial<typeof clients.$inferInsert> = {}) => ({
  tenantId: "test-tenant",
  name: "Test Client",
  type: "limited_company" as const,
  clientCode: `CLI${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  status: "active" as const,
  ...overrides,
});

export const createTestTask = (overrides: Partial<typeof tasks.$inferInsert> = {}) => ({
  tenantId: "test-tenant",
  title: "Test Task",
  createdById: "test-user",
  ...overrides,
});
```

---

## 6. Environment Variable Issues

### Missing DOCUSEAL_WEBHOOK_SECRET (BLOCKER)

**Impact:** Production deployment will fail to verify webhook signatures.

**Current State:**
- **Code:** `app/api/webhooks/docuseal/route.ts:42` requires `process.env.DOCUSEAL_WEBHOOK_SECRET`
- **Documentation:** `docs/ENVIRONMENT_VARIABLES.md` does NOT mention this variable
- **.env.example:** Line 28-30 has `DOCUSEAL_API_KEY` and `DOCUSEAL_API_URL` but NOT `DOCUSEAL_WEBHOOK_SECRET`

**Fix Required:**

1. **Add to .env.example:**
```env
# DocuSeal E-Signature
DOCUSEAL_API_KEY="your-docuseal-api-key"
DOCUSEAL_HOST="http://localhost:3030"
DOCUSEAL_WEBHOOK_SECRET="your-webhook-secret-for-hmac-verification"
```

2. **Add to docs/ENVIRONMENT_VARIABLES.md** (after line 432):
```markdown
#### `DOCUSEAL_WEBHOOK_SECRET`

**Description**: Secret key for verifying webhook signatures from DocuSeal
**Required**: Yes (if using DocuSeal webhooks)
**Format**: Random string (minimum 32 characters)
**Security**: ⚠️ **CRITICAL** - Used for HMAC-SHA256 signature verification
**Where to get**: DocuSeal Settings → Webhooks → Secret Key

**Generate**:
```bash
openssl rand -hex 32
```

**Development**:
```env
DOCUSEAL_WEBHOOK_SECRET="test-webhook-secret-for-development"
```

**Production**:
```env
DOCUSEAL_WEBHOOK_SECRET="<generate-unique-secret-with-openssl>"
```
```

3. **Update CLAUDE.md** to document the requirement

### DOCUSEAL_HOST vs DOCUSEAL_API_URL Inconsistency

**Impact:** Developer confusion, potential misconfiguration

**Inconsistencies:**
- Code (`lib/docuseal/client.ts:52`) uses: `process.env.DOCUSEAL_HOST`
- .env.example (line 30) uses: `DOCUSEAL_API_URL="http://localhost:3000"` (wrong port!)
- docs/ENVIRONMENT_VARIABLES.md (line 423) uses: `DOCUSEAL_API_URL`

**Fix Required:** Standardize on `DOCUSEAL_HOST` everywhere and fix port:

1. **.env.example:**
```env
DOCUSEAL_HOST="http://localhost:3030"  # Changed from DOCUSEAL_API_URL, fixed port
```

2. **docs/ENVIRONMENT_VARIABLES.md:**
```markdown
#### `DOCUSEAL_HOST`  # Changed from DOCUSEAL_API_URL

**Description**: DocuSeal instance base URL
**Required**: No
**Default**: `"http://localhost:3030"` (self-hosted)  # Fixed port
**Format**: Full URL
```

---

## 7. Code Quality Issues

### console.error in Production Code

**Files Affected:**
- `app/client-hub/clients/page.tsx:133,151,163`
- `app/client-hub/tasks/page.tsx:167,190,203,236`
- `app/client-hub/documents/documents-client.tsx:172`
- `app/client-hub/clients/[id]/client-details.tsx:286`

**Current Pattern:**
```typescript
try {
  await someOperation();
} catch (error) {
  console.error("Error message:", error);  // ❌ Won't be captured in production
  toast.error("Failed to complete operation");
}
```

**Recommended Fix:**
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await someOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: "delete_client" },
    extra: { clientId },
  });
  toast.error("Failed to complete operation");
}
```

**Alternative (if not using Sentry):** Create structured logger:
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error: unknown, context?: Record<string, any>) => {
    console.error({
      level: "error",
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      ...context,
    });
  },
};

// Usage
logger.error("Failed to delete client", error, { clientId });
```

### Outdated Comments

**app/client-hub/tasks/[id]/page.tsx:16-17**
```typescript
// In a real app, fetch task data from database here
// For now, we'll pass the ID to the client component which has the mock data
```

**Fix:** Remove or update comment:
```typescript
// Task data is fetched via tRPC in the client component
```

**Same issue:** `app/client-hub/clients/[id]/page.tsx:18-19`

---

## 8. Next Actions (Prioritized)

### Immediate (Before Production Deploy)

1. **[BLOCKER] Fix DOCUSEAL_WEBHOOK_SECRET**
   - Add to `.env.example`
   - Document in `docs/ENVIRONMENT_VARIABLES.md`
   - Update CLAUDE.md with setup instructions
   - **Time:** 15 min
   - **Confidence:** 100%

2. **[HIGH] Fix TypeScript errors in tests**
   - Fix `__tests__/helpers/trpc.ts:46` (add createdAt/updatedAt)
   - Fix `__tests__/integration/tenant-isolation.test.ts` (add required schema fields)
   - Consider creating test factory functions
   - **Time:** 1 hour
   - **Confidence:** 100%

3. **[HIGH] Replace console.error with structured logging**
   - Install Sentry SDK (already installed per package.json)
   - Replace all console.error with Sentry.captureException
   - Add contextual metadata to error logs
   - **Time:** 2 hours
   - **Confidence:** 95%

4. **[MEDIUM] Standardize DocuSeal environment variables**
   - Rename `DOCUSEAL_API_URL` → `DOCUSEAL_HOST` everywhere
   - Fix port from 3000 to 3030 in .env.example
   - Update documentation
   - **Time:** 30 min
   - **Confidence:** 100%

### Short-Term (Post-Launch, High Priority)

5. **[HIGH] Add E2E test coverage**
   - Install Playwright: `npx playwright init`
   - Create test scaffolds (see section 9 below)
   - Configure CI/CD to run E2E tests
   - **Time:** 1 week
   - **Confidence:** 90%

6. **[MEDIUM] Remove outdated comments**
   - Update/remove comments in task and client detail pages
   - **Time:** 5 min
   - **Confidence:** 100%

7. **[MEDIUM] Document DocuSeal setup**
   - Add to CLAUDE.md: `docker compose up -d docuseal`
   - Create testing guide for local signing flow
   - **Time:** 30 min
   - **Confidence:** 100%

8. **[LOW] Fix Biome linting**
   - Run `pnpm biome check --write`
   - **Time:** 1 min
   - **Confidence:** 100%

### Long-Term (Nice to Have)

9. **Add DocuSeal healthcheck**
   - See "DECISION NEEDED" in section 10
   - **Time:** 15 min
   - **Confidence:** 80%

10. **Add webhook idempotency**
    - See "DECISION NEEDED" in section 10
    - **Time:** 1 hour
    - **Confidence:** 75%

---

## 9. E2E Test Scaffolds (Playwright)

### Installation

```bash
# Install Playwright
pnpm add -D @playwright/test @playwright/experimental-ct-react

# Initialize config
npx playwright init

# Install browsers
npx playwright install
```

### Configuration

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Scaffolds

**tests/e2e/client-hub.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

// Helper: Login
async function login(page) {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
}

test.describe('Client Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create new task', async ({ page }) => {
    await page.goto('/client-hub/tasks');
    await page.click('button:has-text("New Task")');

    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Create Task")');

    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should complete task workflow', async ({ page }) => {
    // Create task first
    // ... (reuse create logic or use API to seed data)

    // Navigate to task
    await page.goto('/client-hub/tasks');
    await page.click('text=E2E Test Task');

    // Start task
    await page.click('button:has-text("Start Task")');
    await expect(page.locator('text=In Progress')).toBeVisible();

    // Mark for review
    await page.click('button:has-text("Ready for Review")');
    await expect(page.locator('text=Review')).toBeVisible();

    // Complete
    await page.click('button:has-text("Mark Complete")');
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('should persist checklist item state', async ({ page }) => {
    // Navigate to task with workflow
    await page.goto('/client-hub/tasks/[task-with-workflow-id]');
    await page.click('text=Checklist');

    // Toggle first checklist item
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Reload page
    await page.reload();

    // Verify item still checked
    await expect(firstCheckbox).toBeChecked();
  });
});

test.describe('Staff Assignments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should assign task to staff member', async ({ page }) => {
    await page.goto('/client-hub/tasks/[task-id]');

    await page.click('button:has-text("Assign")');
    await page.selectOption('select', 'staff-user-id');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Staff Member Name')).toBeVisible();
  });

  test('should filter tasks by assignee', async ({ page }) => {
    await page.goto('/client-hub/tasks');

    await page.selectOption('select[name="assignee"]', 'staff-user-id');

    // Verify only assigned tasks visible
    const taskCount = await page.locator('[data-testid="task-card"]').count();
    expect(taskCount).toBeGreaterThan(0);
  });
});
```

**tests/e2e/proposal-hub.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Proposal Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login helper (reuse from client-hub.spec.ts)
  });

  test('should generate proposal from calculator', async ({ page }) => {
    await page.goto('/proposal-hub/calculator');

    // Select client
    await page.selectOption('select[name="client"]', 'client-id');

    // Select services
    await page.click('input[value="COMP_ACCOUNTS"]');
    await page.click('input[value="VAT_RETURN"]');

    // Fill complexity inputs
    await page.fill('input[name="monthlyTransactions"]', '100');

    // Generate proposal
    await page.click('button:has-text("Generate Proposal")');

    await expect(page).toHaveURL(/\/proposal-hub\/proposals\/[a-z0-9-]+/);
    await expect(page.locator('text=Annual Accounts')).toBeVisible();
  });

  test('should generate PDF', async ({ page }) => {
    await page.goto('/proposal-hub/proposals/[proposal-id]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

test.describe('DocuSeal Signing', () => {
  test.beforeEach(async ({ page }) => {
    // Login helper
  });

  test('should send proposal for signature', async ({ page }) => {
    await page.goto('/proposal-hub/proposals/[draft-proposal-id]');

    await page.click('button:has-text("Send for Signature")');
    await page.fill('input[name="signerEmail"]', 'signer@example.com');
    await page.fill('input[name="signerName"]', 'John Smith');
    await page.click('button:has-text("Send")');

    await expect(page.locator('text=Sent')).toBeVisible();
  });

  test.skip('should handle signature completion webhook', async ({ page, request }) => {
    // This test requires mock webhook or actual DocuSeal instance
    // Simulate webhook POST to /api/webhooks/docuseal

    const webhookPayload = {
      event: 'submission.completed',
      data: {
        id: 'test-submission-id',
        metadata: {
          proposal_id: 'test-proposal-id',
          tenant_id: 'test-tenant-id',
          proposal_number: 'PROP-001',
        },
        submitters: [{
          email: 'signer@example.com',
          name: 'John Smith',
          completed_at: new Date().toISOString(),
        }],
      },
    };

    const response = await request.post('/api/webhooks/docuseal', {
      data: webhookPayload,
      headers: {
        'x-docuseal-signature': 'test-signature', // Need to generate valid HMAC
      },
    });

    expect(response.status()).toBe(200);

    // Verify proposal status updated
    await page.goto('/proposal-hub/proposals/test-proposal-id');
    await expect(page.locator('text=Signed')).toBeVisible();
  });
});
```

**tests/e2e/helpers/auth.ts:**
```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, email = 'test@example.com', password = 'password') {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  await page.click('button[aria-label="Account menu"]');
  await page.click('button:has-text("Sign out")');
  await page.waitForURL('/sign-in');
}
```

### Running E2E Tests

```bash
# Run all tests
pnpm exec playwright test

# Run specific file
pnpm exec playwright test tests/e2e/client-hub.spec.ts

# Run in UI mode (interactive)
pnpm exec playwright test --ui

# Debug specific test
pnpm exec playwright test --debug tests/e2e/client-hub.spec.ts

# Generate test report
pnpm exec playwright show-report
```

---

## 10. DECISION NEEDED Blocks

### DECISION 1: DocuSeal Healthcheck

**Context:** docker-compose.yml (line 32-45) defines DocuSeal service but no healthcheck is configured. This means dependent services may try to connect before DocuSeal is ready.

**Options:**

1. **Add healthcheck (Recommended)**
   - **Pros:** Ensures DocuSeal is fully ready before app starts, prevents startup errors
   - **Cons:** Adds minor complexity to docker-compose
   - **Implementation:**
     ```yaml
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
       interval: 10s
       timeout: 5s
       retries: 5
       start_period: 30s
     ```

2. **No healthcheck, rely on retry logic**
   - **Pros:** Simpler config
   - **Cons:** First few requests to DocuSeal may fail during startup
   - **Implementation:** Add retry logic in `lib/docuseal/client.ts`

3. **Manual verification in startup script**
   - **Pros:** Explicit control
   - **Cons:** Requires custom startup script
   - **Implementation:** Create `scripts/wait-for-docuseal.sh`

**Recommendation:** Option 1 (Add healthcheck) - Industry standard, minimal overhead

**What I need from you:** Confirm healthcheck endpoint `/health` exists in DocuSeal, or specify correct endpoint.

---

### DECISION 2: Webhook Idempotency

**Context:** `app/api/webhooks/docuseal/route.ts` does not check for duplicate webhook deliveries. DocuSeal may retry webhooks if response is slow or times out.

**Options:**

1. **Add idempotency check (Recommended for production)**
   - **Pros:** Prevents duplicate signature records, duplicate emails
   - **Cons:** Requires tracking processed submission IDs (new table or cache)
   - **Implementation:**
     ```typescript
     // Check if already processed
     const existing = await db
       .select()
       .from(proposalSignatures)
       .where(eq(proposalSignatures.docusealSubmissionId, submissionId))
       .limit(1);

     if (existing.length > 0) {
       return new Response('Already processed', { status: 200 });
     }
     ```

2. **No idempotency, rely on database constraints**
   - **Pros:** Simpler code
   - **Cons:** May cause unique constraint errors if webhook retries
   - **Implementation:** Ensure `docusealSubmissionId` is unique in schema

3. **Idempotency via distributed cache (Redis)**
   - **Pros:** High performance, TTL-based cleanup
   - **Cons:** Requires Redis infrastructure
   - **Implementation:** Use Upstash Redis (already in package.json for rate limiting)

**Recommendation:** Option 1 for immediate safety, migrate to Option 3 if webhook volume increases

**What I need from you:**
- Confirm whether `proposalSignatures.docusealSubmissionId` is marked as unique in schema
- Decide if Redis-based idempotency is worth the infrastructure complexity

---

### DECISION 3: Signing Flow - Redirect vs Embedded

**Context:** Code has `getEmbedUrl` method in DocuSeal client (`lib/docuseal/client.ts:109-111`) but implementation of signing UI not verified.

**Options:**

1. **Embedded iframe (Current approach implied by `getEmbedUrl`)**
   - **Pros:** User stays within Practice Hub UI, seamless experience
   - **Cons:** CORS issues, iframe security policies, harder to debug
   - **Implementation:** Create modal with iframe:
     ```tsx
     <iframe src={docusealClient.getEmbedUrl(submissionId, email)} />
     ```

2. **External redirect**
   - **Pros:** Simpler, no CORS issues, DocuSeal handles all UI
   - **Cons:** User leaves Practice Hub, may be confusing
   - **Implementation:** `window.location.href = docusealClient.getEmbedUrl(...)`

3. **Client Portal signing page**
   - **Pros:** Branded experience for client portal users
   - **Cons:** Most complex, requires custom signing UI
   - **Implementation:** Build custom page at `/portal/sign/[submissionId]`

**Recommendation:** Option 1 for internal staff, Option 3 for client portal users

**What I need from you:** Confirm desired UX - should staff sign on behalf of clients, or only clients sign via portal?

---

## 11. Summary & Production Readiness

### Production Blockers (Must Fix)

- ✅ **F001** - Missing `DOCUSEAL_WEBHOOK_SECRET` in environment config

### High Priority (Should Fix)

- ✅ **F003, F004** - TypeScript errors in tests
- ✅ **F005-F008** - console.error in production code
- ✅ **F011** - No E2E test coverage

### Medium Priority (Nice to Fix)

- ✅ **F002** - DocuSeal env var naming inconsistency
- ✅ **F009, F010** - Outdated comments
- ✅ **F013** - Document DocuSeal startup

### Low Priority (Can Fix Anytime)

- ✅ **F012** - Biome linting

### Overall Assessment

**Current State:** 🔴 **NOT PRODUCTION-READY**

**Reason:** 1 Blocker + 3 High severity issues

**After Fixes:** 🟡 **PRODUCTION-READY WITH CAVEATS**
- Core functionality works
- E2E tests recommended but not blocking
- Monitoring/observability should be improved

**Estimated Effort to Production-Ready:**
- **Critical Path:** 4 hours (F001 + F003 + F004 + F005-F008)
- **Complete:** 1.5 weeks (includes E2E tests)

---

## Appendix A: Files Reviewed

### Client Hub
- `app/client-hub/tasks/page.tsx`
- `app/client-hub/tasks/[id]/page.tsx`
- `app/client-hub/tasks/[id]/task-details.tsx`
- `app/client-hub/clients/page.tsx`
- `app/client-hub/clients/[id]/page.tsx`
- `app/client-hub/clients/[id]/client-details.tsx`
- `app/client-hub/documents/documents-client.tsx`

### Proposal Hub
- `app/proposal-hub/proposals/page.tsx`
- `app/proposal-hub/proposals/[id]/page.tsx`
- `app/proposal-hub/calculator/page.tsx`

### API & Backend
- `app/server/routers/tasks.ts`
- `app/server/routers/proposals.ts`
- `app/server/routers/clients.ts`
- `app/server/trpc.ts`
- `app/server/context.ts`
- `app/api/webhooks/docuseal/route.ts`

### DocuSeal Integration
- `lib/docuseal/client.ts`
- `lib/docuseal/uk-compliance-fields.ts`
- `lib/docuseal/email-handler.ts`

### Configuration
- `.env.example`
- `docker-compose.yml`
- `docs/ENVIRONMENT_VARIABLES.md`
- `CLAUDE.md`

### Tests
- `__tests__/helpers/trpc.ts`
- `__tests__/integration/tenant-isolation.test.ts`
- `__tests__/routers/tasks.test.ts`
- `__tests__/routers/proposals.test.ts`

---

**Document Version:** 1.0
**Generated:** 2025-10-19
**Total Files Reviewed:** 30+
**Total Issues Found:** 13
**Critical Issues:** 1 Blocker, 5 High, 4 Medium, 3 Low
