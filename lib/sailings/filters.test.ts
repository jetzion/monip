import { describe, expect, it } from "vitest";

import { changeFilter, filtersToWhere, shipsFor, whereToFilters, type SailingFilters } from "./filters";

describe("filtersToWhere", () => {
  it("returns an empty query when nothing is selected", () => {
    expect(filtersToWhere({})).toEqual({});
  });

  it("combines every selected filter with AND", () => {
    expect(filtersToWhere({ port: "Miami, Florida", ship: "Icon of the Seas", date: "2025-01-04" })).toEqual({
      or: [
        {
          and: [
            { startPort: { equals: "Miami, Florida" } },
            { ship: { equals: "Icon of the Seas" } },
            { startDate: { equals: "2025-01-04T12:00:00.000Z" } },
          ],
        },
      ],
    });
  });

  it("matches a whole calendar month, including December into January", () => {
    expect(filtersToWhere({ month: "2026-12" })).toEqual({
      or: [
        {
          and: [
            { startDate: { greater_than_equal: "2026-12-01T00:00:00.000Z" } },
            { startDate: { less_than: "2027-01-01T00:00:00.000Z" } },
          ],
        },
      ],
    });
  });
});

const options = {
  ships: ["Carnival Jubilee", "Icon of the Seas", "Oasis of the Seas"],
  shipsByCruiseLine: { Carnival: ["Carnival Jubilee"], "Royal Caribbean": ["Icon of the Seas", "Oasis of the Seas"] },
};

describe("shipsFor", () => {
  it("lists only the selected cruise line's ships", () => {
    expect(shipsFor("Royal Caribbean", options)).toEqual(["Icon of the Seas", "Oasis of the Seas"]);
  });

  it("lists every ship when no cruise line is selected", () => {
    expect(shipsFor(undefined, options)).toEqual(options.ships);
  });
});

describe("changeFilter", () => {
  it("clears the ship when the new cruise line does not include it", () => {
    expect(changeFilter({ ship: "Icon of the Seas" }, "cruiseLine", "Carnival", options.shipsByCruiseLine)).toEqual({
      cruiseLine: "Carnival",
      ship: undefined,
    });
  });

  it("keeps the ship when it belongs to the new cruise line, or when the cruise line is cleared", () => {
    const { shipsByCruiseLine } = options;
    expect(changeFilter({ ship: "Icon of the Seas" }, "cruiseLine", "Royal Caribbean", shipsByCruiseLine).ship).toBe(
      "Icon of the Seas",
    );
    expect(changeFilter({ cruiseLine: "Royal Caribbean", ship: "Icon of the Seas" }, "cruiseLine", undefined, shipsByCruiseLine)).toEqual({
      cruiseLine: undefined,
      ship: "Icon of the Seas",
    });
  });
});

describe("whereToFilters", () => {
  it("reads back every filter it wrote", () => {
    const filters: SailingFilters = {
      port: "Miami, Florida",
      month: "2025-01",
      date: "2025-01-04",
      cruiseLine: "Royal Caribbean",
      operator: "Starboard",
      ship: "Icon of the Seas",
    };
    expect(whereToFilters(filtersToWhere(filters))).toEqual(filters);
  });

  it("returns no filters for an empty or missing query", () => {
    expect(whereToFilters(undefined)).toEqual({});
    expect(whereToFilters({})).toEqual({});
  });
});
