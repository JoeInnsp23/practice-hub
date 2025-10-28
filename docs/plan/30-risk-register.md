# Risk Register: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Total Risks**: 10
**Active Risks**: 10
**Critical Risks**: 2

---

## RISK-001: My Tasks Filter Regression (Critical Path)

**Category**: Technical
**Status**: Active
**Likelihood**: MEDIUM (30%)
**Impact**: HIGH
**Risk Score**: MEDIUM-HIGH
**Priority**: P0

### Description
Change from single-field filter (`assignedToId`) to OR filter across 3 fields (`assignedToId`, `preparerId`, `reviewerId`) may break existing task visibility. Users could lose access to their tasks or see duplicate tasks.

### Impact if Realized
- Users cannot see tasks they're assigned to
- Task workflows blocked (preparer/reviewer roles not working)
- Production rollback required
- Customer support burden (complaints about missing tasks)

### Likelihood Factors
- Schema change to `taskDetailsView` (30% chance of error)
- OR logic complexity (3 fields instead of 1)
- Potential for duplicate results if not handled correctly
- Existing task data may have null values in preparer/reviewer fields

### Mitigation Strategy
1. **Pre-Deploy**:
   - Add E2E test (TEST-001) with 3-role scenario validation
   - Test with user assigned to all 3 roles on same task (check for duplicates)
   - Validate against staging data with real task distribution

2. **Deploy**:
   - Feature flag rollout (10% → 50% → 100% over 24 hours)
   - Monitor task query error rates in Sentry
   - A/B test: Compare old filter vs new filter results

3. **Post-Deploy**:
   - Watch Sentry for "My Tasks filter returning empty" alerts
   - Monitor task query performance (<500ms p95)
   - Customer support monitoring (task visibility complaints)

### Trigger Conditions
- Task list shows different results after filter change
- Users report "I can't see my tasks"
- Task query error rate >1%

### Owner
Backend Developer + QA Engineer

### Rollback Plan
1. Revert schema change to `taskDetailsView`
2. Revert query logic to single-field filter
3. Redeploy to production (15 minutes)
4. Run smoke tests to verify old behavior restored

---

## RISK-002: Quote Management Data Model Ambiguity

**Category**: Product/Technical
**Status**: Active
**Likelihood**: MEDIUM (40%)
**Impact**: MEDIUM
**Risk Score**: MEDIUM
**Priority**: P1

### Description
Unclear whether quotes are proposal variants (`type='quote'`) or separate entity. If wrong assumption is made, may require 4-8 hours of rework to change data model and router implementation.

### Impact if Realized
- 4-8 hours of unplanned development work
- Potential data migration if quotes already created
- Week 1 schedule delay (1-2 days)
- Technical debt if architecture is inconsistent

### Likelihood Factors
- Product requirements not documented (40% chance of ambiguity)
- Legacy app has `/quotes` page but no clear data model
- No existing quotes in current database (no reference data)

### Mitigation Strategy
1. **Pre-Decision** (Week 1 Day 1):
   - Schedule decision meeting with Product Manager (DEC-002)
   - Review legacy quote data model (if available)
   - Ask key questions:
     - Can quotes be converted to proposals?
     - Do quotes require DocuSeal signatures?
     - Are quote line items identical to proposal line items?

2. **Implementation** (if separate module):
   - Start with minimal schema (defer complex features)
   - Mirror proposal router structure for consistency
   - Add integration tests before UI implementation

3. **Rollback** (if wrong choice):
   - If built as separate: merge into proposals table with type enum
   - If built as variant: extract to separate table
   - Run data migration script (quotes → proposals or vice versa)

### Trigger Conditions
- Product requirements change mid-implementation
- Stakeholder feedback: "This isn't how quotes work"
- Technical constraints surface (e.g., quotes need different PDF template)

### Owner
Product Manager + Backend Developer

### Rollback Plan
1. Document architectural decision in ADR
2. If rework needed, allocate 1 day buffer (Week 1 Day 4)
3. Communicate timeline impact to stakeholders

---

## RISK-003: E2E Test Flakiness (QA Blocker)

**Category**: Testing
**Status**: Active
**Likelihood**: LOW (20%)
**Impact**: MEDIUM
**Risk Score**: LOW-MEDIUM
**Priority**: P1

### Description
E2E tests may exhibit flakiness (intermittent failures) due to timing issues, network conditions, or async operations. Flaky tests delay deployment and reduce confidence in test suite.

### Impact if Realized
- False negatives block deployment
- QA time wasted investigating non-issues
- Loss of confidence in test suite
- Week 2 schedule delay (0.5-1 day)

### Likelihood Factors
- Playwright tests with async operations (20% chance of flakiness)
- DocuSeal webhook timing (external dependency)
- Database state cleanup between tests

