import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";

test.describe("Client Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should create new client with contact information", async ({ page }) => {
    const testClient = createTestClient("New Client Ltd");

    // Navigate to clients page
    await page.goto("/client-hub/clients");

    // Click "New Client" button using stable selector
    await page.click('[data-testid="client-creation-button"]');

    // Wait for modal/wizard to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Fill in client basic information using stable selectors
    await page.fill('[data-testid="client-form-name-input"]', testClient.name);

    // Select client type
    await page.click('[data-testid="client-form-type-select"]');
    await page.click(`text="${testClient.type}"`);

    // Select client status
    await page.click('[data-testid="client-form-status-select"]');
    await page.click('text="Active"');

    // Select account manager
    await page.click('[data-testid="client-form-account-manager-select"]');
    await page.click('text="John Smith"');

    // Submit the form - navigate through wizard and complete
    await page.click('[data-testid="client-wizard-next-button"]'); // Move through wizard steps
    // Skip optional steps by continuing to next
    for (let i = 0; i < 6; i++) {
      const nextButton = page.locator('[data-testid="client-wizard-next-button"]');
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
      }
    }
    // Complete on final step
    await page.click('[data-testid="client-wizard-complete-button"]');

    // Wait for success message
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Verify client appears in the list
    await page.goto("/client-hub/clients");
    await expect(page.locator(`text="${testClient.name}"`)).toBeVisible();
  });

  test("should persist client data across page refresh", async ({ page }) => {
    const testClient = createTestClient("Persistent Client");

    // Create client using stable selectors
    await page.goto("/client-hub/clients");
    await page.click('[data-testid="client-creation-button"]');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('[data-testid="client-form-name-input"]', testClient.name);
    await page.click('[data-testid="client-form-type-select"]');
    await page.click('text="Limited Company"');
    await page.click('[data-testid="client-form-status-select"]');
    await page.click('text="Active"');
    await page.click('[data-testid="client-form-account-manager-select"]');
    await page.click('text="John Smith"');
    // Navigate through wizard
    for (let i = 0; i < 7; i++) {
      const nextButton = page.locator('[data-testid="client-wizard-next-button"]');
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
      }
    }
    await page.click('[data-testid="client-wizard-complete-button"]');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Refresh page
    await page.reload();

    // Verify client still appears
    await expect(page.locator(`text="${testClient.name}"`)).toBeVisible();
  });

  test("should support keyboard navigation in client form", async ({ page }) => {
    const testClient = createTestClient("Keyboard Nav Client");

    await page.goto("/client-hub/clients");
    await page.click('[data-testid="client-creation-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Focus and type in name field
    await page.focus('[data-testid="client-form-name-input"]');
    await page.keyboard.type(testClient.name);

    // Form should be fillable via keyboard
    const nameValue = await page.inputValue('[data-testid="client-form-name-input"]');
    expect(nameValue).toBe(testClient.name);
  });
});
