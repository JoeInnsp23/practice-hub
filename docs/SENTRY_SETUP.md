# Sentry Error Tracking Setup Guide

This guide walks you through setting up Sentry error tracking for Practice Hub.

## Overview

Sentry provides real-time error tracking and monitoring for:
- Client-side JavaScript errors
- Server-side Node.js errors
- Edge runtime errors (middleware)
- tRPC procedure errors
- Webhook processing errors

## Prerequisites

- Sentry account (free tier available at https://sentry.io)
- Access to environment variable configuration

## Step 1: Create Sentry Project

### 1.1 Sign Up / Sign In

1. Go to https://sentry.io
2. Sign up for a free account or sign in

### 1.2 Create New Project

1. Click **"Create Project"**
2. Select platform: **Next.js**
3. Set alert frequency: **On every new issue** (recommended for production)
4. Project name: `practice-hub`
5. Click **"Create Project"**

### 1.3 Copy DSN

After project creation, you'll see the DSN (Data Source Name):

```
https://abc123def456@o123456.ingest.sentry.io/789012
```

**Copy this value** - you'll need it for environment variables.

## Step 2: Configure Environment Variables

### 2.1 Development (.env.local)

Add these to your `.env.local` file:

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="development"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="practice-hub"
SENTRY_AUTH_TOKEN=""  # Optional for dev, required for source maps
```

**Replace**:
- `https://your-dsn@sentry.io/project-id` with your actual DSN
- `your-org-slug` with your Sentry organization slug (found in Settings → General)

### 2.2 Production Environment

For production deployment, add these to your hosting platform (Coolify, Vercel, etc.):

```env
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="practice-hub"
SENTRY_AUTH_TOKEN="your-auth-token"
```

### 2.3 Get Auth Token (for Source Maps)

**Optional but highly recommended** - enables viewing original source code in error stack traces:

1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Click **"Create New Token"**
3. Scopes: Select **"project:releases"** and **"project:write"**
4. Token name: `Practice Hub Source Maps`
5. Click **"Create Token"**
6. Copy the token and add to `SENTRY_AUTH_TOKEN`

## Step 3: Restart Development Server

```bash
# Kill any running dev server
# Then restart:
pnpm dev
```

You should see:
```
✓ Sentry initialized successfully
```

If DSN is not configured, you'll see:
```
⚠ Sentry DSN not configured - error tracking disabled
```

## Step 4: Test Sentry Integration

### 4.1 Create Test Error Page

Create `app/test-sentry/page.tsx`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";

export default function TestSentryPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>

      <button
        onClick={() => {
          Sentry.captureMessage("Test message from Practice Hub", "info");
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
      >
        Send Test Message
      </button>

      <button
        onClick={() => {
          Sentry.captureException(new Error("Test error from Practice Hub"));
        }}
        className="px-4 py-2 bg-red-500 text-white rounded mr-2"
      >
        Trigger Test Error
      </button>

      <button
        onClick={() => {
          throw new Error("Unhandled test error");
        }}
        className="px-4 py-2 bg-orange-500 text-white rounded"
      >
        Throw Unhandled Error
      </button>
    </div>
  );
}
```

### 4.2 Test Error Tracking

1. Navigate to `http://localhost:3000/test-sentry`
2. Click **"Send Test Message"** → should appear in Sentry dashboard
3. Click **"Trigger Test Error"** → should create error in Sentry
4. Click **"Throw Unhandled Error"** → should create error with React error boundary

### 4.3 Verify in Sentry Dashboard

1. Go to https://sentry.io
2. Navigate to your `practice-hub` project
3. Go to **Issues** tab
4. You should see the test errors/messages

## Step 5: Remove Test Page

After verification:

```bash
rm app/test-sentry/page.tsx
```

## Sentry Integration Points

### 1. DocuSeal Webhook Handler

**File**: `app/api/webhooks/docuseal/route.ts`

All webhook errors are automatically tracked:

```typescript
Sentry.captureException(error, {
  tags: { operation: "webhook_signature_invalid" },
  extra: { submissionId, proposalId },
});
```

**Error categories**:
- `webhook_signature_missing` - Missing signature header
- `webhook_signature_invalid` - Invalid signature
- `webhook_metadata_missing` - Missing tenant/proposal ID
- `webhook_entity_not_found` - Proposal/document not found
- `webhook_processing_error` - General processing error

### 2. tRPC Error Handling

Errors in tRPC procedures are captured with context:

```typescript
import { captureTRPCError } from "@/lib/sentry";

try {
  // tRPC procedure logic
} catch (error) {
  captureTRPCError(error as Error, "proposals.create", input);
  throw error;
}
```

### 3. Client-Side Errors

React errors are automatically captured by Sentry's error boundary.

### 4. Server-Side Errors

Node.js runtime errors are automatically captured.

### 5. Middleware Errors

Edge runtime errors in middleware are automatically captured.

## Monitoring Best Practices

### 1. Set Up Alerts

**Recommended alerts**:
- Email on every new issue
- Slack integration for critical errors
- Weekly digest of unresolved issues

Configure in: Sentry → Settings → Alerts

### 2. Create Custom Filters

**Filter out noise**:
- `UNAUTHORIZED` errors (authentication failures) - already filtered
- Network errors from offline users
- Browser extension errors

Configure in: Sentry → Settings → Inbound Filters

### 3. Release Tracking

Track errors by deployment:

```bash
# In your CI/CD pipeline:
npx @sentry/cli releases new "$VERSION"
npx @sentry/cli releases set-commits "$VERSION" --auto
npx @sentry/cli releases finalize "$VERSION"
```

### 4. Performance Monitoring

Enable performance monitoring:

```typescript
// Already configured in sentry.*.config.ts
tracesSampleRate: 0.1, // 10% in production
```

Monitor:
- API response times
- Database query performance
- Webhook processing duration

## Error Context

All errors include:
- **Environment**: development/staging/production
- **User context**: userId, email, tenantId, role
- **Request context**: URL, method, headers (sensitive data filtered)
- **Breadcrumbs**: User actions leading to error
- **Tags**: operation, entity type, severity

## Security Considerations

### Sensitive Data Filtering

**Automatically filtered** (see `sentry.*.config.ts`):
- Request cookies
- Environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.)
- `UNAUTHORIZED` authentication errors

