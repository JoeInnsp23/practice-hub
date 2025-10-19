# Critical Fixes - Patch Directory

This directory contains PR-ready patches for critical gaps identified in the feature-parity gap audit.

**Status:** ⚠️ MUST BE APPLIED BEFORE PRODUCTION DEPLOYMENT

---

## Patches Overview

### 1. Webhook Idempotency Fix
**File:** `01-docuseal-webhook-idempotency.patch`
**Severity:** BLOCKER
**Issue:** If DocuSeal retries webhook (network timeout, server error), duplicate processing causes database constraint violation
**Fix:** Add idempotency check at webhook handler start; return cached response if signature already recorded
**Effort:** 2–4 hours including tests
**Testing:** See `50-test-coverage-delta.md` for test suite

---

### 2. Sentry Error Tracking Fix
**File:** `02-docuseal-sentry-logging.patch`
**Severity:** BLOCKER
**Issue:** 10× `console.error()` violations; production errors invisible to operations team
**Fix:** Replace all console.error with Sentry.captureException + tags + context
**Effort:** 1–2 hours
**Testing:** Verify Sentry receives errors with proper context

---

### 3. Webhook Event Handlers Fix
**File:** `03-docuseal-event-handlers.patch`
**Severity:** HIGH
**Issue:** Only handles "completed"; missing "declined" and "expired" event handlers
**Fix:** Add handlers for declined→"rejected" status and expired→"expired" status
**Effort:** 3–6 hours including notification emails + tests
**Testing:** See test scenarios in patch comments

---

## How to Apply Patches

### Option A: Manual Application (Recommended for Review)

1. Open each file mentioned below
2. Review the changes
3. Apply manually to ensure understanding

**Files affected:**
- `app/api/webhooks/docuseal/route.ts` (all three patches)

### Option B: Automated Patch Application

```bash
# From repo root
cd /root/projects/practice-hub

# Apply patch 1
patch < docs/gap-analysis/patches/01-docuseal-webhook-idempotency.patch

# Apply patch 2
patch < docs/gap-analysis/patches/02-docuseal-sentry-logging.patch

# Apply patch 3
patch < docs/gap-analysis/patches/03-docuseal-event-handlers.patch

# Verify changes
git diff app/api/webhooks/docuseal/route.ts
```

### Option C: PR Workflow

1. Create feature branch: `git checkout -b fix/docuseal-critical-gaps`
2. Manually apply changes from patches
3. Run tests: `pnpm test __tests__/api/webhooks/docuseal.test.ts`
4. Create PR with description linking to gap analysis
5. Code review + merge

---

## Pre-Deployment Checklist

Before deploying fixes to production:

### Code Review
- [ ] Reviewer 1: Check idempotency logic
- [ ] Reviewer 2: Check Sentry error tagging
- [ ] Reviewer 3: Check event handler completeness
- [ ] All: Check for breaking changes or missing cases

### Testing
- [ ] Unit tests pass: `pnpm test`
- [ ] Webhook idempotency tests pass (new suite)
- [ ] Docuseal webhook tests pass (new suite)
- [ ] Integration tests pass: `pnpm test tenant-isolation.test.ts`
- [ ] Manual testing in staging with production-like load

### Deployment
- [ ] Merge to main
- [ ] Deploy to staging first (not production directly)
- [ ] Monitor Sentry dashboard for errors (should see structured errors now)
- [ ] Test end-to-end: proposal → send for signature → complete flow
- [ ] Verify webhook retries don't crash
- [ ] Monitor production for errors (1 hour post-deploy)

### Rollback Plan
If issues occur after deployment:
1. Revert commit: `git revert <commit-hash>`
2. Monitor for errors in Sentry
3. Document issue in gap analysis
4. Schedule follow-up fix

---

## Detailed Fix Descriptions

### Fix 1: Webhook Idempotency

**What it does:**
- Before processing webhook, check if signature already recorded (by `docusealSubmissionId`)
- If found, return 200 OK with `{ ok: true, cached: true }`
- If not found, proceed with normal processing

