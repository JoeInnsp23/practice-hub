import { test, expect } from "@playwright/test";

/**
 * Authentication Flow Tests
 *
 * These tests verify the login/logout flow itself, so they:
 * 1. Do NOT use the shared authentication state from global-setup
 * 2. Start with a fresh, unauthenticated browser context
 * 3. Test the actual login process
 */

// Override storageState to start with fresh, unauthenticated context
test.use({ storageState: undefined });

test.describe("Authentication Flow", () => {
  test("should successfully log in with valid credentials", async ({ page }) => {
    // Get test credentials from environment
    const email = process.env.E2E_TEST_USER_EMAIL || "e2e-user@test.com";
    const password = process.env.E2E_TEST_USER_PASSWORD;

    if (!password) {
      throw new Error("E2E_TEST_USER_PASSWORD not configured");
    }

    // Navigate to the sign-in page
    await page.goto("/sign-in");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the sign-in page
    await expect(page).toHaveURL(/.*sign-in/);

    // Wait for and fill in the email field
    const emailInput = page.locator('input[type="email"], input#email');
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(email);

    // Wait for and fill in the password field
    const passwordInput = page.locator('input[type="password"], input#password');
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(password);

    // Find and click the submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: "visible", timeout: 10000 });
    await submitButton.click();

    // Wait for successful login (redirect away from sign-in page)
    // Increased timeout to account for Turbopack cold-start compilation and parallel execution
    await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
      timeout: 120000,
    });

    // Verify we're logged in by checking we're no longer on sign-in page
    await expect(page).not.toHaveURL(/.*sign-in/);

    // Optional: Check for some indication that we're logged in
    // (this could be a user menu, navigation, or page content)
    console.log(`Successfully logged in. Current URL: ${page.url()}`);
  });

  test("should show error with invalid credentials", async ({ page }) => {
    // Navigate to the sign-in page
    await page.goto("/sign-in");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Fill in invalid credentials
    await page.fill('input[type="email"], input#email', "invalid@test.com");
    await page.fill('input[type="password"], input#password', "wrongpassword");

    // Click submit
    await page.click('button[type="submit"]');

    // Wait a moment for error to appear
    await page.waitForTimeout(2000);

    // We should still be on the sign-in page
    await expect(page).toHaveURL(/.*sign-in/);

    // Check for error message (toast or inline error)
    // Note: Adjust selector based on your actual error display
    const hasError =
      (await page.locator('[role="alert"]').count()) > 0 ||
      (await page.locator('.error, [class*="error"]').count()) > 0 ||
      (await page.locator('text=/invalid|incorrect|wrong/i').count()) > 0;

    expect(hasError).toBeTruthy();
  });
});
