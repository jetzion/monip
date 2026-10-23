import { describe, expect, it } from "vitest";

import { isActivePath } from "./active-path";

describe("isActivePath", () => {
  it("matches Home only on the homepage", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/", "/products")).toBe(false);
  });

  it("matches a section and its child pages", () => {
    expect(isActivePath("/products", "/products")).toBe(true);
    expect(isActivePath("/products", "/products/steel-mug")).toBe(true);
  });

  it("does not match a different section with the same prefix", () => {
    expect(isActivePath("/products", "/products-archive")).toBe(false);
    expect(isActivePath("/about", "/services")).toBe(false);
  });
});
