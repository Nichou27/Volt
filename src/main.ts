import "dotenv/config";
import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infraestructure/adapters/pdf-parser.ts";
import { PlaywrightAutomationAdapter } from "./infraestructure/adapters/playwright-automation.ts";
import runPlaywrightAutomation from "./application/use-cases/run-playwright-automation.ts";

export default async function main() {
  const transactions = await parseTransactionsUseCase(
    { PDFParser: PDFParserAdapter },
    "./data/Marzo.pdf"
  );

  //await runPlaywrightAutomation(PlaywrightAutomationAdapter, transactions);

  console.table(transactions);
}

main();
