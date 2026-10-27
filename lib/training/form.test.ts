import { describe, expect, it } from "vitest";

import { checkForm, cruiseLabel, emptyForm, errorMessages, sessionBody, type CruiseOption, type FormState } from "./form";

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

describe("cruiseLabel", () => {
  it("shows ship, line, dates, and port", () => {
    expect(cruiseLabel(cruise)).toBe("Carnival Conquest · Carnival · 1 Oct 2026 – 5 Oct 2026 · Miami, Florida");
  });
});

describe("checkForm", () => {
  it("asks for cruise, trainer, and type first", () => {
    expect(checkForm(emptyForm("UTC"), zones)).toEqual({ ready: false, reason: "Choose a cruise." });
    expect(checkForm({ ...base, trainer: "" }, zones)).toEqual({ ready: false, reason: "Choose a trainer." });
    expect(checkForm(base, zones)).toEqual({ ready: false, reason: "Choose a training type." });
  });

  it("previews a departure-day session in the port's zone", () => {
    expect(checkForm({ ...base, type: "departureDay" }, zones)).toEqual({
      ready: true,
      summary: "Departure day training, 1 Oct 2026, 08:00 – 15:30 (America/New_York)",
    });
    expect(checkForm({ ...base, type: "departureDay" }, {})).toMatchObject({ ready: false });
  });

  it("needs every online field", () => {
    const online: FormState = { ...base, type: "online", date: "2026-09-20", startTime: "09:00", durationHours: "2" };
    expect(checkForm(online, zones)).toEqual({ ready: true, summary: "Online training, 20 Sept 2026, 09:00 – 11:00 (Europe/Rome)" });
    expect(checkForm({ ...online, startTime: "" }, zones)).toMatchObject({ ready: false });
  });

  it("defaults the onboarding end date to the cruise's", () => {
    expect(checkForm({ ...base, type: "onboarding" }, zones)).toMatchObject({ ready: true, summary: expect.stringContaining("1 Oct 2026 – 5 Oct 2026") });
    expect(checkForm({ ...base, type: "onboarding", endDate: "2026-09-30" }, zones)).toMatchObject({ ready: false });
  });
});

describe("sessionBody", () => {
  it("sends only the fields for the type", () => {
    expect(sessionBody({ ...base, type: "departureDay", startTime: "09:00" })).toEqual({ cruise: 7, trainer: 3, type: "departureDay" });
    expect(sessionBody({ ...base, type: "onboarding", endDate: "2026-10-03" })).toEqual({
      cruise: 7,
      trainer: 3,
      type: "onboarding",
      endDate: "2026-10-03T12:00:00.000Z",
    });
    expect(sessionBody({ ...base, type: "online", date: "2026-09-20", startTime: "09:00", durationHours: "2" })).toEqual({
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
