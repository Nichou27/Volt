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
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 25000.0,
      type: "CREDIT",
      balance: 386208762.98,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 146789.83,
      type: "CREDIT",
      balance: 386355552.81,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 35000.0,
      type: "CREDIT",
      balance: 386390552.81,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 2500.0,
      type: "CREDIT",
      balance: 386393052.81,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 2400.0,
      type: "CREDIT",
      balance: 386395452.81,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 3945.93,
      type: "CREDIT",
      balance: 386399398.74,
    },
    {
      date: "18/3/2025",
      description: "CREDITO DEBIN",
      code: "",
      amount: 8373.0,
      type: "CREDIT",
      balance: 386407771.74,
    },
    {
      date: "18/3/2025",
      description: "CAUT TRANSF. INTERBANCARIA",
      code: "",
      amount: 35000.0,
      type: "CREDIT",
      balance: 386442771.74,
    },
  ]);

  console.table(transactions);
  console.table(filteredTransactions);
}

main();
