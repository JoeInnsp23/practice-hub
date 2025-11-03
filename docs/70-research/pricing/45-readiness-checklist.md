# Production Readiness Checklist: Pricing Engine

**Date:** 2025-10-28
**Version:** 1.0
**Purpose:** Comprehensive go-live checklist for pricing engine deployment

---

## Executive Summary

This checklist ensures the pricing engine is **production-ready** before rollout. All items must be completed (✅) before enabling feature flags for users.

**Phases:**
- **Phase 1 (Quick Wins):** Critical gaps + lead capture fields (2-3 weeks)
- **Phase 2 (Automation):** Auto-service configuration (1 week)
- **Phase 3 (Enhancement):** Pricing preview UI (1 week)

**Go/No-Go Decision:** ALL critical items (marked 🔴) must pass.

---

## 1. Database & Schema

### 1.1 Schema Changes

- [ ] 🔴 **CRITICAL:** Add missing fields to `leads` table (GAP-001, GAP-002, GAP-003)
  - [ ] `monthlyTransactions` (integer, nullable)
  - [ ] `vatRegistered` (boolean, default: false)
  - [ ] `propertyCount` (integer, default: 0)
  - [ ] `bankAccountsCount` (integer, default: 0)
  - [ ] `booksCondition` (enum: 'clean', 'average', 'complex', 'disaster', 'unknown')
  - [ ] `currentAccountingSoftware` (varchar(50), nullable)
  - [ ] `hasMultipleCurrencies` (boolean, default: false)
  - [ ] `hasMultipleEntities` (boolean, default: false)
  - [ ] `entityCount` (integer, default: 1)
  - [ ] `payrollFrequency` (enum: 'weekly', 'fortnightly', '4weekly', 'monthly', nullable)
  - [ ] `cisRegistered` (boolean, default: false)
  - [ ] `incomeStreamsCount` (integer, default: 1)
  - **Location:** `lib/db/schema.ts:1705-1773` (leads table)
  - **Verification:** Run `pnpm db:push` successfully

- [ ] 🔴 **CRITICAL:** Verify `proposal_versions` table exists for version history
  - [ ] Table: `proposal_versions`
  - [ ] Fields: `id`, `proposalId`, `versionNumber`, `data` (JSONB), `createdById`, `createdAt`
  - **Location:** `lib/db/schema.ts` (check for table definition)
  - **Verification:** Query `SELECT * FROM proposal_versions LIMIT 1`

- [ ] **RECOMMENDED:** Add indexes for performance
  - [ ] `leads.estimated_turnover` (for band lookups)
  - [ ] `leads.monthly_transactions` (for Model B queries)
  - [ ] `proposals.status` (for filtering sent/signed)
  - [ ] `proposals.docuseal_submission_id` (for webhook lookups)
  - **Verification:** Run `EXPLAIN ANALYZE` on common queries

### 1.2 Seed Data

- [ ] 🔴 **CRITICAL:** Verify pricing rules exist for all services
  - [ ] 18 services in `services` table
  - [ ] Pricing rules for all turnover bands (7 bands)
  - [ ] Transaction band rules (4 bands) for bookkeeping services
  - [ ] Payroll employee tiers (6 tiers)
  - [ ] VAT turnover rules (4 bands)
  - **Location:** `scripts/seed.ts`
  - **Verification:** Run `SELECT COUNT(*) FROM pricing_rules` (expect 50+ rows)

- [ ] Seed complexity multipliers
  - [ ] Model A multipliers (clean: 0.95, average: 1.0, complex: 1.15, disaster: 1.4)
  - [ ] Model B multipliers (clean: 0.98, average: 1.0, complex: 1.08, disaster: 1.2)
  - **Location:** `app/server/routers/pricing.ts:81-100`
  - **Verification:** Manual code review

- [ ] Seed industry multipliers
  - [ ] Simple: 0.95, Standard: 1.0, Complex: 1.15, Regulated: 1.3
  - **Location:** `app/server/routers/pricing.ts:102-110`
  - **Verification:** Manual code review

### 1.3 Data Migration

