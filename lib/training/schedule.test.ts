import { describe, expect, it } from "vitest";

import { describeSession, sessionTimes, type CruiseTimes } from "./schedule";

const cruise: CruiseTimes = {
  startDate: "2026-07-04T12:00:00.000Z",
  endDate: "2026-07-11T12:00:00.000Z",
  startPort: "Miami, Florida",
  arrival: "06:00",
  departure: "16:30",
};
const NY = "America/New_York";

describe("online", () => {
  const input = { type: "online" as const, date: "2026-07-01T12:00:00.000Z", startTime: "09:00", timeZone: "Europe/Rome", durationHours: "4" };

  it("uses the admin's date, time, zone, and duration", () => {
    expect(sessionTimes(input, cruise, NY)).toEqual({
      date: "2026-07-01T12:00:00.000Z",
      endDate: null,
      startsAt: "2026-07-01T07:00:00.000Z",
      endsAt: "2026-07-01T11:00:00.000Z",
      timeZone: "Europe/Rome",
    });
  });

  it("requires each field", () => {
    expect(sessionTimes({ ...input, date: null }, cruise, NY)).toMatchObject({ path: "date" });
    expect(sessionTimes({ ...input, startTime: "9am" }, cruise, NY)).toMatchObject({ path: "startTime" });
    expect(sessionTimes({ ...input, timeZone: "" }, cruise, NY)).toMatchObject({ path: "timeZone" });
    expect(sessionTimes({ ...input, durationHours: "3" }, cruise, NY)).toMatchObject({ path: "durationHours" });
  });
});

describe("departure day", () => {
  it("runs from arrival to departure on the start date in the port's zone", () => {
    expect(sessionTimes({ type: "departureDay" }, cruise, NY)).toEqual({
      date: "2026-07-04T12:00:00.000Z",
      endDate: null,
      startsAt: "2026-07-04T10:00:00.000Z",
      endsAt: "2026-07-04T20:30:00.000Z",
      timeZone: NY,
    });
  });

  it("is unavailable without both times, a port zone, or a later departure", () => {
    expect(sessionTimes({ type: "departureDay" }, { ...cruise, arrival: "" }, NY)).toMatchObject({
      path: "cruise",
      message: expect.stringContaining("no arrival and departure times"),
    });
    expect(sessionTimes({ type: "departureDay" }, cruise, null)).toMatchObject({
      path: "cruise",
      message: expect.stringContaining('"Miami, Florida"'),
    });
    expect(sessionTimes({ type: "departureDay" }, { ...cruise, departure: "05:00" }, NY)).toMatchObject({ path: "cruise" });
  });
});

describe("onboarding", () => {
  it("blocks whole days from the start date to the cruise's end date by default", () => {
    expect(sessionTimes({ type: "onboarding" }, cruise, NY)).toEqual({
      date: "2026-07-04T12:00:00.000Z",
      endDate: "2026-07-11T12:00:00.000Z",
      startsAt: "2026-07-04T04:00:00.000Z",
      endsAt: "2026-07-12T04:00:00.000Z",
      timeZone: NY,
    });
  });

  it("accepts an override on or after the start date", () => {
    expect(sessionTimes({ type: "onboarding", endDate: "2026-07-04T12:00:00.000Z" }, cruise, NY)).toMatchObject({
      endsAt: "2026-07-05T04:00:00.000Z",
    });
    expect(sessionTimes({ type: "onboarding", endDate: "2026-07-03T12:00:00.000Z" }, cruise, NY)).toMatchObject({ path: "endDate" });
  });

  it("needs an end date and a port zone", () => {
    expect(sessionTimes({ type: "onboarding" }, { ...cruise, endDate: null }, NY)).toMatchObject({ path: "endDate" });
    expect(sessionTimes({ type: "onboarding" }, cruise, null)).toMatchObject({ path: "cruise" });
  });
});

describe("describeSession", () => {
  it("names the type and the range in the session's zone", () => {
    expect(
      describeSession({ type: "online", startsAt: "2026-07-01T13:00:00.000Z", endsAt: "2026-07-01T17:00:00.000Z", timeZone: NY }),
    ).toBe("Online training, 1 Jul 2026, 09:00 – 13:00 (America/New_York)");
    expect(
      describeSession({ type: "onboarding", startsAt: "2026-07-04T04:00:00.000Z", endsAt: "2026-07-12T04:00:00.000Z", timeZone: NY }),
    ).toBe("Onboarding training, 4 Jul 2026 – 11 Jul 2026 (America/New_York)");
  });
});
