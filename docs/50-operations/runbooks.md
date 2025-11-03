# Operational Runbooks

This document provides step-by-step procedures for common operational tasks, troubleshooting, and maintenance activities for the Practice Hub application.

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Maintenance](#weekly-maintenance)
3. [Troubleshooting Guides](#troubleshooting-guides)
4. [Emergency Procedures](#emergency-procedures)
5. [Support Escalation](#support-escalation)

---

## Daily Operations

### Morning Health Check (5 minutes)

**Frequency**: Every business day at 9:00 AM

**Steps**:
1. **Check Application Status**
   ```bash
   # Access the application
   https://app.innspiredaccountancy.com

   # Expected: Login page loads in < 2s
   ```

2. **Verify Core Services**
   - [ ] Application loads successfully
   - [ ] Can sign in with test account
   - [ ] Dashboard renders correctly
   - [ ] No browser console errors

3. **Review Error Logs** (if monitoring tool available)
   - Check for error spikes in last 24 hours
   - Review any critical or high-severity errors
   - Note any recurring patterns

4. **Check Third-Party Services**
   - [ ] **LEM Verify**: Check webhook delivery logs
   - [ ] **Resend**: Check email delivery success rate
   - [ ] **Hetzner S3**: Verify bucket accessibility

5. **Database Health**
   ```sql
   -- Connect to database and run:
   SELECT COUNT(*) as total_users FROM users;
   SELECT COUNT(*) as pending_kyc FROM kyc_verifications WHERE status = 'pending';
   SELECT COUNT(*) as failed_kyc FROM kyc_verifications WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours';
   ```

**Expected Results**:
- Application responds within 2 seconds
- No critical errors in logs
- Database queries return results successfully
- Third-party services operational

**If Issues Found**: Follow relevant troubleshooting guide below

---

### KYC Queue Review (10 minutes)

**Frequency**: Twice daily (10:00 AM, 3:00 PM)

**Steps**:
1. **Access Admin KYC Review Page**
   ```
   https://app.innspiredaccountancy.com/admin/kyc-review
   ```

2. **Review Pending Verifications**
   - Check number of verifications awaiting manual review
   - Note any verifications older than 24 hours
   - Review AML alert cases

3. **Process Manual Reviews** (per verification):
   ```
   a. Click on verification record
   b. Review client details
   c. Check document verification results
   d. Review AML screening results
   e. Make decision: Approve or Reject
   f. If rejecting, provide clear reason
   ```

4. **Check Auto-Approval Status**
   ```sql
   -- Verifications that should auto-approve but haven't:
   SELECT id, client_ref, status, outcome, aml_result, created_at, updated_at
   FROM kyc_verifications
   WHERE outcome = 'pass'
     AND aml_status = 'clear'
     AND status != 'approved'
     AND created_at > NOW() - INTERVAL '48 hours';
   ```

**Expected Results**:
- Pending queue < 10 items
- No verifications older than 48 hours without review
- Auto-approvals processing correctly

**If Issues Found**: See [KYC Auto-Approval Not Working](#kyc-auto-approval-not-working)

---

### Email Delivery Monitoring (3 minutes)

**Frequency**: Daily at 11:00 AM

**Steps**:
1. **Access Resend Dashboard**
   ```
   https://resend.com/dashboard
   ```

2. **Check Last 24 Hours**
   - Total emails sent
   - Delivery success rate (target: > 98%)
   - Bounce rate (target: < 2%)
   - Any failed deliveries

3. **Review Bounce/Complaint Logs**
   - Note any patterns (specific domains, email addresses)
   - Check for spam folder issues

4. **Test Email Delivery** (weekly)
   ```
   Trigger a test KYC completion email to your own address
   Verify it arrives within 1 minute
   ```

**Expected Results**:
- Delivery rate > 98%
- No bounces from critical system emails
- Test email received successfully

**If Issues Found**: See [Email Delivery Failures](#email-delivery-failures)

---

### Automated Proposal Expiration (Daily)

**Frequency**: Daily at 2:00 AM UTC (automated cron job)

**What It Does**:
- Automatically finds proposals where the `validUntil` date has passed
- Updates proposal status from current state to `expired`
- Creates activity log entries for audit trail
- Sends team email notifications for each expired proposal

**Cron Job Setup**:

This job is triggered by an external cron service. Choose one of the following options:

**Option 1: Upstash Cron (Recommended for Production)**
```
URL: https://yourdomain.com/api/cron/expire-proposals
Method: POST
Schedule: 0 2 * * * (Daily at 2 AM UTC)
Headers:
  Authorization: Bearer ${CRON_SECRET}
```

**Option 2: Vercel Cron**
```json
// Add to vercel.json in project root
{
  "crons": [{
    "path": "/api/cron/expire-proposals",
    "schedule": "0 2 * * *"
  }]
}
```

**Option 3: System Cron (Coolify/VPS)**
```bash
# Add to server crontab: crontab -e
0 2 * * * curl -X POST https://yourdomain.com/api/cron/expire-proposals \
  -H "Authorization: Bearer your-cron-secret" \
  >> /var/log/expire-proposals-cron.log 2>&1
```

**Manual Testing (Development)**:
```bash
# Development only (no auth required for GET)
curl http://localhost:3000/api/cron/expire-proposals

# Production testing (requires CRON_SECRET)
curl -X POST https://yourdomain.com/api/cron/expire-proposals \
  -H "Authorization: Bearer your-cron-secret"
```

**Expected Response**:
```json
{
  "success": true,
  "expiredCount": 3,
  "processedCount": 3,
  "errors": [],
  "timestamp": "2025-01-20T02:00:00.000Z"
}
```

**Monitoring**:

1. **Check Sentry for Errors**:
   - Search for tag: `operation:cron_expire_proposals`
   - Review any exceptions or warnings
   - Common tags:
     - `error_type:email_send_failed` - Email notification failed (non-critical)
     - `error_type:proposal_expiration_failed` - Individual proposal failed
     - `error_type:job_fatal_error` - Entire job crashed

2. **Review Team Email Notifications**:
   - Check team inbox for "Proposal Signature Expired" emails
   - Each email indicates a proposal has been automatically expired
   - Follow up with clients as recommended in the email

3. **Database Verification**:
   ```sql
   -- Count expired proposals in last 24 hours
   SELECT COUNT(*) as expired_today
   FROM proposals
   WHERE status = 'expired'
     AND updated_at > NOW() - INTERVAL '24 hours';

   -- View recent expiration activity logs
   SELECT al.created_at, al.entity_id, p.proposal_number, p.valid_until
   FROM activity_logs al
   JOIN proposals p ON al.entity_id = p.id
   WHERE al.entity_type = 'proposal'
     AND al.action = 'status_changed'
     AND al.new_values->>'status' = 'expired'
     AND al.created_at > NOW() - INTERVAL '7 days'
   ORDER BY al.created_at DESC
   LIMIT 10;
   ```

**Troubleshooting**:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| 401 Unauthorized | CRON_SECRET mismatch | Verify environment variable matches cron service header |
| 500 Internal Server Error | Database connection failed | Check Sentry for stack trace, verify database is running |
| No proposals expiring | No proposals past validUntil | Normal - verify with database query above |
| Emails not sending | Resend API key issue | Check Resend dashboard for delivery logs |
| Partial failures in response | Individual proposal errors | Check `errors` array in response, review Sentry |

**Environment Variable Required**:
```bash
# .env.local or production environment
CRON_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
```

**Idempotency**:
- The job is safe to run multiple times
- Already-expired proposals are skipped (won't create duplicate logs)
- Safe to retry after failures

**Expected Results**:
- Job runs successfully every day at 2 AM UTC
- Proposals past their `validUntil` date are marked as expired
- Team receives email notifications for follow-up
- Activity logs track all automated expirations
- Zero or minimal errors in Sentry

---

## Weekly Maintenance

### Database Maintenance (15 minutes)

**Frequency**: Weekly on Sunday at 2:00 AM

**Steps**:
1. **Vacuum and Analyze**
   ```sql
   VACUUM ANALYZE;
   ```

2. **Check Database Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('practice_hub')) as database_size;
   ```

3. **Review Slow Queries**
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **Check Index Health**
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
     AND schemaname = 'public';
   ```

**Expected Results**:
- Database size growing predictably
- No queries with mean_exec_time > 500ms
- All indexes being used (idx_scan > 0)

---

### Backup Verification (10 minutes)

**Frequency**: Weekly on Sunday at 3:00 AM

**Steps**:
1. **Verify Latest Backup Exists**
   ```bash
   # Check backup location (adjust for your setup)
   ls -lh /backups/practice-hub/ | head -5
   ```

2. **Test Backup Restore** (monthly)
   ```bash
   # Restore to test database
   pg_restore -d practice_hub_test /backups/practice-hub/latest.dump
   ```

3. **Verify S3 Bucket Backup**
   - Check Hetzner S3 console
   - Verify objects count matches expectations
   - Check versioning enabled (if configured)

**Expected Results**:
- Backup file exists and is recent (< 24 hours old)
- Backup size is reasonable (matches database size)
- Test restore completes successfully

**If Issues Found**: See [Backup Failures](#backup-failures)

---

### Security Review (20 minutes)

**Frequency**: Weekly on Monday at 10:00 AM

**Steps**:
1. **Review Activity Logs**
   ```sql
   -- High-privilege actions in last week
   SELECT user_name, action, entity_type, created_at
   FROM activity_logs
   WHERE action IN ('user_deleted', 'role_changed', 'client_deleted')
     AND created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC;
   ```

2. **Check Failed Login Attempts**
   ```sql
   -- Multiple failed logins from same IP
   SELECT metadata->>'ip_address' as ip, COUNT(*) as failures
   FROM activity_logs
   WHERE action = 'login_failed'
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY metadata->>'ip_address'
   HAVING COUNT(*) > 5
   ORDER BY failures DESC;
   ```

3. **Review Webhook Signature Failures**
   ```sql
   -- Webhook signature validation failures
   SELECT COUNT(*), metadata->>'source'
   FROM activity_logs
   WHERE action = 'webhook_signature_invalid'
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY metadata->>'source';
   ```

4. **Check User Permissions**
   ```sql
   -- Users with admin role
   SELECT id, email, role, created_at
   FROM users
   WHERE role IN ('admin')
   ORDER BY created_at DESC;
   ```

**Expected Results**:
- No unusual admin actions
- Failed login attempts < 20 per day
- No webhook signature failures
- Admin user count matches expectations

**If Issues Found**: See [Security Incident Response](#security-incident-response)

---

## Troubleshooting Guides

### KYC Auto-Approval Not Working

**Symptoms**:
- Verifications with outcome=pass and AML=clear not auto-approving
- Clients stuck in "pending_approval" status

**Diagnosis Steps**:
1. **Check Webhook Receipt**
   ```sql
   SELECT id, lemverify_id, status, outcome, aml_status, updated_at
   FROM kyc_verifications
   WHERE status = 'completed' AND outcome = 'pass' AND aml_status = 'clear'
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

2. **Review Activity Logs**
   ```sql
   SELECT action, description, created_at
   FROM activity_logs
   WHERE entity_type = 'kyc_verification'
     AND action IN ('webhook_received', 'auto_approval_skipped', 'approval_failed')
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Check Application Logs**
   ```
   Search for: "Auto-approval" OR "handleVerificationCompleted"
   Time range: Last 24 hours
   ```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Webhook not received | Check LEM Verify webhook configuration, verify URL accessible |
| Webhook signature invalid | Verify `LEMVERIFY_WEBHOOK_SECRET` matches LEM Verify dashboard |
| Database transaction failed | Check database logs, verify connection pool not exhausted |
| Lead-to-client conversion failed | Check `leads` table has matching record, verify foreign keys |
| Activity log insertion failed | Check `activity_logs` table not full, verify indexes |

**Manual Workaround**:
```sql
-- Manually approve verification
BEGIN;

UPDATE kyc_verifications
SET status = 'approved', approved_at = NOW(), approved_by = 'system-manual'
WHERE id = '<verification_id>';

UPDATE onboarding_sessions
SET status = 'approved', updated_at = NOW()
WHERE id = (SELECT onboarding_session_id FROM kyc_verifications WHERE id = '<verification_id>');

-- Convert lead to client if exists
-- (Check if lead exists first)
UPDATE leads
SET status = 'converted', converted_at = NOW()
WHERE id = (SELECT client_id FROM kyc_verifications WHERE id = '<verification_id>');

COMMIT;
```

---

### Webhook Delivery Failures

**Symptoms**:
- LEM Verify verifications complete but no status update in app
- Webhook delivery logs show failures in LEM Verify dashboard

**Diagnosis Steps**:
1. **Check LEM Verify Dashboard**
   - Go to Settings → Webhooks
   - Check "Recent Deliveries" tab
   - Note HTTP status codes and error messages

2. **Test Webhook Endpoint**
   ```bash
   # Test if endpoint is accessible
   curl -X POST https://app.innspiredaccountancy.com/api/webhooks/lemverify \
     -H "Content-Type: application/json" \
     -H "x-lemverify-signature: test" \
     -d '{"test": true}'

   # Expected: 401 (signature invalid) or 400 (payload invalid)
   # If 5xx or timeout: Server issue
   ```

3. **Check Application Logs**
   ```
   Search for: "/api/webhooks/lemverify"
   Time range: Last 1 hour
   Look for: Error messages, timeouts, signature validation
   ```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Firewall blocking requests | Whitelist LEM Verify IP addresses |
| SSL certificate invalid | Verify cert is valid and trusted |
| Webhook secret mismatch | Update `LEMVERIFY_WEBHOOK_SECRET` from dashboard |
| Database connection timeout | Increase connection pool size, optimize queries |
| Application server down | Check hosting platform status, restart if needed |

**Manual Retry**:
```bash
# Get webhook payload from LEM Verify dashboard
# Replay manually using curl with correct signature
curl -X POST https://app.innspiredaccountancy.com/api/webhooks/lemverify \
  -H "Content-Type: application/json" \
  -H "x-lemverify-signature: $(echo -n '{"id":"..."}' | openssl dgst -sha256 -hmac "$LEMVERIFY_WEBHOOK_SECRET" | cut -d' ' -f2)" \
  -d '{"id":"verification-123","status":"completed",...}'
```

---

### Document Upload Failures

**Symptoms**:
- Clients report "Upload failed" error
- Documents not appearing in S3 bucket

**Diagnosis Steps**:
1. **Check Application Logs**
   ```
   Search for: "upload-documents" OR "S3" OR "PutObject"
   Time range: Last 1 hour
   Look for: Error codes, access denied, timeout
   ```

2. **Test S3 Connection**
   ```bash
   # Using AWS CLI (install first if needed)
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"

   aws s3 ls s3://practice-hub-onboarding/ \
     --endpoint-url https://fsn1.your-objectstorage.com

   # Expected: List of objects or empty (no error)
   ```

3. **Check S3 Bucket Permissions**
   - Access Hetzner S3 console
   - Verify bucket policy allows PutObject
   - Check CORS configuration if browser uploads

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Invalid S3 credentials | Update `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` |
| Bucket doesn't exist | Create bucket or update `S3_BUCKET_NAME` |
| File size exceeds limit | Increase max file size in code (currently 10MB) |
| Network timeout | Check Hetzner S3 status, increase timeout value |
| CORS error (browser upload) | Add CORS policy to bucket: Allow origin, methods |

**Manual Upload Test**:
```bash
# Create test file
echo "test content" > test-upload.txt

# Upload to S3
aws s3 cp test-upload.txt s3://practice-hub-onboarding/test/ \
  --endpoint-url https://fsn1.your-objectstorage.com

# Verify upload
aws s3 ls s3://practice-hub-onboarding/test/ \
  --endpoint-url https://fsn1.your-objectstorage.com
```

---

### AI Extraction Not Working

**Symptoms**:
- Questionnaire fields not pre-filled after document upload
- "AI extraction failed" message shown to client

**Diagnosis Steps**:
1. **Check Application Logs**
   ```
   Search for: "Gemini" OR "extractClientData" OR "AI extraction"
   Time range: Last 1 hour
   Look for: API errors, rate limits, timeouts
   ```

2. **Test Gemini API**
   ```bash
   # Test API key
   curl "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_AI_API_KEY"

   # Expected: List of models (including gemini-2.0-flash)
   # If error: Check API key validity
   ```

3. **Check Document Quality**
   - Download uploaded document from S3
   - Verify document is readable (not corrupted, blurry, or upside down)
   - Check file format (PDF, JPG, PNG supported)

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Invalid API key | Update `GOOGLE_AI_API_KEY` with valid key |
| Rate limit exceeded | Wait 1 minute, implement exponential backoff |
| Document format unsupported | Convert to PDF, JPG, or PNG |
| Document quality poor | Ask client to re-upload clearer document |
| API timeout | Increase timeout value, retry request |
| Model not available | Check Google AI status page, use fallback model |

**Manual Extraction Test**:
```typescript
// Test in Node.js console or API route
import { extractClientData } from '@/lib/ai/extract-client-data';

const documentUrl = 'https://s3.../document.pdf';
const result = await extractClientData(documentUrl, 'passport');
console.log(result);

// Expected: Extracted data with confidence scores
```

---

### Email Delivery Failures

**Symptoms**:
- Clients not receiving KYC status emails
- High bounce rate in Resend dashboard

**Diagnosis Steps**:
1. **Check Resend Dashboard**
   - Go to https://resend.com/dashboard
   - Check "Emails" tab for recent sends
   - Review delivery status and error messages

2. **Test Email Sending**
   ```typescript
   // Test via API or admin panel
   const { sendKYCVerificationEmail } = require('@/lib/email/kyc-emails');

   await sendKYCVerificationEmail({
     email: 'your-test-email@example.com',
     clientName: 'Test Client',
     verificationUrl: 'https://example.com/test'
   });

   // Check inbox within 1 minute
   ```

3. **Verify DNS Records**
   ```bash
   # Check SPF record
   dig TXT innspiredaccountancy.com +short | grep spf

   # Check DKIM record
   dig TXT resend._domainkey.innspiredaccountancy.com +short

   # Check DMARC record
   dig TXT _dmarc.innspiredaccountancy.com +short
   ```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Invalid Resend API key | Update `RESEND_API_KEY` with valid key |
| Domain not verified | Verify domain in Resend dashboard |
| DNS records incorrect | Add/update SPF, DKIM, DMARC records |
| Recipient email invalid | Validate email format, check for typos |
| Rate limit exceeded | Wait or upgrade Resend plan |
| Email marked as spam | Review email content, check spam score |

**Manual Email Test**:
```bash
# Send test email via Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@innspiredaccountancy.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'

# Expected: {"id": "email-id-here"}
```

---

### Database Connection Issues

**Symptoms**:
- "Database connection error" messages in application
- Slow query performance
- Timeouts on database operations

**Diagnosis Steps**:
1. **Check Database Status**
   ```bash
   # Connect to database
   psql $DATABASE_URL

   # Check connections
   SELECT count(*) as connection_count FROM pg_stat_activity;

   # Check long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state != 'idle'
     AND now() - pg_stat_activity.query_start > interval '5 seconds'
   ORDER BY duration DESC;
   ```

2. **Check Connection Pool**
   ```sql
   -- Current connections by state
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

   -- Maximum connections allowed
   SHOW max_connections;
   ```

3. **Check Disk Space**
   ```bash
   df -h | grep postgres
   ```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Connection pool exhausted | Increase pool size in `DATABASE_URL` |
| Long-running queries blocking | Terminate blocking queries: `SELECT pg_terminate_backend(pid)` |
| Disk space full | Expand disk or clean up old data |
| Too many connections | Close idle connections, restart app server |
| Network timeout | Check network connectivity, increase timeout |
| Database crash | Restart PostgreSQL service |

**Emergency Connection Reset**:
```sql
-- Terminate all connections except yours
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = 'practice_hub';
```

---

## Emergency Procedures

### Application Down

**Severity**: Critical
**Response Time**: Immediate (< 5 minutes)

**Steps**:
1. **Confirm Outage**
   - Access application URL from multiple locations
   - Check status page (if available)
   - Ping hosting provider status page

2. **Check Hosting Platform**
   - Log into Coolify/Hetzner console
   - Check application container status
   - Review deployment logs

3. **Restart Application**
   ```bash
   # Via hosting platform dashboard
   # Or via CLI if available
   docker compose restart app
   ```

4. **Check Logs for Root Cause**
   ```bash
   # View application logs
   docker logs practice-hub-app --tail 100

   # Look for: Uncaught exceptions, OOM errors, startup failures
   ```

5. **If Restart Fails**
   - Check environment variables configuration
   - Verify database connectivity
   - Review recent deployments (potential bad deploy)
   - Consider rollback to previous version

6. **Notify Stakeholders**
   - Send status update to team
   - Post on status page (if available)
   - Estimate time to resolution

**Post-Incident**:
- Document root cause
- Create Jira ticket
- Schedule post-mortem meeting
- Implement preventive measures

---

### Database Corruption

**Severity**: Critical
**Response Time**: Immediate (< 10 minutes)

**Steps**:
1. **Assess Damage**
   ```sql
   -- Check for corrupt tables
   SELECT * FROM pg_stat_database WHERE datname = 'practice_hub';

   -- Verify data integrity
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM kyc_verifications;
   ```

2. **Stop Application** (prevent further writes)
   ```bash
   docker compose stop app
   ```

3. **Create Emergency Backup**
   ```bash
   pg_dump $DATABASE_URL > /backups/emergency-$(date +%Y%m%d-%H%M%S).sql
   ```

4. **Attempt Repair**
   ```sql
   -- Reindex all tables
   REINDEX DATABASE practice_hub;

   -- Vacuum full
   VACUUM FULL;
   ```

5. **If Repair Fails: Restore from Backup**
   ```bash
   # Drop existing database
   dropdb practice_hub

   # Create new database
   createdb practice_hub

   # Restore from latest backup
   pg_restore -d practice_hub /backups/latest.dump

   # Verify data integrity
   psql practice_hub -c "SELECT COUNT(*) FROM users;"
   ```

6. **Restart Application**
   ```bash
   docker compose start app
   ```

7. **Verify Functionality**
   - Test login
   - Test core features
   - Check data accuracy

**Post-Incident**:
- Investigate root cause
- Review backup procedures
- Update disaster recovery plan
- Consider database replication

---

### Security Breach Detected

**Severity**: Critical
**Response Time**: Immediate (< 5 minutes)

**Steps**:
1. **Assess Threat**
   - Review suspicious activity in logs
   - Identify affected accounts/data
   - Determine entry point

2. **Immediate Actions**
   - **DO NOT** shut down application immediately (destroys evidence)
   - Lock compromised accounts:
     ```sql
     UPDATE users SET is_active = false WHERE id IN ('<compromised-user-ids>');
     ```
   - Block suspicious IP addresses (via firewall/hosting provider)

3. **Preserve Evidence**
   ```bash
   # Export relevant logs
   docker logs practice-hub-app > /security/incident-logs-$(date +%Y%m%d-%H%M%S).txt

   # Export database activity
   psql $DATABASE_URL -c "COPY (SELECT * FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') TO STDOUT" > /security/activity-$(date +%Y%m%d-%H%M%S).csv
   ```

4. **Rotate Secrets**
   - Generate new `BETTER_AUTH_SECRET`
   - Rotate database password
   - Regenerate API keys (LEM Verify, Gemini, Resend)
   - Update all environment variables

5. **Notify Stakeholders**
   - Inform management immediately
   - Notify affected users (if PII compromised)
   - Contact legal/compliance team
   - Report to regulatory authorities (if required)

6. **Forensic Analysis**
   - Review all access logs
   - Check for data exfiltration
   - Identify vulnerabilities exploited
   - Document timeline of events

7. **Remediation**
   - Patch vulnerabilities
   - Implement additional security controls
   - Force password resets for affected users
   - Enable MFA (if not already enabled)

**Post-Incident**:
- Conduct thorough security audit
- Implement preventive measures
- Update security policies
- Security training for team
- Consider penetration testing

---

## Support Escalation

### Escalation Levels

**Level 1: First Response (Support Team)**
- Response time: < 1 hour during business hours
- Handle: General inquiries, basic troubleshooting, password resets
- Escalate if: Technical issue beyond basic troubleshooting

**Level 2: Technical Support (Development Team)**
- Response time: < 4 hours
- Handle: Application bugs, configuration issues, integration problems
- Escalate if: Critical outage, data loss, security incident

**Level 3: Senior Engineering (Lead Developer)**
- Response time: < 1 hour for critical issues
- Handle: Architecture issues, database problems, critical bugs
- Escalate if: Requires vendor support or executive decision

**Level 4: Vendor Support (Third-Party Services)**
- Response time: Varies by vendor SLA
- Contact when: Issue confirmed to be with third-party service

### Contact Information

**Internal Team**:
- **Support Team**: support@innspiredaccountancy.com
- **Development Team**: dev@innspiredaccountancy.com
- **On-Call Engineer**: [Phone number]
- **CTO/Technical Lead**: [Contact info]

**External Vendors**:
- **LEM Verify**: support@lemverify.com
- **Resend**: support@resend.com (or Discord)
- **Google Cloud**: https://cloud.google.com/support
- **Hetzner**: https://console.hetzner.cloud/support
- **Better Auth**: Discord community (https://discord.gg/better-auth)

### Escalation Criteria

**Escalate to Level 2 if**:
- Issue not resolved within 30 minutes
- Technical knowledge required beyond Level 1
- Multiple users affected
- Feature not working as documented

**Escalate to Level 3 if**:
- Application downtime > 15 minutes
- Database connectivity issues
- Security concern identified
- Data loss or corruption suspected

**Escalate to Level 4 (Vendor) if**:
- Issue confirmed to be with third-party service
- API errors from vendor (5xx responses)
- Webhook delivery failures from vendor
- Documentation ambiguity requiring vendor clarification

### Incident Severity Classification

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **P1 - Critical** | Complete service outage, data loss, security breach | < 5 minutes | Application down, database corrupted, unauthorized access |
| **P2 - High** | Major functionality broken, affecting multiple users | < 1 hour | KYC flow not working, webhooks failing, email delivery down |
| **P3 - Medium** | Minor functionality broken, affecting some users | < 4 hours | UI bug, single user issue, non-critical feature broken |
| **P4 - Low** | Cosmetic issues, feature requests, questions | < 24 hours | UI text typo, enhancement request, documentation question |

---

## Appendix

### Useful SQL Queries

**Count Verifications by Status**:
```sql
SELECT status, COUNT(*) as count
FROM kyc_verifications
GROUP BY status
ORDER BY count DESC;
```

**Recent Activity Logs**:
```sql
SELECT user_name, action, entity_type, description, created_at
FROM activity_logs
ORDER BY created_at DESC
LIMIT 50;
```

**Clients Pending Approval**:
```sql
SELECT c.name, c.email, os.status, kv.status as kyc_status, os.created_at
FROM clients c
JOIN onboarding_sessions os ON c.id = os.client_id
LEFT JOIN kyc_verifications kv ON os.id = kv.onboarding_session_id
WHERE os.status IN ('pending_approval', 'in_progress')
ORDER BY os.created_at;
```

**Failed Webhooks (Last 24 Hours)**:
```sql
SELECT entity_id, description, metadata, created_at
FROM activity_logs
WHERE action = 'webhook_failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Environment Variables Quick Reference

See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for complete list.

**Critical Variables**:
- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Authentication secret (rotate regularly)
- `LEMVERIFY_WEBHOOK_SECRET` - Webhook signature validation
- `GOOGLE_AI_API_KEY` - AI extraction service
- `RESEND_API_KEY` - Email delivery service

### Log File Locations

Depends on hosting setup. Common locations:

- **Docker logs**: `docker logs practice-hub-app`
- **Application logs**: `/var/log/practice-hub/app.log` (if configured)
- **Database logs**: `/var/lib/postgresql/data/log/` (default PostgreSQL)
- **Web server logs**: `/var/log/nginx/` or `/var/log/apache2/`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team

**Feedback**: If you find issues or have suggestions for this runbook, please update this document or contact dev@innspiredaccountancy.com
# Backup & Disaster Recovery Plan

This document outlines backup procedures, recovery processes, and disaster recovery strategies for Practice Hub.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Automated Backup Scripts](#automated-backup-scripts)
3. [Backup Strategy](#backup-strategy)
4. [Recovery Procedures](#recovery-procedures)
5. [Disaster Recovery](#disaster-recovery)
6. [Testing & Validation](#testing--validation)

---

## Quick Start

### Create a Backup (Local Development)

```bash
# Create backup in backups/ directory
./scripts/backup-db.sh

# Create backup and upload to S3
./scripts/backup-db.sh --upload-s3
```

### Restore from Backup

```bash
# List available backups
ls -lht backups/

# Restore specific backup
./scripts/restore-db.sh practice_hub_backup_20251019_143022.sql.gz
```

**Note**: Restore script automatically creates a safety backup before restoration.

---

## Automated Backup Scripts

Practice Hub includes two automated scripts for database backup and restoration:

### backup-db.sh

**Location**: `scripts/backup-db.sh`

**Features**:
- Creates PostgreSQL dump using pg_dump
- Compresses backup with gzip (saves ~80% space)
- Automatically cleans up backups older than 7 days
- Optional S3 upload for offsite storage
- Validates Docker container is running
- Creates timestamped backups in `backups/` directory

**Usage**:
```bash
# Local backup only
./scripts/backup-db.sh

# Backup and upload to S3
./scripts/backup-db.sh --upload-s3
```

**Output Example**:
```
Practice Hub Database Backup
==============================

✓ Container is running

Creating database backup...
Database: practice_hub
Output: practice_hub_backup_20251019_143022.sql

✓ Backup created successfully
  File: practice_hub_backup_20251019_143022.sql
  Size: 2.3M

✓ Backup compressed
  File: practice_hub_backup_20251019_143022.sql.gz
  Size: 512K

✓ Cleanup complete (5 backups retained)
```

**Cron Job Setup** (Production):
```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM UTC with S3 upload
0 2 * * * /path/to/practice-hub/scripts/backup-db.sh --upload-s3 >> /var/log/practice-hub-backup.log 2>&1
```

### restore-db.sh

**Location**: `scripts/restore-db.sh`

**Features**:
- Restores from compressed or uncompressed backups
- Creates automatic safety backup before restoration
- Terminates existing database connections
- Verifies database integrity after restoration
- Interactive confirmation to prevent accidents
- Handles both .sql and .sql.gz formats

**Usage**:
```bash
# Restore from specific backup
./scripts/restore-db.sh practice_hub_backup_20251019_143022.sql.gz

# List available backups if no file specified
./scripts/restore-db.sh
```

**Safety Features**:
- Requires explicit "yes" confirmation
- Creates safety backup automatically
- Preserves safety backup after restoration
- Provides rollback instructions if restoration fails

**Output Example**:
```
Practice Hub Database Restore
===============================

✓ Container is running

Backup file: practice_hub_backup_20251019_143022.sql.gz
Size: 512K
Created: 2025-10-19 14:30:22

WARNING: This will completely replace the current database!
All existing data will be lost.

Are you sure you want to continue? (yes/no): yes

Creating safety backup of current database...
✓ Safety backup created: practice_hub_before_restore_20251019_150015.sql.gz (485K)

✓ Decompressed

Terminating existing database connections...
✓ Connections terminated

Restoring database from backup...

✓ Database restored successfully!

Verifying database integrity...
✓ Found 42 tables

Restore completed successfully!

Safety backup preserved at:
  practice_hub_before_restore_20251019_150015.sql.gz
```

---

## Backup Strategy

### Recovery Objectives

- **RTO (Recovery Time Objective)**: 4 hours
  - Maximum acceptable downtime after disaster
- **RPO (Recovery Point Objective)**: 1 hour
  - Maximum acceptable data loss
- **Data Retention**: 30 days rolling backups

### What to Back Up

#### 1. Database (Critical - Daily)

**PostgreSQL Database**:
- All tables including: users, clients, kyc_verifications, onboarding_sessions, activity_logs
- Database schema and indexes
- User roles and permissions

**Backup Method**: Automated daily dumps

```bash
# Automated backup script (run via cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="practice_hub"

# Create backup directory if doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup (pg_dump)
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -F c \
  -b \
  -v \
  -f "$BACKUP_DIR/practice_hub_$DATE.dump" \
  $DB_NAME

# Compress backup
gzip "$BACKUP_DIR/practice_hub_$DATE.dump"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

# Upload to S3 for offsite backup
aws s3 cp "$BACKUP_DIR/practice_hub_$DATE.dump.gz" \
  s3://practice-hub-backups/database/ \
  --endpoint-url $S3_ENDPOINT
```

**Schedule**: Daily at 2:00 AM UTC

#### 2. S3/Object Storage (Critical - Continuous)

**Document Storage**:
- Client identity documents
- Uploaded files during onboarding
- Generated PDFs (proposals, reports)

**Backup Method**: S3 versioning + cross-region replication (if available)

```bash
# Enable versioning on bucket
aws s3api put-bucket-versioning \
  --bucket practice-hub-onboarding \
  --versioning-configuration Status=Enabled \
  --endpoint-url $S3_ENDPOINT

# List versions of object
aws s3api list-object-versions \
  --bucket practice-hub-onboarding \
  --prefix onboarding/ \
  --endpoint-url $S3_ENDPOINT
```

**Alternative**: Periodic sync to secondary bucket

```bash
# Sync to backup bucket (run daily)
aws s3 sync s3://practice-hub-onboarding s3://practice-hub-backups-secondary \
  --endpoint-url $S3_ENDPOINT
```

#### 3. Application Configuration (Important - On Change)

**Environment Variables & Secrets**:
- Store encrypted copy in secure vault (1Password, Vault, etc.)
- Document all environment variables in `.env.production.example`

**Application Code**:
- Git repository is primary backup
- Ensure all changes committed and pushed to remote

#### 4. Activity Logs (Compliance - Long-term)

**Audit Trail**:
- `activity_logs` table contains compliance-required data
- Retention: 7 years (accounting requirements)

**Backup Method**: Annual archive to cold storage

```bash
# Export activity logs older than 1 year
psql $DATABASE_URL -c "COPY (
  SELECT * FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
) TO STDOUT WITH CSV HEADER" | gzip > activity_logs_$(date +%Y).csv.gz

# Upload to archive storage
aws s3 cp activity_logs_$(date +%Y).csv.gz \
  s3://practice-hub-archives/activity-logs/ \
  --storage-class GLACIER
```

---

### Backup Schedule

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database (full) | Daily 2:00 AM | 30 days | S3 + Local |
| Database (WAL/incremental) | Continuous | 7 days | S3 |
| S3 Documents | Continuous (versioning) | 90 days | Same bucket (versions) |
| Environment Config | On change | Indefinite | 1Password/Vault |
| Activity Logs Archive | Annually | 7 years | S3 Glacier |
| Application Code | Every commit | Indefinite | Git (GitHub/GitLab) |

---

### Backup Monitoring

**Automated Checks**:
1. **Backup Success Verification**
   ```bash
   # Check if today's backup exists
   BACKUP_FILE=$(find /backups/database -name "practice_hub_$(date +%Y%m%d)*.dump.gz" -mtime 0)
   if [ -z "$BACKUP_FILE" ]; then
     echo "ALERT: Database backup failed for $(date +%Y-%m-%d)"
     # Send alert to team
   fi
   ```

2. **Backup File Integrity**
   ```bash
   # Test backup file can be read
   gzip -t $BACKUP_FILE
   if [ $? -ne 0 ]; then
     echo "ALERT: Backup file corrupted: $BACKUP_FILE"
   fi
   ```

3. **S3 Upload Verification**
   ```bash
   # Verify backup uploaded to S3
   aws s3 ls s3://practice-hub-backups/database/practice_hub_$(date +%Y%m%d) \
     --endpoint-url $S3_ENDPOINT
   ```

**Manual Checks** (Weekly):
- Verify backup files exist for last 7 days
- Check backup file sizes are reasonable (not 0 bytes)
- Review backup logs for errors

---

## Recovery Procedures

### Database Recovery

#### Scenario 1: Recent Data Loss (< 24 hours)

**Use Case**: Accidental deletion, corrupted transaction

**Steps**:
1. **Identify Last Good Backup**
   ```bash
   ls -lh /backups/database/ | head -10
   # or
   aws s3 ls s3://practice-hub-backups/database/ --endpoint-url $S3_ENDPOINT
   ```

2. **Stop Application** (prevents new writes)
   ```bash
   # Via hosting platform or:
   docker compose stop app
   ```

3. **Backup Current State** (in case recovery goes wrong)
   ```bash
   pg_dump $DATABASE_URL > /backups/emergency_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Restore from Backup**
   ```bash
   # Download backup from S3 if needed
   aws s3 cp s3://practice-hub-backups/database/practice_hub_20251010.dump.gz . \
     --endpoint-url $S3_ENDPOINT

   # Decompress
   gunzip practice_hub_20251010.dump.gz

   # Drop existing database (CAREFUL!)
   dropdb practice_hub

   # Create fresh database
   createdb practice_hub

   # Restore from backup
   pg_restore -d practice_hub -v practice_hub_20251010.dump
   ```

5. **Verify Data Integrity**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM kyc_verifications;
   SELECT MAX(created_at) FROM activity_logs;
   ```

6. **Restart Application**
   ```bash
   docker compose start app
   ```

7. **Test Critical Functions**
   - Login
   - View clients
   - Check KYC verifications

**Expected Recovery Time**: 30-60 minutes

---

#### Scenario 2: Complete Database Loss

**Use Case**: Hardware failure, database server crash, corruption

**Steps** (similar to above but more comprehensive):
1. **Provision New Database Server** (if hardware failed)
2. **Restore Latest Backup** (follow steps above)
3. **Restore Incremental Backups** (if using WAL archiving)
4. **Verify All Data**
5. **Update Application Connection String** (if new server)
6. **Restart Application**

**Expected Recovery Time**: 2-4 hours

---

### S3/Document Storage Recovery

#### Scenario 1: Accidental File Deletion

**Use Case**: User or admin deletes files by mistake

**Steps**:
1. **Identify Deleted File**
   ```bash
   # List object versions (if versioning enabled)
   aws s3api list-object-versions \
     --bucket practice-hub-onboarding \
     --prefix onboarding/session123/passport.pdf \
     --endpoint-url $S3_ENDPOINT
   ```

2. **Restore Previous Version**
   ```bash
   # Copy deleted version back
   aws s3api copy-object \
     --copy-source practice-hub-onboarding/onboarding/session123/passport.pdf?versionId=VERSION_ID \
     --bucket practice-hub-onboarding \
     --key onboarding/session123/passport.pdf \
     --endpoint-url $S3_ENDPOINT
   ```

**Expected Recovery Time**: 5-10 minutes

---

#### Scenario 2: Bucket Data Loss

**Use Case**: Bucket accidentally deleted or corrupted

**Steps**:
1. **Recreate Bucket**
   ```bash
   aws s3 mb s3://practice-hub-onboarding --endpoint-url $S3_ENDPOINT
   ```

2. **Restore from Secondary Bucket**
   ```bash
   aws s3 sync s3://practice-hub-backups-secondary s3://practice-hub-onboarding \
     --endpoint-url $S3_ENDPOINT
   ```

3. **Reconfigure Bucket Permissions**
   ```bash
   # Re-apply CORS, bucket policies, versioning
   ```

**Expected Recovery Time**: 1-2 hours (depending on data size)

---

### Application Recovery

#### Scenario: Application Code Issues

**Use Case**: Bad deployment, bugs introduced

**Steps**:
1. **Identify Last Working Version**
   ```bash
   git log --oneline -10
   ```

2. **Rollback to Previous Version**
   ```bash
   git revert HEAD
   # or
   git reset --hard <previous-commit-hash>
   ```

3. **Redeploy**
   ```bash
   git push origin main --force  # If reset used
   # Or trigger deployment via platform
   ```

**Expected Recovery Time**: 10-30 minutes

---

## Disaster Recovery

### Disaster Scenarios

1. **Complete Hosting Provider Outage** (Hetzner down)
2. **Regional Failure** (entire datacenter unavailable)
3. **Data Center Disaster** (fire, flood, etc.)
4. **Catastrophic Data Loss** (all backups corrupted)
5. **Security Breach** (ransomware, data exfiltration)

### DR Strategy: Hot Standby (Recommended for Production)

**Architecture**:
- Primary: Hetzner (Frankfurt)
- Secondary: AWS or another provider (different region)
- Database: Continuous replication primary → secondary
- S3: Cross-region replication
- Application: Pre-deployed standby instance

**Failover Process**:
1. Detect primary failure (monitoring alerts)
2. Verify secondary database is current (check replication lag)
3. Update DNS to point to secondary site
4. Activate secondary application instance
5. Verify functionality
6. Notify users (if downtime occurred)

**Expected Recovery Time**: 15-30 minutes

**Cost**: ~2x infrastructure costs (worth it for critical production)

---

### DR Strategy: Backup & Restore (Budget-Friendly)

**Architecture**:
- Primary: Hetzner (Frankfurt)
- Backups: S3 (offsite) + local
- Secondary: None (provision on-demand)

**Failover Process**:
1. Detect disaster
2. Provision new infrastructure (Hetzner different region or AWS)
3. Restore database from latest backup
4. Restore S3 files from backup bucket
5. Deploy application
6. Update DNS
7. Verify functionality

**Expected Recovery Time**: 2-4 hours

**Cost**: Minimal (only backup storage)

---

### DR Runbook: Complete Site Failure

**Assume**: Hetzner Frankfurt is completely unavailable

**Steps**:
1. **Confirm Disaster** (< 5 minutes)
   - Check Hetzner status page
   - Confirm cannot reach any services
   - Activate DR plan

2. **Notify Stakeholders** (< 10 minutes)
   - Send status update: "Service unavailable, activating DR"
   - Estimate recovery time: 4 hours
   - Set up status page

3. **Provision New Infrastructure** (30-60 minutes)
   - Sign up for AWS/other provider (if not pre-configured)
   - Create VPC, database instance, application servers
   - Configure security groups, networking

4. **Restore Database** (30-60 minutes)
   - Download latest backup from S3
   - Create new PostgreSQL instance
   - Restore backup
   - Verify data integrity

5. **Restore S3 Files** (30-60 minutes)
   - Create new S3 bucket
   - Copy files from backup bucket
   - Configure permissions

6. **Deploy Application** (30-60 minutes)
   - Clone git repository
   - Configure environment variables
   - Build and deploy application
   - Test locally

7. **Update DNS** (5-15 minutes + propagation time)
   - Update A records to point to new IP
   - Wait for DNS propagation (up to 1 hour)

8. **Verify & Monitor** (30 minutes)
   - Test login, core features
   - Monitor error logs
   - Check metrics

9. **Post-Recovery** (ongoing)
   - Send update: "Service restored"
   - Monitor for issues
   - Document lessons learned

**Total Expected Time**: 3-4 hours (+ DNS propagation)

---

## Testing & Validation

### Backup Testing

**Monthly**: Restore backup to test environment

```bash
# 1. Download backup
aws s3 cp s3://practice-hub-backups/database/latest.dump.gz /tmp/

# 2. Restore to test database
gunzip /tmp/latest.dump.gz
dropdb practice_hub_test
createdb practice_hub_test
pg_restore -d practice_hub_test /tmp/latest.dump

# 3. Run validation queries
psql practice_hub_test -c "SELECT COUNT(*) FROM users;"
psql practice_hub_test -c "SELECT COUNT(*) FROM kyc_verifications;"

# 4. Verify application can connect and work
# (Point test app instance to practice_hub_test)
```

**Quarterly**: Full DR drill

1. Simulate complete site failure
2. Execute DR runbook
3. Measure actual recovery time
4. Document issues encountered
5. Update runbook based on learnings

---

### Backup Validation Checklist

- [ ] Backups created successfully (last 7 days)
- [ ] Backup files not corrupted (gzip test passes)
- [ ] Backup files uploaded to S3
- [ ] Backup file sizes reasonable (not too small/large)
- [ ] S3 versioning enabled
- [ ] Test restore completes successfully
- [ ] Restored data integrity verified
- [ ] Environment secrets backed up securely
- [ ] DR runbook up to date
- [ ] Team trained on DR procedures

---

## Recovery Checklist

After any recovery procedure:

- [ ] Document what happened (incident report)
- [ ] Document what was restored (data, timestamp)
- [ ] Verify data integrity (run validation queries)
- [ ] Test critical application features
- [ ] Check for data loss (compare timestamps)
- [ ] Notify affected users (if applicable)
- [ ] Review and update backup procedures if needed
- [ ] Schedule post-mortem meeting

---

## Contact Information

### Escalation for DR Scenarios

1. **On-Call Engineer**: [Phone number]
2. **CTO/Technical Lead**: [Phone number]
3. **Hosting Provider Support**:
   - Hetzner: https://console.hetzner.cloud/support
   - AWS: https://console.aws.amazon.com/support

### External Support

- **Database Experts**: (if complex recovery needed)
- **Security Team**: (if breach suspected)
- **Legal/Compliance**: (if PII involved)

---

## Compliance & Regulations

### Data Retention Requirements

- **Client Records**: 6 years (UK accounting regulations)
- **Activity Logs**: 7 years (Companies Act 2006)
- **KYC/AML Records**: 5 years (Money Laundering Regulations 2017)

### Backup Security

- **Encryption**: All backups encrypted at rest and in transit
- **Access Control**: Only authorized personnel can access backups
- **Audit Trail**: All backup access logged
- **Geographic Restrictions**: Backups stored within UK/EU (GDPR)

---

**Document Version**: 1.1
**Last Updated**: 2025-10-19
**Maintained By**: Development Team

**Changelog**:
- 2025-10-19: Added automated backup/restore scripts (backup-db.sh, restore-db.sh)
- 2025-10-10: Initial version with DR strategies and procedures

**Next Review**: 2026-01-10 (Quarterly)

**Feedback**: If you identify gaps in this DR plan, please update this document or contact dev@innspiredaccountancy.com
# Monitoring & Alerting Strategy

This document outlines the monitoring and alerting strategy for Practice Hub, including recommended tools, key metrics, alert thresholds, and observability best practices.

---

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Stack](#monitoring-stack)
3. [Key Metrics](#key-metrics)
4. [Alert Configuration](#alert-configuration)
5. [Dashboards](#dashboards)
6. [Log Management](#log-management)
7. [Implementation Guide](#implementation-guide)

---

## Overview

### Monitoring Objectives

1. **Uptime & Availability**: Ensure application is accessible and responsive 24/7
2. **Performance**: Maintain fast response times and smooth user experience
3. **Error Detection**: Identify and alert on errors before users report them
4. **Capacity Planning**: Track resource utilization and plan for growth
5. **Security**: Detect suspicious activity and potential security incidents
6. **Business Metrics**: Monitor key business KPIs (KYC conversions, user growth)

### Monitoring Principles

- **Proactive, not reactive**: Detect issues before users complain
- **Actionable alerts**: Every alert should require action (avoid alert fatigue)
- **Context-rich**: Alerts should include enough information to start troubleshooting
- **Escalation paths**: Clear escalation for different severity levels
- **Regular review**: Update thresholds and metrics as system evolves

---

## Monitoring Stack

### Recommended Tools

#### Option 1: Comprehensive (Best for Production)

**Application Performance Monitoring (APM)**:
- **Sentry** (recommended) or **Rollbar**
  - Error tracking and performance monitoring
  - Source map support for Next.js
  - User context and breadcrumbs
  - Integration with Slack/email
  - Cost: ~$26/month (Team plan)

**Infrastructure Monitoring**:
- **Datadog** or **New Relic**
  - Server metrics (CPU, memory, disk)
  - Database performance
  - Custom metrics
  - Cost: ~$15-31/host/month

**Log Aggregation**:
- **Better Stack** (formerly Logtail) or **Logflare**
  - Centralized log management
  - Search and filtering
  - Log alerts
  - Cost: ~$15-25/month

**Uptime Monitoring**:
- **UptimeRobot** (free tier) or **Pingdom**
  - HTTP/HTTPS monitoring
  - Multi-location checks
  - Status page
  - Cost: Free (50 monitors) or ~$15/month

#### Option 2: Budget-Friendly (Good for MVP/Small Scale)

- **Sentry** (free tier): Error tracking
- **UptimeRobot** (free tier): Uptime monitoring
- **Better Stack** (free tier): Basic log aggregation
- **CloudWatch** or **Vercel Analytics** (if using Vercel): Basic metrics

#### Option 3: Self-Hosted (Maximum Control)

- **Grafana + Prometheus**: Metrics and dashboards
- **Loki**: Log aggregation
- **Alertmanager**: Alert routing
- **Cost**: Server costs only (~$20-50/month)

---

## Key Metrics

### 1. Application Health Metrics

#### HTTP Response Time
- **Metric**: `http_request_duration_seconds`
- **Targets**:
  - p50 (median): < 200ms
  - p95: < 500ms
  - p99: < 1000ms
- **Alert**: p95 > 1000ms for 5 minutes

#### HTTP Error Rate
- **Metric**: `http_requests_total{status=~"5.."}`
- **Target**: < 1% of all requests
- **Alert**: Error rate > 2% for 5 minutes

#### Application Uptime
- **Metric**: Successful health check responses
- **Target**: 99.9% uptime (< 43 minutes downtime/month)
- **Alert**: Health check fails 3 consecutive times

---

### 2. KYC/AML Onboarding Metrics

#### Document Upload Success Rate
- **Metric**: `document_uploads_total{status="success"} / document_uploads_total`
- **Target**: > 95%
- **Alert**: Success rate < 90% over 1 hour

#### AI Extraction Success Rate
- **Metric**: `ai_extractions_total{status="success"} / ai_extractions_total`
- **Target**: > 90%
- **Alert**: Success rate < 80% over 1 hour

#### LEM Verify Integration
- **Metric**: `lemverify_verifications_total{status="created"}`
- **Target**: 100% of submissions create verification
- **Alert**: Any failures in 15 minutes

#### Webhook Delivery Success Rate
- **Metric**: `webhooks_received_total{source="lemverify",status="success"} / webhooks_received_total{source="lemverify"}`
- **Target**: > 98%
- **Alert**: Success rate < 95% over 30 minutes

#### Auto-Approval Rate
- **Metric**: `kyc_auto_approvals_total / kyc_verifications_eligible_total`
- **Target**: > 70% (varies by customer base)
- **Track only**: Alert if drops significantly (> 20% decrease)

#### Time to Approval (Manual Review Queue)
- **Metric**: `time_to_approval_seconds{type="manual_review"}`
- **Target**: < 24 hours (p95)
- **Alert**: Any verification > 48 hours without review

---

### 3. Database Metrics

#### Connection Pool Utilization
- **Metric**: `db_connections_active / db_connections_max`
- **Target**: < 70%
- **Alert**: > 85% for 5 minutes

#### Query Performance
- **Metric**: `db_query_duration_seconds{quantile="0.95"}`
- **Target**: p95 < 100ms
- **Alert**: p95 > 500ms for 5 minutes

#### Slow Queries
- **Metric**: `db_slow_queries_total` (queries > 1 second)
- **Target**: 0 slow queries
- **Alert**: > 5 slow queries in 10 minutes

#### Database Size
- **Metric**: `db_size_bytes`
- **Target**: Track growth rate
- **Alert**: Growth > 10GB in 24 hours (unexpected spike)

---

### 4. Third-Party Service Metrics

#### LEM Verify API
- **Metric**: `lemverify_api_requests_total{status=~"5.."}`
- **Target**: 0 errors
- **Alert**: > 2 API errors in 15 minutes

#### Gemini AI API
- **Metric**: `gemini_api_requests_total{status=~"4.."}` (rate limits are 429)
- **Target**: 0 rate limits
- **Alert**: Any 429 errors (rate limit hit)

#### Resend Email API
- **Metric**: `resend_emails_total{status="failed"} / resend_emails_total`
- **Target**: < 2% failure rate
- **Alert**: Failure rate > 5% over 1 hour

#### S3 Storage
- **Metric**: `s3_operations_total{operation="PutObject",status=~"5.."}`
- **Target**: 0 errors
- **Alert**: > 3 errors in 10 minutes

---

### 5. Business Metrics (KPIs)

#### Daily Active Users
- **Metric**: `daily_active_users`
- **Target**: Track growth
- **Dashboard only**: No alert

#### KYC Conversion Rate
- **Metric**: `kyc_completions_total / kyc_sessions_started_total`
- **Target**: > 60%
- **Dashboard only**: Review weekly

#### Average Time to Complete KYC
- **Metric**: `kyc_completion_time_seconds{quantile="0.5"}`
- **Target**: < 10 minutes (median)
- **Dashboard only**: Track trends

#### Lead-to-Client Conversion
- **Metric**: `clients_created_total{source="kyc_approval"} / leads_created_total`
- **Target**: > 90%
- **Dashboard only**: Review weekly

---

### 6. Security Metrics

#### Failed Login Attempts
- **Metric**: `auth_login_attempts_total{status="failed"}`
- **Target**: < 50/day
- **Alert**: > 20 failed attempts from single IP in 10 minutes

#### Webhook Signature Validation Failures
- **Metric**: `webhook_signature_invalid_total`
- **Target**: 0 (unless testing)
- **Alert**: > 5 failures from same IP in 5 minutes

#### Unauthorized Access Attempts
- **Metric**: `auth_unauthorized_total`
- **Target**: < 100/day
- **Alert**: > 50 unauthorized attempts in 10 minutes

---

## Alert Configuration

### Alert Severity Levels

| Severity | Response Time | Notification Channel | Escalation |
|----------|---------------|----------------------|------------|
| **Critical (P1)** | < 5 minutes | Phone call + Slack + Email | Immediate to on-call engineer |
| **High (P2)** | < 30 minutes | Slack + Email | After 30 minutes to senior engineer |
| **Medium (P3)** | < 4 hours | Slack (during business hours) | After 4 hours to team lead |
| **Low (P4)** | < 24 hours | Email digest | None |

### Alert Rules

#### Critical (P1) Alerts

**Application Down**:
```yaml
Alert: ApplicationDown
Condition: http_health_check_success == 0 for 2 minutes
Severity: Critical
Channels: [phone, slack, email]
Message: "Application is unreachable. Immediate action required."
Runbook: https://docs.../runbooks#application-down
```

**Database Unreachable**:
```yaml
Alert: DatabaseConnectionFailed
Condition: db_connection_errors > 10 in 2 minutes
Severity: Critical
Channels: [phone, slack, email]
Message: "Database connection failing. Check database server status."
Runbook: https://docs.../runbooks#database-connection-issues
```

**High Error Rate**:
```yaml
Alert: HighErrorRate
Condition: rate(http_requests_total{status=~"5.."}[5m]) > 0.05 (5%)
Severity: Critical
Channels: [phone, slack, email]
Message: "Error rate exceeds 5%. Check application logs immediately."
Runbook: https://docs.../runbooks#high-error-rate
```

#### High (P2) Alerts

**Webhook Delivery Failures**:
```yaml
Alert: WebhookDeliveryFailing
Condition: webhook_failures > 5 in 15 minutes
Severity: High
Channels: [slack, email]
Message: "LEM Verify webhooks failing. KYC approvals may be delayed."
Runbook: https://docs.../runbooks#webhook-delivery-failures
```

**Slow Response Times**:
```yaml
Alert: SlowResponseTimes
Condition: http_request_duration_seconds{quantile="0.95"} > 2.0 for 5 minutes
Severity: High
Channels: [slack, email]
Message: "API response times degraded. Users experiencing slow performance."
Runbook: https://docs.../runbooks#slow-response-times
```

**Database Connection Pool Exhausted**:
```yaml
Alert: DatabasePoolExhausted
Condition: db_connections_active / db_connections_max > 0.9
Severity: High
Channels: [slack, email]
Message: "Database connection pool nearly full. May impact new requests."
Runbook: https://docs.../runbooks#connection-pool-exhausted
```

#### Medium (P3) Alerts

**AI Extraction Failures Increasing**:
```yaml
Alert: AIExtractionFailuresIncreasing
Condition: ai_extraction_failures > 10 in 1 hour
Severity: Medium
Channels: [slack]
Message: "Gemini AI extraction failures increasing. Check API key and rate limits."
Runbook: https://docs.../runbooks#ai-extraction-not-working
```

**Email Delivery Issues**:
```yaml
Alert: EmailDeliveryIssues
Condition: email_delivery_failures > 0.05 (5%) over 1 hour
Severity: Medium
Channels: [slack]
Message: "Email delivery failure rate elevated. Check Resend dashboard."
Runbook: https://docs.../runbooks#email-delivery-failures
```

**Unreviewed KYC Verifications**:
```yaml
Alert: StaledKYCVerifications
Condition: count(kyc_verifications{status="pending_approval", age > 48h}) > 0
Severity: Medium
Channels: [slack]
Message: "KYC verifications pending review for > 48 hours. Check admin queue."
Runbook: https://docs.../runbooks#kyc-manual-review
```

#### Low (P4) Alerts

**Disk Space Warning**:
```yaml
Alert: DiskSpaceWarning
Condition: disk_usage_percent > 75%
Severity: Low
Channels: [email_digest]
Message: "Disk usage above 75%. Plan for capacity expansion."
```

**Slow Query Detected**:
```yaml
Alert: SlowQueryDetected
Condition: db_slow_queries > 0
Severity: Low
Channels: [email_digest]
Message: "Slow database query detected. Review query performance."
```

---

## Dashboards

### Main Application Dashboard

**Metrics to display**:
- Application uptime (last 24h, 7d, 30d)
- Request rate (requests/minute)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users (current, today, this week)

**Visualization**: Line charts with time series data

### KYC/AML Onboarding Dashboard

**Metrics to display**:
- KYC sessions started (today, this week)
- Document upload success rate
- AI extraction success rate
- Verifications created
- Auto-approvals vs manual reviews
- Average time to completion
- Conversion funnel: Uploads → Questionnaires → Verifications → Approvals

**Visualization**: Mix of line charts, bar charts, and pie charts

### Database Dashboard

**Metrics to display**:
- Connection pool utilization
- Query performance (p95, p99)
- Slow queries count
- Database size growth
- Cache hit rate (if using Redis/caching)
- Transaction rate

**Visualization**: Line charts + gauges for utilization

### Third-Party Services Dashboard

**Metrics to display**:
- LEM Verify API: Request count, error rate, response time
- Gemini AI: Request count, rate limits, success rate
- Resend: Emails sent, delivery rate, bounce rate
- S3: Upload count, error rate, storage used

**Visualization**: Line charts + status indicators

### Security Dashboard

**Metrics to display**:
- Failed login attempts (by IP, by user)
- Unauthorized access attempts
- Webhook signature validation failures
- Admin actions log (last 100)
- Rate limit hits by IP

**Visualization**: Tables + line charts

---

## Log Management

### Log Levels

Use appropriate log levels for different severity:

```typescript
// Critical: System is unusable
console.error('[CRITICAL] Database connection failed:', error);

// Error: Action failed, requires intervention
console.error('[ERROR] Failed to process webhook:', error);

// Warning: Unexpected but recoverable
console.warn('[WARNING] AI extraction returned low confidence scores');

// Info: Normal operations
console.log('[INFO] KYC verification created:', verificationId);

// Debug: Detailed diagnostic info (only in development)
if (process.env.NODE_ENV === 'development') {
  console.debug('[DEBUG] Webhook payload:', payload);
}
```

### Log Structure

Use structured logging (JSON format):

```typescript
// Good: Structured
console.log(JSON.stringify({
  level: 'info',
  timestamp: new Date().toISOString(),
  event: 'kyc_verification_created',
  verificationId: 'ver-123',
  clientId: 'client-456',
  source: 'lemverify',
  metadata: { outcome: 'pass', amlStatus: 'clear' }
}));

// Bad: Unstructured
console.log('KYC verification ver-123 created for client-456');
```

### Log Retention

**Recommended retention periods**:
- **Error logs**: 90 days
- **Info logs**: 30 days
- **Debug logs**: 7 days (or none in production)
- **Security logs**: 1 year (compliance requirement)
- **Audit logs** (`activity_logs` table): 7 years (accounting retention)

### Sensitive Data Handling

**Never log**:
- Passwords or authentication tokens
- API keys or secrets
- Credit card numbers or payment details
- Full PII (names, addresses, SSN, etc.) in production logs

**Sanitize before logging**:
```typescript
// Bad
console.log('User created:', user);

// Good
console.log('User created:', {
  id: user.id,
  email: maskEmail(user.email), // john.doe@example.com → j***@example.com
  role: user.role
});
```

---

## Implementation Guide

### Step 1: Set Up Sentry (Error Tracking)

1. **Create Sentry Account**
   - Sign up at https://sentry.io
   - Create new project (Next.js)
   - Copy DSN

2. **Install Sentry SDK**
   ```bash
   pnpm add @sentry/nextjs
   ```

3. **Configure Sentry**
   ```typescript
   // sentry.client.config.ts
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
     beforeSend(event, hint) {
       // Sanitize sensitive data
       if (event.request) {
         delete event.request.cookies;
         delete event.request.headers?.Authorization;
       }
       return event;
     },
   });

   // sentry.server.config.ts
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

4. **Add to Environment Variables**
   ```env
   SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   ```

5. **Test Error Tracking**
   ```typescript
   // Test route: /api/test-sentry
   import * as Sentry from "@sentry/nextjs";

   export async function GET() {
     Sentry.captureException(new Error("Test error from API"));
     return Response.json({ message: "Error sent to Sentry" });
   }
   ```

---

### Step 2: Set Up UptimeRobot (Uptime Monitoring)

1. **Create UptimeRobot Account**
   - Sign up at https://uptimerobot.com (free tier)

2. **Add HTTP Monitor**
   - URL: `https://app.innspiredaccountancy.com`
   - Type: HTTPS
   - Interval: 5 minutes
   - Alert when: Down for 2 minutes

3. **Add API Health Check Monitor**
   - URL: `https://app.innspiredaccountancy.com/api/health`
   - Expected keyword: `"status":"healthy"`

4. **Configure Alerts**
   - Email: your-team@innspiredaccountancy.com
   - Slack webhook (optional)
   - SMS (paid plans only)

5. **Create Status Page** (optional)
   - Public status page for customers
   - URL: status.innspiredaccountancy.com

---

### Step 3: Implement Health Check Endpoint

Create `/app/api/health/route.ts`:

```typescript
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {} as Record<string, "healthy" | "degraded" | "down">,
  };

  // Check database
  try {
    await db.execute("SELECT 1");
    checks.services.database = "healthy";
  } catch (error) {
    checks.services.database = "down";
    checks.status = "degraded";
  }

  // Check S3 (optional - may slow down health check)
  // ... similar check for S3 connectivity

  return NextResponse.json(checks, {
    status: checks.status === "healthy" ? 200 : 503,
  });
}
```

---

### Step 4: Add Custom Metrics Tracking

Create `/lib/metrics.ts`:

```typescript
/**
 * Simple metrics tracking utility
 * Can be replaced with proper APM tool later
 */

export class Metrics {
  /**
   * Track document upload success/failure
   */
  static trackDocumentUpload(status: "success" | "failure") {
    // Log for now, can integrate with APM later
    console.log(JSON.stringify({
      metric: "document_upload",
      status,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Track AI extraction success/failure
   */
  static trackAIExtraction(status: "success" | "failure", confidence?: number) {
    console.log(JSON.stringify({
      metric: "ai_extraction",
      status,
      confidence,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Track KYC verification creation
   */
  static trackKYCVerification(status: "created" | "approved" | "rejected") {
    console.log(JSON.stringify({
      metric: "kyc_verification",
      status,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Track webhook receipt
   */
  static trackWebhook(source: string, status: "success" | "failure") {
    console.log(JSON.stringify({
      metric: "webhook_received",
      source,
      status,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Track API call to third-party service
   */
  static trackExternalAPI(service: string, endpoint: string, statusCode: number, duration: number) {
    console.log(JSON.stringify({
      metric: "external_api_call",
      service,
      endpoint,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

Use in application code:

```typescript
// Example: Document upload
try {
  await uploadToS3(file);
  Metrics.trackDocumentUpload("success");
} catch (error) {
  Metrics.trackDocumentUpload("failure");
  throw error;
}

// Example: AI extraction
const result = await extractClientData(documentUrl, documentType);
Metrics.trackAIExtraction(
  result ? "success" : "failure",
  result?.confidence
);
```

---

### Step 5: Set Up Log Aggregation (Optional)

If using **Better Stack** (Logtail):

1. **Create Better Stack Account**
   - Sign up at https://betterstack.com

2. **Create Log Source**
   - Create new source (Node.js/Next.js)
   - Copy source token

3. **Install Logtail SDK**
   ```bash
   pnpm add @logtail/node @logtail/winston
   ```

4. **Configure Logging**
   ```typescript
   // lib/logger.ts
   import { Logtail } from "@logtail/node";
   import { LogtailTransport } from "@logtail/winston";
   import winston from "winston";

   const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);

   export const logger = winston.createLogger({
     transports: [
       new LogtailTransport(logtail),
       new winston.transports.Console(),
     ],
   });
   ```

5. **Use Logger**
   ```typescript
   import { logger } from "@/lib/logger";

   logger.info("KYC verification created", {
     verificationId: "ver-123",
     clientId: "client-456",
   });

   logger.error("Webhook processing failed", {
     error: error.message,
     verificationId: "ver-123",
   });
   ```

---

## Monitoring Checklist

Before going to production, ensure:

- [ ] Health check endpoint implemented and tested
- [ ] Uptime monitoring configured (UptimeRobot or equivalent)
- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Log aggregation set up (optional but recommended)
- [ ] Key metrics instrumented in code
- [ ] Alert rules configured for critical scenarios
- [ ] Notification channels tested (email, Slack, phone)
- [ ] Dashboards created for key metrics
- [ ] On-call rotation defined
- [ ] Runbooks linked from alerts
- [ ] Team trained on alert response procedures

---

## Review Schedule

- **Weekly**: Review alert accuracy, adjust thresholds if needed
- **Monthly**: Review metric trends, plan for capacity
- **Quarterly**: Full monitoring system audit, update runbooks
- **Annually**: Evaluate monitoring tools, consider upgrades

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team

**Feedback**: If you have suggestions for additional metrics or alerts, please update this document or contact dev@innspiredaccountancy.com
# Practice Hub - Production Readiness Checklist

**Generated**: 2025-10-19  
**Version**: v1.0  
**Target Deployment**: Coolify on Hetzner Cloud  
**Status**: Pre-Production Review

## Executive Summary

This document provides a comprehensive checklist for deploying the Practice Hub application to production. It covers infrastructure, security, performance, monitoring, and operational considerations.

---

## 1. Infrastructure Setup

### 1.1 Server Requirements

#### Minimum Specifications
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps

#### Recommended Specifications (100 users)
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps
- **Backup**: Daily snapshots

### 1.2 Docker Configuration

#### Application Container
```dockerfile
# Optimized Dockerfile for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 1.3 Environment Variables

#### Required Production Variables
```bash
# Application
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Database
DATABASE_URL=postgresql://user:password@db:5432/practice_hub?sslmode=require

# Authentication
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=https://app.practicehub.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://app.practicehub.com

# Object Storage (Hetzner S3)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_ACCESS_KEY_ID=<your-hetzner-access-key>
S3_SECRET_ACCESS_KEY=<your-hetzner-secret-key>
S3_BUCKET_NAME=practice-hub-production
S3_REGION=eu-central

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@practicehub.com

# KYC (LemVerify)
LEMVERIFY_API_KEY=<your-lemverify-key>
LEMVERIFY_ACCOUNT_ID=<your-account-id>
LEMVERIFY_WEBHOOK_SECRET=<your-webhook-secret>

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-key>

# Document Signing (DocuSeal)
DOCUSEAL_API_KEY=<your-docuseal-key>

# Accounting (Xero)
XERO_CLIENT_ID=<your-xero-client-id>
XERO_CLIENT_SECRET=<your-xero-client-secret>
XERO_REDIRECT_URI=https://app.practicehub.com/api/xero/callback

# Monitoring (Sentry)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
```

---

## 2. Database Setup

### 2.1 Production Database Configuration

#### PostgreSQL Tuning
```sql
-- postgresql.conf optimizations for 8GB RAM server

# Connection Settings
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # Log slow queries (>1s)
log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# Security
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

### 2.2 Database Initialization

#### Run Migrations
```bash
# On production server
pnpm db:push
pnpm db:migrate
```

#### Create Production User
```sql
-- Create production admin user
INSERT INTO users (
  id, tenant_id, email, first_name, last_name, role, created_at
) VALUES (
  gen_random_uuid(),
  '<tenant-id>',
  'admin@practicehub.com',
  'Admin',
  'User',
  'admin',
  NOW()
);

-- Create auth account (via Better Auth API or script)
```

### 2.3 Backup Strategy

#### Automated Backups
```bash
# Daily PostgreSQL backups
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="practice_hub"

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz \
  s3://practice-hub-backups/database/ \
  --region eu-central-1
```

#### Restore Procedure
```bash
# Restore from backup
gunzip < backup_20251019_120000.sql.gz | psql -U postgres practice_hub
```

---

## 3. Security Hardening

### 3.1 SSL/TLS Configuration

#### Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name app.practicehub.com;

    ssl_certificate /etc/letsencrypt/live/app.practicehub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.practicehub.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    location /api/auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name app.practicehub.com;
    return 301 https://$server_name$request_uri;
}
```

### 3.2 Firewall Rules

```bash
# UFW Configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3.3 SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 10
```

---

## 4. Monitoring & Observability

### 4.1 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    // Check Redis connection (if using)
    // await redis.ping();
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      redis: "connected"
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 503 }
    );
  }
}
```

### 4.2 Sentry Integration

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      
      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive data from errors
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      }
    });
  }
}
```

### 4.3 Metrics Collection

```typescript
// lib/metrics.ts
import { collectDefaultMetrics, register, Counter, Histogram } from 'prom-client';

// Enable default metrics
collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['table', 'operation'],
});

export const errorCounter = new Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity'],
});

// Expose metrics endpoint
// app/api/metrics/route.ts
export async function GET() {
  return new Response(await register.metrics(), {
    headers: { 'Content-Type': register.contentType }
  });
}
```

---

## 5. Performance Optimization

### 5.1 Implement Critical Fixes

#### Fix N+1 Queries
- [ ] clientPortalAdmin.ts - listPortalUsers
- [ ] transactionData.ts - getAllWithData

#### Add Missing Indexes
```sql
-- Run in production database
CREATE INDEX idx_activity_created_at ON activity_logs(created_at);
CREATE INDEX idx_invoice_due_status ON invoices(due_date, status);
CREATE INDEX idx_task_due_status ON tasks(due_date, status);
CREATE INDEX idx_message_thread_time ON messages(thread_id, created_at);
CREATE INDEX idx_proposal_client_status ON proposals(client_id, status);
```

### 5.2 Enable Caching

#### Redis Setup
```typescript
// lib/cache.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache wrapper
export async function cached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  const fresh = await fetcher();
  await redis.setex(key, ttl, fresh);
  return fresh;
}
```

### 5.3 Enable Compression

```typescript
// middleware.ts
import compression from 'compression';

export const config = {
  matcher: '/api/:path*',
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Enable compression for large responses
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }
  
  return response;
}
```

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] Run all tests (`pnpm test`)
- [ ] Run type checking (`pnpm tsc --noEmit`)
- [ ] Run linting (`pnpm lint`)
- [ ] Build production bundle (`pnpm build`)
- [ ] Review environment variables
- [ ] Backup current production database
- [ ] Test build locally with production env
- [ ] Review recent code changes
- [ ] Update changelog/release notes

