import { test, expect } from "@playwright/test";

// Tests now use shared authenticated state from global-setup.ts
// No individual login needed - all tests start already authenticated

test.describe("Practice Hub Dashboard", () => {
  test("should load dashboard after login", async ({ page }) => {
    // No login needed - test starts with authenticated state from global-setup

    // Navigate to practice-hub
    await page.goto('/practice-hub');
    await page.waitForLoadState("networkidle");

    // Verify dashboard content is visible (looking for common dashboard elements)
    // Using flexible selectors - at least one of these should be present
    const hasDashboardContent =
      (await page.locator('h1, h2, [role="heading"]').count()) > 0 ||
      (await page.locator('nav, [role="navigation"]').count()) > 0 ||
      (await page.locator('main, [role="main"]').count()) > 0;

    expect(hasDashboardContent).toBeTruthy();
  });

  test("should display navigation elements", async ({ page }) => {
    // No login needed - test starts with authenticated state from global-setup

    // Navigate to Practice Hub
    await page.goto("/practice-hub");
    await page.waitForLoadState("networkidle");

    // Verify navigation is present (sidebar or header navigation)
    const hasNavigation =
      (await page.locator('nav, [role="navigation"]').count()) > 0 ||
      (await page.locator('a[href*="/practice-hub"], a[href*="/client-hub"]').count()) > 0;

    expect(hasNavigation).toBeTruthy();
  });
});
