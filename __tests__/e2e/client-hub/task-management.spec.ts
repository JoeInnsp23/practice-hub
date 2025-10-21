import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient, createTestTask } from "../helpers/factory";
import { cleanupTestData } from "../helpers/cleanup";

test.describe("Task Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should create task, assign, and mark complete", async ({ page }) => {
    const testClient = createTestClient("Task Client");
    const testTask = createTestTask();

    // Create a client first
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Navigate to tasks page
    await page.goto("/client-hub/tasks");

    // Create a new task using stable selector
    await page.click('[data-testid="task-create-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Fill in task details using stable selectors
    await page.fill('[data-testid="task-form-title-input"]', testTask.title);

    // Submit task creation
    await page.click('[data-testid="task-form-save-button"]');

    // Wait for success message
    await expect(page.locator('text=/Task created|Success/i')).toBeVisible({ timeout: 10000 });

    // Verify task appears in task list
    await page.goto("/client-hub/tasks");
    await expect(page.locator(`text="${testTask.title}"`)).toBeVisible();

    // Mark task as complete
    const taskRow = page.locator(`text="${testTask.title}"`).locator("..");
    await taskRow.click();

    // Look for complete/done button or checkbox
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark as Done"), input[type="checkbox"]').first();
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();
    }

    // Verify completion (task should show as completed)
    await expect(page.locator('text=/Completed|Done/i')).toBeVisible({ timeout: 10000 });
  });

  test("should show task in client detail tasks tab", async ({ page }) => {
    const testClient = createTestClient("Client with Tasks");
    const testTask = createTestTask();

    // Create client
    await page.goto("/client-hub/clients");
    await page.click('text="New Client"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="name"]', testClient.name);
    await page.fill('input[name="email"]', testClient.email);
    await page.click('button:has-text("Create Client"), button:has-text("Save")');
    await expect(page.locator('text=/Client created|Success/i')).toBeVisible({ timeout: 10000 });

    // Create task for this client
    await page.goto("/client-hub/tasks");
    await page.click('text="New Task", text="Create Task", text="Add Task"');
    await page.waitForSelector('[role="dialog"]');
    await page.fill('input[name="title"]', testTask.title);

    const clientSelector = page.locator('select, button:has-text("Select client")').first();
    if (await clientSelector.isVisible().catch(() => false)) {
      await clientSelector.click();
      await page.click(`text="${testClient.name}"`);
    }

    await page.click('button:has-text("Create Task"), button:has-text("Save")');
    await expect(page.locator('text=/Task created|Success/i')).toBeVisible({ timeout: 10000 });

    // Navigate to client detail tasks tab
    await page.goto("/client-hub/clients");
    await page.click(`text="${testClient.name}"`);
    await page.waitForURL(/\/client-hub\/clients\/[a-zA-Z0-9-]+/);

    // Click Tasks tab if it exists
    const tasksTab = page.locator('text="Tasks"').first();
    if (await tasksTab.isVisible().catch(() => false)) {
      await tasksTab.click();
    }

    // Verify task appears
    await expect(page.locator(`text="${testTask.title}"`)).toBeVisible();
  });
});
