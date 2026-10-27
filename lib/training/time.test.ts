import { describe, expect, it } from "vitest";

import { addDays, dayOf, isTime, isTimeZone, zonedTime } from "./time";

describe("isTime", () => {
  it("accepts 24-hour HH:MM", () => {
    expect(["00:00", "07:30", "23:59"].every(isTime)).toBe(true);
    expect(["24:00", "7:30", "07:60", "", null].some(isTime)).toBe(false);
  });
});

describe("isTimeZone", () => {
  it("accepts IANA names and aliases, rejects others", () => {
    expect(isTimeZone("America/New_York")).toBe(true);
    expect(isTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isTimeZone("Mars/Base")).toBe(false);
    expect(isTimeZone("")).toBe(false);
  });
});

describe("days", () => {
  it("reads the day of a day-only date and adds days across months", () => {
    expect(dayOf("2026-10-27T12:00:00.000Z")).toBe("2026-10-27");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("zonedTime", () => {
  it("converts wall-clock time to UTC", () => {
    expect(zonedTime("2026-07-01", "09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedTime("2026-12-01", "09:00", "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
    expect(zonedTime("2026-07-01", "09:00", "Asia/Tokyo").toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(zonedTime("2026-07-01", "00:00", "Europe/Rome").toISOString()).toBe("2026-06-30T22:00:00.000Z");
  });

  it("handles daylight-saving changes", () => {
    // New York springs forward 2026-03-08 02:00 -> 03:00 and falls back 2026-11-01.
    expect(zonedTime("2026-03-08", "01:30", "America/New_York").toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(zonedTime("2026-03-08", "03:30", "America/New_York").toISOString()).toBe("2026-03-08T07:30:00.000Z");
    expect(zonedTime("2026-03-08", "02:30", "America/New_York").toISOString()).toBe("2026-03-08T07:30:00.000Z");
    expect(zonedTime("2026-11-01", "01:30", "America/New_York").toISOString()).toBe("2026-11-01T05:30:00.000Z");
    expect(zonedTime("2026-11-01", "12:00", "America/New_York").toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });
});
