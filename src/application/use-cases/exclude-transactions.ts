import type { Transaction } from "../../domain/entities/transaction.ts";
import type { TransactionExcluderPort } from "../../domain/ports/transaction-excluder.ts";

export default function excludeTransactionsUseCase(
  transactionExcluderPort: TransactionExcluderPort,
  transactions: Transaction[],
  jsonPath: string
) {
  return transactionExcluderPort.exclude(transactions, jsonPath);
}
