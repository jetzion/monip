import { describe, expect, it } from "vitest";

import { blockedRange, needsTravel, readTravel, trainingDays, travelData, travelDefaults, travelError, travelSummary, type Travel } from "./travel";

// Departure day in Miami, 5 Dec 2026, 06:00 to 16:30 local time.
const departureDay = { startsAt: "2026-12-05T11:00:00.000Z", endsAt: "2026-12-05T21:30:00.000Z", timeZone: "America/New_York" };
// Onboarding in Barcelona, 5 to 12 Dec 2026 (ends at midnight after its last day).
const onboarding = { startsAt: "2026-12-04T23:00:00.000Z", endsAt: "2026-12-12T23:00:00.000Z", timeZone: "Europe/Madrid" };

const trip = (changes: Partial<Travel> = {}): Travel => ({ ...travelDefaults("departureDay", trainingDays(departureDay), "Orlando, Florida"), ...changes });

describe("needsTravel", () => {
  it("is needed for in-person training away from home base", () => {
    expect(needsTravel("departureDay", "Orlando, Florida", "Miami, Florida")).toBe(true);
    expect(needsTravel("onboarding", null, "Miami, Florida")).toBe(true);
    expect(needsTravel("departureDay", "Miami, Florida", "Miami, Florida")).toBe(false);
    expect(needsTravel("online", "Orlando, Florida", "Miami, Florida")).toBe(false);
    // Onboarding on a cruise ending at another port needs travel home.
    expect(needsTravel("onboarding", "Miami, Florida", "Miami, Florida", "Barcelona, Spain")).toBe(true);
    expect(needsTravel("onboarding", "Miami, Florida", "Miami, Florida", "Miami, Florida")).toBe(false);
    expect(needsTravel("departureDay", "Miami, Florida", "Miami, Florida", "Barcelona, Spain")).toBe(false);
  });
});

describe("travelDefaults", () => {
  it("leaves the day before departure-day training and returns the same day", () => {
    expect(trip()).toMatchObject({ departureCity: "Orlando, Florida", departureDate: "2026-12-04", returnDate: "2026-12-05", hotelCheckIn: "2026-12-04" });
  });

  it("covers the cruise for onboarding", () => {
    expect(travelDefaults("onboarding", trainingDays(onboarding), null)).toMatchObject({
      departureCity: "",
      departureDate: "2026-12-05",
      returnDate: "2026-12-12",
    });
  });
});

describe("travelError", () => {
  const days = trainingDays(departureDay);

  it("accepts the defaults", () => {
    expect(travelError(trip(), days)).toBeNull();
  });

  it("requires the city and dates, and travel around the training", () => {
    expect(travelError(trip({ departureCity: " " }), days)?.message).toBe("Enter the departure city.");
    expect(travelError(trip({ departureDate: "2026-12-06" }), days)?.message).toBe(
      "The departure date must be on or before the training starts (5 Dec 2026).",
    );
    expect(travelError(trip({ returnDate: "2026-12-04" }), days)?.path).toBe("travel.returnDate");
  });

  it("requires airports for air travel", () => {
    expect(travelError(trip({ airTravel: true, departureAirport: "MCO" }), days)?.message).toBe("Enter the destination airport.");
    expect(travelError(trip({ airTravel: true, departureAirport: "MCO", destinationAirport: "MIA" }), days)).toBeNull();
  });

  it("keeps hotel and car dates within the trip and in order", () => {
    expect(travelError(trip({ hotel: true }), days)).toBeNull();
    expect(travelError(trip({ hotel: true, hotelCheckIn: "2026-12-03" }), days)?.message).toBe("The hotel dates must be within the trip.");
    expect(travelError(trip({ hotel: true, hotelCheckOut: "2026-12-04" }), days)?.message).toBe("The hotel check-out must be after check-in.");
    expect(travelError(trip({ carRental: true, carReturn: "2026-12-04" }), days)?.message).toBe("The car rental return must be after pick-up.");
  });
});

describe("blockedRange", () => {
  it("is the session alone without travel", () => {
    expect(blockedRange(departureDay, null)).toEqual({ blockedFrom: departureDay.startsAt, blockedTo: departureDay.endsAt });
  });

  it("widens to whole travel days in the session's time zone", () => {
    expect(blockedRange(departureDay, trip())).toEqual({ blockedFrom: "2026-12-04T05:00:00.000Z", blockedTo: "2026-12-06T05:00:00.000Z" });
  });
});

describe("readTravel and travelData", () => {
  it("round-trips, clearing details that are not used", () => {
    const stored = travelData(trip({ airTravel: true, departureAirport: "MCO", destinationAirport: "MIA", carRental: false }));
    expect(stored).toMatchObject({ departureDate: "2026-12-04T12:00:00.000Z", carPickUp: null, hotelCheckIn: null });
    expect(readTravel(stored)).toMatchObject({ departureDate: "2026-12-04", departureAirport: "MCO", carPickUp: "" });
  });

  it("is null when nothing was entered", () => {
    expect(readTravel({ departureCity: null, departureDate: null, airTravel: false })).toBeNull();
    expect(readTravel(undefined)).toBeNull();
  });
});

describe("travelSummary", () => {
  it("names the airport flown home from when it differs", () => {
    expect(travelSummary(trip({ airTravel: true, departureAirport: "MCO", destinationAirport: "MIA", returnAirport: "BCN" }))[1]).toBe(
      "Flight MCO – MIA, return from BCN",
    );
  });

  it("lists the parts of the trip that are needed", () => {
    expect(travelSummary(trip())).toEqual(["From Orlando, Florida, 4 Dec 2026 – 5 Dec 2026"]);
    expect(travelSummary(trip({ airTravel: true, departureAirport: "MCO", destinationAirport: "MIA", hotel: true, rideshare: true }))).toEqual([
      "From Orlando, Florida, 4 Dec 2026 – 5 Dec 2026",
      "Flight MCO – MIA",
      "Hotel 4 Dec 2026 – 5 Dec 2026",
      "Rideshare to the port and back",
    ]);
  });
});
