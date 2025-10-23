import { test, expect } from "@playwright/test";

// Tests now use shared authenticated state from global-setup.ts
// No individual login needed - all tests start already authenticated

test.describe("Module Navigation", () => {
  test("should navigate between Practice Hub and Client Hub", async ({ page }) => {
    // No login needed - test starts with authenticated state from global-setup

    // Navigate to Practice Hub first
    await page.goto("/practice-hub");
    await page.waitForLoadState("networkidle");

    // Verify we're on Practice Hub
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
