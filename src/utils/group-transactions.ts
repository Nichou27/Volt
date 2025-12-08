import type { Transaction } from "../domain/entities/transaction.ts";
import normalizeDate from "./normalize-date.ts";

/**
 * Group an array of `Transaction` objects by their normalized date.
 *
 * Each transaction's `date` is normalized using `normalizeDate` to
 * `DD/MM/YYYY` and used as the grouping key. The function returns an
 * object mapping normalized date strings to arrays of transactions for
 * that date.
 *
 * @param {Transaction[]} transactions - Array of domain `Transaction` objects to group.
 * @returns {Record<string, Transaction[]>} A mapping of normalized date -> transactions.
 * @throws {Error} If `normalizeDate` throws for invalid date strings.
 * @example
 * const groups = groupTransactions([{ date: '1/2/2025', description: 'x', code: '', amount: 10, type: 'DEBIT', balance: 100 }]);
 * // groups => { '01/02/2025': [ { ... } ] }
 */
export default function groupTransactions(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const transactionGroups: Record<string, Transaction[]> = {};

  for (const transaction of transactions) {
    const normalizedDate = normalizeDate(transaction.date);
    const key = normalizedDate;

    if (!transactionGroups[key]) {
      transactionGroups[key] = [];
    }
    transactionGroups[key].push(transaction);
  }

  return transactionGroups;
}
