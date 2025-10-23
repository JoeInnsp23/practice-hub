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
