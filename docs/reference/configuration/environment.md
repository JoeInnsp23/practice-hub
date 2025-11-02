---
title: Environment Variables Reference
description: Complete list of required and optional environment variables
audience: dev, ops
status: complete
generated: HYBRID
---

# Environment Variables Reference

<!-- BEGIN AI-GENERATED -->
**Total Variables**: {{repo-facts.envVars.total}}
**Required**: {{repo-facts.envVars.required.length}}
**Optional**: {{repo-facts.envVars.optional.length}}

**AI Summary**: Variable usage patterns and recommendations will be auto-generated here.
<!-- END AI-GENERATED -->

---

<!-- HUMAN-AUTHORED SECTION -->

This document provides a complete reference for all environment variables used in Practice Hub.

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Environment-Specific Configuration](#environment-specific-configuration)
4. [Security Best Practices](#security-best-practices)

---

## Required Variables

These variables are **required** for the application to run properly.

### Database

#### `DATABASE_URL`

**Description**: PostgreSQL connection string
**Required**: Yes
**Format**: `postgresql://user:password@host:port/database`
**Example**: `postgresql://postgres:password@localhost:5432/practice_hub`
**Notes**:
- Must be accessible from application server
- User must have full permissions (CREATE, DROP, SELECT, INSERT, UPDATE, DELETE)
- Connection pooling handled by Drizzle ORM

**Development**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"
```

**Production**:
```env
DATABASE_URL="postgresql://prod_user:strong_password@db.example.com:5432/practice_hub_prod"
```

---

### Authentication (Better Auth)

#### `BETTER_AUTH_SECRET`

**Description**: Secret key for session encryption and CSRF tokens
**Required**: Yes
**Format**: Random base64 string (minimum 32 characters)
**Example**: `"dGVzdC1zZWNyZXQta2V5LWZvci1hdXRo..."`
**Security**: ⚠️ **CRITICAL** - Never commit to git, use different value for each environment

**Generate**:
```bash
openssl rand -base64 32
```

**Development**:
```env
BETTER_AUTH_SECRET="test-secret-key-for-auth-development-only"
```

**Production**:
```env
BETTER_AUTH_SECRET="<generate-unique-secret-with-openssl>"
```

---

#### `BETTER_AUTH_URL`

**Description**: Server-side base URL for Better Auth
**Required**: Yes
**Format**: Full URL with protocol (http or https)
**Example**: `"https://app.innspiredaccountancy.com"`
**Notes**: Used for OAuth redirects and session management

**Development**:
```env
BETTER_AUTH_URL="http://localhost:3000"
```

**Production**:
```env
BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
```

---

#### `NEXT_PUBLIC_BETTER_AUTH_URL`

**Description**: Client-side base URL for Better Auth
**Required**: Yes
**Format**: Full URL with protocol
**Example**: `"https://app.innspiredaccountancy.com"`
**Notes**: Must match `BETTER_AUTH_URL`, used by client-side auth hooks

**Development**:
```env
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

**Production**:
```env
NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
```

---

## Optional Variables

These variables enable additional features but are not required for basic functionality.

### Microsoft OAuth

#### `MICROSOFT_CLIENT_ID`

**Description**: Azure AD application client ID
**Required**: No (but required for Microsoft OAuth)
**Format**: UUID
**Example**: `"f9e3ca9e-0f80-4ffc-a216-951146248899"`
**Where to get**: Azure Portal → App Registrations → Your App → Overview

**Setup**: See [`/docs/MICROSOFT_OAUTH_SETUP.md`](/docs/MICROSOFT_OAUTH_SETUP.md)

```env
MICROSOFT_CLIENT_ID="your-microsoft-client-id-here"
```

---

#### `MICROSOFT_CLIENT_SECRET`

**Description**: Azure AD application client secret
**Required**: No (but required for Microsoft OAuth)
**Format**: String
**Example**: `"V2_8Q~EXAMPLE_SECRET_REPLACE_WITH_REAL"`
**Security**: ⚠️ Secret expires after 24 months, set calendar reminder. NEVER commit to git.
**Where to get**: Azure Portal → App Registrations → Your App → Certificates & secrets

```env
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

---

### KYC/AML (LEM Verify)

#### `LEMVERIFY_API_KEY`

**Description**: LEM Verify API key for identity verification
**Required**: No (but required for KYC/AML onboarding)
**Format**: String
**Example**: `"your-lemverify-api-key"`
**Where to get**: https://lemverify.com/dashboard → Settings → API Keys

```env
LEMVERIFY_API_KEY="your-lemverify-api-key"
```

---

#### `LEMVERIFY_ACCOUNT_ID`

**Description**: LEM Verify account identifier
**Required**: No (but required for KYC/AML onboarding)
**Format**: String
**Example**: `"your-account-id"`
**Where to get**: https://lemverify.com/dashboard → Settings → Account Details

```env
LEMVERIFY_ACCOUNT_ID="your-lemverify-account-id"
```

---

#### `LEMVERIFY_API_URL`

**Description**: LEM Verify API base URL
**Required**: No
**Default**: `"https://api.lemverify.com/v1"`
**Format**: Full URL
**Notes**: Usually no need to change unless using sandbox

```env
LEMVERIFY_API_URL="https://api.lemverify.com/v1"
```

---

#### `LEMVERIFY_WEBHOOK_SECRET`

**Description**: Secret for verifying webhook signatures from LEM Verify
**Required**: No (but required for webhook verification)
**Format**: String
**Security**: ⚠️ Used for HMAC-SHA256 signature verification
**Where to get**: LEM Verify Dashboard → Settings → Webhooks

```env
LEMVERIFY_WEBHOOK_SECRET="your-webhook-secret-from-lemverify"
```

---

### AI Document Extraction (Google Gemini)

#### `GOOGLE_AI_API_KEY`

**Description**: Google AI API key for Gemini 2.0 Flash model
**Required**: No (but required for document extraction)
**Format**: String
**Example**: `"AIzaSy..."`
**Where to get**: Google Cloud Console → APIs & Services → Credentials
**Rate limits**: 60 requests/minute (default, check your quota)

**Setup**:
1. Create Google Cloud project
2. Enable Gemini API
3. Create API key
4. Add to environment variables

```env
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

---

### Email (Resend)

#### `RESEND_API_KEY`

**Description**: Resend API key for transactional emails
**Required**: No (but required for email notifications)
**Format**: String with `re_` prefix
**Example**: `"re_123456789"`
**Where to get**: https://resend.com/dashboard → API Keys

```env
RESEND_API_KEY="re_your_api_key"
```

---

#### `RESEND_FROM_EMAIL`

**Description**: Default "from" email address for outgoing emails
**Required**: No
**Default**: `"noreply@innspiredaccountancy.com"`
**Format**: Valid email address
**Notes**: Domain must be verified in Resend dashboard

```env
RESEND_FROM_EMAIL="noreply@innspiredaccountancy.com"
```

---

#### `RESEND_TEAM_EMAIL`

**Description**: Team email for internal notifications
**Required**: No
**Default**: `"team@innspiredaccountancy.com"`
**Format**: Valid email address

```env
RESEND_TEAM_EMAIL="team@innspiredaccountancy.com"
```

---

### Object Storage (S3-Compatible)

#### `S3_ENDPOINT`

**Description**: S3-compatible storage endpoint
**Required**: No (but required for document storage)
**Format**: Full URL with protocol
**Example (MinIO local)**: `"http://localhost:9000"`
**Example (Hetzner prod)**: `"https://fsn1.your-objectstorage.com"`

**Development** (MinIO):
```env
S3_ENDPOINT="http://localhost:9000"
```

**Production** (Hetzner):
```env
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
```

---

#### `S3_ACCESS_KEY_ID`

**Description**: S3 access key ID
**Required**: No (but required for S3 operations)
**Format**: String
**Example (MinIO)**: `"minioadmin"`
**Example (Hetzner)**: `"your-hetzner-access-key"`

**Development**:
```env
S3_ACCESS_KEY_ID="minioadmin"
```

**Production**:
```env
S3_ACCESS_KEY_ID="your-hetzner-access-key"
```

---

#### `S3_SECRET_ACCESS_KEY`

**Description**: S3 secret access key
**Required**: No (but required for S3 operations)
**Format**: String
**Security**: ⚠️ Keep secret, never commit
**Example (MinIO)**: `"minioadmin"`

**Development**:
```env
S3_SECRET_ACCESS_KEY="minioadmin"
```

**Production**:
```env
S3_SECRET_ACCESS_KEY="your-hetzner-secret-key"
```

---

#### `S3_BUCKET_NAME`

**Description**: S3 bucket name for storing documents
**Required**: No
**Default**: `"practice-hub-proposals"`
**Format**: String (lowercase, no spaces)
**Notes**: Bucket must exist before first upload

**Development**:
```env
S3_BUCKET_NAME="practice-hub-proposals"
```

**Production**:
```env
S3_BUCKET_NAME="practice-hub-onboarding"
```

---

#### `S3_REGION`

**Description**: S3 bucket region
**Required**: No
**Default**: `"us-east-1"`
**Format**: AWS region code
**Example**: `"eu-central"` for Hetzner EU

**Development**:
```env
S3_REGION="us-east-1"
```

**Production** (Hetzner):
```env
S3_REGION="eu-central"
```

---

### Application Configuration

#### `NEXT_PUBLIC_APP_URL`

**Description**: Public application URL (for generated links in PDFs, emails)
**Required**: No
**Default**: Same as `BETTER_AUTH_URL`
**Format**: Full URL with protocol

**Development**:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Production**:
```env
NEXT_PUBLIC_APP_URL="https://app.innspiredaccountancy.com"
```

---

#### `NEXT_PUBLIC_SUPPORT_EMAIL`

**Description**: Support email address displayed in UI
**Required**: No
**Default**: `"support@innspiredaccountancy.com"`
**Format**: Valid email address

```env
NEXT_PUBLIC_SUPPORT_EMAIL="support@innspiredaccountancy.com"
```

---

### E-Signature (DocuSeal)

#### `DOCUSEAL_API_KEY`

**Description**: DocuSeal API key for e-signatures
**Required**: Yes (if using DocuSeal for proposal signing)
**Format**: String
**Where to get**: DocuSeal Admin UI → Settings → API Keys → Generate New Key

**How to obtain (self-hosted):**
1. Start DocuSeal: `docker compose up -d docuseal`
2. Navigate to: `http://localhost:3030`
3. Go to Settings → API Keys
4. Click "Generate New API Key"
5. Copy the key and add to `.env.local`

```env
DOCUSEAL_API_KEY="your-docuseal-api-key"
```

---

#### `DOCUSEAL_HOST`

**Description**: DocuSeal instance base URL
**Required**: Yes (if using DocuSeal)
**Default**: `"http://localhost:3030"` (self-hosted)
**Format**: Full URL with protocol
**Notes**: Used for API calls and embedded signing iframes

**Development**:
```env
DOCUSEAL_HOST="http://localhost:3030"
```

**Production**:
```env
DOCUSEAL_HOST="https://docuseal.yourdomain.com"
```

---

#### `DOCUSEAL_SECRET_KEY`

**Description**: Secret key for DocuSeal application (used by DocuSeal itself)
**Required**: Yes (if using DocuSeal)
**Format**: Random base64 string (minimum 32 characters)
**Security**: ⚠️ **CRITICAL** - Used by DocuSeal for session encryption
**Notes**: This is separate from `DOCUSEAL_WEBHOOK_SECRET` - it's for DocuSeal's internal use

**Generate**:
```bash
openssl rand -base64 32
```

**Development**:
```env
DOCUSEAL_SECRET_KEY="test-secret-key-for-development-only"
```

**Production**:
```env
DOCUSEAL_SECRET_KEY="<generate-unique-secret-with-openssl>"
```

---

#### `DOCUSEAL_WEBHOOK_SECRET`

**Description**: Secret key for verifying webhook signatures from DocuSeal
**Required**: Yes (if using DocuSeal webhooks)
**Format**: Random base64 string (minimum 32 characters)
**Security**: ⚠️ **CRITICAL** - Used for HMAC-SHA256 signature verification of webhook payloads
**Where to configure**:
1. Generate secret with `openssl rand -base64 32`
2. Add to your app's `.env.local`
3. Add the **same secret** to DocuSeal Admin UI → Settings → Webhooks

**How webhook verification works:**
1. DocuSeal signs webhook payload with HMAC-SHA256 using this secret
2. Webhook is sent with `x-docuseal-signature` header
3. Your app recalculates signature using the same secret
4. If signatures match, webhook is authentic

**Generate**:
```bash
openssl rand -base64 32
```

**Development**:
```env
DOCUSEAL_WEBHOOK_SECRET="test-webhook-secret-for-development"
```

**Production**:
```env
DOCUSEAL_WEBHOOK_SECRET="<generate-unique-secret-with-openssl>"
```

**Setup in DocuSeal:**
- Navigate to: `http://localhost:3030/settings/webhooks`
- Webhook URL: `http://your-app-url:3000/api/webhooks/docuseal`
- Secret: Enter the **same secret** from your `.env.local`
- Events: Select `submission.completed`

---

### Monitoring & Observability

#### `SENTRY_DSN`

**Description**: Sentry DSN for error tracking
**Required**: No (but recommended for production)
**Format**: Sentry DSN URL
**Where to get**: Sentry dashboard → Project Settings → Client Keys (DSN)

```env
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

---

#### `NEXT_PUBLIC_SENTRY_DSN`

**Description**: Client-side Sentry DSN
**Required**: No
**Format**: Sentry DSN URL
**Notes**: Usually same as `SENTRY_DSN`

```env
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

---

## Environment-Specific Configuration

### Development (.env.local)

Minimal configuration for local development:

```env
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"
BETTER_AUTH_SECRET="test-secret-key-for-auth-development-only"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Optional - for testing features
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# MinIO (local S3)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="us-east-1"

# Optional - KYC testing
LEMVERIFY_API_KEY="test-api-key"
LEMVERIFY_ACCOUNT_ID="test-account"
LEMVERIFY_WEBHOOK_SECRET="test-webhook-secret"
GOOGLE_AI_API_KEY="your-test-api-key"

# Optional - email testing
RESEND_API_KEY="re_test_key"
```

---

### Production (.env or hosting platform)

Complete configuration for production deployment:

```env
# Required
DATABASE_URL="postgresql://prod_user:strong_password@db.example.com:5432/practice_hub_prod"
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="f9e3ca9e-0f80-4ffc-a216-951146248899"
MICROSOFT_CLIENT_SECRET="production-secret-from-azure"

# KYC/AML
LEMVERIFY_API_KEY="production-lemverify-api-key"
LEMVERIFY_ACCOUNT_ID="production-account-id"
LEMVERIFY_API_URL="https://api.lemverify.com/v1"
LEMVERIFY_WEBHOOK_SECRET="production-webhook-secret"
GOOGLE_AI_API_KEY="production-google-ai-key"

# Email
RESEND_API_KEY="re_production_api_key"
RESEND_FROM_EMAIL="noreply@innspiredaccountancy.com"
RESEND_TEAM_EMAIL="team@innspiredaccountancy.com"

# Storage (Hetzner S3)
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="hetzner-access-key"
S3_SECRET_ACCESS_KEY="hetzner-secret-key"
S3_BUCKET_NAME="practice-hub-onboarding"
S3_REGION="eu-central"

# Application
NEXT_PUBLIC_APP_URL="https://app.innspiredaccountancy.com"
NEXT_PUBLIC_SUPPORT_EMAIL="support@innspiredaccountancy.com"

# Monitoring
SENTRY_DSN="https://your-production-dsn@sentry.io/project"
NEXT_PUBLIC_SENTRY_DSN="https://your-production-dsn@sentry.io/project"
```

---

## Security Best Practices

### Secret Management

1. **Never commit secrets to git**
   - Add `.env.local` and `.env.production` to `.gitignore`
   - Use `.env.example` as template (with placeholder values)

2. **Use different secrets for each environment**
   - Development, staging, and production must have unique secrets
   - Especially critical for `BETTER_AUTH_SECRET`

3. **Rotate secrets regularly**
   - API keys: Every 6-12 months
   - `BETTER_AUTH_SECRET`: Annually (requires all users to re-login)
   - Microsoft Client Secret: Before 24-month expiration

4. **Use secure secret storage**
   - Development: `.env.local` (git-ignored)
   - Production: Hosting platform secrets manager (Coolify, Vercel, etc.)
   - Backup: Encrypted vault (1Password, Vault, etc.)

### Environment Variable Validation

The application validates required environment variables on startup. Missing variables will cause startup failure with clear error messages.

**Check variables**:
```bash
# List all environment variables
printenv | grep -E "(DATABASE_URL|BETTER_AUTH|LEMVERIFY|GOOGLE_AI|RESEND|S3_)"
```

### Secure Transmission

- **Always use HTTPS in production** for `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL`
- **Use TLS/SSL** for database connections when possible
- **Verify webhook signatures** (HMAC) for external webhooks

---

## Troubleshooting

### Common Issues

**"Missing required environment variable: DATABASE_URL"**
- Solution: Add `DATABASE_URL` to your `.env.local` file

**"Better Auth: Invalid session"**
- Solution: Verify `BETTER_AUTH_SECRET` is set and matches across restarts

**"S3 bucket not found"**
- Solution: Create bucket manually or run `./scripts/setup-minio.sh` for local development

**"LEM Verify: Unauthorized"**
- Solution: Check `LEMVERIFY_API_KEY` is correct and active

**"Gemini API: Rate limit exceeded"**
- Solution: Wait 1 minute or upgrade Google Cloud quota

---

## Additional Resources

- [Deployment Checklist](/docs/DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- [Developer Onboarding](/docs/DEVELOPER_ONBOARDING.md) - New developer setup (Coming soon)
- [Security Policy](/SECURITY.md) - Security best practices (Coming soon)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team
