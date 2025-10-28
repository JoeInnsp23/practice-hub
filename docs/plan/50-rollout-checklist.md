# Rollout Checklist: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Target Environments**: Staging → Production
**Deployment Method**: Docker Compose with database migrations

---

## Pre-Flight Checklist (Before Any Deployment)

### Code Quality Gates
- [ ] All linting passed (`pnpm lint`)
- [ ] All formatting correct (`pnpm format`)
- [ ] TypeScript build successful (`pnpm build`)
- [ ] No console.log statements in production code (use Sentry)
- [ ] SQL safety validated (no `= ANY()` patterns, use `inArray()`)
- [ ] All P0 items complete (GAP-001 + TEST-001)
- [ ] All P1 items complete OR decisions deferred (DEC-002)
- [ ] Code review approved by Engineering Lead

### Test Coverage Validation
- [ ] All P0 E2E tests passing (TEST-001)
- [ ] All P1 E2E tests passing (TEST-002, TEST-003, TEST-004)
- [ ] Unit tests passing (if applicable)
- [ ] Zero P0 bugs (critical blockers)
- [ ] P1 bugs triaged and accepted by Product Manager

### Documentation Complete
- [ ] Architecture docs updated (if schema/API changes)
- [ ] Environment variable guide updated (if new vars added)
- [ ] Rollback procedure documented (see below)
- [ ] Deployment notes in Git commit message

---

## Environment Variables Validation

### Required Variables (All Environments)

**Database**:
- [ ] `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:5432/dbname`
  - Verify: `psql $DATABASE_URL -c "SELECT 1"`

**Better Auth**:
- [ ] `BETTER_AUTH_SECRET` - Auth secret key (32+ chars)
  - Generate: `openssl rand -base64 32`
  - Verify: Length ≥32 characters
- [ ] `BETTER_AUTH_URL` - Backend URL (e.g., `https://app.example.com`)
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` - Frontend URL (same as above)
- [ ] `NODE_ENV` - Set to `production`

**Object Storage (S3/MinIO)**:
- [ ] `S3_ENDPOINT` - S3 endpoint URL
  - Local: `http://localhost:9000`
  - Production: Hetzner S3 endpoint
- [ ] `S3_ACCESS_KEY_ID` - S3 access key
- [ ] `S3_SECRET_ACCESS_KEY` - S3 secret key
- [ ] `S3_BUCKET_NAME` - S3 bucket name (e.g., `practice-hub-prod`)
- [ ] `S3_REGION` - S3 region (e.g., `eu-central`)

**DocuSeal Integration**:
- [ ] `DOCUSEAL_HOST` - DocuSeal instance URL
  - Local: `http://localhost:3030`
  - Production: DocuSeal production URL
- [ ] `DOCUSEAL_API_KEY` - From DocuSeal Admin UI (Settings → API Keys)
- [ ] `DOCUSEAL_SECRET_KEY` - Generate: `openssl rand -base64 32`
- [ ] `DOCUSEAL_WEBHOOK_SECRET` - Same secret in both app and DocuSeal webhook settings

**Sentry Error Tracking**:
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry project DSN
- [ ] `NEXT_PUBLIC_SENTRY_ENVIRONMENT` - Set to `production`
- [ ] `SENTRY_AUTH_TOKEN` - For source map upload (optional)
- [ ] `SENTRY_ORG` - Sentry organization slug
- [ ] `SENTRY_PROJECT` - Sentry project slug

### Verification Steps
```bash
# 1. Check all required vars are set
env | grep -E '(DATABASE_URL|BETTER_AUTH|S3_|DOCUSEAL|SENTRY)' | wc -l
# Expected: 16 variables

# 2. Test database connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Test S3 connection
aws s3 ls s3://$S3_BUCKET_NAME --endpoint-url=$S3_ENDPOINT

# 4. Test DocuSeal connection
curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" $DOCUSEAL_HOST/api/submissions
```

---

## Database Migration Checklist

### Pre-Migration Backup
- [ ] Backup production database:
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verify backup file size >0 bytes
- [ ] Store backup in secure location (S3 or local)

### Schema Migration (Development - NO MIGRATIONS)
**IMPORTANT**: Database is in development. NO migration files. Direct schema updates only.

- [ ] Update schema in `lib/db/schema.ts` directly
- [ ] Run `pnpm db:reset` to apply schema changes:
  ```bash
  pnpm db:reset
  # This command:
  # 1. Drops and recreates schema
  # 2. Pushes schema (creates tables)
  # 3. Runs migrations (creates views from drizzle/*.sql)
  # 4. Seeds database
  ```
- [ ] Verify seed data matches new schema
- [ ] Update `scripts/seed.ts` if schema changes affect seed data

### Schema Validation
- [ ] Run `pnpm db:push` to check for schema drift
- [ ] No schema drift warnings
- [ ] All views created successfully (check `taskDetailsView` has `preparerId`)
- [ ] Foreign key constraints valid

---

