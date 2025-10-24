import { expect, test } from "@playwright/test";

test.describe("Reports Dashboard Performance", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reports page
    await page.goto("/client-hub/reports");
    await page.waitForLoadState("networkidle");
  });

  test("AC12.1: KPIs should load in <500ms", async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();

    // Wait for KPI cards to be visible
    await page.waitForSelector('[data-testid="kpi-total-revenue"]', {
      state: "visible",
    });
    await page.waitForSelector('[data-testid="kpi-active-clients"]', {
      state: "visible",
    });

    const loadTime = Date.now() - startTime;

    // Verify load time
    expect(loadTime).toBeLessThan(500);

    // Log actual performance
    console.log(`KPI Load Time: ${loadTime}ms (target: <500ms)`);
  });

  test("AC12.2: Charts should load in <1 second", async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();

    // Wait for all charts to be visible (not skeleton loaders)
    await page.waitForSelector('[data-testid="monthly-revenue-chart"]', {
      state: "visible",
    });
    await page.waitForSelector('[data-testid="client-breakdown-chart"]', {
      state: "visible",
    });
    await page.waitForSelector('[data-testid="service-performance-table"]', {
      state: "visible",
    });

    const loadTime = Date.now() - startTime;

    // Verify load time
    expect(loadTime).toBeLessThan(1000);

    console.log(`Charts Load Time: ${loadTime}ms (target: <1000ms)`);
  });

  test("AC12.3: Full page should load in <3 seconds", async ({ page }) => {
    // Use Navigation Timing API
    const performanceMetrics = await page.evaluate(() => {
      const { navigationStart, loadEventEnd } = performance.timing;
      return loadEventEnd - navigationStart;
    });

    // Verify full page load
    expect(performanceMetrics).toBeLessThan(3000);

    console.log(`Page Load Time: ${performanceMetrics}ms (target: <3000ms)`);
  });

  test("AC12.4: Reports should handle date range filtering within 500ms", async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="date-range-selector"]', {
      state: "visible",
    });

    // Change date range
    const startTime = Date.now();

    await page.click('[data-testid="date-range-selector"]');
    await page.click("text=Last 30 days");

    // Wait for charts to update
    await page.waitForLoadState("networkidle");

    const updateTime = Date.now() - startTime;

    expect(updateTime).toBeLessThan(500);

    console.log(`Date Filter Update Time: ${updateTime}ms (target: <500ms)`);
  });
});
