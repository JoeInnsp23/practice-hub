# CSRF Protection Strategy

## Overview

This application implements comprehensive CSRF (Cross-Site Request Forgery) protection through multiple layers:

1. **Better Auth Built-in CSRF Protection**
2. **SameSite Cookie Policy**
3. **Webhook Signature Verification**
4. **Rate Limiting**

## Better Auth CSRF Protection

Better Auth provides automatic CSRF protection for all authenticated requests. This is the primary defense mechanism.

### How It Works

1. **CSRF Tokens**: Better Auth automatically generates and validates CSRF tokens for all state-changing operations (POST, PUT, DELETE, PATCH)
2. **Cookie-Based Sessions**: Session cookies are configured with secure flags
3. **Origin Verification**: Better Auth validates request origins against configured allowed origins

### Configuration

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // ... database config
  },
  // CSRF protection is enabled by default
  // No additional configuration needed
});
```

### Protected Operations

The following operations are automatically protected by Better Auth's CSRF mechanism:

- User authentication (sign-in, sign-out)
- Password changes
- Profile updates
- Session management
- All tRPC mutations (through Better Auth context)

## SameSite Cookie Policy

All authentication cookies use the `SameSite=Lax` attribute, which prevents cookies from being sent with cross-site requests except for top-level navigation.

**Impact:**
- Protects against most CSRF attacks
- Allows normal navigation flows (e.g., clicking links from email)
- Blocks cross-site POST requests with cookies

## Webhook Signature Verification

External webhooks (LEM Verify, DocuSeal, etc.) use HMAC-SHA256 signature verification to prevent unauthorized requests.

### Implementation

```typescript
// app/api/webhooks/lemverify/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-lemverify-signature");

  // Verify signature
  const webhookSecret = process.env.LEMVERIFY_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Process webhook...
}
```

**Protected Endpoints:**
- `/api/webhooks/lemverify` - KYC verification results
- `/api/webhooks/docuseal` - Document signing events

## Rate Limiting

Rate limiting provides an additional layer of protection against automated CSRF attacks and abuse.

### Implementation

```typescript
// app/api/onboarding/upload-documents/route.ts
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, {
    maxRequests: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Process request...
}
```

**Rate-Limited Endpoints:**
- `/api/onboarding/upload-documents` - 10 uploads per 10 minutes per IP
- Future: All public-facing mutation endpoints

## Additional CSRF Protections

### 1. Origin Header Validation

Better Auth automatically validates the `Origin` header for cross-origin requests.

### 2. Content-Type Restrictions

State-changing endpoints expect specific content types:
- `application/json` for API routes
- `multipart/form-data` for file uploads

Simple forms from cross-origin cannot set these headers, providing implicit CSRF protection.

### 3. Custom Request Headers

tRPC requests include custom headers that cannot be set by simple forms:
- `x-trpc-source: react-query`
- Better Auth session headers

## Security Best Practices for Developers

### ✅ DO

1. **Use tRPC for mutations**: All state-changing operations should use tRPC `protectedProcedure` or `adminProcedure`
2. **Validate webhook signatures**: Always verify HMAC signatures for external webhooks
3. **Use Better Auth helpers**: Use `auth.api.getSession()` for authentication checks
4. **Apply rate limiting**: Add rate limiting to public-facing endpoints
5. **Use POST for mutations**: Never use GET requests for state-changing operations

### ❌ DON'T

1. **Don't disable CSRF protection**: Never bypass Better Auth's CSRF checks
2. **Don't trust request origin alone**: Always validate session + CSRF token
3. **Don't use cookies for API authentication**: Use Better Auth session system
4. **Don't expose sensitive endpoints without protection**: All mutations must be protected
5. **Don't implement custom CSRF tokens**: Use Better Auth's built-in protection

## Testing CSRF Protection

### Manual Testing

1. **Cross-Origin Request Test**:
   ```bash
   # This should fail with CSRF error
   curl -X POST https://app.innspiredaccountancy.com/api/auth/sign-in \
     -H "Origin: https://malicious-site.com" \
     -d '{"email":"test@example.com","password":"test"}'
   ```

2. **Missing CSRF Token Test**:
   ```javascript
   // This should fail in browser console
   fetch('/api/onboarding/submit-questionnaire', {
     method: 'POST',
     credentials: 'include',
     body: JSON.stringify({...})
   });
   ```

### Automated Testing

Future: Add automated CSRF protection tests using Playwright/Cypress.

## Incident Response

If a CSRF vulnerability is discovered:

1. **Immediate**: Disable affected endpoint if possible
2. **Short-term**: Apply hotfix with additional CSRF checks
3. **Long-term**: Review all similar endpoints for same vulnerability
4. **Notify**: Inform users if sensitive data was potentially exposed

## References

- [Better Auth Security Documentation](https://www.better-auth.com/docs/security)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [SameSite Cookie Spec](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Version History

- **2025-10-10**: Initial documentation (Sprint 3 - KYC/AML System Optimizations)
