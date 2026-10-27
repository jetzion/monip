import { describe, expect, it } from "vitest";

import { CRUISE_REMOVED, cruiseChanges } from "./review";

const copy = {
  ship: "Norwegian Joy",
  cruiseLine: "Norwegian",
  startDate: "2026-10-27T12:00:00.000Z",
  endDate: "2026-11-01T12:00:00.000Z",
  startPort: "Miami, Florida",
  arrival: "07:30",
  departure: "17:00",
};

describe("cruiseChanges", () => {
  it("finds nothing when the cruise is unchanged", () => {
    expect(cruiseChanges(copy, { ...copy, endDate: "2026-11-01T12:00:00.000Z" })).toEqual([]);
  });

  it("lists each changed field with before and after", () => {
    expect(cruiseChanges(copy, { ...copy, startDate: "2026-10-28T12:00:00.000Z", departure: "18:00", arrival: null })).toEqual([
      "Start date: 27 Oct 2026 → 28 Oct 2026",
      "Arrival: 07:30 → none",
      "Departure: 17:00 → 18:00",
    ]);
  });

  it("reports a removed cruise", () => {
    expect(cruiseChanges(copy, null)).toEqual([CRUISE_REMOVED]);
  });

  it("treats missing and empty values alike", () => {
    expect(cruiseChanges({ ...copy, arrival: "" }, { ...copy, arrival: null })).toEqual([]);
  });
});