## Staging Deployment Checklist

### Pre-Staging
- [ ] Merge feature branch to `main` (or staging branch)
- [ ] Tag commit: `git tag -a staging-v1.0.0 -m "Staging deploy"`
- [ ] Push tag: `git push origin staging-v1.0.0`

### Staging Deploy Steps
1. **Pull latest code**:
   ```bash
   git pull origin main
   git checkout staging-v1.0.0
   ```

2. **Environment setup**:
   ```bash
   cp .env.staging .env.local  # If using separate staging env
   # Verify all environment variables
   ```

3. **Database setup**:
   ```bash
   pnpm db:reset  # Staging database
   # Verify seed data created
   ```

4. **Build application**:
   ```bash
   pnpm install
   pnpm build
   ```

5. **Start services**:
   ```bash
   docker compose up -d  # PostgreSQL, MinIO, DocuSeal
   pnpm start            # Next.js production server
   ```

6. **Smoke tests** (see below)

### Staging Smoke Tests
- [ ] **Authentication**: Sign in with test user
- [ ] **Client Hub**: View task list, My Tasks filter shows correct tasks
- [ ] **Proposal Hub**: Create proposal, generate PDF, verify S3 upload
- [ ] **DocuSeal**: Send proposal for signature, verify submission created
- [ ] **Client Portal**: Sign in as client, view onboarding checklist
- [ ] **Time Tracking**: Create timesheet, submit for approval
- [ ] **Error Tracking**: Trigger test error, verify Sentry capture

### Staging Validation (1 Hour Monitoring)
- [ ] No critical errors in Sentry (first hour)
- [ ] Task query performance <500ms p95
- [ ] Proposal PDF generation success rate >95%
- [ ] DocuSeal webhook events received correctly
- [ ] S3 upload success rate >99%

---

## Production Deployment Checklist

### Pre-Production Gates (Go/No-Go)
- [ ] All staging smoke tests passed
- [ ] Stakeholder approval obtained (Product Manager + Engineering Lead)
- [ ] Zero P0 bugs in staging
- [ ] P1 bugs triaged and accepted
- [ ] Rollback plan documented and tested
- [ ] On-call rotation scheduled (24 hours post-deploy)

### Production Deploy Steps

#### 1. Pre-Deploy Communication
- [ ] Notify team in Slack: "Production deploy starting"
- [ ] Notify users if downtime expected (maintenance window)
- [ ] Set status page to "Maintenance" (if applicable)

#### 2. Backup Production Database
```bash
pg_dump $DATABASE_URL > backup_prod_$(date +%Y%m%d_%H%M%S).sql
# Store in S3
aws s3 cp backup_prod_*.sql s3://backups/practice-hub/
```

#### 3. Deploy Application
**Option A: Docker Compose (Simple)**
```bash
# 1. Pull latest code
git pull origin main
git checkout v1.0.0  # Production release tag

# 2. Build Docker image
docker compose build

# 3. Stop old containers
docker compose down

# 4. Start new containers
docker compose up -d

# 5. Run database migrations (if schema changed)
docker compose exec app pnpm db:reset
```

**Option B: Blue-Green Deployment (Zero Downtime)**
```bash
# 1. Deploy to green environment
docker compose -f docker-compose.green.yml up -d

# 2. Run smoke tests on green
# ... (see smoke tests below)

# 3. Switch traffic to green (reverse proxy/load balancer)
# ... (update nginx/traefik config)

# 4. Keep blue running for 1 hour (rollback window)
# ... (monitor SLOs)

# 5. Stop blue if all green
docker compose -f docker-compose.blue.yml down
```

