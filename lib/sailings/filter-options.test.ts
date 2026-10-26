import { describe, expect, it } from "vitest";

import { monthOptions } from "./filter-options";

describe("monthOptions", () => {
  it("returns distinct months in chronological order with year labels", () => {
    expect(
      monthOptions([
        "2027-01-09T12:00:00.000Z",
        "2026-10-03T12:00:00.000Z",
        "2026-10-31T12:00:00.000Z",
        "2026-12-31T12:00:00.000Z",
      ]),
    ).toEqual([
      { value: "2026-10", label: "October 2026" },
      { value: "2026-12", label: "December 2026" },
      { value: "2027-01", label: "January 2027" },
    ]);
  });

  it("returns no options for no dates", () => {
    expect(monthOptions([])).toEqual([]);
  });
});
