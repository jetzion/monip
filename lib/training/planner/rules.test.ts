import { describe, expect, it } from "vitest";

import { describeRules, removeRule, ruleBonus, ruleViolations } from "./rules";
import { NO_RULES, type PlanRules, type Slot } from "./types";

const anna = { id: 1, name: "Anna", homeBase: "Miami, Florida", canJoinCruises: true, maxDaysPerMonth: null };
const miami = { startPort: "Miami, Florida", endPort: "Miami, Florida", startZone: "America/New_York", endZone: "America/New_York" };
// Departure day on 24 Dec 2026 in Miami.
const slot = {
  trainerId: 1,
  type: "departureDay",
  startsAt: "2026-12-24T11:00:00.000Z",
  endsAt: "2026-12-24T21:30:00.000Z",
  timeZone: "America/New_York",
  place: miami,
} as Slot;
const rules = (patch: Partial<PlanRules>): PlanRules => ({ ...NO_RULES, ...patch });

describe("ruleViolations", () => {
  it("is empty without rules", () => {
    expect(ruleViolations(slot, anna, NO_RULES)).toEqual([]);
  });

  it("names unavailable trainers, closed days, blocked types, and avoided ports", () => {
    expect(ruleViolations(slot, anna, rules({ unavailable: [{ trainerId: 1, from: "2026-12-20", to: "2026-12-27" }] }))).toEqual([
      "Anna is unavailable from 20 Dec 2026 to 27 Dec 2026.",
    ]);
    expect(ruleViolations(slot, anna, rules({ unavailable: [{ trainerId: null, from: "2026-12-24", to: "2026-12-24" }] }))).toEqual([
      "No training is planned on 24 Dec 2026.",
    ]);
    expect(ruleViolations(slot, anna, rules({ blockedTypes: [{ type: "departureDay", from: null, to: null }] }))).toEqual([
      "No departure-day training.",
    ]);
    expect(ruleViolations(slot, anna, rules({ trainerPorts: [{ trainerId: 1, port: "Miami, Florida", mode: "avoid" }] }))).toEqual([
      "Anna is kept away from Miami, Florida.",
    ]);
  });

  it("ignores rules for other trainers, types, dates, and online training's ports", () => {
    expect(ruleViolations(slot, anna, rules({ unavailable: [{ trainerId: 2, from: "2026-12-20", to: "2026-12-27" }] }))).toEqual([]);
    expect(ruleViolations(slot, anna, rules({ blockedTypes: [{ type: "onboarding", from: null, to: null }] }))).toEqual([]);
    expect(ruleViolations(slot, anna, rules({ unavailable: [{ trainerId: 1, from: "2026-12-25", to: "2026-12-31" }] }))).toEqual([]);
    const online = { ...slot, type: "online", place: null } as Slot;
    expect(ruleViolations(online, anna, rules({ trainerPorts: [{ trainerId: 1, port: "Miami, Florida", mode: "avoid" }] }))).toEqual([]);
  });
});

describe("ruleBonus", () => {
  it("rewards the preferred trainer at the port", () => {
    expect(ruleBonus(slot, rules({ trainerPorts: [{ trainerId: 1, port: "Miami, Florida", mode: "prefer" }] }))).toBeGreaterThan(0);
    expect(ruleBonus(slot, rules({ trainerPorts: [{ trainerId: 2, port: "Miami, Florida", mode: "prefer" }] }))).toBe(0);
  });
});

describe("describeRules and removeRule", () => {
  const all = rules({
    unavailable: [{ trainerId: 1, from: "2026-12-20", to: "2026-12-27" }],
    blockedTypes: [{ type: "onboarding", from: null, to: null }],
    trainerPorts: [{ trainerId: 1, port: "Miami, Florida", mode: "prefer" }],
    excludeShips: ["Alpha"],
  });

  it("lists each rule as a sentence", () => {
    expect(describeRules(all, () => "Anna").map((rule) => rule.text)).toEqual([
      "Anna unavailable from 20 Dec 2026 to 27 Dec 2026",
      "No onboarding training at all",
      "Prefer Anna for Miami, Florida",
      "Leave out Alpha",
    ]);
  });

  it("removes one rule by its key", () => {
    expect(removeRule(all, "blockedTypes:0").blockedTypes).toEqual([]);
    expect(removeRule(all, "blockedTypes:0").excludeShips).toEqual(["Alpha"]);
  });
});
