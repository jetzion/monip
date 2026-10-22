import { describe, expect, it } from "vitest";

import { isSafePreviewPath, previewUrl } from "./preview-path";

describe("isSafePreviewPath", () => {
  it("accepts site paths", () => {
    expect(isSafePreviewPath("/products/steel-mug")).toBe(true);
    expect(isSafePreviewPath("/about")).toBe(true);
    expect(isSafePreviewPath("/")).toBe(true);
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(isSafePreviewPath("https://evil.example")).toBe(false);
    expect(isSafePreviewPath("//evil.example")).toBe(false);
    expect(isSafePreviewPath("/\\evil.example")).toBe(false);
  });

  it("rejects missing, query, and encoded paths", () => {
    expect(isSafePreviewPath(null)).toBe(false);
    expect(isSafePreviewPath("")).toBe(false);
    expect(isSafePreviewPath("/products?x=1")).toBe(false);
    expect(isSafePreviewPath("/%2F%2Fevil.example")).toBe(false);
  });
});

describe("previewUrl", () => {
  it("encodes the path", () => {
    expect(previewUrl("http://localhost:3000", "/products/a")).toBe(
      "http://localhost:3000/preview?path=%2Fproducts%2Fa",
    );
  });
});
