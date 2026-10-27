import { describe, expect, it } from "vitest";

import {
  calendarHref,
  gridRange,
  localDay,
  monthGrid,
  monthOf,
  monthTitle,
  placeSessions,
  readParams,
  shiftMonth,
  startLabel,
  type CalendarSession,
} from "./calendar";

const session = (overrides: Partial<CalendarSession>): CalendarSession => ({
  id: 1,
  type: "departureDay",
  startsAt: "2026-10-01T12:00:00.000Z",
  endsAt: "2026-10-01T19:30:00.000Z",
  timeZone: "America/New_York",
  trainer: "Ann Lee",
  ship: "Carnival Conquest",
  ...overrides,
});

describe("months", () => {
  it("reads the URL month or falls back to today's", () => {
    expect(monthOf("2026-11", "2026-10-27")).toBe("2026-11");
    expect(monthOf("2026-13", "2026-10-27")).toBe("2026-10");
    expect(monthOf(undefined, "2026-10-27")).toBe("2026-10");
  });

  it("moves across years and names the month", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-01-31".slice(0, 7), 1)).toBe("2026-02");
    expect(monthTitle("2026-10")).toBe("October 2026");
  });

  it("steps month by month without limit", () => {
    let month = "2026-10";
    for (let i = 0; i < 120; i++) month = shiftMonth(month, 1);
    expect(month).toBe("2036-10");
    for (let i = 0; i < 600; i++) month = shiftMonth(month, -1);
    expect(month).toBe("1986-10");
  });

  it("covers the month in whole Monday-first weeks", () => {
    const october = monthGrid("2026-10");
    expect(october[0]).toBe("2026-09-28");
    expect(october.at(-1)).toBe("2026-11-01");
    expect(october).toHaveLength(35);
    // February 2027 starts on a Monday and fills exactly four weeks.
    expect(monthGrid("2027-02")).toHaveLength(28);
  });

  it("pads the query range by a day each side", () => {
    expect(gridRange(monthGrid("2026-10"))).toEqual({ from: "2026-09-27T00:00:00.000Z", to: "2026-11-03T00:00:00.000Z" });
  });
});

describe("placing sessions", () => {
  it("uses the session's own time zone for its day", () => {
    expect(localDay("2026-10-02T02:00:00.000Z", "America/New_York")).toBe("2026-10-01");
    expect(localDay("2026-10-02T02:00:00.000Z", "Asia/Tokyo")).toBe("2026-10-02");
  });

  it("shows onboarding on every day it covers and sorts by start", () => {
    const onboarding = session({ id: 2, type: "onboarding", startsAt: "2026-10-01T04:00:00.000Z", endsAt: "2026-10-04T04:00:00.000Z" });
    const placed = placeSessions([session({}), onboarding], monthGrid("2026-10"));
    expect(placed.get("2026-10-01")?.map((s) => s.id)).toEqual([2, 1]);
    expect(placed.get("2026-10-03")?.map((s) => s.id)).toEqual([2]);
    expect(placed.get("2026-10-04")).toEqual([]);
  });

  it("labels start times in the session's zone", () => {
    expect(startLabel(session({}))).toBe("08:00");
    expect(startLabel(session({ type: "onboarding" }))).toBe("All day");
  });
});

describe("calendar URLs", () => {
  it("reads only the calendar's own single-value parameters", () => {
    expect(readParams({ calMonth: "2026-10", calType: ["a", "b"], page: "2", calTrainer: "" })).toEqual({ calMonth: "2026-10" });
  });

  it("changes and removes parameters, keeping the rest", () => {
    const params = { calMonth: "2026-10", calTrainer: "3", calSession: "9" };
    expect(calendarHref(params, { calMonth: "2026-11", calSession: undefined })).toBe("?calMonth=2026-11&calTrainer=3");
    expect(calendarHref({}, {})).toBe("?");
  });
});
