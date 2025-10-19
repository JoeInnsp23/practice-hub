#!/bin/bash
# Check test coverage and identify gaps in Practice Hub
#
# Usage:
#   ./scripts/check_coverage.sh
#   ./scripts/check_coverage.sh --report

set -e

echo "🧪 Practice Hub Test Coverage Analysis"
echo "========================================"
echo ""

# Run tests with coverage
echo "📊 Running tests with coverage..."
pnpm test:coverage --reporter=verbose

echo ""
echo "📈 Analyzing coverage gaps..."
echo ""

# Find routers without tests
echo "🔍 Routers without test files:"
echo "─────────────────────────────────"

routers_without_tests=0
for router in app/server/routers/*.ts; do
  # Skip index.ts and test files
  if [[ "$router" == *"index.ts" ]] || [[ "$router" == *".test.ts" ]]; then
    continue
  fi

  test_file="${router%.ts}.test.ts"

  if [[ ! -f "$test_file" ]]; then
    echo "❌ $(basename "$router") - No test file found"
    ((routers_without_tests++))
  fi
done

if [[ $routers_without_tests -eq 0 ]]; then
  echo "✅ All routers have test files"
else
  echo ""
  echo "⚠️  Found $routers_without_tests routers without tests"
  echo ""
  echo "Generate test template:"
  echo "  python .claude/skills/practice-hub-testing/scripts/generate_router_test.py <router-file>"
fi

echo ""
echo "📋 Components without tests:"
echo "─────────────────────────────────"

components_without_tests=0
for component in components/**/*.tsx; do
  # Skip index files
  if [[ "$component" == *"index.tsx" ]]; then
    continue
  fi

  test_file="${component%.tsx}.test.tsx"

  if [[ ! -f "$test_file" ]]; then
    echo "❌ $(basename "$component")"
    ((components_without_tests++))
  fi
done

if [[ $components_without_tests -eq 0 ]]; then
  echo "✅ All components have test files"
else
  echo ""
  echo "⚠️  Found $components_without_tests components without tests"
fi

echo ""
echo "========================================"
echo "Test Coverage Summary"
echo "========================================"
echo "View detailed HTML report:"
echo "  open coverage/index.html"
echo ""