### 6.2 Deployment Steps

1. [ ] Create Git tag for release (`v1.0.0`)
2. [ ] Build Docker image
3. [ ] Push image to registry
4. [ ] Run database migrations (if any)
5. [ ] Deploy to staging environment
6. [ ] Run smoke tests on staging
7. [ ] Deploy to production
8. [ ] Monitor error rates (first 30 minutes)
9. [ ] Verify critical workflows
10. [ ] Announce deployment to team

### 6.3 Post-Deployment

- [ ] Monitor Sentry for errors (first hour)
- [ ] Check database query performance
- [ ] Verify email delivery
- [ ] Test authentication flows
- [ ] Check S3 file uploads
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Review application logs
- [ ] Test critical user journeys
- [ ] Backup production database
- [ ] Document any issues/learnings

---

## 7. Disaster Recovery

### 7.1 Backup Locations

- **Database**: S3 bucket (practice-hub-backups/database/)
- **Object Storage**: Hetzner S3 with versioning enabled
- **Application**: Git repository + Docker registry

### 7.2 Recovery Procedures

#### Database Restoration
```bash
# Download backup from S3
aws s3 cp s3://practice-hub-backups/database/backup_latest.sql.gz .

# Restore to database
gunzip < backup_latest.sql.gz | psql -U postgres practice_hub
```

