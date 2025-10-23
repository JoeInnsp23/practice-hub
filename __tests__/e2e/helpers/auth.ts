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
  await page.waitForLoadState("networkidle");

  // Wait for form to be fully loaded and visible (with generous timeout for Turbopack)
  await page.waitForSelector("input#email", {
    state: "visible",
    timeout: 60000,
  });
  await page.waitForSelector("input#password", {
    state: "visible",
    timeout: 60000,
  });

  // Fill in credentials using ID selectors
  await page.fill("input#email", email);
  await page.fill("input#password", password);

  // Submit form
  await page.click('button[type="submit"]');

  // Add debug information
  console.log(`Successfully logged in. Current URL: ${page.url()}`);

  // Try multiple approaches to wait for navigation
  try {
    // First, wait for any navigation to occur
    await Promise.race([
      page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
        timeout: 30000,
      }),
      page
        .waitForResponse((response) => response.url().includes("/api/auth"), {
          timeout: 30000,
        })
        .catch(() => null),
      page.waitForLoadState("domcontentloaded", { timeout: 30000 }),
    ]);

    // Check if we're still on sign-in page (possible error)
    if (page.url().includes("/sign-in")) {
      // Check for error messages
      const errorMessage = await page
        .locator('[role="alert"], .error, .text-red-500, .text-destructive')
        .first()
        .textContent()
        .catch(() => null);
      if (errorMessage) {
        throw new Error(`Login failed with error: ${errorMessage}`);
      }

      // If no error but still on sign-in, wait longer for redirect
      await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
        timeout: 90000,
      });
    }
  } catch (error) {
    // Log the current state for debugging
    console.error(`Navigation timeout. Current URL: ${page.url()}`);
    const errorText = await page
      .locator('[role="alert"], .error')
      .first()
      .textContent()
      .catch(() => "No error message found");
    console.error(`Error on page: ${errorText}`);
    throw error;
  }

  // Wait for page to stabilize after redirect
  await page.waitForLoadState("networkidle");
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
  await page.waitForLoadState("networkidle");

  // Wait for form to be fully loaded and visible (with generous timeout for Turbopack)
  await page.waitForSelector("input#email", {
    state: "visible",
    timeout: 60000,
  });
  await page.waitForSelector("input#password", {
    state: "visible",
    timeout: 60000,
  });

  // Fill in credentials using ID selectors
  await page.fill("input#email", email);
  await page.fill("input#password", password);

  // Submit form
  await page.click('button[type="submit"]');

  // Add debug information
  console.log(`Successfully logged in. Current URL: ${page.url()}`);

  // Try multiple approaches to wait for navigation
  try {
    // First, wait for any navigation to occur
    await Promise.race([
      page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
        timeout: 30000,
      }),
      page
        .waitForResponse((response) => response.url().includes("/api/auth"), {
          timeout: 30000,
        })
        .catch(() => null),
      page.waitForLoadState("domcontentloaded", { timeout: 30000 }),
    ]);

    // Check if we're still on sign-in page (possible error)
    if (page.url().includes("/sign-in")) {
      // Check for error messages
      const errorMessage = await page
        .locator('[role="alert"], .error, .text-red-500, .text-destructive')
        .first()
        .textContent()
        .catch(() => null);
      if (errorMessage) {
        throw new Error(`Login failed with error: ${errorMessage}`);
      }

      // If no error but still on sign-in, wait longer for redirect
      await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
        timeout: 90000,
      });
    }
  } catch (error) {
    // Log the current state for debugging
    console.error(`Navigation timeout. Current URL: ${page.url()}`);
    const errorText = await page
      .locator('[role="alert"], .error')
      .first()
      .textContent()
      .catch(() => "No error message found");
    console.error(`Error on page: ${errorText}`);
    throw error;
  }

  // Wait for page to stabilize after redirect
  await page.waitForLoadState("networkidle");
}
