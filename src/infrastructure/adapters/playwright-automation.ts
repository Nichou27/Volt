import { env } from "process";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";
import { chromium } from "playwright";
import groupTransactions from "../../utils/group-transactions.ts";
import substractDay from "../../utils/substract-day.ts";

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
    for (const [date, dayTransactions] of Object.entries(groupedTransactions)) {
      const lastDayDate = substractDay(date);
      const totalAmount = dayTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      await page.click("#ci_104000109_agregar");
      await page.fill("#ef_form_104000112_formulariofecha_comprobante", date);
      await page
        .getByLabel("Tipo Recibo (*)")
        .fill(
          "CEPECC - Cobro Extrapresupuestario de Pago Extrapresupuestario Cuenta a Cobrar"
        );
      await page
        .getByLabel("Cuenta Corriente (*)")
        .fill("6 Creditos a Regularizar Ejercicio 2025(id.1463)");
      await page.click("#ci_104000109_guardar");
      await page
        .getByLabel("Auxiliar")
        .fill("7.5.011 - Creditos a Regularizar Ejercicio 2025");
      await page.click("#ci_104000109_guardar");

      // Go to "Forma de Cobro" and input all transactions for that date
      await page.click(
        "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_cobros"
      );

      // Work with pop up event and fill in the form for each transaction
      for (const transaction of dayTransactions) {
        const [popupPage] = await Promise.all([
          page.waitForEvent("popup"),
          page.click("#cuadro_104000127_cuadro_cobros_agregar"),
        ]);
        await popupPage.selectOption(
          "#ef_form_104000130_formulariocod_medio_pago",
          { value: "6" }
        );
        await popupPage
          .getByLabel("Cuenta banco (*)")
          .fill("108936/01 - cuenta central");
        await popupPage.fill(
          "#ef_form_104000130_formularioimporte",
          String(transaction.amount)
        ); // Fill all transaction amounts
        await popupPage.click("#ci_104000129_aceptar");
      }

      // Go to "Aplicaciones" tab and add the necessary payment receipts
      await page.click(
        "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_aplicaciones"
      );
      await page.click("#cuadro_104000120_cuadro_agregar");
      await page.selectOption(
        "#ef_form_104000121_formulario_aplicaciontipo_aplicacion",
        { value: "RPA" }
      );
      await page.getByLabel("Recibo Pago").press("*");
    }

    await browser.close();
  },
};

export default PlaywrightAutomationAdapter;