### Mitigation Strategy
1. **Pre-Deploy**:
   - Retry policy: Run each test 3x, pass if 2/3 succeed
   - Quarantine flaky tests (run separately, don't block deploy)
   - Add explicit waits for async operations (not just `waitFor`)
   - Mock external dependencies where possible

2. **During Testing**:
   - Run E2E suite 10x in CI to detect flakiness
   - Log timing information for slow tests
   - Investigate any test that takes >30 seconds

3. **Post-Deploy**:
   - Monitor test failure rates in CI
   - Regularly review quarantined tests (fix or remove)

### Trigger Conditions
- Test passes locally but fails in CI
- Test fails intermittently (1 in 5 runs)
- Test timing varies significantly (5s → 30s range)

### Owner
QA Engineer

### Rollback Plan
1. Quarantine flaky test (don't block deploy)
2. File bug ticket with reproduction steps
3. Prioritize fix in next sprint

---

## RISK-004: DocuSeal Production Configuration Error

**Category**: Integration
**Status**: Mitigated (configuration fixed during analysis)
**Likelihood**: LOW (10%)
**Impact**: HIGH
**Risk Score**: LOW-HIGH
**Priority**: P1

### Description
DocuSeal production environment variables may be misconfigured (wrong variable names, missing webhook secret). Could cause proposal signing to fail in production.

### Impact if Realized
- Proposal signing broken in production
- Clients cannot sign proposals
- Revenue impact (blocked deals)
- Customer support escalation

### Likelihood Factors
- `.env.production.example` was incorrect (FIXED)
- Webhook secret must match between app and DocuSeal (manual setup)
- API key generation requires DocuSeal admin UI access

### Mitigation Strategy
1. **Pre-Deploy** (Staging):
   - Validate all DocuSeal environment variables
   - Test full proposal signing flow in staging
   - Verify webhook events trigger correctly
   - Check API key expiration (if applicable)

2. **Deploy**:
   - Use rollout checklist to verify DocuSeal config
   - Test one proposal signing in production immediately after deploy
   - Monitor DocuSeal webhook logs

3. **Post-Deploy**:
   - Alert on DocuSeal API errors (Sentry)
   - Monitor proposal signing success rate (should be >95%)

### Trigger Conditions
- Proposal signing fails with "Invalid API key"
- Webhook events not received
- DocuSeal submission creation returns 401/403

### Owner
DevOps + Backend Developer

### Rollback Plan
1. Check `.env.production` variables match `.env.production.example`
2. Regenerate API key in DocuSeal admin UI if needed
3. Update webhook secret in both app and DocuSeal

---

## RISK-005: S3/MinIO Object Storage Failure

**Category**: Infrastructure
**Status**: Active
**Likelihood**: LOW (15%)
**Impact**: MEDIUM
**Risk Score**: LOW-MEDIUM
**Priority**: P2

### Description
PDF generation (proposals, invoices) depends on S3/MinIO for storage. If object storage is unavailable, PDFs cannot be generated or retrieved.

### Impact if Realized
- PDF generation fails
- Clients cannot download proposals/invoices
- Presigned URL generation fails
- Customer dissatisfaction

### Likelihood Factors
- Hetzner S3 outage (rare, <1% annually)
- Misconfigured S3 credentials (15% chance)
- Bucket permissions incorrect
- Network connectivity issues

### Mitigation Strategy
1. **Pre-Deploy**:
   - Test PDF upload/download in staging
   - Verify presigned URL TTL (24 hours)
   - Test S3 bucket lifecycle policies

2. **Deploy**:
   - Monitor S3 upload success rate (>99%)
   - Alert on S3 API errors (Sentry)

3. **Post-Deploy**:
   - Graceful error handling (retry 3x with exponential backoff)
   - User-friendly error message: "PDF generation failed, try again later"

### Trigger Conditions
- S3 upload/download error rate >1%
- "Access Denied" errors from S3
- Presigned URLs return 403

### Owner
DevOps + Backend Developer

### Rollback Plan
1. Check S3 credentials in `.env.production`
2. Verify bucket policy allows read/write
3. Test manual upload with AWS CLI

---

## RISK-006: Database Migration Failure (Schema Change)

**Category**: Database
**Status**: Active
**Likelihood**: MEDIUM (25%)
**Impact**: HIGH
**Risk Score**: MEDIUM-HIGH
**Priority**: P0

### Description
Schema change to `taskDetailsView` (add `preparerId` column) requires database migration. Migration could fail or cause downtime if not handled correctly.

### Impact if Realized
- Database schema inconsistent with application code
- Task queries fail (view doesn't have `preparerId`)
- Production downtime during migration
- Rollback required

### Likelihood Factors
- View alteration (not table) - lower risk than table schema change
- No data migration required (just add column to view)
- Using `pnpm db:reset` in dev (correct procedure)

### Mitigation Strategy
1. **Pre-Deploy** (Staging):
   - Test migration script on staging database
   - Verify view recreation completes successfully
   - Validate task queries work with new schema

2. **Deploy**:
   - Run migration in maintenance window (low traffic)
   - Use `pnpm db:reset` procedure (drops/recreates views)
   - Monitor migration logs for errors

3. **Post-Deploy**:
   - Validate task queries return expected results
   - Check for schema drift (drizzle-kit)

### Trigger Conditions
- View alteration fails with SQL error
- Task queries return "column does not exist" error
- Schema validation fails

### Owner
Backend Developer

### Rollback Plan
1. Revert view definition to previous version
2. Re-run `pnpm db:reset` with old schema
3. Redeploy application with old query logic

---

## RISK-007: Test Data Seed Failure

**Category**: Testing/Operations
**Status**: Active
**Likelihood**: LOW (10%)
**Impact**: LOW
**Risk Score**: LOW
**Priority**: P3

### Description
Test data seed script (`scripts/seed.ts`) may fail if schema changes are not reflected in seed data. Missing seed data causes E2E tests to fail.

### Impact if Realized
- E2E tests fail due to missing test data
- Staging environment unusable for QA
- Week 2 QA validation blocked
- 0.5 day delay to fix seed script

### Likelihood Factors
- Seed script updated during analysis (low risk)
- Schema changes require seed data updates
- Foreign key constraints must be satisfied

### Mitigation Strategy
1. **Pre-Deploy**:
   - Run `pnpm db:reset` locally to verify seed script works
   - Validate all foreign key relationships in seed data
   - Check for TypeScript errors in seed script

2. **Deploy**:
   - Run seed script in staging before E2E tests
   - Monitor seed script logs for errors

3. **Post-Deploy**:
   - Document seed data schema in `scripts/seed.ts` comments

### Trigger Conditions
- Seed script throws TypeScript error
- Foreign key constraint violations
- Test users cannot authenticate

### Owner
Backend Developer

### Rollback Plan
1. Fix seed script to match schema
2. Re-run `pnpm db:reset`
3. Verify E2E tests pass with new seed data

---

## RISK-008: Feature Flag Rollout Complexity

**Category**: Deployment
**Status**: Active
**Likelihood**: LOW (15%)
**Impact**: LOW
**Risk Score**: LOW
**Priority**: P3

### Description
Feature flag rollout (10% → 50% → 100%) for My Tasks filter adds deployment complexity. Misconfigured feature flags could cause partial outages.

### Impact if Realized
- Some users see new filter, others see old filter (inconsistent UX)
- Feature flag misconfiguration causes filter to break
- Rollback confusion (which users are on which version?)

### Likelihood Factors
- Feature flags not yet implemented (15% chance of misconfiguration)
- User segmentation logic may have bugs
- Cache invalidation issues

### Mitigation Strategy
1. **Pre-Deploy**:
   - Implement feature flag system (if not exists)
   - Test feature flag logic locally (force on/off)
   - Document rollout plan (10% → 50% → 100% over 24 hours)

2. **Deploy**:
   - Start with 10% rollout (low-risk users)
   - Monitor error rates for 1 hour before increasing to 50%
   - Full rollout only if error rate <0.1%

3. **Post-Deploy**:
   - Monitor feature flag metrics (% of users on new filter)
   - Alert if feature flag logic causes errors

### Trigger Conditions
- Error rate spikes when feature flag is increased
- Users report inconsistent task visibility
- Feature flag stuck at 10% (not increasing)

### Owner
Backend Developer + DevOps

### Rollback Plan
1. Set feature flag to 0% (disable new filter)
2. All users revert to old filter immediately
3. Investigate issue before re-enabling

---

## RISK-009: Sentry Error Tracking Misconfiguration

**Category**: Monitoring
**Status**: Active
**Likelihood**: LOW (10%)
**Impact**: MEDIUM
**Risk Score**: LOW-MEDIUM
**Priority**: P2

### Description
Sentry may not be properly configured in production (DSN missing, environment not set, error sampling too aggressive). Errors may not be tracked or alerted.

### Impact if Realized
- Critical errors go unnoticed
- No alerts for high error rates
- Delayed incident response
- Loss of debugging information

### Likelihood Factors
- Sentry integration guide exists (low risk)
- DSN must be in `.env.production` (manual setup)
- Error sampling may filter out important errors

### Mitigation Strategy
1. **Pre-Deploy**:
   - Verify Sentry DSN in `.env.production`
   - Test error capture in staging (throw test error)
   - Configure alert rules (error rate >1%)
   - Set environment tag to "production"

2. **Deploy**:
   - Trigger test error in production to verify Sentry working
   - Check Sentry dashboard shows production environment

3. **Post-Deploy**:
   - Monitor Sentry for legitimate errors
   - Verify alert notifications work

### Trigger Conditions
- No errors appear in Sentry despite known issues
- Alert notifications not received
- Sentry shows "development" environment instead of "production"

### Owner
DevOps + Backend Developer

### Rollback Plan
1. Check Sentry DSN in `.env.production`
2. Verify `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
3. Test error capture with manual error throw

---

## RISK-010: Production Deploy Rollback Complexity

**Category**: Deployment
**Status**: Active
**Likelihood**: LOW (10%)
**Impact**: HIGH
**Risk Score**: LOW-HIGH
**Priority**: P1

### Description
If production deployment fails or critical issues are discovered post-deploy, rollback may be complex due to database schema changes or S3-stored data.

### Impact if Realized
- Extended production downtime during rollback
- Data loss if schema rollback fails
- Customer-facing errors during rollback window
- Reputation damage

### Likelihood Factors
- Schema change to `taskDetailsView` (10% chance of rollback)
- No data migration (lower risk than table changes)
- S3 data persists (no rollback needed for PDFs)

### Mitigation Strategy
1. **Pre-Deploy**:
   - Document rollback procedure in rollout checklist
   - Test rollback in staging
   - Backup production database before deploy
   - Tag previous Git commit for quick revert

2. **Deploy**:
   - Use blue-green deployment (if possible)
   - Monitor SLOs for 1 hour post-deploy
   - Keep previous Docker image available

3. **Post-Deploy**:
   - If critical issue: Execute rollback within 15 minutes
   - Communicate rollback to stakeholders
   - Schedule post-mortem

### Trigger Conditions
- Critical error rate >5%
- Core workflows broken (task management, proposal signing)
- Database queries failing
- Stakeholder requests rollback

### Owner
DevOps + Engineering Lead

### Rollback Plan
1. Git revert to previous commit
2. Rebuild Docker image
3. Revert database schema (run old view definition)
4. Redeploy previous version
5. Run smoke tests to verify old behavior restored

---

## Risk Summary Table

| Risk ID | Risk Name | Likelihood | Impact | Score | Priority | Owner | Status |
|---------|-----------|------------|--------|-------|----------|-------|--------|
| **RISK-001** | My Tasks Filter Regression | MEDIUM | HIGH | MEDIUM-HIGH | P0 | Backend + QA | Active |
| **RISK-002** | Quote Data Model Ambiguity | MEDIUM | MEDIUM | MEDIUM | P1 | Product + Backend | Active |
| **RISK-003** | E2E Test Flakiness | LOW | MEDIUM | LOW-MEDIUM | P1 | QA | Active |
| **RISK-004** | DocuSeal Config Error | LOW | HIGH | LOW-HIGH | P1 | DevOps + Backend | Mitigated |
| **RISK-005** | S3/MinIO Failure | LOW | MEDIUM | LOW-MEDIUM | P2 | DevOps + Backend | Active |
| **RISK-006** | Database Migration Failure | MEDIUM | HIGH | MEDIUM-HIGH | P0 | Backend | Active |
| **RISK-007** | Test Data Seed Failure | LOW | LOW | LOW | P3 | Backend | Active |
| **RISK-008** | Feature Flag Rollout | LOW | LOW | LOW | P3 | Backend + DevOps | Active |
| **RISK-009** | Sentry Misconfiguration | LOW | MEDIUM | LOW-MEDIUM | P2 | DevOps + Backend | Active |
| **RISK-010** | Rollback Complexity | LOW | HIGH | LOW-HIGH | P1 | DevOps + Lead | Active |

### Risk Heatmap

```
Impact
HIGH   │  RISK-004   │ RISK-001  │         │
       │  RISK-010   │ RISK-006  │         │
       │─────────────┼───────────┼─────────│
MEDIUM │  RISK-005   │ RISK-002  │         │
       │  RISK-009   │ RISK-003  │         │
       │─────────────┼───────────┼─────────│
LOW    │  RISK-007   │           │         │
       │  RISK-008   │           │         │
       └─────────────┴───────────┴─────────┘
         LOW          MEDIUM       HIGH
                  Likelihood
```

### Critical Risks (P0)
- **RISK-001**: My Tasks Filter Regression
- **RISK-006**: Database Migration Failure

**Action Required**: Mitigate both risks before production deploy.

---

**Next Steps**:
1. Assign risk owners
2. Update mitigation strategies weekly
3. Monitor trigger conditions during deploy
4. Schedule risk review meeting (Week 2 Day 5)