- [ ] **OPTIONAL:** Migrate existing leads to new schema
  - [ ] Estimate `monthlyTransactions` from turnover (use formula from `pricing.ts:589-622`)
  - [ ] Set `vatRegistered` based on turnover (≥£85k threshold)
  - [ ] Set `booksCondition` to 'unknown' for existing leads
  - **Migration Script:** Create `scripts/migrate-leads-schema.ts`
  - **Verification:** Run on staging first, verify data quality

---

## 2. Code Implementation

### 2.1 Pricing Calculation

- [ ] 🔴 **CRITICAL:** Verify Model A calculation accuracy
  - [ ] Turnover band lookup logic
  - [ ] Complexity multiplier application
  - [ ] Industry multiplier application
  - **Location:** `app/server/routers/pricing.ts:256-397`
  - **Verification:** Unit tests passing (see Section 3)

- [ ] 🔴 **CRITICAL:** Verify Model B calculation accuracy
  - [ ] Transaction band lookup
  - [ ] Base price + rate per transaction formula
  - [ ] Lower complexity multipliers applied
  - **Location:** `app/server/routers/pricing.ts:399-546`
  - **Verification:** Unit tests passing

- [ ] Verify model comparison logic
  - [ ] 10% threshold for "close enough" (recommend Model A)
  - [ ] Cheaper model recommended if >10% difference
  - [ ] Fallback to Model A if Model B data unavailable
  - **Location:** `app/server/routers/pricing.ts:548-587`
  - **Verification:** Unit tests covering all branches

- [ ] Verify transaction estimation formula
  - [ ] Base estimates from turnover band
  - [ ] Industry multipliers applied
  - [ ] VAT registration multiplier (1.2x)
  - **Location:** `app/server/routers/pricing.ts:589-622`
  - **Verification:** Test with sample data

### 2.2 Auto-Service Configuration (Phase 2)

- [ ] 🟡 **PHASE 2:** Implement `autoMapLeadToServices()` function
  - [ ] Rule: `interestedServices` includes 'COMP_ACCOUNTS' → Add Annual Accounts
  - [ ] Rule: `estimatedEmployees > 0` → Add Payroll (config: employee count)
  - [ ] Rule: `propertyCount > 0` → Add Rental Properties addon
  - [ ] Rule: `vatRegistered = true` → Add VAT Returns
  - [ ] Rule: `cisRegistered = true` → Add CIS Returns
  - [ ] Rule: Estimate bookkeeping level from transactions/accounts
  - **Location:** Create `app/server/utils/auto-service-config.ts`
  - **Verification:** Unit tests + integration tests

- [ ] 🟡 **PHASE 2:** Implement complexity estimation logic
  - [ ] Weight `booksCondition` (0.5)
  - [ ] Weight `currentAccountingSoftware` (0.2)
  - [ ] Weight `monthlyTransactions` (0.15)
  - [ ] Weight `hasMultipleCurrencies` (0.1)
  - [ ] Weight `hasMultipleEntities` (0.05)
  - **Location:** Create `app/server/utils/estimate-complexity.ts`
  - **Verification:** Test with edge cases (all factors at extremes)

- [ ] 🟡 **PHASE 2:** Add `createFromLeadAuto` tRPC procedure
  - [ ] Call `autoMapLeadToServices()`
  - [ ] Calculate pricing for both models
  - [ ] Compare models and recommend
  - [ ] Allow staff override of auto-config
  - **Location:** `app/server/routers/proposals.ts`
  - **Verification:** Integration test (create proposal from lead with minimal data)

### 2.3 Proposal Workflow

- [ ] 🔴 **CRITICAL:** Verify proposal creation
  - [ ] `createFromLead` procedure works
  - [ ] Proposal services inserted correctly
  - [ ] Pricing calculated and stored
  - **Location:** `app/server/routers/proposals.ts:447-547`
  - **Verification:** Integration test

- [ ] 🔴 **CRITICAL:** Verify proposal versioning
  - [ ] Version created before every update
  - [ ] Snapshot stored in `proposal_versions`
  - [ ] Version number incremented
  - **Location:** `app/server/routers/proposals.ts` (update procedure)
  - **Verification:** Create proposal, update 3 times, verify 3 versions exist

