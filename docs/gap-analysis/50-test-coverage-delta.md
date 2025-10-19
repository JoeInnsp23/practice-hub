# Test Coverage Delta Analysis

**Assessment Date:** 2025-10-19
**Current Test Framework:** Vitest with React Testing Library
**Test Directory:** `__tests__/`
**Playwright:** Not present (optional)

---

## Summary

Current codebase has **30+ test suites** with good coverage of:
- ✅ Task CRUD operations
- ✅ Bulk operations
- ✅ Proposal CRUD and versioning
- ✅ Multi-tenancy isolation

**Critical Gaps:**
- ❌ Docuseal webhook integration tests (0%)
- ❌ Webhook idempotency tests (0%)
- ❌ Event handler tests (declined/expired)
- ❌ Rate limiting tests
- ❌ E2E/Playwright regression tests (0%)

---

## Detailed Coverage Map

### Client Hub

#### Tasks

| Feature | Test File | Current Coverage | Legacy Equivalent | Gap | Effort |
|---------|-----------|------------------|-------------------|-----|--------|
| Task CRUD (create) | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskDetail.test.tsx | None | N/A |
| Task CRUD (update) | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskDetail.test.tsx | None | N/A |
| Task CRUD (delete) | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskDetail.test.tsx | None | N/A |
| Task Status Update | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskDetail.test.tsx | None | N/A |
| Bulk Status Update | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskBulkActions.test.tsx | None | N/A |
| Bulk Assign | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskBulkActions.test.tsx | None | N/A |
| Bulk Delete | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskBulkActions.test.tsx | None | N/A |
| Workflow Assignment | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskChecklistTab.test.tsx | None | N/A |
| Checklist Item Toggle | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskChecklistTab.test.tsx | None | N/A |
| Progress Calculation | `__tests__/routers/tasks.test.ts` | ⚠️ Partial | TaskChecklistTab.test.tsx | Edge cases: large checklist performance | M |
| Permissions (assignee) | `__tests__/routers/tasks.test.ts` | ✅ Covered | TaskDetail.test.tsx | None | N/A |
| Activity Logging | `__tests__/routers/tasks.test.ts` | ✅ Covered | Activity tests | None | N/A |

#### Missing Task Tests

- [ ] **Subtask Hierarchy**: Create task → parent task → verify parentTaskId linkage → delete parent → orphan handling
- [ ] **Recurring Tasks**: Create recurring task → verify recurrence logic → update pattern → verify cascade
- [ ] **Due Date Validation**: Invalid dates, past dates, boundary cases
- [ ] **Task State Transitions**: Invalid transitions (e.g., blocked → completed without review), verify rollback
- [ ] **Concurrent Updates**: Two users update same task simultaneously → last-write-wins or conflict
- [ ] **Large Checklist Performance**: 1000+ checklist items → progress calculation time

**Estimated effort for missing tests:** M (6–10 hours)

---

### Proposal Hub

#### Proposals

| Feature | Test File | Current Coverage | Legacy Equivalent | Gap | Effort |
|---------|-----------|------------------|-------------------|-----|--------|
| Proposal CRUD (create) | `__tests__/routers/proposals.test.ts` | ✅ Covered | Proposals.test.tsx | None | N/A |
| Proposal CRUD (update) | `__tests__/routers/proposals.test.ts` | ✅ Covered | Proposals.test.tsx | None | N/A |
| Proposal CRUD (delete) | `__tests__/routers/proposals.test.ts` | ✅ Covered | Proposals.test.tsx | None | N/A |
| Proposal Versioning | `__tests__/routers/proposals.test.ts` | ⚠️ Partial | Proposals.test.tsx | Version restore not tested | M |
| PDF Generation | `__tests__/routers/proposals.test.ts` | ✅ Covered | PDF generation tests | None | N/A |
| Proposal Filtering | `__tests__/routers/proposals.test.ts` | ✅ Covered | Proposals.test.tsx | None | N/A |

#### Missing Proposal Tests