**Never include in error messages**:
- Passwords
- API keys
- Personal identifiable information (PII)
- Credit card numbers

### GDPR Compliance

- User data can be deleted via Sentry API
- IP address scrubbing enabled
- Session replay masks all text by default

## Troubleshooting

### Issue: "Sentry DSN not configured"

**Solution**:
1. Verify `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
2. Restart dev server after adding env vars
3. Check for typos in variable name

### Issue: Errors not appearing in Sentry

**Possible causes**:
1. DSN not configured correctly
2. Environment set to `test` (Sentry disabled in test)
3. Error filtered by `beforeSend` hook
4. Network blocked (firewall/ad blocker)

**Debug**:
```typescript
// Temporarily enable debug mode in sentry.*.config.ts
debug: true,
```

### Issue: Source maps not uploading

**Solution**:
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check token has `project:releases` scope
3. Verify `SENTRY_ORG` and `SENTRY_PROJECT` match exactly

### Issue: Too many errors / quota exceeded

**Solutions**:
1. Lower `tracesSampleRate` in production
2. Add more filters in `beforeSend`
3. Upgrade Sentry plan
4. Focus on high-priority errors first

## Production Deployment Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in production environment
- [ ] `NEXT_PUBLIC_SENTRY_ENVIRONMENT` set to `"production"`
- [ ] `SENTRY_AUTH_TOKEN` configured for source maps
- [ ] `SENTRY_ORG` and `SENTRY_PROJECT` match Sentry dashboard
- [ ] Test error tracking in staging first
- [ ] Alert rules configured
- [ ] Team has access to Sentry dashboard
- [ ] Slack/email integrations set up

## Monitoring Dashboards

### Key Metrics to Track

1. **Error Rate**
   - Errors per hour/day
   - Error rate by endpoint
   - Error rate by user

2. **Performance**
   - Average response time
   - P95/P99 response times
   - Slow database queries

3. **User Impact**
   - Users affected by errors
   - Session quality (error-free sessions %)
   - Crash-free rate

### Sample Sentry Dashboard

Create a custom dashboard in Sentry with:
- Total errors (last 24h)
- Error trends (last 7 days)
- Top 10 error types
- Webhook error rate
- tRPC error breakdown
- User-facing errors vs backend errors

## Cost Optimization

**Sentry Free Tier**:
- 5,000 errors/month
- 10,000 performance units/month
- 1 month data retention
- Unlimited team members

**Tips to stay within free tier**:
1. Use `tracesSampleRate: 0.1` in production
2. Filter out low-priority errors
3. Focus on actionable errors
4. Use breadcrumbs sparingly

## Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Next.js Integration**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Error Tracking Best Practices**: https://docs.sentry.io/product/best-practices/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/

## Support

For questions about Sentry integration:
1. Check this documentation
2. Review Sentry official docs
3. Check `lib/sentry.ts` for utility functions
4. Review `sentry.*.config.ts` for configuration

---

**Last Updated**: 2025-10-19
**Status**: ✅ Configured and ready for DSN setup
**Next Action**: Create Sentry project and add DSN to environment variables
