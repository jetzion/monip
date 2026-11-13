import { describe, expect, it } from "vitest";

import { book, booking, type Bookings } from "./bookings";
import { ineligibleReason, slotFor } from "./slots";
import { NO_RULES, type PlanCosts, type PlanSailing, type PlanSettings, type PlanTrainer } from "./types";

const portZones = { "Miami, Florida": "America/New_York", "Barcelona, Spain": "Europe/Madrid" };
const sailing: PlanSailing = {
  id: 7,
  ship: "Icon of the Seas",
  cruiseLine: "Royal Caribbean",
  startDate: "2026-12-05T12:00:00.000Z",
  endDate: "2026-12-12T12:00:00.000Z",
  startPort: "Miami, Florida",
  endPort: "Miami, Florida",
  arrival: "06:00",
  departure: "16:30",
};
const anna: PlanTrainer = { id: 1, name: "Anna", homeBase: "Miami, Florida", canJoinCruises: true, maxDaysPerMonth: null };
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
const noCosts: PlanCosts = { onlineSession: null, departureDaySession: null, onboardingDay: null, trip: null, night: null };
const context = (overrides: Partial<{ settings: PlanSettings; costs: PlanCosts; bookings: Bookings }> = {}) => ({
  settings,
  portZones,
  costs: noCosts,
  bookings: new Map() as Bookings,
  ...overrides,
});

describe("ineligibleReason", () => {
  it("accepts a cruise with times at a port with a time zone", () => {
    expect(ineligibleReason(sailing, portZones)).toBeNull();
  });

  it("names what is missing", () => {
    expect(ineligibleReason({ ...sailing, arrival: null }, portZones)).toBe("no arrival and departure times");
    expect(ineligibleReason({ ...sailing, startPort: "Nowhere" }, portZones)).toBe("no time zone for Nowhere");
  });
});

describe("slotFor", () => {
  it("plans departure day at home base without travel, with the form's fields", () => {
    const slot = slotFor(sailing, anna, "departureDay", context());
    expect(slot).toMatchObject({
      startsAt: "2026-12-05T11:00:00.000Z",
      endsAt: "2026-12-05T21:30:00.000Z",
      timeZone: "America/New_York",
      travel: false,
      trips: 0,
      fields: { cruise: 7, trainer: 1, type: "departureDay" },
    });
  });

  it("counts a trip and a hotel night for departure day away from home base", () => {
    const slot = slotFor({ ...sailing, startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" }, anna, "departureDay", context());
    expect(slot).toMatchObject({ travel: true, trips: 1, nights: 1 });
    expect(slot!.score).toBeLessThan(slotFor(sailing, anna, "departureDay", context())!.score);
  });

  it("starts online training at the first free half hour in port", () => {
    const bookings: Bookings = new Map();
    // Busy 06:00-08:00 New York time.
    book(bookings, 1, booking("x", "2026-12-05T11:00:00.000Z", "2026-12-05T13:00:00.000Z", "America/New_York"));
    const slot = slotFor(sailing, anna, "online", context({ bookings }));
    expect(slot?.fields).toMatchObject({ startTime: "08:00", timeZone: "America/New_York", durationHours: "2" });
    expect(slot?.travel).toBe(false);
  });

  it("skips online training when no free window fits before departure", () => {
    const bookings: Bookings = new Map();
    book(bookings, 1, booking("x", "2026-12-05T11:00:00.000Z", "2026-12-05T21:00:00.000Z", "America/New_York"));
    expect(slotFor(sailing, anna, "online", context({ bookings }))).toBeNull();
  });

  it("offers onboarding only to trainers who can join cruises, on cruises up to the night limit", () => {
    expect(slotFor(sailing, anna, "onboarding", context())?.endsAt).toBe("2026-12-13T05:00:00.000Z");
    expect(slotFor(sailing, { ...anna, canJoinCruises: false }, "onboarding", context())).toBeNull();
    expect(slotFor(sailing, anna, "onboarding", context({ settings: { ...settings, maxOnboardingNights: 6 } }))).toBeNull();
  });

  it("never plans in the past or over the monthly limit", () => {
    expect(slotFor(sailing, anna, "departureDay", context({ settings: { ...settings, now: "2026-12-06T00:00:00.000Z" } }))).toBeNull();
    const bookings: Bookings = new Map();
    book(bookings, 1, booking("x", "2026-12-01T15:00:00.000Z", "2026-12-01T17:00:00.000Z", "America/New_York"));
    expect(slotFor(sailing, { ...anna, maxDaysPerMonth: 1 }, "departureDay", context({ bookings }))).toBeNull();
  });

  it("estimates cost when every needed figure is known", () => {
    const costs = { onlineSession: 100, departureDaySession: 400, onboardingDay: 300, trip: 600, night: 200 };
    const away = { ...sailing, startPort: "Barcelona, Spain", endPort: "Barcelona, Spain" };
    expect(slotFor(away, anna, "departureDay", context({ costs }))?.cost).toBe(1200);
    expect(slotFor(sailing, anna, "onboarding", context({ costs }))?.cost).toBe(2400);
    expect(slotFor(away, anna, "departureDay", context({ costs: { ...costs, night: null } }))?.cost).toBeNull();
  });
});
