import type { Transaction } from "../entities/transaction.ts";

/**
 * Outbound port for parsing PDF bank statements into domain `Transaction` objects.
 *
 * The application layer depends on this port; concrete adapters implement
 * the `parse` method to read a PDF from the filesystem (or other source)
 * and produce an array of `Transaction` entities.
 *
 * @interface PDFParserPort
 */
export interface PDFParserPort {
  parse: (options: { path: string }) => Promise<Transaction[]>;
}
