import { describe, expect, it } from "vitest";

import { toSlug } from "./slug";

describe("toSlug", () => {
  it("lowercases and joins words with single hyphens", () => {
    expect(toSlug("Drinkware & Mugs")).toBe("drinkware-mugs");
  });

  it("strips accents", () => {
    expect(toSlug("Café Crème Tote")).toBe("cafe-creme-tote");
  });

  it("trims leading and trailing separators", () => {
    expect(toSlug("  --Eco Bags!-- ")).toBe("eco-bags");
  });

  it("keeps an existing slug unchanged", () => {
    expect(toSlug("travel-mugs-12oz")).toBe("travel-mugs-12oz");
  });
});
