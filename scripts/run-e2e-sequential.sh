#!/bin/bash

# Run E2E tests sequentially to avoid auth contention
# This ensures only one test file runs at a time

echo "========================================="
echo "Running E2E Tests Sequentially"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Function to run a single test file
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .spec.ts)

    echo "Running: $test_name"
    echo "-----------------------------------------"

    if pnpm test:e2e "$test_file" --project=chromium --reporter=dot; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        PASSED_TESTS+=("$test_name")
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        FAILED_TESTS+=("$test_name")
    fi

    echo ""
}

# Run auth tests first (most critical)
echo "Phase 1: Authentication Tests"
echo "============================="
run_test "__tests__/e2e/auth/login.spec.ts"

# Run practice hub tests
echo "Phase 2: Practice Hub Tests"
echo "============================"
run_test "__tests__/e2e/practice-hub/dashboard.spec.ts"
run_test "__tests__/e2e/practice-hub/navigation.spec.ts"
run_test "__tests__/e2e/practice-hub/timesheet-approval.spec.ts"
run_test "__tests__/e2e/practice-hub/settings-persistence.spec.ts"

# Run client hub basic tests
echo "Phase 3: Client Hub - Basic Tests"
echo "=================================="
run_test "__tests__/e2e/client-hub/clients-list.spec.ts"
run_test "__tests__/e2e/client-hub/client-detail.spec.ts"
run_test "__tests__/e2e/client-hub/client-creation.spec.ts"

# Run client hub advanced tests
echo "Phase 4: Client Hub - Advanced Tests"
echo "====================================="
run_test "__tests__/e2e/client-hub/task-management.spec.ts"
run_test "__tests__/e2e/client-hub/invoice-generation.spec.ts"
run_test "__tests__/e2e/client-hub/document-upload.spec.ts"
run_test "__tests__/e2e/client-hub/vat-validation.spec.ts"

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
    echo -e "${GREEN}Passed Tests (${#PASSED_TESTS[@]}):${NC}"
    for test in "${PASSED_TESTS[@]}"; do
        echo -e "  ${GREEN}✓${NC} $test"
    done
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Tests (${#FAILED_TESTS[@]}):${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi