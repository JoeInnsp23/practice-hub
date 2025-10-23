import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";

/**
 * Global Setup for E2E Tests
 *
 * This script runs ONCE before all tests to:
 * 1. Login as the test user
 * 2. Save the authenticated session to a file
 * 3. All tests reuse this authenticated state (no individual logins needed)
 *
 * Benefits:
 * - Eliminates auth session conflicts from parallel execution
 * - Faster test execution (login happens once, not per file)
 * - More reliable tests (no auth contention)
 */
async function globalSetup(config: FullConfig) {
  const storageStatePath = path.join(__dirname, ".auth", "user.json");

  console.log("🔐 Global Setup: Authenticating test user...");

  // Get test credentials from environment
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E test credentials not configured. Please set E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD in .env.test",
    );
  }

  // Launch browser and create authenticated session
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to sign-in page
    const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";
    await page.goto(`${baseURL}/sign-in`);

    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input#email');
    await emailInput.waitFor({ state: "visible", timeout: 60000 });
    await emailInput.fill(email);

    const passwordInput = page.locator(
      'input[type="password"], input#password',
    );
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(password);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: "visible", timeout: 10000 });
    await submitButton.click();

    // Wait for successful login (redirect away from sign-in)
    await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
      timeout: 120000, // 2 minutes for Turbopack compilation
    });

    console.log(
      `✅ Global Setup: Successfully authenticated. Current URL: ${page.url()}`,
    );

    // Save authenticated state to file
    await context.storageState({ path: storageStatePath });
    console.log(
      `💾 Global Setup: Saved authentication state to ${storageStatePath}`,
    );
  } catch (error) {
    console.error("❌ Global Setup: Authentication failed");
    console.error(`Current URL: ${page.url()}`);

    // Try to capture error message from page
    const errorText = await page
      .locator('[role="alert"], .error, .text-destructive')
      .first()
      .textContent()
      .catch(() => "No error message found");
    console.error(`Error on page: ${errorText}`);

    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
