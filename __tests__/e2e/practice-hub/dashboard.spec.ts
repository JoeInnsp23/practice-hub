import { test, expect } from "@playwright/test";

test.describe("Practice Hub Dashboard", () => {
  test("should load dashboard after login", async ({ page }) => {
    // Get test credentials from environment
    const email = process.env.E2E_TEST_USER_EMAIL || "e2e-user@test.com";
    const password = process.env.E2E_TEST_USER_PASSWORD;

    if (!password) {
      throw new Error("E2E_TEST_USER_PASSWORD not configured");
    }

    // Navigate to sign-in page
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    // Verify we're on the sign-in page
    await expect(page).toHaveURL(/.*sign-in/);

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input#email');
    await emailInput.waitFor({ state: "visible", timeout: 60000 });
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"], input#password');
    await passwordInput.waitFor({ state: "visible", timeout: 60000 });
    await passwordInput.fill(password);

    // Submit login form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: "visible", timeout: 60000 });
    await submitButton.click();

    // Wait for redirect to Practice Hub (increased timeout for Turbopack compilation)
    await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
      timeout: 120000,
    });

    // Verify we're on the Practice Hub dashboard
    await expect(page).toHaveURL(/.*practice-hub/);

    // Wait for page to fully load
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
    // Get test credentials from environment
    const email = process.env.E2E_TEST_USER_EMAIL || "e2e-user@test.com";
    const password = process.env.E2E_TEST_USER_PASSWORD;

    if (!password) {
      throw new Error("E2E_TEST_USER_PASSWORD not configured");
    }

    // Login
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
      timeout: 120000,
    });

    await page.waitForLoadState("networkidle");

    // Navigate to Practice Hub if not already there
    if (!page.url().includes("/practice-hub")) {
      await page.goto("/practice-hub");
      await page.waitForLoadState("networkidle");
    }

    // Verify navigation is present (sidebar or header navigation)
    const hasNavigation =
      (await page.locator('nav, [role="navigation"]').count()) > 0 ||
      (await page.locator('a[href*="/practice-hub"], a[href*="/client-hub"]').count()) > 0;

    expect(hasNavigation).toBeTruthy();
  });
});
