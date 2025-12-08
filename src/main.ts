import "dotenv/config";
import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infraestructure/adapters/pdf-parser.ts";
import { PlaywrightAutomationAdapter } from "./infraestructure/adapters/playwright-automation.ts";

export default async function main() {
  const transactions = await parseTransactionsUseCase(
    { PDFParser: PDFParserAdapter },
    "./data/Febrero.pdf"
  );

  await PlaywrightAutomationAdapter.run(transactions);

  console.table(transactions);
}

main();
