import { describe, expect, it } from "vitest";

import { buildCategoryTree } from "./category-tree";

describe("buildCategoryTree", () => {
  it("nests subcategories under their parent in input order", () => {
    const tree = buildCategoryTree([
      { id: 1 },
      { id: 2, parent: 1 },
      { id: 3 },
      { id: 4, parent: { id: 1 } },
    ]);
    expect(tree.map((node) => [node.id, node.children.map((child) => child.id)])).toEqual([
      [1, [2, 4]],
      [3, []],
    ]);
  });

  it("shows a subcategory whose parent is missing as top-level", () => {
    expect(buildCategoryTree([{ id: 5, parent: 99 }]).map((node) => node.id)).toEqual([5]);
  });
});
