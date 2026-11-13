import { describe, expect, it } from "vitest";

import { readPlanSettings } from "./settings";

const now = new Date("2026-11-20T10:00:00.000Z");

describe("readPlanSettings", () => {
  it("reads a valid request with defaults", () => {
    const result = readPlanSettings({ from: "2026-12-01", to: "2026-12-31", preset: "balanced", priorityShips: ["A", "A", ""] }, now);
    expect(result).toEqual({
      settings: {
        from: "2026-12-01",
        to: "2026-12-31",
        preset: "balanced",
        ships: [],
        priorityShips: ["A"],
        onlineHours: 2,
        maxOnboardingNights: 7,
        now: "2026-11-20T10:00:00.000Z",
      },
    });
  });

  it("keeps allowed online hours and onboarding nights", () => {
    const result = readPlanSettings({ from: "2026-12-01", to: "2026-12-02", preset: "lowerCost", onlineHours: "4", maxOnboardingNights: 3 }, now);
    expect(result).toMatchObject({ settings: { onlineHours: 4, maxOnboardingNights: 3 } });
  });

  it("explains what is wrong", () => {
    expect(readPlanSettings({ from: "2026-12-01", preset: "balanced" }, now)).toEqual({ error: "Choose the first and last cruise start dates." });
    expect(readPlanSettings({ from: "2026-12-05", to: "2026-12-01", preset: "balanced" }, now)).toEqual({
      error: "The last date must be on or after the first.",
    });
    expect(readPlanSettings({ from: "2026-12-01", to: "2027-04-01", preset: "balanced" }, now)).toEqual({
      error: "Choose at most 92 days (about three months).",
    });
    expect(readPlanSettings({ from: "2026-10-01", to: "2026-10-31", preset: "balanced" }, now)).toEqual({ error: "Choose dates from today on." });
    expect(readPlanSettings({ from: "2026-12-01", to: "2026-12-31", preset: "cheap" }, now)).toEqual({
      error: "Choose Balanced, Lower cost, or More in-person.",
    });
  });
});
