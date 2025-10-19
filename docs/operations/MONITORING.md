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