**Why it matters:**
- DocuSeal retries webhooks on network timeouts (happens in production)
- Without idempotency, second webhook causes database error
- Proposal gets stuck in "sent" status permanently
- Operations team must manually investigate and fix

**Code changes:**
- Add database query at start of `handleWebhookEvent()`
- Check for existing signature record
- Return early if found

**Testing:**
- Send webhook twice (same payload)
- Verify: first succeeds, second returns cached
- Verify: only one signature record in database
- Verify: no duplicate activity logs

---

### Fix 2: Sentry Error Tracking

**What it does:**
- Replaces 10× `console.error()` calls with `Sentry.captureException()`
- Adds operation tags (operation: "webhook_signature_invalid", etc.)
- Adds extra context (submissionId, proposalId, tenantId)

**Why it matters:**
- Console errors leak to stdout; not structured logging
- Operations team can't see errors without viewing server logs
- No way to alert on production errors
- No error categorization or dashboarding

**Code changes:**
- Import Sentry
- Replace each console.error with Sentry.captureException
- Add tags and extra context for each error

**Testing:**
- Trigger each error scenario
- Verify Sentry receives event with correct tags
- Verify extra context is populated
- Set up Sentry alerts on webhook errors

---

### Fix 3: Event Handlers

**What it does:**
- Add handler for "submission.declined" event
  - Update proposal status to "rejected"
  - Log activity
  - Send email to proposal creator
  - Notify team
- Add handler for "submission.expired" event
  - Update proposal status to "expired"
  - Log activity
  - Send email to proposal creator

**Why it matters:**
- Client clicks "Decline" on signing link → webhook sent but ignored
- Proposal stays in "sent" status (staff thinks client is still reviewing)
- No way to know client rejected offer
- Staff can't follow up or mark as lost

**Code changes:**
- Add `else if (eventType === "declined")` block
- Add `else if (eventType === "expired")` block
- Implement status updates, logging, email sending

**Testing:**
- Simulate "declined" webhook → proposal.status = "rejected"
- Simulate "expired" webhook → proposal.status = "expired"
- Verify activity logs are created
- Verify emails sent
- Verify Sentry logged the events

---

## Additional Recommendations (Not in Patches)

These are follow-up fixes that don't block production but should be done soon:

### Fix 4: Rate Limiting
**File:** `app/api/webhooks/docuseal/route.ts`
**Issue:** No rate limit on webhook (DOS vulnerability)
**Fix:** Add Upstash Redis rate limit (10 req/sec per tenant, 1 req/sec per submissionId)
**Effort:** 2–4 hours
**See:** `40-docuseal-readiness.md` for implementation details

### Fix 5: Scheduled Expiry Task
**File:** New cron job
**Issue:** Proposals with validUntil never auto-marked as expired
**Fix:** Create cron job to run daily and mark expired proposals
**Effort:** 4–8 hours (includes cron service setup)
**See:** `40-docuseal-readiness.md` for implementation details

### Fix 6: Webhook Replay Protection
**File:** `app/api/webhooks/docuseal/route.ts`
**Issue:** No timestamp validation; could replay old webhooks if secret leaked
**Fix:** Add timestamp check (must be within 5 minutes of current time)
**Effort:** 1–2 hours
**See:** `40-docuseal-readiness.md` for implementation details

---

## Links to Documentation

- **Executive Summary:** `00-exec-summary.md`
- **Full Gap Analysis:** `30-gap-table.md`
- **Docuseal Deep-Dive:** `40-docuseal-readiness.md`
- **Test Coverage:** `50-test-coverage-delta.md`
- **Feature Map:** `feature-map.json`

---

## Support

For questions about specific patches:

1. **Review Comments:** Check CLAUDE.md for design standards
2. **Error Messages:** See 40-docuseal-readiness.md for error categorization
3. **Testing:** See 50-test-coverage-delta.md for test scenarios
4. **Deployment:** See 00-exec-summary.md for deployment timeline

---

**Applied by:** Gap Audit Team
**Date:** 2025-10-19
**Priority:** CRITICAL – Deploy before production
