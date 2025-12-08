/**
 * Normalize a date string to `DD/MM/YYYY`.
 *
 * Accepts a date in the form `D/M/YYYY`, `DD/MM/YYYY`, etc., and returns
 * a zero-padded `DD/MM/YYYY` string. Throws when the input is falsy or
 * when the provided string cannot be parsed into day/month/year.
 *
 * @param {string} date - Date string to normalize (expected using `/` separators).
 * @returns {string} Normalized date in `DD/MM/YYYY` format.
 * @throws {Error} If `date` is falsy or cannot be parsed into three components.
 * @example
 * normalizeDate('1/2/2025') // => '01/02/2025'
 */
export default function normalizeDate(date: string): string {
  if (!date) {
    throw new Error("Invalid date");
  }

  try {
    const [day, month, year] = date.split("/");
    if (!day || !month || !year) {
      throw new Error("Date must contain day, month and year");
    }

    const normalizedDate = `${day.padStart(2, "0")}/${month.padStart(
      2,
      "0"
    )}/${year}`;

    return normalizedDate;
  } catch (error) {
    throw new Error(`Error normalizing date: ${error}`);
  }
}
