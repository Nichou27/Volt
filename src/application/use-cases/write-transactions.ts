import type { Transaction } from "../../domain/entities/transaction.ts";
import type { TransactionWriterPort } from "../../domain/ports/transaction-writer.ts";

export default function writeTransactionsUseCase(
  transactionWriterAdapter: TransactionWriterPort,
  transactions: Transaction[]
) {
  return transactionWriterAdapter.write(transactions);
}
