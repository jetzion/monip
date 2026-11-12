import { describe, expect, it } from "vitest";

import { chosenIds, inChosenOrder } from "./featured-services";

describe("chosenIds", () => {
  it("accepts IDs and populated docs", () => {
    expect(chosenIds([3, { id: 1 }, 2])).toEqual([3, 1, 2]);
  });

  it("returns an empty list when nothing is chosen", () => {
    expect(chosenIds(null)).toEqual([]);
    expect(chosenIds(undefined)).toEqual([]);
  });
});

describe("inChosenOrder", () => {
  const docs = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("follows the editor's order, not the query's", () => {
    expect(inChosenOrder(docs, [3, 1, 2]).map((doc) => doc.id)).toEqual([3, 1, 2]);
  });

  it("skips services that were not returned (unpublished or deleted)", () => {
    expect(inChosenOrder(docs, [4, 2]).map((doc) => doc.id)).toEqual([2]);
  });
});
