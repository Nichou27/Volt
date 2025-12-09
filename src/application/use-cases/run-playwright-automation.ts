import type { Transaction } from "../../domain/entities/transaction.ts";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";

/**
 * Application use-case that delegates execution of Playwright automation.
 *
 * This function lives in the application layer and calls the provided
 * `PlaywrightPort` implementation to process an array of domain
 * `Transaction` objects. It keeps the application code independent from
 * concrete Playwright implementation details.
 *
 * @param {PlaywrightPort} playwrightPort - Adapter implementing the Playwright port.
 * @param {Transaction[]} transactions - Array of domain transactions to process.
 * @returns {Promise<void>} The promise returned by the port's `run` method.
 */
export default function runPlaywrightAutomationUseCase(
  playwrightPort: PlaywrightPort,
  transactions: Transaction[]
): Promise<void> {
  return playwrightPort.run(transactions);
}
