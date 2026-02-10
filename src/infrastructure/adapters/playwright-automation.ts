import { env } from "process";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";
import { chromium } from "playwright";
import groupTransactions from "../../utils/group-transactions.ts";
import parsePaymentReceipt from "../../utils/parse-payment-receipts.ts";
import parseDate from "../../utils/parse-date.ts";
import clickWithRetry from "../../utils/click-with-retry.ts";
import reEnterReceipt from "../../utils/re-enter-receipt.ts";

export const PlaywrightAutomationAdapter: PlaywrightPort = {
  run: async (transactions) => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const url = env.URL_MARIANO_MORENO;
    const administrationUrl = env.URL_MARIANO_MORENO_ADMINISTRACION;
    const receiptsUrl = env.URL_MARIANO_MORENO_RECIBOS_COBRO;

    if (!url || !administrationUrl || !receiptsUrl) {
      throw new Error(
        "One or many URL's are not defined in the environment variables"
      );
    }
    // Go to login page and fill in login form
    await page.goto(url);
    await page.fill("#ef_form_1000689_datosusuario", env.USER || "");
    await page.fill("#ef_form_1000689_datosclave", env.PASSWORD || "");
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
          exact: true
        })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await receiptTypeLocator.press("*");
      await page.locator(".dhx_combo_list").nth(3).getByText("CEPECC").click();

      const checkingAccountLocator = page
        .locator("#cont_ef_form_104000112_formularioid_cuenta_corriente")
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await checkingAccountLocator.press("*");
      await page
        .locator(".dhx_combo_list")
        .nth(2)
        .getByText("creditos")
        .click();

      await page.click("#ci_104000109_guardar");

      const auxiliaryLocator = page
        .getByRole("cell", { name: "Auxiliar", exact: true })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await auxiliaryLocator.press("*");
      const listLocator = page
        .locator(".dhx_combo_list")
        .nth(0)
        .getByText("creditos a regularizar");
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
          page.click("#cuadro_104000127_cuadro_cobros_agregar")
        ]);
        await popupPage.selectOption(
          "#ef_form_104000130_formulariocod_medio_pago",
          { value: "6" }
        );
        const bankingAccountLocator = popupPage
          .locator("#cont_ef_form_104000130_formularioid_cuenta_banco")
          .getByRole("textbox")
          .nth(0);
        await bankingAccountLocator.press("*");
        await popupPage.waitForLoadState("networkidle");
        await popupPage
          .locator(".dhx_combo_list")
          .nth(20)
          .getByText("cuenta central")
          .click();
        await popupPage.fill(
          "#ef_form_104000130_formularioimporte",
          transaction.amount.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        );
        await popupPage.click("#ci_104000129_aceptar");
        await popupPage.waitForEvent("close");
        await page.waitForLoadState("networkidle");
      }

      // Go to "Aplicaciones" tab and add the necessary payment receipts
      await page.click(
        "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_aplicaciones"
      );
      await page.waitForLoadState("networkidle");
      await page.click("#cuadro_104000120_cuadro_agregar");
      await page.selectOption(
        "#ef_form_104000121_formulario_aplicaciontipo_aplicacion",
        { value: "RPA" }
      );
      const paymentReceiptLocator = page
        .getByRole("cell", { name: "Recibo Pago", exact: true })
        .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
      await paymentReceiptLocator.press("*");

      // Wait for the dropdown options to load and parse them. Then filter by date.
      const optionsContainer = page.locator(".dhx_combo_list").nth(0);
      await optionsContainer.waitFor({ state: "visible" });
      const optionsLocator = optionsContainer.getByText("cuenta a cobrar");
      await optionsLocator.nth(0).waitFor({ state: "visible" });
      const options = await optionsLocator.all();

      let optionsText: string[] = [];
      for (const option of options) {
        const text = await option.innerText();
        optionsText.push(text.trim());
      }

      let availablePaymentReceipts = optionsText.map(parsePaymentReceipt);
      availablePaymentReceipts = availablePaymentReceipts.filter(
        (paymentReceipt) => {
          return paymentReceipt.date && paymentReceipt.date <= parseDate(date);
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

        await paymentReceiptLocator.press("*");
        await optionsContainer.getByText(paymentReceipt.fullText).click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        if (amountToUse < paymentReceipt.amount) {
          await page
            .locator("#ef_form_104000121_formulario_aplicacionimporte")
            .fill(
              amountToUse.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            );
        }

        await page.click("#ci_104000109_guardar");
        await page.waitForLoadState("networkidle");

        // Check ONE TIME ONLY if the payment receipt actually has the total amount.
        if (currentAmount === 0) {
          const paymentReceiptBalanceString = await page
            .locator(".ei-cuadro-fila")
            .nth(8)
            .innerText();

          if (paymentReceiptBalanceString === "") {
            throw new Error("Could not retrieve payment receipt balance");
          }

          const paymentReceiptBalance = Number(
            paymentReceiptBalanceString
              .replace(/\$/g, "")
              .replace(/\./g, "")
              .replace(",", ".")
              .trim()
          );

          if (paymentReceiptBalance < paymentReceipt.amount) {
            amountToUse = paymentReceiptBalance;
          }
        }

        currentAmount += amountToUse;
        currentAmount = Math.round(currentAmount * 100) / 100;

        await page.click("#cuadro_104000120_cuadro_agregar");
        await page.selectOption(
          "#ef_form_104000121_formulario_aplicaciontipo_aplicacion",
          { value: "RPA" }
        );
      }

      if (currentAmount < Math.round(totalAmount * 100) / 100) {
        // Could not cover the total amount with available receipts. Here we have to create another collection receipt
        const amountLeft = Math.round(totalAmount * 100) / 100 - currentAmount;
        await page.click(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_encabezado"
        );
        await page.waitForTimeout(1000);
        await page.click("#ci_104000109_cancelar");
        await page.waitForTimeout(1000);
        await page.click("#ci_104000109_agregar");
        await page.fill("#ef_form_104000112_formulariofecha_comprobante", date);
        const receiptTypeLocator = page
          .getByRole("cell", { name: "Tipo Recibo (*)", exact: true })
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await receiptTypeLocator.press("*");
        await page
          .locator(".dhx_combo_list")
          .nth(3)
          .getByText("CPIMCC")
          .click();

        const checkingAccountLocator = page
          .locator("#cont_ef_form_104000112_formularioid_cuenta_corriente")
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await checkingAccountLocator.press("*");
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
        await page.waitForLoadState("networkidle");

        // Go to "Forma de Cobro" tab and add the remaining amount
        const switchTabLocator = page.locator(
          "#ci_104000111_ci_recibo_cobro_edicion_cambiar_tab_pant_cobros"
        );
        await reEnterReceipt(page, switchTabLocator);

        const [popupPage] = await Promise.all([
          page.waitForEvent("popup"),
          page.click("#cuadro_104000127_cuadro_cobros_agregar")
        ]);
        await popupPage.selectOption(
          "#ef_form_104000130_formulariocod_medio_pago",
          { value: "25" }
        );
        await popupPage.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        const bankCheckingAccountLocator = popupPage
          .locator(
            "#cont_ef_form_104000130_formularioid_cuenta_corriente_hasta"
          )
          .getByRole("textbox")
          .nth(0);
        await bankCheckingAccountLocator.press("*");
        await popupPage.waitForLoadState("networkidle");
        await popupPage
          .locator(".dhx_combo_list")
          .nth(3)
          .getByText("creditos")
          .click();
        await page.waitForLoadState("networkidle");

        await popupPage.fill(
          "#ef_form_104000130_formularioimporte",
          amountLeft.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        );
        await popupPage.click("#ci_104000129_aceptar");
        await popupPage.waitForEvent("close");
        await page.waitForLoadState("networkidle");

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
        await page
          .locator(".dhx_combo_list")
          .nth(1)
          .getByText("otros ingresos")
          .click();
        await page.waitForLoadState("networkidle");

        const entityLocator = page
          .locator(
            "#nodo_156_ef_form_104000119_formulario_ml_imputacionesid_entidad"
          )
          .getByPlaceholder("Texto a filtrar o (*) para ver todo.");
        await entityLocator.press("*");
        await page.locator(".dhx_combo_list").nth(0).getByText("admin").click();
        const amountLocator = page
          .locator(
            "#nodo_156_ef_form_104000119_formulario_ml_imputacionesimporte"
          )
          .getByRole("textbox");
        await amountLocator.fill(
          amountLeft.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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
        await paymentReceiptLocator.press("*");

        // Wait for the dropdown options to load and parse them. Then filter by the amount created before
        await optionsContainer.waitFor({ state: "visible" });
        await optionsLocator.nth(0).waitFor({ state: "visible" });
        const receiptsLocator = await optionsLocator.all();

        let allReceipts: string[] = [];
        for (const receipt of receiptsLocator) {
          const text = await receipt.innerText();
          allReceipts.push(text.trim());
        }

        let createdReceipt = allReceipts.map(parsePaymentReceipt);
        createdReceipt = createdReceipt.filter((receipt) => {
          if (!receipt.date) {
            throw new Error("Date is undefined");
          }

          return (
            receipt.amount === amountLeft && receipt.date <= parseDate(date)
          );
        });

        if (!createdReceipt[0] || createdReceipt[0].fullText === "") {
          throw new Error("Could not find the created receipt");
        }

        await page
          .locator(".dhx_combo_list")
          .getByText(createdReceipt[0].fullText)
          .click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
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
        currentAmount = 0; // We need to reset currentAmount for the next date
        // Here ends the processing for that day's transactions. We can move to the next date.
      }
    }

    await browser.close();
  }
};

export default PlaywrightAutomationAdapter;
