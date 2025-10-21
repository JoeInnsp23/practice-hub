import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient, createTestInvoice } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";

test.describe("Invoice Generation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should create invoice with line items and preview PDF", async ({ page }) => {
    const testClient = createTestClient("Invoice Client");
    const testInvoice = createTestInvoice();

    // Create a client first
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Navigate to invoices page
    await page.goto("/client-hub/invoices");

    // Create new invoice using stable selector
    await page.click('[data-testid="invoice-create-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Fill invoice details using stable selector
    await page.fill('[data-testid="invoice-form-number-input"]', testInvoice.invoiceNumber);

    // Select client
    const clientSelector = page.locator('select, button:has-text("Select client")').first();
    if (await clientSelector.isVisible().catch(() => false)) {
      await clientSelector.click();
      await page.click(`text="${testClient.name}"`);
    }

    // Add line items
    await page.click('button:has-text("Add Item"), button:has-text("Add Line")');

    // Fill in first line item
    await page.fill('input[name*="description"]', "E2E Test Service");
    await page.fill('input[name*="amount"], input[name*="price"]', "100.00");
    await page.fill('input[name*="quantity"]', "2");

    // Save invoice using stable selector
    await page.click('[data-testid="invoice-form-save-button"]');

    // Wait for success
    await expect(page.locator('text=/Invoice created|Success/i')).toBeVisible({ timeout: 10000 });

    // Verify invoice appears in list
    await page.goto("/client-hub/invoices");
    await expect(page.locator(`text="${testInvoice.invoiceNumber}"`)).toBeVisible();

    // View invoice details to check calculations
    await page.click(`text="${testInvoice.invoiceNumber}"`);
    await page.waitForLoadState("networkidle");

    // Verify total calculation (2 x 100 = 200)
    await expect(page.locator('text=/200|£200|\\$200/i')).toBeVisible();

    // Preview PDF if available
    const previewButton = page.locator('button:has-text("Preview"), button:has-text("View PDF"), a:has-text("PDF")').first();
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();
      // Wait for PDF preview to load
      await page.waitForTimeout(2000);
    }
  });

  test("should calculate invoice totals correctly", async ({ page }) => {
    const testClient = createTestClient("Calculation Client");
    const testInvoice = createTestInvoice();

    // Create client
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Create invoice
    await page.goto("/client-hub/invoices");
    await page.click('text="New Invoice", text="Create Invoice"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="invoiceNumber"], input[name="invoice_number"]', testInvoice.invoiceNumber);

    const clientSelector = page.locator('select, button:has-text("Select client")').first();
    if (await clientSelector.isVisible().catch(() => false)) {
      await clientSelector.click();
      await page.click(`text="${testClient.name}"`);
    }

    // Add multiple line items
    await page.click('button:has-text("Add Item"), button:has-text("Add Line")');
    await page.fill('input[name*="description"]', "Service 1");
    await page.fill('input[name*="amount"], input[name*="price"]', "50.00");
    await page.fill('input[name*="quantity"]', "1");

    await page.click('button:has-text("Add Item"), button:has-text("Add Line")');
    const descriptionInputs = await page.locator('input[name*="description"]').all();
    if (descriptionInputs.length > 1) {
      await descriptionInputs[1].fill("Service 2");
    }

    const amountInputs = await page.locator('input[name*="amount"], input[name*="price"]').all();
    if (amountInputs.length > 1) {
      await amountInputs[1].fill("75.00");
    }

    const quantityInputs = await page.locator('input[name*="quantity"]').all();
    if (quantityInputs.length > 1) {
      await quantityInputs[1].fill("2");
    }

    // Save invoice using stable selector
    await page.click('[data-testid="invoice-form-save-button"]');
    await expect(page.locator('text=/Invoice created|Success/i')).toBeVisible({ timeout: 10000 });

    // Verify total (50 + 150 = 200)
    await page.goto("/client-hub/invoices");
    await page.click(`text="${testInvoice.invoiceNumber}"`);
    await page.waitForLoadState("networkidle");

    // Check for total amount
    await expect(page.locator('text=/200|£200|\\$200/i')).toBeVisible();
  });
});
