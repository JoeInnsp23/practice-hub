# Practice Hub Security Audit

**Generated**: 2025-10-19  
**Audit Version**: v1.0  
**Security Level**: Pre-Production Review  
**Framework**: OWASP Top 10 2021

## Executive Summary

This document provides a comprehensive security audit of the Practice Hub application, analyzing authentication, authorization, input validation, and protection against common web vulnerabilities.

### Security Posture

✅ **Strong Points**:
- Better Auth for authentication (industry standard)
- tRPC with Zod validation (type-safe inputs)
- Server-side authorization checks
- Multi-tenant data isolation
- Password hashing with bcrypt
- Environment variable protection
- HTTPS-only in production

⚠️ **Areas Requiring Attention**:
- No rate limiting implemented
- Missing CSRF protection on some endpoints
- Sensitive data in logs (passwords, tokens)
- No input sanitization for XSS
- Missing security headers
- No API key rotation policy

---

## 1. Authentication & Authorization (OWASP A01, A07)

### 1.1 Authentication Implementation

**Framework**: Better Auth  
**Password Hashing**: bcrypt (✅ Secure)  
**Session Management**: Server-side with database storage

#### Strengths
✅ Industry-standard authentication library  
✅ Secure password hashing (bcrypt with salt)  
✅ Email/password authentication  
✅ Session stored server-side (not in JWT)  
✅ Better Auth handles session expiry

#### Vulnerabilities & Recommendations

##### Issue #1: No Account Lockout After Failed Attempts
**Risk**: HIGH  
**Impact**: Brute force attacks possible

**Current State**: No failed login attempt tracking

**Recommendation**:
```typescript
// Implement in Better Auth configuration
export const auth = betterAuth({
  // ... existing config
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email"]
    }
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 5      // 5 attempts per minute
  }
});
```

##### Issue #2: No Password Complexity Requirements
**Risk**: MEDIUM  
**Impact**: Weak passwords allowed

**Current State**: Minimal password validation

**Recommendation**:
```typescript
// In sign-up schema
password: z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character"),
```

##### Issue #3: No Two-Factor Authentication (2FA)
**Risk**: HIGH  
**Impact**: Account compromise if password leaked

**Recommendation**: Implement 2FA using Better Auth's built-in support
```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "Practice Hub",
      twoFactorPage: "/auth/2fa"
    })
  ]
});
```

### 1.2 Authorization Implementation

**Pattern**: Role-based access control (RBAC)  
**Roles**: admin, org:admin, accountant, member

#### Protected Procedures Analysis

**File**: `app/server/trpc.ts`

✅ **Correct Implementation**:
```typescript
// Authentication middleware
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.authContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in organization",
    });
  }
  return next({ ctx: { session: ctx.session, authContext: ctx.authContext } });
});

// Admin middleware
const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.authContext) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.authContext.role !== "admin" && ctx.authContext.role !== "org:admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

#### Vulnerabilities

##### Issue #4: Inconsistent Authorization Checks
**Risk**: HIGH  
**Impact**: Privilege escalation possible

**Example**: Some routers check role in handler instead of middleware

**Bad Pattern**:
```typescript
// portal.ts line 59
getCategories: protectedProcedure.query(async ({ ctx }) => {
  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  // This should use adminProcedure instead
});
```

**Recommended Fix**:
```typescript
getCategories: adminProcedure.query(async ({ ctx }) => {
  // Authorization already checked by middleware
  return await db.select()...
});
```

**Action Required**: Audit all routers for inline role checks and migrate to middleware

---

## 2. Input Validation (OWASP A03)

### 2.1 Current Implementation

**Framework**: Zod schemas  
**Location**: tRPC input validation

#### Strengths
✅ Type-safe validation with Zod  
✅ All procedures have input schemas  
✅ Min/max length validation  
✅ Email format validation  
✅ UUID format validation

#### Vulnerabilities

##### Issue #5: No XSS Input Sanitization
**Risk**: HIGH  
**Impact**: Stored XSS attacks possible

**Vulnerable Fields**:
- Client names
- Document descriptions
- Messages content
- Notes fields
- Custom metadata

**Current State**: Raw user input stored in database

**Recommendation**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize function
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    KEEP_CONTENT: true
  });
}

// In Zod schema
name: z.string()
  .min(1)
  .max(200)
  .transform(sanitizeInput),

// For rich text fields (if needed)
description: z.string()
  .transform((val) => DOMPurify.sanitize(val, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href']
  }))
```

##### Issue #6: No SQL Injection Protection Verification
**Risk**: LOW (Drizzle ORM provides protection)  
**Impact**: Data breach if raw SQL used

**Current State**: Using Drizzle ORM (parameterized queries)

**Verification Needed**:
```bash
# Search for raw SQL usage
grep -r "sql\`" app/server/routers/
grep -r "sql.raw" app/server/routers/
```

**Recommendation**: 
- ✅ Continue using Drizzle ORM exclusively
- ⚠️ Audit any raw SQL for proper parameter binding
- ✅ Never concatenate user input into SQL strings

##### Issue #7: File Upload Validation
**Risk**: HIGH  
**Impact**: Malicious file upload

