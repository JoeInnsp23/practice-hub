# Feature-Parity Gap Audit: Executive Summary

**Audit Date:** 2025-10-19
**Current App:** Next.js 15 (App Router) with tRPC + Drizzle
**Legacy App:** React + React Router with Supabase (`.archive/`)
**Overall Status:** ✅ FEATURE-COMPLETE but ⚠️ CRITICAL OPERATIONAL GAPS

---

## Key Finding

The current codebase **has implemented ALL legacy features** (Client Hub tasks, checklists, proposals, e-signature) but **contains 4 critical operational gaps** that will cause production issues.

---

## Critical Gaps (BLOCKER)

### 1. **Docuseal Webhook Idempotency Missing**
- **Severity:** BLOCKER
- **File:** `app/api/webhooks/docuseal/route.ts:74–97`
- **Issue:** If DocuSeal retries webhook (network timeout, temporary failure), database constraint violation crashes the handler. Proposal gets stuck in "sent" status.
- **Impact:** Every webhook retry = database error → proposal state corruption
- **Effort:** S (2–4 hours)
- **Link:** [40-docuseal-readiness.md#idempotency-protection](40-docuseal-readiness.md#idempotency-protection)

### 2. **Logging Policy Violations (Sentry Not Used)**
- **Severity:** BLOCKER
- **File:** `app/api/webhooks/docuseal/route.ts` (10 violations)
- **Issue:** Uses `console.error()` instead of `Sentry.captureException()`, violating CLAUDE.md rule.
- **Impact:** Production errors invisible to operations team; no structured error monitoring.
- **Effort:** S (1–2 hours)
- **Link:** [40-docuseal-readiness.md#console-error--logging-violations](40-docuseal-readiness.md#console-error--logging-violations)

### 3. **Missing Event Handlers (Declined / Expired)**
- **Severity:** HIGH
- **File:** `app/api/webhooks/docuseal/route.ts:63–65`
- **Issue:** Only handles "submission.completed"; missing handlers for "submission.declined" and "submission.expired".
- **Impact:** Rejected or expired proposals never transition to "rejected" or "expired" status in database.
- **Effort:** M (3–6 hours with testing)
- **Link:** [40-docuseal-readiness.md#event-handling](40-docuseal-readiness.md#event-handling)

### 4. **No Webhook Rate Limiting**
- **Severity:** HIGH
- **File:** `app/api/webhooks/docuseal/route.ts` (all)
- **Issue:** No rate limit or DDoS protection on webhook endpoint.
- **Impact:** Malicious actor could spam webhooks → database overload.
- **Effort:** M (2–4 hours)
- **Link:** [40-docuseal-readiness.md#rate-limiting-on-webhook](40-docuseal-readiness.md#rate-limiting-on-webhook)

---

## High-Priority Gaps (HIGH)

### 5. **Unsigned PDF Download Access Control - Needs Verification**
- **Severity:** HIGH
- **File:** `app/api/webhooks/docuseal/route.ts:133–137`
- **Issue:** Unclear if signed PDFs in S3 are public-readable or pre-signed URLs; potential unauthorized access.
- **Effort:** S (investigate + S3 config review)
- **Link:** [40-docuseal-readiness.md#pdf-download-security](40-docuseal-readiness.md#pdf-download-security)

### 6. **No Scheduled Expiry Task**
- **Severity:** HIGH
- **File:** Not implemented
- **Issue:** Proposals with `validUntil` date are never auto-marked as "expired"; manual checks only.
- **Impact:** Users must manually verify expiry; no background cleanup.
- **Effort:** M (4–8 hours + cron setup)
- **Link:** [40-docuseal-readiness.md#state-machine--proposal-status-transitions](40-docuseal-readiness.md#state-machine--proposal-status-transitions)

### 7. **Rate Limiting Missing on Signing Endpoints**
- **Severity:** MEDIUM
- **File:** `app/server/routers/proposals.ts:517–689` (sendForSignature), `1282–1407` (submitSignature)
- **Issue:** Signing endpoints have no rate limit (other endpoints do via existing pattern).
- **Impact:** Spam attacks on signature flow.
- **Effort:** S (2–3 hours)
- **Link:** [40-docuseal-readiness.md#rate-limiting-on-signing-endpoints](40-docuseal-readiness.md#rate-limiting-on-signing-endpoints)

---

## Medium-Priority Gaps (MEDIUM)

### 8. **No Webhook Signature Replay Protection**
- **Severity:** MEDIUM
- **File:** `app/api/webhooks/docuseal/route.ts:33–57`
- **Issue:** HMAC-SHA256 correct but no timestamp-based replay protection.
- **Impact:** Attacker could replay old signed webhooks (if signature key leaked).
- **Effort:** S (1–2 hours)

### 9. **No Webhook Retry / Dead-Letter Handling**
- **Severity:** MEDIUM
- **File:** `app/api/webhooks/docuseal/route.ts` (all)
- **Issue:** If webhook processing fails, no retry queue or dead-letter mechanism.
- **Impact:** Lost webhook → orphaned database state.
- **Effort:** M (6–10 hours + queue service setup)

---

## All Gaps Summary Table

| # | Feature | Area | Status | Severity | Confidence | Evidence | Est. Effort |
|---|---------|------|--------|----------|-----------|----------|------------|
| 1 | Docuseal Webhook Idempotency | Proposal Hub | PARTIAL | BLOCKER | 100% | route.ts:74–97 | S |
| 2 | Sentry Error Tracking in Webhook | Proposal Hub | REGRESSED | BLOCKER | 100% | route.ts (10x console.error) | S |
| 3 | Webhook Event Handlers (Declined/Expired) | Proposal Hub | PARTIAL | HIGH | 100% | route.ts:63–65 | M |
| 4 | Webhook Rate Limiting | Proposal Hub | MISSING | HIGH | 100% | None found | M |
| 5 | PDF Download Access Control | Proposal Hub | PARTIAL | HIGH | 75% | route.ts:133–137 | S |
| 6 | Scheduled Proposal Expiry Task | Proposal Hub | MISSING | HIGH | 100% | None found | M |
| 7 | Rate Limiting on Signing Endpoints | Proposal Hub | MISSING | MEDIUM | 100% | proposals.ts:517, 1282 | S |
| 8 | Webhook Replay Protection | Proposal Hub | MISSING | MEDIUM | 90% | route.ts:33–57 | S |
| 9 | Webhook Retry / DLQ Handling | Proposal Hub | MISSING | MEDIUM | 100% | None found | M |

---

## Client Hub Assessment

✅ **FULLY IMPLEMENTED & CORRECT:**
- Task CRUD (create, list, update, delete, complete)
- Task assignment & reassignment
- Bulk operations (status, assign, delete)
- Workflow checklists with progress tracking
- Activity logging on all operations
- Multi-tenancy + client isolation
- Sentry error tracking

**No gaps identified.** Client Hub is production-ready.

---

## Test Coverage Assessment

| Module | Tests Present? | Coverage | Gaps |
|--------|---|---------|------|
| Task CRUD | ✅ | Good | None critical |
| Task Bulk Ops | ✅ | Good | None critical |
| Proposal CRUD | ✅ | Good | None critical |
| Docuseal Webhook | ❌ | **0%** | **CRITICAL** – No idempotency tests, no error path tests, no replay tests |
| Docuseal Event Handlers | ❌ | **0%** | **CRITICAL** – No declined/expired scenario tests |
| Proposal Expiry | ❌ | **0%** | **CRITICAL** – No scheduled task tests |
| E-Signature Flow | ✅ | Partial | Double-sign, network failure scenarios missing |
| Rate Limiting | ❌ | **0%** | Webhook, signing endpoints not covered |

---

## Immediate Action Items

### Before Production Deploy

1. **Fix Docuseal Webhook Idempotency** (2–4h)
   - Add check for existing signature before processing
   - Return 200 OK if already processed (idempotent)
   - Add tests for duplicate webhooks

2. **Replace console.error with Sentry** (1–2h)
   - 10 violations in webhook handler
   - Add tags & extra context

3. **Add Missing Event Handlers** (3–6h)
   - Implement "submission.declined" handler → proposal status = "rejected"
   - Implement "submission.expired" handler → proposal status = "expired"
   - Comprehensive test coverage

4. **Add Webhook Rate Limiting** (2–4h)
   - Use existing rate limit pattern (Upstash Redis or similar)
   - 10 req/sec per tenant, 1 req/sec per submissionId

### Short-Term (1–2 weeks)

5. **Verify & Fix PDF Access Control** (S)
6. **Implement Scheduled Expiry Task** (M) + cron
7. **Add Rate Limiting to Signing Endpoints** (S)
8. **Add Webhook Replay Protection** (S)

### Medium-Term (1–2 months)

9. **Add Webhook Retry / DLQ** (M)
10. **Comprehensive Test Suite for Critical Paths** (L)

---

## Deprecations & Removals

No features identified for removal. All implemented features align with current product strategy.

See: [DEPRECATIONS.todo.md](DEPRECATIONS.todo.md)

---

## Files Created

- ✅ [10-legacy-inventory.md](10-legacy-inventory.md) – Legacy features with evidence
- ✅ [20-current-inventory.md](20-current-inventory.md) – Current implementations
- ✅ [30-gap-table.md](30-gap-table.md) – Detailed gap analysis
- ✅ [40-docuseal-readiness.md](40-docuseal-readiness.md) – Docuseal audit & fixes
- ✅ [50-test-coverage-delta.md](50-test-coverage-delta.md) – Test coverage gaps
- ✅ [DEPRECATIONS.todo.md](DEPRECATIONS.todo.md) – Removals for review
- ✅ [feature-map.json](feature-map.json) – Cross-reference mapping
- ✅ [patches/](patches/) – PR-ready diffs for critical gaps

---

## Confidence & Risk Assessment

| Aspect | Confidence | Risk Level |
|--------|------------|-----------|
| Client Hub completeness | 99% | ✅ Low |
| Proposal Hub completeness | 95% | ⚠️ Medium (Docuseal) |
| Docuseal gaps identification | 100% | 🔴 High (must fix pre-deploy) |
| Multi-tenancy isolation | 99% | ✅ Low |
| Test coverage delta | 90% | ⚠️ Medium (need more webhook tests) |

---

## Next Steps

1. **Review [40-docuseal-readiness.md](40-docuseal-readiness.md)** for full Docuseal details & fix recommendations.
2. **Review [30-gap-table.md](30-gap-table.md)** for per-feature breakdown.
3. **Apply patches from [patches/](patches/)** starting with idempotency fix.
4. **Run test suite** to verify fixes.
5. **Deploy with confidence** after all critical fixes + testing.

---

**Report Generated:** 2025-10-19
**Audit Confidence:** 95% (based on code review + tests + schema analysis)
**Next Review:** After critical fixes deployed
