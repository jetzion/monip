import { flightRoute, readTravel, type Travel } from "./travel";

export type EstimateItem = "flight" | "hotel" | "carRental" | "rideshare";

/**
 * A line of the travel estimate, in US dollars; amount is null while no price
 * or rate is known. A price found online keeps its page (url) and a note.
 */
export type EstimateLine = {
  item: EstimateItem;
  label: string;
  detail: string;
  amount: number | null;
  source: string;
  url?: string;
  note?: string;
};

/** A price found online (see firecrawl.ts): round trip, per night, per day, or one way. */
export type FoundPrices = Partial<Record<EstimateItem, { usd: number; sourceUrl: string; note: string }>>;

/** Default rates (Training planning costs) and each port's own rates (Port time zones). */
export type TravelRates = {
  defaults: { flight: number | null; hotel: number | null; carRental: number | null; rideshare: number | null };
  ports: Record<string, { flight: number | null; hotel: number | null; rideshare: number | null }>;
};

/** Amounts the user typed over the calculated ones. */
export type EstimateOverrides = Partial<Record<EstimateItem, number | null>>;

export const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/**
 * The estimate's lines for a trip to a port: a return flight, hotel nights,
 * car rental days, and two rideshare trips (to the port and back). Each uses
 * the price found online, else the port's rate, else the default, else has no amount.
 */
export function estimateLines(travel: Travel, port: string | null, rates: TravelRates, found: FoundPrices = {}): EstimateLine[] {
  const own = (port && rates.ports[port]) || null;
  type Choice = { rate: number; source: string; url?: string; note?: string } | null;
  const pick = (item: EstimateItem, portRate: number | null | undefined, fallback: number | null): Choice => {
    const online = found[item];
    if (online) return { rate: online.usd, source: `Found online (${hostOf(online.sourceUrl)})`, url: online.sourceUrl, note: online.note };
    // A rate of 0 counts as not set: a $0 trip is never an estimate.
    if (portRate != null && portRate > 0) return { rate: portRate, source: `${port} rate` };
    return fallback != null && fallback > 0 ? { rate: fallback, source: "Default rate" } : null;
  };
  const line = (item: EstimateItem, label: string, count: number, unit: string, chosen: Choice): EstimateLine => ({
    item,
    label,
    detail: chosen ? `${plural(count, unit)} × ${usd(chosen.rate)}` : plural(count, unit),
    amount: chosen ? Math.round(count * chosen.rate * 100) / 100 : null,
    source: chosen ? chosen.source : "No price found or rate set: enter an amount",
    ...(chosen?.url ? { url: chosen.url, note: chosen.note } : {}),
  });

  const lines: EstimateLine[] = [];
  if (travel.airTravel) {
    const flight = line("flight", "Flight", 1, "return fare", pick("flight", own?.flight, rates.defaults.flight));
    lines.push({ ...flight, label: `Flight ${flightRoute(travel)}` });
  }
  if (travel.hotel) {
    const nights = daysBetween(travel.hotelCheckIn, travel.hotelCheckOut);
    lines.push(line("hotel", "Hotel", nights, "night", pick("hotel", own?.hotel, rates.defaults.hotel)));
  }
  if (travel.carRental) {
    const days = daysBetween(travel.carPickUp, travel.carReturn);
    lines.push(line("carRental", "Car rental", days, "day", pick("carRental", null, rates.defaults.carRental)));
  }
  if (travel.rideshare) lines.push(line("rideshare", "Rideshare", 2, "trip", pick("rideshare", own?.rideshare, rates.defaults.rideshare)));
  return lines;
}

/** The lines with the user's amounts in place of the calculated ones. */
export const withOverrides = (lines: EstimateLine[], overrides: EstimateOverrides): EstimateLine[] =>
  lines.map((line) => (line.item in overrides ? { ...line, amount: overrides[line.item] ?? null, source: "Entered" } : line));

/** The sum of the lines, or null while any line has no amount. */
export const estimateTotal = (lines: EstimateLine[]): number | null =>
  lines.every((line) => line.amount != null) ? lines.reduce((sum, line) => sum + line.amount!, 0) : null;

/** What an estimate was made for; a different trip, port, or session time needs a new estimate. */
export const estimateFingerprint = (travel: Travel, port: string | null, times: { startsAt: string; endsAt: string }) =>
  JSON.stringify({ travel, port, startsAt: times.startsAt, endsAt: times.endsAt });

export type StoredEstimate = {
  lines: EstimateLine[];
  total: number;
  acknowledgedAt: string;
  acknowledgedBy: string;
  acknowledgedFor: string;
};

const ITEMS: EstimateItem[] = ["flight", "hotel", "carRental", "rideshare"];

/** The estimate stored on a session, or null when there is none. */
export function readEstimate(value: unknown): StoredEstimate | null {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  if (typeof input.acknowledgedAt !== "string" || !Array.isArray(input.lines)) return null;
  const lines = (input.lines as Record<string, unknown>[])
    .filter((line) => ITEMS.includes(line.item as EstimateItem) && typeof line.amount === "number")
    .map((line) => ({
      item: line.item as EstimateItem,
      label: String(line.label ?? ""),
      detail: String(line.detail ?? ""),
      amount: line.amount as number,
      source: String(line.source ?? ""),
      ...(typeof line.url === "string" && /^https?:\/\//.test(line.url) ? { url: line.url, note: String(line.note ?? "") } : {}),
    }));
  return {
    lines,
    total: typeof input.total === "number" ? input.total : (estimateTotal(lines) ?? 0),
    acknowledgedAt: input.acknowledgedAt,
    acknowledgedBy: String(input.acknowledgedBy ?? ""),
    acknowledgedFor: String(input.acknowledgedFor ?? ""),
  };
}

/** Lines submitted with a session, or a reason they cannot be stored. */
export function readSubmittedLines(value: unknown): EstimateLine[] | { message: string } {
  if (!Array.isArray(value)) return { message: "The estimate has no lines." };
  const lines = readEstimate({ acknowledgedAt: "", lines: value })?.lines ?? [];
  if (lines.length !== value.length || lines.some((line) => (line.amount ?? -1) < 0)) {
    return { message: "Every estimate line needs an amount of zero or more." };
  }
  return lines;
}

export type TravelStatus = "ok" | "travelNeeded" | "estimateNeeded";

/**
 * Whether a session still needs travel details or a (new) estimate: in-person
 * training away from home base needs both; canceled sessions need nothing.
 */
export function travelStatus(session: {
  needsTravel: boolean;
  canceled: boolean;
  travel: unknown;
  estimate: unknown;
  port: string | null;
  startsAt: string;
  endsAt: string;
}): TravelStatus {
  if (session.canceled) return "ok";
  const travel = readTravel(session.travel);
  if (!travel) return session.needsTravel ? "travelNeeded" : "ok";
  const estimate = readEstimate(session.estimate);
  return estimate?.acknowledgedFor === estimateFingerprint(travel, session.port, session) ? "ok" : "estimateNeeded";
}

export const TRAVEL_STATUS_TEXT: Record<Exclude<TravelStatus, "ok">, string> = {
  travelNeeded: "Travel details needed: the trainer is away from home base. Add the trip below and estimate its cost.",
  estimateNeeded: "Estimate needed: the trip, port, or times changed since the travel cost was acknowledged, or it never was.",
};

/** No estimate: stored for sessions without travel. */
export const NO_ESTIMATE = { lines: [], total: null, acknowledgedAt: null, acknowledgedBy: null, acknowledgedFor: null };
