/** Longest phone accepted: 10-digit number plus a 5-digit extension. */
export const PHONE_MAX_DIGITS = 15;

/**
 * Formats digits as `(xxx) xxx-xxxx`, adding ` ext:xxxxx` past ten digits.
 * Separators appear only once the next digit is typed, so backspace works.
 */
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  const number = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  return d.length <= 10 ? number : `${number} ext:${d.slice(10)}`;
}
