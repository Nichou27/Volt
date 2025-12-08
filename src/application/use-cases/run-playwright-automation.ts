import type { Transaction } from "../../domain/entities/transaction.ts";
import type { PlaywrightPort } from "../../domain/ports/playwright.ts";

export default function runPlaywrightAutomation(
  playwrightPort: PlaywrightPort,
  transactions: Transaction[]
) {
  return playwrightPort.run(transactions);
}
