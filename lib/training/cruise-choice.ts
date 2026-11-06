import type { CruiseOption } from "./form";

/** One cruise line, ship, and start port that has upcoming sailings. */
export type CruiseCombo = { cruiseLine: string; ship: string; port: string };

/** The Cruise line, Ship, and Port dropdowns; "" means not chosen. */
export type CruiseChoice = { cruiseLine: string; ship: string; port: string };

export const noChoice: CruiseChoice = { cruiseLine: "", ship: "", port: "" };

const FIELDS = ["cruiseLine", "ship", "port"] as const satisfies (keyof CruiseChoice)[];

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

/**
 * Options for one dropdown: the values that fit every other choice, so the
 * dropdowns can be filled in any order (for example Port first).
 */
export function optionsFor(combos: CruiseCombo[], choice: CruiseChoice, field: keyof CruiseChoice): string[] {
  const fits = (combo: CruiseCombo) => FIELDS.every((other) => other === field || !choice[other] || combo[other] === choice[other]);
  return unique(combos.filter(fits).map((combo) => combo[field]));
}

/**
 * Applies one dropdown change. Options always fit the other choices, so
 * nothing needs clearing; after a choice, any empty dropdown left with a
 * single option is filled in (a ship sets its cruise line, for example).
 */
export function changeChoice(combos: CruiseCombo[], choice: CruiseChoice, field: keyof CruiseChoice, value: string): CruiseChoice {
  const next = { ...choice, [field]: value };
  if (!value) return next;
  let filled = true;
  while (filled) {
    filled = false;
    for (const other of FIELDS) {
      const options = next[other] ? [] : optionsFor(combos, next, other);
      if (options.length === 1) {
        next[other] = options[0];
        filled = true;
      }
    }
  }
  return next;
}

/** REST URL for a ship's sailings from a port, starting on or after a day. */
export function cruiseDatesUrl(choice: CruiseChoice, fromDay: string): string {
  const params = new URLSearchParams({ limit: "200", depth: "0", sort: "startDate" });
  params.set("where[and][0][ship][equals]", choice.ship);
  params.set("where[and][1][startPort][equals]", choice.port);
  params.set("where[and][2][startDate][greater_than_equal]", `${fromDay}T00:00:00.000Z`);
  for (const field of ["ship", "cruiseLine", "startDate", "endDate", "startPort", "arrival", "departure"]) {
    params.set(`select[${field}]`, "true");
  }
  return `/api/cruise-sailings?${params}`;
}

const day = (iso: string, withYear = true) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(
    new Date(iso),
  );

/** "27 Oct – 1 Nov 2026 · 07:30–17:00": the start's year only when it differs; times only when both are known. */
export function cruiseDatesLabel(cruise: CruiseOption): string {
  const { startDate, endDate } = cruise;
  const dates = endDate ? `${day(startDate, startDate.slice(0, 4) !== endDate.slice(0, 4))} – ${day(endDate)}` : day(startDate);
  return cruise.arrival && cruise.departure ? `${dates} · ${cruise.arrival}–${cruise.departure}` : dates;
}
