import type { Locator, Page } from "playwright";

/**
 * This function re-enters a collection receipt by interacting with the provided Playwright page and tab locator.
 *
 * @param {Page} page - Playwright Page object representing the browser page.
 * @param  {Locator} tabLocator - Playwright Locator for the tab to be clicked.
 * @returns {Promise<void>} A Promise that resolves when the re-entry process is complete.
 */
export default async function reEnterReceipt(
  page: Page,
  tabLocator: Locator
): Promise<void> {
  await tabLocator.click();
  await page.waitForTimeout(2000);

  if (await page.locator("#cuadro_104000110_cuadro0_seleccion").isVisible()) {
    await page.locator("#cuadro_104000110_cuadro0_seleccion").click();
    await page.waitForLoadState("networkidle");
    await tabLocator.click();
  }

  return;
}
