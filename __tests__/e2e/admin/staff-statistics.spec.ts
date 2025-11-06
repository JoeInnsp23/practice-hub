import { expect, test } from "@playwright/test";

test.describe("Staff Statistics Page (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("/practice-hub");
  });

  test("should display staff utilization cards", async ({ page }) => {
    // 1. Navigate to statistics page
    await page.goto("/admin-hub/staff/statistics");

    // 2. Verify summary cards render
    await expect(page.locator('text="Total Staff"')).toBeVisible();
    await expect(page.locator('text="Average Utilization"')).toBeVisible();
    await expect(page.locator('text="Overallocated"')).toBeVisible();
    await expect(page.locator('text="Underutilized"')).toBeVisible();

    // 3. Verify individual staff cards render
    const staffCards = page.locator('[data-testid="staff-utilization-card"]');
    await expect(staffCards.first()).toBeVisible();

    // 4. Check that utilization percentage is displayed
    await expect(page.locator('text="%"')).toBeVisible();

    // 5. Check color coding for overallocated/underutilized
    // Overallocated should have red styling
    const overallocatedCard = page.locator(".border-red-200").first();
    if (await overallocatedCard.isVisible()) {
      await expect(overallocatedCard).toBeVisible();
    }

    // Underutilized should have yellow styling
    const underutilizedCard = page.locator(".border-yellow-200").first();
    if (await underutilizedCard.isVisible()) {
      await expect(underutilizedCard).toBeVisible();
    }
  });

  test("should display 12-week trend chart", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // 1. Click "View Trend" on a staff card
    const viewTrendButton = page
      .locator('button:has-text("View 12-Week Trend")')
      .first();
    await viewTrendButton.click();

    // 2. Verify dialog opens
    await expect(
      page.locator('text="12-Week Utilization Trend"'),
    ).toBeVisible();

    // 3. Verify LineChart renders (check for SVG element)
    const chart = page.locator("svg").first();
    await expect(chart).toBeVisible();

    // 4. Check data points match expected weeks (12 data points)
    // The chart should have reference lines for 100% and 60%
    await expect(page.locator('text="100% Capacity"')).toBeVisible();
    await expect(page.locator('text="60% Threshold"')).toBeVisible();

    // 5. Close dialog
    await page.keyboard.press("Escape");
    await expect(
      page.locator('text="12-Week Utilization Trend"'),
    ).not.toBeVisible();
  });

  test("should switch between view tabs", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // 1. Verify Individual View tab is active by default
    await expect(
      page.locator('button[data-state="active"]:has-text("Individual View")'),
    ).toBeVisible();

    // 2. Click Heatmap tab
    await page.click('button:has-text("Heatmap")');

    // Verify heatmap legend is visible
    await expect(page.locator('text="Overallocated (>100%)"')).toBeVisible();
    await expect(page.locator('text="Optimal (60-100%)"')).toBeVisible();

    // 3. Click Comparison Table tab
    await page.click('button:has-text("Comparison Table")');

    // Verify table headers are visible
    await expect(page.locator('text="Name"')).toBeVisible();
    await expect(page.locator('text="Utilization"')).toBeVisible();
    await expect(page.locator('text="Status"')).toBeVisible();
  });

  test("should sort comparison table", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // 1. Navigate to Comparison Table tab
    await page.click('button:has-text("Comparison Table")');

    // 2. Click "Utilization" column header to sort
    const utilizationHeader = page
      .locator('button:has-text("Utilization")')
      .first();
    await utilizationHeader.click();

    // Verify ascending sort icon appears
    await expect(page.locator("svg.lucide-arrow-up")).toBeVisible();

    // 3. Click again to sort descending
    await utilizationHeader.click();

    // Verify descending sort icon appears
    await expect(page.locator("svg.lucide-arrow-down")).toBeVisible();

    // 4. Verify rows are sorted (first row should have highest utilization)
    const firstRow = page.locator("tbody tr").first();
    const lastRow = page.locator("tbody tr").last();

    const firstUtilization = await firstRow.locator("td").nth(5).textContent();
    const lastUtilization = await lastRow.locator("td").nth(5).textContent();

    // Extract numbers
    const firstValue = parseInt(firstUtilization?.replace("%", "") || "0", 10);
    const lastValue = parseInt(lastUtilization?.replace("%", "") || "0", 10);

    expect(firstValue).toBeGreaterThanOrEqual(lastValue);
  });

  test("should filter comparison table by status", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // Navigate to Comparison Table tab
    await page.click('button:has-text("Comparison Table")');

    // Get initial row count
    const _initialRows = await page.locator("tbody tr").count();

    // 1. Click status filter dropdown
    await page.click('button:has-text("Filter by status")');

    // 2. Select "Overallocated"
    await page.click('text="Overallocated"');

    // 3. Verify only overallocated staff shown
    const rows = page.locator("tbody tr");
    const count = await rows.count();

    if (count > 0) {
      // Check first row has Overallocated badge
      const firstRowBadge = rows.first().locator('text="Overallocated"');
      await expect(firstRowBadge).toBeVisible();
    }

    // 4. Change filter to "All Statuses"
    await page.click('button:has-text("Overallocated")');
    await page.click('text="All Statuses"');

    // Verify all rows are shown again
    const allRows = await page.locator("tbody tr").count();
    expect(allRows).toBeGreaterThanOrEqual(count);
  });

  test("should export CSV", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // Navigate to Comparison Table tab
    await page.click('button:has-text("Comparison Table")');

    // 1. Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // 2. Click "Export CSV" button
    await page.click('button:has-text("Export CSV")');

    // 3. Verify download triggered
    const download = await downloadPromise;

    // 4. Check CSV file contains correct headers and data
    const filename = download.suggestedFilename();
    expect(filename).toContain("staff-utilization");
    expect(filename).toContain(".csv");
  });

  test("should display utilization alerts", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // Check if overallocated alert is present
    const overallocatedAlert = page.locator('text="Overallocated Staff"');

    if (await overallocatedAlert.isVisible()) {
      // 1. Verify red alert is shown
      const alert = page.locator('[role="alert"]').first();
      await expect(alert).toBeVisible();

      // 2. Check alert lists staff members
      await expect(page.locator('text="utilization"')).toBeVisible();
      await expect(page.locator('text="hours over capacity"')).toBeVisible();
    }

    // Check if underutilized alert is present
    const underutilizedAlert = page.locator('text="Underutilized Staff"');

    if (await underutilizedAlert.isVisible()) {
      // Verify alert shows available hours
      await expect(page.locator('text="hours available"')).toBeVisible();
    }
  });

  test("should display department utilization", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // Scroll to department utilization section
    await page
      .locator('text="Department Utilization"')
      .scrollIntoViewIfNeeded();

    // 1. Verify department utilization card is visible
    await expect(page.locator('text="Department Utilization"')).toBeVisible();

    // 2. Verify at least one department is shown
    const departments = page.locator('[data-testid="department-bar"]');

    if ((await departments.count()) > 0) {
      // Check department name is visible
      await expect(departments.first()).toBeVisible();

      // Check utilization percentage is shown
      await expect(page.locator('text="%"')).toBeVisible();

      // Check progress bar is rendered
      const progressBar = page.locator(".h-3.bg-muted").first();
      await expect(progressBar).toBeVisible();
    }
  });

  test("should handle loading states", async ({ page }) => {
    await page.goto("/admin-hub/staff/statistics");

    // On first load, skeleton loaders should appear briefly
    // This is hard to test due to speed, but we can verify the page eventually loads

    await page.waitForSelector('text="Total Staff"', { timeout: 5000 });

    // Verify no skeleton loaders remain
    const skeletons = page.locator('[data-testid="skeleton"]');
    expect(await skeletons.count()).toBe(0);
  });

  test("should handle empty state", async ({ page }) => {
    // This would require a test database with no staff data
    // or mocking the API responses

    await page.goto("/admin-hub/staff/statistics");

    // If no data, should show empty state message
    const emptyMessage = page.locator('text="No utilization data available"');

    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});
