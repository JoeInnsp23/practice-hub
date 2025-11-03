# DocuSeal E-Signature Integration Guide

## Overview

DocuSeal provides professional electronic signature capabilities for Practice Hub proposals and documents. This guide covers local development setup, production deployment, and troubleshooting.

**Features**:
- Automated proposal signing workflow
- UK SES-compliant audit trails
- Webhook-driven status updates
- Embedded signing experience
- Presigned PDF URLs for secure access

---

## Prerequisites

- Docker and Docker Compose installed
- OpenSSL for secret generation
- Access to DocuSeal instance (self-hosted or cloud)
- Webhook endpoint publicly accessible (ngrok for local dev)

---

## Local Development Setup

### 1. Generate Secrets

```bash
# Generate DocuSeal secret key (for container)
openssl rand -base64 32

# Generate webhook secret (for signature verification)
openssl rand -base64 32
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# DocuSeal E-Signature Integration
DOCUSEAL_HOST=http://localhost:3030
DOCUSEAL_API_KEY=<generate_after_setup>
DOCUSEAL_SECRET_KEY=<generated_from_step_1>
DOCUSEAL_WEBHOOK_SECRET=<generated_from_step_1>
```

### 3. Start DocuSeal Container

```bash
docker compose up -d docuseal
```

Wait for health check to pass:
```bash
docker compose ps docuseal
# Should show "healthy" status
```

### 4. Access Admin UI

1. Open http://localhost:3030
2. Create admin account (first user becomes admin)
3. Navigate to **Settings → API Keys**
4. Generate new API key → Copy to `.env.local` as `DOCUSEAL_API_KEY`

### 5. Configure Webhook

1. In DocuSeal Admin UI: **Settings → Webhooks**
2. Add webhook URL:
   - **Local dev**: `https://<your-ngrok-url>/api/webhooks/docuseal`
   - **Production**: `https://your-domain.com/api/webhooks/docuseal`
3. Set webhook secret to match `DOCUSEAL_WEBHOOK_SECRET` from `.env.local`
4. Enable events: `submission.completed`, `submission.declined`, `submission.expired`

### 6. Test Signing Flow

```bash
# Start dev server
pnpm dev

# Create test proposal
# Navigate to /proposal-hub/proposals/[id]
# Click "Send for Signature"
# Complete signing flow
# Verify webhook updates proposal status to "signed"
```

---

## Production Deployment

### 1. Environment Variables

Update `.env.production`:

```env
# DocuSeal E-Signature Integration
DOCUSEAL_HOST=https://docuseal.yourcompany.com
DOCUSEAL_API_KEY=<api_key_from_docuseal_admin>
DOCUSEAL_SECRET_KEY=<secret_for_docuseal_container>
DOCUSEAL_WEBHOOK_SECRET=<shared_secret_for_webhook_verification>
```

**Security Notes**:
- Use strong random secrets (min 32 characters)
- Store in secure secret manager (AWS Secrets Manager, Vault, etc.)
- Rotate secrets periodically
- Never commit secrets to version control

### 2. DocuSeal Production Setup

**Option A: Self-Hosted** (recommended for data sovereignty)

```yaml
# docker-compose.production.yml
services:
  docuseal:
    image: docuseal/docuseal:latest
    container_name: practice-hub-docuseal
    ports:
      - "127.0.0.1:3030:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/docuseal
      SECRET_KEY_BASE: ${DOCUSEAL_SECRET_KEY}
    volumes:
      - docuseal_data:/data
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 5s
      retries: 3
```

**Option B: DocuSeal Cloud** (managed service)
- Sign up at https://www.docuseal.co
- Get API key from dashboard
- Configure webhook URL
- Update `DOCUSEAL_HOST` to cloud endpoint

### 3. Webhook Configuration

**Production Webhook URL**: `https://your-domain.com/api/webhooks/docuseal`

**Webhook Settings in DocuSeal Admin**:
1. URL: Your production webhook endpoint
2. Secret: Same as `DOCUSEAL_WEBHOOK_SECRET` env var
3. Events: `submission.completed`, `submission.declined`, `submission.expired`
4. Retry policy: 3 retries with exponential backoff

