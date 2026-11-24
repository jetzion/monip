import { describe, expect, it } from "vitest";

import { changedFields, hasStarted, isCancelOnly } from "./session-rules";

const original = {
  cruise: 7,
  trainer: 3,
  type: "online",
  date: "2026-12-05T12:00:00.000Z",
  startTime: "09:00",
  timeZone: "America/New_York",
  durationHours: "2",
  endDate: null,
  fixed: false,
  canceled: false,
  startsAt: "2026-12-05T14:00:00.000Z",
};

describe("changedFields", () => {
  it("ignores missing fields, populated relationships, and null against undefined", () => {
    expect(changedFields({ canceled: true }, original)).toEqual([]);
    expect(changedFields({ ...original, cruise: { id: 7 }, trainer: { id: 3 }, endDate: undefined }, original)).toEqual([]);
  });

  it("compares travel by its details", () => {
    const travel = { departureCity: "Orlando", departureDate: "2026-12-04T12:00:00.000Z", returnDate: "2026-12-05T12:00:00.000Z" };
    const stored = { ...original, travel: { ...travel, airTravel: false, departureAirport: null } };
    expect(changedFields({ ...original, travel: { ...travel } }, stored)).toEqual([]);
    expect(changedFields({ ...original, travel: { ...travel, returnDate: "2026-12-06T12:00:00.000Z" } }, stored)).toEqual(["travel"]);
  });

  it("lists edited fields", () => {
    expect(changedFields({ ...original, trainer: 4, startTime: "10:00" }, original)).toEqual(["trainer", "startTime"]);
  });
});

describe("hasStarted", () => {
  it("is true from the start time on", () => {
    expect(hasStarted(original, new Date("2026-12-05T13:59:59.000Z"))).toBe(false);
    expect(hasStarted(original, new Date("2026-12-05T14:00:00.000Z"))).toBe(true);
  });
});

describe("isCancelOnly", () => {
  it("is true when only canceling, including a full form save", () => {
    expect(isCancelOnly({ canceled: true }, original)).toBe(true);
    expect(isCancelOnly({ ...original, canceled: true }, original)).toBe(true);
  });

  it("is false when restoring, editing too, or creating", () => {
    expect(isCancelOnly({ canceled: false }, { ...original, canceled: true })).toBe(false);
    expect(isCancelOnly({ canceled: true, trainer: 4 }, original)).toBe(false);
    expect(isCancelOnly({ canceled: true }, undefined)).toBe(false);
  });
});
