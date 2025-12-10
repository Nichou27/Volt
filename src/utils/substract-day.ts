/**
 * Subtract one day from a given date string.
 *
 * Accepts a date in `DD/MM/YYYY` format, subtracts one day, and returns
 * the result in the same format. Uses the native `Date` object for
 * calendar arithmetic (handles month/year boundaries correctly).
 *
 * @param {string} date - Date string in `DD/MM/YYYY` format.
 * @returns {string} The previous day in `DD/MM/YYYY` format.
 * @throws {Error} If the date string does not contain day, month and year components.
 * @example
 * substractDay('01/02/2025') // => '31/01/2025'
 * substractDay('01/01/2025') // => '31/12/2024'
 */
export default function substractDay(date: string): string {
  const [day, month, year] = date.split("/").map(Number);
  if (!day || !month || !year) {
    throw new Error("Date must contain day, month and year");
  }
  const currentDate = new Date(year, month - 1, day);

  currentDate.setDate(currentDate.getDate() - 1);

  let lastDay = currentDate.getDate();
  let lastMonth = currentDate.getMonth() + 1; // Months are zero-based
  let lastYear = currentDate.getFullYear();

  const pad = (num: number): string => num.toString().padStart(2, "0");

  return `${pad(lastDay)}/${pad(lastMonth)}/${pad(lastYear)}`;
}