#### Application Rollback
```bash
# Rollback to previous version
docker pull practicehub/app:v0.9.0
docker-compose down
docker-compose up -d
```

### 7.3 Emergency Contacts

- **Primary**: DevOps Lead - [contact info]
- **Secondary**: Backend Lead - [contact info]
- **Database**: DBA - [contact info]
- **Hetzner Support**: support@hetzner.com

---

## 8. Operational Procedures

### 8.1 Daily Operations

- [ ] Check error logs (Sentry)
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Verify backups completed
- [ ] Monitor API response times

### 8.2 Weekly Operations

- [ ] Review security alerts
- [ ] Update dependencies (security patches)
- [ ] Check backup restoration (test)
- [ ] Review user feedback
- [ ] Capacity planning review

### 8.3 Monthly Operations

- [ ] Rotate API keys
- [ ] Security audit review
- [ ] Performance optimization review
- [ ] Update documentation
- [ ] Disaster recovery drill

---

## 9. Success Metrics

### 9.1 Performance Targets

- API Response Time (P95): < 500ms ✅
- Page Load Time (LCP): < 2.5s ✅
- Error Rate: < 0.1% ✅
- Uptime: > 99.9% ✅

### 9.2 Monitoring Dashboards

- Application Performance (Sentry)
- Server Metrics (Hetzner Cloud Console)
- Database Performance (pg_stat_statements)
- User Analytics (Vercel Analytics)

