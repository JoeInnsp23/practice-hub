# Production Deployment Validation

## Overview

The `scripts/validate-production.sh` script ensures production readiness by checking for common deployment blockers before allowing production deployment.

## Usage

```bash
# Run validation script
./scripts/validate-production.sh
```

**Exit Codes:**
- `0` - All validations passed, safe for production deployment
- `1` - Validation failures detected, deployment should be blocked

## Validation Checks

### 1. Legal Document Placeholders (CRITICAL)

Scans `scripts/seed.ts` for placeholder legal documents:
- Privacy Policy placeholder
- Terms of Service placeholder
- Cookie Policy placeholder

**Status:** 🔴 **BLOCKING** - Deployment will fail if any placeholders are detected

**Action Required:**
- Replace all placeholder legal documents with content approved by legal counsel
- Ensure compliance with UK GDPR and relevant regulations

### 2. Email Verification Configuration

Verifies email verification is enabled in production:
- `lib/auth.ts` - Staff authentication
- `lib/client-portal-auth.ts` - Client portal authentication

**Status:** ✅ **PASSING** - Environment-based configuration implemented

**Expected Configuration:**
```typescript
requireEmailVerification: process.env.NODE_ENV === "production"
```

### 3. Required Environment Variables

Checks that critical environment variables are documented in `.env.production.example`:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `RESEND_API_KEY`

**Status:** ✅ **PASSING** - All required variables documented

### 4. Build Test

**Status:** ⏭️ **SKIPPED** - Build should be run separately in CI/CD

The build test is skipped in the validation script to save time during development. The CI/CD pipeline should run `pnpm build` separately as part of the deployment process.

### 5. TypeScript Type Check

Runs `pnpm typecheck` to ensure no type errors exist.

**Status:** ✅ **PASSING** - Clean TypeScript compilation

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - name: Run production validation
        run: ./scripts/validate-production.sh
      - name: Build production bundle
        run: pnpm build
```

### Vercel Deployment

Add to `package.json`:
```json
{
  "scripts": {
    "prebuild": "./scripts/validate-production.sh"
  }
}
```

This will automatically run validation before every build, preventing deployment with placeholder content.

## Known Blockers

### 🔴 Legal Document Placeholders

**Current Status:** BLOCKING

The seed script (`scripts/seed.ts`) contains placeholder content for:
1. Privacy Policy (line ~812)
2. Terms of Service (line ~891)
3. Cookie Policy (line ~960)

**Action Required:**
- Engage legal counsel to draft production-ready legal documents
- Replace placeholder content in `scripts/seed.ts`
- Ensure compliance with:
  - UK GDPR (General Data Protection Regulation)
  - UK Money Laundering Regulations 2017
  - Information Commissioner's Office (ICO) requirements

**Estimated Timeline:** Depends on legal review process

## Continuous Improvement

Future validation checks to consider:
- Security headers configuration
- Secrets scanning (no hardcoded API keys)
- Database migration status
- Dependency vulnerability scan
- Performance budget checks
- Accessibility audit results
