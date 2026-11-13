import { describe, expect, it } from "vitest";

import { buildPlan } from "./plan";
import { planRows } from "./rows";
import type { StoredPlan } from "./stored";
import { NO_RULES, type PlanSettings } from "./types";

const settings: PlanSettings = {
  from: "2026-12-01",
  to: "2026-12-31",
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

const plan = buildPlan({
  settings,
  sailings: [
    {
      id: 1,
      ship: "Alpha",
      cruiseLine: "Line",
      startDate: "2026-12-05T12:00:00.000Z",
      endDate: "2026-12-12T12:00:00.000Z",
      startPort: "Barcelona, Spain",
      endPort: "Barcelona, Spain",
      arrival: "06:00",
      departure: "16:30",
    },
  ],
  trainers: [{ id: 3, name: "Anna Rossi", homeBase: "Miami, Florida", canJoinCruises: false, maxDaysPerMonth: 10 }],
  sessions: [],
  portZones: { "Barcelona, Spain": "Europe/Madrid", "Miami, Florida": "America/New_York" },
  costs: { onlineSession: null, departureDaySession: 400, onboardingDay: null, trip: 600, night: 200 },
});

const stored: StoredPlan = {
  settings,
  createdAt: "2026-11-20T09:30:00.000Z",
  createdBy: "admin@example.com",
  plan,
  proposalStatus: { 0: { status: "failed", message: "Clash" } },
  moveStatus: {},
};

describe("planRows", () => {
  it("describes each proposal and its outcome", () => {
    const rows = planRows(stored, new Map([[3, "Anna Rossi"]]));
    expect(rows.title).toBe("Balanced plan for cruises starting 1 Dec 2026 – 31 Dec 2026");
    expect(rows.made).toBe("Made 20 Nov 2026, 09:30 UTC by admin@example.com.");
    expect(rows.proposals).toEqual([
      {
        index: 0,
        shipName: "Alpha",
        values: { cruise: 1, trainer: 3, type: "departureDay", startTime: null },
        ship: "Alpha (Line)",
        when: "Departure day training, 5 Dec 2026, 06:00 – 16:30 (Europe/Madrid)",
        trainer: "Anna Rossi",
        travel: "1 trip, 1 night",
        cost: "$1,200",
        reason: "Departure day in Barcelona, Spain, Anna Rossi travels from Miami, Florida; not trained before.",
        status: { status: "failed", message: "Clash" },
      },
    ]);
  });

  it("summarizes the plan and each trainer's days", () => {
    const rows = planRows(stored, new Map([[3, "Anna Rossi"]]));
    expect(rows.lines).toEqual([
      "1 of 1 plannable ship planned: 1 departure day, 0 onboarding, 0 online.",
      "1 trip and 1 hotel night away from home base.",
      "Estimated cost: $1,200.",
    ]);
    expect(rows.load).toEqual(["Anna Rossi, December 2026: 1 training day of 10 allowed"]);
  });
});

describe("planRows order", () => {
  it("lists proposals by start time, keeping each one's index in the plan", () => {
    const later = { ...plan.proposals[0], startsAt: "2026-12-20T05:00:00.000Z" };
    const rows = planRows({ ...stored, plan: { ...plan, proposals: [later, plan.proposals[0]] }, proposalStatus: {} }, new Map());
    expect(rows.proposals.map((row) => row.index)).toEqual([1, 0]);
  });
});
