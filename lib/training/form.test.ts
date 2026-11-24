import { describe, expect, it } from "vitest";

import { checkForm, cruiseLabel, emptyForm, errorMessages, formTravel, sessionBody, travelChoice, type CruiseOption, type FormState } from "./form";

const cruise: CruiseOption = {
  id: 7,
  ship: "Carnival Conquest",
  cruiseLine: "Carnival",
  startDate: "2026-10-01T12:00:00.000Z",
  endDate: "2026-10-05T12:00:00.000Z",
  startPort: "Miami, Florida",
  arrival: "08:00",
  departure: "15:30",
};
const zones = { "Miami, Florida": "America/New_York" };
const base: FormState = { ...emptyForm("Europe/Rome"), cruise, trainer: "3" };
/** A trainer based at the cruise's port needs no travel. */
const HOME = "Miami, Florida";

describe("cruiseLabel", () => {
  it("shows ship, line, dates, and port", () => {
    expect(cruiseLabel(cruise)).toBe("Carnival Conquest · Carnival · 1 Oct 2026 – 5 Oct 2026 · Miami, Florida");
  });
});

describe("checkForm", () => {
  it("asks for cruise, trainer, and type first", () => {
    expect(checkForm(emptyForm("UTC"), zones, HOME)).toEqual({ ready: false, reason: "Choose a cruise." });
    expect(checkForm({ ...base, trainer: "" }, zones, HOME)).toEqual({ ready: false, reason: "Choose a trainer." });
    expect(checkForm(base, zones, HOME)).toEqual({ ready: false, reason: "Choose a training type." });
  });

  it("previews a departure-day session in the port's zone", () => {
    expect(checkForm({ ...base, type: "departureDay" }, zones, HOME)).toEqual({
      ready: true,
      summary: "Departure day training, 1 Oct 2026, 08:00 – 15:30 (America/New_York)",
    });
    expect(checkForm({ ...base, type: "departureDay" }, {}, HOME)).toMatchObject({ ready: false });
  });

  it("needs every online field", () => {
    const online: FormState = { ...base, type: "online", date: "2026-09-20", startTime: "09:00", durationHours: "2" };
    expect(checkForm(online, zones, HOME)).toEqual({ ready: true, summary: "Online training, 20 Sept 2026, 09:00 – 11:00 (Europe/Rome)" });
    expect(checkForm({ ...online, startTime: "" }, zones, HOME)).toMatchObject({ ready: false });
  });

  it("defaults the onboarding end date to the cruise's", () => {
    expect(checkForm({ ...base, type: "onboarding" }, zones, HOME)).toMatchObject({ ready: true, summary: expect.stringContaining("1 Oct 2026 – 5 Oct 2026") });
    expect(checkForm({ ...base, type: "onboarding", endDate: "2026-09-30" }, zones, HOME)).toMatchObject({ ready: false });
  });
});

