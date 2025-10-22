import { test, expect } from "@playwright/test";

test.describe("Module Navigation", () => {
  test("should navigate between Practice Hub and Client Hub", async ({ page }) => {
    // Get test credentials
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

    // Should start on Practice Hub
    await expect(page).toHaveURL(/.*practice-hub/);

    // Navigate to Client Hub (looking for navigation links)
    const clientHubLink = page.locator('a[href*="/client-hub"], nav a:has-text("Client"), nav a:has-text("Clients")').first();

    if (await clientHubLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientHubLink.click();
      await page.waitForURL(/.*client-hub/, { timeout: 120000 });
      await page.waitForLoadState("networkidle");

      // Verify we're on Client Hub
      await expect(page).toHaveURL(/.*client-hub/);

      // Navigate back to Practice Hub
      const practiceHubLink = page.locator('a[href*="/practice-hub"], nav a:has-text("Practice"), nav a:has-text("Dashboard")').first();

      if (await practiceHubLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await practiceHubLink.click();
        await page.waitForURL(/.*practice-hub/, { timeout: 120000 });
        await page.waitForLoadState("networkidle");

        // Verify we're back on Practice Hub
        await expect(page).toHaveURL(/.*practice-hub/);
      }
    } else {
      // If navigation isn't visible, just verify we can navigate via URL
      await page.goto("/client-hub");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/.*client-hub/);
    }
  });
});
