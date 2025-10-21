# Story 4: E2E Tests for Critical Client-Hub Workflows - Brownfield Enhancement

**Epic:** Client-Hub Production Readiness
**Created:** 2025-10-21
**Priority:** MEDIUM
**Story Points:** 8

---

## User Story

As a **developer deploying client-hub changes**,
I want **end-to-end tests that verify complete user workflows**,
So that **I can confidently deploy knowing the UI, backend, and database work together correctly for real user scenarios**.

---

## Story Context

### Existing System Integration

- **Integrates with:** Existing client-hub UI in `app/client-hub/`
- **Technology:** Playwright (via webapp-testing skill), Next.js, tRPC
- **Follows pattern:** New E2E test infrastructure (no existing E2E tests)
- **Touch points:**
  - All client-hub pages (11 pages)
  - Client wizard modal
  - Task management
  - Document upload
  - Invoice creation

### Current System Context

**No Existing E2E Tests:**
- ❌ No `__tests__/e2e/` directory
- ❌ No Playwright configuration
- ❌ No E2E test examples
- ✅ `webapp-testing` skill available in `.claude/skills/`

**Client-Hub User Workflows to Test:**
1. Client creation flow
2. Client detail view navigation
3. Task management
4. Document upload
5. Invoice generation

---

## Acceptance Criteria

### Functional Requirements

1. **E2E Infrastructure:** Playwright configured and working
2. **Client Creation Test:** E2E test for creating client → adding contact → verifying in list
3. **Client Detail Test:** E2E test for navigating to client → viewing all tabs
4. **Task Management Test:** E2E test for creating task → assigning → marking complete
5. **Document Upload Test:** E2E test for uploading document → verifying in list → downloading
6. **Invoice Generation Test:** E2E test for creating invoice → adding items → previewing PDF

### Integration Requirements

7. **Dev Server Integration:** Tests run against local `pnpm dev` server
8. **Test Data Isolation:** Each test creates and cleans up its own data
9. **Authentication:** Tests login as test user with proper tenant context
10. **Cross-Page Navigation:** Tests verify navigation between client-hub pages works
11. **Data Persistence:** Tests verify data persists across page refreshes

### Quality Requirements

12. **Stable Tests:** Tests run reliably without flakiness (5 consecutive successful runs)
13. **Fast Execution:** E2E test suite completes in under 5 minutes
14. **Light and Dark Mode:** All tests pass in both light and dark themes
15. **Responsive Testing:** Critical flows tested on desktop and mobile viewports
16. **No Console Errors:** Tests verify no JavaScript errors during execution

---

## Technical Notes

### Integration Approach

**Use webapp-testing Skill:**
```bash
# Invoke webapp-testing skill for E2E test setup
# Skill handles Playwright installation and configuration
```

**Test Structure:**
```typescript
// __tests__/e2e/client-hub/client-creation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Client Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('http://localhost:3000/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/client-hub');
  });

  test('should create new client with contact', async ({ page }) => {
    // Navigate to clients
    await page.goto('http://localhost:3000/client-hub/clients');

    // Click "New Client" button
    await page.click('text=New Client');

    // Fill client form
    await page.fill('[name="name"]', 'Test Client Ltd');
    await page.fill('[name="email"]', 'client@test.com');
    await page.selectOption('[name="type"]', 'limited_company');

    // Add primary contact
    await page.fill('[name="primaryContact.firstName"]', 'John');
    await page.fill('[name="primaryContact.lastName"]', 'Doe');
    await page.fill('[name="primaryContact.email"]', 'john@test.com');

    // Submit
    await page.click('button:has-text("Create Client")');

    // Verify success
    await expect(page.locator('text=Client created successfully')).toBeVisible();

    // Verify in list
    await page.goto('http://localhost:3000/client-hub/clients');
    await expect(page.locator('text=Test Client Ltd')).toBeVisible();
  });
});
```

### Existing Pattern Reference

Since no E2E tests exist, follow Playwright best practices:
- Use `data-testid` attributes for stable selectors
- Use `page.waitForLoadState('networkidle')` for API calls
- Use `page.waitForURL()` for navigation assertions
- Use `test.beforeEach` for authentication setup

