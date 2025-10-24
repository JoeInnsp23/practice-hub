/**
 * Radix UI Interaction Helpers
 *
 * Playwright helpers for interacting with Radix UI components reliably.
 * These functions handle common patterns like portal rendering, scrolling,
 * and focus management that cause brittleness in E2E tests.
 */

import type { Page } from "@playwright/test";

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
  const { scrollIntoView = true, timeout = 30000 } = options || {}; // Increased for Turbopack

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

        // Wait for scroll animation to complete
        await page.waitForTimeout(300);

        // Verify element is actually in viewport
        const isInViewport = await trigger.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );
        });

        // If not in viewport, manually scroll within parent scroll container
        if (!isInViewport) {
          await trigger.evaluate((el) => {
            // Find the nearest scrollable parent (modal content area)
            const scrollContainer = el.closest(".overflow-y-auto");
            if (scrollContainer) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              // Fallback to regular scroll if no overflow container found
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          // Wait for smooth scroll to complete
          await page.waitForTimeout(400);
        }
      }

      // 4. Ensure trigger is visible and enabled
      await trigger.waitFor({ state: "visible", timeout });

      // 5. Click the trigger to open dropdown with force if needed
      // (Playwright's actionability checks handle focus automatically)
      try {
        await trigger.click();
      } catch (_error) {
        // If regular click fails, try with force
        await trigger.click({ force: true });
      }

      // 6. Wait for dropdown content to appear (renders in Portal at z-[100])
      await page.waitForSelector('[data-testid="select-content"]', {
        state: "visible",
        timeout: 5000,
      });

      // 7. Additional wait for animation to complete
      await page.waitForTimeout(200);

      // 8. Click the option by exact text match (avoid partial matches like "Active" in "Inactive")
      const option = page.getByRole("option", {
        name: optionText,
        exact: true,
      });
      await option.waitFor({ state: "visible", timeout: 5000 });

      // Scroll option into view if needed (for long dropdowns)
      await option.scrollIntoViewIfNeeded();

      await option.click();

      // 9. Wait for dropdown to close
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
        throw new Error(
          `Failed to select option "${optionText}" after 3 attempts: ${error.message}`,
        );
      }
      // Wait before retry
      await page.waitForTimeout(500);
      console.log(
        `Retrying select interaction, ${retries} attempts remaining...`,
      );
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
  const { scrollIntoView = true, timeout = 30000 } = options || {}; // Increased for Turbopack

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
  const { scrollIntoView = true, timeout = 30000 } = options || {};

  const button = page.locator(selector);

  // Wait for button to be attached to DOM
  await button.waitFor({ state: "attached", timeout });

  if (scrollIntoView) {
    await button.scrollIntoViewIfNeeded();
  }

  // Wait for button to be visible (Playwright's built-in actionability checks)
  await button.waitFor({ state: "visible", timeout });

  // Playwright automatically checks for actionability (enabled, not obscured, etc.)
  // Just click with a reasonable timeout
  await button.click({ timeout: 10000 });
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
  options?: { timeout?: number; selector?: string },
): Promise<void> {
  const { timeout = 90000, selector } = options || {}; // generous by default

  // First, ensure DOM is ready
  await page.waitForLoadState("domcontentloaded");

  // Robust wait: support Radix Content in portal with either role or data-testid
  const candidates = selector
    ? [
        selector,
        `${selector}[data-state="open"]`,
        `${selector} [data-state="open"]`,
      ]
    : [
        '[role="dialog"][data-state="open"]',
        '[data-testid="dialog-content"][data-state="open"]',
        '[data-slot="dialog-content"][data-state="open"]',
        '[role="dialog"]',
        '[data-testid="dialog-content"]',
      ];

  // Wait until any candidate is visible
  await page.waitForFunction(
    (sels) => {
      for (const sel of sels as string[]) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) continue;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const visible =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight;
        if (visible) return true;
      }
      return false;
    },
    candidates,
    { timeout },
  );

  // Extra settle time for entrance animations
  await page.waitForTimeout(200);
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
  const { timeout = 30000 } = options || {}; // Increased for Turbopack
  await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout });
}