- [ ] 🔴 **CRITICAL:** Verify DocuSeal integration
  - [ ] `sendForSignature` creates submission
  - [ ] DocuSeal submission ID stored
  - [ ] Email sent to client
  - [ ] Webhook signature verification
  - [ ] `submission.viewed` updates `viewedAt`
  - [ ] `submission.completed` updates `status = 'accepted'`, `signedAt`
  - **Location:** `app/server/routers/proposals.ts:798-976`, `app/api/webhooks/docuseal/route.ts`
  - **Verification:** E2E test (mock DocuSeal callbacks)

- [ ] Verify convert to client
  - [ ] Client created from signed proposal
  - [ ] Client services created from proposal services
  - [ ] Proposal/lead marked as converted
  - [ ] Welcome email sent
  - **Location:** `app/server/routers/proposals.ts` (convertToClient)
  - **Verification:** E2E test

### 2.4 Error Handling

- [ ] Pricing calculation errors handled gracefully
  - [ ] Missing pricing rule → Show error, allow custom price
  - [ ] Invalid input data → Validation error with clear message
  - **Verification:** Unit tests for error cases

- [ ] DocuSeal API errors handled
  - [ ] API timeout → Retry logic (max 3 attempts)
  - [ ] API error response → Log to Sentry, keep proposal in draft
  - [ ] Invalid webhook signature → Return 401, log to Sentry
  - **Verification:** Mock DocuSeal API failures, verify graceful degradation

- [ ] Edge cases handled
  - [ ] Proposal sent twice → Return error
  - [ ] Expired proposal signed → Do not accept, notify staff
  - [ ] Duplicate client creation → Return error
  - **Verification:** Integration tests for edge cases

---

## 3. Testing

### 3.1 Unit Tests

- [ ] 🔴 **CRITICAL:** Pricing calculation tests
  - [ ] `calculateModelA()` - All turnover bands
  - [ ] `calculateModelB()` - All transaction bands
  - [ ] Complexity multipliers (Model A vs Model B)
  - [ ] Industry multipliers
  - [ ] Discount application (volume, new client, annual)
  - [ ] Surcharges (multi-currency, multi-entity)
  - [ ] Rounding to nearest £5
  - [ ] Minimum engagement (£60/month)
  - **Coverage Target:** 90%+ line coverage for pricing logic
  - **Verification:** Run `pnpm test app/server/routers/pricing.test.ts`

- [ ] 🟡 **PHASE 2:** Auto-service configuration tests
  - [ ] `autoMapLeadToServices()` - All service rules
  - [ ] `estimateComplexity()` - All factors and weights
  - [ ] `estimateTransactions()` - All industries and VAT scenarios
  - **Coverage Target:** 90%+ line coverage
  - **Verification:** Run `pnpm test app/server/utils/auto-service-config.test.ts`

- [ ] Transaction estimation tests
  - [ ] All turnover bands
  - [ ] All industry multipliers
  - [ ] VAT registered vs not registered
  - **Verification:** Run `pnpm test app/server/routers/pricing.test.ts`

### 3.2 Integration Tests

- [ ] 🔴 **CRITICAL:** Proposal workflow tests
  - [ ] Create proposal from lead
  - [ ] Update proposal (verify version created)
  - [ ] Send proposal (mock DocuSeal API)
  - [ ] Webhook processing (mock events)
  - [ ] Convert to client
  - **Verification:** Run `pnpm test app/server/routers/proposals.test.ts`

- [ ] tRPC router tests
  - [ ] `pricing.calculate` - Full calculation with all modifiers
  - [ ] `proposals.createFromLead` - End-to-end proposal creation
  - [ ] `proposals.sendForSignature` - DocuSeal integration
  - **Verification:** Run `pnpm test app/server/routers/*.test.ts`

- [ ] Multi-tenancy tests
  - [ ] Pricing rules scoped to tenant
  - [ ] Proposals scoped to tenant
  - [ ] Cannot access other tenant's data
  - **Verification:** Create 2 tenants, verify isolation

### 3.3 E2E Tests (Playwright)

- [ ] 🔴 **CRITICAL:** Lead to client workflow
  - [ ] Staff creates lead
  - [ ] Staff creates proposal from lead
  - [ ] Staff sends proposal
  - [ ] Mock: Client views proposal (webhook)
  - [ ] Mock: Client signs proposal (webhook)
  - [ ] Staff converts proposal to client
  - [ ] Verify client record created
  - **Verification:** Run `pnpm test:e2e pricing-workflow.spec.ts`

