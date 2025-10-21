import type { Page } from "@playwright/test";

/**
 * Authentication helper for E2E tests
 * Logs in as test user and waits for redirect to client-hub
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E test credentials not configured in environment");
  }

  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to client-hub (indicates successful login)
  await page.waitForURL("**/client-hub", { timeout: 10000 });
}

/**
 * Authentication helper for E2E tests with admin user
 * Logs in as test admin and waits for redirect to client-hub
 */
export async function loginAsTestAdmin(page: Page): Promise<void> {
  const email = "e2e-admin@test.com";
  const password = process.env.E2E_TEST_ADMIN_PASSWORD;

  if (!password) {
    throw new Error("E2E admin password not configured in environment");
  }

  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to client-hub
  await page.waitForURL("**/client-hub", { timeout: 10000 });
}
