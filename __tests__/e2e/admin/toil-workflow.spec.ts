import { expect, test } from "@playwright/test";

test.describe("TOIL Complete Workflow (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/sign-in");
  });

  test("should accrue TOIL from approved timesheet", async ({ page }) => {
    // 1. Login as staff user
    await page.fill('input[type="email"]', "staff@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL("/practice-hub");

    // 2. Navigate to timesheets
    await page.goto("/practice-hub/timesheets");

    // 3. Submit timesheet with 45 hours (5 hours overtime)
    await page.click('button:has-text("Submit Timesheet")');

    // Fill in timesheet entries (Mon-Fri with overtime)
    await page.fill('input[name="monday"]', "9");
    await page.fill('input[name="tuesday"]', "9");
    await page.fill('input[name="wednesday"]', "9");
    await page.fill('input[name="thursday"]', "9");
    await page.fill('input[name="friday"]', "9");

    await page.click('button:has-text("Submit for Approval")');

    // Verify submission success
    await expect(page.locator('text="Timesheet submitted"')).toBeVisible();

    // 4. Logout and login as manager
    await page.click('button[aria-label="User menu"]');
    await page.click('text="Sign out"');

    await page.fill('input[type="email"]', "manager@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // 5. Approve timesheet
    await page.goto("/admin-hub/timesheets/pending");
    await page.locator('button:has-text("Approve")').first().click();
    await page.locator('button:has-text("Confirm")').click();

    // Verify approval success
    await expect(page.locator('text="Timesheet approved"')).toBeVisible();

    // 6. Verify TOIL balance increased by 5 hours
    // Logout and login back as staff
    await page.click('button[aria-label="User menu"]');
    await page.click('text="Sign out"');

    await page.fill('input[type="email"]', "staff@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to leave page
    await page.goto("/client-hub/leave");

    // Check TOIL balance widget shows 5 hours
    const toilBalanceWidget = page.locator(
      '[data-testid="toil-balance-widget"]',
    );
    await expect(toilBalanceWidget.locator('text="5.0 hrs"')).toBeVisible();

    // 7. Check TOIL history shows accrual record
    await expect(page.locator('text="TOIL Accrual History"')).toBeVisible();
    await expect(page.locator('text="5.0 hrs"')).toBeVisible();
  });

  test("should redeem TOIL as leave", async ({ page }) => {
    // Setup: Staff user with 15 hours TOIL
    // This would be seeded in beforeEach or test setup

    // 1. Login as staff user
    await page.fill('input[type="email"]', "staff@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/client-hub/leave");

    // 2. Request 2 days TOIL leave (15 hours)
    await page.click('button:has-text("Request Leave")');

    await page.selectOption('select[name="leaveType"]', "toil");
    await page.fill('input[name="startDate"]', "2025-11-01");
    await page.fill('input[name="endDate"]', "2025-11-02");
    await page.fill('textarea[name="notes"]', "Using TOIL for personal days");

    await page.click('button:has-text("Submit Request")');

    // Verify balance validation works
    await expect(page.locator('text="Leave request submitted"')).toBeVisible();

    // 3. Login as manager and approve
    await page.click('button[aria-label="User menu"]');
    await page.click('text="Sign out"');

    await page.fill('input[type="email"]', "manager@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/admin-hub/leave/pending");
    await page.locator('button:has-text("Approve")').first().click();
    await page.fill('textarea[name="comments"]', "Approved");
    await page.locator('button:has-text("Confirm")').click();

    // 4. Verify TOIL balance decreased by 15 hours
    // Login back as staff
    await page.click('button[aria-label="User menu"]');
    await page.click('text="Sign out"');

    await page.fill('input[type="email"]', "staff@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/client-hub/leave");

    // Balance should now be 0 (15 - 15)
    const toilBalanceWidget = page.locator(
      '[data-testid="toil-balance-widget"]',
    );
    await expect(toilBalanceWidget.locator('text="0.0 hrs"')).toBeVisible();
  });

  test("should prevent TOIL redemption exceeding balance", async ({ page }) => {
    // Setup: Staff user with 7.5 hours TOIL (1 day)

    // 1. Login as staff user
    await page.fill('input[type="email"]', "staff@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/client-hub/leave");

    // 2. Attempt to request 2 days TOIL leave (requires 15 hours)
    await page.click('button:has-text("Request Leave")');

    await page.selectOption('select[name="leaveType"]', "toil");
    await page.fill('input[name="startDate"]', "2025-11-01");
    await page.fill('input[name="endDate"]', "2025-11-02");

    await page.click('button:has-text("Submit Request")');

    // 3. Verify error message shown
    await expect(
      page.locator('text="Insufficient TOIL balance"'),
    ).toBeVisible();
    await expect(page.locator('text="You have 7.5 hours"')).toBeVisible();

    // 4. Verify balance unchanged
    const toilBalanceWidget = page.locator(
      '[data-testid="toil-balance-widget"]',
    );
    await expect(toilBalanceWidget.locator('text="7.5 hrs"')).toBeVisible();
  });

  test("should handle TOIL expiry", async ({ page }) => {
    // This test would require triggering the cron job
    // For E2E, we can test the UI shows expired TOIL correctly

    // 1. Login as admin
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // 2. Navigate to TOIL management (if such a page exists)
    // Or trigger the cron endpoint directly
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
    });
    await page.goto("/api/cron/expire-toil", {
      waitUntil: "networkidle",
    });

    // 3. Verify response indicates TOIL was expired
    const responseText = await page.textContent("body");
    expect(responseText).toContain("success");

    // 4. Check staff TOIL history shows expired status
    await page.goto("/client-hub/leave");

    // Navigate to history
    await page.click('tab:has-text("History")');

    // Verify expired badge is shown
    await expect(page.locator('text="Expired"')).toBeVisible();
  });
});
