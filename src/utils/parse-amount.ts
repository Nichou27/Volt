/**
 * Helper function to parse amount strings to JS numbers.
 * @param str - A string to convert to JS number
 * @returns A JS number or O if an error occurs.
 */
export default function parseAmount(str: string): number {
  if (!str) return 0;

  const cleanStr = str.replace(/\./g, "").replace(",", ".");
  const amount = parseFloat(cleanStr);

  return isNaN(amount) ? 0 : amount;
}
