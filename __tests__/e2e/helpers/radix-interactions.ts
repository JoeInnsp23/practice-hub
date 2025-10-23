/**
 * Radix UI Interaction Helpers
 *
 * Playwright helpers for interacting with Radix UI components reliably.
 * These functions handle common patterns like portal rendering, scrolling,
 * and focus management that cause brittleness in E2E tests.
 */

import type { Page, Locator } from "@playwright/test";

/**
 * Interact with Radix Select component
 *
 * Radix Select components render dropdown content in a Portal,
 * which requires special handling in Playwright tests.
 *
 * @param page - Playwright page object
 * @param triggerDataTestId - data-testid of the SelectTrigger element
 * @param optionText - Text of the option to select
 * @param options - Configuration options
 *
 * @example
 * await selectRadixOption(page, "client-form-type-select", "Limited Company");
 */
export async function selectRadixOption(
  page: Page,
  triggerDataTestId: string,
  optionText: string,
  options?: {
    scrollIntoView?: boolean;
    timeout?: number;
  },
): Promise<void> {
  const { scrollIntoView = true, timeout = 10000 } = options || {};

  // Retry logic for handling detached elements
  let retries = 3;
  while (retries > 0) {
    try {
      // 1. Locate the trigger by data-testid
      const trigger = page.locator(`[data-testid="${triggerDataTestId}"]`);

      // 2. Wait for trigger to be attached and stable
      await trigger.waitFor({ state: "attached", timeout });
      await page.waitForTimeout(100); // Brief wait for React re-renders

      // 3. Scroll into view if needed (handles scrollable modals)
      if (scrollIntoView) {
        await trigger.scrollIntoViewIfNeeded();
      }

      // 4. Ensure trigger is visible and enabled
      await trigger.waitFor({ state: "visible", timeout });

      // 5. Blur any focused elements to prevent pointer interception
      // (Focused input fields can block clicks on other elements)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);

      // 6. Click the trigger to open dropdown with force if needed
      try {
        await trigger.click();
      } catch (error) {
        // If regular click fails, try with force
        await trigger.click({ force: true });
      }

      // 7. Wait for dropdown content to appear (renders in Portal at z-[100])
      await page.waitForSelector('[data-testid="select-content"]', {
        state: "visible",
        timeout: 5000,
      });

      // 8. Additional wait for animation to complete
      await page.waitForTimeout(200);

      // 9. Click the option by text
      const option = page.locator('[role="option"]').filter({ hasText: optionText });
      await option.waitFor({ state: "visible", timeout: 5000 });
      await option.click();

      // 10. Wait for dropdown to close
      await page.waitForSelector('[data-testid="select-content"]', {
        state: "hidden",
        timeout: 5000,
      });

      // Success - exit retry loop
      return;
    } catch (error: any) {
      retries--;
      if (retries === 0) {
        // If all retries exhausted, throw the error
        throw new Error(`Failed to select option "${optionText}" after 3 attempts: ${error.message}`);
      }
      // Wait before retry
      await page.waitForTimeout(500);
      console.log(`Retrying select interaction, ${retries} attempts remaining...`);
    }
  }
}

/**
 * Fill input field with proper focus and scroll handling
 *
 * @param page - Playwright page object
 * @param dataTestId - data-testid of the input element
 * @param value - Value to fill
 * @param options - Configuration options
 *
 * @example
 * await fillInputField(page, "client-form-name-input", "ABC Company Ltd");
 */
export async function fillInputField(
  page: Page,
  dataTestId: string,
  value: string,
  options?: { scrollIntoView?: boolean; timeout?: number },
): Promise<void> {
  const { scrollIntoView = true, timeout = 10000 } = options || {};

  const input = page.locator(`[data-testid="${dataTestId}"]`);

  if (scrollIntoView) {
    await input.scrollIntoViewIfNeeded();
  }

  await input.waitFor({ state: "visible", timeout });
  await input.clear();
  await input.fill(value);
}

/**
 * Click button with proper wait and scroll handling
 *
 * @param page - Playwright page object
 * @param selector - CSS selector or data-testid for the button
 * @param options - Configuration options
 *
 * @example
 * await clickButton(page, '[data-testid="client-wizard-next-button"]');
 * await clickButton(page, 'button:has-text("Save")');
 */
export async function clickButton(
  page: Page,
  selector: string,
  options?: { scrollIntoView?: boolean; timeout?: number },
): Promise<void> {
  const { scrollIntoView = true, timeout = 10000 } = options || {};

  const button = page.locator(selector);

  if (scrollIntoView) {
    await button.scrollIntoViewIfNeeded();
  }

  await button.waitFor({ state: "visible", timeout });
  await button.click();
}

/**
 * Fill textarea with proper focus handling
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for the textarea
 * @param value - Value to fill
 * @param options - Configuration options
 */
export async function fillTextarea(
  page: Page,
  selector: string,
  value: string,
  options?: { scrollIntoView?: boolean; blurAfter?: boolean },
): Promise<void> {
  const { scrollIntoView = true, blurAfter = false } = options || {};

  const textarea = page.locator(selector);

  if (scrollIntoView) {
    await textarea.scrollIntoViewIfNeeded();
  }

  await textarea.waitFor({ state: "visible", timeout: 10000 });
  await textarea.fill(value);

  if (blurAfter) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for dialog/modal to open
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 */
export async function waitForDialogOpen(
  page: Page,
  options?: { timeout?: number },
): Promise<void> {
  const { timeout = 10000 } = options || {};

  // Wait for any potential state updates to complete
  await page.waitForTimeout(100);

  // Wait for the dialog to be visible
  await page.waitForSelector('[role="dialog"]', { state: "visible", timeout });

  // Additional wait for animation to complete
  await page.waitForTimeout(300);
}

/**
 * Wait for dialog/modal to close
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 */
export async function waitForDialogClose(
  page: Page,
  options?: { timeout?: number },
): Promise<void> {
  const { timeout = 10000 } = options || {};
  await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout });
}
