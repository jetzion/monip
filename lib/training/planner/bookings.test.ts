import { describe, expect, it } from "vitest";

import { book, booking, type Bookings, clash, daysByMonth, trainingDays, travelClash, travelGap, withinMonthlyLimit } from "./bookings";

const trainer = { id: 1, name: "Anna", homeBase: null, canJoinCruises: true, maxDaysPerMonth: 2 };

describe("trainingDays", () => {
  it("counts the local day of a timed session", () => {
    // 23:00-01:00 UTC is 18:00-20:00 in New York on the 2nd.
    expect(trainingDays("2026-12-02T23:00:00.000Z", "2026-12-03T01:00:00.000Z", "America/New_York")).toEqual(["2026-12-02"]);
  });

  it("lists every day of onboarding, which ends at midnight after its last day", () => {
    expect(trainingDays("2026-12-30T05:00:00.000Z", "2027-01-02T05:00:00.000Z", "America/New_York")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
    ]);
  });
});

describe("clash", () => {
  const bookings: Bookings = new Map([[1, [booking("a", "2026-12-02T10:00:00Z", "2026-12-02T12:00:00Z", "UTC")]]]);

  it("finds an overlap", () => {
    expect(clash(bookings, 1, Date.parse("2026-12-02T11:00:00Z"), Date.parse("2026-12-02T13:00:00Z"))?.key).toBe("a");
  });

  it("allows back-to-back sessions and other trainers", () => {
    expect(clash(bookings, 1, Date.parse("2026-12-02T12:00:00Z"), Date.parse("2026-12-02T14:00:00Z"))).toBeUndefined();
    expect(clash(bookings, 2, Date.parse("2026-12-02T11:00:00Z"), Date.parse("2026-12-02T13:00:00Z"))).toBeUndefined();
  });
});

describe("withinMonthlyLimit", () => {
  it("counts distinct days per month against the trainer's limit", () => {
    const bookings: Bookings = new Map();
    book(bookings, 1, booking("a", "2026-12-02T10:00:00Z", "2026-12-02T12:00:00Z", "UTC"));
    book(bookings, 1, booking("b", "2026-12-02T14:00:00Z", "2026-12-02T16:00:00Z", "UTC"));
    expect(daysByMonth(bookings, 1).get("2026-12")).toBe(1);
    expect(withinMonthlyLimit(bookings, trainer, ["2026-12-02"])).toBe(true);
    expect(withinMonthlyLimit(bookings, trainer, ["2026-12-05"])).toBe(true);
    expect(withinMonthlyLimit(bookings, trainer, ["2026-12-05", "2026-12-06"])).toBe(false);
    expect(withinMonthlyLimit(bookings, trainer, ["2027-01-05", "2027-01-06"])).toBe(true);
  });

  it("has no limit when none is set", () => {
    expect(withinMonthlyLimit(new Map(), { ...trainer, maxDaysPerMonth: null }, ["2026-12-01", "2026-12-02", "2026-12-03"])).toBe(true);
  });
});

describe("travel between ports", () => {
  const miami = { port: "Miami, Florida", zone: "America/New_York" };
  const canaveral = { port: "Port Canaveral, Florida", zone: "America/New_York" };
  const barcelona = { port: "Barcelona, Spain", zone: "Europe/Madrid" };
  const at = (where: typeof miami) => ({ startPort: where.port, endPort: where.port, startZone: where.zone, endZone: where.zone });

  it("needs no gap at the same port, overnight within a zone, and a travel day between zones", () => {
    expect(travelGap(miami, miami)).toBe(0);
    expect(travelGap(miami, canaveral)).toBe(12 * 3_600_000);
    expect(travelGap(miami, barcelona)).toBe(36 * 3_600_000);
    expect(travelGap(miami, { port: "Unknown", zone: null })).toBe(36 * 3_600_000);
  });

  it("finds in-person sessions too close before or after, and ignores online ones", () => {
    const bookings: Bookings = new Map();
    // Miami departure day ends 21:30 UTC on the 5th.
    book(bookings, 1, booking("miami", "2026-12-05T11:00:00Z", "2026-12-05T21:30:00Z", "America/New_York", at(miami)));
    book(bookings, 1, booking("online", "2026-12-07T09:00:00Z", "2026-12-07T11:00:00Z", "UTC"));
    const nextMorning = [Date.parse("2026-12-06T07:00:00Z"), Date.parse("2026-12-06T17:00:00Z")] as const;
    expect(travelClash(bookings, 1, ...nextMorning, at(barcelona))?.key).toBe("miami");
    expect(travelClash(bookings, 1, Date.parse("2026-12-06T13:00:00Z"), Date.parse("2026-12-06T21:00:00Z"), at(canaveral))).toBeUndefined();
    expect(travelClash(bookings, 1, Date.parse("2026-12-04T13:00:00Z"), Date.parse("2026-12-04T21:00:00Z"), at(barcelona))?.key).toBe("miami");
    expect(travelClash(bookings, 1, Date.parse("2026-12-07T12:00:00Z"), Date.parse("2026-12-07T20:00:00Z"), at(barcelona))).toBeUndefined();
  });
});