- [ ] **Proposal Status Transitions**: Valid/invalid transitions, verify state machine
- [ ] **Line Items**: Add/remove/update items, price calculations, tax, totals
- [ ] **Valid Until Expiry**: Proposal validUntil date validation, expiry checks
- [ ] **Lead to Client Conversion**: Create proposal from lead → auto-convert lead to client on signature
- [ ] **Proposal Clone/Duplicate**: Duplicate proposal → new ID, services copied, version = 1

**Estimated effort:** M (4–8 hours)

---

#### Docuseal E-Signature ⚠️ CRITICAL GAPS

| Scenario | Test Coverage | Status | Gap | Effort |
|----------|---------------|--------|-----|--------|
| Send for signature | ❌ Not tested | 0% | No test for: template creation, submission creation, email sent | M |
| Webhook received | ❌ Not tested | 0% | **CRITICAL** – No webhook handler tests | M |
| Webhook idempotency | ❌ Not tested | 0% | **BLOCKER** – No test for duplicate webhooks | S |
| Webhook declined event | ❌ Not tested | 0% | **HIGH** – No handler for declined → rejected | M |
| Webhook expired event | ❌ Not tested | 0% | **HIGH** – No handler for expired → expired | M |
| Double-signing | ⚠️ Partial | ~30% | UI prevents, but no backend test for concurrent requests | S |
| Signature audit trail | ❌ Not tested | 0% | No test for UK compliance fields capture | M |
| Webhook rate limit | ❌ Not tested | 0% | No rate limit tests | S |
| Webhook replay protection | ❌ Not tested | 0% | No timestamp validation tests | S |
| Public signing endpoint | ⚠️ Partial | ~50% | Expiry check tested, but not full flow (submit signature) | S |

**Total Missing Docuseal Tests:** 10 scenarios
**Estimated effort:** L (12–20 hours including all scenarios)

---

### Multi-Tenancy

| Feature | Test File | Coverage | Gap |
|---------|-----------|----------|-----|
| Tenant Isolation | `__tests__/integration/tenant-isolation.test.ts` | ✅ Comprehensive | None |
| Client Isolation | `__tests__/integration/tenant-isolation.test.ts` | ✅ Good | Edge case: client can't access other client's data in same tenant (verify fully) |
| Permission Enforcement | `__tests__/integration/tenant-isolation.test.ts` | ✅ Good | None |

---

## Test File Inventory

| File | Line Count | Routers Covered | Status |
|------|-----------|-----------------|--------|
| `__tests__/routers/tasks.test.ts` | ~300 | tasks | ✅ |
| `__tests__/routers/proposals.test.ts` | ~300 | proposals | ⚠️ Partial (missing webhook) |
| `__tests__/routers/documents.test.ts` | ~200 | documents | ✅ |
| `__tests__/routers/leads.test.ts` | ~200 | leads | ✅ |
| `__tests__/routers/clients.test.ts` | ~150 | clients | ✅ |
| `__tests__/routers/invoices.test.ts` | ~200 | invoices | ✅ |
| `__tests__/routers/workflows.test.ts` | ~150 | workflows | ✅ |
| `__tests__/routers/users.test.ts` | ~100 | users | ✅ |
| `__tests__/routers/services.test.ts` | ~100 | services | ✅ |
| `__tests__/routers/timesheets.test.ts` | ~150 | timesheets | ✅ |
| `__tests__/integration/tenant-isolation.test.ts` | ~500 | all routers | ✅ Comprehensive |
| ... | | 20+ routers | ✅ Most covered |
| **API Route Tests** | | | |
| `__tests__/api/webhooks/docuseal.test.ts` | ❌ NOT FOUND | webhook handler | ❌ Missing |

---

## Recommended Test Additions

### Phase 1: Critical (Blocker)

#### Docuseal Webhook Tests

**File:** `__tests__/api/webhooks/docuseal.test.ts` (NEW)

