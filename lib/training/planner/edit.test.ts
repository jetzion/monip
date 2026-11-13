import { describe, expect, it } from "vitest";

import { applyEdit, checkEdit } from "./edit";
import { buildPlan } from "./plan";
import type { StoredPlan } from "./stored";
import type { PlanInput, PlanSailing, PlanSettings, PlanTrainer } from "./types";

const portZones = { "Miami, Florida": "America/New_York", "Barcelona, Spain": "Europe/Madrid" };
const sailing = (id: number, ship: string, day: string, overrides: Partial<PlanSailing> = {}): PlanSailing => ({
  id,
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
  priorityShips: [],
  onlineHours: 2,
  maxOnboardingNights: 7,
  now: "2026-11-20T00:00:00.000Z",
};
const input: PlanInput = {
  settings,
  sailings: [
    sailing(1, "Alpha", "2026-12-05"),
    sailing(2, "Alpha", "2026-12-12"),
    sailing(3, "Beta", "2026-12-05"),
    sailing(4, "Gamma", "2026-12-06", { startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" }),
  ],
  trainers: [trainer(1), trainer(2, { canJoinCruises: false, maxDaysPerMonth: 1 })],
  sessions: [],
  portZones,
  costs: { onlineSession: null, departureDaySession: null, onboardingDay: null, trip: null, night: null },
};
const plan = buildPlan(input);
const stored: StoredPlan = { settings, createdAt: "", createdBy: "", plan, proposalStatus: {}, moveStatus: {} };
const indexOf = (ship: string) => plan.proposals.findIndex((proposal) => proposal.sailing.ship === ship);

describe("checkEdit", () => {
  it("starts from a plan with Alpha and Beta on the 5th, one trainer each, and Gamma online", () => {
    // Gamma: Trainer 1 cannot reach Barcelona the morning after Miami, and Trainer 2 is at their one-day limit.
    expect(plan.proposals.map((p) => [p.sailing.ship, p.sailing.id, p.trainerId, p.type])).toEqual([
      ["Alpha", 1, 1, "departureDay"],
      ["Beta", 3, 2, "departureDay"],
      ["Gamma", 4, 1, "online"],
    ]);
  });

  it("accepts another cruise of the same ship", () => {
    const result = checkEdit(input, stored, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "departureDay" });
    expect(result).toMatchObject({ slot: { startsAt: "2026-12-12T11:00:00.000Z" }, warnings: [] });
  });

  it("refuses a clash with another proposal, naming it", () => {
    const result = checkEdit(input, stored, indexOf("Alpha"), { cruise: 1, trainer: 2, type: "departureDay" });
    expect(result).toEqual({
      error: "Trainer 2 already has training then: Beta (proposed), Departure day training, 5 Dec 2026, 06:00 – 16:30 (America/New_York).",
    });
  });

  it("refuses another ship's cruise and a bad start time", () => {
    expect(checkEdit(input, stored, indexOf("Alpha"), { cruise: 3, trainer: 1, type: "departureDay" })).toEqual({
      error: "Choose one of this ship's cruises in the plan's dates.",
    });
    expect(checkEdit(input, stored, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "online", startTime: "9am" })).toEqual({
      error: "Enter the start time as HH:MM, for example 09:00.",
    });
  });

  it("warns, without refusing, when the admin overrides the planner's rules", () => {
    const outside = checkEdit(input, stored, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "online", startTime: "17:00" });
    expect(outside).toMatchObject({ warnings: ["Outside the ship's time in port (06:00–16:30)."] });

    const cannotJoin = checkEdit(input, stored, indexOf("Alpha"), { cruise: 2, trainer: 2, type: "onboarding" });
    expect(cannotJoin).toMatchObject({
      warnings: ["Trainer 2 is not set to join cruises.", "Over Trainer 2's limit of 1 training days in December 2026."],
    });

    // Gamma in Barcelona the day after Trainer 1's Miami session on the 5th.
    const travel = checkEdit(input, stored, indexOf("Gamma"), { cruise: 4, trainer: 1, type: "departureDay" });
    expect(travel).toMatchObject({
      warnings: ["Less than 36 hours to travel to or from Alpha (proposed), Departure day training, 5 Dec 2026, 06:00 – 16:30 (America/New_York)."],
    });
  });

  it("treats pending moves as done, so a moved session no longer blocks its old time", () => {
    const session = { id: 9, trainerId: 1, ship: "Delta", type: "departureDay" as const, startsAt: "2026-12-12T11:00:00.000Z", endsAt: "2026-12-12T21:30:00.000Z", timeZone: "America/New_York", fixed: false, startPort: "Miami, Florida", endPort: null };
    const withSession = { ...input, sessions: [session] };
    const move = { session, to: { ...plan.proposals[0], trainerId: 2 }, reason: "Test" };
    const withMove: StoredPlan = { ...stored, plan: { ...plan, moves: [move] } };
    expect(checkEdit(withSession, stored, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "departureDay" })).toMatchObject({
      error: expect.stringContaining("Delta"),
    });
    expect(checkEdit(withSession, withMove, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "departureDay" })).toMatchObject({ warnings: [] });
  });
});

describe("applyEdit", () => {
  it("replaces the proposal, clears its outcome, and recalculates the summary", () => {
    const result = checkEdit(input, stored, indexOf("Alpha"), { cruise: 2, trainer: 1, type: "online", startTime: "09:00" });
    if ("error" in result) throw new Error(result.error);
    const failed: StoredPlan = { ...stored, proposalStatus: { [indexOf("Alpha")]: { status: "failed", message: "Clash" } } };
    const next = applyEdit(input, failed, indexOf("Alpha"), result.slot);
    expect(next.plan.proposals[indexOf("Alpha")]).toMatchObject({
      type: "online",
      fields: { cruise: 2, startTime: "09:00" },
      reason: "Online while in port (no travel); edited by an admin.",
    });
    expect(next.proposalStatus).toEqual({});
    expect(next.plan.summary.sessions).toEqual({ online: 2, departureDay: 1, onboarding: 0 });
  });
});
