# E2E Testing Guide

**Last Updated**: 2025-10-21
**Version**: 1.0
**Status**: Current

## Overview

This guide covers end-to-end (E2E) testing for Practice Hub using Playwright. E2E tests verify that complete user workflows work correctly by testing the UI, backend, and database together.

---

## Quick Start

```bash
# Start test database
docker compose up -d postgres-test

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI mode (interactive)
pnpm test:e2e:ui

# Reset test database
pnpm test:e2e:reset-db
```

---

## Test Database Setup

E2E tests use a **dedicated test database** (separate from development database) to prevent data pollution and enable parallel workflows.

### Architecture

| Database | Port | Purpose | Container |
|----------|------|---------|-----------|
| **Development** | 5432 | Daily development work | `practice-hub-db` |
| **Test** | 5433 | E2E test execution | `practice-hub-test-db` |

### Setup Steps

1. **Start Test Database**:
   ```bash
   docker compose up -d postgres-test
   ```

2. **Initialize Schema**:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" pnpm db:push:dev
   DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" tsx scripts/migrate.ts
   ```

3. **Seed Test Data**:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" \
   E2E_TEST_ADMIN_PASSWORD="E2ETestAdmin123!" \
   E2E_TEST_USER_PASSWORD="E2ETestUser123!" \
   pnpm tsx scripts/seed-test-database.ts
   ```

4. **Or Use Single Command**:
   ```bash
   pnpm test:e2e:reset-db
   ```

### Test Credentials

Test users created in test database:

- **Admin**: `e2e-admin@test.com` / `E2ETestAdmin123!`
- **Member**: `e2e-user@test.com` / `E2ETestUser123!`
- **Tenant**: `tenant_e2e_test`

Add these to `.env.test`:

```bash
DATABASE_URL_TEST="postgresql://postgres:password@localhost:5433/practice_hub_test"
E2E_TEST_USER_EMAIL="e2e-user@test.com"
E2E_TEST_USER_PASSWORD="E2ETestUser123!"
E2E_TEST_ADMIN_PASSWORD="E2ETestAdmin123!"
```

---

## Writing E2E Tests

### Test Structure

```typescript
// __tests__/e2e/client-hub/example.spec.ts

import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";

test.describe("Feature Name", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  // Cleanup after each test
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should perform user workflow", async ({ page }) => {
    const testData = createTestClient("My Test");

    // Navigate and interact
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');

    // Fill forms
    await page.fill('input[name="name"]', testData.name);

    // Submit
    await page.click('button:has-text("Save")');

    // Assert
    await expect(page.locator('text="Success"')).toBeVisible();
  });
});
```

### Test Helpers

#### Authentication

```typescript
import { loginAsTestUser } from "../helpers/auth";

// Login as test member user
await loginAsTestUser(page);

// Login as test admin user
await loginAsTestAdmin(page);
```

#### Test Data Factory

All test data uses `E2E-Test-` prefix for easy cleanup:

```typescript
import { createTestClient, createTestTask, createTestInvoice } from "../helpers/factory";

const client = createTestClient("Optional Name");
// Returns: { name: "E2E-Test-Optional Name-abc123", email: "...", ... }

const task = createTestTask();
// Returns: { title: "E2E-Test-Task-xyz789", ... }

const invoice = createTestInvoice();
// Returns: { invoiceNumber: "E2E-TEST-INV-xyz789", ... }
```

#### Cleanup

```typescript
import { cleanupTestData, verifyCleanup } from "../helpers/cleanup";

// Delete all E2E test data
await cleanupTestData();

// Verify no orphaned records
const count = await verifyCleanup(); // Returns 0 if clean
```

---

## Best Practices

### 1. Use Stable Selectors

**Priority Order**:
1. `data-testid` attributes (most stable)
2. Role selectors (`role="button"`)
3. Text content (least stable, but acceptable)

```typescript
// ✅ BEST - data-testid
await page.click('[data-testid="client-creation-button"]');

// ✅ GOOD - role
await page.click('button[type="submit"]');

// ⚠️  OK - text (fallback)
await page.click('text="New Client"');
```

### 2. Wait for Network State

```typescript
// Wait for API calls to complete
await page.waitForLoadState("networkidle");

// Wait for specific URL
await page.waitForURL("**/client-hub");

// Wait for element
await expect(page.locator('text="Success"')).toBeVisible({ timeout: 10000 });
```

