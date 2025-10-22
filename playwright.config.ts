import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./__tests__/e2e",

  // Test execution settings
  timeout: 300000, // 300 seconds (5min) per test (increased for Turbopack cold-start compilation)
  fullyParallel: true, // Run tests in parallel for better performance
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 2 : 3, // Multiple workers for parallel execution (3 local, 2 in CI)

  // Reporter configuration
  reporter: [
    ["html"],
    ["list"],
  ],

  // Shared test settings
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Browser projects
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox for critical flows only (can be enabled via --project=firefox)
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  // Web server configuration
  webServer: {
    command: "dotenv -e .env.test -- pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start dev server
  },
});
