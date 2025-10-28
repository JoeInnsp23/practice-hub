# Telemetry & Monitoring: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Monitoring Tools**: Sentry (errors), Application Logs (Docker), PostgreSQL (query performance)
**Target**: 99.9% uptime (8.76 hours downtime/year)

---

## Service Level Objectives (SLOs)

### SLO-001: Task List Query Performance
**Objective**: Task list queries complete in <500ms (p95)

**Measurement**:
- **Metric**: Task query latency (from query start to result return)
- **Target**: p95 <500ms, p50 <200ms
- **Measurement Method**: Application logs with timing, Sentry performance monitoring

**Why This Matters**:
- Task management is core workflow
- Slow queries block user productivity
- GAP-001 (My Tasks filter) adds OR logic (potential performance impact)

**Alerting**:
- **Warning**: p95 >500ms for 5 consecutive minutes
- **Critical**: p95 >1000ms for 2 consecutive minutes

**Dashboard**:
- Query latency histogram (p50, p95, p99)
- Query count per minute
- Slow query log (>1 second)

---

### SLO-002: Task Filter Accuracy
**Objective**: My Tasks filter returns 100% correct results (no missing tasks, no duplicates)

**Measurement**:
- **Metric**: Task filter correctness (manual validation + E2E tests)
- **Target**: 100% accuracy (no false negatives, no false positives)
- **Measurement Method**: E2E test suite (TEST-001), user feedback

**Why This Matters**:
- GAP-001 changes filter from single-field to OR across 3 fields
- Filter regression causes users to lose visibility into their tasks
- Core workflow blocker if filter is wrong

**Alerting**:
- **Critical**: E2E test TEST-001 fails (filter returns wrong results)
- **Critical**: User reports "I can't see my tasks"

**Validation Steps** (Post-Deploy):
1. Run TEST-001 (My Tasks filter) in production
2. Manually verify 3 test users see correct tasks
3. Monitor customer support for task visibility complaints

---

### SLO-003: Error Rate for Task Operations
**Objective**: Task operations (create, update, delete, query) have <1% error rate

**Measurement**:
- **Metric**: Task operation error rate (errors / total operations)
- **Target**: <1% error rate (<10 errors per 1000 operations)
- **Measurement Method**: Sentry error tracking, application logs

**Why This Matters**:
- Task management is core workflow
- High error rate blocks user productivity
- Schema changes (GAP-001) may introduce bugs

**Alerting**:
- **Warning**: Error rate >1% for 5 consecutive minutes
- **Critical**: Error rate >5% for 2 consecutive minutes

**Dashboard**:
- Error count per minute
- Error rate trend (7-day moving average)
- Top 5 errors by frequency

---

### SLO-004: Proposal PDF Generation Performance
**Objective**: Proposal PDFs generate in <5 seconds (p95)

**Measurement**:
- **Metric**: PDF generation latency (from mutation call to S3 upload complete)
- **Target**: p95 <5 seconds, p50 <3 seconds
- **Measurement Method**: Application logs with timing, Sentry performance monitoring

**Why This Matters**:
- Proposal PDF generation is critical for DocuSeal signing flow
- Slow generation blocks sales process
- S3 upload may fail (network issues)

**Alerting**:
- **Warning**: p95 >5 seconds for 5 consecutive minutes
- **Critical**: PDF generation failure rate >5%

**Dashboard**:
- PDF generation latency histogram (p50, p95, p99)
- PDF generation success rate (should be >95%)
- S3 upload error rate

---

### SLO-005: DocuSeal API Availability
**Objective**: DocuSeal API calls succeed with <1% error rate

**Measurement**:
- **Metric**: DocuSeal API error rate (errors / total API calls)
- **Target**: <1% error rate
- **Measurement Method**: Sentry error tracking, DocuSeal API logs

**Why This Matters**:
- DocuSeal integration is critical for proposal signing
- API failures block signing workflow
- External dependency (may have outages)