### 3. Handle Dynamic Content

```typescript
// Use first() for multiple matches
await page.locator('button:has-text("Save")').first().click();

// Check visibility before clicking
const button = page.locator('text="Optional Feature"');
if (await button.isVisible().catch(() => false)) {
  await button.click();
}
```

### 4. Test Data Isolation

- **Always** use test data factory
- **Always** cleanup in `afterEach`
- **Never** hardcode IDs or timestamps

```typescript
// ✅ CORRECT
const testClient = createTestClient("My Client");

// ❌ WRONG
const testClient = { name: "Test Client" }; // No E2E-Test- prefix!
```

---

## Running Tests

### Commands

```bash
# Run all E2E tests (Chromium only)
pnpm test:e2e

# Run specific test file
pnpm test:e2e client-creation.spec.ts

# Run with UI mode (visual debugger)
pnpm test:e2e:ui

# Run Firefox tests
pnpm test:e2e --project=firefox

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Debug mode (pause on failures)
pnpm test:e2e --debug
```

### Configuration

See `playwright.config.ts`:

- **Test Directory**: `__tests__/e2e/`
- **Timeout**: 30 seconds per test
- **Execution**: Serial (1 worker)
- **Browsers**: Chromium (primary), Firefox (secondary)
- **Base URL**: `http://localhost:3000`

---

## Debugging Failing Tests

### 1. Run in UI Mode

```bash
pnpm test:e2e:ui
```

Visual interface shows:
- Test execution timeline
- Network requests
- Console logs
- Screenshots
- DOM snapshots

### 2. Run in Headed Mode

```bash
pnpm test:e2e --headed
```

See the browser in action.

### 3. Check Test Results

After test run:
- **HTML Report**: `playwright-report/index.html`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)
- **Traces**: `test-results/` (on retry)

Open report:
```bash
npx playwright show-report
```

### 4. Add Debug Statements

```typescript
// Pause execution
await page.pause();

// Screenshot
await page.screenshot({ path: "debug.png" });

// Console log
console.log(await page.title());

// Inspect element
const text = await page.locator('h1').textContent();
console.log(text);
```

---

## Troubleshooting

### Test Database Connection Fails

**Symptom**: `relation "users" does not exist`

**Solution**:
```bash
# Reset test database
pnpm test:e2e:reset-db
```

### Tests Fail with "Element not found"

**Symptom**: `Timeout 30000ms exceeded waiting for selector`

**Causes**:
1. Dev server not running
2. Element selector changed
3. Slow page load

**Solutions**:
1. Ensure dev server is running: `pnpm dev` (in separate terminal)
2. Inspect actual page with `--headed` mode
3. Increase timeout: `await expect(...).toBeVisible({ timeout: 15000 })`

### Orphaned Test Data

**Symptom**: `Found 5 orphaned E2E test records`

**Solution**:
```bash
# Manual cleanup
DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" \
pnpm tsx -e "import { cleanupTestData } from './__tests__/e2e/helpers/cleanup'; cleanupTestData();"
```

### Flaky Tests

**Symptoms**:
- Tests pass sometimes, fail other times
- "Detached from DOM" errors
- Race conditions

**Solutions**:
1. Add explicit waits:
   ```typescript
   await page.waitForLoadState("networkidle");
   ```

2. Use data-testid attributes (stable selectors)

3. Wait for elements before interacting:
   ```typescript
   await page.waitForSelector('[data-testid="button"]');
   await page.click('[data-testid="button"]');
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Start test database
        run: docker compose up -d postgres-test

      - name: Setup test database
        run: pnpm test:e2e:reset-db

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Organization

```
__tests__/e2e/
├── helpers/
│   ├── auth.ts          # Login helpers
│   ├── factory.ts       # Test data generators
│   └── cleanup.ts       # Test data cleanup
├── fixtures/
│   └── test-document.txt  # Test files
├── client-hub/
│   ├── client-creation.spec.ts
│   ├── client-detail.spec.ts
│   ├── task-management.spec.ts
│   ├── document-upload.spec.ts
│   └── invoice-generation.spec.ts
└── (other modules)/
```

---

## Related Documentation

- [Testing Overview](testing.md) - All testing approaches
- [Playwright Documentation](https://playwright.dev) - Official docs
- [Tech Stack](../architecture/tech-stack.md) - Testing tools

---

**For questions or improvements, contact the development team.**
