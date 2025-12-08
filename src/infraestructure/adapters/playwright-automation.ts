import { env } from "process";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";
import { chromium } from "playwright";
import groupTransactions from "../../utils/group-transactions.ts";

export const PlaywrightAutomationAdapter: PlaywrightPort = {
  run: async (transactions) => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const url = env.URL_MARIANO_MORENO;
    const administrationUrl = env.URL_MARIANO_MORENO_ADMINISTRACION;
    const receiptsUrl = env.URL_MARIANO_MORENO_RECIBOS_COBRO;

    if (!url || !administrationUrl || !receiptsUrl) {
      throw new Error(
        "The one or many URL's are not defined in the environment variables"
      );
    }
    // Go to login page and fill in login form
    await page.goto(url);
    await page.fill("#ef_form_1000689_datosusuario", env.USER || "");
    await page.fill("#ef_form_1000689_datosclave", env.PASSWORD || "");
    await page.click("#form_1000689_datos_ingresar");

    // Go to Subsistemas > Administración
    await page.goto(administrationUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "playwright-test.png" });

    // Go to Recursos > Recibos Cobro and fill in the form to create a new "collection" receipt
    await page.goto(receiptsUrl);

    const groupedTransactions = groupTransactions(transactions);

    await browser.close();
  },
};
