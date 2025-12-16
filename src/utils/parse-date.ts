import normalizeDate from "./normalize-date.ts";

/**
 * Parse a date string to a JavaScript `Date` object.
 *
 * Accepts a date string in various formats (e.g., `"1/2/2025"`, `"01/02/2025"`),
 * normalizes it to `DD/MM/YYYY` using `normalizeDate`, then converts to a JS `Date`.
 * Note: the `Date` constructor uses 0-based months, so month is decremented by 1.
 *
 * @param {string} dateStr - Date string in `D/M/YYYY` or `DD/MM/YYYY` format.
 * @returns {Date} A JavaScript `Date` object.
 * @throws {Error} If the date string is empty or cannot be normalized/parsed.
 * @example
 * parseDate('1/2/2025') // => Date object for February 1, 2025
 * parseDate('25/12/2024') // => Date object for December 25, 2024
 */
export default function parseDate(dateStr: string): Date {
  if (!dateStr) {
    throw new Error("Date string is empty");
  }

  const normalizedDateStr = normalizeDate(dateStr);
  let [day, month, year] = normalizedDateStr.split("/");

  if (!day || !month || !year) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const numericDay = parseInt(day, 10);
  const numericMonth = parseInt(month, 10);
  const numericYear = parseInt(year, 10);

  return new Date(numericYear, numericMonth - 1, numericDay);
}
