import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";

test.describe("Client Detail View", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should navigate to client detail and view all tabs", async ({ page }) => {
    const testClient = createTestClient("Detail View Client");

    // Create a client first
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Click on the client to view details
    await page.goto("/client-hub/clients");
    await page.click(`text="${testClient.name}"`);

    // Wait for detail page to load
    await page.waitForURL(/\/client-hub\/clients\/[a-zA-Z0-9-]+/);

    // Verify client name appears on detail page
    await expect(page.locator(`text="${testClient.name}"`)).toBeVisible();

    // Test tab navigation (assuming tabs exist for: Info, Services, Tasks, Documents, Invoices)
    const tabs = [
      "Overview",
      "Information",
      "Info",
      "Services",
      "Tasks",
      "Documents",
      "Invoices",
    ];

    // Click through available tabs
    for (const tabName of tabs) {
      const tabLocator = page.locator(`text="${tabName}"`).first();
      if (await tabLocator.isVisible().catch(() => false)) {
        await tabLocator.click();
        // Wait for tab content to load
        await page.waitForLoadState("networkidle");
      }
    }

    // Verify we're still on the client detail page
    await expect(page).toHaveURL(/\/client-hub\/clients\/[a-zA-Z0-9-]+/);
  });

  test("should display client information correctly", async ({ page }) => {
    const testClient = createTestClient("Info Display Client");

    // Create client
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Navigate to detail page
    await page.goto("/client-hub/clients");
    await page.click(`text="${testClient.name}"`);
    await page.waitForURL(/\/client-hub\/clients\/[a-zA-Z0-9-]+/);

    // Verify client email is displayed
    await expect(page.locator(`text="${testClient.email}"`)).toBeVisible();
  });
});