---

## 10. Final Checklist

### Infrastructure
- [ ] Server provisioned and configured
- [ ] Docker containers running
- [ ] Database initialized and migrated
- [ ] Redis cache operational
- [ ] S3 storage configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] CDN setup (if applicable)

### Security
- [ ] All security headers configured
- [ ] Rate limiting enabled
- [ ] 2FA enabled for admins
- [ ] Firewall rules applied
- [ ] SSH hardened
- [ ] Secrets stored securely
- [ ] HTTPS enforced
- [ ] CSRF protection enabled

### Performance
- [ ] N+1 queries fixed
- [ ] Database indexes added
- [ ] Caching layer implemented
- [ ] Response compression enabled
- [ ] Connection pool configured
- [ ] Bundle size optimized

### Monitoring
- [ ] Sentry configured
- [ ] Health check endpoint
- [ ] Metrics collection
- [ ] Log aggregation
- [ ] Alerts configured
- [ ] Uptime monitoring

### Operational
- [ ] Backup automation
- [ ] Restore procedures tested
- [ ] Deployment runbook
- [ ] Emergency contacts documented
- [ ] User documentation updated
- [ ] Team trained on operations

---

## Conclusion

This checklist ensures the Practice Hub application is production-ready with proper infrastructure, security, performance optimization, and operational procedures. Follow each section systematically for a successful deployment.

**Estimated Time to Production Ready**: 2-3 weeks with dedicated effort

**Next Step**: Begin Phase 9 (Final Documentation) and start implementing critical fixes from Phases 6-7.
