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

  // Navigate to sign-in page with redirect to client-hub
  await page.goto("/sign-in?from=/client-hub");

  // Wait for form to be fully loaded and visible
  await page.waitForSelector('input#email', { state: 'visible' });
  await page.waitForSelector('input#password', { state: 'visible' });

  // Fill in credentials using ID selectors
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to client-hub (indicates successful login)
  // Increased timeout to account for page compilation time in dev mode
  await page.waitForURL("**/client-hub", { timeout: 45000 });
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

  // Navigate to sign-in page with redirect to client-hub
  await page.goto("/sign-in?from=/client-hub");

  // Wait for form to be fully loaded and visible
  await page.waitForSelector('input#email', { state: 'visible' });
  await page.waitForSelector('input#password', { state: 'visible' });

  // Fill in credentials using ID selectors
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to client-hub
  // Increased timeout to account for page compilation time in dev mode
  await page.waitForURL("**/client-hub", { timeout: 45000 });
}