### Key Implementation Details

**Test Data Management:**
```typescript
// Clean up test data after each test
test.afterEach(async ({ page, context }) => {
  // Delete test client via API or UI
  await page.goto('http://localhost:3000/client-hub/clients');
  // ... cleanup logic
});
```

**Authentication Helper:**
```typescript
// __tests__/e2e/helpers/auth.ts
export async function loginAsTestUser(page: Page) {
  await page.goto('http://localhost:3000/sign-in');
  await page.fill('[name="email"]', process.env.E2E_TEST_USER_EMAIL!);
  await page.fill('[name="password"]', process.env.E2E_TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/client-hub');
}
```

---

## Definition of Done

- [ ] Playwright installed and configured
- [ ] `__tests__/e2e/` directory structure created
- [ ] Authentication helper created
- [ ] **Test 1:** Client creation flow E2E test passing
- [ ] **Test 2:** Client detail view E2E test passing
- [ ] **Test 3:** Task management E2E test passing
- [ ] **Test 4:** Document upload E2E test passing
- [ ] **Test 5:** Invoice generation E2E test passing
- [ ] All tests pass in light mode
- [ ] All tests pass in dark mode
- [ ] All tests pass on desktop viewport (1920x1080)
- [ ] Critical tests pass on mobile viewport (375x667)
- [ ] Tests run 5 times consecutively without failures
- [ ] E2E test suite completes in under 5 minutes
- [ ] No JavaScript console errors during test execution
- [ ] Test data cleanup working (no orphaned test records)
- [ ] **Documentation created:** `docs/development/e2e-testing-guide.md`
- [ ] **Documentation updated:** `docs/development/testing.md` (add E2E section)

---

## Risk and Compatibility Check

### Minimal Risk Assessment

- **Primary Risk:** E2E tests are flaky or slow
- **Mitigation:**
  - Follow Playwright best practices (wait strategies, stable selectors)
  - Use `data-testid` attributes for critical elements
  - Implement proper cleanup between tests
  - Run tests in headed mode during development to debug
- **Rollback:** E2E tests can run separately from CI/CD if too slow

### Compatibility Verification

- [ ] No changes to production code (test-only)
- [ ] Tests use existing test user (no new auth setup)
- [ ] Tests clean up their own data (no database pollution)
- [ ] Tests don't interfere with manual testing
- [ ] Can run E2E tests while dev server is running for other work

---

## Validation Checklist

### Scope Validation

- [x] Story scope is clear (5 E2E tests for critical workflows)
- [x] Integration approach defined (Playwright + webapp-testing skill)
- [x] Success criteria measurable (tests pass, execution time)
- [x] Low risk (test-only changes)

### Clarity Check

- [x] User workflows clearly defined
- [x] Test structure specified
- [x] Authentication strategy documented
- [x] Cleanup strategy defined

---

## Implementation Notes

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 30000,
  fullyParallel: false, // Run tests serially to avoid conflicts
  retries: 2,
  workers: 1,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

### Test Organization

```
__tests__/e2e/
├── helpers/
│   ├── auth.ts          # Login helpers
│   └── cleanup.ts       # Test data cleanup
├── client-hub/
│   ├── client-creation.spec.ts
│   ├── client-detail.spec.ts
│   ├── task-management.spec.ts
│   ├── document-upload.spec.ts
│   └── invoice-generation.spec.ts
└── fixtures/
    └── test-data.ts     # Test data generators
```

### Critical Selectors to Add

Add `data-testid` attributes to these elements:
- Client creation button
- Client form fields
- Task creation button
- Document upload input
- Invoice creation form

---

## Success Metrics

- **Coverage:** 5 critical user workflows tested end-to-end
- **Stability:** 100% pass rate over 5 consecutive runs
- **Speed:** Test suite under 5 minutes
- **Bug Detection:** E2E tests catch at least 1 regression before production
- **Confidence:** Developers can deploy UI changes with confidence

---

**Story Status:** Ready for Implementation (Depends on Stories 1, 2)
**Estimated Time:** 1-2 days
**Dependencies:** Story 1 (documentation), Story 2 (integration tests provide stable backend)
