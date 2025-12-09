import type { Transaction } from "../domain/entities/transaction.ts";
import normalizeDate from "./normalize-date.ts";

/**
 * Create a lightweight, deterministic key for a transaction.
 *
 * The key is a simple concatenation of `date`, `description` and
 * `amount` separated by `|`. It's intended for use in lookups or
 * deduplication (e.g. building a Set of already-seen transactions).
 *
 * NOTE: The `date` is normalized using `normalizeDate` to ensure
 * consistent formatting.
 *
 * @param {Transaction} transaction - The domain transaction to produce a key for.
 * @returns {string} Deterministic key in the form `date|description|amount`.
 */
export default function createTransactionKey(transaction: Transaction): string {
  const normalizedDate = normalizeDate(transaction.date);
  return `${normalizedDate}|${transaction.description}|${transaction.amount}`;
}
