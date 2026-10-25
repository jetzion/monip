import { describe, expect, it } from "vitest";

import { describePrompt, hasDescribeInput, productFacts, textToLexical } from "./product-description";

describe("hasDescribeInput", () => {
  it("is false with no images and no data", () => {
    expect(hasDescribeInput({ name: " ", tags: [], specifications: [] }, 0)).toBe(false);
  });

  it("is true with an image or any data", () => {
    expect(hasDescribeInput({}, 1)).toBe(true);
    expect(hasDescribeInput({ materials: ["steel"] }, 0)).toBe(true);
  });
});

describe("productFacts", () => {
  it("lists filled fields and specifications only", () => {
    expect(
      productFacts({
        name: "Mug",
        summary: "",
        materials: ["ceramic", "glaze"],
        specifications: [{ label: "Capacity", value: "350 ml" }],
      }),
    ).toEqual(["Name: Mug", "Materials: ceramic, glaze", "Capacity: 350 ml"]);
  });
});

describe("describePrompt", () => {
  it("states the image count and the data", () => {
    const prompt = describePrompt({ name: "Mug" }, 2);
    expect(prompt).toContain("The attached 2 image(s)");
    expect(prompt).toContain("Name: Mug");
  });
});

describe("textToLexical", () => {
  it("makes one paragraph per blank-line-separated block", () => {
    const state = textToLexical("First line\ncontinues.\n\n\nSecond.");
    expect(state.root.children.map((p) => p.children[0].text)).toEqual(["First line continues.", "Second."]);
  });
});
