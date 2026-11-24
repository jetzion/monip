import type { EstimateItem, FoundPrices } from "./estimate";
import type { Travel } from "./travel";

const API = "https://api.firecrawl.dev/v2";
/** Caps one lookup's cost (the free plan has 1,000 credits a month). */
const MAX_CREDITS = 100;

/** The agent's answer keys, by estimate item. */
const KEYS: Record<EstimateItem, string> = {
  flight: "flightRoundTrip",
  hotel: "hotelPerNight",
  carRental: "carRentalPerDay",
  rideshare: "rideshareOneWay",
};

const neededItems = (travel: Travel): EstimateItem[] =>
  (
    [
      ["flight", travel.airTravel],
      ["hotel", travel.hotel],
      ["carRental", travel.carRental],
      ["rideshare", travel.rideshare],
    ] as const
  )
    .filter(([, needed]) => needed)
    .map(([item]) => item);

/** What to ask for: only the trip's needed parts, by airport, port, and dates (no names). */
export function pricePrompt(travel: Travel, port: string): string {
  const openJaw = Boolean(travel.returnAirport) && travel.returnAirport !== travel.destinationAirport;
  const route = openJaw
    ? `the multi-city (open-jaw) economy fare: ${travel.departureAirport} to ${travel.destinationAirport} on ${travel.departureDate}, and ${travel.returnAirport} back to ${travel.departureAirport} on ${travel.returnDate}`
    : `the round-trip economy fare from ${travel.departureAirport} to ${travel.destinationAirport}, departing ${travel.departureDate} and returning ${travel.returnDate}`;
  const asks: Record<EstimateItem, string> = {
    flight: `${route} (a fare for these dates if shown, otherwise the typical or "from" fare for this route on an airline route page or fare comparison site such as Google Flights, Kayak, Skyscanner, or Expedia)`,
    hotel: `the typical nightly rate of a mid-range hotel near the ${port} cruise port, from ${travel.hotelCheckIn} to ${travel.hotelCheckOut}`,
    carRental: `the typical daily rate of an economy rental car picked up at ${travel.destinationAirport || `the airport nearest ${port}`}, from ${travel.carPickUp} to ${travel.carReturn}`,
    rideshare: `the typical one-way Uber or Lyft fare from ${travel.destinationAirport || `the airport nearest ${port}`} to the ${port} cruise port`,
  };
  const items = neededItems(travel);
  return [
    "Estimate travel costs in US dollars for one business traveller. Find:",
    ...items.map((item, index) => `${index + 1}. ${asks[item]} (answer key ${KEYS[item]});`),
    "For each, give a number in US dollars (converted if needed), the URL of the page it came from, and a short note on what the price covers. Use null when no price can be found; do not guess.",
  ].join("\n");
}

function schemaFor(items: EstimateItem[]) {
  const price = {
    type: "object",
    properties: { usd: { type: ["number", "null"] }, sourceUrl: { type: "string" }, note: { type: "string" } },
    required: ["usd", "sourceUrl", "note"],
  };
  return { type: "object", properties: Object.fromEntries(items.map((item) => [KEYS[item], price])) };
}

const isWebUrl = (value: unknown): value is string => typeof value === "string" && /^https?:\/\/\S+$/.test(value);

/** The prices in the agent's answer; anything missing, non-positive, or without a web source is left out. */
export function readFoundPrices(data: unknown, items: EstimateItem[]): FoundPrices {
  const answer = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const found: FoundPrices = {};
  for (const item of items) {
    const entry = answer[KEYS[item]] as Record<string, unknown> | undefined;
    if (typeof entry?.usd !== "number" || !(entry.usd > 0) || !isWebUrl(entry.sourceUrl)) continue;
    found[item] = { usd: Math.round(entry.usd * 100) / 100, sourceUrl: entry.sourceUrl, note: String(entry.note ?? "").slice(0, 400) };
  }
  return found;
}

export class PriceLookupError extends Error {}

type Options = { apiKey: string; fetchImpl?: typeof fetch; pollMs?: number; timeoutMs?: number };

/**
 * Looks up the trip's prices with Firecrawl's agent (POST /v2/agent, then
 * polling GET /v2/agent/{id}). Takes about a minute. Server only: the API key
 * must never reach the browser.
 */
export async function lookUpPrices(travel: Travel, port: string, options: Options): Promise<FoundPrices> {
  const { apiKey, fetchImpl = fetch, pollMs = 5000, timeoutMs = 170_000 } = options;
  const items = neededItems(travel);
  if (items.length === 0) return {};
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const call = async (url: string, init: RequestInit) => {
    const response = await fetchImpl(url, init);
    if (!response.ok) throw new PriceLookupError(`Firecrawl answered HTTP ${response.status}.`);
    return (await response.json()) as Record<string, unknown>;
  };

  const started = await call(`${API}/agent`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: pricePrompt(travel, port), schema: schemaFor(items), maxCredits: MAX_CREDITS }),
  });
  if (typeof started.id !== "string") throw new PriceLookupError("Firecrawl did not start the price lookup.");

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    const job = await call(`${API}/agent/${started.id}`, { headers });
    if (job.status === "completed") return readFoundPrices(job.data, items);
    // A run stopped by the credit cap may still hold partial prices.
    if (job.status === "failed") return readFoundPrices(job.partial, items);
  }
  throw new PriceLookupError("The price lookup took too long.");
}
