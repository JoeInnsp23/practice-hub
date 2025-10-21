#!/bin/bash
# Documentation Validation Script
# Last Updated: 2025-10-21

echo "🔍 Validating documentation..."
ERRORS=0

# Check 1: Schema tables
TABLES=$(grep -c "pgTable(" lib/db/schema.ts 2>/dev/null || echo "0")
if [ "$TABLES" -ge 50 ]; then
  echo "✅ Schema has $TABLES tables (expected 50+)"
else
  echo "❌ Schema has only $TABLES tables (expected 50+)"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Xero integration
if [ -f "lib/xero/client.ts" ]; then
  if grep -qi "xero.*complete\|complete.*xero" docs/reference/integrations.md 2>/dev/null; then
    echo "✅ Xero integration documented correctly"
  else
    echo "❌ Xero implemented but not marked COMPLETE in docs"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 3: Router tests
TESTS=$(find __tests__/routers -name "*.test.ts" 2>/dev/null | wc -l)
if [ "$TESTS" -ge 30 ]; then
  echo "✅ Found $TESTS router tests (expected 30+)"
else
  echo "❌ Found only $TESTS router tests (expected 30+)"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: Tenant isolation test
if [ -f "__tests__/integration/tenant-isolation.test.ts" ]; then
  echo "✅ Tenant isolation test exists"
else
  echo "❌ Tenant isolation test not found"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All validation checks passed!"
  exit 0
else
  echo "❌ Found $ERRORS error(s)"
  exit 1
fi
