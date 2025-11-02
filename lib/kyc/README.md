# LEM Verify KYC Integration

**Location**: `lib/kyc/`
**Type**: Integration Library
**Status**: Active

## Overview

KYC (Know Your Customer) and AML (Anti-Money Laundering) verification integration with LEM Verify. Automates client identity verification and compliance checks.

## Files

- `lemverify-client.ts` - LEM Verify API client wrapper

## Key Functions

- `submitVerification(clientId, documents)` - Submit verification request
- `getVerificationStatus(verificationId)` - Check verification status
- `handleWebhook(payload, signature)` - Process LEM Verify webhooks

## Environment Variables

- `LEMVERIFY_API_KEY` - API authentication key
- `LEMVERIFY_ACCOUNT_ID` - Account identifier
- `LEMVERIFY_WEBHOOK_SECRET` - Webhook HMAC secret

## Usage

```typescript
import { lemverifyClient } from "@/lib/kyc/lemverify-client";

const result = await lemverifyClient.submitVerification({
  clientId: "123",
  type: "individual",
  documents: [...]
});
```

## Documentation

See [LEM Verify Integration Guide](../../docs/guides/integrations/lemverify.md)

## Testing

- Unit tests: `__tests__/lib/kyc/lemverify-client.test.ts`
- Webhook tests: `__tests__/api/webhooks/lemverify.test.ts`
