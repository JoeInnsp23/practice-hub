---
title: Secrets Handling Guide
description: Best practices for managing secrets, API keys, and sensitive data in Practice Hub
audience: [dev, ops]
status: complete
generated: HUMAN-AUTHORED
tags: [security, secrets, environment-variables, best-practices]
---

# Secrets Handling Guide

Comprehensive guide for managing secrets, API keys, and sensitive data in Practice Hub.

## Table of Contents

- [Overview](#overview)
- [Types of Secrets](#types-of-secrets)
- [Environment Variables](#environment-variables)
- [Never Commit Secrets](#never-commit-secrets)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Secret Rotation](#secret-rotation)
- [Incident Response](#incident-response)

## Overview

**Golden Rule**: Secrets MUST NEVER be committed to version control, logged, or exposed in error messages.

### What Counts as a Secret?

- Database connection strings with credentials
- API keys (Better Auth, Sentry, DocuSeal, S3, LEM Verify, Gemini AI)
- OAuth client secrets
- Webhook signing secrets
- Encryption keys
- Session secrets
- Private keys

## Types of Secrets

### 1. Database Credentials

```bash
# ❌ NEVER
DATABASE_URL="postgresql://postgres:MyPassword123@localhost:5432/practice_hub"

# ✅ CORRECT - Use environment-specific files
# .env.local
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost:5432/practice_hub"

# Store actual password in secure secret manager (1Password, AWS Secrets Manager, etc.)
```

### 2. API Keys

```typescript
// ❌ NEVER hardcode
const apiKey = "sk_live_abc123xyz789";

// ✅ CORRECT - Use environment variables
const apiKey = process.env.BETTER_AUTH_SECRET!;

// ✅ CORRECT - Validate presence at startup
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}
```

### 3. Signing Secrets

```typescript
// ❌ NEVER use predictable secrets
const secret = "mysecret";

// ✅ CORRECT - Generate cryptographically secure secrets
// openssl rand -base64 32
const secret = process.env.DOCUSEAL_WEBHOOK_SECRET!;
```

## Environment Variables

### Required Secrets

See `.env.example` for complete list. Key secrets include:

| Variable | Purpose | Generate With |
|----------|---------|---------------|
| `BETTER_AUTH_SECRET` | Session encryption | `openssl rand -base64 32` |
| `DOCUSEAL_SECRET_KEY` | DocuSeal encryption | `openssl rand -base64 32` |
| `DOCUSEAL_WEBHOOK_SECRET` | Webhook verification | `openssl rand -base64 32` |
| `DOCUSEAL_API_KEY` | DocuSeal API access | Admin UI |
| `SENTRY_AUTH_TOKEN` | Sentry API access | Sentry dashboard |
| `S3_SECRET_ACCESS_KEY` | Hetzner S3 access | Hetzner console |
| `LEM_VERIFY_API_KEY` | LEM Verify API | LEM dashboard |
| `GEMINI_API_KEY` | Gemini AI API | Google AI Studio |

### File Structure

```
project-root/
├── .env.example          # Template (committed)
├── .env.local            # Local dev (NOT committed)
├── .env.test             # Test env (NOT committed)
├── .env.production       # Production (NOT committed, deploy via secrets manager)
└── .gitignore            # Ensures .env.* files are ignored
```

### .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Better Auth
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# DocuSeal
DOCUSEAL_HOST="http://localhost:3030"
DOCUSEAL_API_KEY="<from-docuseal-admin-ui>"
DOCUSEAL_SECRET_KEY="<generate-with-openssl-rand-base64-32>"
DOCUSEAL_WEBHOOK_SECRET="<generate-with-openssl-rand-base64-32>"

# Sentry
SENTRY_ORG="practice-hub"
SENTRY_PROJECT="practice-hub"
SENTRY_AUTH_TOKEN="<from-sentry-dashboard>"

# S3 Storage
S3_REGION="us-east-1"
S3_ENDPOINT="https://s3.hetzner.cloud"
S3_ACCESS_KEY_ID="<from-hetzner-console>"
S3_SECRET_ACCESS_KEY="<from-hetzner-console>"
S3_BUCKET_NAME="practice-hub-prod"

# External APIs
LEM_VERIFY_API_KEY="<from-lem-dashboard>"
GEMINI_API_KEY="<from-google-ai-studio>"
```

## Never Commit Secrets

### .gitignore Protection

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.test

# Secrets
secrets/
*.pem
*.key
*.cert
credentials.json
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for common secret patterns
if git diff --cached | grep -E '(password|secret|api[_-]?key|token).*=.*["\'][^"\']{20,}["\']'; then
  echo "❌ Potential secret detected in staged files!"
  echo "   Review changes and use environment variables instead"
  exit 1
fi
```

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets. If detected:

1. **Immediate action**: Rotate the secret
2. **Update environment**: Deploy new secret to all environments
3. **Audit**: Check if the secret was used maliciously
4. **Revoke access**: If necessary, revoke all tokens/sessions

## Local Development

### Setup Process

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Generate secrets
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "DOCUSEAL_SECRET_KEY=$(openssl rand -base64 32)" >> .env.local
echo "DOCUSEAL_WEBHOOK_SECRET=$(openssl rand -base64 32)" >> .env.local

# 3. Add API keys from dashboards
# - DOCUSEAL_API_KEY: http://localhost:3030
# - SENTRY_AUTH_TOKEN: https://sentry.io/settings/account/api/auth-tokens/
# - S3_*: Hetzner console
# - LEM_VERIFY_API_KEY: LEM dashboard
# - GEMINI_API_KEY: https://aistudio.google.com/apikey

# 4. Verify
pnpm tsx scripts/validate-env.ts
```

### Sharing Secrets with Team

**❌ NEVER** share via:
- Email
- Slack/Teams messages
- Commit to repo
- Screenshot

**✅ USE**:
- 1Password shared vaults
- AWS Secrets Manager
- HashiCorp Vault
- Encrypted PGP messages

## Production Deployment

### Vercel Deployment

```bash
# Add secrets via Vercel dashboard or CLI
vercel env add BETTER_AUTH_SECRET production
vercel env add DOCUSEAL_SECRET_KEY production
# ... etc for all secrets
```

### Docker Deployment

```yaml
# docker-compose.prod.yml
services:
  app:
    image: practice-hub:latest
    env_file:
      - .env.production  # NOT committed to repo
    secrets:
      - db_password
      - better_auth_secret
      - docuseal_api_key

secrets:
  db_password:
    external: true
  better_auth_secret:
    external: true
  docuseal_api_key:
    external: true
```

### Environment-Specific Secrets

| Environment | Secret Source | Rotation Frequency |
|-------------|---------------|-------------------|
| Development | `.env.local` | Never (local only) |
| Testing | `.env.test` | Per test run (ephemeral) |
| Staging | AWS Secrets Manager | Monthly |
| Production | AWS Secrets Manager | Monthly |

## Secret Rotation

### Rotation Schedule

- **Database passwords**: Every 90 days
- **API keys**: Every 90 days
- **Webhook secrets**: Every 90 days
- **Session secrets**: Every 180 days (requires user re-login)

### Rotation Process

1. **Generate new secret**
   ```bash
   NEW_SECRET=$(openssl rand -base64 32)
   ```

2. **Deploy to production** (zero-downtime rotation)
   ```bash
   # Add new secret alongside old
   vercel env add BETTER_AUTH_SECRET_NEW production

   # Deploy app that checks both secrets
   # (accepts both old and new during transition)

   # After 24 hours, remove old secret
   vercel env rm BETTER_AUTH_SECRET production
   vercel env rename BETTER_AUTH_SECRET_NEW BETTER_AUTH_SECRET production
   ```

3. **Verify** all services work with new secret

4. **Revoke old secret** in external systems

### Emergency Rotation

If a secret is compromised:

1. **Immediately** generate and deploy new secret
2. **Revoke** old secret in all systems
3. **Audit** logs for unauthorized access
4. **Notify** security team and affected users
5. **Document** incident in security log

## Incident Response

### Secret Exposed in Commit

```bash
# 1. Rotate secret immediately
# 2. Force push to remove from history (DANGEROUS - coordinate with team)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Notify team
# 4. Audit access logs
# 5. Update .gitignore to prevent recurrence
```

### Secret Exposed in Logs

```typescript
// ❌ NEVER log secrets
console.log(`Database URL: ${process.env.DATABASE_URL}`);

// ✅ CORRECT - Redact sensitive parts
const redactedUrl = process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@');
console.log(`Database URL: ${redactedUrl}`);
```

### Secret in Error Messages

```typescript
// ❌ NEVER include secrets in errors
throw new Error(`Failed to connect with ${process.env.DATABASE_URL}`);

// ✅ CORRECT - Generic error
throw new Error('Failed to connect to database');

// ✅ CORRECT - Use Sentry with scrubbing
Sentry.captureException(error, {
  extra: {
    // Sentry automatically scrubs common secret patterns
    context: 'database_connection'
  }
});
```

## Validation

### Startup Validation

```typescript
// lib/validate-env.ts
const requiredSecrets = [
  'BETTER_AUTH_SECRET',
  'DATABASE_URL',
  'DOCUSEAL_SECRET_KEY',
  'DOCUSEAL_WEBHOOK_SECRET',
] as const;

for (const secret of requiredSecrets) {
  if (!process.env[secret]) {
    throw new Error(`Required secret missing: ${secret}`);
  }

  // Validate format
  if (secret.includes('SECRET') && process.env[secret]!.length < 32) {
    throw new Error(`${secret} must be at least 32 characters`);
  }
}
```

### CI/CD Validation

```yaml
# .github/workflows/security-scan.yml
- name: Check for secrets
  run: |
    # Scan for common secret patterns
    if git diff origin/main...HEAD | grep -E '(password|secret|api[_-]?key).*=.*["\'][^"\']{20,}["\']'; then
      echo "❌ Potential secret detected in diff"
      exit 1
    fi

- name: Validate .env.example
  run: |
    # Ensure no actual secrets in template
    if grep -E '[A-Za-z0-9]{32,}' .env.example; then
      echo "❌ .env.example contains actual values"
      exit 1
    fi
```

## Best Practices Summary

1. ✅ **Use environment variables** for all secrets
2. ✅ **Generate strong secrets** with `openssl rand -base64 32`
3. ✅ **Never commit** `.env.local` or production secrets
4. ✅ **Rotate secrets** on a schedule (90-180 days)
5. ✅ **Validate presence** of required secrets at startup
6. ✅ **Use secret managers** (1Password, AWS Secrets Manager) in production
7. ✅ **Redact secrets** from logs and error messages
8. ✅ **Enable GitHub secret scanning**
9. ✅ **Audit access** to secrets regularly
10. ✅ **Document incidents** and learn from exposures

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

---

**Maintained by**: Practice Hub Security Team
**Last Updated**: 2025-01-24
**Version**: 1.0.0
