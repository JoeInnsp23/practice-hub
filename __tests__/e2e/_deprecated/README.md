# Deprecated E2E Tests

These tests were deprecated because they were failing due to fundamental infrastructure issues.

## Problems Identified

1. **Data-testid Reliance**: Tests relied heavily on `data-testid` attributes that don't exist in the UI
2. **Insufficient Timeouts**: Used 5-10 second timeouts that don't account for Turbopack cold-start compilation (requires 60-90s)
3. **Complex Wizard Flows**: Multi-step wizard flows with conditional loops that are brittle and hard to maintain
4. **Inconsistent Selectors**: Mixed strategies (text, data-testid, CSS) without proper fallbacks
5. **Helper Function Issues**: Helper functions (loginAsTestUser, createTestClient, cleanupTestData) had their own timeout and reliability problems

## Migration Strategy

These tests are being rewritten from scratch using the working login test pattern (`__tests__/e2e/auth/login.spec.ts`) as a foundation.

### New Test Principles

1. **Generous Timeouts**: 90s for navigation, 60s for element waits
2. **Flexible Selectors**: Use multiple selector strategies with proper fallbacks
3. **Simple, Linear Flows**: Avoid complex conditional loops
4. **One Test at a Time**: Build and verify each test individually
5. **Parallel Execution**: Tests run with 3 workers for faster feedback

## Deprecated Tests

- `client-creation.spec.ts` - Client creation wizard tests
- `client-detail.spec.ts` - Client detail view tests
- `task-management.spec.ts` - Task management tests
- `invoice-generation.spec.ts` - Invoice generation tests
- `document-upload.spec.ts` - Document upload tests
- `vat-validation.spec.ts` - VAT validation tests
- `timesheet-approval.spec.ts` - Timesheet approval tests
- `settings-persistence.spec.ts` - Settings persistence tests

## Future Work

These tests will be rewritten incrementally with proper timeouts and selector strategies based on actual UI implementation.
