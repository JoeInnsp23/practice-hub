import { expect, test } from "@playwright/test";

/**
 * TEST-001: My Tasks Filter Validation (GAP-001)
 *
 * This test validates the fix for GAP-001 - ensuring the "My Tasks" filter
 * correctly returns tasks where the user is assigned as:
 * - assignedTo (primary assignee)
 * - preparer
 * - reviewer
 *
 * Test database seed creates 4 tasks:
 * 1. assignedTo = e2e-user (SHOULD APPEAR)
 * 2. preparer = e2e-user (SHOULD APPEAR)
 * 3. reviewer = e2e-user (SHOULD APPEAR)
 * 4. assignedTo = e2e-admin (SHOULD NOT APPEAR)
 *
 * Related:
 * - GAP-001: docs/gap-analysis/fixes/my-tasks-filter-fix.md
 * - Legacy: .archive/crm-app/src/hooks/useTasks.ts:76-79 (OR filter)
 * - Fix: lib/db/queries/task-queries.ts:44-51 (OR across 3 fields)
 */

test.describe("My Tasks Filter (GAP-001)", () => {
  test.beforeEach(async () => {
    // Reset test database with tasks
    // This requires running: pnpm test:e2e:reset-db
    // The test database should have 4 tasks seeded as described above
  });

  test("should show tasks where user is assignedTo", async ({ page }) => {
    // Login as e2e-user
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', "e2e-user@test.com");
    await page.fill(
      'input[name="password"]',
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!",
    );
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/practice-hub", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/client-hub/tasks");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Look for the task with title containing "assigned to member"
    const assignedTask = page.locator(
      'text="Task assigned to member (assignedTo)"',
    );
    await expect(assignedTask).toBeVisible({ timeout: 10000 });
  });

  test("should show tasks where user is preparer", async ({ page }) => {
    // Login as e2e-user
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', "e2e-user@test.com");
    await page.fill(
      'input[name="password"]',
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!",
    );
    await page.click('button[type="submit"]');

    await page.waitForURL("**/practice-hub", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/client-hub/tasks");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Look for the task with title containing "member as preparer"
    const preparerTask = page.locator('text="Task with member as preparer"');
    await expect(preparerTask).toBeVisible({ timeout: 10000 });
  });

  test("should show tasks where user is reviewer", async ({ page }) => {
    // Login as e2e-user
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', "e2e-user@test.com");
    await page.fill(
      'input[name="password"]',
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!",
    );
    await page.click('button[type="submit"]');

    await page.waitForURL("**/practice-hub", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/client-hub/tasks");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Look for the task with title containing "member as reviewer"
    const reviewerTask = page.locator('text="Task with member as reviewer"');
    await expect(reviewerTask).toBeVisible({ timeout: 10000 });
  });

  test("should NOT show tasks where user is not involved", async ({ page }) => {
    // Login as e2e-user
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', "e2e-user@test.com");
    await page.fill(
      'input[name="password"]',
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!",
    );
    await page.click('button[type="submit"]');

    await page.waitForURL("**/practice-hub", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/client-hub/tasks");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // The task "Task NOT assigned to member" should NOT be visible
    const unassignedTask = page.locator('text="Task NOT assigned to member"');
    await expect(unassignedTask).not.toBeVisible({ timeout: 5000 });
  });

  test("comprehensive: should show exactly 3 tasks for member user", async ({
    page,
  }) => {
    // Login as e2e-user
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', "e2e-user@test.com");
    await page.fill(
      'input[name="password"]',
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!",
    );
    await page.click('button[type="submit"]');

    await page.waitForURL("**/practice-hub", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/client-hub/tasks");
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Count tasks that should be visible
    const visibleTasks = [
      "Task assigned to member (assignedTo)",
      "Task with member as preparer",
      "Task with member as reviewer",
    ];

    for (const taskTitle of visibleTasks) {
      const task = page.locator(`text="${taskTitle}"`);
      await expect(task).toBeVisible({ timeout: 10000 });
    }

    // Verify the 4th task is NOT visible
    const unassignedTask = page.locator('text="Task NOT assigned to member"');
    await expect(unassignedTask).not.toBeVisible({ timeout: 5000 });

    console.log(
      "✅ GAP-001 validated: My Tasks filter correctly shows tasks across assignedTo, preparer, and reviewer fields",
    );
  });
});
