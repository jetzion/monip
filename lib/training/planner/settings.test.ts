import { describe, expect, it } from "vitest";

import { readPlanSettings, readRules } from "./settings";

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
        ports: [],
        trainers: [],
        priorityShips: ["A"],
        onlineHours: 2,
        maxOnboardingNights: 7,
        now: "2026-11-20T10:00:00.000Z",
        rules: { unavailable: [], blockedTypes: [], trainerPorts: [], excludeShips: [] },
      },
    });
  });

  it("reads ports and trainers to limit the plan", () => {
    const result = readPlanSettings({ from: "2026-12-01", to: "2026-12-31", preset: "balanced", ports: ["Miami, Florida"], trainers: [3, "x", 3] }, now);
    expect(result).toMatchObject({ settings: { ports: ["Miami, Florida"], trainers: [3] } });
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

describe("readRules", () => {
  it("keeps well-formed rules and drops the rest", () => {
    expect(
      readRules({
        unavailable: [
          { trainerId: 3, from: "2026-12-20", to: "2026-12-27" },
          { trainerId: null, from: "2026-12-25", to: "2026-12-25" },
          { trainerId: 3, from: "2026-12-27", to: "2026-12-20" },
        ],
        blockedTypes: [{ type: "onboarding", from: "2026-12-20", to: "2026-12-31" }, { type: "online" }, { type: "cooking" }],
        trainerPorts: [{ trainerId: 3, port: "Miami, Florida", mode: "prefer" }, { trainerId: 3, port: "", mode: "avoid" }],
        excludeShips: ["Alpha", 7],
      }),
    ).toEqual({
      unavailable: [
        { trainerId: 3, from: "2026-12-20", to: "2026-12-27" },
        { trainerId: null, from: "2026-12-25", to: "2026-12-25" },
      ],
      blockedTypes: [
        { type: "onboarding", from: "2026-12-20", to: "2026-12-31" },
        { type: "online", from: null, to: null },
      ],
      trainerPorts: [{ trainerId: 3, port: "Miami, Florida", mode: "prefer" }],
      excludeShips: ["Alpha"],
    });
  });
});