**Alerting**:
- **Warning**: Error rate >1% for 5 consecutive minutes
- **Critical**: Error rate >10% (DocuSeal likely down)

**Dashboard**:
- DocuSeal API error count per minute
- DocuSeal API latency (p95)
- Webhook event delivery success rate

---

### SLO-006: Authentication Success Rate
**Objective**: User authentication succeeds with >99% success rate

**Measurement**:
- **Metric**: Authentication success rate (successful logins / total attempts)
- **Target**: >99% success rate
- **Measurement Method**: Better Auth logs, Sentry error tracking

**Why This Matters**:
- Authentication is gateway to application
- Auth failures block all workflows
- Better Auth session management must be stable

**Alerting**:
- **Warning**: Success rate <99% for 5 consecutive minutes
- **Critical**: Success rate <95% (auth likely broken)

**Dashboard**:
- Login success rate per minute
- Failed login reasons (wrong password, user not found, session expired)
- Session duration histogram

---

## Alerts Configuration

### Sentry Alerts

#### Alert 1: High Error Rate (Critical)
**Trigger**: >50 errors in 5 minutes
**Channels**: Slack #engineering-alerts, Email (on-call engineer)
**Action**:
1. Check Sentry dashboard for error types
2. If critical (task queries failing): Trigger rollback
3. If non-critical: File P1 bug, fix in next deploy

#### Alert 2: Task Query Failure (Critical)
**Trigger**: Task query error with message "column does not exist"
**Channels**: Slack #engineering-alerts, Email (on-call engineer)
**Action**:
1. Schema migration likely failed
2. Check database schema: `psql $DATABASE_URL -c "\d taskDetailsView"`
3. If `preparerId` missing: Re-run `pnpm db:reset`
4. If error persists: Trigger rollback

#### Alert 3: DocuSeal API Failure (High)
**Trigger**: >10 DocuSeal API errors in 5 minutes
**Channels**: Slack #engineering-alerts
**Action**:
1. Check DocuSeal API status (health endpoint)
2. Verify API key valid (test with curl)
3. If DocuSeal down: Notify users, wait for recovery
4. If API key invalid: Update `.env.production` and redeploy

#### Alert 4: S3 Upload Failure (Medium)
**Trigger**: >5 S3 upload errors in 5 minutes
**Channels**: Slack #engineering-alerts
**Action**:
1. Check S3 credentials in `.env.production`
2. Verify bucket policy allows uploads
3. Test manual upload: `aws s3 cp test.pdf s3://$S3_BUCKET_NAME/test.pdf`
4. If credentials invalid: Update and redeploy

#### Alert 5: Authentication Failure Spike (High)
**Trigger**: >50 failed logins in 5 minutes
**Channels**: Slack #engineering-alerts
**Action**:
1. Check if brute force attack (same username/IP)
2. If attack: Enable rate limiting (Better Auth config)
3. If legitimate: Check Better Auth session management

---

## Dashboards

### Dashboard 1: Production Health Overview
**Tool**: Sentry Dashboard (or custom metrics dashboard)

**Widgets**:
1. **Error Rate** (last 24 hours):
   - Line chart: Errors per minute
   - Target line: <10 errors/minute

2. **Task Query Performance** (last 24 hours):
   - Histogram: Query latency (p50, p95, p99)
   - Target line: p95 <500ms

3. **Proposal PDF Generation** (last 24 hours):
   - Line chart: PDF generation success rate
   - Target line: >95%

4. **DocuSeal API** (last 24 hours):
   - Line chart: API error rate
   - Target line: <1%

5. **Authentication** (last 24 hours):
   - Line chart: Login success rate
   - Target line: >99%

**Purpose**: Quick overview of production health, check during on-call shifts

---

### Dashboard 2: Task Management Deep Dive
**Tool**: Application logs + Sentry

**Widgets**:
1. **My Tasks Filter Performance**:
   - Query latency histogram (split by role: assignedTo, preparer, reviewer)
   - Query count per minute (split by filter type)