#### 4. Post-Deploy Smoke Tests (Production)
- [ ] **Authentication**: Sign in with real user account
- [ ] **Client Hub**: View task list, My Tasks filter correct
- [ ] **Proposal Hub**: Create test proposal, generate PDF
- [ ] **DocuSeal**: Verify API connectivity (don't send test signatures)
- [ ] **Client Portal**: Sign in as client, verify isolation
- [ ] **Error Tracking**: Check Sentry for errors (should be 0)

#### 5. SLO Validation (1 Hour Post-Deploy)
Monitor for 1 hour, validate SLOs:
- [ ] **Task Query Performance**: <500ms p95
- [ ] **Error Rate**: <1% for all operations
- [ ] **Proposal PDF Generation**: <5 seconds p95
- [ ] **DocuSeal API**: <1% error rate
- [ ] **S3 Upload Success**: >99%

#### 6. Post-Deploy Communication
- [ ] Notify team in Slack: "Production deploy complete"
- [ ] Update status page to "Operational"
- [ ] Post deploy summary (metrics, issues, next steps)

---

## Feature Flag Rollout (My Tasks Filter)

### Gradual Rollout Strategy
**If implementing feature flags for GAP-001 (My Tasks filter)**:

1. **10% Rollout** (First 1 hour):
   - Enable for 10% of users (low-risk segment)
   - Monitor error rate, task visibility
   - Alert if error rate >0.5%

2. **50% Rollout** (After 1 hour, if no issues):
   - Enable for 50% of users
   - Monitor for another hour
   - Alert if error rate >0.5%

3. **100% Rollout** (After 2 hours, if no issues):
   - Enable for all users
   - Continue monitoring for 24 hours
   - Remove feature flag code after 1 week stability

### Rollout Validation
- [ ] Feature flag implemented correctly
- [ ] User segmentation logic works
- [ ] Metrics dashboard shows % of users on new filter
- [ ] Rollback plan: Set feature flag to 0% (instant revert)

---

## Rollback Procedure

### When to Rollback
Trigger rollback if any of these conditions occur:
- **Critical error rate** >5% (first hour)
- **Core workflows broken**: Task management, proposal signing, authentication
- **Database queries failing** (schema incompatibility)
- **Stakeholder requests rollback** (business decision)
- **Sentry alerts**: High error volume (>100 errors/minute)

### Rollback Steps (15 Minute Target)

#### 1. Immediate Actions
- [ ] Stop new deployments
- [ ] Notify team in Slack: "Rollback initiated"
- [ ] Set status page to "Investigating"

#### 2. Application Rollback
```bash
# 1. Revert to previous Git commit
git revert HEAD  # Or: git checkout <previous-tag>

# 2. Rebuild Docker image
docker compose build

# 3. Stop current containers
docker compose down

# 4. Start previous version
docker compose up -d
```

#### 3. Database Rollback (if schema changed)
```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql

# 2. Verify schema matches application code
pnpm db:push  # Should show no drift
```

#### 4. Verify Rollback
- [ ] Run smoke tests on rolled-back version
- [ ] Check Sentry for errors (should drop to baseline)
- [ ] Validate SLOs are green

#### 5. Post-Rollback Communication
- [ ] Notify team in Slack: "Rollback complete"
- [ ] Update status page to "Operational"
- [ ] Schedule post-mortem (within 24 hours)

---

## Post-Deployment Monitoring (24 Hours)

### Monitoring Dashboards
- **Sentry**: `https://sentry.io/organizations/<org>/issues/`
  - Watch for new errors
  - Alert threshold: >10 errors/hour
- **Application Logs**: `docker compose logs -f app`
  - Watch for ERROR level logs
  - Alert threshold: >5 errors/minute
- **Database**: PostgreSQL slow query log
  - Watch for queries >1 second
  - Alert threshold: >10 slow queries/hour

### SLO Monitoring Checklist
- [ ] **Hour 1**: Check SLOs every 15 minutes
- [ ] **Hour 2-6**: Check SLOs every hour
- [ ] **Hour 6-24**: Check SLOs every 4 hours
- [ ] **Day 2-7**: Check SLOs daily

### On-Call Rotation (First 24 Hours)
- **Primary On-Call**: Backend Developer
- **Secondary On-Call**: DevOps Engineer
- **Escalation**: Engineering Lead

**Escalation Thresholds**:
- **P0 (Critical)**: Core workflows broken → Page primary immediately
- **P1 (High)**: Important features degraded → Notify within 30 minutes
- **P2 (Medium)**: Minor issues → File ticket, address in next sprint

---

## Deployment Checklist Summary

### Staging Deploy (Week 2 Day 9)
- [ ] Pre-flight checks (code quality, tests, docs)
- [ ] Environment variables validated
- [ ] Database backup + migration
- [ ] Deploy to staging
- [ ] Smoke tests passed
- [ ] 1 hour SLO validation

### Production Deploy (Week 3 Day 11)
- [ ] Go/no-go approval
- [ ] Pre-deploy communication
- [ ] Database backup
- [ ] Deploy application (Docker Compose or blue-green)
- [ ] Post-deploy smoke tests
- [ ] 1 hour SLO validation
- [ ] Post-deploy communication
- [ ] 24 hour monitoring

### Rollback (If Needed)
- [ ] Trigger conditions met (error rate >5%)
- [ ] Revert Git commit
- [ ] Rebuild + redeploy
- [ ] Restore database (if schema changed)
- [ ] Verify rollback with smoke tests
- [ ] Post-rollback communication

---

## Deployment Roles & Responsibilities

| Role | Responsibilities | Contact |
|------|------------------|---------|
| **Backend Developer** | Code changes, database migrations, bug fixes | TBD |
| **DevOps Engineer** | Infrastructure, Docker, environment setup | TBD |
| **QA Engineer** | Smoke tests, regression testing, bug triage | TBD |
| **Product Manager** | Go/no-go approval, stakeholder communication | TBD |
| **Engineering Lead** | Final approval, incident response, post-mortem | TBD |

---

**Next Steps**:
1. Review this checklist with team (Week 2 Day 3)
2. Practice rollback procedure in staging (Week 2 Day 4)
3. Assign deployment roles (Week 2 Day 5)
4. Schedule production deploy (Week 3 Day 11, 8am)