**Current State**: Basic MIME type checking

**Recommendation**:
```typescript
// File upload validation
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): void {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'xlsx'];
  if (!ext || !allowedExts.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  // Scan file content (magic bytes)
  // Implement virus scanning in production
}
```

---

## 3. Sensitive Data Exposure (OWASP A02)

### 3.1 Data at Rest

#### Identified Sensitive Data
- User passwords (✅ bcrypt hashed)
- Client financial data
- Personal identification info (email, phone)
- Document content
- API keys in environment variables

#### Vulnerabilities

##### Issue #8: Sensitive Data in Logs
**Risk**: HIGH  
**Impact**: Credentials exposure via logs

**Bad Pattern Found**:
```typescript
// clientPortalAdmin.ts line 113
console.error("Failed to send invitation email:", error);
// May log email addresses and tokens
```

**Recommendation**:
```typescript
// Create safe logging utility
function logError(message: string, error: any, sensitiveFields: string[] = []) {
  const sanitizedError = { ...error };
  
  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitizedError[field]) {
      sanitizedError[field] = '[REDACTED]';
    }
  });
  
  console.error(message, sanitizedError);
}

// Usage
logError("Failed to send invitation email", error, ['email', 'token']);
```

##### Issue #9: No Database Encryption
**Risk**: MEDIUM  
**Impact**: Data breach if database compromised

**Recommendation**:
- Enable PostgreSQL SSL/TLS in production
- Consider encrypting PII columns (email, phone)
- Use AWS RDS encryption or similar

```typescript
// In production DATABASE_URL
postgresql://user:pass@host:5432/db?sslmode=require
```

### 3.2 Data in Transit

✅ **Strengths**:
- HTTPS enforced in production
- Better Auth uses secure cookies
- tRPC over HTTPS

⚠️ **Recommendations**:
- Implement HSTS headers
- Use Secure and HttpOnly cookie flags
- Implement Certificate Pinning for mobile apps

---

## 4. Rate Limiting (OWASP A05)

### 4.1 Current Implementation

❌ **No Rate Limiting Implemented**

**Vulnerable Endpoints**:
- Authentication (sign-in, sign-up)
- Password reset
- Email sending (invitations)
- API endpoints (all tRPC procedures)

### 4.2 Recommended Implementation

#### Global Rate Limiting
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Rate limit by IP
  const ip = request.ip ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }

  return NextResponse.next();
}
```

#### Endpoint-Specific Rate Limiting
```typescript
// Stricter for auth endpoints
const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute
});

// For email sending
const emailRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 emails per hour
});
```

---

## 5. Security Headers (OWASP A05)

### 5.1 Missing Security Headers

❌ **Current State**: Default Next.js headers only

**Required Headers**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self';
              connect-src 'self' https://api.better-auth.com;
              frame-src 'self' https://docuseal.com;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

---

## 6. CSRF Protection (OWASP A01)

### 6.1 Current Implementation

✅ **Better Auth**: Built-in CSRF protection  
⚠️ **tRPC**: No explicit CSRF tokens

### 6.2 Recommendations

#### For Better Auth Routes
✅ Already protected via Better Auth

#### For tRPC Mutations
```typescript
// Implement CSRF token verification
import { TRPCError } from "@trpc/server";

const csrfMiddleware = t.middleware(async ({ ctx, next }) => {
  // Get CSRF token from header
  const csrfToken = ctx.req.headers.get('x-csrf-token');
  const sessionToken = ctx.session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionToken) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Invalid CSRF token" });
  }

  return next({ ctx });
});

// Apply to mutations
export const protectedMutation = protectedProcedure.use(csrfMiddleware);
```

---

## 7. Session Management

### 7.1 Current Implementation

**Storage**: Database (Better Auth)  
**Expiry**: Handled by Better Auth  
**Cookie Settings**: Secure, HttpOnly

### 7.2 Recommendations

##### Issue #10: No Session Timeout Warning
**Risk**: LOW  
**Impact**: User data loss on unexpected logout

**Recommendation**:
```typescript
// Client-side session monitoring
useEffect(() => {
  let timeout: NodeJS.Timeout;
  
  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      toast.warning("Your session will expire in 5 minutes");
    }, SESSION_TIMEOUT - 5 * 60 * 1000);
  };
  
  // Reset on user activity
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
  };
}, []);
```

##### Issue #11: No Concurrent Session Control
**Risk**: MEDIUM  
**Impact**: Account sharing, security monitoring difficult

**Recommendation**: Track active sessions per user
```typescript
// Limit to 3 concurrent sessions per user
// Implement in Better Auth session creation
```

---

## 8. API Security

### 8.1 External API Keys

**Current State**: Stored in environment variables ✅

**APIs Used**:
- LemVerify (KYC)
- Resend (Email)
- Google Gemini (AI)
- DocuSeal (Documents)
- Xero (Accounting)
- S3 (Storage)

#### Vulnerabilities

##### Issue #12: No API Key Rotation
**Risk**: MEDIUM  
**Impact**: Compromised keys remain valid indefinitely

**Recommendation**:
- Implement 90-day API key rotation schedule
- Use key management service (AWS Secrets Manager, HashiCorp Vault)
- Monitor for unusual API usage patterns

##### Issue #13: API Keys in Client Bundle
**Risk**: CRITICAL  
**Impact**: Keys exposed to public

**Verification**:
```bash
# Check for NEXT_PUBLIC_ prefixed secrets
grep -r "NEXT_PUBLIC_.*KEY" .env.local
grep -r "NEXT_PUBLIC_.*SECRET" .env.local
```

**Rule**: Only use NEXT_PUBLIC_ for non-sensitive configuration

---

## 9. Tenant Isolation Security

### 9.1 Current Implementation

**Pattern**: tenantId in every query  
**Enforcement**: Application-level

#### Strengths
✅ Consistent tenantId filtering  
✅ Context-based tenant determination  
✅ No cross-tenant data leakage detected in tests

#### Vulnerabilities

##### Issue #14: No Database-Level Row Security
**Risk**: HIGH  
**Impact**: Application bug could leak cross-tenant data

**Recommendation**: Implement PostgreSQL Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON clients
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set tenant context in application
SET app.current_tenant_id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## 10. Dependency Security

### 10.1 Vulnerability Scanning

**Recommendation**: Implement automated scanning

```bash
# Run npm audit
pnpm audit

