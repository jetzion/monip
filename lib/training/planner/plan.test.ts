import { describe, expect, it } from "vitest";

import { buildPlan } from "./plan";
import { NO_RULES, type PlanInput, type PlanSailing, type PlanSession, type PlanSettings, type PlanTrainer } from "./types";

const portZones = { "Miami, Florida": "America/New_York", "Barcelona, Spain": "Europe/Madrid" };

let nextId = 1;
const sailing = (ship: string, day: string, overrides: Partial<PlanSailing> = {}): PlanSailing => ({
  id: nextId++,
  ship,
  cruiseLine: "Line",
  startDate: `${day}T12:00:00.000Z`,
  endDate: `${day.slice(0, 8)}${String(Number(day.slice(8)) + 7).padStart(2, "0")}T12:00:00.000Z`,
  startPort: "Miami, Florida",
  endPort: "Miami, Florida",
  arrival: "06:00",
  departure: "16:30",
  ...overrides,
});
const trainer = (id: number, overrides: Partial<PlanTrainer> = {}): PlanTrainer => ({
  id,
  name: `Trainer ${id}`,
  homeBase: "Miami, Florida",
  canJoinCruises: true,
  maxDaysPerMonth: null,
  ...overrides,
});
const settings: PlanSettings = {
  from: "2026-12-01",
  to: "2026-12-20",
  preset: "balanced",
  ships: [],
  ports: [],
  trainers: [],
  priorityShips: [],
  onlineHours: 2,
  maxOnboardingNights: 7,
  now: "2026-11-20T00:00:00.000Z",
  rules: NO_RULES,
};
const noCosts = { onlineSession: null, departureDaySession: null, onboardingDay: null, trip: null, night: null };
const plan = (input: Partial<PlanInput> & Pick<PlanInput, "sailings">) =>
  buildPlan({ settings, trainers: [trainer(1)], sessions: [], portZones, costs: noCosts, ...input });
/** A departure-day session already in the schedule. */
const existing = (id: number, ship: string, day: string, overrides: Partial<PlanSession> = {}): PlanSession => ({
  id,
  trainerId: 1,
  ship,
  type: "departureDay",
  startsAt: `${day}T11:00:00.000Z`,
  endsAt: `${day}T21:30:00.000Z`,
  timeZone: "America/New_York",
  fixed: false,
  startPort: "Miami, Florida",
  endPort: null,
  ...overrides,
});

