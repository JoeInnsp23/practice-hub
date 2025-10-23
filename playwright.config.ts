import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 *
 * Authentication Strategy:
 * - Global setup logs in ONCE and saves authenticated state
 * - All tests reuse this state (no individual logins)
 * - Eliminates auth session conflicts from parallel execution
 */
export default defineConfig({
  testDir: "./__tests__/e2e",

  // Global setup runs ONCE before all tests to create authenticated session
  globalSetup: path.join(__dirname, "__tests__/e2e/global-setup.ts"),

  // Test execution settings
  timeout: 300000, // 300 seconds (5min) per test (increased for Turbopack cold-start compilation)
  fullyParallel: true, // Run tests in parallel for better performance (safe now with shared auth)
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

    // All tests use the authenticated state from global setup
    // This eliminates the need for individual login steps in each test
    storageState: path.join(__dirname, "__tests__/e2e/.auth/user.json"),
  },

  // Browser projects
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Inherit storageState from shared settings
      },
    },
    // Firefox for critical flows only (can be enabled via --project=firefox)
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // Inherit storageState from shared settings
      },
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