# Install and use Snyk
npx snyk test

# GitHub Dependabot (enable in repo settings)
```

### 10.2 Supply Chain Security

**Recommendations**:
- Lock dependencies with pnpm-lock.yaml ✅
- Review package.json for suspicious packages
- Use npm provenance
- Implement SCA (Software Composition Analysis)

---

## 11. Security Checklist

### Critical (Fix Before Production)
- [ ] Implement rate limiting (auth + API)
- [ ] Add XSS input sanitization
- [ ] Configure security headers
- [ ] Implement account lockout
- [ ] Add password complexity requirements
- [ ] Enable 2FA
- [ ] Fix inline authorization checks
- [ ] Sanitize error logs
- [ ] Enable database SSL/TLS
- [ ] Implement CSRF protection for mutations

### High Priority (Within 2 Weeks)
- [ ] Add session timeout warnings
- [ ] Implement API key rotation
- [ ] Add database row-level security
- [ ] Set up vulnerability scanning
- [ ] Implement file upload validation
- [ ] Add concurrent session limits
- [ ] Configure CSP headers properly
- [ ] Review and remove console.logs

### Medium Priority (Within 1 Month)
- [ ] Encrypt PII in database
- [ ] Implement key management service
- [ ] Add security monitoring/alerts
- [ ] Conduct penetration testing
- [ ] Review third-party dependencies
- [ ] Implement API request signing

---

## 12. OWASP Top 10 Compliance

| # | Vulnerability | Status | Notes |
|---|--------------|--------|-------|
| A01 | Broken Access Control | ⚠️ PARTIAL | Auth good, authorization needs review |
| A02 | Cryptographic Failures | ⚠️ PARTIAL | Passwords hashed, but no DB encryption |
| A03 | Injection | ✅ PROTECTED | Drizzle ORM prevents SQL injection |
| A04 | Insecure Design | ✅ GOOD | Multi-tenant architecture sound |
| A05 | Security Misconfiguration | ❌ NEEDS WORK | Missing headers, no rate limiting |
| A06 | Vulnerable Components | ⚠️ UNKNOWN | Needs dependency audit |
| A07 | Auth/Auth Failures | ⚠️ PARTIAL | No 2FA, no account lockout |
| A08 | Data Integrity Failures | ✅ GOOD | Type-safe with TypeScript/Zod |
| A09 | Security Logging | ❌ POOR | Sensitive data in logs |
| A10 | SSRF | ✅ PROTECTED | No user-controlled URLs |

---

## 13. Recommended Security Tools

### Development
- **ESLint Security Plugin**: Detect security issues in code
- **npm audit / Snyk**: Dependency vulnerability scanning
- **git-secrets**: Prevent committing secrets

### Production
- **Sentry**: Error tracking and monitoring
- **Cloudflare**: DDoS protection and WAF
- **AWS WAF**: Web application firewall
- **Upstash**: Redis for rate limiting

---

## 14. Incident Response Plan

### Security Breach Response
1. **Detection**: Monitor for unusual activity
2. **Containment**: Disable affected accounts/services
3. **Investigation**: Audit logs and determine scope
4. **Eradication**: Remove threat, patch vulnerabilities
5. **Recovery**: Restore services, rotate credentials
6. **Post-Incident**: Document lessons learned

---

## Conclusion

The Practice Hub application has a solid security foundation with Better Auth and type-safe validation. However, critical security enhancements are required before production deployment, particularly around rate limiting, input sanitization, and security headers.

**Priority Actions**:
1. ✅ Implement rate limiting (CRITICAL)
2. ✅ Add security headers (CRITICAL)
3. ✅ Sanitize user inputs (CRITICAL)
4. ✅ Enable 2FA (HIGH)
5. ✅ Implement database RLS (HIGH)

**Next Steps**: Proceed with Phase 8 (Production Readiness) while implementing critical security fixes in parallel.