describe("travel", () => {
  const away: FormState = { ...base, type: "departureDay" };

  it("suggests a trip for a trainer away from home base", () => {
    expect(formTravel(away, zones, HOME)).toBeNull();
    expect(formTravel({ ...base, type: "online" }, zones, "Orlando, Florida")).toBeNull();
    expect(formTravel(away, zones, "Orlando, Florida")).toMatchObject({
      departureCity: "Orlando, Florida",
      departureDate: "2026-09-30",
      returnDate: "2026-10-01",
    });
    expect(checkForm(away, zones, "Orlando, Florida")).toEqual({ ready: false, reason: "Click Estimate cost to see the travel cost." });
    const estimated = { ...away, estimate: { lookup: "done" as const, found: {}, overrides: {}, acknowledged: false } };
    const looking = { ...away, estimate: { lookup: "loading" as const, found: {}, overrides: {}, acknowledged: false } };
    expect(checkForm(looking, zones, "Orlando, Florida")).toEqual({ ready: false, reason: "Looking up current prices online." });
    expect(checkForm(estimated, zones, "Orlando, Florida")).toEqual({ ready: false, reason: "Acknowledge the estimated travel cost." });
    expect(checkForm({ ...estimated, estimate: { lookup: "done" as const, found: {}, overrides: {}, acknowledged: true } }, zones, "Orlando, Florida")).toMatchObject({ ready: true });
  });

  it("suggests a trip for onboarding too, over the cruise", () => {
    const onboarding: FormState = { ...base, type: "onboarding" };
    expect(formTravel(onboarding, zones, "Orlando, Florida")).toMatchObject({
      departureCity: "Orlando, Florida",
      departureDate: "2026-10-01",
      returnDate: "2026-10-05",
    });
    expect(checkForm(onboarding, zones, "Orlando, Florida")).toEqual({ ready: false, reason: "Click Estimate cost to see the travel cost." });
  });

  it("offers Travel needed at home base, and needs travel when the cruise ends elsewhere", () => {
    const home: FormState = { ...base, type: "onboarding" };
    expect(travelChoice(home, zones, HOME)).toBe("optional");
    expect(formTravel(home, zones, HOME)).toBeNull();
    expect(formTravel({ ...home, travelWanted: true }, zones, HOME)).toMatchObject({ departureCity: HOME, departureDate: "2026-10-01" });
    expect(travelChoice({ ...home, cruise: { ...cruise, endPort: "Barcelona, Spain" } }, zones, HOME)).toBe("needed");
    expect(travelChoice({ ...base, type: "online" }, zones, HOME)).toBe("none");
  });

  it("checks the trip with the session", () => {
    expect(checkForm(away, zones, null)).toEqual({ ready: false, reason: "Enter the departure city." });
    expect(checkForm({ ...away, travel: { airTravel: true } }, zones, "Orlando, Florida")).toEqual({
      ready: false,
      reason: "Enter the departing airport.",
    });
  });

  it("sends an acknowledged estimate with the trip", () => {
    const acknowledged = { ...away, estimate: { lookup: "done" as const, found: {}, overrides: {}, acknowledged: true } };
    const travel = formTravel(acknowledged, zones, "Orlando, Florida");
    const lines = [{ item: "rideshare" as const, label: "Rideshare", detail: "2 trips", amount: 60, source: "Default rate" }];
    expect(sessionBody(acknowledged, travel, lines).estimate).toMatchObject({ lines, acknowledgedAt: expect.any(String) });
    expect(sessionBody(away, travel, lines).estimate).toBeUndefined();
  });

  it("sends the trip with the session", () => {
    const travel = formTravel({ ...away, travel: { rideshare: true } }, zones, "Orlando, Florida");
    expect(sessionBody(away, travel, null).travel).toMatchObject({
      departureCity: "Orlando, Florida",
      departureDate: "2026-09-30T12:00:00.000Z",
      rideshare: true,
      hotelCheckIn: null,
    });
  });
});

describe("sessionBody", () => {
  it("sends only the fields for the type", () => {
    expect(sessionBody({ ...base, type: "departureDay", startTime: "09:00" }, null, null)).toEqual({ cruise: 7, trainer: 3, type: "departureDay" });
    expect(sessionBody({ ...base, type: "onboarding", endDate: "2026-10-03" }, null, null)).toEqual({
      cruise: 7,
      trainer: 3,
      type: "onboarding",
      endDate: "2026-10-03T12:00:00.000Z",
    });
    expect(sessionBody({ ...base, type: "online", date: "2026-09-20", startTime: "09:00", durationHours: "2" }, null, null)).toEqual({
      cruise: 7,
      trainer: 3,
      type: "online",
      date: "2026-09-20T12:00:00.000Z",
      startTime: "09:00",
      timeZone: "Europe/Rome",
      durationHours: "2",
    });
  });
});

describe("errorMessages", () => {
  it("prefers field messages, then the error message, then a fallback", () => {
    expect(errorMessages({ errors: [{ message: "invalid", data: { errors: [{ path: "trainer", message: "Already booked." }] } }] })).toEqual([
      "Already booked.",
    ]);
    expect(errorMessages({ errors: [{ message: "Forbidden" }] })).toEqual(["Forbidden"]);
    expect(errorMessages(null)).toEqual(["The session could not be saved. Check your connection and try again."]);
  });
});
