import type { Transaction } from "../entities/transaction.ts";

/**
 * Outbound port for excluding/filtering transactions before further processing.
 *
 * Implementations receive a list of domain `Transaction` objects and return
 * a filtered list (for example removing duplicates, test entries, or
 * transactions that should not be processed by downstream adapters).
 *
 * @interface TransactionExcluderPort
 */
export interface TransactionExcluderPort {
  /**
   * Exclude or filter transactions according to the adapter's rules.
   *
   * @param {Transaction[]} transactions - Array of transactions to filter.
   * @param {string} jsonPath - Path to a JSON file containing transactions to exclude.
   * @returns {Promise<Transaction[]>} A promise that resolves with the filtered transactions.
   * @throws {Error} If the adapter cannot process the input data.
   */
  exclude: (
    transactions: Transaction[],
    jsonPath: string
  ) => Promise<Transaction[]>;
}
