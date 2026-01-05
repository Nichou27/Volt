import "dotenv/config";
import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infrastructure/adapters/pdf-parser.ts";
import { PlaywrightAutomationAdapter } from "./infrastructure/adapters/playwright-automation.ts";
import runPlaywrightAutomationUseCase from "./application/use-cases/run-playwright-automation.ts";
import excludeTransactionsUseCase from "./application/use-cases/exclude-transactions.ts";
import { TransactionExcluderAdapter } from "./infrastructure/adapters/transaction-excluder.ts";

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
  await runPlaywrightAutomationUseCase(PlaywrightAutomationAdapter, [
    {
      date: "1/9/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 1000.0,
      type: "CREDIT",
      balance: 386208762.98,
    },
    {
      date: "1/9/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 2000.0,
      type: "CREDIT",
      balance: 386208762.98,
    },
    {
      date: "1/9/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 3000.0,
      type: "CREDIT",
      balance: 386208762.98,
    },
  ]);
}

main();
