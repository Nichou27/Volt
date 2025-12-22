import { type Locator, type Page } from "playwright";

export default async function clickWithRetry(
  page: Page,
  triggerLocator: Locator,
  targetlocator: Locator
) {
  try {
    await targetlocator.click({ timeout: 3000 });
  } catch (error) {
    const popup = page.locator("#overlay_contenido");
    if (await popup.isVisible()) {
      await page.reload();
      await popup.waitFor({ state: "hidden" });
      await triggerLocator.press("*");
      await targetlocator.click();
    } else {
      throw error;
    }
  }
}
