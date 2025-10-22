import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";
import path from "path";
import fs from "fs";

test.describe("Document Upload", () => {
  const testFilePath = path.join(__dirname, "../fixtures/test-document.txt");

  test.beforeAll(() => {
    // Create test document if it doesn't exist
    const fixturesDir = path.join(__dirname, "../fixtures");
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, "E2E Test Document Content - This is a test file for E2E testing.", "utf8");
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should upload document and verify in list", async ({ page }) => {
    const testClient = createTestClient("Document Client");

    // Create a client first
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Navigate to documents page
    await page.goto("/client-hub/documents");

    // Click upload button using stable selector
    await page.click('[data-testid="document-upload-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Upload file using stable selector
    const fileInput = page.locator('[data-testid="document-upload-input"]');
    await fileInput.setInputFiles(testFilePath);

    // Select client if needed
    const clientSelector = page.locator('select, button:has-text("Select client")').first();
    if (await clientSelector.isVisible().catch(() => false)) {
      await clientSelector.click();
      await page.click(`text="${testClient.name}"`);
    }

    // Submit upload
    await page.click('button:has-text("Upload"), button:has-text("Save")');

    // Wait for success
    await expect(page.locator('text=/Upload|Success|Document added/i')).toBeVisible({ timeout: 10000 });

    // Verify document appears in list
    await page.goto("/client-hub/documents");
    await expect(page.locator('text="test-document.txt"')).toBeVisible();
  });

  test("should allow document download", async ({ page }) => {
    const testClient = createTestClient("Download Client");

    // Create client
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Upload document
    await page.goto("/client-hub/documents");
    await page.click('[data-testid="document-upload-button"]');
    await page.waitForSelector('[role="dialog"]');

    const fileInput = page.locator('[data-testid="document-upload-input"]');
    await fileInput.setInputFiles(testFilePath);

    const clientSelector = page.locator('select, button:has-text("Select client")').first();
    if (await clientSelector.isVisible().catch(() => false)) {
      await clientSelector.click();
      await page.click(`text="${testClient.name}"`);
    }

    await page.click('button:has-text("Upload"), button:has-text("Save")');
    await expect(page.locator('text=/Upload|Success|Document added/i')).toBeVisible({ timeout: 10000 });

    // Find and click download button
    await page.goto("/client-hub/documents");
    const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")').first();

    if (await downloadButton.isVisible().catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadButton.click(),
      ]);

      // Verify download started
      expect(download).toBeTruthy();
    }
  });
});