- [ ] 🟡 **PHASE 2:** Auto-service configuration E2E
  - [ ] Create lead with complete data
  - [ ] Click "Create Proposal from Lead"
  - [ ] Verify services auto-selected
  - [ ] Verify pricing calculated
  - [ ] Staff reviews and sends
  - **Verification:** Run `pnpm test:e2e auto-config-workflow.spec.ts`

- [ ] 🟡 **PHASE 3:** Pricing preview E2E
  - [ ] Fill lead capture form
  - [ ] See pricing preview update in real-time
  - [ ] Submit form
  - [ ] Verify lead created with pricing estimate
  - **Verification:** Run `pnpm test:e2e pricing-preview.spec.ts`

### 3.4 Coverage Targets

- [ ] 🔴 **CRITICAL:** Overall test coverage ≥80%
  - [ ] Pricing router: ≥90%
  - [ ] Proposals router: ≥85%
  - [ ] Auto-service config utils: ≥90%
  - **Verification:** Run `pnpm test:coverage`, check report

---

## 4. Configuration & Environment

### 4.1 Environment Variables

- [ ] 🔴 **CRITICAL:** Verify all required env vars set
  - [ ] `DATABASE_URL` - PostgreSQL connection
  - [ ] `DOCUSEAL_HOST` - DocuSeal instance URL
  - [ ] `DOCUSEAL_API_KEY` - DocuSeal API key
  - [ ] `DOCUSEAL_SECRET_KEY` - DocuSeal secret for encryption
  - [ ] `DOCUSEAL_WEBHOOK_SECRET` - Webhook signature verification
  - **Location:** `.env.local` (local), `.env.production` (production)
  - **Verification:** Run `pnpm env:check` (create script to validate all required vars)

- [ ] Verify optional env vars
  - [ ] `SENTRY_DSN` - Error tracking (recommended)
  - [ ] `REDIS_URL` - Pricing rule cache (recommended for performance)
  - **Verification:** Check documentation in `/docs/reference/configuration/environment.md`

### 4.2 Feature Flags

- [ ] 🔴 **CRITICAL:** Configure feature flags (start with OFF)
  - [ ] `pricing.modelB.enabled = false` (Phase 1: disable Model B initially)
  - [ ] `pricing.autoServiceConfig.enabled = false` (Phase 2: enable after testing)
  - [ ] `pricing.pricingPreview.enabled = false` (Phase 3: enable after UI built)
  - [ ] `pricing.roundingToNearest5.enabled = true` (DEC-004: enable immediately)
  - [ ] `pricing.minimumEngagement.enabled = true` (DEC-005: £60 minimum)
  - **Location:** Create `config/feature-flags.ts` or use environment variables
  - **Verification:** Query flags via admin panel or API

- [ ] Implement feature flag middleware
  - [ ] Check flag before enabling features
  - [ ] Log flag state changes
  - [ ] Allow per-tenant overrides (optional)
  - **Verification:** Toggle flags, verify features enabled/disabled

### 4.3 Configuration Files

- [ ] **OPTIONAL:** Deploy pricing config to `/config/pricing/`
  - [ ] `31-pricing-config.prototype.json` → `config/pricing/pricing-rules.json`
  - [ ] Validate JSON schema on deploy
  - [ ] Load config on app startup
  - **Verification:** Check config loaded in logs

---

## 5. Documentation

### 5.1 Technical Documentation

- [ ] 🔴 **CRITICAL:** Pricing documentation complete
  - [ ] ✅ Executive brief (`00-exec-brief.md`)
  - [ ] ✅ Service inventory (`10-service-inventory.md`)
  - [ ] ✅ Service alignment matrix (`15-service-alignment-matrix.md`)
  - [ ] ✅ Market research (`20-market-research.md`, `21-market-data.csv`, `data/market/sources.json`)
  - [ ] ✅ Field mappings (`22-mappings.json`)
  - [ ] ✅ Pricing model (`30-pricing-model.md`)
  - [ ] ✅ Pricing config prototype (`31-pricing-config.prototype.json`)
  - [ ] ✅ Pricing DSL (`32-pricing-dsl.md`)
  - [ ] ✅ Quote workflow (`40-quote-workflow.md`)
  - [ ] ✅ Readiness checklist (this file: `45-readiness-checklist.md`)
  - [ ] ⏳ Test plan (`50-test-plan.md`)
  - [ ] ✅ Gaps analysis (`55-gaps.md`)
  - [ ] ✅ Decisions log (`60-decisions.md`)
  - [ ] ⏳ Rollout plan (`70-rollout-plan.md`)
  - [ ] ⏳ Market snapshots (`data/market/snapshots/*.md`)
  - **Verification:** All 17 files exist in `/docs/pricing/`