**Security**:
- Webhook endpoint uses HMAC-SHA256 signature verification
- 300-second replay protection window
- Rate limiting: 10 req/sec per tenant, 1 req/sec per submission
- All failures logged to Sentry

### 4. Verify Integration

```bash
# Check DocuSeal health
curl http://localhost:3030/health

# Test webhook signature (local)
curl -X POST http://localhost:3000/api/webhooks/docuseal \
  -H "Content-Type: application/json" \
  -H "x-docuseal-signature: <hmac_signature>" \
  -H "x-docuseal-timestamp: $(date +%s)" \
  -d '{"event":"submission.completed","data":{...}}'

# Monitor Sentry for webhook events
# Check for errors: webhook_signature_invalid, webhook_processing_error
```

---

## Webhook Event Handling

### submission.completed

**Triggered**: When signer completes the document
**Handler**: `handleSubmissionCompleted` (route.ts:463-495)

**Actions**:
1. Download signed PDF from DocuSeal
2. Upload to S3 with tenant isolation (`tenantId/proposals/${proposalId}/signed.pdf`)
3. Update proposal:
   - `status = "signed"`
   - `signedAt = <timestamp from audit trail>`
   - `signedPdfKey = <S3 key>`
   - `documentHash = <SHA-256 hash>`
4. Create signature record in `proposalSignatures` table
5. Send confirmation email to signer (7-day presigned URL)
6. Send team notification email
7. Log activity: "proposal_signed"

**Idempotency**: Checks `docusealSubmissionId` uniqueness before inserting

### submission.declined

**Triggered**: When signer rejects the document
**Handler**: `handleSubmissionDeclined` (route.ts:761-847)

**Actions**:
1. Update proposal: `status = "rejected"`
2. Log activity: "proposal_signature_declined"
3. Send team notification email

### submission.expired

**Triggered**: When signing link expires (after validUntil date)
**Handler**: `handleSubmissionExpired` (route.ts:849-933)

**Actions**:
1. Update proposal: `status = "expired"`
2. Log activity: "proposal_signature_expired"
3. Send team notification email

---

## Troubleshooting

### Webhook Signature Verification Fails

**Symptoms**: 401 Unauthorized responses, Sentry alerts for `webhook_signature_invalid`

**Causes**:
- `DOCUSEAL_WEBHOOK_SECRET` mismatch between app and DocuSeal settings
- Clock skew between servers (timestamp outside 300-second window)
- Proxy/load balancer modifying request body

**Fixes**:
```bash
# Verify secret matches
echo $DOCUSEAL_WEBHOOK_SECRET  # App secret
# Compare with DocuSeal Admin UI → Webhooks → Secret

# Check timestamp
curl -v http://localhost:3000/api/webhooks/docuseal \
  -H "x-docuseal-timestamp: $(date +%s)"
# Should return 400 (missing body), not 401 (signature invalid)

# Test with valid signature
# See __tests__/api/webhooks/docuseal.test.ts for examples
```

### Webhook Rate Limit Exceeded

**Symptoms**: 429 Too Many Requests, Sentry alerts for `webhook_rate_limit`

**Causes**:
- Multiple webhooks fired rapidly (duplicate events)
- DocuSeal retry storm

**Fixes**:
- Check DocuSeal retry settings (should use exponential backoff)
- Verify idempotency checks are working (check database for duplicates)
- Increase rate limit in `lib/rate-limit/webhook.ts` if legitimate traffic

### Proposal Status Not Updating

**Symptoms**: DocuSeal shows "completed" but proposal still "sent"

**Debugging**:
```bash
# Check webhook logs in Sentry
# Filter by: webhook_processing_error, entity_not_found

# Check database
psql $DATABASE_URL -c "SELECT id, status, docusealSubmissionId FROM proposals WHERE id = '<proposal_id>';"

# Verify submission ID matches
curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" \
  https://docuseal.example.com/api/submissions/<submission_id>
```

