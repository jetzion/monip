import { describe, expect, it, vi } from "vitest";

import { lookUpPrices, PriceLookupError, pricePrompt, readFoundPrices } from "./firecrawl";
import type { Travel } from "./travel";

const trip: Travel = {
  departureCity: "Orlando, Florida",
  departureDate: "2026-12-04",
  returnDate: "2026-12-05",
  airTravel: true,
  departureAirport: "MCO",
  destinationAirport: "MIA",
  returnAirport: "",
  hotel: true,
  hotelCheckIn: "2026-12-04",
  hotelCheckOut: "2026-12-05",
  carRental: false,
  carPickUp: "",
  carReturn: "",
  rideshare: true,
};
const PORT = "Miami, Florida";
const answer = {
  flightRoundTrip: { usd: 157, sourceUrl: "https://www.aa.com/en-us/flights-from-orlando-to-miami", note: "From $157 round trip." },
  hotelPerNight: { usd: 135.499, sourceUrl: "https://www.hotelplanner.com/x", note: "Average 3-star." },
  rideshareOneWay: { usd: 28, sourceUrl: "https://www.uber.com/route", note: "Typical fare." },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("pricePrompt", () => {
  it("asks only for the needed parts, by airport, port, and dates", () => {
    const prompt = pricePrompt(trip, PORT);
    expect(prompt).toContain("round-trip economy fare from MCO to MIA, departing 2026-12-04 and returning 2026-12-05");
    expect(prompt).toContain("near the Miami, Florida cruise port");
    expect(prompt).toContain("rideshareOneWay");
    expect(prompt).not.toContain("carRentalPerDay");
    expect(prompt).toContain("Do not pick the lowest price");
  });
});

describe("open-jaw flights", () => {
  it("asks for a multi-city fare when flying home from another airport", () => {
    const prompt = pricePrompt({ ...trip, returnAirport: "BCN" }, PORT);
    expect(prompt).toContain("multi-city (open-jaw) economy fare: MCO to MIA on 2026-12-04, and BCN back to MCO on 2026-12-05");
    expect(pricePrompt({ ...trip, returnAirport: "MIA" }, PORT)).toContain("round-trip economy fare from MCO to MIA");
  });
});

describe("readFoundPrices", () => {
  it("keeps positive prices with a web source, rounded to cents", () => {
    expect(readFoundPrices(answer, ["flight", "hotel", "rideshare"])).toEqual({
      flight: { usd: 157, sourceUrl: answer.flightRoundTrip.sourceUrl, note: "From $157 round trip." },
      hotel: { usd: 135.5, sourceUrl: answer.hotelPerNight.sourceUrl, note: "Average 3-star." },
      rideshare: { usd: 28, sourceUrl: answer.rideshareOneWay.sourceUrl, note: "Typical fare." },
    });
  });

  it("leaves out missing, zero, and unsourced prices", () => {
    const poor = { flightRoundTrip: { usd: null, sourceUrl: "https://a.b" }, hotelPerNight: { usd: 0, sourceUrl: "https://a.b" }, rideshareOneWay: { usd: 30, sourceUrl: "javascript:x" } };
    expect(readFoundPrices(poor, ["flight", "hotel", "rideshare"])).toEqual({});
    expect(readFoundPrices(null, ["flight"])).toEqual({});
  });
});

describe("lookUpPrices", () => {
  it("starts the agent, polls until it completes, and reads the prices", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ success: true, id: "job-1" }))
      .mockResolvedValueOnce(json({ status: "processing" }))
      .mockResolvedValueOnce(json({ status: "completed", data: answer }));
    const found = await lookUpPrices(trip, PORT, { apiKey: "fc-test", fetchImpl, pollMs: 1 });
    expect(found.flight?.usd).toBe(157);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.firecrawl.dev/v2/agent");
    expect(JSON.parse(String(init?.body))).toMatchObject({ maxCredits: 100 });
    expect(fetchImpl.mock.calls[2][0]).toBe("https://api.firecrawl.dev/v2/agent/job-1");
  });

  it("uses partial prices from a run stopped by the credit cap", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ id: "job-2" }))
      .mockResolvedValueOnce(json({ status: "failed", stopReason: "credit_limit_reached", partial: { flightRoundTrip: answer.flightRoundTrip } }));
    expect(await lookUpPrices(trip, PORT, { apiKey: "fc-test", fetchImpl, pollMs: 1 })).toEqual({
      flight: { usd: 157, sourceUrl: answer.flightRoundTrip.sourceUrl, note: "From $157 round trip." },
    });
  });

  it("fails on errors and slow runs, and skips trips with nothing to price", async () => {
    const refused = vi.fn<typeof fetch>().mockImplementation(async () => json({ error: "Unauthorized" }, 401));
    await expect(lookUpPrices(trip, PORT, { apiKey: "bad", fetchImpl: refused })).rejects.toThrow(PriceLookupError);
    const slow = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ id: "job-3" })).mockImplementation(async () => json({ status: "processing" }));
    await expect(lookUpPrices(trip, PORT, { apiKey: "fc-test", fetchImpl: slow, pollMs: 1, timeoutMs: 20 })).rejects.toThrow("took too long");
    const none = vi.fn<typeof fetch>();
    const bare = { ...trip, airTravel: false, hotel: false, rideshare: false };
    expect(await lookUpPrices(bare, PORT, { apiKey: "fc-test", fetchImpl: none })).toEqual({});
    expect(none).not.toHaveBeenCalled();
  });
});
