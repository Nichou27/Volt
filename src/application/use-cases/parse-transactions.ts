import type { Transaction } from "../../domain/entities/transaction.ts";
import type { PDFParserPort } from "../../domain/ports/pdf-parser.ts";

/**
 * Application use-case: parse transactions from a PDF file.
 *
 * This function lives in the application layer and orchestrates the work
 * of parsing a bank statement PDF by delegating to the injected
 * `PDFParser` port (adapter). In hexagonal / ports-and-adapters
 * architecture this is an example of an interactor/use-case that is
 * independent from infrastructure and works through abstract ports.
 *
 * @param {{ PDFParser: PDFParserPort }} dependencies - Dependencies object containing a `PDFParser` implementation (port).
 * @param {string} path - Filesystem path to the PDF file to parse.
 * @returns {Promise<Transaction[]>} Promise resolving to the parsed transactions returned by the parser adapter.
 */
export async function parseTransactionsUseCase(
  dependencies: { PDFParser: PDFParserPort },
  path: string
): Promise<Transaction[]> {
  return dependencies.PDFParser.parse({ path });
}
