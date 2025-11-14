#!/bin/bash

# Production Deployment Validation Script
# ========================================
# Ensures production readiness by checking for common deployment blockers
#
# Usage:
#   ./scripts/validate-production.sh
#
# Exit Codes:
#   0 - All validations passed, safe for production deployment
#   1 - Validation failures detected, deployment should be blocked

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation status
VALIDATION_FAILED=false

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Production Deployment Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# CRITICAL: Legal Document Placeholder Check
# =============================================================================
echo -e "${BLUE}[1/5] Checking for legal document placeholders...${NC}"

PLACEHOLDER_FILES=(
  "scripts/seed.ts"
)

PLACEHOLDER_PATTERNS=(
  "This is a placeholder Privacy Policy"
  "This is a placeholder Terms of Service"
  "This is a placeholder Cookie Policy"
)

for file in "${PLACEHOLDER_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠️  Warning: $file not found${NC}"
    continue
  fi

  for pattern in "${PLACEHOLDER_PATTERNS[@]}"; do
    if grep -q "$pattern" "$file" 2>/dev/null; then
      echo -e "${RED}❌ CRITICAL: Legal document placeholder detected in $file${NC}"
      echo -e "${RED}   Pattern: \"$pattern\"${NC}"
      echo -e "${RED}   Action Required: Replace with legal-approved content before production deployment${NC}"
      VALIDATION_FAILED=true
    fi
  done
done

if [ "$VALIDATION_FAILED" = false ]; then
  echo -e "${GREEN}✅ No legal document placeholders detected${NC}"
fi
echo ""

# =============================================================================
# Email Verification Configuration Check
# =============================================================================
echo -e "${BLUE}[2/5] Checking email verification configuration...${NC}"

EMAIL_VERIFICATION_FILES=(
  "lib/auth.ts"
  "lib/client-portal-auth.ts"
)

for file in "${EMAIL_VERIFICATION_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠️  Warning: $file not found${NC}"
    continue
  fi

  # Check if email verification is environment-based
  if grep -q 'requireEmailVerification:.*process\.env\.NODE_ENV.*===.*"production"' "$file" 2>/dev/null; then
    echo -e "${GREEN}✅ $file: Email verification enabled in production${NC}"
  elif grep -q 'requireEmailVerification:.*false' "$file" 2>/dev/null; then
    echo -e "${RED}❌ $file: Email verification is disabled (should be environment-based)${NC}"
    VALIDATION_FAILED=true
  fi
done
echo ""

# =============================================================================
# Environment Variable Check
# =============================================================================
echo -e "${BLUE}[3/5] Checking required environment variables...${NC}"

REQUIRED_ENV_VARS=(
  "DATABASE_URL"
  "BETTER_AUTH_SECRET"
  "BETTER_AUTH_URL"
  "RESEND_API_KEY"
)

# Note: We can't check actual values in CI/CD, but we can check if .env.production.example has them documented
if [ -f ".env.production.example" ]; then
  for var in "${REQUIRED_ENV_VARS[@]}"; do
    if grep -q "^$var=" ".env.production.example" 2>/dev/null; then
      echo -e "${GREEN}✅ $var documented in .env.production.example${NC}"
    else
      echo -e "${YELLOW}⚠️  Warning: $var not documented in .env.production.example${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠️  Warning: .env.production.example not found${NC}"
fi
echo ""

# =============================================================================
# Build Test (Skipped - Run separately in CI/CD)
# =============================================================================
echo -e "${BLUE}[4/5] Build test (skipped - run in CI/CD separately)...${NC}"
echo -e "${YELLOW}ℹ️  Build validation should be run separately via 'pnpm build'${NC}"
echo -e "${YELLOW}   This saves time during development while still catching critical issues${NC}"
echo ""

# =============================================================================
# Type Check
# =============================================================================
echo -e "${BLUE}[5/5] Running TypeScript type check...${NC}"

if pnpm typecheck 2>&1 | tee /tmp/typecheck-output.log; then
  echo -e "${GREEN}✅ TypeScript type check passed${NC}"
else
  echo -e "${RED}❌ TypeScript type check failed${NC}"
  echo -e "${RED}   See type check output above for details${NC}"
  VALIDATION_FAILED=true
fi
echo ""

# =============================================================================
# Final Result
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$VALIDATION_FAILED" = true ]; then
  echo -e "${RED}❌ VALIDATION FAILED - Production deployment should be blocked${NC}"
  echo -e "${RED}   Address the issues above before deploying to production${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
else
  echo -e "${GREEN}✅ ALL VALIDATIONS PASSED - Safe for production deployment${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
fi
