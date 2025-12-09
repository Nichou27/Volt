import type { Transaction } from "../entities/transaction.ts";

/**
 * Outbound port for executing Playwright-based automation using domain transactions.
 *
 * The application layer will call this port to perform UI automation (or any
 * external interaction) with the provided `Transaction` entities. Implementations
 * should encapsulate Playwright logic and error handling behind this interface.
 *
 * @interface PlaywrightPort
 */
export interface PlaywrightPort {
  /**
   * Run the automation flow for the given transactions.
   *
   * @param {Transaction[]} transactions - Array of transactions to process.
   * @returns {Promise<void>} Resolves when the automation completes.
   * @throws {Error} If the automation fails or an unrecoverable error occurs.
   */
  run: (transactions: Transaction[]) => Promise<void>;
}
