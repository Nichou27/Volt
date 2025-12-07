/**
 * A bank transaction parsed from a statement PDF.
 *
 * @property {string} date - Operation date in `DD/MM/YYYY` format.
 * @property {string} description - Human readable description of the operation.
 * @property {string} code - Optional reference or operation code (may be empty).
 * @property {number} amount - The operation amount (positive value for the operation itself).
 * @property {"DEBIT"|"CREDIT"|"UNKNOWN"} type - Operation type inferred from balance changes.
 * @property {number} balance - Account balance after the operation.
 */
export interface Transaction {
  date: string;
  description: string;
  code: string;
  amount: number;
  type: "DEBIT" | "CREDIT" | "UNKNOWN";
  balance: number;
}
