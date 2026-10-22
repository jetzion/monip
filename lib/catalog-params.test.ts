import { describe, expect, it } from "vitest";

import { catalogHref, parseCatalogParams } from "./catalog-params";

describe("parseCatalogParams", () => {
  it("returns empty values when nothing is set", () => {
    expect(parseCatalogParams({})).toEqual({ q: "", category: "" });
  });

  it("trims and collapses whitespace in the query", () => {
    expect(parseCatalogParams({ q: "  steel   mug " }).q).toBe("steel mug");
  });

  it("strips SQL LIKE wildcards", () => {
    expect(parseCatalogParams({ q: "%" }).q).toBe("");
    expect(parseCatalogParams({ q: "mug_%cup" }).q).toBe("mug cup");
  });

  it("caps the query length", () => {
    expect(parseCatalogParams({ q: "x".repeat(500) }).q).toHaveLength(100);
  });

  it("uses the first value of repeated params", () => {
    expect(parseCatalogParams({ q: ["mug", "bag"] }).q).toBe("mug");
  });

  it("accepts valid category slugs and drops invalid ones", () => {
    expect(parseCatalogParams({ category: "Travel-Mugs" }).category).toBe("travel-mugs");
    expect(parseCatalogParams({ category: "../etc" }).category).toBe("");
    expect(parseCatalogParams({ category: "a b" }).category).toBe("");
  });
});

describe("catalogHref", () => {
  it("omits empty params", () => {
    expect(catalogHref({})).toBe("/products");
    expect(catalogHref({ q: "", category: "bags" })).toBe("/products?category=bags");
  });

  it("encodes the query", () => {
    expect(catalogHref({ q: "mugs & cups" })).toBe("/products?q=mugs+%26+cups");
  });
});