```typescript
import { POST } from "@/app/api/webhooks/docuseal/route";
import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";

describe("Docuseal Webhook Handler", () => {
  const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET || "test-secret";

  const createSignature = (payload: string) => {
    return crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");
  };

  describe("Idempotency", () => {
    it("should process webhook once and cache on retry", async () => {
      // Test payload
      const payload = JSON.stringify({
        submission: {
          id: "test-submission-1",
          status: "completed",
          metadata: { proposal_id: "prop-1", tenant_id: "tenant-1" },
        },
      });

      const signature = createSignature(payload);

      // First call
      const request1 = createWebhookRequest(payload, signature);
      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // Second call (duplicate) - should return cached
      const request2 = createWebhookRequest(payload, signature);
      const response2 = await POST(request2);
      expect(response2.status).toBe(200);
      expect(await response2.json()).toEqual({ ok: true, cached: true });
    });
  });

  describe("Event Handling", () => {
    it("should handle 'completed' event and update proposal to signed", async () => {
      // Test implementation
    });

    it("should handle 'declined' event and update proposal to rejected", async () => {
      // Test implementation
    });

    it("should handle 'expired' event and update proposal to expired", async () => {
      // Test implementation
    });
  });

  describe("Signature Verification", () => {
    it("should reject request with invalid signature", async () => {
      const payload = JSON.stringify({ submission: { id: "test" } });
      const invalidSignature = "invalid";

      const request = createWebhookRequest(payload, invalidSignature);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should reject request with missing signature", async () => {
      const payload = JSON.stringify({ submission: { id: "test" } });

      const request = createWebhookRequest(payload, undefined);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Rate Limiting", () => {
    it("should reject requests exceeding rate limit", async () => {
      // Test with 11+ requests in 1 second
    });
  });
});
```

**Test Scenarios:**
1. ✅ Webhook received and processed
2. ✅ Webhook received twice (idempotency) – 2nd is cached
3. ✅ Signature verification fails → 401
4. ✅ Missing signature → 401
5. ✅ Declined event → proposal.status = "rejected"
6. ✅ Expired event → proposal.status = "expired"
7. ✅ Activity log created for each event
8. ✅ Rate limit enforced
9. ✅ Database transaction rolls back on error
10. ✅ Email sent (or failed gracefully)

**Estimated effort:** M (6–10 hours)

---

#### E2E / Playwright Tests (Optional but Recommended)

