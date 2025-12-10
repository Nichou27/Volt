import { readFileSync } from "fs";
import type { Transaction } from "../../domain/entities/transaction.ts";
import type { TransactionExcluderPort } from "../../domain/ports/transaction-excluder.ts";
import createTransactionKey from "../../utils/create-transaction-key.ts";

export const TransactionExcluderAdapter: TransactionExcluderPort = {
  exclude: async (transactions, jsonPath): Promise<Transaction[]> => {
    let transactionsToExclude: Transaction[] = [];
    try {
      const json = readFileSync(jsonPath, "utf-8");
      transactionsToExclude = JSON.parse(json) as Transaction[];
    } catch (error) {
      throw new Error(
        `Failed to read or parse JSON file at ${jsonPath}: ${error}`
      );
    }

    const exclusionSet = new Set<string>();
    for (const transaction of transactionsToExclude) {
      exclusionSet.add(createTransactionKey(transaction));
    }

    const filteredTransactions: Transaction[] = transactions.filter(
      (transaction) => {
        const key = createTransactionKey(transaction);
        return !exclusionSet.has(key) && transaction.type === "CREDIT";
      }
    );

    return filteredTransactions;
  },
};

export default TransactionExcluderAdapter;
