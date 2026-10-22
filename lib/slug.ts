/** Converts text to a URL slug, e.g. "Drinkware & Mugs" -> "drinkware-mugs". */
export const toSlug = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