- [ ] Code documentation
  - [ ] Inline comments for complex pricing logic
  - [ ] JSDoc for public functions
  - [ ] README in `/docs/pricing/` explaining folder structure
  - **Verification:** Code review

### 5.2 User Documentation

- [ ] Staff training materials
  - [ ] How to create proposals manually
  - [ ] How to use auto-service configuration (Phase 2)
  - [ ] How to interpret Model A vs Model B recommendations
  - [ ] How to handle pricing exceptions/overrides
  - **Location:** `/docs/guides/staff/pricing-proposals.md` (create)
  - **Verification:** Conduct training session with staff

- [ ] Client-facing documentation
  - [ ] Pricing transparency page (website)
  - [ ] "How our pricing works" explainer
  - [ ] FAQ on pricing models
  - **Location:** Website content (optional for Phase 1)
  - **Verification:** Review with marketing team

---

## 6. Security & Compliance

### 6.1 Data Protection

- [ ] 🔴 **CRITICAL:** PII handling compliant with GDPR
  - [ ] Lead data (email, phone) stored securely
  - [ ] Encryption at rest (PostgreSQL)
  - [ ] Encryption in transit (HTTPS, TLS for DB)
  - [ ] Data retention policy documented
  - **Verification:** Security audit

- [ ] Webhook signature verification
  - [ ] All DocuSeal webhooks verify `X-DocuSeal-Signature` header
  - [ ] Invalid signatures logged to Sentry
  - [ ] Rate limiting on webhook endpoint (prevent spam)
  - **Location:** `app/api/webhooks/docuseal/route.ts`
  - **Verification:** Send webhook with invalid signature, verify rejected

### 6.2 Access Control

- [ ] Multi-tenancy enforced
  - [ ] All pricing queries filtered by `tenantId`
  - [ ] Cannot access other tenant's pricing rules
  - [ ] Staff can only see own tenant's proposals
  - **Verification:** Multi-tenancy integration tests

- [ ] Role-based access
  - [ ] Admin: Full access to pricing rules, proposals
  - [ ] Staff: Create/edit proposals, cannot edit pricing rules
  - [ ] Client: View own proposals only (client portal)
  - **Verification:** Role-based auth tests

### 6.3 Input Validation

- [ ] All tRPC inputs validated with Zod schemas
  - [ ] Turnover: 0 to £100m
  - [ ] Transactions: 0 to 100,000
  - [ ] Employees: 0 to 10,000
  - [ ] Property count: 0 to 1,000
  - **Location:** `app/server/routers/pricing.ts`, `app/server/routers/proposals.ts`
  - **Verification:** Send invalid inputs, verify validation errors

---

## 7. Monitoring & Observability

### 7.1 Error Tracking

- [ ] 🔴 **CRITICAL:** Sentry integration configured
  - [ ] All pricing errors logged to Sentry
  - [ ] DocuSeal API errors logged
  - [ ] Webhook processing errors logged
  - [ ] Contextual tags: `operation`, `proposalId`, `tenantId`
  - **Location:** `lib/sentry.ts` (client/server configs)
  - **Verification:** Trigger error, verify appears in Sentry dashboard

- [ ] Error alerting
  - [ ] High-priority errors (pricing calculation failures) → Slack/email
  - [ ] DocuSeal API down → Immediate alert
  - **Verification:** Configure Sentry alert rules

### 7.2 Logging

- [ ] Structured logging for pricing events
  - [ ] Proposal created: `{ event: 'proposal_created', proposalId, leadId, tenantId }`
  - [ ] Proposal sent: `{ event: 'proposal_sent', proposalId, docusealSubmissionId }`
  - [ ] Proposal signed: `{ event: 'proposal_signed', proposalId, signedAt }`
  - [ ] Client converted: `{ event: 'client_converted', clientId, proposalId }`
  - **Location:** Add logging to tRPC procedures
  - **Verification:** Check logs in production

