import { writeFile } from "node:fs/promises";
import type { Transaction } from "../../domain/entities/transaction.ts";
import type { TransactionWriterPort } from "../../domain/ports/transaction-writer.ts";

export const TransactionWriterAdapter: TransactionWriterPort = {
  async write(transactions: Transaction[]): Promise<void> {
    const outputPath = "./data/transactions.txt";
    const data = JSON.stringify(transactions, null, 2);

    await writeFile(outputPath, data, "utf-8");
  },
};
