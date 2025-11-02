---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
category: guides
tags: [integration, [service-name]]
---

# [Service Name] Integration Guide

## Overview

[Brief description of what this service does and why Practice Hub integrates with it]

**Service Type**: [API | SaaS | Webhook | OAuth Provider]
**Documentation**: [Link to official docs]
**Status**: ✅ Active | ⚠️ Partial | 🚧 In Development

## Prerequisites

Before integrating [Service Name], ensure you have:

- [ ] [Service Name] account (plan: [Free | Paid | Enterprise])
- [ ] API keys or credentials
- [ ] Required permissions or scopes
- [ ] [Any other prerequisites]

## Environment Variables

Add these to your `.env.local`:

```bash
[SERVICE]_API_KEY=your_api_key_here
[SERVICE]_SECRET=your_secret_here
[SERVICE]_WEBHOOK_SECRET=your_webhook_secret_here
[SERVICE]_ENDPOINT=https://api.service.com  # Optional, defaults to production
```

**Required Variables:**
- `[SERVICE]_API_KEY` - API authentication key (get from [link])
- `[SERVICE]_SECRET` - Secret for signature verification

**Optional Variables:**
- `[SERVICE]_ENDPOINT` - Override API endpoint (for testing/sandbox)

## Setup Instructions

### Step 1: Create [Service Name] Account

1. Visit [https://service.com/signup](https://service.com/signup)
2. Sign up for [plan type]
3. Verify email address

### Step 2: Generate API Keys

1. Navigate to Settings → API Keys
2. Click "Generate New Key"
3. Copy the API key immediately (won't be shown again)
4. Add to `.env.local` as `[SERVICE]_API_KEY`

### Step 3: Configure Webhook (if applicable)

1. In [Service Name] dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/[service]`
3. Select events to subscribe to:
   - [ ] [Event type 1]
   - [ ] [Event type 2]
4. Generate webhook secret
5. Add to `.env.local` as `[SERVICE]_WEBHOOK_SECRET`

### Step 4: Test Connection

```bash
# Start development server
pnpm dev

# Test API connection (in another terminal)
curl -X POST http://localhost:3000/api/webhooks/[service]/test \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}'
```

Expected response: `{"status": "ok", "message": "Connection successful"}`

## Implementation Details

### Client Library

Location: `lib/[service]/client.ts`

**Key Functions:**
- `[functionName]()` - [Brief description]
- `[functionName]()` - [Brief description]

**Example Usage:**
```typescript
import { [ClientClass] } from "@/lib/[service]/client";

const client = new [ClientClass]({
  apiKey: process.env.[SERVICE]_API_KEY!,
});

const result = await client.[method]({
  // parameters
});
```

### Webhook Handler

Location: `app/api/webhooks/[service]/route.ts`

**Supported Events:**
| Event Type | Handler | Description |
|------------|---------|-------------|
| `[event.type]` | `handle[Event]()` | [Description] |

**Security:**
- ✅ HMAC signature verification
- ✅ Rate limiting (100 req/min per IP)
- ✅ Idempotency (event deduplication)

### Database Tables

| Table | Purpose | Schema Location |
|-------|---------|-----------------|
| `[service]_events` | Webhook event log | `lib/db/schema.ts:NNN` |
| `[service]_sync_state` | Sync status tracking | `lib/db/schema.ts:NNN` |

## Usage Examples

### Example 1: [Common Use Case]

```typescript
import { [function] } from "@/lib/[service]/[module]";

async function example() {
  const result = await [function]({
    param1: "value",
    param2: 123,
  });

  if (result.success) {
    console.log("Success:", result.data);
  } else {
    console.error("Error:", result.error);
  }
}
```

### Example 2: [Another Use Case]

```typescript
// Code example
```

## Testing

### Local Testing

```bash
# Run integration tests
pnpm test lib/[service]

# Test webhook delivery (use webhook.site or ngrok)
ngrok http 3000
# Update webhook URL in [Service Name] dashboard to ngrok URL
```

### Production Testing

Use sandbox/test mode if available:

```bash
[SERVICE]_ENDPOINT=https://sandbox.api.service.com pnpm dev
```

## Troubleshooting

### Issue: API Key Invalid

**Symptoms**: `401 Unauthorized` errors

**Solution**:
1. Verify API key is correct in `.env.local`
2. Check key hasn't expired
3. Regenerate key if necessary

### Issue: Webhook Not Receiving Events

**Symptoms**: No webhook events arriving

**Solution**:
1. Check webhook URL is publicly accessible
2. Verify webhook secret matches
3. Check [Service Name] dashboard for delivery failures
4. Review webhook handler logs: `grep "[service]" logs/webhooks.log`

### Issue: Rate Limit Exceeded

**Symptoms**: `429 Too Many Requests` errors

**Solution**:
1. Implement exponential backoff (already in client)
2. Reduce request frequency
3. Upgrade [Service Name] plan for higher limits

## Rate Limits & Costs

**Free Tier:**
- [X] requests per [time period]
- [Features included]

**Paid Tier:**
- [Y] requests per [time period]
- [Additional features]

**Current Usage:** Check at [link to usage dashboard]

## Security Considerations

- ✅ API keys stored in environment variables (never committed)
- ✅ Webhook signature verification prevents spoofing
- ✅ Rate limiting prevents abuse
- ✅ Sensitive data encrypted at rest
- ⚠️ [Any security concerns or limitations]

## Monitoring & Alerts

**Metrics to Monitor:**
- API request success rate (target: >99%)
- Webhook delivery success rate
- Average response time
- Error rates by error type

**Sentry Integration:**
- All API errors reported to Sentry with tags: `integration:[service]`
- Webhook failures tracked separately

**Alerts:**
- Alert if error rate >5% for 5 minutes
- Alert if webhook delivery failures >10 in 1 hour

## Related Documentation

- [Official [Service Name] API Docs](https://docs.service.com/api)
- [Architecture: API Design](../../architecture/api-design.md)
- [Error Tracking with Sentry](./sentry.md)

## Changelog

### 2025-11-02
- Initial integration implemented
- Webhook handler added
- Rate limiting configured

## Support

**[Service Name] Support:**
- Email: support@service.com
- Docs: https://docs.service.com
- Status: https://status.service.com

**Internal Support:**
- Slack: #integrations
- Issues: GitHub Issues with label `integration:[service]`
