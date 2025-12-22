import { env } from "process";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";
import { chromium } from "playwright";
import groupTransactions from "../../utils/group-transactions.ts";
import parsePaymentReceipt from "../../utils/parse-payment-receipts.ts";
import parseDate from "../../utils/parse-date.ts";
import clickWithRetry from "../../utils/click-with-retry.ts";

export const PlaywrightAutomationAdapter: PlaywrightPort = {
  run: async (transactions) => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const url = env.URL_DEMO;
    const administrationUrl = env.URL_DEMO_ADMINISTRACION;
    const receiptsUrl = env.URL_DEMO_RECIBOS_COBRO;

    if (!url || !administrationUrl || !receiptsUrl) {
      throw new Error(
        "One or many URL's are not defined in the environment variables"
      );
    }
    // Go to login page and fill in login form
    await page.goto(url);
    await page.fill("#ef_form_1000689_datosusuario", env.TEST_USER || "");
    await page.fill("#ef_form_1000689_datosclave", env.TEST_PASSWORD || "");
    await page.click("#form_1000689_datos_ingresar");

    // Go to Subsistemas > Administración
    await page.goto(administrationUrl);

    // Go to Recursos > Recibos Cobro and fill in the form to create a new "collection" receipt
    await page.goto(receiptsUrl);

    const groupedTransactions = groupTransactions(transactions);
    for (const [date, dayTransactions] of Object.entries(groupedTransactions)) {
      await page.click("#ci_104000109_agregar");
      await page.fill("#ef_form_104000112_formulariofecha_comprobante", date);
      const receiptTypeLocator = page
        .getByRole("cell", {
          name: "Tipo Recibo (*)",
          exact: true,
        })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await receiptTypeLocator.press("*");
      await page.locator(".dhx_combo_list").nth(3).getByText("CECC").click(); // Cambiar a CEPECC

      const checkingAccountLocator = page
        .locator("#cont_ef_form_104000112_formularioid_cuenta_corriente")
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await checkingAccountLocator.press("*");
      await page
        .locator(".dhx_combo_list")
        .nth(2)
        .getByText("recaudador nacho") // Cambiar a "creditos"
        .click();

      await page.click("#ci_104000109_guardar");

      const auxiliaryLocator = page
        .getByRole("cell", { name: "Auxiliar", exact: true })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await auxiliaryLocator.press("*");
      // TODO: JSError in toba website appears here. I should think of a global solution
      const listLocator = page
        .locator(".dhx_combo_list")
        .nth(0)
        .getByText("amortizaciones"); // Cambiar a "creditos a regularizar"
      await clickWithRetry(page, auxiliaryLocator, listLocator);

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
        const bankingAccountLocator = popupPage // En el demo, esta linea no funciona
          .locator("#cont_ef_form_104000130_formularioid_cuenta_banco")
          .getByRole("textbox")
          .nth(0);
        await bankingAccountLocator.press("*");
        await popupPage
          .locator(".dhx_combo_list")
          .nth(20)
          .getByText("banco intervan") // cambiar a "cuenta central"
          .click();
        await popupPage.fill(
          "#ef_form_104000130_formularioimporte",
          transaction.amount.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
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
      await page
        .getByRole("cell", { name: "Recibo Pago", exact: true })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.")
        .press("*");

      // Wait for the dropdown options to load and parse them. Then filter by date.
      const optionsLocator = page.locator(".dhx_combo_list").nth(0);
      const optionsText = await optionsLocator.allInnerTexts();

      let availablePaymentReceipts = optionsText.map(parsePaymentReceipt);

      availablePaymentReceipts = availablePaymentReceipts.filter(
        (paymentReceipt) => {
          paymentReceipt.date && paymentReceipt.date <= parseDate(date);
        }
      );
      availablePaymentReceipts.sort((a, b) => {
        if (a.date && b.date) {
          return a.date.getTime() - b.date.getTime();
        } else {
          return 0;
        }
      });

      // Now select payment receipts until the total amount is covered
      const totalAmount = dayTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
      let currentAmount = 0;
      for (const paymentReceipt of availablePaymentReceipts) {
        if (!paymentReceipt.amount || !paymentReceipt.date) continue;
        if (currentAmount >= totalAmount) break;

        const remainingAmount = totalAmount - currentAmount;
        let amountToUse = 0;

        if (paymentReceipt.amount <= remainingAmount) {
          amountToUse = paymentReceipt.amount;
        } else {
          amountToUse = remainingAmount;
        }

        await optionsLocator.click();
        await optionsLocator.fill(paymentReceipt.fullText);
        await page.keyboard.press("Enter");

        if (amountToUse < paymentReceipt.amount) {
          await page
            .locator("#ef_form_104000121_formulario_aplicacionimporte")
            .fill(
              amountToUse.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
        }

        await page.click("#ci_104000109_guardar");

        currentAmount += amountToUse;
        currentAmount = Math.round(currentAmount * 100) / 100;
      }

      if (currentAmount < totalAmount) {
        // Could not cover the total amount with available receipts. Here we have to create another collection receipt
        const amountLeft = totalAmount - currentAmount;
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_encabezado"
        );
        await page.click("#ci_104000109_cancelar");
        await page.click("#ci_104000109_agregar");
        await page.fill("#ef_form_104000112_formulariofecha_comprobante", date);
        const receiptTypeLocator = page
          .getByLabel("Tipo Recibo (*)")
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await receiptTypeLocator.press("*");
        await receiptTypeLocator.pressSequentially("CPIMCC");
        await page
          .locator(".dhx_combo_list")
          .nth(3)
          .getByText("CPIMCC")
          .click();

        const checkingAccountLocator = page
          .getByRole("cell", { name: "Cuenta Corriente (*)", exact: true })
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await checkingAccountLocator.press("*");
        await checkingAccountLocator.pressSequentially("contribuyentes");
        await page
          .locator(".dhx_combo_list")
          .nth(2)
          .getByText("contribuyentes")
          .click();
        await page.fill(
          "#ef_form_104000112_formularioobservaciones",
          `Saldo caja ${date}`
        );

        await page.click("#ci_104000109_guardar");

        // Go to "Forma de Cobro" tab and add the remaining amount
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_cobros"
        );
        const [popupPage] = await Promise.all([
          page.waitForEvent("popup"),
          page.click("#cuadro_104000127_cuadro_cobros_agregar"),
        ]);
        await popupPage.selectOption(
          "#ef_form_104000130_formulariocod_medio_pago",
          { value: "25" }
        );
        const bankCheckingAccountLocator = popupPage
          .getByRole("cell", {
            name: "Cuenta corriente hasta (*)",
            exact: true,
          })
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await bankCheckingAccountLocator.press("*");
        await bankCheckingAccountLocator.pressSequentially("creditos");
        await page
          .locator(".dhx_combo_list")
          .nth(3)
          .getByText("creditos")
          .click();

        await popupPage.fill(
          "#ef_form_104000130_formularioimporte",
          amountLeft.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
        await popupPage.click("#ci_104000129_aceptar");

        // Go to "Imputaciones" tab and fill in the necessary data
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_imputaciones"
        );
        await page.click(
          "#js_form_104000119_formulario_ml_imputaciones_agregar"
        );
        const resourceLocator = page
          .locator(
            "#nodo_156_ef_form_104000119_formulario_ml_imputacionescod_recurso"
          )
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await resourceLocator.press("*");
        await resourceLocator.pressSequentially("otros ingresos");
        await page
          .locator(".dhx_combo_list")
          .nth(1)
          .getByText("otros ingresos")
          .click();

        const entityLocator = page
          .locator(
            "#nodo_156_ef_form_104000119_formulario_ml_imputacionesid_entidad"
          )
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await entityLocator.press("*");
        await entityLocator.pressSequentially("administracion");
        await page
          .locator(".dhx_combo_list")
          .nth(0)
          .getByText("administracion")
          .click();

        await page.fill(
          "#156_ef_form_104000119_formulario_ml_imputacionesimporte",
          amountLeft.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );

        await page.click("#ci_104000109_guardar");

        //Confirm the receipt
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_encabezado"
        );
        await page.click("#ci_104000111_ci_recibo_cobro_edicion_confirmar");

        // Go back to the first receipt to complete with the amount that we have created
        await page.click("#ci_104000109_cancelar");
        await page.click("#cuadro_104000110_cuadro1_seleccion");
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_aplicaciones"
        );
        await page.click("#cuadro_104000120_cuadro_agregar");
        await page.selectOption(
          "#ef_form_104000121_formulario_aplicaciontipo_aplicacion",
          { value: "RPA" }
        );
        await page
          .getByRole("cell", { name: "Recibo Pago" })
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.")
          .press("*");

        // Wait for the dropdown options to load and parse them. Then filter by the amount created before
        const receipts = optionsLocator.allInnerTexts();
        let createdReceipt = (await receipts).map(parsePaymentReceipt);
        createdReceipt = createdReceipt.filter((receipt) => {
          return (
            receipt.amount === amountLeft && receipt.date === parseDate(date)
          );
        });

        await page
          .locator(".dhx_combo_list")
          .nth(0)
          .getByText(createdReceipt[0]?.fullText || "")
          .click();

        await page.click("#ci_104000109_guardar");

        // Now we can confirm the first receipt
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_encabezado"
        );
        await page.click("#ci_104000111_ci_recibo_cobro_edicion_confirmar");
        await page.click("#ci_104000109_cancelar");
      } else {
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_encabezado"
        );
        await page.click("#ci_104000111_ci_recibo_cobro_edicion_confirmar");
        await page.click("#ci_104000109_cancelar");
        // Here ends the processing for that day's transactions. We can move to the next date.
      }
    }

    await browser.close();
  },
};

export default PlaywrightAutomationAdapter;
