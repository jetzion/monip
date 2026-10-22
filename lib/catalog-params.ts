export type CatalogParams = { q: string; category: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_QUERY = 100;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Normalizes catalog URL params; invalid values are dropped, not errors. */
export function parseCatalogParams(
  params: Record<string, string | string[] | undefined>,
): CatalogParams {
  // % and _ are SQL LIKE wildcards; strip them so they match literally nothing.
  const q = first(params.q)
    .replace(/[%_\\]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_QUERY);
  const category = first(params.category).trim().toLowerCase();
  return { q, category: SLUG.test(category) ? category : "" };
}

/** Builds a /products URL from params, omitting empty values. */
export function catalogHref(params: Partial<CatalogParams>): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  const query = search.toString();
  return query ? `/products?${query}` : "/products";
}
