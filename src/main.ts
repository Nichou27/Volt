import "dotenv/config";
import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infrastructure/adapters/pdf-parser.ts";
import { PlaywrightAutomationAdapter } from "./infrastructure/adapters/playwright-automation.ts";
import runPlaywrightAutomationUseCase from "./application/use-cases/run-playwright-automation.ts";
import excludeTransactionsUseCase from "./application/use-cases/exclude-transactions.ts";
import { TransactionExcluderAdapter } from "./infrastructure/adapters/transaction-excluder.ts";
import writeTransactionsUseCase from "./application/use-cases/write-transactions.ts";
import { TransactionWriterAdapter } from "./infrastructure/adapters/transaction-writer.ts";

export default async function main() {
  // Gets PDF and parses transactions
  const transactions = await parseTransactionsUseCase(
    { PDFParser: PDFParserAdapter },
    "./data/Agosto.pdf"
  );

  // Takes parsed transactions and excludes those present in the JSON file
  const filteredTransactions = await excludeTransactionsUseCase(
    TransactionExcluderAdapter,
    transactions,
    "./data/loaded-transactions.json"
  );

  writeTransactionsUseCase(TransactionWriterAdapter, filteredTransactions);

  // Runs Playwright automation with the filtered transactions to prevent duplicates
  await runPlaywrightAutomationUseCase(
    PlaywrightAutomationAdapter,
    filteredTransactions
  );
}

main();
