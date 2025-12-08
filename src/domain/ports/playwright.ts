import type { Transaction } from "../entities/transaction.ts";

/**
 * Outbound port for running Playwright-driven automation using parsed transactions.
 *
 * Implementations should perform any UI automation or external interactions
 * (for example, filling web forms) using the provided domain `Transaction`
 * entities. The application layer calls this port and depends only on the
 * abstraction, not on concrete Playwright code.
 *
 * @interface PlaywrightPort
 */
export interface PlaywrightPort {
  run: (transactions: Transaction[]) => Promise<void>;
}
