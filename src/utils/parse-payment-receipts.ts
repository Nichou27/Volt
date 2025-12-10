/**
 * Parse a money string to a floating-point number.
 *
 * Accepts strings like `"$109,825.79"` and extracts the numeric value.
 * Removes the dollar sign and comma separators, then converts to `number`.
 *
 * @param {string} text - Money string (e.g., `"$1,234.56"`).
 * @returns {number | null} Parsed numeric value, or `null` if the string is falsy.
 */
function parseMoney(text: string): number | null {
  if (!text) return null;

  return parseFloat(text.replace("$", "").replace(/,/g, ""));
}

/**
 * Parse a date string in `DD/MM/YY` format to a JavaScript `Date` object.
 *
 * Converts the year by adding 2000 (assumes 21st century dates).
 * Month is adjusted from 1-based to 0-based for the `Date` constructor.
 *
 * @param {string} dateStr - Date string in `DD/MM/YY` format (e.g., `"25/12/24"`).
 * @returns {Date} A JavaScript `Date` object representing the parsed date.
 * @throws {Error} If the date string is malformed or components are not strings.
 * @example
 * parseDate('25/12/24') // => Date object for December 25, 2024
 */
function parseDate(dateStr: string): Date {
  let [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  if (
    typeof day !== "string" ||
    typeof month !== "string" ||
    typeof year !== "string"
  ) {
    throw new Error(`Invalid date components: ${dateStr}`);
  }

  const numericDay = parseInt(day, 10);
  const numericMonth = parseInt(month, 10);
  const numericYear = parseInt(year, 10);

  return new Date(numericYear + 2000, numericMonth - 1, numericDay);
}

/**
 * Extract and parse payment receipt data from a text line.
 *
 * Searches the input text for a date in `DD/MM/YY` format and a money
 * amount in `$X,XXX.XX` format. Returns both the extracted values and
 * the original text for reference.
 *
 * @param {string} optionText - Raw text line containing date and money data.
 * @returns {{ fullText: string; date: Date | null; amount: number | null }} Parsed receipt data.
 * @throws {Error} If the date or money patterns cannot be found in the text.
 * @example
 * parseOption("Payment receipt 25/12/24 Amount: $1,234.56")
 * // => { fullText: "...", date: Date, amount: 1234.56 }
 */
export default function parsePaymentReceipt(optionText: string): {
  fullText: string;
  date: Date | null;
  amount: number | null;
} {
  const dateMatch = optionText.match(/(\d{2}\/\d{2}\/\d{2})/);
  const moneyMatch = optionText.match(/\$([\d,]+\.\d{2})/);

  if (!dateMatch || !moneyMatch) {
    throw new Error(`Failed to parse option text: ${optionText}`);
  }
  if (typeof dateMatch[1] !== "string" || typeof moneyMatch[1] !== "string") {
    throw new Error(`Invalid match groups in option text: ${optionText}`);
  }

  return {
    fullText: optionText,
    date: dateMatch ? parseDate(dateMatch[1]) : null,
    amount: moneyMatch ? parseMoney(moneyMatch[1]) : null,
  };
}