**File:** `tests/e2e/regression/proposal-signing.spec.ts` (NEW)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Proposal Signing E2E", () => {
  test("Full signing workflow", async ({ browser, page }) => {
    // 1. Create proposal
    await page.goto("/proposal-hub/proposals/new");
    // ... fill form

    // 2. Send for signature
    await page.click("text=Send for Signature");
    // ... enter signer email

    // 3. User receives email link
    // (mock or use email service)

    // 4. Signer opens link
    const signingPage = await browser.newPage();
    await signingPage.goto(signingLink);

    // 5. Verify proposal displays
    await expect(signingPage.locator("text=Sign Proposal")).toBeVisible();

    // 6. Sign (mock DocuSeal iframe interaction)
    // ... complex iframe interactions

    // 7. Verify signature recorded
    // 8. Verify proposal status = "signed"
    // 9. Verify emails sent to team
  });

  test("Expired proposal can't be signed", async ({ page }) => {
    // 1. Create proposal with validUntil = yesterday
    // 2. Try to open signing link
    // 3. Expect: "Proposal expired" error
  });

  test("Double-signing prevented", async ({ page }) => {
    // 1. Sign proposal
    // 2. Try to sign again
    // 3. Expect: "Already signed" error
  });
});
```

**Scenarios to cover:**
- ✅ Create proposal → send for signature → receive link → sign → receive webhook → proposal marked signed
- ✅ Declined signature → proposal marked rejected
- ✅ Expired link → can't sign
- ✅ Double-sign attempt → error
- ✅ Public signing page (unauthenticated)
- ✅ Client portal signing page (authenticated)

**Estimated effort:** L (8–12 hours for full coverage)

---

### Phase 2: High-Priority (Production Quality)

#### Task Tests

**File:** `__tests__/routers/tasks.edge-cases.test.ts` (NEW)

```typescript
describe("Task Edge Cases", () => {
  it("should handle large checklist (1000+ items) efficiently", async () => {
    // Create task with 1000+ checklist items
    // Measure progress calculation time
    // Expect < 500ms
  });

  it("should prevent invalid status transitions", async () => {
    // Task in "review" status
    // Try to update to "pending" (not allowed)
    // Expect: validation error
  });

  it("should handle concurrent updates", async () => {
    // User A updates task
    // User B updates same task simultaneously
    // Verify: last-write-wins or conflict resolution
  });

  it("should validate due dates", async () => {
    // Try to set due date in past
    // Expect: validation error
    // Set valid future date
    // Expect: success
  });

  it("should handle subtask hierarchy", async () => {
    // Create parent task
    // Create child task (parentTaskId = parent)
    // Delete parent
    // Verify: orphan handling (cascade or error)
  });
});
```

**Estimated effort:** M (4–6 hours)

---

#### Proposal Tests

**File:** `__tests__/routers/proposals.edge-cases.test.ts` (NEW)

```typescript
describe("Proposal Edge Cases", () => {
  it("should prevent negative pricing", async () => {
    // Try to create proposal with negative line item price
    // Expect: validation error
  });

  it("should require at least one service", async () => {
    // Try to create proposal with no services
    // Expect: validation error
  });

  it("should auto-convert lead to client on signature", async () => {
    // Create proposal from lead (leadId set)
    // Send for signature
    // Webhook → signature recorded
    // Verify: lead status changes to "converted" or "client"
  });

  it("should calculate totals correctly with tax", async () => {
    // Create proposal with multiple line items
    // Verify: subtotal, tax (if applicable), total are correct
  });

  it("should handle version restore", async () => {
    // Create proposal (v1)
    // Update proposal (v2)
    // Update again (v3)
    // Restore to v1
    // Verify: proposal matches v1 state
  });
});
```

**Estimated effort:** M (4–6 hours)

---

### Phase 3: Optional Enhancements

#### Rate Limiting Tests

**File:** `__tests__/middleware/rate-limit.test.ts` (NEW)

```typescript
describe("Rate Limiting", () => {
  it("should limit webhook requests", async () => {
    // Send 11 requests in 1 second
    // Expect: 10 succeed, 11th returns 429
  });

  it("should limit signing endpoints", async () => {
    // Send 5+ signature submissions in 10 seconds per user
    // Expect: rate limit enforcement
  });
});
```

**Estimated effort:** S (2–3 hours)

---

## Test Execution Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test tasks.test.ts

# Run with coverage
pnpm test --coverage

# Run E2E tests (if Playwright added)
pnpm exec playwright test

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test --headed
```

---

## Coverage Goals

| Module | Current Coverage | Target | Gap |
|--------|-----------------|--------|-----|
| Task CRUD | 90% | 95% | Unit tests for edge cases |
| Task Bulk Ops | 85% | 95% | Permission edge cases |
| Proposal CRUD | 85% | 95% | Versioning restore, state transitions |
| Docuseal Webhook | 0% | 100% | All scenarios (critical) |
| Multi-Tenancy | 90% | 100% | Fine-grained permission checks |
| **Overall** | **~65%** | **~90%** | Phase 1–2 fixes |

---

## Recommended Test Implementation Timeline

### Week 1: Critical (Blocker)
- Docuseal webhook tests (DOC-1–3)
- Idempotency tests
- Event handler tests (declined/expired)
- **Effort:** 12–16 hours

### Week 2: Quality Assurance
- Task edge cases
- Proposal edge cases
- Rate limiting tests
- **Effort:** 8–12 hours

### Week 3: E2E Coverage (Optional)
- Playwright regression suites
- End-to-end workflow tests
- **Effort:** 10–16 hours

---

## Summary

✅ **Current test coverage is good for happy paths.**

❌ **Critical gap: Docuseal webhook (0% coverage)**

⚠️ **Missing edge case and E2E tests.**

**Recommendation:**
1. Prioritize Phase 1 (Docuseal tests) – required before production
2. Add Phase 2 (edge cases) for robustness
3. Phase 3 (E2E/Playwright) for regression prevention

---

**Report Generated:** 2025-10-19
