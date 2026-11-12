/**
 * Suggested alt text from a file name: the extension is removed and every
 * run of characters other than letters and digits becomes one space,
 * e.g. "Hero_jewelry-store.jpeg" -> "Hero jewelry store".
 */
export function altFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
