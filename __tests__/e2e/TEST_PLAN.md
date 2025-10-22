# E2E Test Plan

This document outlines the plan for building reliable E2E tests for Practice Hub.

## Working Tests ✓

- **Auth Flow** (`auth/login.spec.ts`)
  - ✓ Login with valid credentials
  - ✓ Error handling for invalid credentials

## Test Development Principles

1. **Start Simple**: Build one test at a time, verify it passes consistently
2. **Generous Timeouts**: 90s for navigation waits, 60s for element waits (Turbopack compilation)
3. **Flexible Selectors**: Use multiple selector strategies with proper fallbacks
4. **Parallel Execution**: Tests run with 3 workers for faster feedback
5. **Real User Flows**: Test actual user workflows, not implementation details

## Selector Strategy

```typescript
// Good: Flexible with fallbacks
const emailInput = page.locator('input[type="email"], input#email, input[name="email"]');

// Bad: Relies on data-testid that may not exist
const emailInput = page.locator('[data-testid="email-input"]');
```

## Timeout Guidelines

```typescript
// Navigation waits (page changes, redirects)
await page.waitForURL(matcher, { timeout: 90000 });

// Element visibility (buttons, forms)
await element.waitFor({ state: "visible", timeout: 60000 });

// Network idle (after page load)
await page.waitForLoadState("networkidle");
```

## Proposed Test Coverage (Priority Order)

### Phase 1: Core Flows (Next Steps)
1. **Practice Hub Dashboard** - Verify main dashboard loads and displays key widgets
2. **Navigation** - Test navigation between modules (Client Hub, Practice Hub, etc.)
3. **User Profile** - View and edit user profile

### Phase 2: Client Management
4. **Client List View** - View clients list, search, filter
5. **Client Detail View** - Navigate to client detail, view tabs
6. **Client Creation** - Create new client with basic info (simplified, no wizard)

### Phase 3: Task Management
7. **Task List View** - View tasks, filter by status
8. **Task Detail** - View task details
9. **Task Creation** - Create new task

### Phase 4: Invoicing
10. **Invoice List View** - View invoices
11. **Invoice Detail** - View invoice details

### Phase 5: Advanced Features
12. **Document Upload** - Upload documents
13. **Timesheet Approval** - Approve/reject timesheets
14. **Settings Persistence** - Update and verify settings persist
15. **VAT Validation** - Test HMRC VAT number validation

## Test Structure Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something specific", async ({ page }) => {
    // 1. Setup: Login if needed
    const email = process.env.E2E_TEST_USER_EMAIL || "e2e-user@test.com";
    const password = process.env.E2E_TEST_USER_PASSWORD;

    if (!password) {
      throw new Error("E2E_TEST_USER_PASSWORD not configured");
    }

    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input#email');
    await emailInput.waitFor({ state: "visible", timeout: 60000 });
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"], input#password');
    await passwordInput.waitFor({ state: "visible", timeout: 60000 });
    await passwordInput.fill(password);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
      timeout: 90000,
    });

    // 2. Navigate to feature
    await page.goto("/feature-path");
    await page.waitForLoadState("networkidle");

    // 3. Perform action
    // ...

    // 4. Assert outcome
    await expect(page.locator('expected-element')).toBeVisible();
  });
});
```

## Next Steps

1. Build Practice Hub dashboard test (simplest next test)
2. Verify it passes consistently
3. Add navigation test
4. Continue incrementally following priority order above
