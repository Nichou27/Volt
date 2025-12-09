import "dotenv/config";
import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infraestructure/adapters/pdf-parser.ts";
import { PlaywrightAutomationAdapter } from "./infraestructure/adapters/playwright-automation.ts";
import runPlaywrightAutomationUseCase from "./application/use-cases/run-playwright-automation.ts";
import excludeTransactionsUseCase from "./application/use-cases/exclude-transactions.ts";
import { TransactionExcluderAdapter } from "./infraestructure/adapters/transaction-excluder.ts";

export default async function main() {
  // Gets PDF and parses transactions
  const transactions = await parseTransactionsUseCase(
    { PDFParser: PDFParserAdapter },
    "./data/Marzo.pdf"
  );

  // Takes parsed transactions and excludes those present in the JSON file
  const filteredTransactions = await excludeTransactionsUseCase(
    TransactionExcluderAdapter,
    transactions,
    "./data/loaded-transactions.json"
  );

  // Runs Playwright automation with the filtered transactions to prevent duplicates
  //await runPlaywrightAutomationUseCase(PlaywrightAutomationAdapter, transactions);

  console.table(transactions);
  console.table(filteredTransactions);
}

main();
