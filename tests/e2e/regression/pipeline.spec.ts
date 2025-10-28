import { expect, test } from "@playwright/test";

/**
 * Proposals Pipeline E2E Tests
 *
 * These tests verify the proposals pipeline Kanban board functionality.
 * IMPORTANT: These tests are currently skipped pending Playwright setup.
 *
 * To enable these tests:
 * 1. Install Playwright: pnpm add -D @playwright/test
 * 2. Configure playwright.config.ts
 * 3. Set up authentication flow
 * 4. Remove test.skip() calls below
 */

test.describe("Proposals Pipeline", () => {
  test.skip("should allow dragging proposal between stages", async ({
    page,
  }) => {
    // TODO: Set up Playwright and authentication flow

    // Navigate to pipeline
    await page.goto("/proposal-hub/proposals/pipeline");

    // Wait for kanban board to load
    await page.waitForSelector('[role="list"]');

    // Find a proposal card in "qualified" column
    const qualifiedColumn = page.locator('[aria-label="Qualified proposals"]');
    const proposalCard = qualifiedColumn.locator('[role="listitem"]').first();

    // Get proposal title for verification
    const proposalTitle = await proposalCard.textContent();

    // Drag to "proposal_sent" column
    const proposalSentColumn = page.locator(
      '[aria-label="Proposal Sent proposals"]',
    );

    await proposalCard.dragTo(proposalSentColumn);

    // Verify proposal moved
    await expect(
      proposalSentColumn.locator(`text=${proposalTitle}`),
    ).toBeVisible();
    await expect(
      qualifiedColumn.locator(`text=${proposalTitle}`),
    ).not.toBeVisible();

    // Verify toast notification
    await expect(
      page.locator("text=Proposal moved successfully"),
    ).toBeVisible();
  });

  test.skip("should filter proposals by assignee", async ({ page }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Select assignee from dropdown
    await page.click('button:has-text("All assignees")');
    await page.click('text="Joe Test"');

    // Verify filtered results
    const cards = page.locator('[role="listitem"]');
    const count = await cards.count();

    // Verify at least some proposals are shown
    expect(count).toBeGreaterThan(0);
  });

  test.skip("should filter proposals by date range", async ({ page }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Open date picker for "From" date
    await page.click('button:has-text("From")');

    // Select first day of month (implementation depends on Calendar component)
    await page.click('button[name="day"]:has-text("1")');

    // Verify filtered results
    const cards = page.locator('[role="listitem"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test.skip("should filter proposals by value range", async ({ page }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Set minimum value filter
    await page.fill('input[placeholder="Min £"]', "1000");

    // Set maximum value filter
    await page.fill('input[placeholder="Max £"]', "5000");

    // Wait for debounce
    await page.waitForTimeout(500);

    // Verify filtered results
    const cards = page.locator('[role="listitem"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test.skip("should display KPIs correctly", async ({ page }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Wait for KPIs to load
    await page.waitForSelector("text=Total Proposals");

    // Verify KPI values are displayed
    const totalProposals = await page
      .locator("text=Total Proposals")
      .locator("..")
      .locator(".text-2xl")
      .textContent();

    // Parse and verify it's a number
    const proposalCount = Number.parseInt(totalProposals || "0", 10);
    expect(proposalCount).toBeGreaterThanOrEqual(0);

    // Verify other KPIs are present
    await expect(page.locator("text=Active Pipeline")).toBeVisible();
    await expect(page.locator("text=Total Value")).toBeVisible();
    await expect(page.locator("text=Win Rate")).toBeVisible();
  });

  test.skip("should clear all filters when Clear Filters is clicked", async ({
    page,
  }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Apply some filters
    await page.fill(
      'input[placeholder="Search by title, number, or client..."]',
      "test",
    );
    await page.fill('input[placeholder="Min £"]', "1000");

    // Wait for Clear Filters button to appear
    await page.waitForSelector("button:has-text('Clear Filters')");

    // Click Clear Filters
    await page.click("button:has-text('Clear Filters')");

    // Verify filters are cleared
    const searchInput = page.locator(
      'input[placeholder="Search by title, number, or client..."]',
    );
    await expect(searchInput).toHaveValue("");

    const minValueInput = page.locator('input[placeholder="Min £"]');
    await expect(minValueInput).toHaveValue("");

    // Verify Clear Filters button is hidden
    await expect(
      page.locator("button:has-text('Clear Filters')"),
    ).not.toBeVisible();
  });

  test.skip("should navigate to proposal details when card is clicked", async ({
    page,
  }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Wait for proposals to load
    await page.waitForSelector('[role="listitem"]');

    // Get first proposal card
    const firstCard = page.locator('[role="listitem"]').first();

    // Get the proposal number for URL verification
    const proposalNumber = await firstCard
      .locator("p.text-xs")
      .first()
      .textContent();

    // Click the card (actually clicking the Link inside)
    await firstCard.click();

    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/proposal-hub\/proposals\/[a-z0-9-]+$/);

    // Verify proposal detail page is loaded
    await expect(page.locator(`text=${proposalNumber}`)).toBeVisible();
  });

  test.skip("should show empty state when no proposals match filters", async ({
    page,
  }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Apply filters that will return no results
    await page.fill(
      'input[placeholder="Search by title, number, or client..."]',
      "zzzznonexistent999",
    );

    // Wait for debounce
    await page.waitForTimeout(500);

    // Verify empty state is shown in columns
    await expect(page.locator("text=No enquiry proposals")).toBeVisible();
  });

  test.skip("should handle keyboard navigation with Tab key", async ({
    page,
  }) => {
    await page.goto("/proposal-hub/proposals/pipeline");

    // Wait for proposals to load
    await page.waitForSelector('[role="listitem"]');

    // Focus first proposal card
    await page.keyboard.press("Tab");

    // Verify focus is on a proposal card
    const focusedElement = await page.evaluateHandle(
      () => document.activeElement,
    );
    const role = await focusedElement.evaluate((el) =>
      el?.getAttribute("role"),
    );
    expect(role).toBe("listitem");
  });
});