**Common Issues**:
- Webhook failed silently (check Sentry)
- Submission ID mismatch (verify in database)
- Transaction rolled back (check for errors in logs)

### PDF Download Fails

**Symptoms**: Error: "Failed to download signed PDF"

**Fixes**:
```bash
# Test API key
curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" \
  https://docuseal.example.com/api/submissions

# Verify submission exists
curl -H "X-Auth-Token: $DOCUSEAL_API_KEY" \
  https://docuseal.example.com/api/submissions/<submission_id>

# Check S3 permissions
aws s3 ls s3://$S3_BUCKET_NAME/$TENANT_ID/proposals/
```

### Email Not Sent

**Symptoms**: Signature completed but no confirmation email

**Debugging**:
- Emails are **non-blocking** - webhook succeeds even if email fails
- Check Sentry for `email_send_failed` events
- Verify Resend API key is valid
- Check email logs in Resend dashboard

---

## Monitoring & Alerts

### Sentry Alerts (Recommended)

Set up alerts for:
- `webhook_signature_invalid` - Possible MITM attack or config issue
- `webhook_rate_limit` - DOS attack or retry storm
- `webhook_processing_error` - Application error during webhook handling
- `lead_conversion_error` - Failed lead → proposal → client conversion

### Webhook Metrics

Monitor in Sentry dashboard:
- Webhook success rate (target: >99.9%)
- Average processing time (target: <500ms)
- Error rate by event type

### Database Checks

```sql
-- Check for stuck proposals (sent but not signed after 30 days)
SELECT id, proposalNumber, status, sentAt, validUntil
FROM proposals
WHERE status = 'sent' AND sentAt < NOW() - INTERVAL '30 days';

-- Verify signature records
SELECT COUNT(*), signatureMethod FROM proposalSignatures GROUP BY signatureMethod;
-- Should show: docuseal (new), canvas (legacy)
```

---

## Testing

### Unit Tests

```bash
pnpm test __tests__/api/webhooks/docuseal.test.ts
```

**Coverage**:
- Signature verification (valid/invalid HMAC)
- Timestamp validation (replay protection)
- Rate limiting (tenant and submission level)
- Idempotency (duplicate event handling)
- Event handlers (completed, declined, expired)

### Integration Testing

1. Create test proposal in staging
2. Send for signature via UI
3. Complete signing flow in DocuSeal
4. Verify:
   - Webhook received (check logs)
   - Proposal status updated to "signed"
   - Signature record created
   - Confirmation emails sent
   - Activity log created

### Load Testing

```bash
# Simulate webhook load
pnpm test __tests__/performance/webhook-load.test.ts
```

---

## Production Checklist

**Before Going Live**:
- [ ] Environment variables configured and verified
- [ ] DocuSeal container/service running and healthy
- [ ] Webhook URL publicly accessible
- [ ] Webhook secret matches in app and DocuSeal settings
- [ ] API key tested and working
- [ ] S3 bucket configured with proper permissions
- [ ] Resend email API key configured
- [ ] Sentry alerts configured
- [ ] Test signing flow end-to-end in staging
- [ ] Backup/restore procedures documented

**Post-Launch**:
- [ ] Monitor webhook success rate (first 24 hours)
- [ ] Check for signature verification errors
- [ ] Verify email delivery
- [ ] Test proposal signing with real users
- [ ] Document any issues in runbook

---

## References

- **DocuSeal Documentation**: https://www.docuseal.co/docs
- **Webhook Implementation**: `app/api/webhooks/docuseal/route.ts`
- **Client Library**: `lib/docuseal/client.ts`
- **UK Compliance Fields**: `lib/docuseal/uk-compliance-fields.ts`
- **Email Handler**: `lib/docuseal/email-handler.ts`
- **Test Suite**: `__tests__/api/webhooks/docuseal.test.ts`
- **Gap Analysis**: `docs/gap-analysis/40-docuseal-readiness.md`

---

**Need Help?** Check Sentry logs, review test suite examples, or contact DevOps team.
