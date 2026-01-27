import type { Transaction } from "../entities/transaction.ts";

export interface TransactionWriterPort {
  write: (transactions: Transaction[]) => void;
}
