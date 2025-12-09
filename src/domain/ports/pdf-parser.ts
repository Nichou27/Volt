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
  /**
   * Parse a PDF file and extract transactions.
   *
   * @param {{ path: string }} options - Parsing options.
   * @param {string} options.path - Filesystem path to the PDF to parse.
   * @returns {Promise<Transaction[]>} Promise resolving to an array of parsed `Transaction` objects.
   * @throws {Error} When the adapter cannot read or parse the PDF file.
   */
  parse: (options: { path: string }) => Promise<Transaction[]>;
}
