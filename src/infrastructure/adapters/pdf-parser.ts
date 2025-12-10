import { PDFParse } from "pdf-parse";
import fs from "fs";
import parseAmount from "../../utils/parse-amount.ts";
import type { PDFParserPort } from "../../domain/ports/pdf-parser.ts";
import type { Transaction } from "../../domain/entities/transaction.ts";

/**
 * Adapter implementing the `PDFParserPort` outbound port.
 *
 * Responsibilities:
 * - Read a PDF file from the filesystem at `path`.
 * - Use the `pdf-parse` library to extract text.
 * - Filter and parse lines into `Transaction` objects.
 *
 * Behavior/Errors:
 * - Throws when the `path` is invalid or the file cannot be read.
 * - Throws when the PDF parser cannot be instantiated.
 * - Skips lines that do not match the expected transaction pattern and logs warnings for malformed currency values.
 *
 * @type {PDFParserPort}
 */
export const PDFParserAdapter: PDFParserPort = {
  parse: async ({ path }) => {
    if (!path) {
      throw new Error("Invalid path");
    }

    let buffer: Buffer;
    try {
      buffer = fs.readFileSync(path);
    } catch (error) {
      throw new Error(`Error reading file: ${error}`);
    }

    let parser;
    try {
      parser = new PDFParse(new Uint8Array(buffer));
    } catch (error) {
      throw new Error(`Failed to parse the PDF file: ${error}`);
    }

    const data = await parser.getText();
    const text = data.text;

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => {
        if (line.length === 0) return false;
        if (line.includes("SALDO ANTERIOR")) return false;
        if (line.includes("FECHA DESCRIPCION")) return false;
        if (line.includes("TOTALES")) return false;

        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
        if (!line.match(datePattern)) return false;

        return true;
      });

    const transactions: Transaction[] = [];

    const regex =
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s*([0-9]{1,3}(?:\.[0-9]{3})*,\d{2})\s*([0-9]{1,3}(?:\.[0-9]{3})*,\d{2})$/;

    for (const line of lines) {
      const match = regex.exec(line);
      if (!match) continue;

      const date = match[1] || "";
      const fullDescription = match[2]?.trim() || "";
      const operationAmount = parseAmount(match[3] || "");
      const currentAmount = parseAmount(match[4] || "");

      if (isNaN(operationAmount) || isNaN(currentAmount)) {
        console.warn(`Skipping line: invalid currency format → ${line}`);
        continue;
      }

      let description = fullDescription;
      let code = "";

      const codeMatch = fullDescription.match(/^(.*?)\s+(\d+)$/);
      if (codeMatch) {
        description = codeMatch[1] || "";
        code = codeMatch[2] || "";
      }

      let type: Transaction["type"] = "UNKNOWN";

      if (transactions.length === 0) {
        type = "CREDIT";
      } else {
        const previousAmount = transactions.at(-1)?.balance || 0;
        const difference = parseFloat(
          (currentAmount - previousAmount).toFixed(2)
        );

        if (Math.abs(difference) !== operationAmount) {
          console.warn(`[WARNING] Math mismatch on line: ${line}`);
        }

        type = difference > 0 ? "CREDIT" : "DEBIT";
      }

      transactions.push({
        date,
        description,
        code,
        amount: operationAmount,
        type,
        balance: currentAmount,
      });
    }

    return transactions;
  },
};

export default PDFParserAdapter;
