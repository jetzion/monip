import { describe, expect, it } from "vitest";

import {
  estimateFingerprint,
  estimateLines,
  estimateTotal,
  readEstimate,
  readSubmittedLines,
  travelStatus,
  withOverrides,
  type TravelRates,
} from "./estimate";
import { travelData, type Travel } from "./travel";

const trip: Travel = {
  departureCity: "Orlando, Florida",
  departureDate: "2026-12-04",
  returnDate: "2026-12-06",
  airTravel: true,
  departureAirport: "MCO",
  destinationAirport: "MIA",
  returnAirport: "",
  hotel: true,
  hotelCheckIn: "2026-12-04",
  hotelCheckOut: "2026-12-06",
  carRental: true,
  carPickUp: "2026-12-04",
  carReturn: "2026-12-05",
  rideshare: true,
};
const rates: TravelRates = {
  defaults: { flight: 400, hotel: 150, carRental: null, rideshare: 30 },
  ports: { "Miami, Florida": { flight: 250, hotel: null, rideshare: null } },
};
const times = { startsAt: "2026-12-05T11:00:00.000Z", endsAt: "2026-12-05T21:30:00.000Z" };

describe("estimateLines", () => {
  it("uses the port's rate, then the default, else no amount", () => {
    expect(estimateLines(trip, "Miami, Florida", rates)).toEqual([
      { item: "flight", label: "Flight MCO – MIA", detail: "1 return fare × $250.00", amount: 250, source: "Miami, Florida rate" },
      { item: "hotel", label: "Hotel", detail: "2 nights × $150.00", amount: 300, source: "Default rate" },
      { item: "carRental", label: "Car rental", detail: "1 day", amount: null, source: "No price found or rate set: enter an amount" },
      { item: "rideshare", label: "Rideshare", detail: "2 trips × $30.00", amount: 60, source: "Default rate" },
    ]);
  });

  it("prefers prices found online, with their page and note", () => {
    const found = {
      flight: { usd: 157, sourceUrl: "https://www.aa.com/flights", note: "From $157." },
      carRental: { usd: 16.5, sourceUrl: "https://www.kayak.com/cars", note: "Economy." },
    };
    const lines = estimateLines(trip, "Miami, Florida", rates, found);
    expect(lines[0]).toMatchObject({ amount: 157, source: "Found online (aa.com)", url: "https://www.aa.com/flights", note: "From $157." });
    expect(lines[1]).toMatchObject({ amount: 300, source: "Default rate" });
    expect(lines[2]).toMatchObject({ detail: "1 day × $16.50", amount: 16.5, source: "Found online (kayak.com)" });
    expect(readEstimate({ acknowledgedAt: "x", lines })?.lines[0]).toMatchObject({ url: "https://www.aa.com/flights", note: "From $157." });
  });

  it("treats a rate of 0 as not set", () => {
    const zero = { defaults: { flight: 0, hotel: 0, carRental: null, rideshare: 30 }, ports: { "Miami, Florida": { flight: 0, hotel: null, rideshare: null } } };
    const lines = estimateLines(trip, "Miami, Florida", zero);
    expect(lines[0]).toMatchObject({ amount: null, source: "No price found or rate set: enter an amount" });
    expect(lines[1]).toMatchObject({ amount: null });
    expect(lines[3]).toMatchObject({ amount: 60, source: "Default rate" });
  });

  it("has only the parts of the trip that are needed", () => {
    expect(estimateLines({ ...trip, airTravel: false, hotel: false, carRental: false, rideshare: false }, null, rates)).toEqual([]);
  });
});

describe("totals and overrides", () => {
  it("totals only when every line has an amount", () => {
    const lines = estimateLines(trip, "Miami, Florida", rates);
    expect(estimateTotal(lines)).toBeNull();
    const entered = withOverrides(lines, { carRental: 85 });
    expect(entered[2]).toMatchObject({ amount: 85, source: "Entered" });
    expect(estimateTotal(entered)).toBe(695);
    expect(estimateTotal([])).toBe(0);
  });
});

describe("readSubmittedLines", () => {
  it("accepts amounts of zero or more", () => {
    const lines = withOverrides(estimateLines(trip, "Miami, Florida", rates), { carRental: 0 });
    expect(readSubmittedLines(lines)).toHaveLength(4);
    expect(readSubmittedLines([{ ...lines[0], amount: null }])).toEqual({ message: "Every estimate line needs an amount of zero or more." });
    expect(readSubmittedLines("x")).toEqual({ message: "The estimate has no lines." });
  });
});

describe("travelStatus", () => {
  const acknowledged = {
    lines: [],
    total: 0,
    acknowledgedAt: "2026-11-23T10:00:00.000Z",
    acknowledgedFor: estimateFingerprint(trip, "Miami, Florida", times),
  };
  const session = { needsTravel: true, canceled: false, travel: travelData(trip), estimate: acknowledged, port: "Miami, Florida", ...times };

  it("is ok with travel and an estimate made for it", () => {
    expect(travelStatus(session)).toBe("ok");
    expect(readEstimate(acknowledged)).toMatchObject({ total: 0, acknowledgedBy: "" });
  });

  it("asks for travel, or a new estimate when anything it was made for changed", () => {
    expect(travelStatus({ ...session, travel: null, estimate: null })).toBe("travelNeeded");
    expect(travelStatus({ ...session, travel: null, estimate: null, needsTravel: false })).toBe("ok");
    expect(travelStatus({ ...session, estimate: null })).toBe("estimateNeeded");
    expect(travelStatus({ ...session, startsAt: "2026-12-05T12:00:00.000Z" })).toBe("estimateNeeded");
    expect(travelStatus({ ...session, travel: travelData({ ...trip, rideshare: false }) })).toBe("estimateNeeded");
    expect(travelStatus({ ...session, estimate: null, canceled: true })).toBe("ok");
  });
});