### 7.3 Metrics

- [ ] **RECOMMENDED:** Track key metrics
  - [ ] Proposal creation time (target: <1 min with auto-config)
  - [ ] Lead-to-proposal conversion rate
  - [ ] Proposal-to-signature conversion rate
  - [ ] Signature-to-client conversion rate
  - [ ] Model A vs Model B recommendation split
  - [ ] Pricing calculation latency
  - **Tooling:** Use Sentry performance monitoring or custom analytics
  - **Verification:** Dashboard shows metrics

---

## 8. Performance

### 8.1 Query Optimization

- [ ] Pricing rule queries optimized
  - [ ] Index on `pricing_rules.service_id`
  - [ ] Index on `pricing_rules.rule_type`
  - [ ] Index on `pricing_rules.min_value`, `pricing_rules.max_value` (for band lookups)
  - **Verification:** Run `EXPLAIN ANALYZE` on pricing queries, verify index usage

- [ ] Proposal queries optimized
  - [ ] Eager load proposal services (avoid N+1 queries)
  - [ ] Index on `proposals.status` for filtering
  - [ ] Index on `proposals.docuseal_submission_id` for webhook lookups
  - **Verification:** Run `EXPLAIN ANALYZE`, check query time <50ms

### 8.2 Caching

- [ ] **RECOMMENDED:** Redis cache for pricing rules
  - [ ] Cache pricing rules by service + turnover band + complexity
  - [ ] TTL: 24 hours
  - [ ] Invalidate on pricing rule updates
  - **Implementation:** Create `lib/cache/pricing-rules.ts`
  - **Verification:** Load test, verify cache hit rate >80%

- [ ] **OPTIONAL:** Cache proposal PDFs
  - [ ] Generate PDF when proposal finalized
  - [ ] Store in S3/MinIO
  - [ ] Reuse if proposal not updated
  - **Verification:** Send proposal twice, verify PDF reused

### 8.3 Load Testing

- [ ] **RECOMMENDED:** Stress test pricing calculation
  - [ ] 1000 concurrent requests to `pricing.calculate`
  - [ ] Target: <200ms p95 response time
  - [ ] No errors or timeouts
  - **Tooling:** Use `k6` or `artillery`
  - **Verification:** Run load test, review results

---

## 9. Rollout Strategy

### 9.1 Phased Rollout (Recommended)

- [ ] **Phase 1 (Weeks 1-2):** Add lead capture fields
  - [ ] Deploy schema changes to staging
  - [ ] Test lead creation with new fields
  - [ ] Deploy to production (no feature flags needed)
  - [ ] Train staff on new fields
  - **Go-Live Criteria:** All schema tests passing, staff trained

- [ ] **Phase 2 (Weeks 3-4):** Auto-service configuration
  - [ ] Deploy auto-config code to staging
  - [ ] Enable `pricing.autoServiceConfig.enabled = true` for 1 test tenant
  - [ ] Create 10 test proposals, verify accuracy >90%
  - [ ] Enable for 50% of tenants (A/B test)
  - [ ] Monitor proposal creation time and accuracy
  - [ ] Enable for 100% if metrics positive
  - **Go-Live Criteria:** >90% staff approval rate, <1 min creation time

- [ ] **Phase 3 (Week 5):** Pricing preview UI
  - [ ] Deploy pricing preview component to staging
  - [ ] Enable `pricing.pricingPreview.enabled = true` for 1 test tenant
  - [ ] Test lead capture flow with preview
  - [ ] Enable for 50% of traffic (A/B test)
  - [ ] Monitor lead-to-proposal conversion rate
  - [ ] Enable for 100% if conversion improves
  - **Go-Live Criteria:** +5 percentage points conversion lift

### 9.2 Rollback Plan

- [ ] Rollback triggers defined
  - [ ] Pricing calculation errors >5% of requests
  - [ ] DocuSeal integration failures >10%
  - [ ] Staff complaints about auto-config accuracy >20%
  - [ ] Lead-to-proposal conversion drops >5 percentage points
  - **Action:** Disable feature flag immediately, investigate

- [ ] Rollback procedure documented
  - [ ] Disable feature flag via environment variable
  - [ ] Restart app servers (zero-downtime deployment)
  - [ ] Notify staff via Slack/email
  - [ ] Post-mortem within 24 hours
  - **Location:** `/docs/operations/rollback-procedure.md` (create)
  - **Verification:** Practice rollback in staging