2. **Task Query Errors**:
   - Top 5 errors by frequency
   - Error stack traces

3. **Task Operations**:
   - Create/update/delete success rate
   - Operation latency (p95)

**Purpose**: Monitor GAP-001 (My Tasks filter) post-deploy, detect regressions

---

### Dashboard 3: Proposal Hub & DocuSeal
**Tool**: Application logs + Sentry + DocuSeal logs

**Widgets**:
1. **Proposal Creation**:
   - Proposals created per minute
   - Proposal creation error rate

2. **PDF Generation**:
   - PDF generation latency (p95)
   - PDF generation success rate
   - S3 upload error rate

3. **DocuSeal Integration**:
   - DocuSeal API calls per minute
   - DocuSeal API error rate
   - Webhook events received per minute

**Purpose**: Monitor proposal signing flow, detect DocuSeal integration issues

---

### Dashboard 4: Infrastructure & Performance
**Tool**: Docker logs + PostgreSQL logs

**Widgets**:
1. **Database Performance**:
   - Active connections
   - Slow queries (>1 second)
   - Query cache hit rate

2. **Docker Containers**:
   - Container CPU usage
   - Container memory usage
   - Container restart count

3. **S3/MinIO**:
   - S3 upload/download rate (MB/s)
   - S3 error rate
   - Object count in bucket

**Purpose**: Monitor infrastructure health, detect resource bottlenecks

---

## Monitoring Schedule

### First Hour Post-Deploy (Intensive)
**Check every 15 minutes**:
- [ ] Sentry dashboard (error rate <10/minute)
- [ ] Task query performance (p95 <500ms)
- [ ] DocuSeal API (error rate <1%)
- [ ] Authentication (success rate >99%)

### Hours 2-6 Post-Deploy (Active)
**Check every hour**:
- [ ] Production Health Overview dashboard
- [ ] No critical alerts triggered
- [ ] SLO validation (all green)

### Hours 6-24 Post-Deploy (Monitoring)
**Check every 4 hours**:
- [ ] Production Health Overview dashboard
- [ ] Review Sentry errors (file bugs for P1/P2 issues)

### Days 2-7 Post-Deploy (Stable)
**Check daily**:
- [ ] Production Health Overview dashboard
- [ ] Weekly SLO report (all targets met?)
- [ ] Review customer support tickets (task visibility complaints?)

---

## Logging Strategy

### Application Logs (Docker)

**What to Log**:
1. **Task Queries** (INFO level):
   ```typescript
   logger.info("Task query executed", {
     userId,
     filter: "myTasks",
     resultCount: tasks.length,
     latency: performance.now() - startTime,
   });
   ```

2. **Errors** (ERROR level - use Sentry):
   ```typescript
   try {
     await taskQuery();
   } catch (error) {
     Sentry.captureException(error, {
       tags: { operation: "taskQuery", filter: "myTasks" },
       extra: { userId, tenantId },
     });
     throw error;
   }
   ```

3. **Slow Queries** (WARN level):
   ```typescript
   if (latency > 500) {
     logger.warn("Slow task query", {
       userId,
       latency,
       query: "myTasks",
     });
   }
   ```

**Log Format**:
- **Timestamp**: ISO 8601 format
- **Level**: INFO, WARN, ERROR
- **Message**: Human-readable description
- **Context**: userId, tenantId, operation, latency

**Log Retention**:
- **Docker logs**: 7 days (rotate daily)
- **Sentry**: 90 days
- **PostgreSQL slow query log**: 30 days

---

### Database Logs (PostgreSQL)

**Slow Query Logging**:
```sql
-- Enable slow query logging (queries >500ms)
ALTER SYSTEM SET log_min_duration_statement = 500;
SELECT pg_reload_conf();
```

**What to Log**:
- All queries taking >500ms
- Query duration
- Query text (with parameters)

**Log Location**: `/var/lib/postgresql/data/log/postgresql-*.log`