describe("buildPlan", () => {
  it("trains each ship once, departure day at home base when balanced", () => {
    const result = plan({ sailings: [sailing("Alpha", "2026-12-05"), sailing("Alpha", "2026-12-12"), sailing("Beta", "2026-12-06")] });
    expect(result.proposals.map((p) => [p.sailing.ship, p.type, p.sailing.startDate.slice(0, 10)])).toEqual([
      ["Alpha", "departureDay", "2026-12-05"],
      ["Beta", "departureDay", "2026-12-06"],
    ]);
    expect(result.proposals[0].reason).toBe("Departure day in Miami, Florida, Trainer 1's home base; not trained before.");
    expect(result.summary).toMatchObject({ shipsCovered: 2, shipsEligible: 2, sessions: { departureDay: 2, online: 0, onboarding: 0 } });
  });

  it("uses each preset's preferred format", () => {
    const sailings = [sailing("Alpha", "2026-12-05")];
    expect(plan({ sailings, settings: { ...settings, preset: "lowerCost" } }).proposals[0].type).toBe("online");
    expect(plan({ sailings, settings: { ...settings, preset: "moreInPerson" } }).proposals[0].type).toBe("onboarding");
  });

  it("needs a second trainer for two ships in port on the same day", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Beta", "2026-12-05")];
    const one = plan({ sailings });
    expect(one.proposals).toHaveLength(1);
    expect(one.unscheduled).toEqual([
      { ship: "Beta", reason: "No trainer is free during its cruises in the range, or every trainer is at their monthly limit." },
    ]);
    expect(plan({ sailings, trainers: [trainer(1), trainer(2)] }).proposals).toHaveLength(2);
  });

  it("plans priority ships first, then those trained least recently", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Beta", "2026-12-05"), sailing("Gamma", "2026-12-05")];
    const sessions = [existing(1, "Alpha", "2026-10-01"), existing(2, "Beta", "2026-11-01")];
    expect(plan({ sailings, sessions }).proposals[0].sailing.ship).toBe("Gamma");
    expect(plan({ sailings, sessions, settings: { ...settings, priorityShips: ["Beta"] } }).proposals[0].sailing.ship).toBe("Beta");
  });

  it("skips ships without usable times and ships already trained in the range", () => {
    const sailings = [sailing("Alpha", "2026-12-05", { arrival: null }), sailing("Beta", "2026-12-06")];
    const result = plan({ sailings, sessions: [existing(1, "Beta", "2026-12-02")] });
    expect(result.proposals).toHaveLength(0);
    expect(result.skipped).toEqual([{ ship: "Alpha", reason: "No cruise in the range can be planned: no arrival and departure times." }]);
  });

  it("respects the monthly day limit, counting existing sessions", () => {
    const sailings = [sailing("Beta", "2026-12-06")];
    const sessions = [existing(1, "Alpha", "2026-11-30", { fixed: true })];
    const limited = plan({ sailings, sessions, trainers: [trainer(1, { maxDaysPerMonth: 1 })] });
    expect(limited.proposals).toHaveLength(1);
    const full = plan({ sailings, sessions: [existing(1, "Alpha", "2026-12-02", { fixed: true })], trainers: [trainer(1, { maxDaysPerMonth: 1 })] });
    expect(full.proposals).toHaveLength(0);
    expect(full.summary.load).toEqual([{ trainerId: 1, name: "Trainer 1", month: "2026-12", days: 1, limit: 1 }]);
  });

  it("proposes moving an existing session when that is the only way to train another ship", () => {
    // Alpha is booked on the 5th but also sails on the 12th; Beta sails only on the 5th.
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Alpha", "2026-12-12"), sailing("Beta", "2026-12-05")];
    const sessions = [existing(9, "Alpha", "2026-12-05")];
    const result = plan({ sailings, sessions, settings: { ...settings, preset: "moreInPerson", maxOnboardingNights: 0 } });
    expect(result.proposals.map((p) => p.sailing.ship)).toEqual(["Beta"]);
    expect(result.moves).toHaveLength(1);
    expect(result.moves[0].session.id).toBe(9);
    expect(result.moves[0].to.sailing.startDate.slice(0, 10)).toBe("2026-12-12");
    expect(result.moves[0].reason).toBe("Frees Trainer 1 for Beta, which could not be trained otherwise.");
  });

  it("never moves fixed or past sessions", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Alpha", "2026-12-12"), sailing("Beta", "2026-12-05")];
    const fixed = plan({ sailings, sessions: [existing(9, "Alpha", "2026-12-05", { fixed: true })], settings: { ...settings, maxOnboardingNights: 0 } });
    expect(fixed.moves).toHaveLength(0);
    expect(fixed.unscheduled.map((u) => u.ship)).toEqual(["Beta"]);
  });

  it("leaves a travel day between ports in different time zones", () => {
    const sailings = [
      sailing("Alpha", "2026-12-05"),
      sailing("Beta", "2026-12-06", { startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" }),
    ];
    const result = plan({ sailings, settings: { ...settings, maxOnboardingNights: 0, preset: "moreInPerson" } });
    // Barcelona the morning after Miami is out of reach, so Beta falls back to online.
    expect(result.proposals.map((p) => [p.sailing.ship, p.type])).toEqual([
      ["Alpha", "departureDay"],
      ["Beta", "online"],
    ]);
  });

  it("shares work between trainers when they are equally suited", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Beta", "2026-12-08")];
    const result = plan({ sailings, trainers: [trainer(1), trainer(2)] });
    expect(result.proposals.map((p) => p.trainerId)).toEqual([1, 2]);
  });

  it("follows the admin's rules", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Beta", "2026-12-08")];
    const trainers = [trainer(1), trainer(2)];
    const withRules = (rules: Partial<PlanSettings["rules"]>) => ({ ...settings, rules: { ...NO_RULES, ...rules } });
    // Trainer 1 away: both ships go to Trainer 2.
    const away = plan({ sailings, trainers, settings: withRules({ unavailable: [{ trainerId: 1, from: "2026-12-01", to: "2026-12-20" }] }) });
    expect(away.proposals.map((p) => p.trainerId)).toEqual([2, 2]);
    // No departure day: Alpha goes on board 5-12 Dec, which keeps the only trainer at sea for Beta on the 8th.
    const noDeparture = plan({ sailings, settings: withRules({ blockedTypes: [{ type: "departureDay", from: null, to: null }] }) });
    expect(noDeparture.proposals.map((p) => [p.sailing.ship, p.type])).toEqual([["Alpha", "onboarding"]]);
    expect(noDeparture.unscheduled.map((u) => u.ship)).toEqual(["Beta"]);
    // Prefer Trainer 2 in Miami: both go to Trainer 2 despite the workload tie-break.
    const prefer = plan({ sailings, trainers, settings: withRules({ trainerPorts: [{ trainerId: 2, port: "Miami, Florida", mode: "prefer" }] }) });
    expect(prefer.proposals.map((p) => p.trainerId)).toEqual([2, 2]);
    // Leave out Beta.
    expect(plan({ sailings, settings: withRules({ excludeShips: ["Beta"] }) }).proposals.map((p) => p.sailing.ship)).toEqual(["Alpha"]);
  });

  it("plans only the chosen ports and trainers", () => {
    const sailings = [sailing("Alpha", "2026-12-05"), sailing("Beta", "2026-12-08", { startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" })];
    const trainers = [trainer(1), trainer(2)];
    const miami = plan({ sailings, trainers, settings: { ...settings, ports: ["Miami, Florida"] } });
    expect(miami.proposals.map((p) => p.sailing.ship)).toEqual(["Alpha"]);
    expect(miami.summary.shipsEligible).toBe(1);
    const onlyTwo = plan({ sailings, trainers, settings: { ...settings, trainers: [2] } });
    expect(onlyTwo.proposals.map((p) => p.trainerId)).toEqual([2, 2]);
    expect(onlyTwo.summary.load.map((entry) => entry.trainerId)).toEqual([2]);
  });

  it("explains travel away from home base", () => {
    const sailings = [sailing("Alpha", "2026-12-05", { startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" })];
    const result = plan({ sailings, settings: { ...settings, maxOnboardingNights: 0 } });
    expect(result.proposals[0]).toMatchObject({ type: "departureDay", travel: true, trips: 1, nights: 1 });
    expect(result.proposals[0].reason).toContain("Trainer 1 travels from Miami, Florida");
  });
});