### 9.3 Success Metrics

- [ ] Define success criteria for each phase
  - [ ] **Phase 1:** 100% of new leads have pricing driver fields populated
  - [ ] **Phase 2:** Proposal creation time <1 minute (from 5-10 minutes)
  - [ ] **Phase 2:** Auto-config accuracy >90% (staff approval rate)
  - [ ] **Phase 3:** Lead-to-proposal conversion +5 percentage points
  - [ ] **Phase 3:** Lead-to-client conversion +5 percentage points
  - **Verification:** Track metrics in analytics dashboard

---

## 10. Sign-Off

### 10.1 Technical Sign-Off

- [ ] 🔴 **CRITICAL:** All critical tests passing
  - [ ] Unit tests: ≥90% coverage for pricing logic
  - [ ] Integration tests: All workflow tests passing
  - [ ] E2E tests: Lead-to-client workflow passing
  - **Sign-Off:** Engineering Lead

- [ ] 🔴 **CRITICAL:** Security review completed
  - [ ] Webhook signature verification tested
  - [ ] Multi-tenancy isolation verified
  - [ ] PII handling compliant with GDPR
  - **Sign-Off:** Security Lead

- [ ] 🔴 **CRITICAL:** Performance benchmarks met
  - [ ] Pricing calculation: <200ms p95
  - [ ] Proposal creation: <1 second
  - [ ] Webhook processing: <500ms
  - **Sign-Off:** Engineering Lead

### 10.2 Business Sign-Off

- [ ] Pricing rules validated by finance
  - [ ] All 18 services priced correctly
  - [ ] Market benchmarks align with strategy
  - [ ] Discount policy approved
  - **Sign-Off:** Finance Director

- [ ] Staff training completed
  - [ ] Training session conducted
  - [ ] Documentation reviewed
  - [ ] Q&A session held
  - **Sign-Off:** Practice Manager

- [ ] Decisions approved
  - [ ] DEC-001: UK/GBP only (YES)
  - [ ] DEC-002: Keep dual-model pricing (YES)
  - [ ] DEC-003: Discount policy confirmed
  - [ ] DEC-004: Rounding to £5 approved
  - [ ] DEC-005: £60 minimum engagement approved
  - **Sign-Off:** CEO/Leadership

### 10.3 Go-Live Approval

- [ ] 🔴 **CRITICAL:** All critical checklist items completed
- [ ] 🔴 **CRITICAL:** All technical sign-offs obtained
- [ ] 🔴 **CRITICAL:** All business sign-offs obtained
- [ ] Rollback plan tested and approved
- [ ] Success metrics defined and tracking enabled
- [ ] Monitoring and alerting configured

**Final Sign-Off:**
- [ ] **Engineering Lead:** _______________________ Date: _______
- [ ] **Product Manager:** _______________________ Date: _______
- [ ] **CEO/Leadership:** _______________________ Date: _______

---

## Appendix: Quick Reference

### Key Files to Review

| File | Purpose | Reviewer |
|------|---------|----------|
| `lib/db/schema.ts:1705-1773` | Leads table schema | Backend Dev |
| `app/server/routers/pricing.ts` | Pricing calculation logic | Backend Dev + Finance |
| `app/server/routers/proposals.ts` | Proposal workflow | Backend Dev |
| `app/api/webhooks/docuseal/route.ts` | DocuSeal webhooks | Backend Dev |
| `docs/pricing/*.md` | Pricing documentation | Product Manager |

### Common Commands

```bash
# Database
pnpm db:push              # Apply schema changes
pnpm db:seed              # Seed pricing rules

# Testing
pnpm test                 # Run all unit tests
pnpm test:coverage        # Check test coverage
pnpm test:e2e             # Run E2E tests

# Development
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm lint                 # Run Biome linter

# Deployment
pnpm deploy:staging       # Deploy to staging (create script)
pnpm deploy:production    # Deploy to production (create script)
```

### Support Contacts

- **Engineering Lead:** [Name] <email>
- **Product Manager:** [Name] <email>
- **Finance Director:** [Name] <email>
- **Practice Manager:** [Name] <email>

---

**End of Production Readiness Checklist**
