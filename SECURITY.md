# Security Policy

**Last Updated**: 2025-10-10
**Version**: 1.0

This document outlines the security policies, practices, and procedures for Practice Hub. Security is a top priority, and we are committed to protecting user data and maintaining compliance with UK regulations.

---

## Table of Contents

1. [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
2. [Supported Versions](#supported-versions)
3. [Security Overview](#security-overview)
4. [Authentication and Authorization](#authentication-and-authorization)
5. [Data Protection](#data-protection)
6. [API Security](#api-security)
7. [Multi-Tenancy Security](#multi-tenancy-security)
8. [KYC/AML Compliance](#kycaml-compliance)
9. [Audit Logging](#audit-logging)
10. [Incident Response](#incident-response)
11. [Security Best Practices](#security-best-practices)
12. [Compliance](#compliance)
13. [Security Contacts](#security-contacts)

---

## Reporting Security Vulnerabilities

### How to Report

If you discover a security vulnerability, please report it responsibly:

**DO NOT**:
- ❌ Open a public GitHub issue
- ❌ Discuss publicly on forums or social media
- ❌ Exploit the vulnerability

**DO**:
- ✅ Email: security@practicehub.com *(update with actual email)*
- ✅ Use PGP encryption (key below)
- ✅ Wait for acknowledgment before disclosure

### What to Include

Please provide:
1. **Description**: What is the vulnerability?
2. **Impact**: What could an attacker do?
3. **Steps to Reproduce**: How to trigger the vulnerability
4. **Proof of Concept**: Code or screenshots (if applicable)
5. **Suggested Fix**: If you have ideas

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 3 business days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days
- **Disclosure**: After fix deployed (coordinated disclosure)

### PGP Key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[PGP key for security@practicehub.com]
-----END PGP PUBLIC KEY BLOCK-----
```

---

## Supported Versions

| Version | Supported | Security Updates |
|---------|-----------|------------------|
| 1.x.x | ✅ Yes | Active development |
| 0.x.x | ❌ No | Upgrade to 1.x |

**Recommendation**: Always use the latest stable version.

---

## Security Overview

### Security Layers

Practice Hub implements defense-in-depth with multiple security layers:

**Application Layer**:
- Input validation (Zod schemas)
- Output encoding
- CSRF protection
- Rate limiting

**Authentication Layer**:
- Better Auth with bcrypt password hashing
- Session management with secure cookies
- OAuth 2.0 (Microsoft)
- Multi-factor authentication (planned)

**Database Layer**:
- Multi-tenant isolation (row-level security)
- Parameterized queries (SQL injection prevention)
- Database encryption at rest

**Network Layer**:
- TLS 1.3 (HTTPS)
- Secure headers (CSP, HSTS, etc.)
- DDoS protection (Cloudflare)

**Infrastructure Layer**:
- Regular security updates
- Firewall configuration
- Intrusion detection

---

## Authentication and Authorization

### Password Security

**Hashing**: bcrypt with 12 rounds
```typescript
import bcrypt from "bcryptjs";

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

**Requirements**:
- Minimum length: 8 characters
- No common passwords (checked against list)
- No username in password

**Storage**:
- Passwords hashed before storage
- Original passwords never logged or stored
- Password reset tokens expire in 1 hour

### Session Management

**Session Properties**:
- Session ID: Cryptographically random (32 bytes)
- TTL: 7 days (30 days with "Remember Me")
- Storage: HTTP-only cookies (XSS prevention)
- Transmission: Secure flag (HTTPS only)
- SameSite: Strict (CSRF prevention)

**Session Invalidation**:
- On password change
- On sign-out
- On security event (e.g., password reset)
- On suspicious activity

### Multi-Factor Authentication (MFA)

**Status**: Planned for v1.1

**Planned methods**:
- TOTP (Time-based One-Time Password) via authenticator apps
- SMS backup codes

### OAuth 2.0 (Microsoft)

**Security measures**:
- State parameter (CSRF prevention)
- PKCE (Proof Key for Code Exchange)
- Token validation
- Redirect URI validation

### Role-Based Access Control (RBAC)

**Roles**:
- `user` - Standard staff member
- `admin` - System administrator

**Authorization checks**:
```typescript
// Server-side (tRPC)
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});

// Server Component
const authContext = await getAuthContext();
if (!authContext || authContext.role !== "admin") {
  redirect("/");
}
```

---

## Data Protection

### Encryption

**In Transit**:
- TLS 1.3 for all connections
- HTTPS enforced (HTTP redirects to HTTPS)
- Certificate pinning (planned)

**At Rest**:
- PostgreSQL transparent data encryption
- S3 bucket encryption (AES-256)
- Backup encryption

**Sensitive Fields**:
- Passwords: bcrypt hashed
- Tokens: Encrypted before storage
- API keys: Environment variables only (never committed)

### Data Minimization

**Principle**: Only collect necessary data

**Implementation**:
- KYC documents deleted after 7 years (retention requirement)
- Session data deleted after expiration
- Activity logs retained for 2 years (compliance)

### Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Client records | 7 years | UK MLR 2017 |
| KYC documents | 7 years | UK MLR 2017 |
| Financial records | 6 years | HMRC requirement |
| Activity logs | 2 years | Security auditing |
| Session data | 30 days | Immediate expiration + grace |

### Backups

**Frequency**:
- Database: Daily (full) + Hourly (incremental)
- S3 objects: Versioning enabled

**Security**:
- Encrypted with AES-256
- Stored in separate region
- Access restricted (admin only)
- Tested quarterly

**RTO/RPO**:
- Recovery Time Objective: 4 hours
- Recovery Point Objective: 1 hour

---

## API Security

### Input Validation

**All inputs validated** with Zod schemas:

```typescript
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),  // E.164 format
  website: z.string().url().optional(),
});

// Usage in tRPC
export const clientsRouter = router({
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ input }) => {
      // Input guaranteed valid
    }),
});
```

### SQL Injection Prevention

**Use Drizzle ORM** (parameterized queries):

```typescript
// ✅ Safe: Parameterized
const clients = await db.select().from(clientsTable)
  .where(eq(clientsTable.name, userInput));

// ❌ Unsafe: String concatenation
const clients = await db.execute(`SELECT * FROM clients WHERE name = '${userInput}'`);
```

### XSS Prevention

**Output encoding**:
- React automatically escapes content
- Use `dangerouslySetInnerHTML` only with sanitized HTML

**Content Security Policy**:
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
];
```

### CSRF Protection

**Better Auth** provides CSRF protection:
- CSRF token in cookies
- Token validated on state-changing requests
- SameSite=Strict cookies

### Rate Limiting

**Implemented on critical endpoints**:

```typescript
// lib/rate-limit.ts
import { RateLimiter } from "@/lib/rate-limiter";

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
});

// Webhook endpoint
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!limiter.check(ip)) {
    return new Response("Too many requests", { status: 429 });
  }

  // Process request
}
```

**Rate limits**:
- Authentication endpoints: 5 attempts per 15 minutes per IP
- API endpoints: 100 requests per 15 minutes per user
- Webhook endpoints: 100 requests per minute per IP

---

## Multi-Tenancy Security

### Tenant Isolation

**CRITICAL**: All queries MUST filter by `tenantId`

**Enforcement**:
```typescript
// ✅ Correct: Filters by tenantId
const clients = await db.select().from(clientsTable)
  .where(
    and(
      eq(clientsTable.tenantId, ctx.authContext.tenantId),
      eq(clientsTable.status, "active")
    )
  );

// ❌ SECURITY RISK: Missing tenantId filter
const clients = await db.select().from(clientsTable)
  .where(eq(clientsTable.status, "active"));
```

**Testing**:
- Integration tests verify tenant isolation
- Manual testing with multiple tenants

### Cross-Tenant Access Prevention

**Checks**:
1. User authenticated (session exists)
2. User belongs to tenant (authContext.tenantId)
3. Resource belongs to same tenant
4. User has permission for action (role-based)

**Example**:
```typescript
export const clientsRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await db.select().from(clientsTable)
        .where(
          and(
            eq(clientsTable.id, input.id),
            eq(clientsTable.tenantId, ctx.authContext.tenantId)  // ← Tenant check
          )
        );

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return client;
    }),
});
```

---

## KYC/AML Compliance

### UK MLR 2017 Compliance

**Requirements met**:
- ✅ Identity verification (LEM Verify)
- ✅ AML screening (PEP, sanctions, watchlists)
- ✅ 7-year data retention
- ✅ Audit trail (all actions logged)
- ✅ Enhanced due diligence (for PEP matches)

### Document Security

**KYC documents**:
- Stored in S3 with encryption
- Access via pre-signed URLs (expire in 1 hour)
- Deleted after 7 years (automated)
- Access logged (who, when, why)

### AML Screening

**Sources**:
- UK government sanctions lists
- EU sanctions lists
- OFAC sanctions list
- PEP databases (LexisNexis via LEM Verify)
- Adverse media screening

**Frequency**:
- Initial: During onboarding
- Ongoing: Annual re-screening (automated)
- Ad-hoc: When triggered by risk event

---

## Audit Logging

### What We Log

**User actions**:
- Sign in / Sign out
- Password changes
- Profile updates
- Data access (view, create, update, delete)
- Admin actions

**System events**:
- Failed authentication attempts
- Rate limit violations
- Security events (e.g., suspicious activity)
- Integration failures

**Compliance events**:
- KYC verification completion
- AML screening results
- Admin approvals/rejections
- Data exports

### Log Format

```typescript
interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  entityType: string;  // "client", "user", "task", etc.
  entityId: string;
  action: string;  // "create", "update", "delete", "view"
  metadata: Record<string, any>;  // Changed fields, context
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Log Retention

- **Compliance logs**: 7 years
- **Activity logs**: 2 years
- **Security logs**: 3 years
- **System logs**: 90 days

### Log Access

**Who can access**:
- Admins: All logs for their tenant
- Compliance team: KYC/AML logs
- Security team: Security logs (all tenants)
- Users: Own activity logs

---

## Incident Response

### Incident Classification

| Severity | Definition | Response Time |
|----------|------------|---------------|
| **Critical** | Data breach, system down | Immediate (< 1 hour) |
| **High** | Security vulnerability, data loss | 4 hours |
| **Medium** | Service degradation | 24 hours |
| **Low** | Minor issues | 7 days |

### Incident Response Process

**1. Detection**:
- Automated alerts (monitoring)
- User reports
- Security scans

**2. Containment**:
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs

**3. Investigation**:
- Review logs
- Identify root cause
- Assess impact

**4. Remediation**:
- Apply fixes
- Update security measures
- Restore services

**5. Communication**:
- Notify affected users (GDPR requirement)
- Report to ICO (if required)
- Public disclosure (if appropriate)

**6. Post-Mortem**:
- Document lessons learned
- Update security policies
- Implement preventive measures

### Data Breach Response

**Legal obligations** (GDPR):
- Notify ICO within 72 hours
- Notify affected users without undue delay
- Document breach in breach register

**Steps**:
1. Contain breach
2. Assess scope (what data, how many users)
3. Notify ICO: https://ico.org.uk/for-organisations/report-a-breach/
4. Notify users via email
5. Offer support (credit monitoring, etc.)
6. Document breach

---

## Security Best Practices

### For Developers

**Code Security**:
- ✅ Always validate input
- ✅ Use parameterized queries (Drizzle ORM)
- ✅ Filter by tenantId in all queries
- ✅ Use TypeScript strict mode
- ✅ Review dependencies for vulnerabilities (`pnpm audit`)
- ✅ Never commit secrets (use `.env.local`)
- ✅ Use environment variables for configuration

**Authentication**:
- ✅ Use `getAuthContext()` for tenant context
- ✅ Use `protectedProcedure` for authenticated endpoints
- ✅ Use `adminProcedure` for admin-only endpoints
- ✅ Verify authorization on every request

**Testing**:
- ✅ Test tenant isolation
- ✅ Test authorization (try accessing other users' data)
- ✅ Test input validation (try malicious input)

### For Admins

**Access Control**:
- ✅ Use strong passwords (min 12 characters)
- ✅ Enable MFA when available
- ✅ Review user permissions quarterly
- ✅ Revoke access promptly when staff leave

**Monitoring**:
- ✅ Review activity logs weekly
- ✅ Monitor failed sign-in attempts
- ✅ Check for unusual API usage

**Backups**:
- ✅ Verify backups complete successfully
- ✅ Test restore quarterly
- ✅ Store backups securely (encrypted, separate location)

### For Users

**Account Security**:
- ✅ Use unique passwords (password manager recommended)
- ✅ Enable MFA when available
- ✅ Sign out when done (especially on shared devices)
- ✅ Report suspicious activity immediately

**Data Handling**:
- ✅ Only share client data when necessary
- ✅ Use secure channels (not personal email)
- ✅ Delete sensitive data when no longer needed

---

## Compliance

### GDPR (General Data Protection Regulation)

**Rights supported**:
- ✅ Right to access (data export)
- ✅ Right to rectification (edit profile)
- ✅ Right to erasure (delete account, subject to retention)
- ✅ Right to data portability (export as JSON/CSV)
- ✅ Right to object (opt-out of marketing)

**Data Protection Officer**:
- Email: dpo@practicehub.com *(update with actual email)*

**Legal basis for processing**:
- Contract performance (client data)
- Legal obligation (KYC/AML compliance)
- Legitimate interest (security, fraud prevention)

### UK MLR 2017 (Money Laundering Regulations)

**Compliance measures**:
- ✅ Customer due diligence (identity verification)
- ✅ Enhanced due diligence (for PEPs)
- ✅ AML screening (sanctions, watchlists)
- ✅ 7-year record retention
- ✅ Suspicious activity reporting (to NCA)

### ISO 27001 Alignment

Practice Hub aligns with ISO 27001 information security standards:
- Asset management
- Access control
- Cryptography
- Physical security
- Operations security
- Communications security
- Incident management
- Business continuity

---

## Security Contacts

### General Security

- **Email**: security@practicehub.com *(update with actual email)*
- **PGP Key**: [See above](#pgp-key)

### Data Protection

- **Data Protection Officer**: dpo@practicehub.com *(update with actual email)*
- **Privacy Policy**: https://practicehub.com/privacy *(update with actual URL)*

### Compliance

- **Compliance Officer**: compliance@practicehub.com *(update with actual email)*
- **UK ICO Registration**: [ICO registration number] *(add when registered)*

### Emergency

- **Critical security issues**: Call [emergency phone number] *(add phone number)*
- **After hours**: [on-call rotation] *(add on-call info)*

---

## Security Roadmap

### Planned Security Enhancements

**v1.1** (Q1 2026):
- Multi-factor authentication (TOTP)
- Advanced rate limiting (per-user, adaptive)
- Security headers enhancement (CSP strict mode)

**v1.2** (Q2 2026):
- Penetration testing (external firm)
- Bug bounty program launch
- SOC 2 Type I certification

**v2.0** (Q3 2026):
- End-to-end encryption (client documents)
- Zero-knowledge architecture (planned)
- Hardware security key support (WebAuthn)

---

## Acknowledgments

We thank the security researchers who have responsibly disclosed vulnerabilities:

- [Name] - [Vulnerability] - [Date]

*(Update as vulnerabilities are reported and fixed)*

---

## Questions?

For security-related questions:
1. Email: security@practicehub.com
2. Review this policy first
3. Check [FAQ](docs/user-guides/FAQ.md) for common questions

**Thank you for helping keep Practice Hub secure!**

---

**Last Updated**: 2025-10-10
**Maintained By**: Security Team
**Next Review**: 2026-01-10