**Analysis**:
```bash
# Find top 10 slowest queries
grep "duration:" /var/lib/postgresql/data/log/postgresql-*.log \
  | sort -t: -k4 -rn | head -10
```

---

## Incident Response Playbook

### Incident 1: My Tasks Filter Returns Empty Results

**Symptoms**:
- Users report "I can't see my tasks"
- TEST-001 E2E test fails
- Task query returns 0 results (but tasks exist in database)

**Investigation**:
1. Check Sentry for task query errors
2. Verify database schema: `psql $DATABASE_URL -c "\d taskDetailsView"`
3. Check if `preparerId` column exists in view
4. Run query manually: `SELECT * FROM taskDetailsView WHERE assignedToId = '<userId>'`

**Root Causes**:
- Schema migration failed (`preparerId` not added to view)
- Query logic incorrect (missing OR clause)
- Database permissions issue (view not accessible)

**Resolution**:
- If schema issue: Re-run `pnpm db:reset`
- If query issue: Rollback to previous version
- If permissions: Grant SELECT on view to app user

**Prevention**:
- Add E2E test (TEST-001) to catch this before deploy
- Validate schema in staging before production

---

### Incident 2: DocuSeal API Errors (>10% Error Rate)

**Symptoms**:
- Proposal signing fails
- Sentry alerts: "DocuSeal API call failed"
- Users cannot send proposals for signature

**Investigation**:
1. Check DocuSeal health endpoint: `curl $DOCUSEAL_HOST/health`
2. Test API with curl:
   ```bash
   curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" \
     $DOCUSEAL_HOST/api/submissions
   ```
3. Check DocuSeal logs (if self-hosted): `docker compose logs docuseal`

**Root Causes**:
- DocuSeal API key expired or invalid
- DocuSeal service down (Docker container crashed)
- Network connectivity issue (firewall blocking)

**Resolution**:
- If API key invalid: Regenerate in DocuSeal Admin UI, update `.env.production`
- If service down: Restart DocuSeal container: `docker compose restart docuseal`
- If network issue: Check firewall rules, test connectivity

**Prevention**:
- Set up DocuSeal health check monitoring
- Alert if DocuSeal container restarts
- Rotate API keys quarterly (with reminder)

---

### Incident 3: High Error Rate (>50 Errors/Minute)

**Symptoms**:
- Sentry alert: "High error rate"
- Users report "Something went wrong" errors
- Multiple workflows broken

**Investigation**:
1. Check Sentry dashboard for top errors
2. Identify error pattern (all errors same type vs diverse)
3. Check deployment timeline (did deploy just happen?)

**Root Causes**:
- Recent deployment introduced bugs
- Database connection pool exhausted
- External service outage (DocuSeal, S3)

**Resolution**:
- If deploy-related: Trigger rollback immediately
- If database: Restart app to reset connection pool
- If external service: Wait for recovery, notify users

**Prevention**:
- Add pre-deploy smoke tests (catch bugs before production)
- Implement circuit breaker for external services
- Monitor deployment error rates (rollback if >5% spike)

---

## SLO Reporting

### Weekly SLO Report (Email to Stakeholders)

**Format**:
```
Subject: Weekly SLO Report (Week of 2025-10-27)

SLO Summary:
✅ Task Query Performance: p95 = 420ms (target <500ms)
✅ Error Rate: 0.3% (target <1%)
✅ PDF Generation: p95 = 3.2s (target <5s)
✅ DocuSeal API: 99.8% success rate (target >99%)
✅ Authentication: 99.9% success rate (target >99%)

Incidents:
- None

Action Items:
- None

Next Week Focus:
- Monitor My Tasks filter performance post-deploy
```

**Recipients**: Product Manager, Engineering Lead, Stakeholders

**Frequency**: Weekly (every Monday)

---

**Next Steps**:
1. Set up Sentry project and configure alerts
2. Create production health dashboard (Sentry or custom)
3. Test alert notifications (trigger test error)
4. Document incident response playbook (expand for other scenarios)
5. Schedule weekly SLO review meeting (every Monday)
