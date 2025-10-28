# E2E Regression Test Stubs

This directory contains Playwright test stubs for critical user flows in Client Hub and Proposal Hub.

## Status

**Current**: All tests marked with `test.skip()` - not yet implemented
**Priority**: Implement after production launch for regression protection

## Test Files

1. **client-hub.spec.ts** - Client Hub flows (tasks, clients, invoices)
2. **proposal-hub.spec.ts** - Proposal Hub flows (proposals, pipeline, signing)

## Running Tests

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run specific suite
pnpm exec playwright test tests/e2e/regression/client-hub.spec.ts

# Run in UI mode (interactive)
pnpm exec playwright test --ui
```

## Implementation Priority

**P0 (Critical)**:
1. My Tasks filter (validates gap fix)
2. DocuSeal signing flow (validates integration)
3. Proposal version history
4. Task reassignment with notifications

**P1 (High)**:
1. Bulk task operations
2. Workflow checklist updates
3. Companies House lookup
4. VAT validation

**P2 (Medium)**:
1. Client CRUD
2. Invoice filtering
3. Pipeline Kanban view
4. Analytics dashboards

## Acceptance Criteria

Each test should verify:
- ✅ UI renders correctly
- ✅ User interactions work (clicks, typing, drags)
- ✅ Data persists to database
- ✅ Side effects occur (emails, notifications, webhooks)
- ✅ Error states handled gracefully

## Notes

- Tests use `test.skip()` to prevent CI failures while unimplemented
- Remove `skip()` when implementing each test
- Add assertions with clear failure messages
- Use test fixtures for data setup/teardown
